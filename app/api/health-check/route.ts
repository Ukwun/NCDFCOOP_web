import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Check if Firebase environment variables are set
    const firebaseVars = {
      apiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: !!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    const allFirebaseVarsSet = Object.values(firebaseVars).every(v => v === true);

    if (!allFirebaseVarsSet) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Firebase environment variables not properly configured',
          firebaseConfig: firebaseVars,
        },
        { status: 500 }
      );
    }

    // Try to reach Firebase
    const firebaseUrl = 'https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + 
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    
    const firebaseTest = await Promise.race([
      fetch(firebaseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: 'test' }),
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Firebase timeout')), 5000)
      ),
    ]);

    // If we got here, Firebase is reachable
    return NextResponse.json(
      {
        status: 'ok',
        message: 'Service and Firebase are healthy',
        firebaseConfig: firebaseVars,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        message: error.message || 'Health check failed',
        error: error.toString(),
      },
      { status: 500 }
    );
  }
}
