/**
 * Teardown Script for E2E Tests
 * Cleans up test data after test runs
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load test environment
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const testUserEmail = process.env.E2E_TEST_EMAIL!;

async function teardown() {
  console.log('🧹 Starting E2E test teardown...');

  // Create Supabase client with service role key (bypasses RLS)
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Get test user ID
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();

    if (userError) {
      console.error('Error fetching users:', userError);
      return;
    }

    const testUser = userData.users.find(u => u.email === testUserEmail);

    if (!testUser) {
      console.log(`✓ Test user not found (${testUserEmail})`);
      return;
    }

    console.log(`Found test user: ${testUser.email} (${testUser.id})`);

    // Delete test user's flashcards
    const { error: flashcardsError, count: flashcardsCount } = await supabase
      .from('flashcards')
      .delete({ count: 'exact' })
      .eq('user_id', testUser.id);

    if (flashcardsError) {
      console.error('Error deleting flashcards:', flashcardsError);
    } else {
      console.log(`✓ Deleted ${flashcardsCount || 0} test flashcards`);
    }

    // Delete test user's generations
    const { error: generationsError, count: generationsCount } = await supabase
      .from('generations')
      .delete({ count: 'exact' })
      .eq('user_id', testUser.id);

    if (generationsError) {
      console.error('Error deleting generations:', generationsError);
    } else {
      console.log(`✓ Deleted ${generationsCount || 0} test generations`);
    }

    // Delete test user's error logs
    const { error: errorsError, count: errorsCount } = await supabase
      .from('generation_error_logs')
      .delete({ count: 'exact' })
      .eq('user_id', testUser.id);

    if (errorsError) {
      console.error('Error deleting error logs:', errorsError);
    } else {
      console.log(`✓ Deleted ${errorsCount || 0} test error logs`);
    }

    console.log('✅ E2E test teardown completed successfully!');
  } catch (error) {
    console.error('❌ Teardown failed:', error);
    process.exit(1);
  }
}

// Run teardown
teardown();
