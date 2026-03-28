// components/ContactList.jsx

import React, { useState } from 'react'
import { Avatar, StatusBadge } from './UI'
import { formatDate } from '../lib/utils'

function getLogoUrl(company) {
  if (!company) return null
  const domain = company
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .join('')
    + '.com'
  return `https://logo.clearbit.com/${domain}`
}

function getStatusColor(status) {
  switch (status) {
    case 'new': return { bg: 'rgba(139,127,255,0.08)', border: 'rgba(139,127,255,0.25)', accent: '#a78bfa' }
    case 'scheduled': return { bg: 'rgba(74,222,128,0.08)', border: 'rgba(74,222,128,0.25)', accent: '#4ade80' }
    case 'completed': return { bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.25)', accent: '#fbbf24' }
    case 'followed up': return { bg: 'rgba(244,114,182,0.08)', border: 'rgba(244,114,182,0.25)', accent: '#f472b6' }
    default: return { bg: 'var(--surface)', border: 'var(--border)', accent: 'var(--text-tertiary)' }
  }
}

function LogoBg({ company }) {
  const url = getLogoUrl(company)
  if (!url) return null
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      backgroundImage: `url(${url})`,
      backgroundSize: '120px',
      backgroundPosition: 'right -10px center',
      backgroundRepeat: 'no-repeat',
      filter: 'blur(18px)',
      opacity: 0.07,
      zIndex: 0,
      borderRadius: 'inherit',
    }} />
  )
}

