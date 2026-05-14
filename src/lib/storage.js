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
export function loadScheduledTasks(user) {
  try { return JSON.parse(localStorage.getItem(k(user, 'scheduled_tasks_v1')) || '[]') }
  catch { return [] }
}
export function saveScheduledTasks(user, tasks) {
  try { localStorage.setItem(k(user, 'scheduled_tasks_v1'), JSON.stringify(tasks)) }
  catch (e) { console.error(e) }
}
export function loadJobRecs(user) {
  try {
    const raw = localStorage.getItem(k(user, 'jobrecs_v1'))
    if (!raw) return null
    const { jobs, date } = JSON.parse(raw)
    return date === new Date().toDateString() ? jobs : null
  } catch { return null }
}
export function saveJobRecs(user, jobs) {
  try { localStorage.setItem(k(user, 'jobrecs_v1'), JSON.stringify({ jobs, date: new Date().toDateString() })) }
  catch (e) { console.error(e) }
}

export function exportBackup(username) {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    username,
    users: loadUsers(),
    contacts: loadContacts(username),
    profile: loadProfile(username),
    todos: loadTodos(username),
    scheduledTasks: loadScheduledTasks(username),
    brainDump: loadBrainDump(username),
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `noshow-backup-${username}-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function importBackup(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target.result)
        if (!data.version || !data.username) { reject(new Error('Invalid backup file')); return }
        const existing = loadUsers()
        const merged = [...existing]
        for (const u of (data.users || [])) {
          if (!merged.find(ex => ex.username.toLowerCase() === u.username.toLowerCase())) merged.push(u)
        }
        saveUsers(merged)
        if (data.contacts) saveContacts(data.username, data.contacts)
        if (data.profile) saveProfile(data.username, data.profile)
        if (data.todos) saveTodos(data.username, data.todos)
        if (data.scheduledTasks) saveScheduledTasks(data.username, data.scheduledTasks)
        if (data.brainDump) saveBrainDump(data.username, data.brainDump)
        resolve(data.username)
      } catch (err) { reject(err) }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}
