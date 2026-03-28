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

export function statusColor(status) {
  return {
    new: { bg: 'var(--blue-bg)', color: 'var(--blue-text)' },
    scheduled: { bg: 'var(--green-bg)', color: 'var(--green-text)' },
    completed: { bg: 'var(--gray-bg)', color: 'var(--gray-text)' },
    'followed up': { bg: 'var(--green-bg)', color: 'var(--green-text)' },
  }[status] || { bg: 'var(--blue-bg)', color: 'var(--blue-text)' }
}

export function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}
