import { supabase } from './supabase';

const API_BASE = import.meta.env.VITE_APP_URL || '';

export async function analyzeEmail({ emailText, focus }) {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.access_token) {
    throw new Error('You must be logged in to scan emails.');
  }

  const response = await fetch(`${API_BASE}/api/analyze-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ emailText, focus }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'AI analysis failed');
  return data;
}
