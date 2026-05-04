"use client";
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth/authContext';
import { getUserNotifications, Notification } from '../../lib/services/notificationService';

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const data = await getUserNotifications(user.uid);
        setNotifications(data);
      } catch (err) {
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-xl mx-auto mt-20 text-center text-lg text-gray-700 dark:text-gray-200">
        Please sign in to view your notifications.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white dark:bg-gray-900 rounded shadow">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Notifications</h1>
      {loading ? (
        <div className="text-gray-600 dark:text-gray-300">Loading...</div>
      ) : notifications.length === 0 ? (
        <div className="text-gray-600 dark:text-gray-300">You have no notifications.</div>
      ) : (
        <ul className="space-y-4">
          {notifications.map((notif) => (
            <li key={notif.id} className={`p-4 rounded border bg-gray-50 dark:bg-gray-800 ${notif.read ? 'border-gray-200 dark:border-gray-700' : 'border-blue-400 dark:border-blue-500'}`}>
              <div className="flex items-center justify-between">
                <div className="font-semibold text-gray-800 dark:text-gray-100">
                  {notif.title}
                  {notif.type === 'order' && <span className="ml-2 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-0.5 rounded">Order</span>}
                  {notif.type === 'promotion' && <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 px-2 py-0.5 rounded">Promo</span>}
                  {notif.type === 'alert' && <span className="ml-2 text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 px-2 py-0.5 rounded">Alert</span>}
                  {notif.type === 'system' && <span className="ml-2 text-xs bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 px-2 py-0.5 rounded">System</span>}
                </div>
                {!notif.read && <span className="text-xs text-blue-600 dark:text-blue-300 font-bold">New</span>}
              </div>
              <div className="text-gray-700 dark:text-gray-300 mt-1">{notif.message}</div>
              {notif.data?.link && (
                <a href={notif.data.link} className="text-blue-600 dark:text-blue-300 underline text-sm mt-2 inline-block">View Details</a>
              )}
              <div className="text-xs text-gray-400 mt-2">{notif.createdAt?.seconds ? new Date(notif.createdAt.seconds * 1000).toLocaleString() : ''}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Duplicate imports and misplaced 'use client' directive removed
