import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      );
    }

    // Try to make a request to Firebase Auth
    const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    const firebaseAuthDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;

    console.log('Testing Firebase Auth with:');
    console.log('- API Key provided:', !!firebaseApiKey);
    console.log('- Auth Domain provided:', !!firebaseAuthDomain);

    if (!firebaseApiKey) {
      return NextResponse.json(
        { error: 'Firebase API key not configured' },
        { status: 500 }
      );
    }

    // Test Firebase Auth endpoint
    const firebaseUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseApiKey}`;

    console.log('Attempting Firebase Auth test...');

    const signupResponse = (await Promise.race([
      fetch(firebaseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true,
        }),
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Firebase request timeout (5s)')), 5000)
      ),
    ])) as Response;

    const responseData = await signupResponse.json();

    console.log('Firebase response status:', signupResponse.status);
    console.log('Firebase response:', responseData);

    if (!signupResponse.ok) {
      return NextResponse.json(
        {
          error: 'Firebase authentication failed',
          firebaseError: responseData.error?.message || 'Unknown error',
          details: responseData,
        },
        { status: signupResponse.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Firebase is responding correctly',
      firebaseVersion: 'v1',
    });
  } catch (error: any) {
    console.error('Firebase test error:', error);

    return NextResponse.json(
      {
        error: 'Firebase authentication test failed',
        message: error.message,
        type: error.name,
      },
      { status: 500 }
    );
  }
}
