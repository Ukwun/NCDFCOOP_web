'use client';

import { useState } from 'react';

export default function DiagnosticsPage() {
  const [testEmail, setTestEmail] = useState('test@example.com');
  const [testPassword, setTestPassword] = useState('TestPassword123');
  const [testResult, setTestResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testFirebaseAuth = async () => {
    setIsLoading(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/test-firebase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
        }),
      });

      const data = await response.json();

      setTestResult({
        status: response.status,
        ok: response.ok,
        data,
      });
    } catch (error: any) {
      setTestResult({
        status: 'error',
        error: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔧 Firebase Auth Diagnostics</h1>

        {/* Test Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">Firebase Authentication Test</h2>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-semibold mb-2">Test Email</label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="test@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Test Password</label>
              <input
                type="password"
                value={testPassword}
                onChange={(e) => setTestPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="TestPassword123"
              />
            </div>
          </div>

          <button
            onClick={testFirebaseAuth}
            disabled={isLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isLoading ? 'Testing...' : 'Test Firebase Auth'}
          </button>
        </div>

        {/* Results Section */}
        {testResult && (
          <div className={`bg-white rounded-lg shadow-lg p-8 mb-8 border-l-4 ${testResult.ok ? 'border-green-500' : 'border-red-500'}`}>
            <h2 className="text-2xl font-bold mb-6">Test Results</h2>

            <div className={`p-4 rounded-lg mb-6 ${testResult.ok ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="text-lg font-semibold">
                {testResult.ok ? '✅ Firebase Connected' : '❌ Firebase Connection Failed'}
              </div>
              <div className="text-sm text-gray-600">HTTP Status: {testResult.status}</div>
            </div>

            <div className="bg-gray-900 text-white p-4 rounded-lg font-mono text-sm overflow-auto max-h-64">
              <pre>{JSON.stringify(testResult.data, null, 2)}</pre>
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-6">
          <h3 className="font-semibold mb-3">How to Fix Firebase Auth Error</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Check that <code className="bg-gray-100 px-2 py-1 rounded">NEXT_PUBLIC_FIREBASE_API_KEY</code> is set in <code className="bg-gray-100 px-2 py-1 rounded">.env.local</code></li>
            <li>Verify your Firebase project is created at <a href="https://console.firebase.google.com" className="text-blue-600 underline">Firebase Console</a></li>
            <li>Check that Email/Password authentication is enabled in Firebase (Authentication → Sign-in method)</li>
            <li>Ensure your API key has the necessary permissions</li>
            <li>Try the test above to see what error Firebase returns</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
