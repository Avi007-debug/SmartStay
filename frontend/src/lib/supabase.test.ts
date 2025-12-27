import { supabase } from './supabase';

/**
 * Test Supabase Connection
 * Run this file to verify your Supabase setup is working correctly
 * 
 * Usage:
 * 1. Make sure npm run dev is running
 * 2. Open browser console
 * 3. Import this file in a component
 * 4. Call testConnection()
 */

export async function testConnection() {
  console.log('🧪 Testing Supabase Connection...\n');

  try {
    // Test 1: Database Connection
    console.log('1️⃣ Testing database connection...');
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('count');
    
    if (testError) {
      console.error('❌ Database connection failed:', testError.message);
      return false;
    }
    console.log('✅ Database connected successfully\n');

    // Test 2: Auth Session
    console.log('2️⃣ Checking auth session...');
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      console.log('✅ User is logged in:', session.user.email);
      console.log('   User ID:', session.user.id);
    } else {
      console.log('⚠️ No active session (user not logged in)');
    }
    console.log('');

    // Test 3: Profile Data
    if (session) {
      console.log('3️⃣ Fetching user profile...');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('❌ Profile fetch failed:', profileError.message);
      } else {
        console.log('✅ Profile found:', {
          name: profile.full_name,
          role: profile.role,
          verified: profile.is_verified,
        });
      }
      console.log('');
    }

    // Test 4: PG Listings
    console.log('4️⃣ Testing PG listings query...');
    const { data: pgs, error: pgsError } = await supabase
      .from('pg_listings')
      .select('id, name, city, rent, is_verified')
      .limit(5);

    if (pgsError) {
      console.error('❌ PG listings query failed:', pgsError.message);
    } else {
      console.log(`✅ Found ${pgs?.length || 0} PG listings`);
      if (pgs && pgs.length > 0) {
        console.log('   Sample:', pgs[0].name);
      }
    }
    console.log('');

    // Test 5: Storage
    console.log('5️⃣ Testing storage access...');
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();

    if (bucketsError) {
      console.error('❌ Storage access failed:', bucketsError.message);
    } else {
      console.log('✅ Storage accessible. Buckets:');
      buckets?.forEach(bucket => {
        console.log(`   - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
      });
    }
    console.log('');

    // Test 6: Realtime Status
    console.log('6️⃣ Testing realtime connection...');
    const channel = supabase.channel('test-channel');
    const status = channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Realtime connected successfully');
        channel.unsubscribe();
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Realtime connection failed');
      }
    });
    console.log('');

    console.log('🎉 All tests completed!\n');
    return true;

  } catch (error: any) {
    console.error('❌ Test failed with error:', error.message);
    return false;
  }
}

/**
 * Test Signup Flow
 * Creates a test user and verifies profile creation
 */
export async function testSignup() {
  console.log('🧪 Testing Signup Flow...\n');

  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'password123';

  try {
    // Step 1: Sign up
    console.log('1️⃣ Creating test user...');
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test User',
          role: 'user',
        },
      },
    });

    if (signupError) {
      console.error('❌ Signup failed:', signupError.message);
      return false;
    }

    console.log('✅ User created:', testEmail);
    console.log('   User ID:', signupData.user?.id);
    console.log('');

    // Step 2: Check if profile was auto-created
    console.log('2️⃣ Checking if profile was auto-created...');
    
    // Wait 2 seconds for trigger to complete
    await new Promise(resolve => setTimeout(resolve, 2000));

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', signupData.user?.id)
      .single();

    if (profileError) {
      console.error('❌ Profile not found. Trigger may not be working.');
      console.error('   Error:', profileError.message);
      return false;
    }

    console.log('✅ Profile auto-created successfully!');
    console.log('   Name:', profile.full_name);
    console.log('   Role:', profile.role);
    console.log('');

    // Step 3: Sign out
    console.log('3️⃣ Cleaning up...');
    await supabase.auth.signOut();
    console.log('✅ Signed out\n');

    console.log('🎉 Signup flow test passed!\n');
    console.log('⚠️ Note: You may want to delete the test user from Supabase Dashboard');
    console.log(`   Email: ${testEmail}\n`);

    return true;

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

/**
 * Test Search Function
 * Verifies the search_pgs SQL function works
 */
export async function testSearch() {
  console.log('🧪 Testing Search Function...\n');

  try {
    console.log('1️⃣ Calling search_pgs function...');
    const { data, error } = await supabase.rpc('search_pgs', {
      search_city: 'Bangalore',
      only_verified: true,
      only_available: true,
    });

    if (error) {
      console.error('❌ Search failed:', error.message);
      return false;
    }

    console.log('✅ Search completed successfully');
    console.log(`   Found ${data?.length || 0} results`);
    
    if (data && data.length > 0) {
      console.log('   Sample result:', {
        name: data[0].name,
        rent: data[0].rent,
        verified: data[0].is_verified,
      });
    }
    console.log('');

    return true;

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

/**
 * Run All Tests
 * Executes all test functions in sequence
 */
export async function runAllTests() {
  console.log('='.repeat(50));
  console.log('🚀 SMARTSTAY SUPABASE TEST SUITE');
  console.log('='.repeat(50));
  console.log('');

  const results = {
    connection: false,
    signup: false,
    search: false,
  };

  results.connection = await testConnection();
  console.log('-'.repeat(50));
  console.log('');

  results.signup = await testSignup();
  console.log('-'.repeat(50));
  console.log('');

  results.search = await testSearch();
  console.log('-'.repeat(50));
  console.log('');

  console.log('📊 TEST RESULTS SUMMARY:');
  console.log('');
  console.log(`Connection Test: ${results.connection ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Signup Test: ${results.signup ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Search Test: ${results.search ? '✅ PASS' : '❌ FAIL'}`);
  console.log('');

  const allPassed = Object.values(results).every(r => r === true);
  
  if (allPassed) {
    console.log('🎉 ALL TESTS PASSED! Your backend is ready to go! 🎉');
  } else {
    console.log('⚠️ Some tests failed. Check the errors above and refer to BACKEND_QUICKSTART.md');
  }
  console.log('');
  console.log('='.repeat(50));
}

// Export individual tests for selective testing
export default {
  testConnection,
  testSignup,
  testSearch,
  runAllTests,
};
