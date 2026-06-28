import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message: 'Paystack verification is not enabled. Use the configured Flutterwave checkout.',
    },
    { status: 410 }
  );
}
