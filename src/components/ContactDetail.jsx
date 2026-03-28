// components/ContactDetail.jsx
import React, { useState, useRef } from 'react'
import { Avatar, StatusBadge, Button, Input, Textarea, Tabs, Notice, Spinner, AIOutput, SectionLabel, Chip } from './UI'
import { parseLinkedInPDF, generateBrief, generateFollowUp, callClaude } from '../lib/ai'
import { extractTextFromPDF } from '../lib/pdfParser'
import { addDays } from '../lib/utils'

const BRIEF_SECTIONS = [
  { key: 'BACKGROUND', icon: '👤', gradient: 'linear-gradient(135deg, rgba(139,127,255,0.1), rgba(139,127,255,0.03))', border: 'rgba(139,127,255,0.3)', accent: '#c4b8ff' },
  { key: 'MUTUAL GROUND', icon: '🤝', gradient: 'linear-gradient(135deg, rgba(74,222,128,0.1), rgba(74,222,128,0.03))', border: 'rgba(74,222,128,0.3)', accent: '#6ee7b7' },
  { key: 'THEIR CAREER STORY', icon: '📈', gradient: 'linear-gradient(135deg, rgba(251,191,36,0.1), rgba(251,191,36,0.03))', border: 'rgba(251,191,36,0.3)', accent: '#fcd34d' },
  { key: 'GOALS for THIS CHAT', alt: 'GOALS FOR THIS CHAT', icon: '🎯', gradient: 'linear-gradient(135deg, rgba(244,114,182,0.1), rgba(244,114,182,0.03))', border: 'rgba(244,114,182,0.3)', accent: '#f9a8d4' },
  { key: 'QUESTIONS TO ASK', icon: '❓', gradient: 'linear-gradient(135deg, rgba(99,179,255,0.1), rgba(99,179,255,0.03))', border: 'rgba(99,179,255,0.3)', accent: '#93c5fd' },
  { key: 'WHAT TO HIGHLIGHT ABOUT YOU', icon: '✦', gradient: 'linear-gradient(135deg, rgba(52,211,153,0.1), rgba(52,211,153,0.03))', border: 'rgba(52,211,153,0.3)', accent: '#6ee7b7' },
  { key: 'CONVERSATION STARTERS', icon: '💬', gradient: 'linear-gradient(135deg, rgba(251,146,60,0.1), rgba(251,146,60,0.03))', border: 'rgba(251,146,60,0.3)', accent: '#fdba74' },
]

