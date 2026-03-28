// App.jsx
import React, { useState, useEffect } from 'react'
import { ContactList, UpcomingList, MonthCalendar } from './components/ContactList'
import { ContactDetail } from './components/ContactDetail'
import { Onboarding } from './components/Onboarding'
import { JobSearch } from './components/JobSearch'
import { Avatar, StatusBadge, GlobalStyles, Spinner } from './components/UI'
import { loadContacts, saveContacts, loadProfile, saveProfile, loadQuotes, saveQuotes, loadTodos, saveTodos, loadBrainDump, saveBrainDump, loadUsers, saveUsers, getCurrentUser, setCurrentUser, clearCurrentUser } from './lib/storage'
import { generateQuotes, analyzeResume } from './lib/ai'
import { extractTextFromPDF } from './lib/pdfParser'
import { parseResumePDF } from './lib/ai'
import { formatDate } from './lib/utils'

function getGreeting(name) {
  const h = new Date().getHours()
  const first = name ? name.split(' ')[0] : 'there'
  if (h < 12) return { line1: `Good morning,`, line2: first }
  if (h < 17) return { line1: `Good afternoon,`, line2: first }
  return { line1: `Good evening,`, line2: first }
}

// ─── Pro Tip Box ─────────────────────────────────────────────────────────────
const PRO_TIPS = [
  { icon: '📌', text: 'Upload LinkedIn PDFs for instant profiles — it pulls skills, experience, and more automatically.' },
  { icon: '🎯', text: 'Set chat dates on contacts to keep your meetings organized and get reminders.' },
  { icon: '✉️', text: 'Send follow-ups within 24 hours — the sooner you reach out, the stronger the connection.' },
  { icon: '☕', text: 'Prep briefs are your cheat code — generate one before every coffee chat.' },
  { icon: '🤝', text: "Mention something specific from their background — it shows you've done your homework." },
  { icon: '⚡', text: 'Add your skills and resume to get better, more personalized prep briefs and job matches.' },
]

function ProTipBox() {
  const [idx, setIdx] = useState(0)
  const [fade, setFade] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false)
      setTimeout(() => {
        setIdx(i => (i + 1) % PRO_TIPS.length)
        setFade(true)
      }, 300)
    }, 45000)
    return () => clearInterval(interval)
  }, [])

  const tip = PRO_TIPS[idx]
  return (
    <div style={{ background: 'linear-gradient(135deg, rgba(99,179,255,0.1), rgba(139,127,255,0.07), rgba(244,114,182,0.05))', border: '1px solid rgba(99,179,255,0.3)', borderRadius: 20, padding: '2rem 2.25rem', marginBottom: '1.5rem', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,179,255,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -20, left: -20, width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(244,114,182,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>💡</span> Pro Tip
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          {PRO_TIPS.map((_, i) => (
            <div key={i} style={{ width: i === idx ? 20 : 6, height: 6, borderRadius: 4, background: i === idx ? '#93c5fd' : 'rgba(147,197,253,0.2)', transition: 'all 0.3s ease' }} />
          ))}
        </div>
      </div>
      <div style={{ opacity: fade ? 1 : 0, transform: fade ? 'translateY(0)' : 'translateY(8px)', transition: 'opacity 0.35s ease, transform 0.35s ease', fontSize: 17, color: 'var(--text-primary)', lineHeight: 1.75, display: 'flex', alignItems: 'flex-start', gap: 14, fontWeight: 500 }}>
        <span style={{ fontSize: 28, flexShrink: 0, marginTop: 2 }}>{tip.icon}</span>
        <span>{tip.text}</span>
      </div>
    </div>
  )
}

// ─── Todo Input ──────────────────────────────────────────────────────────────
function TodoInput({ onAdd }) {
  const [input, setInput] = useState('')
  function add() {
    const t = input.trim()
    if (t) { onAdd(t); setInput('') }
  }
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
        placeholder="Add a task..."
        style={{ flex: 1, background: 'var(--surface-3)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', fontFamily: 'var(--font-sans)' }} />
      {input.trim() && (
        <button onClick={add} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-display)' }}>Add</button>
      )}
    </div>
  )
}

// ─── Todo List ──────────────────────────────────────────────────────────────
function TodoList({ todos, onToggle, onDelete }) {
  if (todos.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-tertiary)', fontSize: 13 }}>
        <div style={{ fontSize: 24, marginBottom: 8, opacity: 0.4 }}>✓</div>
        No tasks yet — add one to stay organized!
      </div>
    )
  }
  const pending = todos.filter(t => !t.done)
  const done = todos.filter(t => t.done)
  return (
    <div>
      {pending.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: done.length ? 12 : 0 }}>
          {pending.map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--surface-3)', borderRadius: 10, border: '1px solid var(--border)' }}>
              <button onClick={() => onToggle(t.id)} style={{ width: 18, height: 18, borderRadius: 4, border: '2px solid var(--accent)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--accent)', lineHeight: 0 }}>✓</span>
              </button>
              <span style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)' }}>{t.text}</span>
              <button onClick={() => onDelete(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: 16, lineHeight: 1, padding: '2px 4px' }}>×</button>
            </div>
          ))}
        </div>
      )}
      {done.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, opacity: 0.5 }}>
          {done.map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--surface-3)', borderRadius: 10, border: '1px solid var(--border)', textDecoration: 'line-through' }}>
              <button onClick={() => onToggle(t.id)} style={{ width: 18, height: 18, borderRadius: 4, border: '2px solid var(--accent)', background: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 12, color: '#fff', lineHeight: 0 }}>✓</span>
              </button>
              <span style={{ flex: 1, fontSize: 13, color: 'var(--text-tertiary)' }}>{t.text}</span>
              <button onClick={() => onDelete(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: 16, lineHeight: 1, padding: '2px 4px' }}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Skills Input ──────────────────────────────────────────────────────────────
const SKILL_SUGGESTIONS = [
  'Python','JavaScript','TypeScript','React','Node.js','SQL','Java','C++','C#','Go','Rust','Swift','Kotlin','R','MATLAB',
  'HTML','CSS','Tailwind CSS','Next.js','Vue.js','Angular','Flask','Django','FastAPI','Spring Boot','GraphQL','REST APIs',
  'AWS','Google Cloud','Azure','Docker','Kubernetes','Terraform','CI/CD','Git','GitHub','Linux','Bash',
  'Machine Learning','Deep Learning','Data Analysis','Data Visualization','Pandas','NumPy','TensorFlow','PyTorch','Scikit-learn',
  'Excel','PowerPoint','Google Sheets','Tableau','Power BI','Figma','Adobe XD','Photoshop','Illustrator','Canva',
  'Public Speaking','Leadership','Project Management','Agile','Scrum','Product Management','UX Research','User Testing',
  'Financial Modeling','Accounting','Valuation','Bloomberg Terminal','Pitch Decks','Market Research','CRM','Salesforce',
  'Content Writing','Copywriting','SEO','Social Media','Email Marketing','Google Analytics','A/B Testing','Growth Hacking',
  'Spanish','French','Mandarin','Arabic','German','Portuguese','Japanese','Korean',
  'Research','Data Collection','Qualitative Analysis','Quantitative Analysis','Survey Design','Statistics',
  'Video Editing','Podcast Production','Motion Graphics','Photography','3D Modeling',
  'Communication','Public Speaking','Storytelling','Active Listening','Written Communication','Presentation Skills',
  'Leadership','Team Leadership','Mentoring','Conflict Resolution','Decision Making','Delegation',
  'Teamwork','Collaboration','Cross-functional Collaboration','Relationship Building','Networking',
  'Problem Solving','Critical Thinking','Creative Thinking','Analytical Thinking','Strategic Thinking',
  'Time Management','Organization','Prioritization','Multitasking','Attention to Detail','Self-motivation',
  'Adaptability','Flexibility','Resilience','Emotional Intelligence','Empathy','Patience',
  'Work Ethic','Initiative','Accountability','Integrity','Professionalism','Dependability',
  'Customer Service','Client Relations','Negotiation','Persuasion','Sales','Networking',
  'Creativity','Innovation','Brainstorming','Design Thinking','Curiosity',
  'Coachability','Feedback Reception','Growth Mindset','Continuous Learning','Open-mindedness',
]

