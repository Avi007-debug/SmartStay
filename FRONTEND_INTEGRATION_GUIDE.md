# 🎯 SmartStay Frontend Integration - Quick Reference

## 📦 Import Services

```typescript
import { 
  supabase,
  authService, 
  pgService, 
  savedPGsService,
  reviewsService,
  chatService, 
  notificationsService,
  vacancyAlertsService,
  preferencesService,
  storageService 
} from '@/lib/supabase'
```

---

## 🔐 Authentication Examples

### Sign Up
```typescript
try {
  await authService.signUp(
    'user@example.com',
    'password123',
    'John Doe',
    'user', // or 'owner'
    '1234567890' // optional phone
  )
  // Profile auto-created by trigger
} catch (error) {
  console.error(error.message)
}
```

### Sign In
```typescript
const { user } = await authService.signIn('user@example.com', 'password123')
// Redirects to dashboard based on user.profile.role
```

### Get Current User
```typescript
const currentUser = await authService.getCurrentUser()
console.log(currentUser.profile.role) // 'user', 'owner', or 'admin'
```

### Sign Out
```typescript
await authService.signOut()
```

---

## 🏠 PG Listings Examples

### Get All PGs with Filters
```typescript
const pgs = await pgService.getAll({
  city: 'Bangalore',
  minRent: 5000,
  maxRent: 15000,
  gender: 'male', // 'male', 'female', 'any'
  amenities: ['WiFi', 'AC'],
  verified: true,
  available: true
})
```

### Get Single PG
```typescript
const pg = await pgService.getById(pgId)
console.log(pg.name, pg.rent, pg.amenities)
```

### Search PGs (uses backend function)
```typescript
const results = await pgService.search({
  city: 'Bangalore',
  onlyVerified: true,
  onlyAvailable: true
})
```

### Get Recommendations
```typescript
// Based on user preferences in profile
const recommendations = await pgService.getRecommendations()
```

### Create PG (Owner only)
```typescript
await pgService.create({
  name: 'Green Valley PG',
  description: 'Comfortable stay near college',
  gender: 'any',
  rent: 10000,
  deposit: 5000,
  total_beds: 20,
  available_beds: 5,
  amenities: ['WiFi', 'AC', 'Laundry'],
  food_included: true,
  address: {
    street: '123 Main St',
    area: 'Koramangala',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560034',
    latitude: 12.9352,
    longitude: 77.6245
  },
  images: ['url1', 'url2'],
  rules: ['No smoking', 'Quiet hours 10pm-7am']
})
```

### Update PG
```typescript
await pgService.update(pgId, {
  available_beds: 3,
  rent: 11000
})
```

---

## 💾 Saved PGs Examples

### Save/Unsave PG
```typescript
await savedPGsService.toggle(pgId, true) // Save
await savedPGsService.toggle(pgId, false) // Unsave
```

### Get All Saved PGs
```typescript
const savedPGs = await savedPGsService.getAll()
```

---

## ⭐ Reviews Examples

### Create Review
```typescript
await reviewsService.create(pgId, {
  rating: 4,
  title: 'Great place to stay',
  review_text: 'Clean rooms, friendly staff...',
  pros: ['WiFi', 'Clean', 'Location'],
  cons: ['Noisy at times'],
  stay_duration_months: 6,
  room_type: '2-sharing'
})
```

### Get PG Reviews
```typescript
const reviews = await reviewsService.getByPG(pgId)
```

### Vote on Review
```typescript
await reviewsService.vote(reviewId, 'helpful') // or 'not_helpful'
```

---

## 💬 Chat & Messages Examples

### Create Chat
```typescript
const chat = await chatService.create(pgOwnerId)
console.log(chat.id)
```

### Get All Chats
```typescript
const chats = await chatService.getAll()
```

### Send Message
```typescript
await chatService.sendMessage(chatId, 'Hello, is the room still available?')
```

### Subscribe to Realtime Messages
```typescript
const subscription = chatService.subscribeToMessages(chatId, (newMessage) => {
  console.log('New message:', newMessage.message_text)
  // Update UI with new message
})

// Cleanup when component unmounts
return () => subscription.unsubscribe()
```

