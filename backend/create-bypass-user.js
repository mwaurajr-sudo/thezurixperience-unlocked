import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createAdminUser() {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: 'admin@thezurixperience.com',
    password: 'password123',
    email_confirm: true,
    user_metadata: { display_name: 'Zuri Admin' }
  });

  if (error) {
    console.error('Error creating user:', error.message);
  } else {
    console.log('Successfully created bypass user!');
    console.log('Email: admin@thezurixperience.com');
    console.log('Password: password123');
  }
}

createAdminUser();