function BriefDisplay({ brief }) {
  const sections = []
  const lines = brief.split('\n')
  let current = null

  for (const line of lines) {
    const trimmed = line.trim()
    const match = BRIEF_SECTIONS.find(s => trimmed === s.key || trimmed === s.alt)
    if (match) {
      if (current) sections.push(current)
      current = { ...match, content: [] }
    } else if (current && trimmed) {
      current.content.push(trimmed)
    }
  }
  if (current) sections.push(current)

  if (sections.length === 0) {
    return <AIOutput>{brief}</AIOutput>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
      {sections.map((s, i) => (
        <div key={i} style={{ background: s.gradient, border: `1px solid ${s.border}`, borderRadius: 14, padding: '14px 16px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -15, right: -15, width: 70, height: 70, borderRadius: '50%', background: `radial-gradient(circle, ${s.border} 0%, transparent 70%)`, opacity: 0.3, pointerEvents: 'none' }} />
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: s.accent, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>{s.icon}</span> {s.key}
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.75, color: 'var(--text-primary)' }}>
            {s.content.map((line, j) => (
              <div key={j} style={{ marginBottom: j < s.content.length - 1 ? 4 : 0 }}>{line}</div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function ExportButton({ text, contactName, label = 'follow-up' }) {
  const [open, setOpen] = useState(false)
  const slug = `${label}-${(contactName || 'contact').replace(/\s+/g, '-').toLowerCase()}`

  function exportAsDoc() {
    const blob = new Blob([text], { type: 'application/msword' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${slug}.doc`
    a.click()
    URL.revokeObjectURL(url)
    setOpen(false)
  }

  function exportAsText() {
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${slug}.txt`
    a.click()
    URL.revokeObjectURL(url)
    setOpen(false)
  }

  function exportToNotion() {
    const encoded = encodeURIComponent(text)
    window.open(`https://www.notion.so/new?title=${encodeURIComponent(`${label}: ${contactName}`)}&body=${encoded}`, '_blank')
    setOpen(false)
  }

  function exportToGoogleDocs() {
    window.open(`https://docs.google.com/document/create`, '_blank')
    navigator.clipboard.writeText(text)
    setOpen(false)
  }

  return (
    <div>
      <button onClick={() => setOpen(!open)} style={{ fontSize: 12, color: 'var(--text-secondary)', background: 'var(--surface-3)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', padding: '5px 12px', cursor: 'pointer', fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', gap: 4 }}>
        📤 Export {open ? '▾' : '▸'}
      </button>
      {open && (
        <div style={{ marginTop: 6, background: 'var(--surface-3)', border: '1px solid var(--border-strong)', borderRadius: 12, padding: 6 }}>
          {[
            { label: 'Google Docs', icon: '📝', desc: 'Opens new doc + copies text to clipboard', fn: exportToGoogleDocs },
            { label: 'Notion', icon: '📓', desc: 'Opens Notion with content pre-filled', fn: exportToNotion },
            { label: 'Word (.doc)', icon: '📄', desc: 'Downloads as a Word document', fn: exportAsDoc },
            { label: 'Text (.txt)', icon: '📃', desc: 'Downloads as plain text file', fn: exportAsText },
          ].map(opt => (
            <button key={opt.label} onClick={opt.fn} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 10px', background: 'transparent', border: 'none', borderRadius: 8, cursor: 'pointer', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', fontSize: 13, textAlign: 'left', transition: 'background 0.1s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <span style={{ fontSize: 16 }}>{opt.icon}</span>
              <div>
                <div style={{ fontWeight: 500 }}>{opt.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{opt.desc}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function MutualSection({ parsed, resume, profileSkills }) {
  if (!parsed || parsed.error) return null
  const mutuals = []

  // Check shared schools
  const userEdu = resume?.parsed?.education || []
  const contactEdu = parsed.education || []
  for (const ce of contactEdu) {
    for (const ue of userEdu) {
      const ceLower = ce.toLowerCase()
      const ueLower = ue.toLowerCase()
      const schoolWords = ueLower.split(/[\s,]+/).filter(w => w.length > 3)
      for (const word of schoolWords) {
        if (ceLower.includes(word) && !['class', 'bachelor', 'master', 'degree', 'science', 'arts', 'expected'].includes(word)) {
          mutuals.push({ type: 'school', icon: '🎓', label: `You both have ties to "${word.charAt(0).toUpperCase() + word.slice(1)}"`, color: '#93c5fd', bg: 'rgba(99,179,255,0.1)', border: 'rgba(99,179,255,0.25)' })
          break
        }
      }
    }
  }

  // Check shared skills
  const contactSkills = (parsed.skills || []).map(s => s.toLowerCase())
  const userSkills = (profileSkills || []).map(s => s.toLowerCase())
  const sharedSkills = userSkills.filter(s => contactSkills.some(cs => cs.includes(s) || s.includes(cs)))
  if (sharedSkills.length > 0) {
    mutuals.push({ type: 'skills', icon: '⚡', label: `Shared skills: ${sharedSkills.slice(0, 3).join(', ')}`, color: '#fcd34d', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.25)' })
  }

  // Check shared interests
  const contactInterests = (parsed.interests || []).map(s => s.toLowerCase())
  const userResInterests = resume?.parsed?.strengths || []
  const userInterestWords = [...userResInterests, ...(profileSkills || [])].map(s => s.toLowerCase())
  const sharedInterests = contactInterests.filter(ci => userInterestWords.some(ui => ci.includes(ui) || ui.includes(ci)))
  if (sharedInterests.length > 0) {
    mutuals.push({ type: 'interests', icon: '✦', label: `Shared interests: ${sharedInterests.slice(0, 3).join(', ')}`, color: '#f9a8d4', bg: 'rgba(244,114,182,0.1)', border: 'rgba(244,114,182,0.25)' })
  }

  // Check shared companies
  const contactCompanies = (parsed.companies || []).map(s => s.toLowerCase())
  const userExp = (resume?.parsed?.experience || []).map(s => s.toLowerCase())
  for (const cc of contactCompanies) {
    for (const ue of userExp) {
      const companyWords = cc.split(/[\s,()]+/).filter(w => w.length > 3 && !['senior', 'junior', 'intern', 'manager', 'engineer', 'lead', 'staff', 'present', 'associate'].includes(w))
      for (const word of companyWords) {
        if (ue.includes(word)) {
          mutuals.push({ type: 'company', icon: '💼', label: `You may share a connection to "${word.charAt(0).toUpperCase() + word.slice(1)}"`, color: '#c4b8ff', bg: 'rgba(139,127,255,0.1)', border: 'rgba(139,127,255,0.25)' })
          break
        }
      }
    }
  }

  if (mutuals.length === 0) return null

  return (
    <div style={{ marginTop: 16, marginBottom: 8 }}>
      <div style={{ borderTop: '1px solid var(--border)', margin: '14px 0' }} />
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6ee7b7', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span>🔗</span> What you have in common
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {mutuals.slice(0, 5).map((m, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: m.bg, border: `1px solid ${m.border}`, borderRadius: 10, padding: '9px 14px' }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>{m.icon}</span>
            <span style={{ fontSize: 13, color: m.color, fontWeight: 500 }}>{m.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function formatLinkedInExport(parsed, contact) {
  if (!parsed || parsed.error) return ''
  const lines = [`${contact.name}'s LinkedIn Profile\n`]
  if (parsed.summary) lines.push(`SUMMARY\n${parsed.summary}\n`)
  if (parsed.locations?.length) lines.push(`LOCATION\n${parsed.locations.join(', ')}\n`)
  if (parsed.companies?.length) lines.push(`EXPERIENCE\n${parsed.companies.map(x => `• ${x}`).join('\n')}\n`)
  if (parsed.education?.length) lines.push(`EDUCATION\n${parsed.education.map(x => `• ${x}`).join('\n')}\n`)
  if (parsed.organizations?.length) lines.push(`ORGANIZATIONS\n${parsed.organizations.map(x => `• ${x}`).join('\n')}\n`)
  if (parsed.skills?.length) lines.push(`SKILLS\n${parsed.skills.join(', ')}\n`)
  if (parsed.interests?.length) lines.push(`INTERESTS\n${parsed.interests.join(', ')}\n`)
  if (parsed.Honors?.length) lines.push(`HONORS & AWARDS\n${parsed.Honors.map(x => `• ${x}`).join('\n')}\n`)
  if (parsed.publications?.length) lines.push(`PUBLICATIONS\n${parsed.publications.map(x => `• ${x}`).join('\n')}\n`)
  return lines.join('\n')
}

const STATUSES = ['new', 'scheduled', 'completed', 'followed up']

export function ContactDetail({ contact, onUpdate, onDelete, onClose, onSchedule, resume, profileSkills }) {
  const [c, setC] = useState(contact)
  const [tab, setTab] = useState('Overview')
  const [linkedinUrl, setLinkedinUrl] = useState(contact.linkedinUrl || '')
  const [parsing, setParsing] = useState(false)
  const [parsed, setParsed] = useState(contact.parsedProfile || null)
  const [briefLoading, setBriefLoading] = useState(false)
  const [brief, setBrief] = useState(contact.brief || '')
  const [fuLoading, setFuLoading] = useState(false)
  const [fuText, setFuText] = useState(contact.followUpText || '')
  const [chatTime, setChatTime] = useState('10:00')
  const [calMsg, setCalMsg] = useState('')
  const [calLoading, setCalLoading] = useState(false)
  const [pdfDragging, setPdfDragging] = useState(false)
  const [pdfName, setPdfName] = useState(contact.pdfName || '')
  const [fuSaved, setFuSaved] = useState(false)
  const [editingInfo, setEditingInfo] = useState(false)
  const [editName, setEditName] = useState(contact.name || '')
  const [editRole, setEditRole] = useState(contact.role || '')
  const [editCompany, setEditCompany] = useState(contact.company || '')
  const fileInputRef = useRef(null)

  // Chatbot state
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatBottomRef = useRef(null)

  const upd = (k, v) => setC(p => ({ ...p, [k]: v }))
  function saveAll(overrides = {}) {
    const updated = { ...c, linkedinUrl, parsedProfile: parsed, brief, followUpText: fuText, pdfName, ...overrides }
    onUpdate(updated)
  }

  async function handlePDFFile(file) {
    if (!file || file.type !== 'application/pdf') return
    setPdfName(file.name)
    setParsing(true)
    try {
      const text = await extractTextFromPDF(file)
      const raw = await parseLinkedInPDF(text)
      const p = JSON.parse(raw.replace(/```json|```/g, '').trim())
      setParsed(p)

      // Auto-fill email, LinkedIn URL, and website if extracted from PDF
      const updates = { ...c, parsedProfile: p, pdfName: file.name }
      if (p.email && !c.email) { updates.email = p.email; upd('email', p.email) }
      if (p.website && !c.website) { updates.website = p.website; upd('website', p.website) }
      if (p.linkedinUrl && !linkedinUrl) {
        updates.linkedinUrl = p.linkedinUrl
        setLinkedinUrl(p.linkedinUrl)
      } else {
        updates.linkedinUrl = linkedinUrl
      }
      setC(prev => ({ ...prev, ...updates }))
      onUpdate(updates)
    } catch { setParsed({ error: true }) }
    setParsing(false)
  }

  function handleDrop(e) { e.preventDefault(); setPdfDragging(false); handlePDFFile(e.dataTransfer.files[0]) }

  async function handleGenerateBrief() {
    setBriefLoading(true)
    try {
      const text = await generateBrief(c, parsed, resume, profileSkills)
      setBrief(text)
      setChatMessages([]) // reset chat when regenerating
      onUpdate({ ...c, linkedinUrl, parsedProfile: parsed, brief: text, followUpText: fuText })
    } catch { setBrief('Something went wrong. Try again.') }
    setBriefLoading(false)
  }

  async function handleChatSend() {
    if (!chatInput.trim() || chatLoading) return
    const userMsg = chatInput.trim()
    setChatInput('')
    const newMessages = [...chatMessages, { role: 'user', content: userMsg }]
    setChatMessages(newMessages)
    setChatLoading(true)
    try {
      const profileCtx = parsed && !parsed.error
        ? `Their profile: ${parsed.summary || ''}. Companies: ${(parsed.companies || []).join(', ')}.`
        : `Role: ${c.role || ''}, Company: ${c.company || ''}`
      const system = `You are a networking coach helping someone prepare for a coffee chat with ${c.name} (${c.role || ''} at ${c.company || ''}). Current prep brief:\n\n${brief}\n\nContext: ${profileCtx}\n\nHelp the user customize or improve their prep. Be concise and specific.`
      const history = newMessages.map(m => ({ role: m.role, content: m.content }))
      const res = await fetch('/api/anthropic/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 800,
          system,
          messages: history,
        }),
      })
      const data = await res.json()
      const reply = data.content?.[0]?.text || 'Something went wrong.'
      setChatMessages(prev => [...prev, { role: 'assistant', content: reply }])
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Try again.' }])
    }
    setChatLoading(false)
  }

  async function handleGenerateFollowUp() {
    setFuLoading(true)
    try {
      const text = await generateFollowUp(c, resume)
      setFuText(text)
      onUpdate({ ...c, linkedinUrl, parsedProfile: parsed, brief, followUpText: text })
    } catch { setFuText('Something went wrong. Try again.') }
    setFuLoading(false)
  }

  async function handleSchedule() {
    if (!c.chatDate) return
    setCalLoading(true)
    try {
      await onSchedule({ contact: c, chatTime })
      setCalMsg('Calendar event created.')
      const updated = { ...c, status: 'scheduled', chatTime }
      setC(updated)
      onUpdate(updated)
    } catch { setCalMsg('Could not schedule. Try again.') }
    setCalLoading(false)
  }

  const searchUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent([c.name, c.company].filter(Boolean).join(' '))}`

  return (
    <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-strong)', padding: '1.75rem 2rem', width: '100%', maxWidth: 780, maxHeight: '88vh', overflowY: 'auto', boxShadow: 'var(--shadow-lg)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: '1.25rem' }}>
        <Avatar name={c.name} company={c.company} size={48} />
        <div style={{ flex: 1, minWidth: 0 }}>
          {editingInfo ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Name" style={{ background: 'var(--surface-3)', color: 'var(--text-primary)', border: '1px solid var(--accent)', borderRadius: 8, padding: '5px 10px', fontSize: 14, fontWeight: 700, outline: 'none', fontFamily: 'var(--font-display)', width: '100%', boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', gap: 6 }}>
                <input value={editRole} onChange={e => setEditRole(e.target.value)} placeholder="Role" style={{ background: 'var(--surface-3)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)', borderRadius: 8, padding: '5px 10px', fontSize: 12, outline: 'none', fontFamily: 'var(--font-sans)', flex: 1, boxSizing: 'border-box' }} />
                <input value={editCompany} onChange={e => setEditCompany(e.target.value)} placeholder="Company" style={{ background: 'var(--surface-3)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)', borderRadius: 8, padding: '5px 10px', fontSize: 12, outline: 'none', fontFamily: 'var(--font-sans)', flex: 1, boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => {
                  const updated = { ...c, name: editName.trim() || c.name, role: editRole.trim(), company: editCompany.trim() }
                  setC(updated); onUpdate({ ...updated, linkedinUrl, parsedProfile: parsed, brief, followUpText: fuText, pdfName }); setEditingInfo(false)
                }} style={{ fontSize: 12, padding: '4px 12px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>Save</button>
                <button onClick={() => { setEditName(c.name); setEditRole(c.role || ''); setEditCompany(c.company || ''); setEditingInfo(false) }} style={{ fontSize: 12, padding: '4px 12px', background: 'var(--surface-3)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>Cancel</button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-display)' }}>{c.name}</div>
                <button onClick={() => { setEditName(c.name); setEditRole(c.role || ''); setEditCompany(c.company || ''); setEditingInfo(true) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: 13, padding: 2, lineHeight: 1 }} title="Edit">✏️</button>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{[c.role, c.company].filter(Boolean).join(' · ') || 'No role set'}</div>
              {c.email && (
                <a href={`mailto:${c.email}`} style={{ fontSize: 12, color: 'var(--accent)', marginTop: 2, display: 'block', textDecoration: 'none' }}>{c.email}</a>
              )}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: 20, lineHeight: 1 }}>✕</button>
          <select value={c.status} onChange={e => upd('status', e.target.value)} style={{ fontSize: 12, padding: '4px 8px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-strong)', background: 'var(--surface-3)', color: 'var(--text-primary)', cursor: 'pointer' }}>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <Tabs tabs={['Overview', 'LinkedIn', 'Prep Brief', 'Follow-up']} active={tab} onChange={setTab} />

      {/* ── OVERVIEW ── */}
      {tab === 'Overview' && (
        <div>
          {/* Quick info cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            <div style={{ background: 'linear-gradient(135deg, rgba(139,127,255,0.1), rgba(139,127,255,0.03))', border: '1px solid rgba(139,127,255,0.25)', borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#c4b8ff', marginBottom: 8 }}>💼 Role</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{c.role || 'Not set'}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{c.company || 'No company'}</div>
            </div>
            <div style={{ background: 'linear-gradient(135deg, rgba(74,222,128,0.1), rgba(74,222,128,0.03))', border: '1px solid rgba(74,222,128,0.25)', borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6ee7b7', marginBottom: 8 }}>📊 Status</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>{c.status}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{c.chatDate ? `Chat: ${new Date(c.chatDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'No date set'}</div>
            </div>
          </div>

          {/* Schedule section */}
          <div style={{ background: 'linear-gradient(135deg, rgba(99,179,255,0.08), rgba(99,179,255,0.03))', border: '1px solid rgba(99,179,255,0.2)', borderRadius: 14, padding: '16px', marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#93c5fd', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>📅</span> Schedule Coffee Chat
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
              <div style={{ flex: 1, minWidth: 130 }}><Input label="Date" type="date" value={c.chatDate} onChange={v => upd('chatDate', v)} /></div>
              <div style={{ flex: 1, minWidth: 130 }}><Input label="Time" type="time" value={chatTime} onChange={setChatTime} /></div>
            </div>
            <Button variant="primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleSchedule} disabled={!c.chatDate || calLoading}>
              {calLoading ? <><Spinner />Scheduling...</> : 'Schedule + add to calendar'}
            </Button>
            {calMsg && <Notice variant="green" style={{ marginTop: 8 }}>{calMsg}</Notice>}
          </div>

          {/* Notes */}
          <div style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px', marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>📝</span> Notes from Chat
            </div>
            <Textarea value={c.notes} onChange={v => upd('notes', v)} placeholder="Key takeaways, action items, things they mentioned..." minHeight={100} />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button variant="danger" size="sm" onClick={() => onDelete(c.id)}>Delete contact</Button>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button size="sm" onClick={onClose}>Close</Button>
              <Button variant="primary" size="sm" onClick={() => saveAll()}>Save</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── LINKEDIN ── */}
      {tab === 'LinkedIn' && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>LinkedIn</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/handle" style={{ flex: 1, background: 'var(--surface-3)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', padding: '7px 11px', fontSize: 13, outline: 'none', fontFamily: 'var(--font-sans)' }} />
              <Button size="sm" variant="primary" onClick={() => { saveAll({ linkedinUrl }); window.open(linkedinUrl || searchUrl, '_blank') }}>
                {linkedinUrl ? 'Open ↗' : 'Search ↗'}
              </Button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Email</div>
              <input
                value={c.email || ''}
                onChange={e => upd('email', e.target.value)}
                placeholder="their@email.com"
                style={{ width: '100%', background: 'var(--surface-3)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', padding: '7px 11px', fontSize: 13, outline: 'none', fontFamily: 'var(--font-sans)', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Website</div>
              <input
                value={c.website || ''}
                onChange={e => upd('website', e.target.value)}
                placeholder="https://theirsite.com"
                style={{ width: '100%', background: 'var(--surface-3)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', padding: '7px 11px', fontSize: 13, outline: 'none', fontFamily: 'var(--font-sans)', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', margin: '16px 0' }} />
          <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Import PDF</div>
          <Notice variant="blue" style={{ marginBottom: 10 }}>LinkedIn profile → More → Save to PDF → drop below</Notice>
          <div
            onDragOver={e => { e.preventDefault(); setPdfDragging(true) }}
            onDragLeave={() => setPdfDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{ border: `2px dashed ${pdfDragging ? 'var(--accent)' : 'var(--border-strong)'}`, borderRadius: 'var(--radius-md)', padding: '1.5rem', textAlign: 'center', cursor: 'pointer', background: pdfDragging ? 'var(--accent-dim)' : 'transparent', transition: 'all 0.15s' }}
          >
            {parsing
              ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}><Spinner /> Parsing PDF...</div>
              : pdfName
                ? <div><div style={{ fontSize: 22, marginBottom: 4 }}>📄</div><div style={{ fontSize: 13, fontWeight: 500 }}>{pdfName}</div><div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>Click to replace</div></div>
                : <div><div style={{ fontSize: 28, marginBottom: 6, opacity: 0.25 }}>⬆</div><div style={{ fontSize: 13 }}>Drop LinkedIn PDF here</div><div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>or click to browse</div></div>}
          </div>
          <input ref={fileInputRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => handlePDFFile(e.target.files[0])} />

          {parsed && !parsed.error && (
            <div style={{ marginTop: 20 }}>
              <div style={{ borderTop: '1px solid var(--border)', margin: '14px 0' }} />
              <div style={{ fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: 8 }}>{c.name}'s profile</div>

              {/* Top 3 skill pills */}
              {parsed.skills?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  {parsed.skills.slice(0, 3).map((x, i) => (
                    <span key={i} style={{ fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 999, background: 'var(--chip-skill-bg)', color: 'var(--chip-skill-color)', border: '1px solid var(--chip-skill-border)', letterSpacing: '0.02em' }}>{x}</span>
                  ))}
                </div>
              )}

              {parsed.summary && <div style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--text-secondary)', marginBottom: 16 }}>{parsed.summary}</div>}

              {parsed.locations?.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <SectionLabel>Location</SectionLabel>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>{parsed.locations.map((x, i) => <Chip key={i} kind="location">📍 {x}</Chip>)}</div>
                </div>
              )}
              {parsed.companies?.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <SectionLabel>Experience</SectionLabel>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {parsed.companies.map((x, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: 'var(--chip-experience-bg)', border: '1px solid var(--chip-experience-border)', borderRadius: 10, padding: '8px 12px' }}>
                        <span style={{ fontSize: 14, flexShrink: 0, lineHeight: 1.5 }}>💼</span>
                        <span style={{ fontSize: 12, color: 'var(--chip-experience-color)', lineHeight: 1.6, wordBreak: 'break-word' }}>{x}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {parsed.education?.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <SectionLabel>🎓 Education</SectionLabel>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>{parsed.education.map((x, i) => <Chip key={i} kind="education">{x}</Chip>)}</div>
                </div>
              )}
              {parsed.organizations?.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <SectionLabel>🤝 Organizations & Clubs</SectionLabel>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>{parsed.organizations.map((x, i) => <Chip key={i} kind="org">{x}</Chip>)}</div>
                </div>
              )}
              {parsed.skills?.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <SectionLabel>⚡ Skills</SectionLabel>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>{parsed.skills.map((x, i) => <Chip key={i} kind="skill">{x}</Chip>)}</div>
                </div>
              )}
              {parsed.interests?.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <SectionLabel>✦ Interests</SectionLabel>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>{parsed.interests.map((x, i) => <Chip key={i} kind="interest">{x}</Chip>)}</div>
                </div>
              )}
              {parsed.Honors?.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <SectionLabel>🏆 Honors & Awards</SectionLabel>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>{parsed.Honors.map((x, i) => <Chip key={i} kind="honor">{x}</Chip>)}</div>
                </div>
              )}
              {parsed.publications?.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <SectionLabel>📄 Publications</SectionLabel>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>{parsed.publications.map((x, i) => <Chip key={i}>{x}</Chip>)}</div>
                </div>
              )}

              <MutualSection parsed={parsed} resume={resume} profileSkills={profileSkills} />

              <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <ExportButton text={formatLinkedInExport(parsed, c)} contactName={c.name} label="linkedin-profile" />
                <Button size="sm" variant="primary" onClick={() => saveAll()}>Save profile</Button>
              </div>
            </div>
          )}
          {parsed?.error && <Notice variant="muted" style={{ marginTop: 10 }}>Couldn't parse. Make sure it's a LinkedIn-exported PDF.</Notice>}
        </div>
      )}

      {/* ── PREP BRIEF ── */}
      {tab === 'Prep Brief' && (
        <div>
          <Notice variant="muted" style={{ marginBottom: 10 }}>
            {parsed && !parsed.error ? 'Using their LinkedIn.' : 'Add their LinkedIn PDF for a better brief.'}
            {resume ? ' Your resume included.' : ''}
          </Notice>

          <Button variant="primary" size="sm" onClick={handleGenerateBrief} disabled={briefLoading}>
            {briefLoading ? <><Spinner />Generating...</> : brief ? 'Regenerate ↗' : 'Generate prep brief ↗'}
          </Button>

          {brief && <BriefDisplay brief={brief} />}

          {brief && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button onClick={() => navigator.clipboard.writeText(brief)} style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', gap: 4 }}>📋 Copy</button>
              <ExportButton text={brief} contactName={c.name} label="prep-brief" />
            </div>
          )}

          {/* Chatbot */}
          {brief && (
            <div style={{ marginTop: 20 }}>
              <div style={{ borderTop: '1px solid var(--border)', margin: '16px 0' }} />
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                ✦ Ask anything about this brief
              </div>

              {/* Messages */}
              {chatMessages.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12, maxHeight: 300, overflowY: 'auto' }}>
                  {chatMessages.map((m, i) => (
                    <div key={i} style={{
                      alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '88%',
                      background: m.role === 'user' ? 'var(--accent)' : 'var(--surface-3)',
                      color: m.role === 'user' ? '#fff' : 'var(--text-primary)',
                      border: m.role === 'user' ? 'none' : '1px solid var(--border-strong)',
                      borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      padding: '9px 13px',
                      fontSize: 13,
                      lineHeight: 1.65,
                      whiteSpace: 'pre-wrap',
                    }}>
                      {m.content}
                    </div>
                  ))}
                  {chatLoading && (
                    <div style={{ alignSelf: 'flex-start', background: 'var(--surface-3)', border: '1px solid var(--border-strong)', borderRadius: '14px 14px 14px 4px', padding: '9px 13px', fontSize: 13, color: 'var(--text-tertiary)' }}>
                      <Spinner />Thinking...
                    </div>
                  )}
                  <div ref={chatBottomRef} />
                </div>
              )}

              {/* Input */}
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSend() } }}
                  placeholder="Add more context, ask a question, tweak the brief..."
                  style={{ flex: 1, background: 'var(--surface-3)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', padding: '8px 12px', fontSize: 13, outline: 'none', fontFamily: 'var(--font-sans)' }}
                />
                <Button variant="primary" size="sm" onClick={handleChatSend} disabled={!chatInput.trim() || chatLoading}>
                  Send
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── FOLLOW-UP ── */}
      {tab === 'Follow-up' && (
        <div>
          {/* Status banner */}
          <div style={{ background: c.notes ? 'linear-gradient(135deg, rgba(74,222,128,0.1), rgba(74,222,128,0.03))' : 'linear-gradient(135deg, rgba(251,191,36,0.1), rgba(251,191,36,0.03))', border: `1px solid ${c.notes ? 'rgba(74,222,128,0.25)' : 'rgba(251,191,36,0.25)'}`, borderRadius: 14, padding: '14px 16px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>{c.notes ? '✅' : '⚠️'}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: c.notes ? '#6ee7b7' : '#fcd34d' }}>{c.notes ? 'Ready to generate!' : 'Add chat notes first'}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{c.notes ? 'Your notes will personalize the follow-up message.' : 'Add chat notes first for a more personalized follow-up message.'}</div>
              </div>
            </div>
          </div>

          {/* Generate button */}
          <div style={{ background: 'linear-gradient(135deg, rgba(244,114,182,0.08), rgba(139,127,255,0.05))', border: '1px solid rgba(244,114,182,0.2)', borderRadius: 14, padding: '20px', textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>✉️</div>
            <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: 6 }}>Follow-up Message</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>Generate a warm, personalized follow-up based on your chat notes.</div>
            <Button variant="primary" onClick={handleGenerateFollowUp} disabled={fuLoading}>
              {fuLoading ? <><Spinner />Writing...</> : fuText ? 'Regenerate message ↗' : 'Write follow-up ↗'}
            </Button>
          </div>

          {fuText && (
            <>
              <div style={{ background: 'linear-gradient(135deg, rgba(139,127,255,0.06), rgba(99,179,255,0.04))', border: '1px solid rgba(139,127,255,0.2)', borderRadius: 14, padding: '16px', marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#c4b8ff', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>💌</span> Your Message
                </div>
                <textarea value={fuText} onChange={e => setFuText(e.target.value)} style={{ width: '100%', minHeight: 120, background: 'var(--surface-3)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', padding: '12px 14px', fontSize: 13, resize: 'vertical', fontFamily: 'var(--font-sans)', lineHeight: 1.7, outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button onClick={() => { navigator.clipboard.writeText(fuText) }} style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', gap: 4 }}>📋 Copy</button>
                  {c.email && (
                    <a href={`mailto:${c.email}?subject=${encodeURIComponent(`Following up — great chatting!`)}&body=${encodeURIComponent(fuText)}`}
                      style={{ fontSize: 12, color: '#93c5fd', background: 'rgba(99,179,255,0.1)', border: '1px solid rgba(99,179,255,0.25)', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontFamily: 'var(--font-sans)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      ✉ Email {c.name.split(' ')[0]}
                    </a>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <ExportButton text={fuText} contactName={c.name} />
                  <Button variant="primary" size="sm" onClick={() => { saveAll({ followUpText: fuText }); setFuSaved(true); setTimeout(() => setFuSaved(false), 2000) }}>{fuSaved ? '✓ Saved' : 'Save'}</Button>
                </div>
              </div>
            </>
          )}

          {/* Schedule next follow-up */}
          <div style={{ background: 'linear-gradient(135deg, rgba(99,179,255,0.08), rgba(52,211,153,0.05))', border: '1px solid rgba(99,179,255,0.2)', borderRadius: 14, padding: '16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#93c5fd', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>🔄</span> Schedule Next Follow-up
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>Set a reminder to reconnect with {c.name}.</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {[30, 60, 90].map(days => {
                const target = new Date(); target.setDate(target.getDate() + days)
                const dateStr = target.toISOString().split('T')[0]
                const label = target.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                return (
                  <button key={days} onClick={() => upd('followUpDate', dateStr)}
                    style={{ background: c.followUpDate === dateStr ? 'var(--accent)' : 'var(--surface-3)', color: c.followUpDate === dateStr ? '#fff' : 'var(--text-secondary)', border: `1px solid ${c.followUpDate === dateStr ? 'var(--accent)' : 'var(--border-strong)'}`, borderRadius: 10, padding: '8px 16px', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-sans)', fontWeight: 500, transition: 'all 0.15s' }}>
                    {days} days <span style={{ fontSize: 11, opacity: 0.7 }}>({label})</span>
                  </button>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input type="date" value={c.followUpDate || ''} onChange={e => upd('followUpDate', e.target.value)}
                style={{ flex: 1, background: 'var(--surface-3)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', padding: '8px 12px', fontSize: 13, outline: 'none', fontFamily: 'var(--font-sans)' }} />
              <Button variant="primary" size="sm" onClick={() => { if (c.followUpDate) saveAll({ followUpDate: c.followUpDate }) }}>Set reminder</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}