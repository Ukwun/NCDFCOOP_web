/**
 * Message Service
 * Handles message and conversation management
 */

import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  updateDoc,
  deleteDoc,
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
    const messageRef = await addDoc(collection(db, COLLECTIONS.MESSAGES), {
      conversationId,
      senderId,
      recipientId,
      content,
      status: 'sent',
      timestamp: Timestamp.now(),
      attachments: [],
    });

    // Update conversation
    await updateDoc(doc(db, COLLECTIONS.CONVERSATIONS, conversationId), {
      lastMessage: content,
      lastMessageTime: Timestamp.now(),
    });

    return messageRef.id;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

/**
 * Get messages for a conversation
 */
export async function getMessages(conversationId: string, limit: number = 50): Promise<Message[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.MESSAGES),
      where('conversationId', '==', conversationId),
      orderBy('timestamp', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.slice(0, limit).map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Message));
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
      where('participants', 'array-contains', userId),
      orderBy('lastMessageTime', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Conversation));
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
