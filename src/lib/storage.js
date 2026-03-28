// lib/storage.js

// ─── User auth (global, not namespaced) ───────────────────────────────────────
const USERS_KEY = 'nos_users_v1'
const SESSION_KEY = 'nos_session_v1'

export function loadUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]') }
  catch { return [] }
}
export function saveUsers(users) {
  try { localStorage.setItem(USERS_KEY, JSON.stringify(users)) }
  catch (e) { console.error(e) }
}
export function getCurrentUser() {
  try { return sessionStorage.getItem(SESSION_KEY) || null }
  catch { return null }
}
export function setCurrentUser(username) {
  try { sessionStorage.setItem(SESSION_KEY, username) }
  catch (e) { console.error(e) }
}
export function clearCurrentUser() {
  try { sessionStorage.removeItem(SESSION_KEY) }
  catch (e) { console.error(e) }
}

// ─── Per-user namespaced keys ─────────────────────────────────────────────────
function k(user, suffix) { return `nos_${user}_${suffix}` }

export function loadContacts(user) {
  try { return JSON.parse(localStorage.getItem(k(user, 'contacts_v2')) || '[]') }
  catch { return [] }
}
export function saveContacts(user, c) {
  try { localStorage.setItem(k(user, 'contacts_v2'), JSON.stringify(c)) }
  catch (e) { console.error(e) }
}
export function loadProfile(user) {
  try {
    const raw = localStorage.getItem(k(user, 'profile_v3'))
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}
export function saveProfile(user, p) {
  try { localStorage.setItem(k(user, 'profile_v3'), JSON.stringify(p)) }
  catch (e) { console.error(e) }
}
export function loadQuotes(user) {
  try {
    const raw = localStorage.getItem(k(user, 'quotes_v1'))
    if (!raw) return null
    const { quotes, date } = JSON.parse(raw)
    return date === new Date().toDateString() ? quotes : null
  } catch { return null }
}
export function saveQuotes(user, quotes) {
  try { localStorage.setItem(k(user, 'quotes_v1'), JSON.stringify({ quotes, date: new Date().toDateString() })) }
  catch (e) { console.error(e) }
}
export function loadTodos(user) {
  try { return JSON.parse(localStorage.getItem(k(user, 'todos_v1')) || '[]') }
  catch { return [] }
}
export function saveTodos(user, t) {
  try { localStorage.setItem(k(user, 'todos_v1'), JSON.stringify(t)) }
  catch (e) { console.error(e) }
}
export function loadBrainDump(user) {
  try { return JSON.parse(localStorage.getItem(k(user, 'braindump_v1')) || '[]') }
  catch { return [] }
}
export function saveBrainDump(user, notes) {
  try { localStorage.setItem(k(user, 'braindump_v1'), JSON.stringify(notes)) }
  catch (e) { console.error(e) }
}
