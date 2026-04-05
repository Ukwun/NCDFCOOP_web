'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/authContext';
import { getUserConversations, sendMessage, Conversation, getMessages, Message } from '@/lib/services/messageService';

export default function MessageScreen() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch conversations on mount and when user changes
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        setError(null);
        if (user?.uid) {
          const userConversations = await getUserConversations(user.uid);
          setConversations(userConversations);
        }
      } catch (err) {
        console.error('Error fetching conversations:', err);
        setError('Failed to load conversations');
        // Fallback to mock data
        setConversations([
          {
            id: '1',
            participants: [user?.uid || ''],
            lastMessage: 'Your order has been shipped!',
            lastMessageTime: { toDate: () => new Date(Date.now() - 2 * 60 * 1000) } as any,
            unreadCount: 2,
            isArchived: false,
          },
          {
            id: '2',
            participants: [user?.uid || ''],
            lastMessage: 'How can we help you today?',
            lastMessageTime: { toDate: () => new Date(Date.now() - 60 * 60 * 1000) } as any,
            unreadCount: 0,
            isArchived: false,
          },
          {
            id: '3',
            participants: [user?.uid || ''],
            lastMessage: 'Thank you for your purchase',
            lastMessageTime: { toDate: () => new Date(Date.now() - 5 * 60 * 60 * 1000) } as any,
            unreadCount: 0,
            isArchived: false,
          },
          {
            id: '4',
            participants: [user?.uid || ''],
            lastMessage: 'Do you have more of this product?',
            lastMessageTime: { toDate: () => new Date(Date.now() - 24 * 60 * 60 * 1000) } as any,
            unreadCount: 1,
            isArchived: false,
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [user]);

  // Fetch messages when conversation is selected
  useEffect(() => {
    const fetchMessages = async () => {
      if (selectedChat) {
        try {
          const chatMessages = await getMessages(selectedChat, 50);
          setMessages(chatMessages);
        } catch (err) {
          console.error('Error fetching messages:', err);
        }
      }
    };

    fetchMessages();
  }, [selectedChat]);

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedChat || !user?.uid) {
      return;
    }

    try {
      setSendingMessage(true);
      const conversation = conversations.find((c) => c.id === selectedChat);
      const recipientId = conversation?.participants.find((p) => p !== user.uid) || '';

      await sendMessage(selectedChat, user.uid, recipientId, message);

      // Refresh messages
      const chatMessages = await getMessages(selectedChat, 50);
      setMessages(chatMessages);
      setMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const getConversationName = (conversationId: string) => {
    const conversationNames: Record<string, string> = {
      '1': 'Fresh Produce Farm',
      '2': 'Customer Support',
      '3': "John's Farm Products",
      '4': 'Mary (Member)',
    };
    return conversationNames[conversationId] || 'Chat';
  };

  const getConversationAvatar = (conversationId: string) => {
    const avatars: Record<string, string> = {
      '1': '🏪',
      '2': '💬',
      '3': '👨‍🌾',
      '4': '👩',
    };
    return avatars[conversationId] || '💬';
  };

  const getTimeDisplay = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    const time = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return 'Earlier';
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">💬 Messages</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Conversations with sellers, support, and members</p>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">Loading conversations...</p>
        </div>
      )}

      {/* Conversations List */}
      {!loading && conversations.length > 0 ? (
        <div className="space-y-2">
          {conversations.map((chat) => (
            <button
              key={chat.id}
              onClick={() => setSelectedChat(chat.id)}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="relative text-2xl">{getConversationAvatar(chat.id)}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-white">{getConversationName(chat.id)}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{chat.lastMessage}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{getTimeDisplay(chat.lastMessageTime)}</p>
                  {chat.unreadCount > 0 && (
                    <span className="inline-block bg-red-600 text-white text-xs rounded-full px-2 py-1 mt-1">
                      {chat.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : !loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">No conversations yet. Start a new chat!</p>
        </div>
      ) : null}

      {/* Chat Dialog */}
      {selectedChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md h-96 max-h-screen flex flex-col">
            {/* Header */}
            <div className="border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getConversationAvatar(selectedChat)}</span>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">{getConversationName(selectedChat)}</h3>
                  <p className="text-xs text-green-600">Online</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedChat(null);
                  setMessages([]);
                }}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            {/* Message Area */}
            <div className="flex-1 p-4 bg-gray-50 dark:bg-gray-900 overflow-y-auto">
              {messages.length > 0 ? (
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`rounded-lg p-3 max-w-xs ${
                          msg.senderId === user?.uid
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-gray-500 dark:text-gray-400">No messages yet. Start the conversation!</p>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !sendingMessage) {
                    handleSendMessage();
                  }
                }}
                placeholder="Type your message..."
                disabled={sendingMessage}
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white disabled:opacity-50"
              />
              <button
                onClick={handleSendMessage}
                disabled={sendingMessage || !message.trim()}
                className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingMessage ? '...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
