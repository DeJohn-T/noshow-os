import React, { useState } from 'react'

const PROMPT = `You are extracting contact information from networking notes.
From the text below, identify every distinct person mentioned. For each person return a JSON object.
Return ONLY a valid JSON array, no other text:
[
  {
    "name": "Full Name",
    "role": "Job title or role (empty string if unknown)",
    "company": "Company or organization (empty string if unknown)",
    "notes": "A concise summary of everything relevant — background, what was discussed, any context",
    "meetingType": "coffee chat"
  }
]
Rules:
- Combine all mentions of the same person into one entry
- notes should capture the most useful info for a future coffee chat
- If you truly cannot identify the person's name, use their most distinguishing characteristic as a name placeholder
- Do not include yourself/the narrator as a contact
- Do not return "Unknown" as a name — use something descriptive if the name is not clear`

export default function NotionImport({ onImport, onClose, endpoint }) {
  const [tab, setTab] = useState('paste')
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(null)

  // Manual tab state
  const [manualName, setManualName] = useState('')
  const [manualRole, setManualRole] = useState('')
  const [manualCompany, setManualCompany] = useState('')
  const [manualNotes, setManualNotes] = useState('')

  // Editable names in preview
  const [editedNames, setEditedNames] = useState({})

  const extract = async () => {
    if (!text.trim()) { setError('Paste some notes first.'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2048,
          messages: [{ role: 'user', content: `${PROMPT}\n\nNotes:\n${text}` }],
        }),
      })
      if (!res.ok) throw new Error(`API error ${res.status}`)
      const data = await res.json()
      const raw = data.content[0].text.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
      const contacts = JSON.parse(raw)
      if (!Array.isArray(contacts) || contacts.length === 0) {
        setError('No contacts found in those notes. Try pasting more specific content.')
        return
      }
      setPreview(contacts)
      setEditedNames({})
    } catch (e) {
      setError(`Failed: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  const addManual = () => {
    if (!manualName.trim()) { return }
    onImport([{
      id: Date.now(),
      name: manualName.trim(),
      role: manualRole.trim(),
      company: manualCompany.trim(),
      notes: manualNotes.trim(),
      status: 'new',
      chatDate: '', linkedinUrl: '', parsedProfile: null,
      brief: '', followUpText: '', pdfName: '', meetingType: 'coffee chat',
    }])
    onClose()
  }

  const confirm = () => {
    const now = Date.now()
    const contacts = preview.map((c, i) => ({
      id: now + i,
      name: (editedNames[i] ?? c.name) || 'New Contact',
      role: c.role || '',
      company: c.company || '',
      notes: c.notes || '',
      status: 'new',
      chatDate: '', linkedinUrl: '', parsedProfile: null,
      brief: '', followUpText: '', pdfName: '',
      meetingType: c.meetingType || 'coffee chat',
    }))
    onImport(contacts)
    onClose()
  }

  const tabStyle = (t) => ({
    flex: 1, padding: '8px 0', borderRadius: 7, border: 'none',
    background: tab === t ? 'var(--surface2, #1e1e24)' : 'transparent',
    color: tab === t ? 'var(--text-primary)' : 'var(--text-tertiary)',
    fontWeight: tab === t ? 600 : 400, fontSize: 13, cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
  })

  const inputStyle = {
    width: '100%', background: 'var(--surface-3)', color: 'var(--text-primary)',
    border: '1px solid var(--border-strong)', borderRadius: 10, padding: '10px 13px',
    fontSize: 14, outline: 'none', fontFamily: 'var(--font-sans)', boxSizing: 'border-box',
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 300 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: '100%', maxWidth: 600, background: 'var(--surface-1)', borderRadius: '20px 20px 0 0', padding: '1.5rem 1.5rem 2.5rem', maxHeight: '90vh', overflowY: 'auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-display)' }}>Import Contact</div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>Paste notes or add manually</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: 22, lineHeight: 1 }}>✕</button>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--surface-3)', borderRadius: 10, padding: 4 }}>
          <button style={tabStyle('paste')} onClick={() => setTab('paste')}>📝 Paste Notes</button>
          <button style={tabStyle('manual')} onClick={() => setTab('manual')}>+ Quick Add</button>
        </div>

        {/* ── PASTE NOTES TAB ── */}
        {tab === 'paste' && !preview && (
          <>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Paste your Notion notes here — meeting notes, background on people, AI summaries from calls, anything..."
              rows={10}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6, marginBottom: 12, borderRadius: 12, padding: '12px 14px', fontSize: 13 }}
            />
            {error && <div style={{ fontSize: 12, color: '#f87171', marginBottom: 12, padding: '8px 12px', background: 'rgba(239,68,68,0.08)', borderRadius: 8 }}>{error}</div>}
            <button onClick={extract} disabled={loading} style={{ width: '100%', background: loading ? 'var(--accent-dim)' : 'var(--accent)', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 700, cursor: loading ? 'default' : 'pointer', fontFamily: 'var(--font-display)', opacity: loading ? 0.8 : 1 }}>
              {loading ? 'Extracting contacts...' : 'Extract Contacts'}
            </button>
          </>
        )}

        {/* ── PREVIEW ── */}
        {tab === 'paste' && preview && (
          <>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
              Found <strong style={{ color: 'var(--text-primary)' }}>{preview.length} contact{preview.length !== 1 ? 's' : ''}</strong>. Edit names if needed, then confirm.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16, maxHeight: '45vh', overflowY: 'auto' }}>
              {preview.map((c, i) => (
                <div key={i} style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px' }}>
                  <input
                    value={editedNames[i] ?? c.name}
                    onChange={e => setEditedNames(prev => ({ ...prev, [i]: e.target.value }))}
                    placeholder="Name"
                    style={{ ...inputStyle, fontSize: 14, fontWeight: 700, marginBottom: 4, padding: '6px 10px', borderRadius: 7 }}
                  />
                  {(c.role || c.company) && (
                    <div style={{ fontSize: 12, color: 'var(--accent)', marginBottom: 6 }}>
                      {[c.role, c.company].filter(Boolean).join(' · ')}
                    </div>
                  )}
                  {c.notes && <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{c.notes}</div>}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setPreview(null)} style={{ flex: 1, background: 'var(--surface-3)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                Back
              </button>
              <button onClick={confirm} style={{ flex: 2, background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-display)' }}>
                Add {preview.length} Contact{preview.length !== 1 ? 's' : ''} →
              </button>
            </div>
          </>
        )}

        {/* ── QUICK ADD TAB ── */}
        {tab === 'manual' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>Name *</div>
              <input value={manualName} onChange={e => setManualName(e.target.value)} placeholder="Full name" style={inputStyle} autoFocus />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <label>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>Role</div>
                <input value={manualRole} onChange={e => setManualRole(e.target.value)} placeholder="e.g. Software Engineer" style={inputStyle} />
              </label>
              <label>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>Company</div>
                <input value={manualCompany} onChange={e => setManualCompany(e.target.value)} placeholder="e.g. Google" style={inputStyle} />
              </label>
            </div>
            <label>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>Notes</div>
              <textarea value={manualNotes} onChange={e => setManualNotes(e.target.value)} placeholder="How you met, what you talked about, anything relevant..." rows={4}
                style={{ ...inputStyle, resize: 'none', lineHeight: 1.6 }} />
            </label>
            <button onClick={addManual} disabled={!manualName.trim()} style={{ width: '100%', background: manualName.trim() ? 'var(--accent)' : 'var(--surface-3)', color: manualName.trim() ? '#fff' : 'var(--text-tertiary)', border: 'none', borderRadius: 12, padding: '13px', fontSize: 15, fontWeight: 700, cursor: manualName.trim() ? 'pointer' : 'default', fontFamily: 'var(--font-display)', marginTop: 4 }}>
              Add Contact →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
