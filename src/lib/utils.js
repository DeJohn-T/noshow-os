// lib/utils.js

export function initials(name) {
  if (!name) return '?'
  return name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export const STATUS_OPTIONS = [
  { value: 'schedule', label: 'Schedule', accent: '#8fe3ff', bg: 'rgba(143, 227, 255, 0.12)', border: 'rgba(143, 227, 255, 0.28)' },
  { value: 'scheduled', label: 'Scheduled', accent: '#a7f3ba', bg: 'rgba(128, 226, 155, 0.13)', border: 'rgba(128, 226, 155, 0.28)' },
  { value: 'follow up', label: 'Follow up', accent: '#ff7aa8', bg: 'rgba(255, 122, 168, 0.14)', border: 'rgba(255, 122, 168, 0.3)' },
  { value: 'circle back', label: 'Circle back', accent: '#93c5fd', bg: 'rgba(99, 179, 255, 0.12)', border: 'rgba(99, 179, 255, 0.28)' },
  { value: 'one & done', label: 'One & done', accent: '#34d399', bg: 'rgba(52, 211, 153, 0.12)', border: 'rgba(52, 211, 153, 0.28)' },
  { value: 'followed up', label: 'Followed up', accent: '#c5ff5a', bg: 'rgba(197, 255, 90, 0.14)', border: 'rgba(197, 255, 90, 0.34)' },
  { value: 'complete', label: 'Complete', accent: '#d8d2c5', bg: 'rgba(216, 210, 197, 0.1)', border: 'rgba(216, 210, 197, 0.24)' },
]

const STATUS_ALIASES = {
  new: 'schedule',
  completed: 'follow up',
  'one-time': 'one & done',
}

const STATUS_META = Object.fromEntries(STATUS_OPTIONS.map(status => [status.value, status]))

export function normalizeStatus(status) {
  const key = String(status || 'schedule').toLowerCase()
  return STATUS_ALIASES[key] || key
}

export function statusMeta(status) {
  return STATUS_META[normalizeStatus(status)] || STATUS_META.schedule
}

export function statusLabel(status) {
  return statusMeta(status).label
}

export function statusColor(status) {
  const meta = statusMeta(status)
  return { bg: meta.bg, color: meta.accent, border: meta.border }
}

export function isPostChatStatus(status) {
  return ['follow up', 'circle back', 'one & done', 'followed up', 'complete'].includes(normalizeStatus(status))
}

export function isFinalStatus(status) {
  return ['one & done', 'followed up', 'complete'].includes(normalizeStatus(status))
}

export function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}
