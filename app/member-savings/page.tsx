import { redirect } from 'next/navigation';

export default function MemberSavingsRedirectPage() {
  // Legacy route kept for backward compatibility.
  redirect('/member/investments');
}
