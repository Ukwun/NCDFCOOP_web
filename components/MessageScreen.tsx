'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, MessageCircle, Send } from 'lucide-react';
import { useAuth } from '@/lib/auth/authContext';
import {
  Conversation,
  Message,
  sendMessage,
  subscribeConversationMessages,
  subscribeUserConversations,
} from '@/lib/services/messageService';

function messageTime(message: Message) {
  const date = message.timestamp?.toDate?.();
  return date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
}

export default function MessageScreen() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const requestedConversation = searchParams?.get('conversation') || '';
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedChat, setSelectedChat] = useState(requestedConversation);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messageEnd = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    setLoading(true);
    return subscribeUserConversations(user.uid, (rows) => {
      setConversations(rows);
      setSelectedChat((current) =>
        current && rows.some((row) => row.id === current) ? current : rows[0]?.id || '',
      );
      setError('');
      setLoading(false);
    }, () => {
      setError('Conversations are temporarily unavailable. Please retry.');
      setLoading(false);
    });
  }, [user?.uid]);

  useEffect(() => {
    if (!selectedChat) {
      setMessages([]);
      return;
    }
    return subscribeConversationMessages(selectedChat, (rows) => {
      setMessages(rows);
      window.setTimeout(() => messageEnd.current?.scrollIntoView({ behavior: 'smooth' }), 30);
    }, () => setError('Messages could not synchronize. Please retry.'));
  }, [selectedChat]);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedChat) || null,
    [conversations, selectedChat],
  );
  const recipientId = selectedConversation?.participants.find((participant) => participant !== user?.uid) || '';
  const recipientName = recipientId
    ? selectedConversation?.participantNames?.[recipientId] || 'Marketplace user'
    : 'Conversation';

  async function submit(event: FormEvent) {
    event.preventDefault();
    const content = message.trim();
    if (!content || !selectedChat || !user?.uid || !recipientId) return;
    setSending(true);
    setError('');
    try {
      await sendMessage(selectedChat, user.uid, recipientId, content);
      setMessage('');
    } catch {
      setError('Your message was not sent. Please retry.');
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-slate-100 px-3 py-4 text-slate-950 dark:bg-slate-950 dark:text-white sm:px-5">
      <div className="mx-auto grid min-h-[70vh] max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl dark:border-white/10 dark:bg-slate-900 md:grid-cols-[320px_1fr]">
        <aside className={`${selectedChat ? 'hidden md:block' : 'block'} border-r border-slate-200 dark:border-white/10`}>
          <div className="border-b border-slate-200 p-5 dark:border-white/10">
            <h1 className="flex items-center gap-2 text-xl font-black"><MessageCircle className="text-emerald-600"/>Messages</h1>
            <p className="mt-1 text-xs text-slate-500">Live inquiry conversations</p>
          </div>
          {loading ? <p className="p-5 text-sm text-slate-500">Loading conversations…</p> : conversations.length === 0 ? <div className="p-8 text-center text-sm text-slate-500">No conversations yet. Open chat from a product or inquiry.</div> : <div className="divide-y divide-slate-100 dark:divide-white/5">{conversations.map((conversation) => {
            const otherId = conversation.participants.find((participant) => participant !== user?.uid) || '';
            const name = conversation.participantNames?.[otherId] || 'Marketplace user';
            return <button key={conversation.id} onClick={() => setSelectedChat(conversation.id)} className={`w-full p-4 text-left transition hover:bg-emerald-50 dark:hover:bg-white/5 ${selectedChat === conversation.id ? 'bg-emerald-50 dark:bg-emerald-950/30' : ''}`}><p className="font-bold">{name}</p><p className="mt-0.5 text-xs font-medium text-emerald-700">{conversation.productName || 'Product inquiry'}</p><p className="mt-1 truncate text-sm text-slate-500">{conversation.lastMessage || 'Conversation opened'}</p></button>;
          })}</div>}
        </aside>

        <section className={`${selectedChat ? 'flex' : 'hidden md:flex'} min-w-0 flex-col`}>
          {selectedConversation ? <>
            <header className="flex items-center gap-3 border-b border-slate-200 p-4 dark:border-white/10">
              <button onClick={() => setSelectedChat('')} aria-label="Back to conversations" className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 md:hidden dark:border-white/10"><ArrowLeft size={18}/></button>
              <div><h2 className="font-black">{recipientName}</h2><p className="text-xs text-slate-500">{selectedConversation.productName || 'Product inquiry'} · messages update in real time</p></div>
            </header>
            {error && <p role="alert" className="border-b border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:bg-rose-950 dark:text-rose-200">{error}</p>}
            <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4 dark:bg-slate-950/60">
              {messages.length === 0 && <div className="grid h-full place-items-center text-center text-sm text-slate-500"><div><MessageCircle className="mx-auto mb-2" size={28}/><p>Start the conversation about this inquiry.</p></div></div>}
              {messages.map((item) => <div key={item.id} className={`flex ${item.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[82%] rounded-2xl px-4 py-2.5 shadow-sm ${item.senderId === user?.uid ? 'rounded-br-sm bg-emerald-700 text-white' : 'rounded-bl-sm bg-white text-slate-900 dark:bg-slate-800 dark:text-white'}`}><p className="whitespace-pre-wrap break-words text-sm">{item.content}</p><p className={`mt-1 text-[10px] ${item.senderId === user?.uid ? 'text-emerald-100' : 'text-slate-400'}`}>{messageTime(item)}</p></div></div>)}
              <div ref={messageEnd}/>
            </div>
            <form onSubmit={submit} className="flex gap-2 border-t border-slate-200 p-3 dark:border-white/10"><input value={message} onChange={(event) => setMessage(event.target.value)} maxLength={5000} placeholder={`Message ${recipientName}`} className="min-h-12 flex-1 rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"/><button disabled={sending || !message.trim()} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-emerald-700 px-5 font-bold text-white transition hover:bg-emerald-800 disabled:opacity-50"><Send size={17}/><span className="hidden sm:inline">{sending ? 'Sending…' : 'Send'}</span></button></form>
          </> : <div className="grid flex-1 place-items-center text-sm text-slate-500">Select a conversation.</div>}
        </section>
      </div>
    </main>
  );
}