**Full Chat Component Example:**
```typescript
import { useEffect, useState } from 'react'
import { chatService } from '@/lib/supabase'

const ChatWindow = ({ chatId }) => {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')

  useEffect(() => {
    // Load existing messages
    const loadMessages = async () => {
      const msgs = await chatService.getMessages(chatId)
      setMessages(msgs)
    }
    loadMessages()

    // Subscribe to new messages
    const subscription = chatService.subscribeToMessages(chatId, (newMsg) => {
      setMessages(prev => [...prev, newMsg])
    })

    return () => subscription.unsubscribe()
  }, [chatId])

  const sendMessage = async () => {
    if (!input.trim()) return
    await chatService.sendMessage(chatId, input)
    setInput('')
  }

  return (
    <div>
      <div className="messages">
        {messages.map(msg => (
          <div key={msg.id}>{msg.message_text}</div>
        ))}
      </div>
      <input 
        value={input} 
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  )
}
```

---

## 🔔 Notifications Examples

### Get All Notifications
```typescript
const notifications = await notificationsService.getAll()
```

### Mark as Read
```typescript
await notificationsService.markAsRead(notificationId)
```

### Subscribe to Realtime Notifications
```typescript
const subscription = await notificationsService.subscribeToNotifications((newNotif) => {
  console.log('New notification:', newNotif.title, newNotif.message)
  // Show toast/alert
})

// Cleanup
subscription?.unsubscribe()
```

**Notification Bell Component:**
```typescript
import { useEffect, useState } from 'react'
import { notificationsService } from '@/lib/supabase'
import { Bell } from 'lucide-react'

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    // Load notifications
    notificationsService.getAll().then(data => {
      setNotifications(data)
      setUnreadCount(data.filter(n => !n.is_read).length)
    })

    // Subscribe to new notifications
    const subscription = notificationsService.subscribeToNotifications((newNotif) => {
      setNotifications(prev => [newNotif, ...prev])
      setUnreadCount(prev => prev + 1)
    })

    return () => subscription?.unsubscribe()
  }, [])

  const handleMarkAsRead = async (id) => {
    await notificationsService.markAsRead(id)
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    )
    setUnreadCount(prev => prev - 1)
  }

  return (
    <div className="relative">
      <Bell />
      {unreadCount > 0 && (
        <span className="badge">{unreadCount}</span>
      )}
      {/* Dropdown with notifications */}
    </div>
  )
}
```

---

## 🚨 Vacancy Alerts Examples

### Toggle Vacancy Alert
```typescript
await vacancyAlertsService.toggle(pgId, true) // Enable
await vacancyAlertsService.toggle(pgId, false) // Disable
```

### Check if Alert Enabled
```typescript
const isEnabled = await vacancyAlertsService.isEnabled(pgId)
```

---

## 🎨 User Preferences Examples

### Update Preferences
```typescript
await preferencesService.update({
  budget: {
    min: 5000,
    max: 15000
  },
  preferred_cities: ['Bangalore', 'Pune'],
  amenities: ['WiFi', 'AC', 'Food'],
  gender_preference: 'any'
})
```

### Get Preferences
```typescript
const prefs = await preferencesService.get()
console.log(prefs.budget.min, prefs.preferred_cities)
```

---

## 📁 Storage Examples

### Upload PG Image
```typescript
const handleImageUpload = async (file: File, pgId: string) => {
  const { url, path } = await storageService.uploadPGImage(file, pgId)
  console.log('Image uploaded to:', url)
  
  // Save URL to pg_listings.images array
  await pgService.update(pgId, {
    images: [...existingImages, url]
  })
}
```

### Upload Profile Picture
```typescript
const handleProfilePicUpload = async (file: File) => {
  const { url } = await storageService.uploadProfilePicture(file)
  
  // Update profile
  const { data: { user } } = await supabase.auth.getUser()
  await supabase
    .from('profiles')
    .update({ avatar_url: url })
    .eq('id', user.id)
}
```

### Upload Verification Document
```typescript
const handleDocUpload = async (file: File) => {
  const { url, path } = await storageService.uploadVerificationDoc(file, 'aadhar')
  
  // Save to verification_documents table
  await supabase.from('verification_documents').insert({
    user_id: userId,
    document_type: 'aadhar',
    document_url: url,
    status: 'pending'
  })
}
```

### Delete File
```typescript
await storageService.deleteFile('pg-images', 'path/to/file.jpg')
```

