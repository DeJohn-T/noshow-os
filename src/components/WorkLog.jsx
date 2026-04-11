import React, { useState, useEffect } from 'react'
import emailjs from '@emailjs/browser'
import {
  EMAILJS_SERVICE_ID,
  EMAILJS_TEMPLATE_ID,
  EMAILJS_PUBLIC_KEY,
  SENDER_NAME,
  RECIPIENTS,
} from '../lib/emailConfig'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const STORAGE_KEY = 'worklog_data_v1'

function getWeekStart(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function getWeekDates(weekStart) {
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })
}

function formatTime12h(time24) {
  if (!time24) return ''
  const [h, m] = time24.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`
}

function calcHours(start, end) {
  if (!start || !end) return 0
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return Math.max(0, (eh * 60 + em - (sh * 60 + sm)) / 60)
}

function fmtHours(h) {
  return parseFloat(h.toFixed(2)).toString()
}

function loadStored() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }
  catch { return {} }
}

function emptyDay() {
  return { didntWork: false, blocks: [{ start: '', end: '', notes: '' }] }
}

export function WorkLog({ profileName }) {
  const today = new Date()
  const weekStart = getWeekStart(today)
  const weekDates = getWeekDates(weekStart)
  const weekKey = weekStart.toISOString().split('T')[0]

  const [data, setData] = useState(() => loadStored()[weekKey] || {})
  const [activeDay, setActiveDay] = useState(() => {
    const idx = weekDates.findIndex(d => d.toDateString() === today.toDateString())
    return idx >= 0 ? idx : 0
  })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)
  const [preview, setPreview] = useState(false)

  useEffect(() => {
    const stored = loadStored()
    stored[weekKey] = data
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
  }, [data, weekKey])

  function getDayData(idx) {
    return data[idx] || emptyDay()
  }

  function updateDay(idx, updates) {
    setData(prev => ({ ...prev, [idx]: { ...getDayData(idx), ...updates } }))
  }

  function updateBlock(dayIdx, blockIdx, field, value) {
    const day = getDayData(dayIdx)
    const blocks = day.blocks.map((b, i) => i === blockIdx ? { ...b, [field]: value } : b)
    updateDay(dayIdx, { blocks })
  }

  function addBlock(dayIdx) {
    const day = getDayData(dayIdx)
    updateDay(dayIdx, { blocks: [...day.blocks, { start: '', end: '', notes: '' }] })
  }

  function removeBlock(dayIdx, blockIdx) {
    const day = getDayData(dayIdx)
    const blocks = day.blocks.filter((_, i) => i !== blockIdx)
    updateDay(dayIdx, { blocks: blocks.length ? blocks : [{ start: '', end: '', notes: '' }] })
  }

  function dayHours(dayData) {
    if (!dayData || dayData.didntWork) return 0
    return (dayData.blocks || []).reduce((s, b) => s + calcHours(b.start, b.end), 0)
  }

  function totalHours() {
    return Array.from({ length: 5 }, (_, i) => dayHours(data[i])).reduce((a, b) => a + b, 0)
  }

  function buildEmailBody() {
    const lines = ['Hi All,', '', "I hope you're doing well. Here is my work log for this week:", '']
    let hasContent = false

    for (let i = 0; i < 5; i++) {
      const d = data[i]
      if (!d) continue
      const date = weekDates[i]
      const label = `${date.getMonth() + 1}/${date.getDate()}`

      if (d.didntWork) {
        lines.push(`${DAYS[i]} (${label}) – Did not work`)
        lines.push('')
        hasContent = true
        continue
      }

      const blocks = (d.blocks || []).filter(b => b.start && b.end)
      if (!blocks.length) continue
      hasContent = true

      lines.push(`${DAYS[i]} (${label}) – ${fmtHours(dayHours(d))} hours`)
      for (const b of blocks) {
        lines.push(`${formatTime12h(b.start)} – ${formatTime12h(b.end)}`)
        b.notes.trim().split('\n').forEach(line => {
          const t = line.trim().replace(/^-\s*/, '')
          if (t) lines.push(`- ${t}`)
        })
        lines.push('')
      }
    }

    if (!hasContent) return null

    lines.push(`Total Hours: ${fmtHours(totalHours())}`)
    lines.push('')
    lines.push('Please let me know if you would like any additional details.')
    lines.push('')
    lines.push('Best,')
    lines.push(profileName || SENDER_NAME)

    return lines.join('\n')
  }

  async function handleSend() {
    const body = buildEmailBody()
    if (!body) { setError('Add at least one day of hours before sending.'); return }

    const configMissing = [EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY].some(v => v.startsWith('YOUR_'))
    if (configMissing) {
      setError('EmailJS not configured yet — fill in src/lib/emailConfig.js with your IDs.')
      return
    }

    setSending(true)
    setError(null)
    try {
      const weekOf = weekDates[0].toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        { week_of: weekOf, body, to_email: RECIPIENTS.join(', ') },
        EMAILJS_PUBLIC_KEY
      )
      setSent(true)
      setData({})
    } catch (err) {
      setError('Send failed. Check your EmailJS config and try again.')
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  const isMobile = window.innerWidth < 640
  const total = totalHours()
  const todayIdx = weekDates.findIndex(d => d.toDateString() === today.toDateString())
  const dayData = getDayData(activeDay)
  const activeDate = weekDates[activeDay]

  if (sent) {
    return (
      <div style={{ maxWidth: 520, margin: '4rem auto', padding: '2rem', textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #7c6fff, #4ade80)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 1.5rem' }}>✓</div>
        <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: 8 }}>Work log sent!</div>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 28 }}>
          Emailed to {RECIPIENTS.length} recipients.
        </div>
        <button
          onClick={() => setSent(false)}
          style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 12, padding: '10px 28px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: 14 }}
        >
          Start next week
        </button>
      </div>
    )
  }

  const emailPreview = buildEmailBody()

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: isMobile ? '1rem' : '1.5rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: 4 }}>Weekly Work Log</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {weekDates[0].toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} – {weekDates[4].toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
        {emailPreview && (
          <button
            onClick={() => setPreview(p => !p)}
            style={{ background: 'var(--surface-3)', border: '1px solid var(--border-strong)', borderRadius: 10, padding: '7px 14px', fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font-sans)', flexShrink: 0 }}
          >
            {preview ? 'Hide preview' : 'Preview email'}
          </button>
        )}
      </div>

      {/* Email preview */}
      {preview && emailPreview && (
        <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 16, padding: '1.25rem', marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 10 }}>Email Preview</div>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.7, fontFamily: 'var(--font-sans)', margin: 0 }}>{emailPreview}</pre>
        </div>
      )}

      {/* Day selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 2 }}>
        {DAYS.map((day, i) => {
          const d = weekDates[i]
          const hrs = dayHours(data[i])
          const isFuture = todayIdx >= 0 && i > todayIdx
          const isToday = i === todayIdx
          const isActive = i === activeDay
          const hasEntry = data[i] && (data[i].didntWork || (data[i].blocks || []).some(b => b.start || b.notes.trim()))

          return (
            <button
              key={i}
              onClick={() => setActiveDay(i)}
              style={{
                flexShrink: 0, minWidth: 64, padding: '8px 10px', borderRadius: 14, cursor: 'pointer',
                border: isActive ? '2px solid var(--accent)' : '2px solid var(--border)',
                background: isActive ? 'rgba(124,111,255,0.12)' : 'var(--surface-2)',
                opacity: isFuture ? 0.35 : 1,
                textAlign: 'center', transition: 'all 0.15s',
              }}
            >
              <div style={{ fontSize: 10, color: isActive ? 'var(--accent)' : 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{day.slice(0, 3)}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: isActive ? 'var(--accent)' : 'var(--text-primary)', marginTop: 2, fontFamily: 'var(--font-display)' }}>{d.getDate()}</div>
              <div style={{ fontSize: 10, marginTop: 3, height: 14 }}>
                {isToday && <span style={{ color: 'var(--accent)', fontWeight: 700 }}>TODAY</span>}
                {!isToday && hasEntry && <span style={{ color: data[i]?.didntWork ? 'var(--text-tertiary)' : '#4ade80' }}>{data[i]?.didntWork ? 'OFF' : `${fmtHours(hrs)}h`}</span>}
              </div>
            </button>
          )
        })}
      </div>

      {/* Day card */}
      <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 20, padding: '1.5rem', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-display)' }}>
              {DAYS[activeDay]}, {activeDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
            {!dayData.didntWork && dayHours(dayData) > 0 && (
              <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{fmtHours(dayHours(dayData))} hrs</span>
            )}
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={dayData.didntWork || false}
              onChange={e => updateDay(activeDay, { didntWork: e.target.checked })}
              style={{ accentColor: 'var(--accent)', width: 15, height: 15, cursor: 'pointer' }}
            />
            Didn't work
          </label>
        </div>

        {dayData.didntWork ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13, background: 'var(--surface-3)', borderRadius: 12 }}>
            No hours logged — will note "Did not work" in the email.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(dayData.blocks || [emptyDay().blocks[0]]).map((block, bi) => (
              <div key={bi} style={{ background: 'var(--surface-3)', borderRadius: 14, padding: '1rem 1rem 0.75rem', position: 'relative' }}>
                {(dayData.blocks?.length || 0) > 1 && (
                  <button
                    onClick={() => removeBlock(activeDay, bi)}
                    style={{ position: 'absolute', top: 8, right: 10, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: 20, lineHeight: 1, padding: '0 4px' }}
                    title="Remove block"
                  >×</button>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                  <input
                    type="time"
                    value={block.start}
                    onChange={e => updateBlock(activeDay, bi, 'start', e.target.value)}
                    style={timeStyle}
                  />
                  <span style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>–</span>
                  <input
                    type="time"
                    value={block.end}
                    onChange={e => updateBlock(activeDay, bi, 'end', e.target.value)}
                    style={timeStyle}
                  />
                  {block.start && block.end && calcHours(block.start, block.end) > 0 && (
                    <span style={{ fontSize: 12, color: '#4ade80', fontWeight: 600 }}>
                      {fmtHours(calcHours(block.start, block.end))}h
                    </span>
                  )}
                </div>
                <textarea
                  value={block.notes}
                  onChange={e => updateBlock(activeDay, bi, 'notes', e.target.value)}
                  placeholder={'What did you work on? (one item per line)'}
                  rows={3}
                  style={notesStyle}
                />
              </div>
            ))}

            <button
              onClick={() => addBlock(activeDay)}
              style={{ alignSelf: 'flex-start', background: 'transparent', border: '1px dashed var(--border-strong)', borderRadius: 10, padding: '7px 16px', fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'border-color 0.15s' }}
            >
              + Add time block
            </button>
          </div>
        )}
      </div>

      {/* Total + Send */}
      <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 16, padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, marginBottom: 4 }}>Week Total</div>
          <div style={{ fontSize: 32, fontWeight: 800, fontFamily: 'var(--font-display)', color: total > 0 ? 'var(--accent)' : 'var(--text-tertiary)', lineHeight: 1 }}>
            {fmtHours(total)}<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-tertiary)', marginLeft: 5 }}>hours</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <button
            onClick={handleSend}
            disabled={sending || total === 0}
            style={{
              background: total > 0 ? 'linear-gradient(135deg, #7c6fff, #4ade80)' : 'var(--surface-3)',
              color: total > 0 ? '#fff' : 'var(--text-tertiary)',
              border: 'none', borderRadius: 12, padding: '10px 24px',
              fontSize: 14, fontWeight: 700, cursor: total > 0 && !sending ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--font-display)', opacity: sending ? 0.7 : 1, transition: 'opacity 0.15s',
            }}
          >
            {sending ? 'Sending...' : 'Send Work Log'}
          </button>
          {error && (
            <div style={{ fontSize: 12, color: '#f87171', maxWidth: 260, textAlign: 'right', lineHeight: 1.4 }}>{error}</div>
          )}
        </div>
      </div>

    </div>
  )
}

const timeStyle = {
  background: 'var(--surface-2)', color: 'var(--text-primary)',
  border: '1px solid var(--border-strong)', borderRadius: 8,
  padding: '6px 10px', fontSize: 13, fontFamily: 'var(--font-sans)', outline: 'none',
}

const notesStyle = {
  width: '100%', background: 'var(--surface-2)', color: 'var(--text-primary)',
  border: '1px solid var(--border)', borderRadius: 10,
  padding: '8px 12px', fontSize: 13, fontFamily: 'var(--font-sans)',
  resize: 'vertical', outline: 'none', lineHeight: 1.65,
  boxSizing: 'border-box', display: 'block',
}
