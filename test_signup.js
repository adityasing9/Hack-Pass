const { createClient } = require('@supabase/supabase-js');

const url = 'https://vrmbzcdjxqckaksxfbiz.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZybWJ6Y2RqeHFja2Frc3hmYml6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NTU5MzYsImV4cCI6MjA5NTEzMTkzNn0.R-yGcfuGJCQZXT9mHPaLdw0MFzXWS4-q4rVUSUJTFSE';

const supabase = createClient(url, anonKey);

async function testSignup() {
  console.log('Signing up...');
  const { data, error } = await supabase.auth.signUp({
    email: 'test_node_script_' + Date.now() + '@gmail.com',
    password: 'password123'
  });

  if (error) {
    console.error('Signup error:', error);
    return;
  }

  console.log('Signup success:', data.user.id);
}

testSignup();
