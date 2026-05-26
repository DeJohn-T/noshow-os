// App.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  Bell,
  CalendarDays,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Contact as ContactIcon,
  FileText,
  Flame,
  FolderInput,
  GripVertical,
  Lightbulb,
  ListChecks,
  MessageSquareText,
  Network as NetworkIcon,
  NotebookText,
  Search,
  Settings2,
  Sparkles,
  Target,
  Upload,
  X,
  Zap,
} from 'lucide-react'
import { ContactList, UpcomingList, MonthCalendar } from './components/ContactList'
import { ContactDetail } from './components/ContactDetail'
import { Onboarding } from './components/Onboarding'
import { JobSearch } from './components/JobSearch'
import { AppShell, MetricTile, OrbitPanel, RightOrbit, TodayDesk } from './components/Layout'
import { Avatar, CompanyLogoBackdrop, StatusBadge, GlobalStyles, Spinner, Button } from './components/UI'
import { loadContacts, saveContacts, loadProfile, saveProfile, loadQuotes, saveQuotes, loadTodos, saveTodos, loadBrainDump, saveBrainDump, loadUsers, saveUsers, getCurrentUser, setCurrentUser, clearCurrentUser, loadScheduledTasks, saveScheduledTasks, loadJobRecs, saveJobRecs, exportBackup, importBackup } from './lib/storage'
import { generateQuotes, analyzeResume, generateJobRecs, extractInsights, parseLinkedInPDF, parseResumePDF } from './lib/ai'
import { extractTextFromPDF } from './lib/pdfParser'
import { formatDate, isFinalStatus, isPostChatStatus, normalizeStatus, STATUS_OPTIONS, statusLabel, statusMeta } from './lib/utils'
import { supabase, fetchUserData, signInWithGoogle } from './lib/supabase.js'
import NotionImport from './components/NotionImport.jsx'

function getGreeting(name) {
  const h = new Date().getHours()
  const first = name ? name.split(' ')[0] : 'there'
  if (h < 12) return { line1: `Good morning,`, line2: first }
  if (h < 17) return { line1: `Good afternoon,`, line2: first }
  return { line1: `Good evening,`, line2: first }
}

// ─── Pro Tip Box ─────────────────────────────────────────────────────────────
const PRO_TIPS = [
  { text: 'Upload LinkedIn PDFs for instant profiles - it pulls skills, experience, and more automatically.' },
  { text: 'Set chat dates on contacts to keep your meetings organized and get reminders.' },
  { text: 'Send follow-ups within 24 hours - the sooner you reach out, the stronger the connection.' },
  { text: 'Prep briefs are your cheat code - generate one before every coffee chat.' },
  { text: "Mention something specific from their background - it shows you've done your homework." },
  { text: 'Add your skills and resume to get better, more personalized prep briefs and job matches.' },
]

function HighlightsBox({ highlights, onAdd, onRemove, onReorder }) {
  const [idx, setIdx] = useState(0)
  const [fade, setFade] = useState(true)
  const [input, setInput] = useState('')
  const [managing, setManaging] = useState(false)

  useEffect(() => {
    if (highlights.length <= 1) return
    const t = setInterval(() => {
      setFade(false)
      setTimeout(() => { setIdx(i => (i + 1) % highlights.length); setFade(true) }, 300)
    }, 60000)
    return () => clearInterval(t)
  }, [highlights.length])

  function navigate(dir) {
    setFade(false)
    setTimeout(() => { setIdx(i => (i + dir + highlights.length) % highlights.length); setFade(true) }, 200)
  }

  function add() {
    const t = input.trim()
    if (t) { onAdd(t); setInput('') }
  }

  const current = highlights[idx % Math.max(highlights.length, 1)]

  return (
    <div style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.08), rgba(244,114,182,0.05))', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 20, padding: '1.25rem 1.5rem', marginBottom: '1.5rem', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(251,191,36,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: highlights.length ? 12 : 8 }}>
        <div style={{ fontSize: 12, color: '#fbbf24', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Sparkles size={14} strokeWidth={1.8} aria-hidden="true" /> My Highlights
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {highlights.length > 1 && (
            <div style={{ display: 'flex', gap: 3 }}>
              {highlights.map((_, i) => (
                <div key={i} onClick={() => { setFade(false); setTimeout(() => { setIdx(i); setFade(true) }, 200) }}
                  style={{ width: i === idx ? 16 : 5, height: 5, borderRadius: 3, background: i === idx ? '#fbbf24' : 'rgba(251,191,36,0.25)', transition: 'all 0.3s', cursor: 'pointer' }} />
              ))}
            </div>
          )}
          <button onClick={() => setManaging(m => !m)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(251,191,36,0.5)', fontSize: 12, fontFamily: 'var(--font-sans)', padding: 0 }}>
            {managing ? 'done' : 'manage'}
          </button>
        </div>
      </div>

      {highlights.length > 0 ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            {highlights.length > 1 && (
              <button onClick={() => navigate(-1)} aria-label="Previous highlight" style={{ background: 'none', border: 'none', color: 'rgba(251,191,36,0.6)', cursor: 'pointer', lineHeight: 1, padding: '0 2px', flexShrink: 0 }}>
                <ChevronLeft size={18} strokeWidth={1.8} aria-hidden="true" />
              </button>
            )}
            <div style={{ flex: 1, opacity: fade ? 1 : 0, transform: fade ? 'none' : 'translateY(5px)', transition: 'all 0.3s ease', fontSize: 15, color: 'var(--text-primary)', lineHeight: 1.7, fontWeight: 500 }}>
              {current}
            </div>
            {highlights.length > 1 && (
              <button onClick={() => navigate(1)} aria-label="Next highlight" style={{ background: 'none', border: 'none', color: 'rgba(251,191,36,0.6)', cursor: 'pointer', lineHeight: 1, padding: '0 2px', flexShrink: 0 }}>
                <ChevronRight size={18} strokeWidth={1.8} aria-hidden="true" />
              </button>
            )}
          </div>
          {highlights.length > 1 && (
            <div style={{ fontSize: 10, color: 'rgba(251,191,36,0.4)', marginBottom: 10 }}>{idx + 1} / {highlights.length} · cycles every minute</div>
          )}
        </>
      ) : (
        <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 10 }}>Add advice, rules, or anything you want to remember. It'll cycle through here.</div>
      )}

      {managing && highlights.length > 0 && (() => {
        function DragList({ items, onReorder, onRemove }) {
          const [dragIdx, setDragIdx] = React.useState(null)
          const [overIdx, setOverIdx] = React.useState(null)
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12, maxHeight: 200, overflowY: 'auto' }}>
              {items.map((h, i) => (
                <div key={i} draggable
                  onDragStart={() => setDragIdx(i)}
                  onDragOver={e => { e.preventDefault(); setOverIdx(i) }}
                  onDrop={() => {
                    if (dragIdx === null || dragIdx === i) return
                    const reordered = [...items]
                    const [moved] = reordered.splice(dragIdx, 1)
                    reordered.splice(i, 0, moved)
                    onReorder(reordered)
                    setDragIdx(null); setOverIdx(null)
                  }}
                  onDragEnd={() => { setDragIdx(null); setOverIdx(null) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, background: overIdx === i ? 'rgba(251,191,36,0.1)' : 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '7px 10px', border: `1px solid ${overIdx === i ? 'rgba(251,191,36,0.3)' : 'transparent'}`, cursor: 'grab', opacity: dragIdx === i ? 0.4 : 1, transition: 'all 0.1s' }}>
                  <GripVertical size={14} strokeWidth={1.8} style={{ color: 'rgba(251,191,36,0.4)', flexShrink: 0 }} aria-hidden="true" />
                  <span style={{ flex: 1, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{h}</span>
                  <button onClick={() => { onRemove(i); if (idx >= items.length - 1) setIdx(Math.max(0, items.length - 2)) }}
                    aria-label="Remove highlight"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', lineHeight: 1, padding: '0 2px', flexShrink: 0 }}><X size={14} strokeWidth={1.8} aria-hidden="true" /></button>
                </div>
              ))}
            </div>
          )
        }
        return <DragList items={highlights} onReorder={onReorder} onRemove={onRemove} />
      })()}

      <div style={{ borderTop: '1px solid rgba(251,191,36,0.15)', paddingTop: 10, display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder="Add a rule or piece of advice... press Enter"
          style={{ flex: 1, background: 'transparent', color: 'var(--text-primary)', border: 'none', outline: 'none', fontSize: 13, fontFamily: 'var(--font-sans)' }}
        />
        {input.trim() && (
          <button onClick={add} style={{ background: 'rgba(251,191,36,0.2)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 8, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>Add</button>
        )}
      </div>
    </div>
  )
}

function CircleBackReminder({ contacts, onSelect }) {
  const [idx, setIdx] = useState(0)
  const [fade, setFade] = useState(true)

  useEffect(() => {
    if (contacts.length <= 1) return
    const t = setInterval(() => {
      setFade(false)
      setTimeout(() => { setIdx(i => (i + 1) % contacts.length); setFade(true) }, 300)
    }, 12000)
    return () => clearInterval(t)
  }, [contacts.length])

  const person = contacts[idx % contacts.length]
  if (!person) return null

  return (
    <div style={{ background: 'linear-gradient(135deg, rgba(96,165,250,0.1), rgba(139,127,255,0.06))', border: '1px solid rgba(96,165,250,0.25)', borderRadius: 16, padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
      <div style={{ fontSize: 11, color: '#60a5fa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 7 }}>
        <CalendarDays size={14} strokeWidth={1.8} aria-hidden="true" />
        Circle Back
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Avatar name={person.name} company={person.company} size={36} />
        <div style={{ flex: 1, opacity: fade ? 1 : 0, transform: fade ? 'none' : 'translateY(4px)', transition: 'all 0.3s ease' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
            Don't forget to circle back with <span style={{ color: '#60a5fa' }}>{person.name?.split(' ')[0]}</span>!
          </div>
          {(person.role || person.company) && (
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
              {[person.role, person.company].filter(Boolean).join(' · ')}
            </div>
          )}
        </div>
        <button onClick={() => onSelect(person)} style={{ background: 'rgba(96,165,250,0.15)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.3)', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap', flexShrink: 0 }}>
          Open
        </button>
      </div>
      {contacts.length > 1 && (
        <div style={{ display: 'flex', gap: 4, marginTop: 10, justifyContent: 'center' }}>
          {contacts.map((_, i) => (
            <div key={i} onClick={() => { setFade(false); setTimeout(() => { setIdx(i); setFade(true) }, 200) }}
              style={{ width: i === idx ? 14 : 5, height: 5, borderRadius: 3, background: i === idx ? '#60a5fa' : 'rgba(96,165,250,0.2)', transition: 'all 0.3s', cursor: 'pointer' }} />
          ))}
        </div>
      )}
    </div>
  )
}

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
          <Lightbulb size={18} strokeWidth={1.8} aria-hidden="true" /> Pro Tip
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          {PRO_TIPS.map((_, i) => (
            <div key={i} style={{ width: i === idx ? 20 : 6, height: 6, borderRadius: 4, background: i === idx ? '#93c5fd' : 'rgba(147,197,253,0.2)', transition: 'all 0.3s ease' }} />
          ))}
        </div>
      </div>
      <div style={{ opacity: fade ? 1 : 0, transform: fade ? 'translateY(0)' : 'translateY(8px)', transition: 'opacity 0.35s ease, transform 0.35s ease', fontSize: 17, color: 'var(--text-primary)', lineHeight: 1.75, display: 'flex', alignItems: 'flex-start', gap: 14, fontWeight: 500 }}>
        <Lightbulb size={26} color="#93c5fd" strokeWidth={1.7} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
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
        <Check size={24} style={{ marginBottom: 8, opacity: 0.4 }} aria-hidden="true" />
        No tasks yet - add one to stay organized!
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
                <Check size={12} color="var(--accent)" strokeWidth={2.2} aria-hidden="true" />
              </button>
              <span style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)' }}>{t.text}</span>
              <button onClick={() => onDelete(t.id)} aria-label="Delete task" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', lineHeight: 1, padding: '2px 4px' }}><X size={14} strokeWidth={1.8} aria-hidden="true" /></button>
            </div>
          ))}
        </div>
      )}
      {done.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, opacity: 0.5 }}>
          {done.map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--surface-3)', borderRadius: 10, border: '1px solid var(--border)', textDecoration: 'line-through' }}>
              <button onClick={() => onToggle(t.id)} style={{ width: 18, height: 18, borderRadius: 4, border: '2px solid var(--accent)', background: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Check size={12} color="#fff" strokeWidth={2.2} aria-hidden="true" />
              </button>
              <span style={{ flex: 1, fontSize: 13, color: 'var(--text-tertiary)' }}>{t.text}</span>
              <button onClick={() => onDelete(t.id)} aria-label="Delete task" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', lineHeight: 1, padding: '2px 4px' }}><X size={14} strokeWidth={1.8} aria-hidden="true" /></button>
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
            <button onClick={() => remove(s)} aria-label={`Remove ${s}`} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(196,191,255,0.5)', lineHeight: 1, padding: 0 }}><X size={13} strokeWidth={1.8} aria-hidden="true" /></button>
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
            placeholder="Type a skill - suggestions appear automatically..."
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
      .filter(c => isPostChatStatus(c.status) && c.chatDate)
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
    const status = normalizeStatus(c.status)
    if (status === 'interested') score += 3
    if (status === 'scheduled') score += 8
    if (['follow up', 'circle back'].includes(status)) score += 10
    if (isFinalStatus(status)) score += 15
    if (c.brief) score += 5
    if (c.followUpText) score += 3
    if (c.parsedProfile && !c.parsedProfile.error) score += 4
    return score
  }, 0)
}

// ─── Debrief Modal ───────────────────────────────────────────────────────────────
const VIBES = [
  { label: 'Crushed it', value: 'great', color: '#4ade80', bg: 'rgba(74,222,128,0.12)', border: 'rgba(74,222,128,0.3)' },
  { label: 'Solid', value: 'okay', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)' },
  { label: 'Awkward', value: 'awkward', color: '#f472b6', bg: 'rgba(244,114,182,0.12)', border: 'rgba(244,114,182,0.3)' },
]

function DebriefModal({ contact, onSave, onClose, isMobile = false }) {
  const [vibe, setVibe] = useState('')
  const [note, setNote] = useState('')
  const [followUpDays, setFollowUpDays] = useState(null)

  function handleSave() {
    const target = followUpDays ? (() => { const d = new Date(); d.setDate(d.getDate() + followUpDays); return d.toISOString().split('T')[0] })() : null
    onSave({ debrief: { vibe, note }, followUpDate: target || contact.followUpDate })
  }

  return (
    <div style={{ background: 'var(--surface-2)', borderRadius: isMobile ? '20px 20px 0 0' : 20, border: '1px solid var(--border-strong)', padding: isMobile ? '1.15rem' : '1.75rem', width: '100%', maxWidth: isMobile ? '100%' : 420, boxShadow: 'var(--shadow-lg)', maxHeight: isMobile ? 'calc(100dvh - 12px)' : 'none', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 17, fontWeight: 700, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <MessageSquareText size={18} strokeWidth={1.8} aria-hidden="true" />
          How'd it go?
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: 22, lineHeight: 1 }}><X size={16} strokeWidth={1.8} aria-hidden="true" /></button>
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
      <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Any quick notes while it's fresh... (saved to contact overview)" rows={3}
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
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexDirection: isMobile ? 'column-reverse' : 'row' }}>
        <button onClick={onClose} style={{ background: 'var(--surface-3)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 18px', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-sans)', width: isMobile ? '100%' : 'auto' }}>Skip</button>
        <button onClick={handleSave} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 22px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-display)', width: isMobile ? '100%' : 'auto' }}>Save debrief</button>
      </div>
    </div>
  )
}

