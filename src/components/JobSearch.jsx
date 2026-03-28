// components/JobSearch.jsx
import React, { useState } from 'react'
import { generateJobRecs } from '../lib/ai'

const MS = {
  Strong: { bg: 'rgba(74,222,128,0.1)', color: '#4ade80', border: 'rgba(74,222,128,0.2)' },
  Good:   { bg: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: 'rgba(251,191,36,0.2)' },
  Reach:  { bg: 'rgba(248,113,113,0.1)', color: '#f87171', border: 'rgba(248,113,113,0.2)' },
}

export function JobSearch({ profile, resume, skills }) {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [generated, setGenerated] = useState(false)

  async function handleGenerate() {
    setLoading(true); setError('')
    try {
      const raw = await generateJobRecs(profile, resume, skills)
      const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
      setJobs(Array.isArray(parsed) ? parsed : [])
      setGenerated(true)
    } catch { setError('Could not generate. Try again.') }
    setLoading(false)
  }

  // Auto-generate on first mount
  React.useEffect(() => {
    if (!generated && !loading && jobs.length === 0) {
      handleGenerate()
    }
  }, [])

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
      <div style={{ fontSize: 28, marginBottom: 12, animation: 'pulse-glow 1.5s ease infinite' }}>✦</div>
      <div style={{ fontSize: 14 }}>Finding your best opportunities...</div>
    </div>
  )

  if (error) return (
    <div style={{ textAlign: 'center', padding: '3rem' }}>
      <div style={{ fontSize: 28, marginBottom: 12, opacity: 0.4 }}>⚠️</div>
      <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>{error}</div>
      <button onClick={handleGenerate} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-display)' }}>
        Try Again ↺
      </button>
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{jobs.length} matches</div>
        <button onClick={handleGenerate} style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>Regenerate ↺</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {jobs.map((job, i) => {
          const ms = MS[job.match] || MS.Good
          return (
            <div key={i} className="fade-in" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.1rem 1.25rem', transition: 'border-color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, fontFamily: 'var(--font-display)' }}>{job.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{job.company} · {job.location}</div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 12 }}>
                  <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 100, background: 'var(--surface-3)', color: 'var(--text-tertiary)', border: '1px solid var(--border)' }}>{job.type}</span>
                  <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 100, background: ms.bg, color: ms.color, border: `1px solid ${ms.border}`, fontWeight: 600 }}>{job.match}</span>
                </div>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: 6 }}>{job.description}</div>
              {job.whyMatch && <div style={{ fontSize: 12, color: 'var(--accent)', marginBottom: 10, opacity: 0.85 }}>✦ {job.whyMatch}</div>}
              <a href={job.searchUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--text-tertiary)', textDecoration: 'none', borderBottom: '1px solid var(--border)', paddingBottom: 1 }}
                onMouseEnter={e => e.target.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.target.style.color = 'var(--text-tertiary)'}
              >Search on LinkedIn ↗</a>
            </div>
          )
        })}
      </div>
    </div>
  )
}
