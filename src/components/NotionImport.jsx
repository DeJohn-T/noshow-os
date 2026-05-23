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
- If you can't find a real person (e.g. it's just generic text), return []
- Do not include yourself/the narrator as a contact`

export default function NotionImport({ onImport, onClose, apiKey, endpoint }) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(null)

  const extract = async () => {
    if (!text.trim()) { setError('Paste some notes first.'); return }
    if (!apiKey) { setError('No API key set. Add one in Settings.'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-api-key': apiKey },
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
    } catch (e) {
      setError(`Failed: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  const confirm = () => {
    const now = Date.now()
    const contacts = preview.map((c, i) => ({
      id: now + i,
      name: c.name || 'Unknown',
      role: c.role || '',
      company: c.company || '',
      notes: c.notes || '',
      status: 'new',
      chatDate: '',
      linkedinUrl: '',
      parsedProfile: null,
      brief: '',
      followUpText: '',
      pdfName: '',
      meetingType: c.meetingType || 'coffee chat',
    }))
    onImport(contacts)
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 300 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: '100%', maxWidth: 600, background: 'var(--surface-1)', borderRadius: '20px 20px 0 0', padding: '1.5rem 1.5rem 2.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-display)' }}>Import from Notion</div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>Paste your notes — Claude extracts the people automatically</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: 22, lineHeight: 1 }}>✕</button>
        </div>

        {!preview ? (
          <>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Paste your Notion notes here — meeting notes, background on people, AI summaries from calls, anything..."
              rows={10}
              style={{ width: '100%', background: 'var(--surface-3)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)', borderRadius: 12, padding: '12px 14px', fontSize: 13, resize: 'vertical', outline: 'none', fontFamily: 'var(--font-sans)', lineHeight: 1.6, boxSizing: 'border-box', marginBottom: 12 }}
            />
            {error && <div style={{ fontSize: 12, color: '#f87171', marginBottom: 12, padding: '8px 12px', background: 'rgba(239,68,68,0.08)', borderRadius: 8 }}>{error}</div>}
            <button
              onClick={extract} disabled={loading}
              style={{ width: '100%', background: loading ? 'var(--accent-dim)' : 'var(--accent)', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 700, cursor: loading ? 'default' : 'pointer', fontFamily: 'var(--font-display)', opacity: loading ? 0.8 : 1 }}>
              {loading ? 'Extracting contacts...' : 'Extract Contacts'}
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
              Found <strong style={{ color: 'var(--text-primary)' }}>{preview.length} contact{preview.length !== 1 ? 's' : ''}</strong>. Review before adding:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16, maxHeight: '45vh', overflowY: 'auto' }}>
              {preview.map((c, i) => (
                <div key={i} style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px' }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 2 }}>{c.name}</div>
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
      </div>
    </div>
  )
}
