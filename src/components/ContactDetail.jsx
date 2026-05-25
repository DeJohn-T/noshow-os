// components/ContactDetail.jsx
import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Avatar, StatusBadge, Button, Input, Textarea, RichNotes, Tabs, Notice, Spinner, AIOutput, SectionLabel, Chip } from './UI'
import { parseLinkedInPDF, generateBrief, generateFollowUp, callClaude, callClaudeChat } from '../lib/ai'
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

  // Check shared schools — find the best matching school name (not individual words)
  const userEdu = resume?.parsed?.education || []
  const contactEdu = parsed.education || []
  const addedSchools = new Set()
  const skipWords = new Set(['class', 'bachelor', 'master', 'degree', 'science', 'arts', 'expected', 'university', 'college', 'institute', 'school', 'the', 'and', 'of', 'at', 'in'])
  outer: for (const ce of contactEdu) {
    for (const ue of userEdu) {
      const ceLower = ce.toLowerCase()
      // Extract the school name as the first meaningful segment (before comma or newline)
      const schoolName = ue.split(/[,\n]/)[0].trim()
      const schoolNameLower = schoolName.toLowerCase()
      // Find the most distinctive word in the school name to use as the label
      const words = schoolNameLower.split(/\s+/).filter(w => w.length > 3 && !skipWords.has(w))
      for (const word of words) {
        if (ceLower.includes(word) && !addedSchools.has(schoolName)) {
          addedSchools.add(schoolName)
          mutuals.push({ type: 'school', icon: '🎓', label: `You both have ties to "${schoolName}"`, color: '#93c5fd', bg: 'rgba(99,179,255,0.1)', border: 'rgba(99,179,255,0.25)' })
          break outer
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

function getInsights(contact, parsed) {
  const name = contact.name?.split(' ')[0] || 'They'
  const facts = []
  if (parsed?.education?.length) facts.push(`🎓 ${name} studied at ${parsed.education[0].split(',')[0]}`)
  if (parsed?.companies?.length) {
    const co = parsed.companies[0]
    facts.push(`💼 Background includes ${co.length > 60 ? co.slice(0, 60) + '…' : co}`)
  }
  if (contact.pastRoles?.length) {
    const r = contact.pastRoles[0]
    facts.push(`📌 Previously ${r.role ? `${r.role} at ${r.company}` : r.company}${r.period ? ` (${r.period})` : ''}`)
  }
  if (parsed?.locations?.length) facts.push(`📍 ${name} is based in ${parsed.locations[0]}`)
  if (parsed?.skills?.length > 1) facts.push(`⚡ Skills include ${parsed.skills.slice(0, 3).join(', ')}`)
  if (contact.notes) {
    const first = contact.notes.replace(/<[^>]+>/g, '').split(/[.!\n]/)[0]?.trim()
    if (first?.length > 25) facts.push(`📝 From your notes: "${first.slice(0, 90)}${first.length > 90 ? '…' : ''}"`)
  }
  if (contact.followUpDate) {
    const d = new Date(contact.followUpDate + 'T12:00:00')
    facts.push(`🔔 Follow-up scheduled for ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`)
  }
  const tips = [
    `💡 Follow up within 24 hours — the connection is freshest right after you meet`,
    `🎯 Warm intros are 5× more likely to get a response than cold outreach`,
    `✉️ Keep follow-ups under 3 sentences — specific and genuine beats long and generic`,
    `🤝 Mention one specific thing from your conversation to make your message stand out`,
    `📈 Reaching out 3× per week to new contacts compounds your network fast`,
    `☕ Ask for a 15-minute coffee chat — shorter requests get more yes's`,
    `🔄 Reconnect with dormant contacts by sharing something relevant to them`,
    `📌 People remember how you made them feel, not everything you said`,
    `🚀 Your next opportunity is more likely to come from a weak tie than a close friend`,
    `🧠 Research them on LinkedIn before your chat — it shows you're serious`,
    `✨ Send a thank-you message after every conversation, no exceptions`,
    `💬 Ask questions more than you talk — people love feeling heard`,
    `🔗 Offer value first — share an article, make an intro, give a resource`,
    `📅 Set a recurring reminder to reach out to your top contacts every 90 days`,
    `🎯 Be specific about what you're looking for — vague asks get vague help`,
    `💼 Update your LinkedIn before you start networking hard`,
    `🌐 Attend events in your target industry even when you don't feel ready`,
    `📝 Take notes right after every meeting while it's still fresh`,
    `⚡ The best time to network is before you need something`,
    `🤝 Introduce two people who should know each other — givers gain`,
    `📊 Track your outreach — most people need 3-5 touchpoints before responding`,
    `🎓 Alumni networks are wildly underused — reach out to people from your school`,
    `🏆 Celebrate their wins publicly — comment on their posts, congratulate milestones`,
    `💡 Cold DMs work when they're short, personal, and ask for nothing big`,
    `🔔 Set a calendar reminder to follow up if you haven't heard back in a week`,
  ]
  while (facts.length < 4) facts.push(tips[facts.length % tips.length])
  return facts
}

function InsightCard({ contact, parsed }) {
  const insights = useMemo(() => getInsights(contact, parsed), [contact?.notes, contact?.followUpDate, parsed])
  const [idx, setIdx] = useState(0)
  const [fade, setFade] = useState(true)
  useEffect(() => {
    if (insights.length <= 1) return
    const t = setInterval(() => {
      setFade(false)
      setTimeout(() => { setIdx(i => (i + 1) % insights.length); setFade(true) }, 250)
    }, 6000)
    return () => clearInterval(t)
  }, [insights.length])
  return (
    <div style={{ background: 'linear-gradient(135deg, rgba(139,127,255,0.1), rgba(99,179,255,0.06))', border: '1px solid rgba(139,127,255,0.25)', borderRadius: 16, padding: '14px 16px', marginBottom: 14, overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 10, color: '#c4b8ff', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>✦ About {contact.name?.split(' ')[0]}</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {insights.map((_, i) => (
            <div key={i} style={{ width: i === idx ? 16 : 5, height: 5, borderRadius: 3, background: i === idx ? '#c4b8ff' : 'rgba(196,184,255,0.2)', transition: 'all 0.3s' }} />
          ))}
        </div>
      </div>
      <div style={{ opacity: fade ? 1 : 0, transform: fade ? 'none' : 'translateY(5px)', transition: 'all 0.25s ease', fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>
        {insights[idx]}
      </div>
    </div>
  )
}

export function ContactDetail({ contact, onUpdate, onDelete, onClose, onSchedule, resume, profileSkills }) {
  const [c, setC] = useState(contact)
  const [tab, setTab] = useState('Overview')
  const [notesSummary, setNotesSummary] = useState(contact.notesSummary || '')
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [cleaningNotes, setCleaningNotes] = useState(false)
  const [notesSubTab, setNotesSubTab] = useState('my-notes')
  const [meetingNotes, setMeetingNotes] = useState(contact.meetingNotes || '')
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
  const [pastRoles, setPastRoles] = useState(contact.pastRoles || [])
  const [addingRole, setAddingRole] = useState(false)
  const [newRoleTitle, setNewRoleTitle] = useState('')
  const [newRoleCompany, setNewRoleCompany] = useState('')
  const [newRolePeriod, setNewRolePeriod] = useState('')
  const notesSaveTimer = useRef(null)
  const notesMounted = useRef(false)

  // Auto-save notes 1 s after last keystroke
  useEffect(() => {
    if (!notesMounted.current) { notesMounted.current = true; return }
    clearTimeout(notesSaveTimer.current)
    notesSaveTimer.current = setTimeout(() => saveAll(), 1000)
    return () => clearTimeout(notesSaveTimer.current)
  }, [c.notes]) // eslint-disable-line

  const meetingNotesSaveTimer = useRef(null)
  const meetingNotesMounted = useRef(false)
  useEffect(() => {
    if (!meetingNotesMounted.current) { meetingNotesMounted.current = true; return }
    clearTimeout(meetingNotesSaveTimer.current)
    meetingNotesSaveTimer.current = setTimeout(() => saveAll(), 1000)
    return () => clearTimeout(meetingNotesSaveTimer.current)
  }, [meetingNotes]) // eslint-disable-line
  const fileInputRef = useRef(null)

  // Chatbot state
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatBottomRef = useRef(null)

  const upd = (k, v) => setC(p => ({ ...p, [k]: v }))
  function saveAll(overrides = {}, close = false) {
    const updated = { ...c, linkedinUrl, parsedProfile: parsed, brief, followUpText: fuText, pdfName, pastRoles, notesSummary, meetingNotes, ...overrides }
    onUpdate(updated)
    if (close) onClose()
  }

  async function generateNotesSummary() {
    const raw = c.notes?.replace(/<[^>]+>/g, '').trim()
    if (!raw) return
    setSummaryLoading(true)
    try {
      const result = await callClaude(
        `You are summarizing networking notes. Return a concise 2-3 sentence summary of the key points from this person's notes. Focus on: who they are, what was discussed, and any action items or follow-up context. Be specific and useful.`,
        `Contact: ${c.name} (${[c.role, c.company].filter(Boolean).join(' at ')})\n\nNotes:\n${raw}`
      )
      const summary = result.replace(/^(Summary:|Here's a summary:|Here is a summary:)/i, '').trim()
      setNotesSummary(summary)
      const updated = { ...c, linkedinUrl, parsedProfile: parsed, brief, followUpText: fuText, pdfName, pastRoles, notesSummary: summary }
      onUpdate(updated)
    } catch (e) { console.error(e) }
    setSummaryLoading(false)
  }

  async function cleanUpNotes() {
    const raw = c.notes?.replace(/<[^>]+>/g, '').trim()
    if (!raw) return
    setCleaningNotes(true)
    try {
      const cleaned = await callClaude(
        `Clean up and reformat these meeting notes. Make them readable and well-structured. Rules:
- Preserve ALL information and every specific detail — do not remove or summarize anything
- Keep exact quotes and specific advice word for word
- Add clear structure: use bullet points, short paragraphs, or headers where it makes sense
- Remove duplicate lines, weird formatting artifacts, and clutter
- Return plain text only — no markdown symbols like ** or ##
- Keep it concise but complete`,
        `Notes from meeting with ${c.name}:\n\n${raw.slice(0, 6000)}`
      )
      upd('notes', cleaned)
    } catch (e) { console.error(e) }
    setCleaningNotes(false)
  }

  function savePastRole() {
    if (!newRoleTitle.trim() && !newRoleCompany.trim()) return
    const updated = [...pastRoles, { role: newRoleTitle.trim(), company: newRoleCompany.trim(), period: newRolePeriod.trim() }]
    setPastRoles(updated)
    const contact = { ...c, linkedinUrl, parsedProfile: parsed, brief, followUpText: fuText, pdfName, pastRoles: updated }
    setC(contact); onUpdate(contact)
    setNewRoleTitle(''); setNewRoleCompany(''); setNewRolePeriod(''); setAddingRole(false)
  }

  function removePastRole(i) {
    const updated = pastRoles.filter((_, idx) => idx !== i)
    setPastRoles(updated)
    const contact = { ...c, linkedinUrl, parsedProfile: parsed, brief, followUpText: fuText, pdfName, pastRoles: updated }
    setC(contact); onUpdate(contact)
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
      const reply = await callClaudeChat(system, history)
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

      <Tabs tabs={['Overview', 'Notes', 'LinkedIn', 'Prep Brief']} active={tab} onChange={setTab} />

      {/* ── OVERVIEW ── */}
      {tab === 'Overview' && (
        <div>
          {/* Rotating insight card */}
          <InsightCard contact={c} parsed={parsed} />

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

          {/* What's next */}
          <div style={{ marginBottom: 16, background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: 10 }}>🔮 What's next?</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { key: 'follow-up', icon: '🔄', label: 'Follow Up', sub: 'Send a follow-up soon', color: '#a78bfa' },
                { key: 'circle-back', icon: '📅', label: 'Circle Back', sub: 'Reconnect in 60-90 days', color: '#60a5fa' },
                { key: 'one-time', icon: '✅', label: 'One & Done', sub: 'No action needed', color: '#34d399' },
              ].map(opt => (
                <button key={opt.key} onClick={() => {
                  const updates = { nextAction: opt.key }
                  if (opt.key === 'follow-up') { const d = new Date(); d.setDate(d.getDate() + 30); updates.followUpDate = d.toISOString().split('T')[0]; updates.status = 'followed up' }
                  if (opt.key === 'circle-back') { const d = new Date(); d.setDate(d.getDate() + 90); updates.followUpDate = d.toISOString().split('T')[0] }
                  const updated = { ...c, ...updates }; setC(updated); saveAll(updates)
                }} style={{
                  flex: 1, minWidth: 90, background: c.nextAction === opt.key ? `${opt.color}22` : 'var(--surface-2)',
                  border: `1.5px solid ${c.nextAction === opt.key ? opt.color : 'var(--border)'}`,
                  borderRadius: 12, padding: '10px 8px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
                }}>
                  <div style={{ fontSize: 18, marginBottom: 3 }}>{opt.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: c.nextAction === opt.key ? opt.color : 'var(--text-primary)' }}>{opt.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 1 }}>{opt.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Career history */}
          {(c.role || c.company || pastRoles.length > 0) && (
            <div style={{ marginBottom: 16, background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)' }}>💼 Career</div>
                <button onClick={() => setAddingRole(true)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 10px', fontSize: 11, color: 'var(--text-tertiary)', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>+ Add past role</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {(c.role || c.company) && (
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', paddingBottom: pastRoles.length > 0 ? 10 : 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 4 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
                      {pastRoles.length > 0 && <div style={{ width: 2, flex: 1, background: 'var(--border)', marginTop: 4, minHeight: 20 }} />}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{c.role || 'Unknown role'}</div>
                      <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 1 }}>{c.company || ''} · <span style={{ opacity: 0.7 }}>Current</span></div>
                    </div>
                  </div>
                )}
                {pastRoles.map((r, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', paddingBottom: i < pastRoles.length - 1 ? 10 : 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 4 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--border-strong)', flexShrink: 0 }} />
                      {i < pastRoles.length - 1 && <div style={{ width: 2, flex: 1, background: 'var(--border)', marginTop: 4, minHeight: 20 }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{r.role || r.company}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 1 }}>
                        {r.role && r.company ? r.company : ''}{r.period ? ` · ${r.period}` : ''}
                      </div>
                    </div>
                    <button onClick={() => removePastRole(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: 16, lineHeight: 1, padding: '2px 4px', flexShrink: 0 }}>×</button>
                  </div>
                ))}
              </div>
              {addingRole && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 }}>
                    <input value={newRoleTitle} onChange={e => setNewRoleTitle(e.target.value)} placeholder="Role / Title" autoFocus
                      style={{ background: 'var(--surface-2)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)', borderRadius: 7, padding: '7px 10px', fontSize: 12, outline: 'none', fontFamily: 'var(--font-sans)' }} />
                    <input value={newRoleCompany} onChange={e => setNewRoleCompany(e.target.value)} placeholder="Company"
                      style={{ background: 'var(--surface-2)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)', borderRadius: 7, padding: '7px 10px', fontSize: 12, outline: 'none', fontFamily: 'var(--font-sans)' }} />
                  </div>
                  <input value={newRolePeriod} onChange={e => setNewRolePeriod(e.target.value)} placeholder="Period (optional, e.g. 2022–2024)"
                    style={{ width: '100%', background: 'var(--surface-2)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)', borderRadius: 7, padding: '7px 10px', fontSize: 12, outline: 'none', fontFamily: 'var(--font-sans)', boxSizing: 'border-box', marginBottom: 8 }} />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => { setAddingRole(false); setNewRoleTitle(''); setNewRoleCompany(''); setNewRolePeriod('') }}
                      style={{ flex: 1, background: 'var(--surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 7, padding: '7px', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>Cancel</button>
                    <button onClick={savePastRole}
                      style={{ flex: 2, background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 7, padding: '7px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-display)' }}>Save</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Add career if no role yet */}
          {!c.role && !c.company && pastRoles.length === 0 && (
            <button onClick={() => setAddingRole(true)} style={{ width: '100%', background: 'none', border: '1px dashed var(--border)', borderRadius: 12, padding: '10px', fontSize: 13, color: 'var(--text-tertiary)', cursor: 'pointer', fontFamily: 'var(--font-sans)', marginBottom: 16 }}>
              + Add career history
            </button>
          )}

          {/* Debrief card */}
          {c.debrief && (c.debrief.vibe || c.debrief.note) && (() => {
            const vibeMap = { great: { label: '🔥 Crushed it', color: '#4ade80' }, okay: { label: '👍 Solid', color: '#fbbf24' }, awkward: { label: '😬 Awkward', color: '#f472b6' } }
            const v = vibeMap[c.debrief.vibe]
            return (
              <div style={{ background: 'linear-gradient(135deg, rgba(139,127,255,0.08), rgba(139,127,255,0.03))', border: '1px solid rgba(139,127,255,0.2)', borderRadius: 14, padding: '14px 16px', marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#c4b8ff', marginBottom: 8 }}>☕ Post-chat debrief</div>
                {v && <div style={{ fontSize: 13, fontWeight: 600, color: v.color, marginBottom: c.debrief.note ? 6 : 0 }}>{v.label}</div>}
                {c.debrief.note && <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>{c.debrief.note}</div>}
              </div>
            )
          })()}

          {/* Follow-up section */}
          <div style={{ background: 'linear-gradient(135deg, rgba(244,114,182,0.06), rgba(139,127,255,0.04))', border: '1px solid rgba(244,114,182,0.18)', borderRadius: 14, padding: '16px', marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#f9a8d4', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>✉️ Follow-up</span>
              <Button variant="primary" size="sm" onClick={handleGenerateFollowUp} disabled={fuLoading}>
                {fuLoading ? <><Spinner />Writing...</> : fuText ? 'Regenerate' : 'Generate message'}
              </Button>
            </div>
            {fuText ? (
              <>
                <textarea value={fuText} onChange={e => setFuText(e.target.value)} style={{ width: '100%', minHeight: 100, background: 'var(--surface-3)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)', borderRadius: 10, padding: '10px 12px', fontSize: 13, resize: 'vertical', fontFamily: 'var(--font-sans)', lineHeight: 1.7, outline: 'none', boxSizing: 'border-box', marginBottom: 8 }} />
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={() => navigator.clipboard.writeText(fuText)} style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>📋 Copy</button>
                  {c.email && <a href={`mailto:${c.email}?subject=${encodeURIComponent('Following up!')}&body=${encodeURIComponent(fuText)}`} style={{ fontSize: 12, color: '#93c5fd', background: 'rgba(99,179,255,0.1)', border: '1px solid rgba(99,179,255,0.25)', borderRadius: 8, padding: '3px 10px', textDecoration: 'none' }}>✉ Email</a>}
                  <Button size="sm" variant="primary" onClick={() => saveAll({ followUpText: fuText })}>Save</Button>
                </div>
              </>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{c.notes ? 'Ready to generate based on your notes.' : 'Add notes first for a personalized message.'}</div>
            )}
          </div>

          {/* Schedule */}
          <div style={{ background: 'linear-gradient(135deg, rgba(99,179,255,0.08), rgba(99,179,255,0.03))', border: '1px solid rgba(99,179,255,0.2)', borderRadius: 14, padding: '16px', marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#93c5fd', marginBottom: 12 }}>📅 Schedule Coffee Chat</div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
              <div style={{ flex: 1, minWidth: 130 }}><Input label="Date" type="date" value={c.chatDate} onChange={v => upd('chatDate', v)} /></div>
              <div style={{ flex: 1, minWidth: 130 }}><Input label="Time" type="time" value={chatTime} onChange={setChatTime} /></div>
            </div>
            <Button variant="primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleSchedule} disabled={!c.chatDate || calLoading}>
              {calLoading ? <><Spinner />Scheduling...</> : 'Schedule + add to calendar'}
            </Button>
            {calMsg && <Notice variant="green" style={{ marginTop: 8 }}>{calMsg}</Notice>}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button variant="danger" size="sm" onClick={() => onDelete(c.id)}>Delete contact</Button>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button size="sm" onClick={onClose}>Close</Button>
              <Button variant="primary" size="sm" onClick={() => saveAll({}, true)}>Save</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── NOTES ── */}
      {tab === 'Notes' && (
        <div>
          {/* Sub-tab toggle */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 14, background: 'var(--surface-3)', borderRadius: 10, padding: 4 }}>
            {[['my-notes', '📝 My Notes'], ['meeting-notes', '🤖 Meeting Notes']].map(([key, label]) => (
              <button key={key} onClick={() => setNotesSubTab(key)} style={{ flex: 1, padding: '7px 0', borderRadius: 7, border: 'none', background: notesSubTab === key ? 'var(--surface-2)' : 'transparent', color: notesSubTab === key ? 'var(--text-primary)' : 'var(--text-tertiary)', fontWeight: notesSubTab === key ? 600 : 400, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                {label}
              </button>
            ))}
          </div>

          {notesSubTab === 'my-notes' && (
            <>
              {/* AI Summary */}
              {(notesSummary || c.notes) && (
                <div style={{ background: 'linear-gradient(135deg, rgba(139,127,255,0.08), rgba(99,179,255,0.05))', border: '1px solid rgba(139,127,255,0.2)', borderRadius: 14, padding: '14px 16px', marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: notesSummary ? 10 : 0 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#c4b8ff' }}>✦ AI Summary</div>
                    <Button size="sm" onClick={generateNotesSummary} disabled={summaryLoading}>
                      {summaryLoading ? <><Spinner />Generating...</> : notesSummary ? 'Regenerate' : 'Generate Summary'}
                    </Button>
                  </div>
                  {notesSummary && <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.7 }}>{notesSummary}</div>}
                  {!notesSummary && !summaryLoading && <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 6 }}>Generate a persistent summary of your notes with one click.</div>}
                </div>
              )}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px', marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)' }}>📝 Notes <span style={{ fontSize: 9, opacity: 0.5, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>· auto-saves</span></div>
                  {c.notes && (
                    <Button size="sm" onClick={cleanUpNotes} disabled={cleaningNotes}>
                      {cleaningNotes ? <><Spinner />Cleaning...</> : '✨ Clean up'}
                    </Button>
                  )}
                </div>
                <RichNotes value={c.notes} onChange={v => upd('notes', v)} placeholder="Key takeaways, action items, things they mentioned..." minHeight={160} />
              </div>
            </>
          )}

          {notesSubTab === 'meeting-notes' && (
            <div>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px', marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)' }}>🤖 AI Meeting Notes <span style={{ fontSize: 9, opacity: 0.5, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>· auto-saves</span></div>
                </div>
                <textarea
                  value={meetingNotes}
                  onChange={e => setMeetingNotes(e.target.value)}
                  placeholder={`Paste your AI meeting notes here — Notion AI, Otter.ai transcripts, or any structured notes from your conversation with ${c.name}...`}
                  rows={16}
                  style={{ width: '100%', background: 'transparent', color: 'var(--text-primary)', border: 'none', outline: 'none', fontSize: 13, lineHeight: 1.7, resize: 'none', fontFamily: 'var(--font-sans)', boxSizing: 'border-box' }}
                />
              </div>
              {!meetingNotes && (
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center', padding: '8px 0' }}>
                  Paste meeting notes here. They'll be included when generating AI summaries and personalized insights.
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button size="sm" onClick={onClose}>Close</Button>
            <Button variant="primary" size="sm" onClick={() => saveAll({}, true)}>Save</Button>
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

    </div>
  )
}