function SkillsInput({ skills, onChange, onPendingChange }) {
  const [input, setInput] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)

  const suggestions = input.trim().length > 0
    ? SKILL_SUGGESTIONS.filter(s => s.toLowerCase().startsWith(input.toLowerCase()) && !skills.includes(s)).slice(0, 6)
    : []

  function addSkill(val) {
    const t = (val || input).trim()
    if (t && !skills.includes(t)) onChange([...skills, t])
    setInput(''); setActiveIdx(0); if (onPendingChange) onPendingChange('')
  }
  function remove(s) { onChange(skills.filter(x => x !== s)) }

  function handleKey(e) {
    if (suggestions.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, suggestions.length - 1)); return }
      if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); return }
      if (e.key === 'Tab') { e.preventDefault(); addSkill(suggestions[activeIdx]); return }
    }
    if (e.key === 'Enter') { e.preventDefault(); addSkill(suggestions[activeIdx] || input) }
  }

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: skills.length ? 10 : 0 }}>
        {skills.map(s => (
          <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--accent-dim)', border: '1px solid var(--accent-glow)', color: '#c4bfff', borderRadius: 100, padding: '5px 12px', fontSize: 13 }}>
            {s}
            <button onClick={() => remove(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(196,191,255,0.5)', fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
          </span>
        ))}
      </div>
      <div style={{ position: 'relative', display: 'flex', gap: 8, marginTop: skills.length ? 8 : 0 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            value={input}
            onChange={e => { setInput(e.target.value); setActiveIdx(0); if (onPendingChange) onPendingChange(e.target.value) }}
            onKeyDown={handleKey}
            onBlur={() => setTimeout(() => setInput(i => i), 150)}
            placeholder="Type a skill — suggestions appear automatically..."
            style={{ width: '100%', background: 'var(--surface-3)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', fontFamily: 'var(--font-sans)', boxSizing: 'border-box' }}
          />
          {suggestions.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: 'var(--surface-2)', border: '1px solid var(--border-strong)', borderRadius: 10, overflow: 'hidden', zIndex: 50, boxShadow: 'var(--shadow-lg)' }}>
              {suggestions.map((s, i) => (
                <div key={s} onMouseDown={() => addSkill(s)}
                  style={{ padding: '8px 14px', fontSize: 13, cursor: 'pointer', background: i === activeIdx ? 'var(--accent-dim)' : 'transparent', color: i === activeIdx ? '#c4bfff' : 'var(--text-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {s}
                  {i === activeIdx && <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>Tab or Enter</span>}
                </div>
              ))}
            </div>
          )}
        </div>
        {input.trim() && (
          <button onClick={() => addSkill()} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-display)', flexShrink: 0 }}>Add</button>
        )}
      </div>
    </div>
  )
}