### Get Public URL
```typescript
const url = storageService.getPublicUrl('pg-images', 'path/to/file.jpg')
```

**Image Upload Component:**
```typescript
import { useState } from 'react'
import { storageService } from '@/lib/supabase'

const ImageUploader = ({ pgId, onUploadComplete }) => {
  const [uploading, setUploading] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    setUploading(true)
    try {
      const { url } = await storageService.uploadPGImage(file, pgId)
      onUploadComplete(url)
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <input 
        type="file" 
        accept="image/*" 
        onChange={handleFileChange}
        disabled={uploading}
      />
      {uploading && <p>Uploading...</p>}
    </div>
  )
}
```

---

## 🔄 Realtime Best Practices

### 1. Always Cleanup Subscriptions
```typescript
useEffect(() => {
  const subscription = chatService.subscribeToMessages(chatId, callback)
  return () => subscription.unsubscribe() // IMPORTANT!
}, [chatId])
```

### 2. Check Connection Status
```typescript
const channel = supabase.channel('test')
channel.subscribe((status) => {
  if (status === 'SUBSCRIBED') {
    console.log('Connected!')
  } else if (status === 'CHANNEL_ERROR') {
    console.error('Connection failed')
  }
})
```

### 3. Handle Reconnections
```typescript
const [isConnected, setIsConnected] = useState(false)

useEffect(() => {
  const subscription = chatService.subscribeToMessages(chatId, (msg) => {
    setIsConnected(true)
    handleNewMessage(msg)
  })

  // Monitor connection
  subscription.on('system', {}, (payload) => {
    if (payload.status === 'disconnected') {
      setIsConnected(false)
    }
  })

  return () => subscription.unsubscribe()
}, [chatId])
```

---

## 🚀 Common Patterns

### Dashboard Data Loading
```typescript
const UserDashboard = () => {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({
    savedPGs: [],
    recommendations: [],
    recentlyViewed: []
  })

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true)
      try {
        const [saved, recs, recent] = await Promise.all([
          savedPGsService.getAll(),
          pgService.getRecommendations(),
          pgService.getRecentlyViewed()
        ])
        setData({ savedPGs: saved, recommendations: recs, recentlyViewed: recent })
      } catch (error) {
        console.error('Failed to load dashboard:', error)
      } finally {
        setLoading(false)
      }
    }
    loadDashboard()
  }, [])

  if (loading) return <div>Loading...</div>
  return <div>{/* Render dashboard */}</div>
}
```

### Search with Filters
```typescript
const SearchPage = () => {
  const [filters, setFilters] = useState({
    city: '',
    minRent: 0,
    maxRent: 50000,
    gender: 'any',
    amenities: []
  })
  const [results, setResults] = useState([])

  const handleSearch = async () => {
    const pgs = await pgService.getAll(filters)
    setResults(pgs)
  }

  return (
    <div>
      {/* Filter inputs */}
      <button onClick={handleSearch}>Search</button>
      {/* Results */}
    </div>
  )
}
```

---

## 🛡️ Error Handling

```typescript
try {
  const data = await pgService.getById(pgId)
  setData(data)
} catch (error) {
  if (error.code === 'PGRST116') {
    // Not found
    console.error('PG not found')
  } else if (error.message.includes('JWT')) {
    // Auth error
    console.error('Please sign in')
  } else {
    // Other errors
    console.error('Error:', error.message)
  }
}
```

---

## 📱 TypeScript Types

All services return properly typed data. For custom types:

```typescript
// Define types for your components
type PGListing = {
  id: string
  name: string
  description: string
  rent: number
  deposit: number
  available_beds: number
  amenities: string[]
  images: string[]
  // ... other fields
}

type Review = {
  id: string
  rating: number
  title: string
  review_text: string
  // ... other fields
}

// Use in components
const [pg, setPG] = useState<PGListing | null>(null)
const [reviews, setReviews] = useState<Review[]>([])
```

---

## 🎉 You're All Set!

All services are ready to use. Import them and start building your features!

**Need help?** Check:
- [COMPLETE_SETUP_GUIDE.md](COMPLETE_SETUP_GUIDE.md) - Full setup status
- [VERIFICATION_GUIDE.md](VERIFICATION_GUIDE.md) - Database testing
- Browser console for errors
- Supabase Dashboard → Logs for backend errors
