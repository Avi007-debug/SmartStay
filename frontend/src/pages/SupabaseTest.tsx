import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { runAllTests, testConnection, testSignup, testSearch } from '@/lib/supabase.test';

/**
 * Supabase Test Component
 * 
 * Temporary component to test Supabase connection
 * 
 * Usage:
 * 1. Import this component in App.tsx or any route
 * 2. Navigate to the route
 * 3. Click buttons to run tests
 * 4. Check browser console for results
 * 
 * Remove this component after backend is verified working
 */

export default function SupabaseTest() {
  return (
    <div className="min-h-screen bg-gradient-subtle p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">🧪 Supabase Test Suite</CardTitle>
            <CardDescription>
              Run these tests to verify your Supabase backend is working correctly.
              <br />
              <strong>Check browser console (F12) for results.</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <Button 
                onClick={() => runAllTests()}
                variant="default"
                size="lg"
                className="w-full"
              >
                🚀 Run All Tests
              </Button>

              <div className="grid grid-cols-3 gap-3">
                <Button 
                  onClick={() => testConnection()}
                  variant="outline"
                >
                  Test Connection
                </Button>
                <Button 
                  onClick={() => testSignup()}
                  variant="outline"
                >
                  Test Signup
                </Button>
                <Button 
                  onClick={() => testSearch()}
                  variant="outline"
                >
                  Test Search
                </Button>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
              <p className="font-semibold">📋 Checklist Before Testing:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>✅ Run <code className="bg-background px-1 rounded">supabase_schema.sql</code> in Supabase</li>
                <li>✅ Run <code className="bg-background px-1 rounded">supabase_fixes_migration.sql</code> in Supabase</li>
                <li>✅ Enable Realtime for messages, notifications, chats</li>
                <li>✅ Create storage buckets (pg-images, verification-docs, profile-pictures)</li>
                <li>✅ Set up storage policies</li>
                <li>✅ Update .env with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY</li>
              </ul>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg text-sm space-y-2">
              <p className="font-semibold text-blue-900 dark:text-blue-100">💡 Expected Results:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300">
                <li><strong>Connection Test:</strong> Should show database connected, check auth session, fetch sample data</li>
                <li><strong>Signup Test:</strong> Creates test user, verifies profile auto-creation, then cleans up</li>
                <li><strong>Search Test:</strong> Calls search_pgs function and returns results</li>
              </ul>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg text-sm">
              <p className="font-semibold text-yellow-900 dark:text-yellow-100">⚠️ If Tests Fail:</p>
              <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                Refer to <code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">BACKEND_QUICKSTART.md</code> for troubleshooting steps.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">📚 Quick Test Commands</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 font-mono text-sm">
              <p>Open browser console (F12) and run:</p>
              <div className="bg-muted p-3 rounded">
                <code className="text-xs">
                  import {'{'} runAllTests {'}'} from '@/lib/supabase.test';<br />
                  runAllTests();
                </code>
              </div>
              <p className="text-muted-foreground text-xs mt-2">
                Or use the buttons above for easier testing
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
