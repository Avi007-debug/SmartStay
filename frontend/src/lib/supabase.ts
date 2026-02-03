// Supabase Client Configuration
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey,
    },
  },
})

// ============================================
// AUTHENTICATION SERVICE
// ============================================
export const authService = {
  // Sign up new user
  async signUp(email: string, password: string, fullName: string, role: 'user' | 'owner', phone?: string) {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
          phone: phone || null,
        },
      },
    })

    if (authError) throw authError

    // Profile will be auto-created by handle_new_user trigger
    return authData
  },

  // Sign in
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    return data
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // Get current user with profile
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return null

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    return { ...user, profile }
  },
}

// ============================================
// PG LISTINGS SERVICE
// ============================================
export const pgService = {
  // Get all PG listings with filters
  async getAll(filters?: {
    city?: string
    minRent?: number
    maxRent?: number
    gender?: string
    amenities?: string[]
    verified?: boolean
    available?: boolean
    maxDistance?: number
    minCleanlinessRating?: number
    strictnessLevel?: string
    status?: string
  }) {
    let query = supabase.from('pg_listings').select(`
      *,
      owner:profiles!owner_id(full_name, phone, is_verified)
    `)
    
    // Filter by status - defaults to showing active only for search, but allows showing all for owner dashboard
    if (filters?.status) {
      query = query.eq('status', filters.status)
    } else if (filters?.status !== null) {
      // Default behavior: show active listings only when status filter is not explicitly set to null
      query = query.eq('status', 'active')
    }

    if (filters?.city) {
      query = query.ilike('address->>city', `%${filters.city}%`)
    }
    if (filters?.minRent) {
      query = query.gte('rent', filters.minRent)
    }
    if (filters?.maxRent) {
      query = query.lte('rent', filters.maxRent)
    }
    if (filters?.gender) {
      query = query.eq('gender', filters.gender)
    }
    if (filters?.verified) {
      query = query.eq('is_verified', true)
    }
    if (filters?.available) {
      query = query.eq('is_available', true).gt('available_beds', 0)
    }
    if (filters?.maxDistance) {
      query = query.lte('distance_from_college', filters.maxDistance)
    }
    
    // Filter by amenities - check if all selected amenities are present
    if (filters?.amenities && filters.amenities.length > 0) {
      query = query.contains('amenities', filters.amenities)
    }
    
    // Filter by cleanliness rating
    if (filters?.minCleanlinessRating) {
      query = query.gte('cleanliness_level', Math.ceil(filters.minCleanlinessRating))
    }
    
    // Filter by strictness level
    if (filters?.strictnessLevel) {
      query = query.gte('strictness_level', 
        filters.strictnessLevel === 'relaxed' ? 1 : 
        filters.strictnessLevel === 'moderate' ? 3 : 
        filters.strictnessLevel === 'strict' ? 4 : 1
      )
    }

    const { data, error } = await query

    if (error) throw error
    return data
  },

  // Get single PG by ID
  async getById(id: string) {
    const { data, error } = await supabase
      .from('pg_listings')
      .select(`
        *,
        owner:profiles!owner_id(full_name, phone, is_verified)
      `)
      .eq('id', id)
      .single()

    if (error) throw error

    // Increment view count
    await supabase.rpc('increment_views', { pg_id: id })

    return data
  },

  // Create new listing (owner only)
  async create(listing: any) {
    const { data: { user } } = await supabase.auth.getUser()
    
    const { data, error } = await supabase
      .from('pg_listings')
      .insert({
        ...listing,
        owner_id: user?.id,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update listing
  async update(id: string, updates: any) {
    const { data, error } = await supabase
      .from('pg_listings')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Toggle availability
  async toggleAvailability(id: string, availableBeds: number) {
    const { data, error } = await supabase
      .from('pg_listings')
      .update({
        available_beds: availableBeds,
        is_available: availableBeds > 0,
        last_availability_update: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },
}

// ============================================
// SAVED PGs SERVICE
// ============================================
export const savedPGsService = {
  // Get user's saved PGs
  async getAll() {
    const { data, error } = await supabase
      .from('saved_pgs')
      .select(`
        *,
        pg_listing:pg_listings(*)
      `)
    // RLS policy already filters by auth.uid(), no need to manually filter user_id

    if (error) throw error
    return data
  },

  // Save a PG
  async save(pgId: string) {
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('saved_pgs')
      .insert({
        user_id: user?.id,
        pg_id: pgId,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Unsave a PG
  async unsave(pgId: string) {
    const { error } = await supabase
      .from('saved_pgs')
      .delete()
      .eq('pg_id', pgId)
    // RLS policy already filters by auth.uid()

    if (error) throw error
  },

  // Check if PG is saved
  async isSaved(pgId: string) {
    const { data, error } = await supabase
      .from('saved_pgs')
      .select('*')
      .eq('pg_id', pgId)
      .maybeSingle()
    // RLS policy already filters by auth.uid()

    return !error && !!data
  },
}

// ============================================
// REVIEWS SERVICE
// ============================================
export const reviewsService = {
  // Get reviews for a PG
  async getByPGId(pgId: string) {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        user:profiles!user_id(full_name)
      `)
      .eq('pg_id', pgId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  // Create review
  async create(pgId: string, review: {
    rating: number
    title?: string
    review_text: string
    cleanliness_rating?: number
    food_rating?: number
    is_anonymous?: boolean
  }) {
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('reviews')
      .insert({
        pg_id: pgId,
        user_id: user?.id,
        ...review,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Vote on review
  async vote(reviewId: string, voteType: 'up' | 'down') {
    const { data: { user } } = await supabase.auth.getUser()

    // Check if already voted - RLS will filter by user_id automatically
    const { data: existingVote } = await supabase
      .from('review_votes')
      .select('*')
      .eq('review_id', reviewId)
      .maybeSingle()
    // No need to filter by user_id - RLS handles it

    if (existingVote) {
      // Update vote
      await supabase
        .from('review_votes')
        .update({ vote_type: voteType })
        .eq('review_id', reviewId)
      // RLS ensures only user's own vote is updated
    } else {
      // Insert new vote
      await supabase
        .from('review_votes')
        .insert({
          review_id: reviewId,
          user_id: user?.id,
          vote_type: voteType,
        })
    }

    // Update vote counts
    await supabase.rpc('update_review_votes', { review_id: reviewId })
  },

  // Update review
  async update(reviewId: string, review: {
    rating?: number
    title?: string
    review_text?: string
    cleanliness_rating?: number
    food_rating?: number
  }) {
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('reviews')
      .update({
        ...review,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reviewId)
      .eq('user_id', user?.id) // Only allow updating own reviews
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete review
  async delete(reviewId: string) {
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId)
      .eq('user_id', user?.id) // Only allow deleting own reviews

    if (error) throw error
  },
}

// ============================================
// Q&A SERVICE
// ============================================
export const qnaService = {
  // Get Q&A for a PG listing
  async getByPGId(pgId: string) {
    const { data, error } = await supabase
      .from('qna')
      .select(`
        *,
        user:profiles!qna_user_id_fkey (
          full_name,
          profile_picture
        ),
        answerer:profiles!qna_answered_by_fkey (
          full_name,
          profile_picture
        )
      `)
      .eq('pg_id', pgId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  // Ask a question
  async askQuestion(pgId: string, question: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('qna')
      .insert({
        pg_id: pgId,
        user_id: user.id,
        question: question.trim(),
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Answer a question (property owners only)
  async answerQuestion(questionId: string, answer: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('qna')
      .update({
        answer: answer.trim(),
        answered_by: user.id,
        answered_at: new Date().toISOString(),
      })
      .eq('id', questionId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete a question (user's own unanswered questions only)
  async deleteQuestion(questionId: string) {
    const { error } = await supabase
      .from('qna')
      .delete()
      .eq('id', questionId)

    if (error) throw error
  },

  // Get all Q&As for owner's listings
  async getOwnerQnAs(ownerId: string) {
    const { data, error } = await supabase
      .from('qna')
      .select(`
        *,
        pg_listing:pg_listings!qna_pg_id_fkey (
          id,
          name,
          owner_id
        ),
        user:profiles!qna_user_id_fkey (
          full_name,
          profile_picture
        ),
        answerer:profiles!qna_answered_by_fkey (
          full_name,
          profile_picture
        )
      `)
      .eq('pg_listing.owner_id', ownerId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },
}

// ============================================
// CHAT SERVICE
// ============================================
export const chatService = {
  // Get user's chats
  async getAll() {
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('chats')
      .select(`
        *,
        pg_listings:pg_listings(name, id),
        profiles:profiles!owner_id(full_name)
      `)
      .or(`user_id.eq.${user?.id},owner_id.eq.${user?.id}`)
      .order('last_message_at', { ascending: false })

    if (error) throw error
    return data
  },

  // Create or get existing chat
  async createOrGet(pgId: string, ownerId: string, isAnonymous = true) {
    const { data: { user } } = await supabase.auth.getUser()

    // Check if chat already exists
    const { data: existingChat } = await supabase
      .from('chats')
      .select('*')
      .eq('pg_id', pgId)
      .eq('user_id', user?.id)
      .eq('owner_id', ownerId)
      .maybeSingle()

    if (existingChat) return existingChat

    // Create new chat
    const { data, error } = await supabase
      .from('chats')
      .insert({
        pg_id: pgId,
        user_id: user?.id,
        owner_id: ownerId,
        is_anonymous: isAnonymous,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Get messages for a chat
  async getMessages(chatId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!sender_id(full_name)
      `)
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data
  },

  // Send message
  async sendMessage(chatId: string, messageText: string) {
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        sender_id: user?.id,
        message_text: messageText,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Subscribe to new messages
  subscribeToMessages(chatId: string, callback: (message: any) => void) {
    return supabase
      .channel(`messages-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => callback(payload.new)
      )
      .subscribe()
  },
}

// ============================================
// NOTIFICATIONS SERVICE
// ============================================
export const notificationsService = {
  // Get user's notifications
  async getAll() {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
    // RLS policy already filters by auth.uid()

    if (error) throw error
    return data
  },

  // Mark as read
  async markAsRead(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId)

    if (error) throw error
  },

  // Subscribe to new notifications
  async subscribeToNotifications(callback: (notification: any) => void) {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    return supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => callback(payload.new)
      )
      .subscribe()
  },
}

// ============================================
// VACANCY ALERTS SERVICE
// ============================================
export const vacancyAlertsService = {
  // Toggle alert for a PG
  async toggle(pgId: string, enabled: boolean) {
    const { data: { user } } = await supabase.auth.getUser()

    if (enabled) {
      const { data, error } = await supabase
        .from('vacancy_alerts')
        .upsert({
          user_id: user?.id,
          pg_id: pgId,
          is_enabled: true,
        })
        .select()
        .single()

      if (error) throw error
      return data
    } else {
      const { error } = await supabase
        .from('vacancy_alerts')
        .delete()
        .eq('user_id', user?.id)
        .eq('pg_id', pgId)

      if (error) throw error
    }
  },

  // Check if alert is enabled
  async isEnabled(pgId: string) {
    const { data: { user } } = await supabase.auth.getUser()

    const { data } = await supabase
      .from('vacancy_alerts')
      .select('*')
      .eq('user_id', user?.id)
      .eq('pg_id', pgId)
      .eq('is_enabled', true)
      .single()

    return !!data
  },
}

// ============================================
// PRICE DROP ALERTS SERVICE
// ============================================
export const priceDropAlertsService = {
  // Create or update price drop alert
  async create(pgId: string, targetPrice: number) {
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('price_drop_alerts')
      .upsert({
        user_id: user?.id,
        pg_id: pgId,
        target_price: targetPrice,
        is_enabled: true,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Get all user's price drop alerts
  async getAll() {
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('price_drop_alerts')
      .select(`
        *,
        pg_listings:pg_id (
          id,
          name,
          rent,
          address,
          average_rating
        )
      `)
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  // Check if alert exists for a PG
  async getByPGId(pgId: string) {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null;

    const { data } = await supabase
      .from('price_drop_alerts')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
      .eq('pg_id', pgId)
      .maybeSingle()

    if (error) {
      console.error('Error fetching price drop alert:', error);
      return null;
    }
    return data
  },

  // Toggle alert enabled/disabled
  async toggle(alertId: string, enabled: boolean) {
    const { error } = await supabase
      .from('price_drop_alerts')
      .update({ is_enabled: enabled })
      .eq('id', alertId)

    if (error) throw error
  },

  // Delete price drop alert
  async delete(alertId: string) {
    const { error } = await supabase
      .from('price_drop_alerts')
      .delete()
      .eq('id', alertId)

    if (error) throw error
  },
}

// ============================================
// USER PREFERENCES SERVICE
// ============================================
export const preferencesService = {
  // Update user preferences
  async update(preferences: any) {
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('profiles')
      .update({ preferences })
      .eq('id', user?.id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Get user preferences
  async get() {
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('profiles')
      .select('preferences')
      .eq('id', user?.id)
      .single()

    if (error) throw error
    return data?.preferences
  },
}

// ============================================
// STORAGE SERVICE
// ============================================
export const storageService = {
  // Upload PG image
  async uploadPGImage(file: File, pgId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${pgId}/${Date.now()}.${fileExt}`

    const { data, error } = await supabase.storage
      .from('pg-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('pg-images')
      .getPublicUrl(fileName)

    return { path: fileName, url: publicUrl }
  },

  // Upload profile picture
  async uploadProfilePicture(file: File) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}.${fileExt}`

    const { data, error } = await supabase.storage
      .from('profile-pictures')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true // Allow updating existing profile picture
      })

    if (error) throw error

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(fileName)

    return { path: fileName, url: publicUrl }
  },

  // Upload verification document
  async uploadVerificationDoc(file: File, documentType: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${documentType}_${Date.now()}.${fileExt}`

    const { data, error } = await supabase.storage
      .from('verification-docs')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error

    // Get public URL (note: this bucket should be private in production)
    const { data: { publicUrl } } = supabase.storage
      .from('verification-docs')
      .getPublicUrl(fileName)

    return { path: fileName, url: publicUrl }
  },

  // Delete file from storage
  async deleteFile(bucket: 'pg-images' | 'profile-pictures' | 'verification-docs', filePath: string) {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath])

    if (error) throw error
  },

  // Get public URL for a file
  getPublicUrl(bucket: 'pg-images' | 'profile-pictures' | 'verification-docs', filePath: string) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)

    return data.publicUrl
  },

  // List files in a folder
  async listFiles(bucket: 'pg-images' | 'profile-pictures' | 'verification-docs', folder?: string) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folder)

    if (error) throw error
    return data
  },
}

// ============================================
// VERIFICATION SERVICE
// ============================================
export const verificationService = {
  // Get all pending verifications (Admin only)
  async getPendingVerifications() {
    const { data, error } = await supabase
      .from('verification_documents')
      .select(`
        *,
        owner:profiles!owner_id(id, full_name, phone),
        pg:pg_listings!pg_id(id, name)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  // Get all verifications (Admin only)
  async getAllVerifications() {
    const { data, error } = await supabase
      .from('verification_documents')
      .select(`
        *,
        owner:profiles!owner_id(id, full_name, phone),
        pg:pg_listings!pg_id(id, name),
        reviewer:profiles!reviewed_by(id, full_name)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  // Approve verification (Admin only)
  async approveVerification(documentId: string, notes?: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('verification_documents')
      .update({
        status: 'approved',
        reviewed_by: user.id,
        review_notes: notes,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', documentId)
      .select()
      .single()

    if (error) throw error

    // Also update owner's is_verified status
    if (data) {
      await supabase
        .from('profiles')
        .update({ is_verified: true })
        .eq('id', data.owner_id)
    }

    return data
  },

  // Reject verification (Admin only)
  async rejectVerification(documentId: string, notes?: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('verification_documents')
      .update({
        status: 'rejected',
        reviewed_by: user.id,
        review_notes: notes,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', documentId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Submit verification documents (Owner)
  async submitDocument(pgId: string | null, documentType: string, fileUrl: string, fileName: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('verification_documents')
      .insert({
        owner_id: user.id,
        pg_id: pgId,
        document_type: documentType,
        file_url: fileUrl,
        file_name: fileName,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },
}

// ============================================
// ADMIN SERVICE
// ============================================
export const adminService = {
  // Get all users with emails from user_profiles view
  async getAllUsers() {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  // Get all listings with owner info
  async getAllListings() {
    const { data, error } = await supabase
      .from('pg_listings')
      .select(`
        *,
        owner:profiles!owner_id(id, full_name, phone)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  // Get dashboard stats
  async getStats() {
    // Get counts in parallel
    const [usersResult, ownersResult, listingsResult, pendingVerfResult] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'user'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'owner'),
      supabase.from('pg_listings').select('id', { count: 'exact', head: true }),
      supabase.from('verification_documents').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    ])

    return {
      totalUsers: usersResult.count || 0,
      totalOwners: ownersResult.count || 0,
      totalListings: listingsResult.count || 0,
      pendingVerifications: pendingVerfResult.count || 0,
      flaggedContent: 0, // TODO: Implement reports/flags table
    }
  },

  // Toggle user status (suspend/activate)
  async toggleUserStatus(userId: string, suspend: boolean) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ is_active: !suspend })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete user (Admin only)
  async deleteUser(userId: string) {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (error) throw error
  },

  // Toggle listing status
  async toggleListingStatus(listingId: string, status: 'active' | 'inactive' | 'flagged') {
    const { data, error } = await supabase
      .from('pg_listings')
      .update({ status })
      .eq('id', listingId)
      .select()
      .single()

    if (error) throw error
    return data
  },
}

// Export all services
export default {
  auth: authService,
  pgs: pgService,
  savedPGs: savedPGsService,
  reviews: reviewsService,
  qna: qnaService,
  chat: chatService,
  notifications: notificationsService,
  vacancyAlerts: vacancyAlertsService,
  priceDropAlerts: priceDropAlertsService,
  preferences: preferencesService,
  storage: storageService,
  verification: verificationService,
  admin: adminService,
}