export function ContactList({ contacts, onSelect }) {
  if (contacts.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
        <div style={{ fontSize: 28, marginBottom: 12, opacity: 0.35 }}>☕</div>
        <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>No contacts yet</div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Add someone you want to connect with —<br />
          a recruiter, mentor, or professional you admire.
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {contacts.map(c => {
        const statusColors = getStatusColor(c.status)
        return (
          <div
            key={c.id}
            onClick={() => onSelect(c)}
            className="fade-in"
            style={{
              position: 'relative',
              overflow: 'hidden',
              background: statusColors.bg,
              border: `1px solid ${statusColors.border}`,
              borderRadius: 'var(--radius-lg)',
              padding: '0.9rem 1.1rem',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              cursor: 'pointer',
              transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = statusColors.accent
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = statusColors.border
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: statusColors.accent }} />
            <LogoBg company={c.company} />
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 12, width: '100%', paddingLeft: 3 }}>
              <Avatar name={c.name} company={c.company} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: 14, lineHeight: 1.3, color: statusColors.accent }}>{c.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {[c.role, c.company].filter(Boolean).join(' · ') || 'No role set'}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
                <StatusBadge status={c.status} />
                {c.chatDate && (
                  <span style={{ fontSize: 11, color: statusColors.accent }}>{formatDate(c.chatDate)}</span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function UpcomingList({ contacts, onSelect, onSchedule }) {
  const upcoming = contacts
    .filter(x => x.chatDate && x.status === 'scheduled')
    .sort((a, b) => new Date(a.chatDate + 'T12:00:00') - new Date(b.chatDate + 'T12:00:00'))

  const needsScheduling = contacts.filter(x => x.chatDate && x.status !== 'scheduled' && new Date(x.chatDate + 'T12:00:00') > new Date())

  if (upcoming.length === 0 && needsScheduling.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
        <div style={{ fontSize: 28, marginBottom: 12, opacity: 0.35 }}>📅</div>
        <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>Nothing scheduled</div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Set a chat date on any contact and click<br />"Schedule chat" to see them here.
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {needsScheduling.length > 0 && (
        <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 16, padding: '1.1rem 1.25rem', marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            ⚠️ {needsScheduling.length} meeting{needsScheduling.length > 1 ? 's' : ''} waiting to be scheduled
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {needsScheduling.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'rgba(251,191,36,0.06)', borderRadius: 10, border: '1px solid rgba(251,191,36,0.15)' }}>
                <Avatar name={c.name} company={c.company} size={28} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{[c.role, c.company].filter(Boolean).join(' · ')}</div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onSchedule && onSchedule(c) }}
                  style={{ background: '#fbbf24', color: '#000', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-display)', whiteSpace: 'nowrap' }}
                >
                  Schedule →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {upcoming.map(c => {
        const dt = new Date(c.chatDate + 'T12:00:00')
        const isToday = dt.toDateString() === new Date().toDateString()
        const isTomorrow = dt.toDateString() === new Date(Date.now() + 86400000).toDateString()
        const label = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
        return (
          <div
            key={c.id}
            onClick={() => onSelect(c)}
            style={{
              position: 'relative',
              overflow: 'hidden',
              background: isToday ? 'rgba(124,111,255,0.08)' : 'var(--surface)',
              border: `1px solid ${isToday ? 'rgba(124,111,255,0.25)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-lg)',
              padding: '0.9rem 1.1rem',
              display: 'flex',
              gap: 14,
              alignItems: 'center',
              cursor: 'pointer',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = isToday ? 'var(--accent)' : 'var(--border-strong)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = isToday ? 'rgba(124,111,255,0.25)' : 'var(--border)'}
          >
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: isToday ? 'var(--accent)' : 'var(--border-strong)' }} />
            <LogoBg company={c.company} />
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 14, alignItems: 'center', width: '100%', paddingLeft: 3 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: isToday ? 'var(--accent)' : 'var(--surface-3)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {isToday ? (
                  <span style={{ fontSize: 20 }}>☕</span>
                ) : (
                  <>
                    <span style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-display)', lineHeight: 1, color: 'var(--text-primary)' }}>{dt.getDate()}</span>
                    <span style={{ fontSize: 9, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{dt.toLocaleString('en-US', { month: 'short' })}</span>
                  </>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, fontFamily: 'var(--font-display)', color: isToday ? 'var(--accent)' : 'var(--text-primary)' }}>{c.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {[c.role, c.company].filter(Boolean).join(' · ')}
                </div>
                <div style={{ fontSize: 11, color: isToday ? 'var(--accent)' : 'var(--text-tertiary)', marginTop: 4, fontWeight: isToday ? 600 : 400 }}>
                  {label}{c.chatTime ? ` · ${c.chatTime}` : ''}
                </div>
              </div>
              <StatusBadge status={c.status} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Month Calendar View ──────────────────────────────────────────────────────────
export function MonthCalendar({ contacts, onSelect, onDayClick }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDay = firstDay.getDay()
  const totalDays = lastDay.getDate()

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1))
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1))
  const goToday = () => setCurrentMonth(new Date())

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const getMeetingsForDay = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return contacts.filter(c => c.chatDate === dateStr && c.status === 'scheduled')
  }

  const today = new Date()
  const isToday = (day) => today.getDate() === day && today.getMonth() === month && today.getFullYear() === year

  return (
    <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 20, padding: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={prevMonth} style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 16 }}>‹</button>
          <button onClick={goToday} style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Today</button>
          <button onClick={nextMonth} style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 16 }}>›</button>
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-display)' }}>{monthNames[month]} {year}</div>
        <div style={{ width: 100 }} />
      </div>

      {/* Day names */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, marginBottom: 8 }}>
        {dayNames.map(d => (
          <div key={d} style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', textAlign: 'center', padding: '8px 0', fontWeight: 600, letterSpacing: '0.05em' }}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
        {Array.from({ length: startDay }).map((_, i) => (
          <div key={`empty-${i}`} style={{ minHeight: 80 }} />
        ))}
        {Array.from({ length: totalDays }).map((_, i) => {
          const day = i + 1
          const meetings = getMeetingsForDay(day)
          const hasMeetings = meetings.length > 0
          const isTodayDay = isToday(day)
          return (
            <div
              key={day}
              onClick={() => {
                if (hasMeetings) { onSelect(meetings[0]) }
                else if (onDayClick) {
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                  onDayClick(dateStr)
                }
              }}
              style={{
                minHeight: 80,
                borderRadius: 8,
                padding: 6,
                cursor: 'pointer',
                background: isTodayDay ? 'rgba(124,111,255,0.08)' : 'var(--surface-3)',
                border: isTodayDay ? '1px solid rgba(124,111,255,0.3)' : '1px solid var(--border)',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = hasMeetings ? 'var(--accent)' : 'var(--border-strong)'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = isTodayDay ? 'rgba(124,111,255,0.3)' : 'var(--border)'
                e.currentTarget.style.transform = 'none'
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 600, color: isTodayDay ? 'var(--accent)' : 'var(--text-secondary)', marginBottom: 4 }}>{day}</div>
              {hasMeetings && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {meetings.slice(0, 3).map(m => (
                    <div key={m.id} style={{ fontSize: 9, background: 'rgba(74,222,128,0.15)', color: '#4ade80', padding: '2px 4px', borderRadius: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {m.name}
                    </div>
                  ))}
                  {meetings.length > 3 && (
                    <div style={{ fontSize: 9, color: 'var(--text-tertiary)', textAlign: 'center' }}>+{meetings.length - 3} more</div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 16, fontSize: 11, color: 'var(--text-tertiary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: 3, background: 'rgba(124,111,255,0.08)', border: '1px solid rgba(124,111,255,0.3)' }} />
          Today
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: 3, background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.3)' }} />
          Scheduled meeting
        </div>
      </div>
    </div>
  )
}