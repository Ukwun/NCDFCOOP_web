'use client';

export function isDevAutologin(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(window.localStorage.getItem('dev_autologin'));
}

export function getDevAutologinUser(): Record<string, any> | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem('dev_autologin');
  if (!raw) return null;

  try {
    return JSON.parse(raw) as Record<string, any>;
  } catch {
    return null;
  }
}
