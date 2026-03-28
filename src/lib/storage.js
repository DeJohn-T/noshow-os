// lib/storage.js — Supabase-backed storage

import { supabase } from './supabase.js'

// ─── Session (local only, no need to sync) ────────────────────────────────────
const SESSION_KEY = 'nos_session_v1'
const SESSION_ID_KEY = 'nos_session_id_v1'

export function getCurrentUser() {
  try { return sessionStorage.getItem(SESSION_KEY) || null }
  catch { return null }
}
function getCurrentUserId() {
  try { return sessionStorage.getItem(SESSION_ID_KEY) || null }
  catch { return null }
}
export function setCurrentUser(username, id) {
  try {
    sessionStorage.setItem(SESSION_KEY, username)
    if (id) sessionStorage.setItem(SESSION_ID_KEY, id)
  } catch (e) { console.error(e) }
}
export function clearCurrentUser() {
  try {
    sessionStorage.removeItem(SESSION_KEY)
    sessionStorage.removeItem(SESSION_ID_KEY)
  } catch (e) { console.error(e) }
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function findUser(username) {
  const { data } = await supabase
    .from('users')
    .select('id, username, pin')
    .ilike('username', username.trim())
    .maybeSingle()
  return data
}

export async function createUser(username, pin) {
  const { data, error } = await supabase
    .from('users')
    .insert({ username: username.trim(), pin })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

// ─── Per-user KV helpers ──────────────────────────────────────────────────────
async function getVal(key) {
  const userId = getCurrentUserId()
  if (!userId) return null
  const { data } = await supabase
    .from('user_data')
    .select('value')
    .eq('user_id', userId)
    .eq('key', key)
    .maybeSingle()
  return data?.value ?? null
}

async function setVal(key, value) {
  const userId = getCurrentUserId()
  if (!userId) return
  await supabase
    .from('user_data')
    .upsert({ user_id: userId, key, value, updated_at: new Date().toISOString() }, { onConflict: 'user_id,key' })
}

// ─── Data accessors (user param kept for call-site compatibility, ignored) ───
export async function loadContacts(_user) {
  return (await getVal('contacts')) ?? []
}
export async function saveContacts(_user, c) {
  setVal('contacts', c) // fire-and-forget
}

export async function loadProfile(_user) {
  return await getVal('profile')
}
export async function saveProfile(_user, p) {
  setVal('profile', p)
}

export async function loadTodos(_user) {
  return (await getVal('todos')) ?? []
}
export async function saveTodos(_user, t) {
  setVal('todos', t)
}

export async function loadBrainDump(_user) {
  return (await getVal('braindump')) ?? []
}
export async function saveBrainDump(_user, notes) {
  setVal('braindump', notes)
}

export async function loadScheduledTasks(_user) {
  return (await getVal('scheduled_tasks')) ?? []
}
export async function saveScheduledTasks(_user, tasks) {
  setVal('scheduled_tasks', tasks)
}

export async function loadQuotes(_user) {
  try {
    const raw = await getVal('quotes')
    if (!raw) return null
    const { quotes, date } = raw
    return date === new Date().toDateString() ? quotes : null
  } catch { return null }
}
export async function saveQuotes(_user, quotes) {
  setVal('quotes', { quotes, date: new Date().toDateString() })
}
