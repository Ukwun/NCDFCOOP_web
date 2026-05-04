'use client';

export const dynamic = 'force-dynamic';


// Welcome page removed. Redirect to /signup for authentication.
import { redirect } from 'next/navigation';

export default function WelcomePage() {
  redirect('/signup');
  return null;
}
