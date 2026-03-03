const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function createTestUser() {
  try {
    // Try to sign up a new user
    const { data, error } = await supabase.auth.signUp({
      email: `test-${Date.now()}@test.local`,
      password: 'TestPassword123!',
      options: {
        data: {
          name: 'Test User'
        }
      }
    });

    if (error) {
      console.error('Error creating user:', error.message);
      return;
    }

    console.log('User created successfully:');
    console.log('Email:', data.user?.email);
    console.log('User ID:', data.user?.id);

    // Now let's get the session
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    console.log('\nSession:', session);
  } catch (err) {
    console.error('Exception:', err.message);
  }
}

createTestUser();
