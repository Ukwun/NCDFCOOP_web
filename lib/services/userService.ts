/**
 * User Data Service
 * Handles user profile and authentication related data
 */

import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS } from '@/lib/constants/database';

export interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  profilePicture: string;
  phone: string;
  address: string;
  isActive: boolean;
}

export async function getUserData(userId: string): Promise<UserData | null> {
  try {
    const docRef = doc(db, COLLECTIONS.USERS, userId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as UserData) : null;
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<UserData>
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.USERS, userId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

export async function updateUserPhone(userId: string, phone: string): Promise<void> {
  await updateUserProfile(userId, { phone });
}

export async function updateUserAddress(userId: string, address: string): Promise<void> {
  await updateUserProfile(userId, { address });
}

export async function updateUserProfilePicture(userId: string, pictureUrl: string): Promise<void> {
  await updateUserProfile(userId, { profilePicture: pictureUrl });
}