// ─── Streak + Score Helpers ──────────────────────────────────────────────────────
function getWeekKey(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  const jan1 = new Date(d.getFullYear(), 0, 1)
  const week = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7)
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`
}

function calcStreak(contacts) {
  const weeks = new Set(
    contacts
      .filter(c => (c.status === 'completed' || c.status === 'followed up') && c.chatDate)
      .map(c => getWeekKey(c.chatDate))
  )
  if (weeks.size === 0) return 0
  const todayKey = getWeekKey(new Date().toISOString().split('T')[0])
  const sorted = [...weeks].sort().reverse()
  let streak = 0
  let expected = todayKey
  // allow current week or last week as start
  for (const wk of sorted) {
    if (wk === expected || (streak === 0 && wk < expected)) {
      streak++
      const [yr, w] = wk.split('-W').map(Number)
      const prev = w === 1 ? `${yr - 1}-W52` : `${yr}-W${String(w - 1).padStart(2, '0')}`
      expected = prev
    } else break
  }
  return streak
}

function calcNetworkScore(contacts) {
  return contacts.reduce((score, c) => {
    score += 5
    if (c.status === 'scheduled') score += 8
    if (c.status === 'completed') score += 10
    if (c.status === 'followed up') score += 15
    if (c.brief) score += 5
    if (c.followUpText) score += 3
    if (c.parsedProfile && !c.parsedProfile.error) score += 4
    return score
  }, 0)
}

// ─── Debrief Modal ───────────────────────────────────────────────────────────────
const VIBES = [
  { label: '🔥 Crushed it', value: 'great', color: '#4ade80', bg: 'rgba(74,222,128,0.12)', border: 'rgba(74,222,128,0.3)' },
  { label: '👍 Solid', value: 'okay', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)' },
  { label: '😬 Awkward', value: 'awkward', color: '#f472b6', bg: 'rgba(244,114,182,0.12)', border: 'rgba(244,114,182,0.3)' },
]

function DebriefModal({ contact, onSave, onClose }) {
  const [vibe, setVibe] = useState('')
  const [note, setNote] = useState('')
  const [followUpDays, setFollowUpDays] = useState(null)

  function handleSave() {
    const target = followUpDays ? (() => { const d = new Date(); d.setDate(d.getDate() + followUpDays); return d.toISOString().split('T')[0] })() : null
    onSave({ debrief: { vibe, note }, followUpDate: target || contact.followUpDate })
  }

  return (
    <div style={{ background: 'var(--surface-2)', borderRadius: 20, border: '1px solid var(--border-strong)', padding: '1.75rem', width: '100%', maxWidth: 420, boxShadow: 'var(--shadow-lg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 17, fontWeight: 700, fontFamily: 'var(--font-display)' }}>☕ How'd it go?</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: 22, lineHeight: 1 }}>✕</button>
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>Quick debrief for your chat with <strong style={{ color: 'var(--text-primary)' }}>{contact.name}</strong></div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {VIBES.map(v => (
          <button key={v.value} onClick={() => setVibe(v.value)}
            style={{ flex: 1, padding: '10px 6px', borderRadius: 12, border: `1px solid ${vibe === v.value ? v.border : 'var(--border)'}`, background: vibe === v.value ? v.bg : 'var(--surface-3)', color: vibe === v.value ? v.color : 'var(--text-secondary)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 0.15s', textAlign: 'center' }}>
            {v.label}
          </button>
        ))}
      </div>
      <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Any quick notes while it's fresh..." rows={3}
        style={{ width: '100%', background: 'var(--surface-3)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)', borderRadius: 10, padding: '10px 12px', fontSize: 13, resize: 'none', fontFamily: 'var(--font-sans)', lineHeight: 1.6, outline: 'none', boxSizing: 'border-box', marginBottom: 16 }} />
      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Schedule follow-up?</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[7, 30, 60].map(days => (
          <button key={days} onClick={() => setFollowUpDays(followUpDays === days ? null : days)}
            style={{ flex: 1, padding: '8px', borderRadius: 10, border: `1px solid ${followUpDays === days ? 'var(--accent)' : 'var(--border)'}`, background: followUpDays === days ? 'var(--accent-dim)' : 'var(--surface-3)', color: followUpDays === days ? 'var(--accent)' : 'var(--text-secondary)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 0.15s' }}>
            {days}d
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={{ background: 'var(--surface-3)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 18px', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>Skip</button>
        <button onClick={handleSave} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 22px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-display)' }}>Save debrief →</button>
      </div>
    </div>
  )
}

// ─── Brain Dump Panel ────────────────────────────────────────────────────────────
function BrainDumpPanel({ onClose, user }) {
  const [notes, setNotes] = useState(() => loadBrainDump(user))
  const [input, setInput] = useState('')

  function add() {
    const t = input.trim()
    if (!t) return
    const updated = [{ id: Date.now(), text: t, ts: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) }, ...notes]
    setNotes(updated); saveBrainDump(user, updated); setInput('')
  }
  function remove(id) {
    const updated = notes.filter(n => n.id !== id)
    setNotes(updated); saveBrainDump(user, updated)
  }

  return (
    <div style={{ position: 'fixed', bottom: 80, right: 20, width: 320, background: 'var(--surface-2)', border: '1px solid var(--border-strong)', borderRadius: 20, padding: '1.25rem', boxShadow: 'var(--shadow-lg)', zIndex: 200 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>⚡</span> Quick Notes
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: 18, lineHeight: 1 }}>✕</button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder="Thought, idea, thing to remember..."
          autoFocus
          style={{ flex: 1, background: 'var(--surface-3)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none', fontFamily: 'var(--font-sans)' }} />
        <button onClick={add} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+</button>
      </div>
      <div style={{ maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {notes.length === 0 && <div style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center', padding: '1rem' }}>Nothing yet — dump your brain here</div>}
        {notes.map(n => (
          <div key={n.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: 'var(--surface-3)', borderRadius: 10, padding: '8px 10px', border: '1px solid var(--border)' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>{n.text}</div>
              <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 3 }}>{n.ts}</div>
            </div>
            <button onClick={() => remove(n.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: 15, lineHeight: 1, padding: '2px 4px', flexShrink: 0 }}>×</button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Network Map ─────────────────────────────────────────────────────────────────
const STATUS_COLORS = { new: '#a78bfa', scheduled: '#4ade80', completed: '#fbbf24', 'followed up': '#f472b6' }

const CONN_TYPES = [
  { key: 'company',  label: 'Current company', color: 'rgba(74,222,128,0.55)',  colorSolid: '#4ade80' },
  { key: 'pastco',   label: 'Past companies',   color: 'rgba(52,211,153,0.4)',   colorSolid: '#34d399' },
  { key: 'school',   label: 'School',           color: 'rgba(99,179,255,0.5)',   colorSolid: '#93c5fd' },
  { key: 'industry', label: 'Industry',         color: 'rgba(251,191,36,0.45)', colorSolid: '#fbbf24' },
  { key: 'location', label: 'Location',         color: 'rgba(244,114,182,0.45)', colorSolid: '#f472b6' },
]

const INDUSTRY_KEYWORDS = {
  tech:        ['engineer', 'developer', 'software', 'data', 'product', 'design', 'ux', 'ml', 'ai', 'cloud', 'devops', 'swe', 'frontend', 'backend', 'fullstack'],
  finance:     ['finance', 'investment', 'banking', 'analyst', 'trader', 'equity', 'capital', 'hedge', 'vc', 'pe', 'asset', 'wealth'],
  consulting:  ['consultant', 'consulting', 'strategy', 'mckinsey', 'bcg', 'bain', 'deloitte', 'advisory'],
  healthcare:  ['doctor', 'medical', 'health', 'hospital', 'clinical', 'pharma', 'biotech', 'nursing'],
  marketing:   ['marketing', 'brand', 'growth', 'content', 'seo', 'social', 'creative', 'media'],
  law:         ['lawyer', 'attorney', 'legal', 'counsel', 'law', 'paralegal'],
  sales:       ['sales', 'account', 'business development', 'bdr', 'sdr', 'revenue'],
}

function getIndustry(contact) {
  const text = [(contact.role || ''), (contact.company || ''), ...(contact.parsedProfile?.companies || [])].join(' ').toLowerCase()
  for (const [ind, kws] of Object.entries(INDUSTRY_KEYWORDS)) {
    if (kws.some(kw => text.includes(kw))) return ind
  }
  return null
}

function getLocation(contact) {
  const locs = contact.parsedProfile?.locations || []
  if (!locs.length) return null
  return locs[0].toLowerCase().split(/[,\s]+/).find(w => w.length > 3) || null
}

function buildEdges(nodes, activeTypes) {
  const EDU_STOP = new Set(['class', 'bachelor', 'master', 'degree', 'expected', 'science', 'arts', 'business', 'engineering'])
  const edges = []
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j]
      let matched = null

      if (activeTypes.has('company')) {
        const ac = (a.company || '').toLowerCase().trim()
        const bc = (b.company || '').toLowerCase().trim()
        if (ac && bc && ac === bc) matched = 'company'
      }
      if (!matched && activeTypes.has('pastco')) {
        const aAll = (a.parsedProfile?.companies || []).join(' ').toLowerCase()
        const bAll = (b.parsedProfile?.companies || []).join(' ').toLowerCase()
        const words = aAll.split(/[\s,()]+/).filter(w => w.length > 4 && !['senior','junior','intern','manager','engineer','lead','staff','present','associate','director'].includes(w))
        if (words.some(w => bAll.includes(w))) matched = 'pastco'
      }
      if (!matched && activeTypes.has('school')) {
        // Extract school name = text before first comma in each education entry
        const normSchool = e => e.split(/[,\n]/)[0].toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
        const aSchools = (a.parsedProfile?.education || []).map(normSchool).filter(s => s.length > 5)
        const bSchools = new Set((b.parsedProfile?.education || []).map(normSchool).filter(s => s.length > 5))
        if (aSchools.some(s => bSchools.has(s))) matched = 'school'
      }
      if (!matched && activeTypes.has('industry')) {
        const ai = getIndustry(a), bi = getIndustry(b)
        if (ai && bi && ai === bi) matched = 'industry'
      }
      if (!matched && activeTypes.has('location')) {
        const al = getLocation(a), bl = getLocation(b)
        if (al && bl && al === bl) matched = 'location'
      }

      if (matched) {
        const ct = CONN_TYPES.find(t => t.key === matched)
        edges.push({ a, b, type: matched, color: ct.color })
      }
    }
  }
  return edges
}

function NetworkMap({ contacts, onSelect }) {
  const [hovered, setHovered] = useState(null)
  const [activeTypes, setActiveTypes] = useState(new Set(['company', 'school', 'industry']))
  const MAX_EDGES = 25

  function toggleType(key) {
    setActiveTypes(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  if (contacts.length === 0) return (
    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-tertiary)', fontSize: 13 }}>
      <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>🕸️</div>
      Add contacts to see your network map
    </div>
  )

  const W = 700, H = 400
  const cx = W / 2, cy = H / 2
  const count = contacts.length
  const r = Math.min(cx - 70, cy - 60, 38 * Math.sqrt(count))

  const nodes = contacts.map((c, i) => ({
    ...c,
    x: count === 1 ? cx : cx + r * Math.cos((2 * Math.PI * i / count) - Math.PI / 2),
    y: count === 1 ? cy : cy + r * Math.sin((2 * Math.PI * i / count) - Math.PI / 2),
  }))

  const allEdges = buildEdges(nodes, activeTypes)
  const edges = allEdges.slice(0, MAX_EDGES)
  const clipped = allEdges.length > MAX_EDGES

  // For hovered node — find all connected nodes + their edge type
  const hoveredEdges = hovered ? edges.filter(e => e.a.id === hovered || e.b.id === hovered) : []
  const hoveredConnectedIds = new Set(hoveredEdges.flatMap(e => [e.a.id, e.b.id]))
  const isFiltering = hovered !== null

  // Sidebar info for hovered node
  const hoveredNode = hovered ? nodes.find(n => n.id === hovered) : null

  return (
    <div style={{ display: 'flex', gap: 16 }}>
      {/* Map */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Toggles */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 12 }}>
          {CONN_TYPES.map(ct => {
            const on = activeTypes.has(ct.key)
            return (
              <button key={ct.key} onClick={() => toggleType(ct.key)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 11px', borderRadius: 100, border: `1px solid ${on ? ct.colorSolid + '55' : 'var(--border)'}`, background: on ? ct.colorSolid + '15' : 'var(--surface-3)', color: on ? ct.colorSolid : 'var(--text-tertiary)', fontSize: 11, fontWeight: on ? 600 : 400, cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 0.15s' }}>
                <div style={{ width: 16, height: 2, background: on ? ct.colorSolid : 'var(--border)', borderRadius: 2 }} />
                {ct.label}
              </button>
            )
          })}
          <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-tertiary)', alignSelf: 'center' }}>
            {edges.length} link{edges.length !== 1 ? 's' : ''}{clipped ? ` (max ${MAX_EDGES})` : ''}
          </span>
        </div>

        {/* Status dots */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
          {Object.entries(STATUS_COLORS).map(([s, c]) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-tertiary)' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: c }} /> {s}
            </div>
          ))}
          {isFiltering && <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginLeft: 'auto' }}>Hover a node to highlight its connections</div>}
        </div>

        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', overflow: 'visible' }}>
          {/* Render dimmed edges first, then active ones on top */}
          {edges.map((e, i) => {
            const isActive = !isFiltering || (hoveredConnectedIds.has(e.a.id) && hoveredConnectedIds.has(e.b.id))
            const ct = CONN_TYPES.find(t => t.key === e.type)
            return (
              <line key={i}
                x1={e.a.x} y1={e.a.y} x2={e.b.x} y2={e.b.y}
                stroke={isActive ? ct.colorSolid : 'var(--border)'}
                strokeWidth={isActive ? 2.5 : 1}
                strokeOpacity={isActive ? 0.8 : 0.2}
                strokeDasharray={isActive ? 'none' : '3 4'}
                style={{ transition: 'stroke 0.2s, stroke-opacity 0.2s, stroke-width 0.2s' }}
              />
            )
          })}
          {nodes.map(n => {
            const isHov = hovered === n.id
            const isConnected = hoveredConnectedIds.has(n.id)
            const dimmed = isFiltering && !isHov && !isConnected
            const nc = STATUS_COLORS[n.status] || '#7c8cf8'
            return (
              <g key={n.id}
                onClick={() => onSelect(n)}
                onMouseEnter={() => setHovered(n.id)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: 'pointer', opacity: dimmed ? 0.25 : 1, transition: 'opacity 0.2s' }}>
                {/* Outer glow ring when hovered */}
                {isHov && <circle cx={n.x} cy={n.y} r={28} fill="none" stroke={nc} strokeWidth={1} strokeOpacity={0.25} />}
                <circle cx={n.x} cy={n.y} r={isHov ? 21 : isConnected ? 19 : 17}
                  fill={isHov ? nc + '33' : nc + '18'}
                  stroke={nc}
                  strokeWidth={isHov ? 2.5 : isConnected ? 2 : 1.5} />
                <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize={isHov ? 11 : 10} fill={nc} fontWeight="700" fontFamily="var(--font-display)">
                  {n.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </text>
                <text x={n.x} y={n.y + 33} textAnchor="middle" fontSize={9} fill={isHov ? 'var(--text-primary)' : 'var(--text-secondary)'} fontWeight={isHov ? '600' : '400'} fontFamily="var(--font-sans)">
                  {n.name.split(' ')[0]}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Hover info panel */}
      <div style={{ width: 280, flexShrink: 0 }}>
        {hoveredNode ? (
          <div style={{ background: 'var(--surface-3)', border: '1px solid var(--border-strong)', borderRadius: 14, padding: '18px', height: '100%', boxSizing: 'border-box' }}>
            <div style={{ fontWeight: 700, fontSize: 16, fontFamily: 'var(--font-display)', color: STATUS_COLORS[hoveredNode.status] || 'var(--text-primary)', marginBottom: 4 }}>{hoveredNode.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.5 }}>
              {[hoveredNode.role, hoveredNode.company].filter(Boolean).join(' · ') || 'No role set'}
            </div>
            {hoveredEdges.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>No connections with current filters</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 4 }}>Connected to</div>
                {hoveredEdges.map((e, i) => {
                  const other = e.a.id === hoveredNode.id ? e.b : e.a
                  const ct = CONN_TYPES.find(t => t.key === e.type)
                  return (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 10, border: `1px solid ${ct.colorSolid}33` }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{other.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{[other.role, other.company].filter(Boolean).join(' · ')}</div>
                      <div style={{ fontSize: 11, color: ct.colorSolid, display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                        <div style={{ width: 14, height: 2, background: ct.colorSolid, borderRadius: 2 }} />
                        {ct.label}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          <div style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <div style={{ fontSize: 28, opacity: 0.3 }}>👆</div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center', lineHeight: 1.6 }}>Hover a node to see their connections</div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Edit Profile Modal ─────────────────────────────────────────────────────────
function EditProfileModal({ profile, onSave, onClose }) {
  const [name, setName] = useState(profile.name || '')
  const [school, setSchool] = useState(profile.school || '')
  const [major, setMajor] = useState(profile.major || '')
  const [goals, setGoals] = useState(profile.goals || '')
  const [skills, setSkills] = useState(profile.skills || [])
  const [pendingSkill, setPendingSkill] = useState('')

  const inp = { width: '100%', background: 'var(--surface-3)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)', borderRadius: 8, padding: '9px 12px', fontSize: 14, outline: 'none', fontFamily: 'var(--font-sans)', marginBottom: 16 }

  return (
    <div style={{ background: 'var(--surface-2)', borderRadius: 20, border: '1px solid var(--border-strong)', padding: '1.75rem', width: '100%', maxWidth: 460, boxShadow: 'var(--shadow-lg)', maxHeight: '85vh', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-display)' }}>Edit Profile</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: 22, lineHeight: 1 }}>✕</button>
      </div>
      {[['Name', name, setName], ['School', school, setSchool], ['Major', major, setMajor]].map(([label, val, setter]) => (
        <div key={label}>
          <label style={{ display: 'block', fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</label>
          <input value={val} onChange={e => setter(e.target.value)} style={inp} />
        </div>
      ))}
      <label style={{ display: 'block', fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Goal</label>
      <textarea value={goals} onChange={e => setGoals(e.target.value)} rows={3} style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} />
      <label style={{ display: 'block', fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Skills</label>
      <SkillsInput skills={skills} onChange={setSkills} onPendingChange={setPendingSkill} />
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
        <button onClick={onClose} style={{ background: 'var(--surface-3)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 18px', fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>Cancel</button>
        <button onClick={() => {
          const finalSkills = pendingSkill.trim() && !skills.includes(pendingSkill.trim()) ? [...skills, pendingSkill.trim()] : skills
          onSave({ ...profile, name: name.trim(), school: school.trim(), major: major.trim(), goals: goals.trim(), skills: finalSkills })
        }} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-display)' }}>Save</button>
      </div>
    </div>
  )
}

// ─── Add Contact Modal ──────────────────────────────────────────────────────────
function AddModal({ onAdd, onClose }) {
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [company, setCompany] = useState('')
  const inp = { width: '100%', background: 'var(--surface-3)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)', borderRadius: 8, padding: '9px 12px', fontSize: 14, outline: 'none', fontFamily: 'var(--font-sans)', marginBottom: 14 }
  return (
    <div style={{ background: 'var(--surface-2)', borderRadius: 20, border: '1px solid var(--border-strong)', padding: '1.75rem', width: '100%', maxWidth: 440, boxShadow: 'var(--shadow-lg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 17, fontWeight: 700, fontFamily: 'var(--font-display)' }}>New contact</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: 22, lineHeight: 1 }}>✕</button>
      </div>
      <label style={{ display: 'block', fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Full name</label>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Alex Chen" autoFocus style={inp} />
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Role</label>
          <input value={role} onChange={e => setRole(e.target.value)} placeholder="Senior SWE" style={inp} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Company</label>
          <input value={company} onChange={e => setCompany(e.target.value)} placeholder="Amazon" style={inp} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={{ background: 'var(--surface-3)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 18px', fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>Cancel</button>
        <button onClick={() => { if (name.trim()) onAdd({ name, role, company }) }} disabled={!name.trim()}
          style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontSize: 14, fontWeight: 600, cursor: name.trim() ? 'pointer' : 'not-allowed', opacity: name.trim() ? 1 : 0.4, fontFamily: 'var(--font-display)' }}>
          Add contact
        </button>
      </div>
    </div>
  )
}

// ─── Schedule Meeting Modal ─────────────────────────────────────────────────────
function ScheduleModal({ contacts, onSchedule, onClose, prefillDate }) {
  const [contactId, setContactId] = useState(contacts[0]?.id || '')
  const [date, setDate] = useState(prefillDate || '')
  const [time, setTime] = useState('10:00')
  const inp = { width: '100%', background: 'var(--surface-3)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)', borderRadius: 8, padding: '9px 12px', fontSize: 14, outline: 'none', fontFamily: 'var(--font-sans)', marginBottom: 14 }
  const contact = contacts.find(c => c.id === Number(contactId)) || contacts[0]

  function handleSchedule() {
    if (!contact || !date) return
    const [h, m] = time.split(':').map(Number)
    const endH = String(h + 1).padStart(2, '0')
    const endTime = `${endH}:${String(m).padStart(2, '0')}`
    const title = encodeURIComponent(`Coffee Chat · ${contact.name}`)
    const details = encodeURIComponent(`${contact.role || ''}${contact.company ? ' at ' + contact.company : ''}`)
    const dateStr = date.replace(/-/g, '')
    window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dateStr}T${time.replace(':','')}00/${dateStr}T${endTime.replace(':','')}00&details=${details}`, '_blank')
    onSchedule(contact, date)
    onClose()
  }

  return (
    <div style={{ background: 'var(--surface-2)', borderRadius: 20, border: '1px solid var(--border-strong)', padding: '1.75rem', width: '100%', maxWidth: 420, boxShadow: 'var(--shadow-lg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 17, fontWeight: 700, fontFamily: 'var(--font-display)' }}>📅 Schedule Meeting</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: 22, lineHeight: 1 }}>✕</button>
      </div>
      <label style={{ display: 'block', fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Contact</label>
      <select value={contactId} onChange={e => setContactId(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
        {contacts.map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ''}</option>)}
      </select>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inp} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Time</label>
          <input type="time" value={time} onChange={e => setTime(e.target.value)} style={inp} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={{ background: 'var(--surface-3)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 18px', fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>Cancel</button>
        <button onClick={handleSchedule} disabled={!date} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontSize: 14, fontWeight: 600, cursor: date ? 'pointer' : 'not-allowed', opacity: date ? 1 : 0.4, fontFamily: 'var(--font-display)' }}>
          Schedule →
        </button>
      </div>
    </div>
  )
}

// ─── Resume Tab ──────────────────────────────────────────────────────────────────
const RESUME_TIPS = [
  { icon: '📏', title: 'Keep it to one page', body: 'For students and recent grads, one page is the standard. Recruiters spend ~7 seconds on a first scan.' },
  { icon: '🎯', title: 'Lead with impact numbers', body: 'Replace "helped with marketing" with "grew Instagram engagement 40% in 3 months." Quantify everything you can.' },
  { icon: '🤖', title: 'Beat the ATS bots', body: "Most companies use applicant tracking software. Mirror exact keywords from the job description — don't paraphrase." },
  { icon: '💼', title: 'Tailor for every role', body: 'Keep a master resume and create a trimmed, targeted version for each application. Generic resumes get filtered out.' },
  { icon: '✍️', title: 'Start every bullet with an action verb', body: '"Led," "Built," "Designed," "Increased" — not "Responsible for" or "Helped with."' },
  { icon: '🧹', title: 'Ruthless formatting', body: 'Consistent fonts, aligned margins, no photos. Save as PDF. Name it "FirstLast_Resume.pdf" — not "resume_FINAL_v3.pdf".' },
]

function ResumeTab({ resume, profile, onUpdateResume }) {
  const [analysis, setAnalysis] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = React.useRef()

  const parsed = resume?.parsed && !resume.parsed.error ? resume.parsed : null

  async function handleAnalyze() {
    setAnalyzing(true); setAnalyzeError('')
    try {
      const raw = await analyzeResume(resume, profile)
      const result = JSON.parse(raw.replace(/```json|```/g, '').trim())
      setAnalysis(result)
    } catch { setAnalyzeError('Analysis failed. Try again.') }
    finally { setAnalyzing(false) }
  }

  async function handleReupload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const text = await extractTextFromPDF(file)
      let parsedResult = null
      try {
        const raw = await parseResumePDF(text)
        parsedResult = JSON.parse(raw.replace(/```json|```/g, '').trim())
      } catch {}
      onUpdateResume(file.name, text, parsedResult)
      setAnalysis(null)
    } catch {}
    finally { setUploading(false) }
  }

  const scoreColor = s => s >= 85 ? '#4ade80' : s >= 70 ? '#fbbf24' : s >= 50 ? '#fb923c' : '#f87171'

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: 4 }}>Resume</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {resume ? `Uploaded: ${profile?.resumeName || 'resume.pdf'}` : 'No resume uploaded yet'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input ref={fileRef} type="file" accept="application/pdf" style={{ display: 'none' }} onChange={handleReupload} />
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'var(--surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border-strong)', borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
            {uploading ? <Spinner /> : '↑'} {resume ? 'Replace resume' : 'Upload resume'}
          </button>
          {resume && (
            <button onClick={handleAnalyze} disabled={analyzing}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: analyzing ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-sans)', opacity: analyzing ? 0.7 : 1 }}>
              {analyzing ? <><Spinner />Analyzing…</> : '✦ AI Analysis'}
            </button>
          )}
        </div>
      </div>

      {!resume ? (
        /* No resume — show upload prompt + tips */
        <div>
          <div style={{ background: 'var(--surface-2)', border: '2px dashed var(--border-strong)', borderRadius: 16, padding: '3rem 2rem', textAlign: 'center', marginBottom: 28 }}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) { const ev = { target: { files: [f] } }; handleReupload(ev) } }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📄</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Drop your resume here</div>
            <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 20 }}>PDF only · we'll parse it and give you personalized feedback</div>
            <button onClick={() => fileRef.current?.click()}
              style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
              Choose file
            </button>
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Resume tips</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
            {RESUME_TIPS.map((tip, i) => (
              <div key={i} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px' }}>
                <div style={{ fontSize: 22, marginBottom: 8 }}>{tip.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{tip.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.7 }}>{tip.body}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* AI Analysis result */}
          {analyzeError && <div style={{ fontSize: 13, color: 'var(--red-text)', padding: '10px 14px', background: 'rgba(239,68,68,0.08)', borderRadius: 10, border: '1px solid var(--red-border)' }}>{analyzeError}</div>}
          {analysis && (
            <div style={{ background: 'linear-gradient(135deg, rgba(139,127,255,0.07), rgba(99,179,255,0.04))', border: '1px solid rgba(139,127,255,0.2)', borderRadius: 16, padding: '20px 22px' }}>
              {/* Score */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 42, fontWeight: 800, fontFamily: 'var(--font-display)', color: scoreColor(analysis.score), lineHeight: 1 }}>{analysis.score}</div>
                  <div style={{ fontSize: 11, color: scoreColor(analysis.score), fontWeight: 600, marginTop: 2 }}>{analysis.scoreLabel}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ width: '100%', height: 8, background: 'var(--border)', borderRadius: 100, overflow: 'hidden', marginBottom: 10 }}>
                    <div style={{ height: '100%', width: `${analysis.score}%`, background: scoreColor(analysis.score), borderRadius: 100, transition: 'width 0.6s ease' }} />
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.7 }}>{analysis.summary}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* Strengths */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Strengths</div>
                  {analysis.strengths?.map((s, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>
                      <span style={{ color: '#4ade80', flexShrink: 0 }}>✓</span>{s}
                    </div>
                  ))}
                </div>
                {/* Improvements */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#fb923c', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Improvements</div>
                  {analysis.improvements?.map((item, i) => (
                    <div key={i} style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{item.issue}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.6 }}>{item.fix}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick wins + ATS */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Quick wins</div>
                  {analysis.quickWins?.map((w, i) => (
                    <div key={i} style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 6, lineHeight: 1.6 }}>→ {w}</div>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>ATS keywords to add</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {analysis.atsKeywords?.map((kw, i) => (
                      <span key={i} style={{ fontSize: 11, padding: '4px 10px', background: 'rgba(56,189,248,0.1)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.25)', borderRadius: 100 }}>{kw}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Parsed resume data */}
          {parsed && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Summary */}
              {parsed.summary && (
                <div style={{ gridColumn: '1 / -1', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Summary</div>
                  <div style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.8 }}>{parsed.summary}</div>
                </div>
              )}
              {/* Experience */}
              {parsed.experience?.length > 0 && (
                <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Experience</div>
                  {parsed.experience.map((e, i) => (
                    <div key={i} style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 8, lineHeight: 1.6, paddingBottom: 8, borderBottom: i < parsed.experience.length - 1 ? '1px solid var(--border)' : 'none' }}>{e}</div>
                  ))}
                </div>
              )}
              {/* Skills */}
              {parsed.skills?.length > 0 && (
                <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Skills</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {parsed.skills.map((s, i) => (
                      <span key={i} style={{ fontSize: 12, padding: '4px 12px', background: 'var(--surface-3)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)', borderRadius: 100, fontWeight: 500 }}>{s}</span>
                    ))}
                  </div>
                  {/* Education */}
                  {parsed.education?.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Education</div>
                      {parsed.education.map((e, i) => (
                        <div key={i} style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 6, lineHeight: 1.6 }}>{e}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {/* Projects */}
              {parsed.projects?.length > 0 && (
                <div style={{ gridColumn: '1 / -1', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Projects</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                    {parsed.projects.map((p, i) => (
                      <div key={i} style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6, padding: '10px 12px', background: 'var(--surface-3)', borderRadius: 10 }}>{p}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Static tips at the bottom */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>General tips</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
              {RESUME_TIPS.map((tip, i) => (
                <div key={i} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px' }}>
                  <div style={{ fontSize: 22, marginBottom: 8 }}>{tip.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{tip.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.7 }}>{tip.body}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Login Screen ────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [username, setUsername] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  function handleLogin() {
    const users = loadUsers()
    const user = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase())
    if (!user) { setError('No account found. Sign up below.'); return }
    if (user.pin !== pin) { setError('Incorrect PIN.'); return }
    setCurrentUser(user.username)
    onLogin(user.username)
  }

  function handleSignup() {
    const trimmed = username.trim()
    if (!trimmed) { setError('Enter a username.'); return }
    if (pin.length < 4) { setError('PIN must be at least 4 digits.'); return }
    const users = loadUsers()
    if (users.find(u => u.username.toLowerCase() === trimmed.toLowerCase())) {
      setError('Username already taken.'); return
    }
    const updated = [...users, { username: trimmed, pin }]
    saveUsers(updated)
    setCurrentUser(trimmed)
    onLogin(trimmed)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '1rem' }}>
      <GlobalStyles />
      <div style={{ width: '100%', maxWidth: 380, background: 'var(--surface-2)', border: '1px solid var(--border-strong)', borderRadius: 20, padding: '2rem', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>☕</div>
          <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>NoShow OS</div>
          <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 4 }}>Your personal networking hub</div>
        </div>

        <div style={{ display: 'flex', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', marginBottom: '1.5rem' }}>
          {['login', 'signup'].map(m => (
            <button key={m} onClick={() => { setMode(m); setError('') }} style={{ flex: 1, padding: '9px 0', fontSize: 13, fontWeight: mode === m ? 600 : 400, background: mode === m ? 'var(--accent)' : 'transparent', color: mode === m ? '#fff' : 'var(--text-secondary)', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 0.15s' }}>
              {m === 'login' ? 'Log in' : 'Sign up'}
            </button>
          ))}
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>Username</label>
          <input
            value={username}
            onChange={e => { setUsername(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleSignup())}
            placeholder="your name or handle"
            autoComplete="username"
            style={{ width: '100%', background: 'var(--surface-3)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)', borderRadius: 10, padding: '10px 14px', fontSize: 14, outline: 'none', fontFamily: 'var(--font-sans)', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>PIN</label>
          <input
            value={pin}
            onChange={e => { setPin(e.target.value.replace(/\D/g, '').slice(0, 8)); setError('') }}
            onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleSignup())}
            placeholder="4–8 digit PIN"
            type="password"
            inputMode="numeric"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            style={{ width: '100%', background: 'var(--surface-3)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)', borderRadius: 10, padding: '10px 14px', fontSize: 14, outline: 'none', fontFamily: 'var(--font-sans)', boxSizing: 'border-box' }}
          />
        </div>

        {error && <div style={{ fontSize: 12, color: 'var(--red-text)', marginBottom: 12, padding: '8px 12px', background: 'var(--red-bg, rgba(239,68,68,0.08))', borderRadius: 8, border: '1px solid var(--red-border)' }}>{error}</div>}

        <button onClick={mode === 'login' ? handleLogin : handleSignup} style={{ width: '100%', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-display)' }}>
          {mode === 'login' ? 'Log in →' : 'Create account →'}
        </button>
      </div>
    </div>
  )
}

// ─── Main App ───────────────────────────────────────────────────────────────────
export default function App() {
  const [currentUser, setUser] = useState(() => getCurrentUser())
  const [profile, setProfile] = useState(null)
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [contacts, setContacts] = useState([])
  const [tab, setTab] = useState('home')
  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showSchedule, setShowSchedule] = useState(false)
  const [detail, setDetail] = useState(null)
  const [quotes, setQuotes] = useState([])
  const [quoteIdx, setQuoteIdx] = useState(0)
  const [quoteFade, setQuoteFade] = useState(true)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [todos, setTodos] = useState([])
  const [calendarDate, setCalendarDate] = useState('')
  const [contactFilter, setContactFilter] = useState('all')
  const [contactSearch, setContactSearch] = useState('')
  const [debriefContact, setDebriefContact] = useState(null)
  const [showBrainDump, setShowBrainDump] = useState(false)

  function handleLogin(username) { setUser(username); setProfileLoaded(false) }
  function handleLogout() { clearCurrentUser(); setUser(null); setProfile(null); setProfileLoaded(false); setContacts([]) }

  useEffect(() => { if (currentUser) setTodos(loadTodos(currentUser)) }, [currentUser])
  function updateTodos(t) { setTodos(t); saveTodos(currentUser, t) }
  function addTodo(text) { updateTodos([...todos, { id: Date.now(), text, done: false }]) }
  function toggleTodo(id) { updateTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t)) }
  function deleteTodo(id) { updateTodos(todos.filter(t => t.id !== id)) }

  useEffect(() => {
    if (!currentUser) return
    const p = loadProfile(currentUser)
    setProfile(p)
    setProfileLoaded(true)
    setContacts(loadContacts(currentUser))
  }, [currentUser])

  useEffect(() => {
    if (!profile || !currentUser) return
    const cached = loadQuotes(currentUser)
    if (cached && cached.length > 0) { setQuotes(cached); return }
    setQuoteLoading(true)
    generateQuotes(profile)
      .then(q => { setQuotes(q); saveQuotes(currentUser, q) })
      .catch(() => setQuotes(["Every connection is a door you didn't know was there."]))
      .finally(() => setQuoteLoading(false))
  }, [profile, currentUser])

  // Rotate quotes every 45 minutes
  useEffect(() => {
    if (quotes.length <= 1) return
    const interval = setInterval(() => {
      setQuoteFade(false)
      setTimeout(() => {
        setQuoteIdx(i => (i + 1) % quotes.length)
        setQuoteFade(true)
      }, 300)
    }, 45 * 60 * 1000)
    return () => clearInterval(interval)
  }, [quotes])

  function handleOnboardingComplete(p) { saveProfile(currentUser, p); setProfile(p); setShowOnboarding(false) }
  function handleEditSave(p) { saveProfile(currentUser, p); setProfile(p); setShowEdit(false) }
  function persist(u) { setContacts(u); saveContacts(currentUser, u) }
  function addContact(c) {
    persist([{ ...c, id: Date.now(), status: 'new', notes: '', chatDate: '', linkedinUrl: '', parsedProfile: null, brief: '', followUpText: '', pdfName: '' }, ...contacts])
    setShowAdd(false)
  }
  function updateContact(c) {
    const prev = contacts.find(x => x.id === c.id)
    persist(contacts.map(x => x.id === c.id ? c : x))
    setDetail(c)
    if (c.status === 'completed' && prev?.status !== 'completed') setDebriefContact(c)
  }
  function deleteContact(id) { persist(contacts.filter(x => x.id !== id)); setDetail(null) }

  function handleScheduleFromModal(contact, date) {
    const updated = contacts.map(x => x.id === contact.id ? { ...x, chatDate: date, status: 'scheduled' } : x)
    persist(updated)
  }

  async function handleSchedule({ contact, chatTime }) {
    const [h, m] = chatTime.split(':').map(Number)
    const endH = String(h + 1).padStart(2, '0')
    const endTime = `${endH}:${String(m).padStart(2, '0')}`
    const title = encodeURIComponent(`Coffee Chat · ${contact.name}`)
    const details = encodeURIComponent(`${contact.role || ''}${contact.company ? ' at ' + contact.company : ''}`)
    const dateStr = contact.chatDate.replace(/-/g, '')
    window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dateStr}T${chatTime.replace(':','')}00/${dateStr}T${endTime.replace(':','')}00&details=${details}`, '_blank')
  }

  if (!currentUser) return <LoginScreen onLogin={handleLogin} />
  if (!profileLoaded) return null
  if (!profile || showOnboarding) return <Onboarding onComplete={handleOnboardingComplete} existingProfile={profile} />

  const stats = {
    total: contacts.length,
    scheduled: contacts.filter(x => x.status === 'scheduled').length,
    completed: contacts.filter(x => x.status === 'completed').length,
    followedUp: contacts.filter(x => x.status === 'followed up').length,
  }

  const todayStr = new Date().toISOString().split('T')[0]
  const upcoming = contacts.filter(x => x.chatDate && x.status === 'scheduled' && x.chatDate >= todayStr).sort((a, b) => new Date(a.chatDate + 'T12:00:00') - new Date(b.chatDate + 'T12:00:00'))
  const needsFollowUp = contacts.filter(x => x.status === 'completed' && !x.followUpText)
  const recent = [...contacts].sort((a, b) => b.id - a.id).slice(0, 5)
  const resume = profile?.resumeText ? { text: profile.resumeText, parsed: profile.resumeParsed } : null
  const skills = profile?.skills || []

  const greeting = getGreeting(profile.name)
  const tabs = ['home', 'contacts', 'upcoming', 'jobs', 'resume', 'network']
  const tabLabels = { home: 'Home', contacts: 'Contacts', upcoming: 'Upcoming', jobs: 'Jobs', resume: 'Resume', network: '🕸 Network' }
  const needsScheduling = contacts.filter(x => x.chatDate && x.status === 'scheduled' && x.chatDate >= todayStr)

  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  const soonChats = upcoming.filter(c => c.chatDate === todayStr || c.chatDate === tomorrowStr)
  const streak = calcStreak(contacts)
  const networkScore = calcNetworkScore(contacts)

  const filteredContacts = contactSearch.trim()
    ? contacts.filter(c => [c.name, c.role, c.company].filter(Boolean).join(' ').toLowerCase().includes(contactSearch.toLowerCase()))
    : contacts

  const STAT_CARDS = [
    { label: 'Total', value: stats.total, icon: '🤝', accent: '#7c6fff', onClick: () => setTab('contacts') },
    { label: 'Scheduled', value: stats.scheduled, icon: '📅', accent: '#4ade80', onClick: () => setTab('upcoming'), badge: upcoming.length > 0 ? { text: `${upcoming.length} upcoming`, color: '#4ade80' } : null },
    { label: 'Completed', value: stats.completed, icon: '✓', accent: '#fbbf24', onClick: () => setTab('contacts') },
    { label: 'Followed Up', value: stats.followedUp, icon: '✉', accent: '#f472b6', onClick: () => setTab('contacts') },
  ]

  const modalBg = { position: 'fixed', inset: 0, background: 'rgba(8,16,24,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 100, backdropFilter: 'blur(12px)' }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <GlobalStyles />

      {/* Nav */}
      <div style={{ background: 'rgba(15,25,35,0.92)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border)', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56, position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>☕</span>
          <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.01em', fontFamily: 'var(--font-display)' }}>NoShow OS</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => window.open('https://calendar.google.com', '_blank')} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', gap: 6 }}>
            📅 Calendar
          </button>
          <button onClick={() => setShowEdit(true)} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 14px', fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
            {profile.name?.split(' ')[0]} · edit
          </button>
          <button onClick={handleLogout} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', fontSize: 12, color: 'var(--text-tertiary)', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
            Log out
          </button>
          <button onClick={() => setShowAdd(true)} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-display)' }}>
            + Add contact
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ background: 'rgba(15,25,35,0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)', display: 'flex', padding: '0 1.5rem', position: 'sticky', top: 56, zIndex: 40 }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ fontSize: 13, fontWeight: 500, padding: '12px 18px', background: 'transparent', border: 'none', borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent', color: tab === t ? 'var(--text-primary)' : 'var(--text-tertiary)', cursor: 'pointer', marginBottom: -1, transition: 'color 0.15s', fontFamily: 'var(--font-sans)' }}>
            {tabLabels[t]}
            {t === 'upcoming' && upcoming.length > 0 && <span style={{ marginLeft: 6, background: 'var(--accent)', color: '#fff', borderRadius: 100, fontSize: 10, padding: '1px 6px', fontWeight: 700 }}>{upcoming.length}</span>}
          </button>
        ))}
      </div>

      {/* ── HOME ─────────────────────────────────────────────────────────────────── */}
      {tab === 'home' && (
        <div style={{ position: 'relative', overflow: 'hidden' }}>
          {/* Ambient glows */}
          <div style={{ position: 'fixed', top: 80, left: '40%', width: 700, height: 500, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(124,140,248,0.06) 0%, transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />
          <div style={{ position: 'fixed', bottom: 0, right: '10%', width: 500, height: 400, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(251,191,36,0.04) 0%, transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />
          <div style={{ position: 'fixed', inset: 0, opacity: 0.015, backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(200,220,255,0.6) 1px, transparent 0)', backgroundSize: '44px 44px', pointerEvents: 'none', zIndex: 0 }} />

          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.75rem 1.5rem', position: 'relative', zIndex: 1 }}>

            {/* ── Hero greeting ─── */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 10, fontWeight: 500 }}>✦ Dashboard</div>
              <div style={{ fontFamily: 'var(--font-display)', lineHeight: 1.05, marginBottom: 12 }}>
                <span style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 400, color: 'var(--text-secondary)' }}>{greeting.line1} </span>
                <span style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, color: 'var(--text-primary)' }}>{greeting.line2}</span>
              </div>
              <div style={{ borderLeft: '3px solid var(--accent)', paddingLeft: 14, maxWidth: 520 }}>
                {quoteLoading
                  ? <div style={{ fontSize: 13, color: 'var(--text-tertiary)', display: 'flex', gap: 8, alignItems: 'center' }}><Spinner /> Generating your quotes...</div>
                  : <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.7, opacity: quoteFade ? 1 : 0, transform: quoteFade ? 'translateY(0)' : 'translateY(4px)', transition: 'opacity 0.3s ease, transform 0.3s ease' }}>"{quotes[quoteIdx] || ''}"</div>}
              </div>
            </div>

            {/* ── Prep brief reminder ─── */}
            {soonChats.length > 0 && (
              <div style={{ background: 'linear-gradient(135deg, rgba(74,222,128,0.1), rgba(99,179,255,0.06))', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 14, padding: '14px 18px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ fontSize: 28, flexShrink: 0 }}>☕</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#6ee7b7', marginBottom: 3 }}>
                    {soonChats[0].chatDate === todayStr ? 'Chat today' : 'Chat tomorrow'} — {soonChats[0].name}
                    {soonChats[0].chatTime && <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}> at {soonChats[0].chatTime}</span>}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Review your prep brief so you walk in confident.</div>
                </div>
                <button onClick={() => setDetail(soonChats[0])} style={{ background: '#4ade80', color: '#000', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-display)', whiteSpace: 'nowrap' }}>
                  View brief →
                </button>
              </div>
            )}

            {/* ── Stat cards ─── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: '1.25rem' }}>
              {STAT_CARDS.map(({ label, value, icon, accent, onClick, badge }) => (
                <div key={label} onClick={onClick} className="fade-in" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 20, padding: '1.5rem', cursor: 'pointer', position: 'relative', overflow: 'hidden', transition: 'border-color 0.2s, transform 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = accent + '55'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none' }}>
                  <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: `radial-gradient(circle, ${accent}20 0%, transparent 70%)`, pointerEvents: 'none' }} />
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>{label}</div>
                  <div style={{ fontSize: 48, fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: 1 }}>{value}</div>
                  <div style={{ marginTop: 10, fontSize: 20 }}>{icon}</div>
                  {badge && (
                    <div style={{ position: 'absolute', top: 10, right: 10, background: badge.color, color: '#000', fontSize: 9, fontWeight: 700, padding: '3px 7px', borderRadius: 100, whiteSpace: 'nowrap' }}>
                      {badge.text}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* ── Streak + Score ─── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: '1.25rem' }}>
              <div style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.1), rgba(251,146,60,0.06))', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 16, padding: '1.1rem 1.25rem', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ fontSize: 36 }}>🔥</div>
                <div>
                  <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)', color: '#fbbf24', lineHeight: 1 }}>{streak}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>week{streak !== 1 ? 's' : ''} streak</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{streak === 0 ? 'Complete a chat to start!' : streak >= 4 ? 'On fire 🔥 keep going!' : 'Keep it up!'}</div>
                </div>
              </div>
              <div style={{ background: 'linear-gradient(135deg, rgba(139,127,255,0.1), rgba(99,179,255,0.06))', border: '1px solid rgba(139,127,255,0.25)', borderRadius: 16, padding: '1.1rem 1.25rem', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ fontSize: 36 }}>⚡</div>
                <div>
                  <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)', color: '#a78bfa', lineHeight: 1 }}>{networkScore}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>network score</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{networkScore < 50 ? 'Just getting started' : networkScore < 150 ? 'Building momentum' : networkScore < 300 ? 'Well connected!' : 'Network legend 👑'}</div>
                </div>
              </div>
            </div>

            {/* ── Main dashboard grid ─── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

              {/* Upcoming chats */}
              <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 20, padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>📅 Upcoming</div>
                  <button onClick={() => setTab('upcoming')} style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>View all →</button>
                </div>
                {upcoming.length === 0
                  ? <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)', fontSize: 13 }}>No upcoming meetings yet</div>
                  : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {upcoming.slice(0, 4).map(c => {
                      const dt = new Date(c.chatDate + 'T12:00:00')
                      const isToday = dt.toDateString() === new Date().toDateString()
                      const isTomorrow = dt.toDateString() === new Date(Date.now() + 86400000).toDateString()
                      const label = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                      return (
                        <div key={c.id} onClick={() => setDetail(c)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.8rem 1rem', background: isToday ? 'rgba(124,111,255,0.08)' : 'var(--surface-3)', borderRadius: 12, cursor: 'pointer', border: `1px solid ${isToday ? 'rgba(124,111,255,0.2)' : 'var(--border)'}`, transition: 'border-color 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
                          onMouseLeave={e => e.currentTarget.style.borderColor = isToday ? 'rgba(124,111,255,0.2)' : 'var(--border)'}
                        >
                          <div style={{ width: 40, height: 40, borderRadius: 10, background: isToday ? 'var(--accent)' : 'var(--surface-2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {isToday ? <span style={{ fontSize: 18 }}>☕</span> : <><span style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-display)', lineHeight: 1 }}>{dt.getDate()}</span><span style={{ fontSize: 9, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{dt.toLocaleString('en-US', { month: 'short' })}</span></>}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: 14, fontFamily: 'var(--font-display)' }}>{c.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{[c.role, c.company].filter(Boolean).join(' · ')}</div>
                          </div>
                          <div style={{ fontSize: 12, color: isToday ? 'var(--accent)' : 'var(--text-tertiary)', fontWeight: isToday ? 600 : 400, flexShrink: 0, textAlign: 'right' }}>
                            <div>{label}</div>
                            {c.chatTime && <div style={{ fontSize: 11, marginTop: 2, opacity: 0.7 }}>{c.chatTime}</div>}
                          </div>
                        </div>
                      )
                    })}
                  </div>}
              </div>

              {/* Follow-ups needed */}
              <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 20, padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>✉ Follow-ups</div>
                  {needsFollowUp.length > 0 && <span style={{ fontSize: 11, background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 100, padding: '2px 8px', fontWeight: 600 }}>{needsFollowUp.length} pending</span>}
                </div>
                {needsFollowUp.length === 0
                  ? <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)', fontSize: 13 }}>
                      <div style={{ fontSize: 24, marginBottom: 8, opacity: 0.4 }}>✓</div>
                      All caught up!
                    </div>
                  : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {needsFollowUp.slice(0, 4).map(c => (
                      <div key={c.id} onClick={() => setDetail(c)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.8rem 1rem', background: 'var(--surface-3)', borderRadius: 12, cursor: 'pointer', border: '1px solid var(--border)', transition: 'border-color 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                      >
                        <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid rgba(251,191,36,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(251,191,36,0.6)' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, fontFamily: 'var(--font-display)' }}>{c.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>{c.company || 'No company'} · needs follow-up</div>
                        </div>
                        <div style={{ fontSize: 11, color: '#fbbf24' }}>Write →</div>
                      </div>
                    ))}
                  </div>}
              </div>

              {/* To-do list */}
              <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 20, padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>✓ To-do List</div>
                  {todos.filter(t => !t.done).length > 0 && <span style={{ fontSize: 11, background: 'rgba(124,111,255,0.15)', color: '#a78bfa', border: '1px solid rgba(124,111,255,0.3)', borderRadius: 100, padding: '2px 8px', fontWeight: 600 }}>{todos.filter(t => !t.done).length} pending</span>}
                </div>
                <TodoInput onAdd={addTodo} />
                <div style={{ marginTop: 14 }}>
                  <TodoList todos={todos} onToggle={toggleTodo} onDelete={deleteTodo} />
                </div>
              </div>

              {/* Recent contacts */}
              <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 20, padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>🤝 Recent Contacts</div>
                  <button onClick={() => setTab('contacts')} style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>All →</button>
                </div>
                {recent.length === 0
                  ? <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)', fontSize: 13 }}>No contacts yet — add one!</div>
                  : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {recent.map(c => (
                      <div key={c.id} onClick={() => setDetail(c)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.7rem 0.9rem', background: 'var(--surface-3)', borderRadius: 12, cursor: 'pointer', border: '1px solid var(--border)', transition: 'border-color 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                      >
                        <Avatar name={c.name} company={c.company} size={32} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, fontFamily: 'var(--font-display)' }}>{c.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{[c.role, c.company].filter(Boolean).join(' · ') || 'No role set'}</div>
                        </div>
                        <StatusBadge status={c.status} />
                      </div>
                    ))}
                  </div>}
              </div>

              {/* Goal + skills */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {profile.goals && (
                  <div style={{ background: 'linear-gradient(135deg, rgba(124,111,255,0.08), rgba(74,222,128,0.05))', border: '1px solid rgba(124,111,255,0.25)', borderRadius: 20, padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,111,255,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
                    <div style={{ fontSize: 11, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>🎯</span> Your North Star
                    </div>
                    <div style={{ fontSize: 16, lineHeight: 1.6, color: 'var(--text-primary)', fontWeight: 600, marginBottom: 12 }}>{profile.goals}</div>
                    <button onClick={() => setShowEdit(true)} style={{ fontSize: 12, color: '#a78bfa', background: 'rgba(124,111,255,0.15)', border: '1px solid rgba(124,111,255,0.3)', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>Edit goal</button>
                  </div>
                )}
                <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 20, padding: '1.5rem', flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>⚡</span> Your Skills ({skills.length})
                  </div>
                  {skills.length > 0
                    ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 12 }}>
                        {skills.map((s, i) => {
                          const colors = [
                            { bg: 'rgba(139,127,255,0.15)', color: '#c4b8ff', border: 'rgba(139,127,255,0.35)' },
                            { bg: 'rgba(99,179,255,0.12)', color: '#93c5fd', border: 'rgba(99,179,255,0.3)' },
                            { bg: 'rgba(52,211,153,0.12)', color: '#6ee7b7', border: 'rgba(52,211,153,0.3)' },
                            { bg: 'rgba(251,191,36,0.12)', color: '#fcd34d', border: 'rgba(251,191,36,0.3)' },
                            { bg: 'rgba(244,114,182,0.12)', color: '#f9a8d4', border: 'rgba(244,114,182,0.3)' },
                          ]
                          const c = colors[i % colors.length]
                          return (
                            <span key={s} style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color, borderRadius: 100, padding: '5px 12px', fontSize: 12, fontWeight: 500 }}>{s}</span>
                          )
                        })}
                      </div>
                    : <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 10 }}>No skills added yet</div>}
                  <button onClick={() => setShowEdit(true)} style={{ fontSize: 12, color: 'var(--text-tertiary)', background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>Manage skills</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CONTACTS ─────────────────────────────────────────────────────────────── */}
      {tab === 'contacts' && (
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '1.5rem 1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: '1rem' }}>
            {[['All', stats.total, '#917aff', 'all'], ['Scheduled', stats.scheduled, '#4ade80', 'scheduled'], ['Completed', stats.completed, '#fbbf24', 'completed'], ['Followed up', stats.followedUp, '#f472b6', 'followed up']].map(([l, v, color, filter]) => (
              <div key={l} onClick={() => setContactFilter(contactFilter === filter ? 'all' : filter)}
                style={{ background: contactFilter === filter ? `${color}15` : 'var(--surface-2)', border: `1px solid ${contactFilter === filter ? `${color}44` : 'var(--border)'}`, borderRadius: 'var(--radius-lg)', padding: '1rem', textAlign: 'center', position: 'relative', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.15s' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color }} />
                <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-display)', color }}>{v}</div>
                <div style={{ fontSize: 11, color: contactFilter === filter ? color : 'var(--text-tertiary)', marginTop: 4, fontWeight: contactFilter === filter ? 600 : 400 }}>{l}</div>
              </div>
            ))}
          </div>

          {/* Search bar + Add button */}
          <div style={{ display: 'flex', gap: 8, marginBottom: '1rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                value={contactSearch}
                onChange={e => setContactSearch(e.target.value)}
                placeholder="Search contacts by name, role, or company..."
                style={{ width: '100%', background: 'var(--surface-3)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)', borderRadius: 12, padding: '10px 14px 10px 38px', fontSize: 13, outline: 'none', fontFamily: 'var(--font-sans)', boxSizing: 'border-box' }}
              />
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', fontSize: 15, pointerEvents: 'none' }}>🔍</span>
              {contactSearch && <button onClick={() => setContactSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: 16 }}>×</button>}
            </div>
            <button onClick={() => setShowAdd(true)} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'var(--accent)', color: 'var(--accent-fg)', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap' }}>
              + Add Contact
            </button>
          </div>

          {/* Category sections */}
          {contactSearch.trim() ? (
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 10 }}>{filteredContacts.length} result{filteredContacts.length !== 1 ? 's' : ''} for "{contactSearch}"</div>
              <ContactList contacts={filteredContacts} onSelect={setDetail} />
            </div>
          ) : contactFilter === 'all' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {[
                { status: 'new', label: 'New — Reach Out', icon: '👋', color: '#917aff' },
                { status: 'scheduled', label: 'Scheduled Meetings', icon: '📅', color: '#4ade80' },
                { status: 'completed', label: 'Completed Chats', icon: '✓', color: '#fbbf24' },
                { status: 'followed up', label: 'Followed Up', icon: '✉', color: '#f472b6' },
              ].map(cat => {
                const catContacts = contacts.filter(x => x.status === cat.status)
                if (catContacts.length === 0) return null
                return (
                  <div key={cat.status}>
                    <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: cat.color, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{cat.icon}</span> {cat.label} <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-tertiary)', marginLeft: 4 }}>({catContacts.length})</span>
                    </div>
                    <ContactList contacts={catContacts} onSelect={setDetail} />
                  </div>
                )
              })}
            </div>
          ) : (
            <ContactList contacts={contacts.filter(x => x.status === contactFilter)} onSelect={setDetail} />
          )}

          <div style={{ marginTop: '1.5rem' }}>
            <ProTipBox />
          </div>
        </div>
      )}

      {/* ── UPCOMING ─────────────────────────────────────────────────────────────── */}
      {tab === 'upcoming' && (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '1.5rem 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)' }}>📅 Calendar</div>
            <button onClick={() => setShowSchedule(true)} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-display)' }}>
              + Schedule Meeting
            </button>
          </div>
          <MonthCalendar contacts={contacts} onSelect={setDetail} onDayClick={(dateStr) => { setCalendarDate(dateStr); setShowSchedule(true) }} />

          <div style={{ marginTop: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-display)', marginBottom: 10 }}>Upcoming Meetings</div>
            <UpcomingList contacts={contacts} onSelect={setDetail} onSchedule={(c) => { setCalendarDate(''); setShowSchedule(true) }} />
          </div>
        </div>
      )}

      {/* ── JOBS ─────────────────────────────────────────────────────────────────── */}
      {tab === 'jobs' && (
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '1.5rem 1.5rem' }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: 6 }}>Job Matches</div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              AI-generated roles aligned with your profile.{profile.goals && ` Goal: ${profile.goals}.`}
              {skills.length > 0 && ` Skills: ${skills.slice(0, 3).join(', ')}${skills.length > 3 ? '...' : ''}.`}
            </div>
          </div>
          <JobSearch profile={profile} resume={resume} skills={skills} />
        </div>
      )}

      {/* ── RESUME ───────────────────────────────────────────────────────────────── */}
      {tab === 'resume' && (
        <ResumeTab
          resume={resume}
          profile={profile}
          onUpdateResume={(resumeName, resumeText, resumeParsed) => {
            const updated = { ...profile, resumeName, resumeText, resumeParsed }
            saveProfile(currentUser, updated)
            setProfile(updated)
          }}
        />
      )}

      {/* ── NETWORK ──────────────────────────────────────────────────────────────── */}
      {tab === 'network' && (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '1.5rem 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: 4 }}>🕸 Your Network</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Connections between your contacts — lines = shared company or school</div>
            </div>
          </div>
          <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 20, padding: '1.5rem' }}>
            <NetworkMap contacts={contacts} onSelect={c => setDetail(c)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 16 }}>
            {[
              { label: 'Total contacts', value: contacts.length, color: '#a78bfa' },
              { label: 'Companies represented', value: new Set(contacts.map(c => c.company).filter(Boolean)).size, color: '#4ade80' },
              { label: 'Connections found', value: (() => { let e = 0; for (let i = 0; i < contacts.length; i++) for (let j = i + 1; j < contacts.length; j++) { const a = contacts[i], b = contacts[j]; if (a.company && b.company && a.company.toLowerCase() === b.company.toLowerCase()) e++ } return e })(), color: '#fbbf24' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 14, padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)', color }}>{value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Modals ────────────────────────────────────────────────────────────────── */}
      {showAdd && (
        <div style={modalBg} onClick={e => { if (e.target === e.currentTarget) setShowAdd(false) }}>
          <AddModal onAdd={addContact} onClose={() => setShowAdd(false)} />
        </div>
      )}
      {showEdit && (
        <div style={modalBg} onClick={e => { if (e.target === e.currentTarget) setShowEdit(false) }}>
          <EditProfileModal profile={profile} onSave={handleEditSave} onClose={() => setShowEdit(false)} />
        </div>
      )}
      {showSchedule && contacts.length > 0 && (
        <div style={modalBg} onClick={e => { if (e.target === e.currentTarget) setShowSchedule(false) }}>
          <ScheduleModal contacts={contacts} onSchedule={handleScheduleFromModal} onClose={() => { setShowSchedule(false); setCalendarDate('') }} prefillDate={calendarDate} />
        </div>
      )}
      {detail && (
        <div style={{ ...modalBg, alignItems: 'flex-start', padding: '3rem 1rem 1rem', overflowY: 'auto' }} onClick={e => { if (e.target === e.currentTarget) setDetail(null) }}>
          <ContactDetail contact={detail} onUpdate={updateContact} onDelete={deleteContact} onClose={() => setDetail(null)} onSchedule={handleSchedule} resume={resume} profileSkills={skills} />
        </div>
      )}
      {debriefContact && (
        <div style={modalBg} onClick={e => { if (e.target === e.currentTarget) setDebriefContact(null) }}>
          <DebriefModal
            contact={debriefContact}
            onSave={({ debrief, followUpDate }) => {
              const updated = { ...debriefContact, debrief, followUpDate }
              persist(contacts.map(x => x.id === updated.id ? updated : x))
              setDebriefContact(null)
            }}
            onClose={() => setDebriefContact(null)}
          />
        </div>
      )}

      {/* ── Floating brain dump button ─── */}
      <button
        onClick={() => setShowBrainDump(b => !b)}
        style={{ position: 'fixed', bottom: 24, right: 24, width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, #7c6fff, #4ade80)', border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(124,111,255,0.5)', zIndex: 199, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, transition: 'transform 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        title="Quick notes"
      >
        ⚡
      </button>
      {showBrainDump && <BrainDumpPanel onClose={() => setShowBrainDump(false)} user={currentUser} />}
    </div>
  )
}