// ─── Brain Dump Panel ────────────────────────────────────────────────────────────
function BrainDumpPanel({ onClose, user, isMobile = false }) {
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
    <div style={{ position: 'fixed', bottom: isMobile ? 0 : 80, right: isMobile ? 0 : 20, left: isMobile ? 0 : 'auto', width: isMobile ? '100%' : 320, background: 'var(--surface-2)', border: '1px solid var(--border-strong)', borderRadius: isMobile ? '20px 20px 0 0' : 20, padding: isMobile ? '1rem 1rem calc(1.1rem + env(safe-area-inset-bottom))' : '1.25rem', boxShadow: 'var(--shadow-lg)', zIndex: 200, maxHeight: isMobile ? '72dvh' : 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <NotebookText size={18} strokeWidth={1.8} aria-hidden="true" /> Quick Notes
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: 18, lineHeight: 1 }}><X size={16} strokeWidth={1.8} aria-hidden="true" /></button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder="Thought, idea, thing to remember..."
          autoFocus
          style={{ flex: 1, background: 'var(--surface-3)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none', fontFamily: 'var(--font-sans)' }} />
        <button onClick={add} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+</button>
      </div>
      <div style={{ maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {notes.length === 0 && <div style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center', padding: '1rem' }}>Nothing yet - dump your brain here</div>}
        {notes.map(n => (
          <div key={n.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: 'var(--surface-3)', borderRadius: 10, padding: '8px 10px', border: '1px solid var(--border)' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>{n.text}</div>
              <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 3 }}>{n.ts}</div>
            </div>
            <button onClick={() => remove(n.id)} aria-label="Delete note" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', lineHeight: 1, padding: '2px 4px', flexShrink: 0 }}><X size={14} strokeWidth={1.8} aria-hidden="true" /></button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Network Map ─────────────────────────────────────────────────────────────────
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

function NetworkMap({ contacts, onSelect, isMobile = false }) {
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
      <NetworkIcon size={32} style={{ marginBottom: 12, opacity: 0.3 }} aria-hidden="true" />
      Add contacts to see your network map
    </div>
  )

  const W = isMobile ? 420 : 700
  const H = isMobile ? 360 : 400
  const cx = W / 2, cy = H / 2
  const count = contacts.length
  const r = Math.min(cx - (isMobile ? 58 : 70), cy - (isMobile ? 58 : 60), (isMobile ? 30 : 38) * Math.sqrt(count))

  const nodes = contacts.map((c, i) => ({
    ...c,
    x: count === 1 ? cx : cx + r * Math.cos((2 * Math.PI * i / count) - Math.PI / 2),
    y: count === 1 ? cy : cy + r * Math.sin((2 * Math.PI * i / count) - Math.PI / 2),
  }))

  const allEdges = buildEdges(nodes, activeTypes)
  const edges = allEdges.slice(0, MAX_EDGES)
  const clipped = allEdges.length > MAX_EDGES

  // For hovered node - find all connected nodes + their edge type
  const hoveredEdges = hovered ? edges.filter(e => e.a.id === hovered || e.b.id === hovered) : []
  const hoveredConnectedIds = new Set(hoveredEdges.flatMap(e => [e.a.id, e.b.id]))
  const isFiltering = hovered !== null

  // Sidebar info for hovered node
  const hoveredNode = hovered ? nodes.find(n => n.id === hovered) : null

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 12 : 16 }}>
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
          <span style={{ marginLeft: isMobile ? 0 : 'auto', width: isMobile ? '100%' : 'auto', fontSize: 10, color: 'var(--text-tertiary)', alignSelf: 'center' }}>
            {edges.length} link{edges.length !== 1 ? 's' : ''}{clipped ? ` (max ${MAX_EDGES})` : ''}
          </span>
        </div>

        {/* Status dots */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
          {STATUS_OPTIONS.map(status => (
            <div key={status.value} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-tertiary)' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: status.accent }} /> {status.label}
            </div>
          ))}
          {isFiltering && !isMobile && <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginLeft: 'auto' }}>Hover a node to highlight its connections</div>}
        </div>

        <div style={{ background: isMobile ? 'rgba(244,247,249,0.03)' : 'transparent', border: isMobile ? '1px solid var(--border)' : 'none', borderRadius: isMobile ? 16 : 0, padding: isMobile ? 8 : 0, overflow: 'hidden' }}>
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
            const nc = statusMeta(n.status).accent
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
                {!isMobile && <text x={n.x} y={n.y + 33} textAnchor="middle" fontSize={9} fill={isHov ? 'var(--text-primary)' : 'var(--text-secondary)'} fontWeight={isHov ? '600' : '400'} fontFamily="var(--font-sans)">
                  {n.name.split(' ')[0]}
                </text>}
              </g>
            )
          })}
        </svg>
        </div>
      </div>

      {/* Hover info panel */}
      <div style={{ width: isMobile ? '100%' : 280, flexShrink: 0 }}>
        {hoveredNode ? (
          <div style={{ background: 'var(--surface-3)', border: '1px solid var(--border-strong)', borderRadius: 14, padding: isMobile ? 14 : 18, height: isMobile ? 'auto' : '100%', boxSizing: 'border-box' }}>
            <div style={{ fontWeight: 700, fontSize: 16, fontFamily: 'var(--font-display)', color: statusMeta(hoveredNode.status).accent, marginBottom: 4 }}>{hoveredNode.name}</div>
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
          <div style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 14, padding: isMobile ? '12px 14px' : 18, height: isMobile ? 'auto' : '100%', boxSizing: 'border-box', display: 'flex', flexDirection: isMobile ? 'row' : 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <NetworkIcon size={isMobile ? 18 : 28} style={{ opacity: 0.3, flexShrink: 0 }} aria-hidden="true" />
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', textAlign: isMobile ? 'left' : 'center', lineHeight: 1.6 }}>{isMobile ? 'Tap a node to open the contact.' : 'Hover a node to see their connections'}</div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Edit Profile Modal ─────────────────────────────────────────────────────────
function EditProfileModal({ profile, onSave, onClose, onLogout, isMobile }) {
  const [name, setName] = useState(profile.name || '')
  const [school, setSchool] = useState(profile.school || '')
  const [major, setMajor] = useState(profile.major || '')
  const [goals, setGoals] = useState(profile.goals || '')
  const [skills, setSkills] = useState(profile.skills || [])
  const [pendingSkill, setPendingSkill] = useState('')

  const inp = { width: '100%', background: 'var(--surface-3)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)', borderRadius: 8, padding: '9px 12px', fontSize: 14, outline: 'none', fontFamily: 'var(--font-sans)', marginBottom: 16 }

  return (
    <div style={{ background: 'var(--surface-2)', borderRadius: isMobile ? '20px 20px 0 0' : 20, border: '1px solid var(--border-strong)', padding: isMobile ? '1.15rem' : '1.75rem', width: '100%', maxWidth: isMobile ? '100%' : 460, boxShadow: 'var(--shadow-lg)', maxHeight: isMobile ? 'calc(100dvh - 12px)' : '85vh', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-display)' }}>Edit Profile</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: 22, lineHeight: 1 }}><X size={16} strokeWidth={1.8} aria-hidden="true" /></button>
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
      <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', flexDirection: isMobile ? 'column' : 'row', marginTop: 20 }}>
        {isMobile && onLogout
          ? <button onClick={onLogout} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-sans)', padding: '10px 4px' }}>Log out</button>
          : <div />}
        <div style={{ display: 'flex', gap: 10, flexDirection: isMobile ? 'column-reverse' : 'row', width: isMobile ? '100%' : 'auto' }}>
          <button onClick={onClose} style={{ background: 'var(--surface-3)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 18px', fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-sans)', width: isMobile ? '100%' : 'auto' }}>Cancel</button>
          <button onClick={() => {
            const finalSkills = pendingSkill.trim() && !skills.includes(pendingSkill.trim()) ? [...skills, pendingSkill.trim()] : skills
            onSave({ ...profile, name: name.trim(), school: school.trim(), major: major.trim(), goals: goals.trim(), skills: finalSkills })
          }} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-display)', width: isMobile ? '100%' : 'auto' }}>Save</button>
        </div>
      </div>
    </div>
  )
}

// ─── Add Contact Modal ──────────────────────────────────────────────────────────
export const HOW_WE_MET = [] // user-defined - see getHowWeMetSuggestions()

function AddModal({ onAdd, onClose, contacts = [], isMobile = false }) {
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [company, setCompany] = useState('')
  const [howWeMet, setHowWeMet] = useState('')
  const inp = { width: '100%', background: 'var(--surface-3)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)', borderRadius: 8, padding: '9px 12px', fontSize: 14, outline: 'none', fontFamily: 'var(--font-sans)', marginBottom: 14 }
  // Pull suggestions from existing contacts' howWeMet values
  const suggestions = [...new Set(contacts.map(c => c.howWeMet).filter(Boolean))].slice(0, 8)
  return (
    <div style={{ background: 'var(--surface-2)', borderRadius: isMobile ? '20px 20px 0 0' : 20, border: '1px solid var(--border-strong)', padding: isMobile ? '1.15rem' : '1.75rem', width: '100%', maxWidth: isMobile ? '100%' : 440, boxShadow: 'var(--shadow-lg)', maxHeight: isMobile ? 'calc(100dvh - 12px)' : 'none', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 17, fontWeight: 700, fontFamily: 'var(--font-display)' }}>New contact</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: 22, lineHeight: 1 }}><X size={16} strokeWidth={1.8} aria-hidden="true" /></button>
      </div>
      <label style={{ display: 'block', fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Full name</label>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Alex Chen" autoFocus style={inp} />
      <div style={{ display: 'flex', gap: 12, flexDirection: isMobile ? 'column' : 'row' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Role</label>
          <input value={role} onChange={e => setRole(e.target.value)} placeholder="Senior SWE" style={inp} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Company</label>
          <input value={company} onChange={e => setCompany(e.target.value)} placeholder="Amazon" style={inp} />
        </div>
      </div>
      <label style={{ display: 'block', fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>How we met <span style={{ fontWeight: 400, opacity: 0.5 }}>(optional)</span></label>
      <input value={howWeMet} onChange={e => setHowWeMet(e.target.value)} placeholder="e.g. Coffee chat, LinkedIn, Networking event..." style={{ ...inp, marginBottom: suggestions.length ? 8 : 18 }} />
      {suggestions.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
          {suggestions.map(s => (
            <button key={s} onClick={() => setHowWeMet(s)}
              style={{ padding: '4px 10px', borderRadius: 20, border: `1px solid ${howWeMet === s ? 'var(--accent)' : 'var(--border)'}`, background: howWeMet === s ? 'var(--accent-dim)' : 'var(--surface-3)', color: howWeMet === s ? 'var(--accent)' : 'var(--text-secondary)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
              {s}
            </button>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexDirection: isMobile ? 'column-reverse' : 'row' }}>
        <button onClick={onClose} style={{ background: 'var(--surface-3)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 18px', fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-sans)', width: isMobile ? '100%' : 'auto' }}>Cancel</button>
        <button onClick={() => { if (name.trim()) onAdd({ name, role, company, howWeMet }) }} disabled={!name.trim()}
          style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontSize: 14, fontWeight: 600, cursor: name.trim() ? 'pointer' : 'not-allowed', opacity: name.trim() ? 1 : 0.4, fontFamily: 'var(--font-display)', width: isMobile ? '100%' : 'auto' }}>
          Add contact
        </button>
      </div>
    </div>
  )
}

// ─── Schedule Meeting Modal ─────────────────────────────────────────────────────
function ScheduleModal({ contacts, onSchedule, onClose, prefillDate, isMobile = false }) {
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
    <div style={{ background: 'var(--surface-2)', borderRadius: isMobile ? '20px 20px 0 0' : 20, border: '1px solid var(--border-strong)', padding: isMobile ? '1.15rem' : '1.75rem', width: '100%', maxWidth: isMobile ? '100%' : 420, boxShadow: 'var(--shadow-lg)', maxHeight: isMobile ? 'calc(100dvh - 12px)' : 'none', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 17, fontWeight: 700, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <CalendarDays size={18} strokeWidth={1.8} aria-hidden="true" />
          Schedule Meeting
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: 22, lineHeight: 1 }}><X size={16} strokeWidth={1.8} aria-hidden="true" /></button>
      </div>
      <label style={{ display: 'block', fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Contact</label>
      <select value={contactId} onChange={e => setContactId(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
        {contacts.map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` - ${c.company}` : ''}</option>)}
      </select>
      <div style={{ display: 'flex', gap: 12, flexDirection: isMobile ? 'column' : 'row' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inp} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Time</label>
          <input type="time" value={time} onChange={e => setTime(e.target.value)} style={inp} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexDirection: isMobile ? 'column-reverse' : 'row' }}>
        <button onClick={onClose} style={{ background: 'var(--surface-3)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 18px', fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-sans)', width: isMobile ? '100%' : 'auto' }}>Cancel</button>
        <button onClick={handleSchedule} disabled={!date} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontSize: 14, fontWeight: 600, cursor: date ? 'pointer' : 'not-allowed', opacity: date ? 1 : 0.4, fontFamily: 'var(--font-display)', width: isMobile ? '100%' : 'auto' }}>
          Schedule
        </button>
      </div>
    </div>
  )
}

// ─── Scheduled Tasks Panel ───────────────────────────────────────────────────────
function ScheduledTasksPanel({ tasks, contacts, onAdd, onToggle, onDelete, isMobile = false }) {
  const [text, setText] = useState('')
  const [date, setDate] = useState('')
  const [forWho, setForWho] = useState('')

  function handleAdd() {
    if (!text.trim()) return
    onAdd({ text: text.trim(), date, forWho })
    setText(''); setDate(''); setForWho('')
  }

  const sorted = [...tasks].sort((a, b) => {
    if (!a.date && !b.date) return 0
    if (!a.date) return 1
    if (!b.date) return -1
    return new Date(a.date) - new Date(b.date)
  })
  const todayStr = new Date().toISOString().split('T')[0]

  return (
      <div style={{ marginTop: 24 }}>
      <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-display)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <ListChecks size={16} strokeWidth={1.8} aria-hidden="true" />
        Scheduled Tasks
      </div>

      {/* Add task form */}
      <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 14, padding: isMobile ? 12 : '14px 16px', marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end', flexDirection: isMobile ? 'column' : 'row' }}>
          <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Task description..."
            style={{ flex: 2, minWidth: isMobile ? 0 : 160, width: isMobile ? '100%' : 'auto', background: 'var(--surface-3)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', fontFamily: 'var(--font-sans)' }} />
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            style={{ flex: 1, minWidth: isMobile ? 0 : 130, width: isMobile ? '100%' : 'auto', background: 'var(--surface-3)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', fontFamily: 'var(--font-sans)' }} />
          <select value={forWho} onChange={e => setForWho(e.target.value)}
            style={{ flex: 1, minWidth: isMobile ? 0 : 130, width: isMobile ? '100%' : 'auto', background: 'var(--surface-3)', color: forWho ? 'var(--text-primary)' : 'var(--text-tertiary)', border: '1px solid var(--border-strong)', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', fontFamily: 'var(--font-sans)' }}>
            <option value="">For who? (optional)</option>
            {contacts.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
          <button onClick={handleAdd} disabled={!text.trim()}
            style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: text.trim() ? 'pointer' : 'not-allowed', opacity: text.trim() ? 1 : 0.4, fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap', width: isMobile ? '100%' : 'auto' }}>
            + Add
          </button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center', padding: '20px 0' }}>No scheduled tasks yet</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sorted.map(task => {
            const overdue = task.date && task.date < todayStr && !task.done
            const dateLabel = task.date ? new Date(task.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''
            return (
              <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--surface-2)', border: `1px solid ${overdue ? 'rgba(248,113,113,0.25)' : 'var(--border)'}`, borderRadius: 12, padding: '12px 16px', opacity: task.done ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                <button onClick={() => onToggle(task.id)} style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${task.done ? 'var(--accent)' : 'var(--border-strong)'}`, background: task.done ? 'var(--accent)' : 'transparent', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                  {task.done && <Check size={11} color="#fff" strokeWidth={2.2} aria-hidden="true" />}
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', textDecoration: task.done ? 'line-through' : 'none' }}>{task.text}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
                    {task.forWho && <span style={{ fontSize: 11, color: 'var(--accent)' }}> {task.forWho}</span>}
                    {dateLabel && <span style={{ fontSize: 11, color: overdue ? '#f87171' : 'var(--text-tertiary)' }}> {dateLabel}{overdue ? ' · overdue' : ''}</span>}
                  </div>
                </div>
                <button onClick={() => onDelete(task.id)} aria-label="Delete scheduled task" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', lineHeight: 1, padding: 4 }}><X size={14} strokeWidth={1.8} aria-hidden="true" /></button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Resume Tab ──────────────────────────────────────────────────────────────────
const RESUME_TIPS = [
  { title: 'Keep it to one page', body: 'For students and recent grads, one page is the standard. Recruiters spend ~7 seconds on a first scan.' },
  { title: 'Lead with impact numbers', body: 'Replace "helped with marketing" with "grew Instagram engagement 40% in 3 months." Quantify everything you can.' },
  { title: 'Beat the ATS bots', body: "Most companies use applicant tracking software. Mirror exact keywords from the job description - don't paraphrase." },
  { title: 'Tailor for every role', body: 'Keep a master resume and create a trimmed, targeted version for each application. Generic resumes get filtered out.' },
  { title: 'Start every bullet with an action verb', body: '"Led," "Built," "Designed," "Increased" - not "Responsible for" or "Helped with."' },
  { title: 'Ruthless formatting', body: 'Consistent fonts, aligned margins, no photos. Save as PDF. Name it "FirstLast_Resume.pdf" - not "resume_FINAL_v3.pdf".' },
]

function ResumeTab({ resume, profile, onUpdateResume, onUpdateProfile, isMobile = false }) {
  const [analysis, setAnalysis] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [linkedinUploading, setLinkedinUploading] = useState(false)
  const [linkedinError, setLinkedinError] = useState('')
  const fileRef = React.useRef()
  const linkedinFileRef = React.useRef()

  const parsed = resume?.parsed && !resume.parsed.error ? resume.parsed : null
  const linkedinProfile = profile?.linkedinParsedProfile && !profile.linkedinParsedProfile.error ? profile.linkedinParsedProfile : null

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

  async function handleLinkedInUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setLinkedinUploading(true); setLinkedinError('')
    try {
      const text = await extractTextFromPDF(file)
      const raw = await parseLinkedInPDF(text)
      const parsedProfile = JSON.parse(raw.replace(/```json|```/g, '').trim())
      onUpdateProfile?.({
        linkedinPdfName: file.name,
        linkedinProfileText: text,
        linkedinParsedProfile: parsedProfile,
      })
    } catch {
      setLinkedinError('LinkedIn parse failed. Try a profile PDF saved from LinkedIn.')
    } finally {
      setLinkedinUploading(false)
      if (linkedinFileRef.current) linkedinFileRef.current.value = ''
    }
  }

  const scoreColor = s => s >= 85 ? '#4ade80' : s >= 70 ? '#fbbf24' : s >= 50 ? '#fb923c' : '#f87171'
  const resumeStats = [
    { label: 'Experience', value: parsed?.experience?.length || 0, icon: ListChecks, accent: 'var(--green-text)' },
    { label: 'Skills', value: parsed?.skills?.length || 0, icon: Zap, accent: 'var(--cyan)' },
    { label: 'Projects', value: parsed?.projects?.length || 0, icon: NotebookText, accent: 'var(--amber)' },
    { label: 'Education', value: parsed?.education?.length || 0, icon: Target, accent: 'var(--rose)' },
  ]
  const topSkills = parsed?.skills?.slice(0, 10) || []
  const careerGoal = profile?.goals?.trim()
  const resumeHeadline = parsed
    ? `${parsed.experience?.length || 0} experience entries, ${parsed.skills?.length || 0} skills, and ${parsed.projects?.length || 0} projects are ready for prep briefs and job matching.`
    : 'Upload a resume to turn your background into a usable career signal for prep briefs, job targeting, and networking follow-through.'
  const hasParsedContent = !!parsed
  const parsedGridColumns = isMobile ? '1fr' : 'minmax(0, 1.55fr) minmax(340px, 0.75fr)'
  const hasResumeSideRail = !isMobile && parsed?.skills?.length > 0
  const linkedinStats = [
    { label: 'Roles', value: linkedinProfile?.companies?.length || 0, accent: 'var(--green-text)' },
    { label: 'Skills', value: linkedinProfile?.skills?.length || 0, accent: 'var(--cyan)' },
    { label: 'Schools', value: linkedinProfile?.education?.length || 0, accent: 'var(--amber)' },
  ]
  const linkedinTips = linkedinProfile ? [
    !linkedinProfile.website && 'Add a portfolio or project link so profile traffic has a next step.',
    (linkedinProfile.skills?.length || 0) < 6 && 'Round out the skills section with the tools you want recruiters to associate with you.',
    careerGoal && `Keep your headline and About section aligned with this goal: ${careerGoal}`,
    parsed?.projects?.length ? 'Make your strongest project visible on LinkedIn, not only on the resume.' : 'Add one strong project so the profile has proof beyond roles.',
  ].filter(Boolean).slice(0, 4) : []

  return (
    <div style={{ maxWidth: 1440, margin: '0 auto', padding: isMobile ? '0 0 calc(6rem + env(safe-area-inset-bottom))' : '1.25rem 1.5rem 1.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1.45fr) minmax(280px, 0.75fr)', gap: isMobile ? 12 : 18, alignItems: 'stretch', marginBottom: isMobile ? 12 : 18 }}>
        <div className="dossier-panel" style={{ padding: isMobile ? 18 : 22, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(197,255,90,0.08), transparent 32%, rgba(143,227,255,0.09))', pointerEvents: 'none' }} />
          <div style={{ position: 'relative' }}>
            <div className="section-kicker" style={{ color: 'var(--accent)', marginBottom: 12 }}>Career signal</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? 34 : 'clamp(34px, 5vw, 62px)', lineHeight: 0.96, letterSpacing: 0, margin: '0 0 12px' }}>Resume OS</h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: isMobile ? 1.55 : 1.7, maxWidth: 700, fontSize: isMobile ? 14 : 15 }}>{resumeHeadline}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: isMobile ? 14 : 18 }}>
              <span style={{ fontSize: 12, color: resume ? 'var(--green-text)' : 'var(--text-tertiary)', border: `1px solid ${resume ? 'rgba(74,222,128,0.28)' : 'var(--border)'}`, background: resume ? 'rgba(74,222,128,0.08)' : 'rgba(244,247,249,0.04)', borderRadius: 100, padding: '5px 10px' }}>{resume ? 'Resume uploaded' : 'Resume needed'}</span>
              {hasParsedContent && <span style={{ fontSize: 12, color: 'var(--cyan)', border: '1px solid rgba(143,227,255,0.25)', background: 'rgba(143,227,255,0.08)', borderRadius: 100, padding: '5px 10px' }}>Parsed profile ready</span>}
              {profile?.resumeName && <span style={{ fontSize: 12, color: 'var(--text-secondary)', border: '1px solid var(--border)', background: 'rgba(244,247,249,0.04)', borderRadius: 100, padding: '5px 10px' }}>{profile.resumeName}</span>}
            </div>
          </div>
        </div>

        <div className="dossier-panel" style={{ padding: isMobile ? 16 : 18, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div className="section-kicker" style={{ color: 'var(--amber)', marginBottom: 10 }}>Control room</div>
            <div style={{ color: 'var(--text-primary)', fontWeight: 700, marginBottom: 6 }}>{resume ? 'Keep this source sharp' : 'Add your source document'}</div>
            <div style={{ color: 'var(--text-tertiary)', fontSize: 13, lineHeight: 1.6 }}>{resume ? 'Refresh the PDF or run analysis when your resume changes.' : 'Drop a PDF and NoShow OS will pull out the useful career context.'}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexDirection: isMobile ? 'column' : 'row' }}>
          <input ref={fileRef} type="file" accept="application/pdf" style={{ display: 'none' }} onChange={handleReupload} />
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: isMobile ? '100%' : 'auto', padding: '9px 16px', background: 'var(--surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border-strong)', borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
            {uploading ? <Spinner /> : <Upload size={14} strokeWidth={1.8} aria-hidden="true" />} {resume ? 'Replace resume' : 'Upload resume'}
          </button>
          {resume && (
            <button onClick={handleAnalyze} disabled={analyzing}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: isMobile ? '100%' : 'auto', padding: '9px 18px', background: 'var(--accent)', color: 'var(--accent-fg)', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: analyzing ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-sans)', opacity: analyzing ? 0.7 : 1 }}>
              {analyzing ? <><Spinner />Analyzing...</> : <><Sparkles size={14} strokeWidth={1.8} aria-hidden="true" /> AI Analysis</>}
            </button>
          )}
          </div>
        </div>
      </div>

      {resume && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, minmax(0, 1fr))' : 'repeat(auto-fit, minmax(145px, 1fr))', gap: isMobile ? 10 : 12, marginBottom: isMobile ? 14 : 20 }}>
          {resumeStats.map(stat => {
            const Icon = stat.icon
            return (
              <div key={stat.label} style={{ background: 'rgba(244,247,249,0.04)', border: '1px solid var(--border)', borderRadius: 12, padding: isMobile ? 12 : 14, minHeight: isMobile ? 82 : 92 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span className="section-kicker">{stat.label}</span>
                  <Icon size={17} color={stat.accent} strokeWidth={1.8} aria-hidden="true" />
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? 28 : 30, lineHeight: 1, fontWeight: 800, color: stat.accent }}>{stat.value}</div>
              </div>
            )
          })}
        </div>
      )}

      <div className="dossier-panel" style={{ padding: isMobile ? 16 : 20, marginBottom: isMobile ? 14 : 20, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 0.8fr) minmax(0, 1.2fr)', gap: isMobile ? 14 : 22, alignItems: 'start' }}>
        <div>
          <div className="section-kicker" style={{ color: 'var(--cyan)', marginBottom: 10 }}>LinkedIn profile</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? 22 : 26, lineHeight: 1.05, fontWeight: 800, marginBottom: 8 }}>Public signal check</div>
          <div style={{ color: 'var(--text-tertiary)', fontSize: 13, lineHeight: 1.65, marginBottom: 14 }}>
            Upload your LinkedIn profile PDF to compare what your public profile is saying against your resume and goals.
          </div>
          <input ref={linkedinFileRef} type="file" accept="application/pdf" style={{ display: 'none' }} onChange={handleLinkedInUpload} />
          <button onClick={() => linkedinFileRef.current?.click()} disabled={linkedinUploading}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: isMobile ? '100%' : 'auto', padding: '9px 16px', background: linkedinProfile ? 'var(--surface-3)' : 'var(--accent)', color: linkedinProfile ? 'var(--text-secondary)' : 'var(--accent-fg)', border: linkedinProfile ? '1px solid var(--border-strong)' : 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: linkedinUploading ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-sans)', opacity: linkedinUploading ? 0.7 : 1 }}>
            {linkedinUploading ? <Spinner /> : <Upload size={14} strokeWidth={1.8} aria-hidden="true" />}
            {linkedinProfile ? 'Replace LinkedIn PDF' : 'Upload LinkedIn PDF'}
          </button>
          {profile?.linkedinPdfName && <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-tertiary)' }}>{profile.linkedinPdfName}</div>}
          {linkedinError && <div style={{ marginTop: 10, fontSize: 12, color: 'var(--red-text)', lineHeight: 1.5 }}>{linkedinError}</div>}
        </div>

        {linkedinProfile ? (
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3, minmax(0, 1fr))' : 'repeat(3, minmax(0, 120px))', gap: 8 }}>
              {linkedinStats.map(stat => (
                <div key={stat.label} style={{ background: 'rgba(244,247,249,0.04)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 12px', minWidth: 0 }}>
                  <div className="section-kicker" style={{ marginBottom: 8 }}>{stat.label}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, lineHeight: 1, fontWeight: 800, color: stat.accent }}>{stat.value}</div>
                </div>
              ))}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.65 }}>
              {linkedinProfile.summary || 'LinkedIn profile parsed. Add more profile content to get a stronger readout.'}
            </div>
            {linkedinProfile.skills?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {linkedinProfile.skills.slice(0, 8).map((skill, i) => (
                  <span key={`${skill}-${i}`} style={{ fontSize: 11, padding: '5px 10px', borderRadius: 100, color: i < 4 ? 'var(--accent)' : 'var(--cyan)', border: `1px solid ${i < 4 ? 'rgba(197,255,90,0.3)' : 'rgba(143,227,255,0.25)'}`, background: i < 4 ? 'rgba(197,255,90,0.09)' : 'rgba(143,227,255,0.08)', fontWeight: 700 }}>{skill}</span>
                ))}
              </div>
            )}
            {linkedinTips.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                {linkedinTips.map((tip, i) => (
                  <div key={i} style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.55, padding: '10px 12px', borderRadius: 12, background: i % 2 === 0 ? 'rgba(197,255,90,0.06)' : 'rgba(143,227,255,0.06)', border: `1px solid ${i % 2 === 0 ? 'rgba(197,255,90,0.18)' : 'rgba(143,227,255,0.18)'}` }}>{tip}</div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{ border: '1px dashed rgba(143,227,255,0.28)', borderRadius: 14, padding: isMobile ? '18px' : '22px', minHeight: 150, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8, color: 'var(--text-tertiary)' }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>No LinkedIn PDF yet</div>
            <div style={{ fontSize: 13, lineHeight: 1.6 }}>From LinkedIn, open your profile, choose More, save as PDF, then upload it here.</div>
          </div>
        )}
      </div>

      {!resume ? (
        /* No resume - show upload prompt + tips */
        <div>
          <div style={{ background: 'linear-gradient(135deg, rgba(143,227,255,0.08), rgba(197,255,90,0.06))', border: '1px dashed rgba(143,227,255,0.32)', borderRadius: 16, padding: isMobile ? '2rem 1rem' : '3rem 2rem', textAlign: 'center', marginBottom: 28, boxShadow: 'var(--shadow-md)' }}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) { const ev = { target: { files: [f] } }; handleReupload(ev) } }}>
            <FileText size={38} style={{ marginBottom: 12, color: 'var(--cyan)' }} aria-hidden="true" />
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Drop your resume here</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>PDF only. NoShow OS will parse it and give you personalized feedback.</div>
            <button onClick={() => fileRef.current?.click()}
              style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
              Choose file
            </button>
          </div>
          <div className="section-kicker" style={{ color: 'var(--amber)', marginBottom: 14 }}>Resume tips</div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
            {RESUME_TIPS.map((tip, i) => (
              <div key={i} style={{ background: 'linear-gradient(180deg, rgba(22,35,48,0.96), rgba(16,25,35,0.96))', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px' }}>
                <FileText size={20} style={{ marginBottom: 8, color: 'var(--accent)' }} aria-hidden="true" />
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{tip.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.7 }}>{tip.body}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 14 : 20 }}>
          {/* AI Analysis result */}
          {analyzeError && <div style={{ fontSize: 13, color: 'var(--red-text)', padding: '10px 14px', background: 'rgba(239,68,68,0.08)', borderRadius: 10, border: '1px solid var(--red-border)' }}>{analyzeError}</div>}
          {topSkills.length > 0 && (
            <div className="dossier-panel" style={{ padding: isMobile ? 16 : 20, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(260px, 0.7fr) minmax(0, 1.3fr)', gap: isMobile ? 12 : 22, alignItems: 'center' }}>
              <div>
                <div className="section-kicker" style={{ color: 'var(--cyan)', marginBottom: 10 }}>Skill focus</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? 21 : 24, lineHeight: 1.1, fontWeight: 800, marginBottom: 8 }}>What the resume is saying first</div>
                <div style={{ color: 'var(--text-tertiary)', fontSize: 13, lineHeight: 1.6 }}>The first skills become the fastest scan for recruiters, coffee chat prep, and job matching.</div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {topSkills.map((skill, i) => (
                  <span key={`${skill}-${i}`} style={{ fontSize: 12, padding: '6px 12px', borderRadius: 100, border: `1px solid ${i < 4 ? 'rgba(197,255,90,0.34)' : 'rgba(143,227,255,0.24)'}`, background: i < 4 ? 'rgba(197,255,90,0.1)' : 'rgba(143,227,255,0.08)', color: i < 4 ? 'var(--accent)' : 'var(--cyan)', fontWeight: 700 }}>{skill}</span>
                ))}
              </div>
            </div>
          )}
          {analysis && (
            <div style={{ background: 'linear-gradient(135deg, rgba(139,127,255,0.07), rgba(99,179,255,0.04))', border: '1px solid rgba(139,127,255,0.2)', borderRadius: 16, padding: isMobile ? '16px' : '20px 22px' }}>
              {/* Score */}
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: 16, marginBottom: 16 }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                {/* Strengths */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Strengths</div>
                  {analysis.strengths?.map((s, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>
                      <Check size={13} color="#4ade80" strokeWidth={2.2} style={{ flexShrink: 0 }} aria-hidden="true" />{s}
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Quick wins</div>
                  {analysis.quickWins?.map((w, i) => (
                    <div key={i} style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 6, lineHeight: 1.6, display: 'flex', gap: 8, alignItems: 'flex-start' }}><ArrowRight size={14} strokeWidth={1.8} style={{ marginTop: 3, flexShrink: 0, color: 'var(--accent)' }} aria-hidden="true" />{w}</div>
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
            <div style={{ display: 'grid', gridTemplateColumns: parsedGridColumns, gap: isMobile ? 12 : 16, alignItems: 'start' }}>
              {/* Career goals */}
              {(careerGoal || parsed.summary) && (
                <div className="paper-panel" style={{ gridColumn: hasResumeSideRail ? '1 / 2' : '1 / -1', borderRadius: 14, padding: isMobile ? '16px' : '20px 24px' }}>
                  <div className="section-kicker" style={{ color: 'rgba(16,25,35,0.62)', marginBottom: 10 }}>Career goals</div>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: isMobile ? 15 : 17, color: 'var(--text-ink)', lineHeight: isMobile ? 1.55 : 1.6 }}>
                    {careerGoal || 'Add a career goal in your profile so NoShow OS can tune resume, LinkedIn, and job matching advice around where you are trying to go.'}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
                    {profile?.school && <span style={{ fontSize: 11, color: 'rgba(16,25,35,0.72)', border: '1px solid rgba(16,25,35,0.16)', borderRadius: 100, padding: '4px 9px' }}>{profile.school}</span>}
                    {profile?.major && <span style={{ fontSize: 11, color: 'rgba(16,25,35,0.72)', border: '1px solid rgba(16,25,35,0.16)', borderRadius: 100, padding: '4px 9px' }}>{profile.major}</span>}
                    {parsed.skills?.slice(0, 3).map(skill => (
                      <span key={skill} style={{ fontSize: 11, color: 'rgba(16,25,35,0.72)', border: '1px solid rgba(16,25,35,0.16)', borderRadius: 100, padding: '4px 9px' }}>{skill}</span>
                    ))}
                  </div>
                </div>
              )}
              {/* Experience */}
              {parsed.experience?.length > 0 && (
                <div className="dossier-panel" style={{ gridColumn: hasResumeSideRail ? '1 / 2' : '1 / -1', padding: isMobile ? '16px' : '20px 22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <ListChecks size={16} color="var(--green-text)" strokeWidth={1.8} aria-hidden="true" />
                    <div className="section-kicker" style={{ color: 'var(--green-text)' }}>Experience</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))', columnGap: 18, rowGap: 12 }}>
                    {parsed.experience.map((e, i) => (
                      <div key={i} style={{ fontSize: isMobile ? 12 : 13, color: 'var(--text-primary)', lineHeight: isMobile ? 1.55 : 1.62, padding: '0 0 10px 14px', borderLeft: '2px solid rgba(74,222,128,0.28)', borderBottom: '1px solid var(--border)' }}>{e}</div>
                    ))}
                  </div>
                </div>
              )}
              {/* Skills */}
              {parsed.skills?.length > 0 && (
                <div className="dossier-panel" style={{ gridColumn: isMobile ? 'auto' : '2 / 3', gridRow: isMobile ? 'auto' : parsed.summary ? '1 / span 2' : 'auto', padding: isMobile ? '16px' : '20px 22px', position: isMobile ? 'static' : 'sticky', top: isMobile ? 'auto' : 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <Zap size={16} color="var(--cyan)" strokeWidth={1.8} aria-hidden="true" />
                    <div className="section-kicker" style={{ color: 'var(--cyan)' }}>Skills</div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                    {parsed.skills.map((s, i) => (
                      <span key={i} style={{ fontSize: isMobile ? 11 : 12, padding: isMobile ? '5px 10px' : '5px 12px', background: i < 8 ? 'rgba(143,227,255,0.1)' : 'var(--surface-3)', color: i < 8 ? 'var(--cyan)' : 'var(--text-primary)', border: `1px solid ${i < 8 ? 'rgba(143,227,255,0.28)' : 'var(--border-strong)'}`, borderRadius: 100, fontWeight: 600 }}>{s}</span>
                    ))}
                  </div>
                  {/* Education */}
                  {parsed.education?.length > 0 && (
                    <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                      <div className="section-kicker" style={{ color: 'var(--rose)', marginBottom: 8 }}>Education</div>
                      {parsed.education.map((e, i) => (
                        <div key={i} style={{ fontSize: isMobile ? 12 : 13, color: 'var(--text-primary)', marginBottom: 6, lineHeight: 1.6 }}>{e}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {/* Projects */}
              {parsed.projects?.length > 0 && (
                <div className="dossier-panel" style={{ gridColumn: '1 / -1', padding: isMobile ? '16px' : '20px 22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <NotebookText size={16} color="var(--amber)" strokeWidth={1.8} aria-hidden="true" />
                    <div className="section-kicker" style={{ color: 'var(--amber)' }}>Projects</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
                    {parsed.projects.map((p, i) => (
                      <div key={i} style={{ fontSize: isMobile ? 12 : 13, color: 'var(--text-primary)', lineHeight: 1.6, padding: '12px 14px', background: i % 2 === 0 ? 'rgba(251,191,36,0.08)' : 'rgba(244,114,182,0.08)', border: `1px solid ${i % 2 === 0 ? 'rgba(251,191,36,0.22)' : 'rgba(244,114,182,0.22)'}`, borderRadius: 12 }}>{p}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Static tips at the bottom */}
          <div>
            <div className="section-kicker" style={{ color: 'var(--amber)', marginBottom: 14 }}>General tips</div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
              {RESUME_TIPS.map((tip, i) => (
                <div key={i} style={{ background: i % 2 === 0 ? 'rgba(197,255,90,0.06)' : 'rgba(143,227,255,0.06)', border: `1px solid ${i % 2 === 0 ? 'rgba(197,255,90,0.18)' : 'rgba(143,227,255,0.18)'}`, borderRadius: 14, padding: '16px 18px' }}>
                  <FileText size={20} style={{ marginBottom: 8, color: i % 2 === 0 ? 'var(--accent)' : 'var(--cyan)' }} aria-hidden="true" />
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
function LoginScreen() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleGoogle() {
    setLoading(true); setError('')
    try {
      await signInWithGoogle()
    } catch (e) {
      setError('Sign in failed. Try again.')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '1rem' }}>
      <GlobalStyles />
      <div style={{ width: '100%', maxWidth: 360, background: 'var(--surface-2)', border: '1px solid var(--border-strong)', borderRadius: 24, padding: '2.5rem 2rem', boxShadow: 'var(--shadow-lg)', textAlign: 'center' }}>
        <ContactIcon size={40} style={{ marginBottom: 12, color: 'var(--accent)' }} aria-hidden="true" />
        <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', marginBottom: 6 }}>NoShow OS</div>
        <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: '2rem', lineHeight: 1.5 }}>
          Show up prepared. Every time.<br />
          <span style={{ opacity: 0.6 }}>Your contacts sync across all your devices.</span>
        </div>

        <button
          onClick={handleGoogle}
          disabled={loading}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, background: '#fff', color: '#1f1f1f', border: '1px solid rgba(0,0,0,0.15)', borderRadius: 12, padding: '13px 20px', fontSize: 15, fontWeight: 600, cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1, fontFamily: 'var(--font-sans)', boxShadow: '0 1px 4px rgba(0,0,0,0.12)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {loading ? 'Signing in...' : 'Continue with Google'}
        </button>

        {error && <div style={{ marginTop: 12, fontSize: 12, color: '#f87171' }}>{error}</div>}
      </div>
    </div>
  )
}

// ─── Main App ───────────────────────────────────────────────────────────────────
export default function App() {
  const authedUserId = useRef(null) // tracks which user we've already initialized for
  const [currentUser, setUser] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [profile, setProfile] = useState(null)
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [contacts, setContacts] = useState([])
  const [showNotionImport, setShowNotionImport] = useState(false)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])


  const [tab, setTab] = useState('home')
  useEffect(() => { window.scrollTo(0, 0) }, [tab])
  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showSchedule, setShowSchedule] = useState(false)
  const [detail, setDetail] = useState(null)
  const [quotes, setQuotes] = useState([])
  const [highlights, setHighlights] = useState(() => loadProfile(currentUser)?.highlights || [])
  const DEFAULT_HOME_CONFIG = { statCards: true, streak: true, networkScore: true, upcoming: true, followUp: true, highlights: true, circleBack: true, tips: true }
  const [homeConfig, setHomeConfig] = useState(() => ({ ...DEFAULT_HOME_CONFIG, ...loadProfile(currentUser)?.homeConfig }))
  const [showHomeCustomize, setShowHomeCustomize] = useState(false)
  const [quoteIdx, setQuoteIdx] = useState(0)
  const [quoteFade, setQuoteFade] = useState(true)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [todos, setTodos] = useState([])
  const [calendarDate, setCalendarDate] = useState('')
  const [contactFilter, setContactFilter] = useState('all')
  const [contactSearch, setContactSearch] = useState('')
  const [contactView, setContactView] = useState('az') // 'az' | 'grouped' | 'connection'
  const [debriefContact, setDebriefContact] = useState(null)
  const [showBrainDump, setShowBrainDump] = useState(false)

  const [scheduledTasks, setScheduledTasks] = useState([])
  const [jobRecs, setJobRecs] = useState([])
  const [jobRecsLoading, setJobRecsLoading] = useState(false)
  const [generatingInsights, setGeneratingInsights] = useState(false)
  const [insightsProgress, setInsightsProgress] = useState({ done: 0, total: 0 })
  const [insightIdx, setInsightIdx] = useState(0)
  const [insightFade, setInsightFade] = useState(true)

  const allInsights = useMemo(() => {
    const items = []
    for (const c of contacts) {
      if (c.insights?.length) {
        for (const text of c.insights) {
          items.push({ text, name: c.name, id: c.id })
        }
      }
    }
    return items.sort(() => 0.5 - Math.random())
  }, [contacts.map(c => c.insights?.length).join(',')])

  useEffect(() => {
    if (allInsights.length <= 1) return
    const t = setInterval(() => {
      setInsightFade(false)
      setTimeout(() => { setInsightIdx(i => (i + 1) % allInsights.length); setInsightFade(true) }, 250)
    }, 8000)
    return () => clearInterval(t)
  }, [allInsights.length])

  // ─── Supabase auth ──────────────────────────────────────────────────────────
  useEffect(() => {
    // INITIAL_SESSION fires once on load - handles both normal visits and
    // OAuth redirects (where getSession() can briefly return null while
    // the URL hash is being processed)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') {
        if (session) loginWithSupabase(session.user.id)
        else setAuthChecked(true)
      } else if (event === 'SIGNED_IN' && session) {
        loginWithSupabase(session.user.id)
      } else if (event === 'SIGNED_OUT') {
        handleLogout()
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function loginWithSupabase(userId) {
    // Only run the UI setup once per user - SIGNED_IN fires on every token
    // refresh which would otherwise reset profileLoaded and flash the screen
    const isFirstLogin = authedUserId.current !== userId
    authedUserId.current = userId

    if (isFirstLogin) {
      setCurrentUser(userId)
      setUser(userId)
      setProfileLoaded(false)
      setAuthChecked(true)
    }

    // Background cloud sync always runs to get latest data
    try {
      const cloud = await fetchUserData(userId)
      if (cloud) {
        // Only update each piece of state if that specific field changed in cloud
        // Never set profile to null - that would wipe the profile and show onboarding
        if (Array.isArray(cloud.contacts) && cloud.contacts.length > 0) {
          saveContacts(userId, cloud.contacts)
          setContacts(loadContacts(userId))
        }
        if (cloud.profile && Object.keys(cloud.profile).length > 0) {
          // Merge: preserve local-only fields that cloud might not have yet (e.g. highlights just added)
          const localProfile = loadProfile(userId)
          const merged = { ...cloud.profile }
          if ((localProfile?.highlights?.length || 0) > (cloud.profile.highlights?.length || 0)) {
            merged.highlights = localProfile.highlights
          }
          if (localProfile?.homeConfig) merged.homeConfig = { ...cloud.profile.homeConfig, ...localProfile.homeConfig }
          saveProfile(userId, merged)
          const p = loadProfile(userId)
          if (p) { setProfile(p); setHighlights(p.highlights || []) }
        }
        if (Array.isArray(cloud.todos) && cloud.todos.length > 0) {
          saveTodos(userId, cloud.todos)
          setTodos(loadTodos(userId))
        }
        if (Array.isArray(cloud.scheduled_tasks) && cloud.scheduled_tasks.length > 0) {
          saveScheduledTasks(userId, cloud.scheduled_tasks)
          setScheduledTasks(loadScheduledTasks(userId))
        }
      }
    } catch (e) { console.error('Cloud sync failed:', e) }
  }

  function handleLogin(userId) { setUser(userId); setProfileLoaded(false) }
  function addHighlight(text) {
    const updated = [...highlights, text]
    setHighlights(updated)
    const p = { ...profile, highlights: updated }
    setProfile(p); saveProfile(currentUser, p)
  }
  function removeHighlight(i) {
    const updated = highlights.filter((_, idx) => idx !== i)
    setHighlights(updated)
    const p = { ...profile, highlights: updated }
    setProfile(p); saveProfile(currentUser, p)
  }
  function toggleHomeSection(key) {
    const updated = { ...homeConfig, [key]: !homeConfig[key] }
    setHomeConfig(updated)
    const p = { ...profile, homeConfig: updated }
    setProfile(p); saveProfile(currentUser, p)
  }

  function reorderHighlights(updated) {
    setHighlights(updated)
    const p = { ...profile, highlights: updated }
    setProfile(p); saveProfile(currentUser, p)
  }

  async function generateAllInsights() {
    const toProcess = contacts.filter(c => (c.notes || c.meetingNotes) && !c.insights?.length)
    if (!toProcess.length) return
    setGeneratingInsights(true)
    setInsightsProgress({ done: 0, total: toProcess.length })
    let updated = [...contacts]
    for (let i = 0; i < toProcess.length; i++) {
      try {
        const insights = await extractInsights(toProcess[i])
        if (insights.length) {
          updated = updated.map(c => c.id === toProcess[i].id ? { ...c, insights } : c)
        }
      } catch (e) { console.error(e) }
      setInsightsProgress({ done: i + 1, total: toProcess.length })
    }
    persist(updated)
    setGeneratingInsights(false)
  }

  function handleLogout() {
    clearCurrentUser()
    setUser(null); setProfile(null); setProfileLoaded(false); setContacts([]); setJobRecs([])
    supabase.auth.signOut()
  }

  useEffect(() => {
    if (currentUser) {
      setTodos(loadTodos(currentUser))
      setScheduledTasks(loadScheduledTasks(currentUser))
    }
  }, [currentUser])
  function updateTodos(t) { setTodos(t); saveTodos(currentUser, t) }
  function addTodo(text) { updateTodos([...todos, { id: Date.now(), text, done: false }]) }
  function toggleTodo(id) { updateTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t)) }
  function deleteTodo(id) { updateTodos(todos.filter(t => t.id !== id)) }
  function addScheduledTask(task) { const updated = [...scheduledTasks, { id: Date.now(), ...task, done: false }]; setScheduledTasks(updated); saveScheduledTasks(currentUser, updated) }
  function toggleScheduledTask(id) { const updated = scheduledTasks.map(t => t.id === id ? { ...t, done: !t.done } : t); setScheduledTasks(updated); saveScheduledTasks(currentUser, updated) }
  function deleteScheduledTask(id) { const updated = scheduledTasks.filter(t => t.id !== id); setScheduledTasks(updated); saveScheduledTasks(currentUser, updated) }

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

  // Background-fetch job recs as soon as profile is ready
  useEffect(() => {
    if (!profile || !currentUser) return
    const cached = loadJobRecs(currentUser)
    if (cached && cached.length > 0) { setJobRecs(cached); return }
    const r = profile?.resumeText ? { text: profile.resumeText, parsed: profile.resumeParsed } : null
    const s = profile?.skills || []
    setJobRecsLoading(true)
    generateJobRecs(profile, r, s)
      .then(raw => {
        const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
        const jobs = Array.isArray(parsed) ? parsed : []
        setJobRecs(jobs)
        saveJobRecs(currentUser, jobs)
      })
      .catch(() => {})
      .finally(() => setJobRecsLoading(false))
  }, [profile, currentUser])

  function handleOnboardingComplete(p) { saveProfile(currentUser, p); setProfile(p); setShowOnboarding(false) }
  function handleEditSave(p) { saveProfile(currentUser, p); setProfile(p); setShowEdit(false) }
  function persist(u) { setContacts(u); saveContacts(currentUser, u) }
  function logActivity(existing = [], type, note = '') {
    const date = new Date().toISOString().split('T')[0]
    // avoid duplicate same-day same-type entries
    if (existing.some(e => e.type === type && e.date === date)) return existing
    return [...existing, { type, date, note }]
  }

  function addContact(c) {
    const today = new Date().toISOString().split('T')[0]
    const newContact = { ...c, id: Date.now(), status: 'schedule', notes: '', chatDate: '', linkedinUrl: '', parsedProfile: null, brief: '', followUpText: '', pdfName: '', connectedDate: today, activity: [{ type: 'connected', date: today }] }
    persist([newContact, ...contacts])
    setShowAdd(false)
  }
  function updateContact(c) {
    const prev = contacts.find(x => x.id === c.id)
    let activity = c.activity || []
    const nextStatus = normalizeStatus(c.status)
    const prevStatus = normalizeStatus(prev?.status)
    if (prev && prevStatus !== nextStatus) {
      const typeMap = { interested: 'status_interested', scheduled: 'meeting_scheduled', 'follow up': 'meeting_completed', 'followed up': 'followed_up', schedule: 'status_schedule', 'circle back': 'status_circle_back', 'one & done': 'status_one_done', complete: 'status_complete' }
      const noteMap = { interested: 'Marked interested', scheduled: 'Meeting scheduled', 'follow up': 'Follow-up needed', 'followed up': 'Followed up', schedule: 'Moved to schedule', 'circle back': 'Circle back later', 'one & done': 'Marked one and done', complete: 'Marked complete' }
      activity = logActivity(activity, typeMap[nextStatus] || 'status_changed', noteMap[nextStatus] || statusLabel(nextStatus))
    }
    if (prev && c.followUpText && !prev.followUpText) {
      activity = logActivity(activity, 'follow_up_written', 'Follow-up message written')
    }
    if (prev && c.nextAction === 'done' && prev.nextAction !== 'done') {
      activity = logActivity(activity, 'followed_up', 'Marked follow-up as done')
    }
    const updated = { ...c, activity }
    persist(contacts.map(x => x.id === c.id ? updated : x))
    setDetail(updated)
    if (nextStatus === 'follow up' && prevStatus !== 'follow up') setDebriefContact(updated)
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

  if (!authChecked || !currentUser) return <LoginScreen />
  if (!profileLoaded) return null
  if (!profile || showOnboarding) return <Onboarding onComplete={handleOnboardingComplete} existingProfile={profile} />

  const stats = contacts.reduce((acc, contact) => {
    const status = normalizeStatus(contact.status)
    acc.total += 1
    if (status === 'interested') acc.interested += 1
    if (status === 'schedule') acc.schedule += 1
    if (status === 'scheduled') acc.scheduled += 1
    if (status === 'follow up') acc.followUp += 1
    if (status === 'circle back') acc.circleBack += 1
    if (status === 'one & done') acc.oneAndDone += 1
    if (status === 'followed up') acc.followedUp += 1
    if (status === 'complete') acc.complete += 1
    if (isFinalStatus(status)) acc.done += 1
    return acc
  }, { total: 0, interested: 0, schedule: 0, scheduled: 0, followUp: 0, circleBack: 0, oneAndDone: 0, followedUp: 0, complete: 0, done: 0 })

  const todayStr = new Date().toISOString().split('T')[0]
  const upcoming = contacts.filter(x => x.chatDate && normalizeStatus(x.status) === 'scheduled' && x.chatDate >= todayStr).sort((a, b) => new Date(a.chatDate + 'T12:00:00') - new Date(b.chatDate + 'T12:00:00'))
  const needsFollowUp = contacts.filter(x => normalizeStatus(x.status) === 'follow up' && !x.followUpText)
  const recent = [...contacts].sort((a, b) => b.id - a.id).slice(0, 5)
  const resume = profile?.resumeText ? { text: profile.resumeText, parsed: profile.resumeParsed } : null
  const skills = profile?.skills || []

  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  const soonChats = upcoming.filter(c => c.chatDate === todayStr || c.chatDate === tomorrowStr)
  const streak = calcStreak(contacts)
  const networkScore = calcNetworkScore(contacts)
  const todayDeskContact = soonChats[0] || null

  const filteredContacts = contactSearch.trim()
    ? contacts.filter(c => [c.name, c.role, c.company].filter(Boolean).join(' ').toLowerCase().includes(contactSearch.toLowerCase()))
    : contacts

  const HOME_METRICS = [
    { label: 'Interested', value: stats.interested, icon: Target, accent: '#c4b8ff', onClick: () => { setContactFilter('interested'); setTab('contacts') } },
    { label: 'Schedule', value: stats.schedule, icon: ContactIcon, accent: 'var(--cyan)', onClick: () => { setContactFilter('schedule'); setTab('contacts') } },
    { label: 'Scheduled', value: stats.scheduled, icon: CalendarDays, accent: 'var(--green-text)', onClick: () => setTab('upcoming') },
    { label: 'Follow up', value: stats.followUp, icon: MessageSquareText, accent: 'var(--rose)', onClick: () => { setContactFilter('follow up'); setTab('contacts') } },
    { label: 'Circle back', value: stats.circleBack, icon: Clock3, accent: '#93c5fd', onClick: () => { setContactFilter('circle back'); setTab('contacts') } },
    { label: 'Done', value: stats.done, icon: CheckCircle2, accent: 'var(--accent)', onClick: () => { setContactFilter('done'); setTab('contacts') } },
  ]

  const CONTACT_STATUS_CARDS = [
    { label: 'Interested', value: stats.interested, color: '#c4b8ff', filter: 'interested' },
    { label: 'Schedule', value: stats.schedule, color: '#8fe3ff', filter: 'schedule' },
    { label: 'Scheduled', value: stats.scheduled, color: '#a7f3ba', filter: 'scheduled' },
    { label: 'Follow up', value: stats.followUp, color: '#ff7aa8', filter: 'follow up' },
    { label: 'Circle back', value: stats.circleBack, color: '#93c5fd', filter: 'circle back' },
    { label: 'Done', value: stats.done, color: '#c5ff5a', filter: 'done' },
  ]

  const modalBg = { position: 'fixed', inset: 0, background: 'rgba(8,16,24,0.8)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? '0' : '1rem', zIndex: 100, backdropFilter: 'blur(12px)' }
  const quickNoteButtonStyle = {
    position: 'fixed',
    ...(isMobile ? { bottom: 'calc(94px + env(safe-area-inset-bottom))', right: 16, width: 46, height: 46 } : { bottom: 24, right: 24, width: 52, height: 52 }),
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #7c6fff, #4ade80)',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(124,111,255,0.5)',
    zIndex: 199,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.15s',
  }

  return (
    <AppShell activeTab={tab} onTabChange={setTab} onAddContact={() => setShowAdd(true)} onEditProfile={() => setShowEdit(true)} profile={profile}>
      <GlobalStyles />

      {!isMobile && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 14 }}>
          <button onClick={() => window.open('https://calendar.google.com', '_blank')} style={{ background: 'rgba(244,247,249,0.04)', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 12px', fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', gap: 7 }}>
            <CalendarDays size={14} strokeWidth={1.8} aria-hidden="true" />
            Google Calendar
          </button>
          <button onClick={() => exportBackup(currentUser)} style={{ background: 'rgba(244,247,249,0.04)', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 12px', fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', gap: 7 }}>
            <FolderInput size={14} strokeWidth={1.8} aria-hidden="true" />
            Export backup
          </button>
          <button onClick={handleLogout} style={{ background: 'rgba(244,247,249,0.04)', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 12px', fontSize: 12, color: 'var(--text-tertiary)', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
            Log out
          </button>
        </div>
      )}

      {tab === 'home' && (
        <div className="brief-desk-grid home-shell">
          <div className="home-primary" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <TodayDesk contact={todayDeskContact} stats={stats} onOpenContact={setDetail} onOpenContacts={() => setTab('contacts')} onAddContact={() => setShowAdd(true)} />

            {homeConfig.statCards && (
              <div className="home-action-grid" style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3, minmax(0, 1fr))' : 'repeat(6, minmax(0, 1fr))', gap: 12 }}>
                {HOME_METRICS.map(metric => (
                  <MetricTile key={metric.label} {...metric} className="home-action-tile" />
                ))}
              </div>
            )}

            {isMobile && (
              <OrbitPanel title="Profile signal" icon={Target} accent="var(--amber)">
                {profile.goals ? (
                  <div style={{ color: 'var(--text-secondary)', lineHeight: 1.55, fontSize: 13 }}>{profile.goals}</div>
                ) : (
                  <div style={{ color: 'var(--text-tertiary)', lineHeight: 1.55, fontSize: 13 }}>Add a goal to sharpen brief generation.</div>
                )}
              </OrbitPanel>
            )}

            {(homeConfig.upcoming || homeConfig.followUp) && (
              <div className="home-priority-grid" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) minmax(0, 1fr)', gap: 12 }}>
                {homeConfig.upcoming && (
                  <OrbitPanel title="Upcoming" icon={CalendarDays} accent="var(--green-text)" action={<button onClick={() => setTab('upcoming')} style={{ background: 'transparent', border: 'none', color: 'var(--green-text)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>View all</button>}>
                    {upcoming.length === 0 ? (
                      <div style={{ color: 'var(--text-tertiary)', fontSize: 13, padding: '16px 0' }}>No scheduled meetings yet.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {upcoming.slice(0, isMobile ? 3 : 4).map(c => (
                          <button key={c.id} onClick={() => setDetail(c)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 0', background: 'transparent', border: 'none', borderTop: '1px solid var(--border)', color: 'var(--text-primary)', textAlign: 'left', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                            <Avatar name={c.name} company={c.company} size={32} />
                            <span style={{ flex: 1, minWidth: 0 }}>
                              <span style={{ display: 'block', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
                              <span style={{ display: 'block', color: 'var(--text-tertiary)', fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{[c.role, c.company].filter(Boolean).join(' at ') || 'No role set'}</span>
                            </span>
                            <span style={{ color: 'var(--text-secondary)', fontSize: 11, textAlign: 'right' }}>{formatDate(c.chatDate)}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </OrbitPanel>
                )}

                {homeConfig.followUp && (
                  <OrbitPanel title="Follow-ups" icon={Bell} accent="var(--rose)">
                    {needsFollowUp.length === 0 ? (
                      <div style={{ color: 'var(--text-tertiary)', fontSize: 13, padding: '16px 0' }}>All caught up.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {needsFollowUp.slice(0, isMobile ? 3 : 4).map(c => (
                          <button key={c.id} onClick={() => setDetail(c)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 0', background: 'transparent', border: 'none', borderTop: '1px solid var(--border)', color: 'var(--text-primary)', textAlign: 'left', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                            <MessageSquareText size={16} color="var(--rose)" strokeWidth={1.8} aria-hidden="true" />
                            <span style={{ flex: 1, minWidth: 0 }}>
                              <span style={{ display: 'block', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
                              <span style={{ display: 'block', color: 'var(--text-tertiary)', fontSize: 11 }}>Needs follow-up</span>
                            </span>
                            <span style={{ color: 'var(--rose)', fontSize: 11 }}>Write</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </OrbitPanel>
                )}
              </div>
            )}

            {(homeConfig.streak || homeConfig.networkScore) && (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                {homeConfig.streak && (
                  <OrbitPanel title="Conversation streak" icon={Flame} accent="var(--amber)">
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 42, fontWeight: 800, lineHeight: 1, color: 'var(--amber)' }}>{streak}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: 13, paddingBottom: 4 }}>week{streak !== 1 ? 's' : ''}</div>
                    </div>
                    <div style={{ color: 'var(--text-tertiary)', fontSize: 12, marginTop: 8 }}>
                      {streak === 0 ? 'Complete a chat to start the streak.' : streak >= 4 ? 'Strong rhythm. Keep the loop warm.' : 'Momentum is building.'}
                    </div>
                  </OrbitPanel>
                )}
                {homeConfig.networkScore && (
                  <OrbitPanel title="Network score" icon={Zap} accent="var(--cyan)">
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 42, fontWeight: 800, lineHeight: 1, color: 'var(--cyan)' }}>{networkScore}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: 13, paddingBottom: 4 }}>points</div>
                    </div>
                    <div style={{ color: 'var(--text-tertiary)', fontSize: 12, marginTop: 8 }}>
                      {networkScore < 50 ? 'Early map, useful signal.' : networkScore < 150 ? 'Useful momentum across the room.' : networkScore < 300 ? 'The network has shape now.' : 'Deep bench, real coverage.'}
                    </div>
                  </OrbitPanel>
                )}
              </div>
            )}

            {homeConfig.highlights && <HighlightsBox highlights={highlights} onAdd={addHighlight} onRemove={removeHighlight} onReorder={reorderHighlights} />}

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) minmax(0, 1fr)', gap: 12 }}>
              <OrbitPanel title="To-do list" icon={ListChecks} accent="var(--accent)">
                <TodoInput onAdd={addTodo} />
                <div style={{ marginTop: 14 }}>
                  <TodoList todos={todos} onToggle={toggleTodo} onDelete={deleteTodo} />
                </div>
              </OrbitPanel>

              <OrbitPanel title="Recent contacts" icon={NotebookText} accent="var(--cyan)">
                {recent.length === 0 ? (
                  <div style={{ color: 'var(--text-tertiary)', fontSize: 13, padding: '16px 0' }}>No contacts yet.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {recent.map(c => (
                      <button key={c.id} onClick={() => setDetail(c)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 0', background: 'transparent', border: 'none', borderTop: '1px solid var(--border)', color: 'var(--text-primary)', textAlign: 'left', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                        <Avatar name={c.name} company={c.company} size={32} />
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ display: 'block', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
                          <span style={{ display: 'block', color: 'var(--text-tertiary)', fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{[c.role, c.company].filter(Boolean).join(' at ') || 'No role set'}</span>
                        </span>
                        <StatusBadge status={c.status} />
                      </button>
                    ))}
                  </div>
                )}
              </OrbitPanel>
            </div>
          </div>

          {!isMobile && <RightOrbit className="home-side">
            <OrbitPanel title="Field note" icon={Sparkles} accent="var(--accent)">
              {quoteLoading ? (
                <div style={{ color: 'var(--text-tertiary)', display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}><Spinner /> Generating quote</div>
              ) : (
                <div style={{ fontFamily: 'Georgia, serif', color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: 15 }}>"{quotes[quoteIdx] || 'Every connection is a door you did not know was there.'}"</div>
              )}
            </OrbitPanel>

            {soonChats.length > 0 && (
              <OrbitPanel title="Next call" icon={Clock3} accent="var(--green-text)">
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <Avatar name={soonChats[0].name} company={soonChats[0].company} size={36} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{soonChats[0].name}</div>
                    <div style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>{soonChats[0].chatDate === todayStr ? 'Today' : 'Tomorrow'}{soonChats[0].chatTime ? ` at ${soonChats[0].chatTime}` : ''}</div>
                  </div>
                </div>
                <Button variant="primary" onClick={() => setDetail(soonChats[0])} style={{ width: '100%', marginTop: 12 }}>Open brief</Button>
              </OrbitPanel>
            )}

            <OrbitPanel title="Desk modules" icon={Settings2} accent="var(--cyan)" action={<button onClick={() => setShowHomeCustomize(v => !v)} style={{ background: 'transparent', border: 'none', color: 'var(--cyan)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>{showHomeCustomize ? 'Done' : 'Customize'}</button>}>
              {showHomeCustomize ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[['statCards','Metrics'], ['streak','Streak'], ['networkScore','Score'], ['highlights','Highlights'], ['upcoming','Upcoming'], ['followUp','Follow-ups'], ['tips','Tips']].map(([key, label]) => (
                    <button key={key} onClick={() => toggleHomeSection(key)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '8px 0', background: 'transparent', border: 'none', borderTop: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13 }}>
                      <span>{label}</span>
                      <span style={{ color: homeConfig[key] ? 'var(--accent)' : 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>{homeConfig[key] ? 'On' : 'Off'}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{ color: 'var(--text-tertiary)', fontSize: 13, lineHeight: 1.7 }}>Tune what shows up on the desk without changing the core workflow.</div>
              )}
            </OrbitPanel>

            <OrbitPanel title="Profile signal" icon={Target} accent="var(--amber)">
              {profile.goals ? (
                <div style={{ color: 'var(--text-secondary)', lineHeight: 1.65, fontSize: 13, marginBottom: 12 }}>{profile.goals}</div>
              ) : (
                <div style={{ color: 'var(--text-tertiary)', lineHeight: 1.65, fontSize: 13, marginBottom: 12 }}>Add a goal to sharpen brief generation.</div>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                {skills.slice(0, 7).map(skill => (
                  <span key={skill} style={{ border: '1px solid var(--border)', borderRadius: 999, padding: '4px 8px', color: 'var(--text-secondary)', fontSize: 11 }}>{skill}</span>
                ))}
                {skills.length > 7 && <span style={{ color: 'var(--text-tertiary)', fontSize: 11, padding: '4px 0' }}>+{skills.length - 7} more</span>}
              </div>
              <button onClick={() => setShowEdit(true)} style={{ background: 'rgba(240,186,77,0.12)', border: '1px solid rgba(240,186,77,0.28)', color: 'var(--amber)', borderRadius: 8, padding: '8px 10px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 12, width: '100%' }}>
                Edit profile
              </button>
            </OrbitPanel>
          </RightOrbit>}
        </div>
      )}
      {/* ── CONTACTS ─────────────────────────────────────────────────────────────── */}
      {tab === 'contacts' && (
        <div style={{ maxWidth: isMobile ? '100%' : 760, margin: '0 auto', padding: isMobile ? '0 0 calc(6rem + env(safe-area-inset-bottom))' : '1.5rem 1.5rem' }}>

          {/* Personalized Tips */}
          <div style={{ background: 'linear-gradient(135deg, rgba(139,127,255,0.12), rgba(74,222,128,0.06))', border: '1px solid rgba(139,127,255,0.3)', borderRadius: isMobile ? 16 : 20, padding: isMobile ? '14px' : '1.25rem 1.5rem', marginBottom: '1rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -30, right: -30, width: 130, height: 130, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,127,255,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 8 : 0, marginBottom: allInsights.length ? 12 : 8 }}>
              <div style={{ fontSize: 12, color: '#a78bfa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={14} strokeWidth={1.8} aria-hidden="true" /> Wisdom from your network
              </div>
              {allInsights.length > 1 && (
                <div style={{ display: 'flex', gap: 4 }}>
                  {Array.from({ length: Math.min(allInsights.length, 6) }).map((_, i) => (
                    <div key={i} style={{ width: i === insightIdx % Math.min(allInsights.length, 6) ? 16 : 5, height: 5, borderRadius: 3, background: i === insightIdx % Math.min(allInsights.length, 6) ? '#a78bfa' : 'rgba(167,139,250,0.2)', transition: 'all 0.3s' }} />
                  ))}
                </div>
              )}
            </div>
            {allInsights.length > 0 ? (
              <div style={{ opacity: insightFade ? 1 : 0, transform: insightFade ? 'none' : 'translateY(6px)', transition: 'all 0.25s ease' }}>
                <div style={{ fontSize: isMobile ? 14 : 16, color: 'var(--text-primary)', lineHeight: 1.7, fontWeight: 500, marginBottom: 6 }}>
                  "{allInsights[insightIdx % allInsights.length]?.text}"
                </div>
                <div style={{ fontSize: 13, color: '#a78bfa', display: 'flex', alignItems: 'center', gap: 8 }}>
                  - {allInsights[insightIdx % allInsights.length]?.name}
                  {contacts.filter(c => (c.notes || c.meetingNotes) && !c.insights?.length).length > 0 && (
                    <button onClick={generateAllInsights} disabled={generatingInsights} style={{ background: 'none', border: 'none', fontSize: 11, color: 'rgba(167,139,250,0.5)', cursor: 'pointer', fontFamily: 'var(--font-sans)', padding: 0 }}>
                      {generatingInsights ? `processing ${insightsProgress.done}/${insightsProgress.total}...` : '+ add more'}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
                  Generate insights pulled directly from your meeting notes - attributed to the person who said them.
                </div>
                <button onClick={generateAllInsights} disabled={generatingInsights || !contacts.some(c => c.notes || c.meetingNotes)}
                  style={{ background: '#7c6fff', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-display)', opacity: generatingInsights || !contacts.some(c => c.notes || c.meetingNotes) ? 0.6 : 1 }}>
                  {generatingInsights
                    ? `Generating insights ${insightsProgress.done}/${insightsProgress.total}...`
                    : contacts.some(c => c.notes || c.meetingNotes)
                      ? 'Generate Insights'
                      : 'Add notes to contacts first'}
                </button>
              </div>
            )}
          </div>

          <div className="contact-status-grid">
            {[{ label: 'All', value: stats.total, color: '#917aff', filter: 'all', all: true }, ...CONTACT_STATUS_CARDS].map(card => (
              <button key={card.label} onClick={() => setContactFilter(contactFilter === card.filter ? 'all' : card.filter)}
                className={`contact-status-card ${card.all ? 'contact-status-card-all' : ''}`}
                style={{ '--status-color': card.color, background: contactFilter === card.filter ? `${card.color}15` : 'var(--surface-2)', borderColor: contactFilter === card.filter ? `${card.color}44` : 'var(--border)' }}>
                <span className="contact-status-rule" style={{ background: card.color }} />
                <span className="contact-status-value" style={{ color: card.color }}>{card.value}</span>
                <span className="contact-status-label" style={{ color: contactFilter === card.filter ? card.color : 'var(--text-tertiary)' }}>{card.label}</span>
              </button>
            ))}
          </div>

          {/* Follow-up reminder box */}
          {(() => {
            const today = new Date().toISOString().split('T')[0]
            const due = contacts.filter(c =>
              c.nextAction !== 'one-time' &&
              c.nextAction !== 'done' &&
              !isFinalStatus(c.status) && (
                c.nextAction === 'follow-up' ||
                (c.followUpDate && c.followUpDate <= today) ||
                (normalizeStatus(c.status) === 'follow up' && !c.followUpText && !c.nextAction)
              )
            )
            if (!due.length) return null
            return (
              <div style={{ background: 'linear-gradient(135deg, rgba(244,114,182,0.1), rgba(251,191,36,0.06))', border: '1px solid rgba(244,114,182,0.3)', borderRadius: 16, padding: isMobile ? '12px' : '14px 16px', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#f9a8d4', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Bell size={14} strokeWidth={1.8} aria-hidden="true" />
                      {due.length} follow-up{due.length > 1 ? 's' : ''} pending
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>Don't let these connections go cold</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {due.slice(0, 8).map(person => (
                    <div key={person.id} onClick={() => setDetail(person)} title={person.name}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface-3)', border: '1px solid rgba(244,114,182,0.2)', borderRadius: 20, padding: '4px 10px 4px 4px', cursor: 'pointer', transition: 'border-color 0.15s' }}>
                      <Avatar name={person.name} company={person.company} size={22} />
                      <span style={{ fontSize: 12, color: 'var(--text-primary)' }}>{person.name?.split(' ')[0] || '?'}</span>
                    </div>
                  ))}
                  {due.length > 8 && (
                    <div style={{ display: 'flex', alignItems: 'center', padding: '4px 12px', background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 20, fontSize: 12, color: 'var(--text-tertiary)' }}>
                      +{due.length - 8} more
                    </div>
                  )}
                </div>
              </div>
            )
          })()}

          {/* Search bar + Add button */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'minmax(0, 1fr) auto auto auto', gap: 8, marginBottom: '1rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', gridColumn: isMobile ? '1 / -1' : 'auto' }}>
              <input
                value={contactSearch}
                onChange={e => setContactSearch(e.target.value)}
                placeholder="Search contacts by name, role, or company..."
                style={{ width: '100%', background: 'var(--surface-3)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)', borderRadius: 12, padding: '10px 14px 10px 38px', fontSize: 13, outline: 'none', fontFamily: 'var(--font-sans)', boxSizing: 'border-box' }}
              />
              <Search size={15} strokeWidth={1.8} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} aria-hidden="true" />
              {contactSearch && <button onClick={() => setContactSearch('')} aria-label="Clear contact search" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center' }}><X size={14} strokeWidth={1.8} aria-hidden="true" /></button>}
            </div>
            <button onClick={() => setShowNotionImport(true)} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 14px', background: 'var(--surface-3)', color: 'var(--text-secondary)', border: '1px solid var(--border-strong)', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap', width: '100%' }}>
              <FileText size={14} strokeWidth={1.8} aria-hidden="true" />
              Import
            </button>
            {/* View toggle */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', background: 'var(--surface-3)', border: '1px solid var(--border-strong)', borderRadius: 10, overflow: 'hidden', flexShrink: 0, width: '100%' }}>
              {[['az', ListChecks, 'A-Z Directory'], ['grouped', Settings2, 'By Status'], ['connection', NetworkIcon, 'By How We Met']].map(([v, Icon, title]) => (
                <button key={v} onClick={() => setContactView(v)} title={title} style={{ padding: '9px 11px', background: contactView === v ? 'var(--accent-dim)' : 'transparent', color: contactView === v ? 'var(--accent)' : 'var(--text-tertiary)', border: 'none', cursor: 'pointer', fontSize: 14, lineHeight: 1, display: 'flex', justifyContent: 'center' }}>
                  <Icon size={15} strokeWidth={1.8} aria-hidden="true" />
                </button>
              ))}
            </div>
            <button onClick={() => setShowAdd(true)} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 16px', background: 'var(--accent)', color: 'var(--accent-fg)', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap', gridColumn: isMobile ? '1 / -1' : 'auto', width: '100%' }}>
              + Add Contact
            </button>
          </div>

          {/* A-Z Directory or Grouped */}
          {(() => {
            const todayStr = new Date().toISOString().split('T')[0]
            const base = contactSearch.trim() ? filteredContacts
              : contactFilter === 'all' ? contacts
              : contactFilter === 'done' ? contacts.filter(x => isFinalStatus(x.status))
              : contacts.filter(x => normalizeStatus(x.status) === contactFilter)

            // Grouped by how we met
            if (contactView === 'connection' && !contactSearch.trim()) {
              const grouped = {}
              for (const c of base) {
                const key = c.howWeMet || 'other'
                if (!grouped[key]) grouped[key] = []
                grouped[key].push(c)
              }
              const order = HOW_WE_MET.map(o => o.value).concat(['other'])
              const toShow = order.filter(k => grouped[k])
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {toShow.map(key => {
                    const meta = HOW_WE_MET.find(o => o.value === key) || { label: 'Other' }
                    const catContacts = grouped[key]
                    return (
                      <div key={key}>
                        <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                          {meta.label} <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-tertiary)', marginLeft: 4 }}>({catContacts.length})</span>
                        </div>
                        <ContactList contacts={catContacts} onSelect={setDetail} isMobile={isMobile} />
                      </div>
                    )
                  })}
                  {base.length === 0 && <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-tertiary)', fontSize: 14 }}>No contacts yet.</div>}
                </div>
              )
            }

            // Grouped by status view (recently added feel)
            if (contactView === 'grouped' && !contactSearch.trim()) {
              const cats = [
                { status: 'interested', label: 'Interested', color: '#c4b8ff' },
                { status: 'schedule', label: 'Schedule', color: '#8fe3ff' },
                { status: 'scheduled', label: 'Scheduled', color: '#a7f3ba' },
                { status: 'follow up', label: 'Follow up', color: '#ff7aa8' },
                { status: 'circle back', label: 'Circle back', color: '#93c5fd' },
                { status: 'one & done', label: 'One & done', color: '#34d399' },
                { status: 'followed up', label: 'Followed up', color: '#c5ff5a' },
                { status: 'complete', label: 'Complete', color: '#d8d2c5' },
              ]
              const toShow = contactFilter === 'all' ? cats : contactFilter === 'done' ? cats.filter(c => isFinalStatus(c.status)) : cats.filter(c => c.status === contactFilter)
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {toShow.map(cat => {
                    const catContacts = base.filter(x => normalizeStatus(x.status) === cat.status)
                    if (catContacts.length === 0) return null
                    return (
                      <div key={cat.status}>
                        <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: cat.color, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                          {cat.label} <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-tertiary)', marginLeft: 4 }}>({catContacts.length})</span>
                        </div>
                        <ContactList contacts={catContacts} onSelect={setDetail} isMobile={isMobile} />
                      </div>
                    )
                  })}
                  {base.length === 0 && <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-tertiary)', fontSize: 14 }}>No contacts yet.</div>}
                </div>
              )
            }

            if (base.length === 0) return (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-tertiary)', fontSize: 14 }}>
                {contactSearch.trim() ? `No results for "${contactSearch}"` : 'No contacts yet - add one to get started!'}
              </div>
            )

            const sorted = [...base].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
            const grouped = {}
            for (const c of sorted) {
              const letter = (c.name || '#')[0].toUpperCase()
              if (!grouped[letter]) grouped[letter] = []
              grouped[letter].push(c)
            }

            return (
              <div>
                {contactSearch.trim() && (
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 12 }}>
                    {base.length} result{base.length !== 1 ? 's' : ''} for "{contactSearch}"
                  </div>
                )}
                {Object.keys(grouped).sort().map(letter => (
                  <div key={letter} style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8, paddingBottom: 4, borderBottom: '1px solid var(--border)' }}>
                      {letter}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {grouped[letter].map(person => {
                        const followUpDue = person.followUpDate && person.followUpDate <= todayStr && person.nextAction !== 'done' && !isFinalStatus(person.status)
                        const hasUpcoming = person.chatDate && person.chatDate >= todayStr && normalizeStatus(person.status) === 'scheduled'
                        const color = statusMeta(person.status).accent
                        return (
                          <div key={person.id} onClick={() => setDetail(person)}
                            style={{ position: 'relative', overflow: 'hidden', display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? 10 : 12, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 14, padding: isMobile ? '12px' : '12px 14px', cursor: 'pointer', transition: 'border-color 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = color + '66'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                          >
                            <CompanyLogoBackdrop company={person.company} opacity={0.45} size={isMobile ? 132 : 170} />
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(16,25,35,0.91), rgba(16,25,35,0.58) 62%, rgba(16,25,35,0.76))', zIndex: 0, pointerEvents: 'none' }} />
                            <div style={{ position: 'relative', zIndex: 1, flexShrink: 0 }}>
                              <Avatar name={person.name} company={person.company} size={isMobile ? 34 : 38} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 1 }}>
                              <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{person.name}</div>
                              <div style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {[person.role, person.company].filter(Boolean).join(' · ') || 'No role set'}
                              </div>
                              {(() => {
                                const fmtD = d => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                const ACT_LABELS = { connected: 'Connected', meeting_scheduled: 'Scheduled', meeting_completed: 'Met', followed_up: 'Followed up', follow_up_written: 'Follow-up sent', status_interested: 'Interested', status_schedule: 'Moved to schedule', status_circle_back: 'Circle back', status_one_done: 'One and done', status_complete: 'Complete' }
                                const items = (person.activity || []).filter(a => ACT_LABELS[a.type])
                                const connected = person.connectedDate || (person.id ? new Date(person.id).toISOString().split('T')[0] : null)
                                if (!items.length && !connected) return null
                                const display = connected && !items.length
                                  ? [`Connected ${fmtD(connected)}`]
                                  : items.slice(-3).map(a => `${ACT_LABELS[a.type]} ${fmtD(a.date)}`)
                                return (
                                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {display.join('  ·  ')}
                                  </div>
                                )
                              })()}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0, maxWidth: isMobile ? 96 : 'none', position: 'relative', zIndex: 1 }}>
                              <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: color + '22', color, border: `1px solid ${color}44`, whiteSpace: 'nowrap' }}>
                                {statusLabel(person.status)}
                              </span>
                              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                {hasUpcoming && !isMobile && (
                                  <span style={{ fontSize: 10, color: '#4ade80', background: 'rgba(74,222,128,0.1)', padding: '1px 6px', borderRadius: 10 }}>
                                     {new Date(person.chatDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </span>
                                )}
                                {followUpDue && !isMobile && (
                                  <span style={{ fontSize: 10, color: '#f9a8d4', background: 'rgba(244,114,182,0.1)', padding: '1px 6px', borderRadius: 10 }}>
                                     Follow-up due
                                  </span>
                                )}
                                {person.nextAction === 'done' && !isMobile && (
                                  <span style={{ fontSize: 10, color: '#4ade80', background: 'rgba(74,222,128,0.08)', padding: '1px 6px', borderRadius: 10 }}>
                                    <Check size={11} strokeWidth={2.2} style={{ verticalAlign: -2, marginRight: 3 }} aria-hidden="true" /> Done
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )
          })()}

          <div style={{ marginTop: '1.5rem' }}>
            <ProTipBox />
          </div>
        </div>
      )}

      {/* ── UPCOMING ─────────────────────────────────────────────────────────────── */}
      {tab === 'upcoming' && (
        <div style={{ maxWidth: isMobile ? '100%' : 900, margin: '0 auto', padding: isMobile ? '0 0 calc(6rem + env(safe-area-inset-bottom))' : '1.5rem 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 12 : 0, marginBottom: 16 }}>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <CalendarDays size={22} strokeWidth={1.8} aria-hidden="true" />
              Calendar
            </div>
            <button onClick={() => setShowSchedule(true)} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-display)', width: isMobile ? '100%' : 'auto' }}>
              + Schedule Meeting
            </button>
          </div>
          <MonthCalendar contacts={contacts} onSelect={setDetail} onDayClick={(dateStr) => { setCalendarDate(dateStr); setShowSchedule(true) }} isMobile={isMobile} />

          <div style={{ marginTop: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-display)', marginBottom: 10 }}>Upcoming Meetings</div>
            <UpcomingList contacts={contacts} onSelect={setDetail} onSchedule={(c) => { setCalendarDate(''); setShowSchedule(true) }} isMobile={isMobile} />
          </div>

          {/* ── Follow-up Reminders ── */}
          {(() => {
            const reminders = contacts.filter(c => c.followUpDate && c.nextAction !== 'done' && !isFinalStatus(c.status)).sort((a, b) => new Date(a.followUpDate) - new Date(b.followUpDate))
            if (!reminders.length) return null
            const todayStr2 = new Date().toISOString().split('T')[0]
            return (
              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-display)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Bell size={16} strokeWidth={1.8} aria-hidden="true" />
                  Follow-up Reminders
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {reminders.map(c => {
                    const overdue = c.followUpDate < todayStr2
                    const dateLabel = new Date(c.followUpDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    return (
                      <div key={c.id} onClick={() => setDetail(c)} style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', gap: 12, background: 'var(--surface-2)', border: `1px solid ${overdue ? 'rgba(248,113,113,0.3)' : 'var(--border)'}`, borderRadius: 12, padding: isMobile ? '12px' : '12px 16px', cursor: 'pointer' }}>
                        <Avatar name={c.name} company={c.company} size={32} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.role || ''}{c.company ? ` · ${c.company}` : ''}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: overdue ? '#f87171' : '#38bdf8' }}>{overdue ? 'Overdue' : 'Due'}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{dateLabel}</div>
                        </div>
                        {c.followUpNote && !isMobile && <div style={{ fontSize: 11, color: 'var(--text-secondary)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>"{c.followUpNote}"</div>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })()}

          {/* ── Scheduled Tasks ── */}
          <ScheduledTasksPanel tasks={scheduledTasks} contacts={contacts} onAdd={addScheduledTask} onToggle={toggleScheduledTask} onDelete={deleteScheduledTask} isMobile={isMobile} />
        </div>
      )}

      {/* ── JOBS ─────────────────────────────────────────────────────────────────── */}
      {tab === 'jobs' && (
        <div style={{ maxWidth: isMobile ? '100%' : 760, margin: '0 auto', padding: isMobile ? '0 0 calc(6rem + env(safe-area-inset-bottom))' : '1.5rem 1.5rem' }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: 6 }}>Job Matches</div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              AI-generated roles aligned with your profile.{profile.goals && ` Goal: ${profile.goals}.`}
              {skills.length > 0 && ` Skills: ${skills.slice(0, 3).join(', ')}${skills.length > 3 ? '...' : ''}.`}
            </div>
          </div>
          <JobSearch profile={profile} resume={resume} skills={skills} cachedJobs={jobRecs} setCachedJobs={setJobRecs} isLoading={jobRecsLoading} setIsLoading={setJobRecsLoading} currentUser={currentUser} isMobile={isMobile} />
        </div>
      )}

      {/* ── RESUME ───────────────────────────────────────────────────────────────── */}
      {tab === 'resume' && (
        <ResumeTab
          resume={resume}
          profile={profile}
          isMobile={isMobile}
          onUpdateProfile={(patch) => {
            const updated = { ...profile, ...patch }
            saveProfile(currentUser, updated)
            setProfile(updated)
          }}
          onUpdateResume={(resumeName, resumeText, resumeParsed) => {
            const updated = { ...profile, resumeName, resumeText, resumeParsed }
            saveProfile(currentUser, updated)
            setProfile(updated)
          }}
        />
      )}

      {/* ── NETWORK ──────────────────────────────────────────────────────────────── */}
      {tab === 'network' && (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: isMobile ? '0 0 calc(6rem + env(safe-area-inset-bottom))' : '1.5rem 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: 10, marginBottom: isMobile ? 14 : 20 }}>
            <div>
              <div style={{ fontSize: isMobile ? 34 : 22, lineHeight: isMobile ? 1 : 1.2, fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
                <NetworkIcon size={isMobile ? 28 : 22} strokeWidth={1.8} aria-hidden="true" />
                Your Network
              </div>
              <div style={{ fontSize: isMobile ? 14 : 13, color: 'var(--text-secondary)', lineHeight: 1.45, maxWidth: 620 }}>Connections between your contacts. Lines show shared company, school, or industry.</div>
            </div>
          </div>
          <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: isMobile ? 18 : 20, padding: isMobile ? 12 : '1.5rem' }}>
            <NetworkMap contacts={contacts} onSelect={c => setDetail(c)} isMobile={isMobile} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3, minmax(0, 1fr))' : 'repeat(3, 1fr)', gap: isMobile ? 8 : 10, marginTop: isMobile ? 12 : 16 }}>
            {[
              { label: 'Total contacts', value: contacts.length, color: '#a78bfa' },
              { label: 'Companies represented', value: new Set(contacts.map(c => c.company).filter(Boolean)).size, color: '#4ade80' },
              { label: 'Connections found', value: (() => { let e = 0; for (let i = 0; i < contacts.length; i++) for (let j = i + 1; j < contacts.length; j++) { const a = contacts[i], b = contacts[j]; if (a.company && b.company && a.company.toLowerCase() === b.company.toLowerCase()) e++ } return e })(), color: '#fbbf24' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 14, padding: isMobile ? '12px 8px' : '1rem', textAlign: 'center', minWidth: 0 }}>
                <div style={{ fontSize: isMobile ? 26 : 28, fontWeight: 800, fontFamily: 'var(--font-display)', color, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: isMobile ? 9 : 11, color: 'var(--text-tertiary)', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1.35 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Modals ────────────────────────────────────────────────────────────────── */}
      {showAdd && (
        <div style={modalBg} onClick={e => { if (e.target === e.currentTarget) setShowAdd(false) }}>
          <AddModal onAdd={addContact} onClose={() => setShowAdd(false)} contacts={contacts} isMobile={isMobile} />
        </div>
      )}
      {showEdit && (
        <div style={modalBg} onClick={e => { if (e.target === e.currentTarget) setShowEdit(false) }}>
          <EditProfileModal profile={profile} onSave={handleEditSave} onClose={() => setShowEdit(false)} onLogout={handleLogout} isMobile={isMobile} />
        </div>
      )}
      {showSchedule && contacts.length > 0 && (
        <div style={modalBg} onClick={e => { if (e.target === e.currentTarget) setShowSchedule(false) }}>
          <ScheduleModal contacts={contacts} onSchedule={handleScheduleFromModal} onClose={() => { setShowSchedule(false); setCalendarDate('') }} prefillDate={calendarDate} isMobile={isMobile} />
        </div>
      )}
      {detail && (
        <div style={{ ...modalBg, alignItems: isMobile ? 'flex-end' : 'flex-start', padding: isMobile ? '0' : '3rem 1rem 1rem', overflowY: 'auto' }} onClick={e => { if (e.target === e.currentTarget) setDetail(null) }}>
          <ContactDetail contact={detail} onUpdate={updateContact} onDelete={deleteContact} onClose={() => setDetail(null)} onSchedule={handleSchedule} resume={resume} profileSkills={skills} isMobile={isMobile} />
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
            isMobile={isMobile}
          />
        </div>
      )}

      {/* ── Floating brain dump button ─── */}
      <button
        onClick={() => setShowBrainDump(b => !b)}
        aria-label="Quick notes"
        style={quickNoteButtonStyle}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        title="Quick notes"
      >
        <Zap size={22} strokeWidth={1.8} aria-hidden="true" />
      </button>
      {showBrainDump && <BrainDumpPanel onClose={() => setShowBrainDump(false)} user={currentUser} isMobile={isMobile} />}

      {showNotionImport && (
        <NotionImport
          endpoint={import.meta.env.DEV ? '/api/anthropic/v1/messages' : '/api/anthropic'}
          onImport={(imported) => {
            const merged = [...imported, ...contacts]
            persist(merged)
          }}
          onClose={() => setShowNotionImport(false)}
          isMobile={isMobile}
        />
      )}
    </AppShell>
  )
}
