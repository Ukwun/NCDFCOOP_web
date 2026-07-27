/**
 * Message Service
 * Handles message and conversation management
 */

import {
  collection,
  doc,
  getDocs,
  query,
  where,
  Timestamp,
  updateDoc,
  deleteDoc,
  onSnapshot,
  Unsubscribe,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS } from '@/lib/constants/database';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  content: string;
  status: 'sent' | 'delivered' | 'read';
  timestamp: Timestamp;
  attachments?: string[];
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage: string;
  lastMessageTime: Timestamp;
  unreadCount: number;
  isArchived: boolean;
  participantNames?: Record<string, string>;
  inquiryId?: string;
  productId?: string;
  productName?: string;
}

/**
 * Send a message
 */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  recipientId: string,
  content: string
): Promise<string> {
  try {
    const messageRef = doc(collection(db, COLLECTIONS.MESSAGES));
    const timestamp = Timestamp.now();
    const batch = writeBatch(db);
    batch.set(messageRef, {
      conversationId,
      senderId,
      recipientId,
      content,
      status: 'sent',
      timestamp,
      attachments: [],
    });
    batch.update(doc(db, COLLECTIONS.CONVERSATIONS, conversationId), {
      lastMessage: content,
      lastMessageTime: timestamp,
    });
    await batch.commit();

    return messageRef.id;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

export function subscribeUserConversations(
  userId: string,
  onData: (conversations: Conversation[]) => void,
  onError?: (error: unknown) => void,
): Unsubscribe {
  const conversationsQuery = query(
    collection(db, COLLECTIONS.CONVERSATIONS),
    where('participants', 'array-contains', userId),
  );
  return onSnapshot(conversationsQuery, (snapshot) => {
    const rows = snapshot.docs
      .map((item) => ({ id: item.id, ...item.data() } as Conversation))
      .sort((a, b) => (b.lastMessageTime?.toMillis?.() || 0) - (a.lastMessageTime?.toMillis?.() || 0));
    onData(rows);
  }, onError);
}

export function subscribeConversationMessages(
  conversationId: string,
  onData: (messages: Message[]) => void,
  onError?: (error: unknown) => void,
): Unsubscribe {
  const messagesQuery = query(
    collection(db, COLLECTIONS.MESSAGES),
    where('conversationId', '==', conversationId),
  );
  return onSnapshot(messagesQuery, (snapshot) => {
    const rows = snapshot.docs
      .map((item) => ({ id: item.id, ...item.data() } as Message))
      .sort((a, b) => (a.timestamp?.toMillis?.() || 0) - (b.timestamp?.toMillis?.() || 0));
    onData(rows);
  }, onError);
}

/**
 * Get messages for a conversation
 */
export async function getMessages(conversationId: string, limit: number = 50): Promise<Message[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.MESSAGES),
      where('conversationId', '==', conversationId)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as Message))
      .sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis())
      .slice(0, limit);
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
}

/**
 * Get user conversations
 */
export async function getUserConversations(userId: string): Promise<Conversation[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.CONVERSATIONS),
      where('participants', 'array-contains', userId)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as Conversation))
      .sort((a, b) => b.lastMessageTime.toMillis() - a.lastMessageTime.toMillis());
  } catch (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }
}

/**
 * Mark message as read
 */
export async function markMessageAsRead(messageId: string): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTIONS.MESSAGES, messageId), {
      status: 'read',
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
    throw error;
  }
}

/**
 * Delete a message
 */
export async function deleteMessage(messageId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.MESSAGES, messageId));
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
}
