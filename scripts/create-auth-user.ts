/**
 * Script to create auth user via Supabase Admin API
 * Run with: npx tsx scripts/create-auth-user.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createUser() {
  try {
    console.log('Creating user via Supabase Admin API...')
    
    // Delete existing user if exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existingUser = existingUsers?.users.find(u => u.email === 'admin@democro.com')
    
    if (existingUser) {
      console.log('Deleting existing user...')
      await supabase.auth.admin.deleteUser(existingUser.id)
    }

    // Create new user
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'admin@democro.com',
      password: 'demo123',
      email_confirm: true,
      user_metadata: {
        name: 'Admin User'
      }
    })

    if (error) {
      console.error('Error creating user:', error)
      process.exit(1)
    }

    console.log('✅ User created successfully!')
    console.log('User ID:', data.user.id)
    console.log('Email:', data.user.email)
    
    // Now update the public.users table
    console.log('\nUpdating public.users table...')
    
    const { error: updateError } = await supabase
      .from('users')
      .upsert({
        id: data.user.id,
        email: data.user.email,
        name: 'Admin User',
        role: 'admin',
        org_id: '00000000-0000-0000-0000-000000000001'
      })

    if (updateError) {
      console.error('Error updating public.users:', updateError)
    } else {
      console.log('✅ public.users updated!')
    }

    console.log('\n🎉 All done! You can now login with:')
    console.log('Email: admin@democro.com')
    console.log('Password: demo123')
    
  } catch (error) {
    console.error('Unexpected error:', error)
    process.exit(1)
  }
}

createUser()
