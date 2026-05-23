const { createClient } = require('@supabase/supabase-js');

const url = 'https://vrmbzcdjxqckaksxfbiz.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZybWJ6Y2RqeHFja2Frc3hmYml6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTU1NTkzNiwiZXhwIjoyMDk1MTMxOTM2fQ.LxGCSPLRCHm-QpZIW0-dCGxJz4ht7nks-PCkQFGBvy8';

const supabaseAdmin = createClient(url, serviceRoleKey);

async function testInsert() {
  console.log('Inserting admin...');
  const { error } = await supabaseAdmin
      .from('admins')
      .insert([
        {
          id: '7364a012-2a6e-4ee0-ae22-f3b41c2b22aa', // The ID from previous test
          name: 'Node Test Admin',
          email: 'test_node_script@gmail.com',
        },
      ]);

  if (error) {
    console.error('Insert error:', error);
    return;
  }

  console.log('Insert success!');
}

testInsert();
