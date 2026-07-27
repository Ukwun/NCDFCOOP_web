import { auth } from '@/lib/firebase/config';

export async function openInquiryConversation(inquiryId: string): Promise<string> {
  const token = await auth?.currentUser?.getIdToken();
  if (!token) throw new Error('Your session expired. Please sign in again.');
  const response = await fetch('/api/conversations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ inquiryId }),
  });
  const result = await response.json();
  if (!response.ok || !result.conversationId) {
    throw new Error(result.error || 'The conversation could not be opened.');
  }
  return String(result.conversationId);
}
