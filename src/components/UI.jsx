// components/UI.jsx - shared reusable components

import React from 'react'
import { Building2, Highlighter, Loader2, X } from 'lucide-react'
import { initials, statusColor } from '../lib/utils'

// --- Avatar ---
const AVATAR_GRADIENTS = [
  ['#8fe3ff', '#3ba7c8'],
  ['#c5ff5a', '#7ea832'],
  ['#ff7aa8', '#b9476d'],
  ['#f0ba4d', '#9f7322'],
  ['#a6b4ff', '#6675c8'],
  ['#80e29b', '#359b58'],
]

function getDomain(company) {
  if (!company) return null
  const clean = company.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()
  if (!clean) return null
  return clean.split(/\s+/).join('') + '.com'
}

export function Avatar({ name, company, size = 38 }) {
  const [logoState, setLogoState] = React.useState('loading') // loading | loaded | failed
  const domain = getDomain(company)
  const hash = (name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const gradient = AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length]
  const fallback = initials(name) || 'NS'
  const iconSize = size < 40 ? 11 : 14

  const clearbitUrl = domain ? `https://logo.clearbit.com/${domain}` : null
  const googleUrl = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : null
  const [src, setSrc] = React.useState(clearbitUrl)

  React.useEffect(() => {
    setSrc(clearbitUrl)
    setLogoState(clearbitUrl ? 'loading' : 'failed')
  }, [company])

  const showLogo = domain && logoState !== 'failed'

  if (showLogo) {
    return (
      <div style={{
        width: size,
        height: size,
        borderRadius: '50%',
        position: 'relative',
        border: `1px solid ${gradient[0]}44`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        overflow: 'hidden',
      }}>
        <img
          src={src}
          alt=""
          style={{ position: 'absolute', inset: -4, width: 'calc(100% + 8px)', height: 'calc(100% + 8px)', objectFit: 'cover', filter: 'blur(4px) saturate(1.8)', opacity: logoState === 'loaded' ? 0.45 : 0, transition: 'opacity 0.2s' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,25,35,0.35)', borderRadius: '50%' }} />
        <img
          src={src}
          alt={company}
          onLoad={() => setLogoState('loaded')}
          onError={() => {
            if (src === clearbitUrl && googleUrl) {
              setSrc(googleUrl)
            } else {
              setLogoState('failed')
            }
          }}
          style={{ position: 'relative', zIndex: 1, width: size * 0.6, height: size * 0.6, objectFit: 'contain', opacity: logoState === 'loaded' ? 1 : 0, transition: 'opacity 0.2s' }}
        />
        {logoState === 'loading' && (
          <span style={{ position: 'absolute', fontSize: iconSize, color: '#fff', zIndex: 1, fontWeight: 800, letterSpacing: '0.02em' }}>{fallback}</span>
        )}
      </div>
    )
  }

  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
      border: 'none',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 600,
      fontSize: iconSize,
      flexShrink: 0,
      boxShadow: `0 2px 8px ${gradient[0]}44`,
    }}>
      {fallback}
    </div>
  )
}

// --- Status Badge ---
export function CompanyLogo({ company, size = 18 }) {
  const domain = getDomain(company)
  const clearbitUrl = domain ? `https://logo.clearbit.com/${domain}` : null
  const googleUrl = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` : null
  const [src, setSrc] = React.useState(clearbitUrl)
  const [failed, setFailed] = React.useState(false)

  React.useEffect(() => { setSrc(clearbitUrl); setFailed(false) }, [company])

  if (failed || !domain) {
    return <Building2 size={size} strokeWidth={1.8} style={{ flexShrink: 0, opacity: 0.42 }} aria-hidden="true" />
  }
  return (
    <img
      src={src}
      alt={company}
      onError={() => {
        if (src === clearbitUrl && googleUrl) { setSrc(googleUrl) }
        else { setFailed(true) }
      }}
      style={{ width: size, height: size, borderRadius: 3, objectFit: 'contain', flexShrink: 0, background: '#fff', padding: 1, border: '1px solid rgba(255,255,255,0.1)' }}
    />
  )
}

export function StatusBadge({ status }) {
  const { bg, color } = statusColor(status)
  return (
    <span style={{
      background: bg,
      color,
      fontSize: 11,
      fontWeight: 500,
      padding: '3px 9px',
      borderRadius: 'var(--radius-full)',
      letterSpacing: '0.01em',
      whiteSpace: 'nowrap',
    }}>
      {status}
    </span>
  )
}

// --- Button ---
export function Button({ children, onClick, disabled, variant = 'default', size = 'md', style = {} }) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontFamily: 'var(--font-sans)',
    fontWeight: 500,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'all 0.15s',
    border: '1px solid transparent',
    borderRadius: 'var(--radius-md)',
    whiteSpace: 'nowrap',
  }
  const sizes = {
    sm: { fontSize: 12, padding: '5px 12px' },
    md: { fontSize: 13, padding: '7px 16px' },
    lg: { fontSize: 14, padding: '9px 20px' },
  }
  const variants = {
    default: {
      background: 'rgba(244,247,249,0.04)',
      color: 'var(--text-primary)',
      borderColor: 'var(--border)',
    },
    primary: {
      background: 'var(--accent)',
      color: 'var(--accent-fg)',
      borderColor: 'transparent',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-secondary)',
      borderColor: 'transparent',
    },
    danger: {
      background: 'var(--red-dim)',
      color: 'var(--red-text)',
      borderColor: 'var(--red-border)',
    },
  }

  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
    >
      {children}
    </button>
  )
}

// --- Input ---
export function Input({ label, value, onChange, placeholder, type = 'text', style = {} }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 5 }}>{label}</label>}
      <input
        type={type}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          background: 'var(--surface)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius-md)',
          padding: '8px 12px',
          fontSize: 14,
          outline: 'none',
          transition: 'border-color 0.15s',
          fontFamily: 'var(--font-sans)',
          ...style,
        }}
      />
    </div>
  )
}

// --- Textarea ---
export function Textarea({ label, value, onChange, placeholder, minHeight = 80 }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 5 }}>{label}</label>}
      <textarea
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          minHeight,
          background: 'var(--surface)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius-md)',
          padding: '8px 12px',
          fontSize: 14,
          resize: 'vertical',
          outline: 'none',
          fontFamily: 'var(--font-sans)',
          lineHeight: 1.6,
        }}
      />
    </div>
  )
}

// --- Rich Text Notes Editor ---
const TEXT_COLORS = ['#fff', '#f87171', '#fb923c', '#fbbf24', '#4ade80', '#38bdf8', '#a78bfa', '#f472b6']
const HIGHLIGHT_COLORS = ['transparent', 'rgba(251,191,36,0.35)', 'rgba(74,222,128,0.3)', 'rgba(56,189,248,0.3)', 'rgba(167,139,250,0.35)', 'rgba(248,113,113,0.3)']

export function RichNotes({ value, onChange, placeholder, minHeight = 120 }) {
  const ref = React.useRef(null)
  const [showColors, setShowColors] = React.useState(false)
  const [showHighlights, setShowHighlights] = React.useState(false)
  const savedRange = React.useRef(null)

  React.useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || ''
    }
  }, [])

  function saveRange() {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) savedRange.current = sel.getRangeAt(0).cloneRange()
  }

  function restoreRange() {
    if (!savedRange.current) return
    const sel = window.getSelection()
    sel.removeAllRanges()
    sel.addRange(savedRange.current)
  }

  function exec(cmd, val = null) {
    restoreRange()
    document.execCommand(cmd, false, val)
    ref.current?.focus()
    onChange(ref.current?.innerHTML || '')
  }

  function handleColor(color) {
    exec('foreColor', color)
    setShowColors(false)
  }

  function handleHighlight(color) {
    if (color === 'transparent') exec('hiliteColor', 'transparent')
    else exec('hiliteColor', color)
    setShowHighlights(false)
  }

  const btnStyle = (active) => ({
    background: active ? 'var(--accent)' : 'var(--surface-3)',
    color: active ? '#fff' : 'var(--text-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    padding: '3px 8px',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    lineHeight: 1.4,
  })

  return (
    <div style={{ marginBottom: 14 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 5, marginBottom: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <button style={btnStyle()} onMouseDown={e => { e.preventDefault(); saveRange(); exec('bold') }} title="Bold"><b>B</b></button>
        <button style={{ ...btnStyle(), fontStyle: 'italic' }} onMouseDown={e => { e.preventDefault(); saveRange(); exec('italic') }} title="Italic"><i>I</i></button>
        <button style={{ ...btnStyle(), textDecoration: 'underline' }} onMouseDown={e => { e.preventDefault(); saveRange(); exec('underline') }} title="Underline"><u>U</u></button>
        <button style={{ ...btnStyle(), textDecoration: 'line-through' }} onMouseDown={e => { e.preventDefault(); saveRange(); exec('strikeThrough') }} title="Strikethrough">S</button>

        <div style={{ width: 1, height: 18, background: 'var(--border)', margin: '0 2px' }} />

        {/* Text color */}
        <div style={{ position: 'relative' }}>
          <button style={{ ...btnStyle(), display: 'flex', alignItems: 'center', gap: 4 }}
            onMouseDown={e => { e.preventDefault(); saveRange(); setShowColors(v => !v); setShowHighlights(false) }}
            title="Text color">
            A <div style={{ width: 8, height: 3, background: 'var(--accent)', borderRadius: 2 }} />
          </button>
          {showColors && (
            <div style={{ position: 'absolute', top: '110%', left: 0, background: 'var(--surface-2)', border: '1px solid var(--border-strong)', borderRadius: 10, padding: 8, display: 'flex', gap: 5, zIndex: 50, boxShadow: 'var(--shadow-lg)' }}>
              {TEXT_COLORS.map(c => (
                <button key={c} onMouseDown={e => { e.preventDefault(); handleColor(c) }}
                  style={{ width: 18, height: 18, borderRadius: '50%', background: c, border: c === '#fff' ? '1px solid var(--border-strong)' : 'none', cursor: 'pointer', padding: 0 }} />
              ))}
            </div>
          )}
        </div>

        {/* Highlight */}
        <div style={{ position: 'relative' }}>
          <button style={{ ...btnStyle(), display: 'flex', alignItems: 'center', gap: 4 }}
            onMouseDown={e => { e.preventDefault(); saveRange(); setShowHighlights(v => !v); setShowColors(false) }}
            title="Highlight">
            <Highlighter size={13} strokeWidth={1.9} aria-hidden="true" />
          </button>
          {showHighlights && (
            <div style={{ position: 'absolute', top: '110%', left: 0, background: 'var(--surface-2)', border: '1px solid var(--border-strong)', borderRadius: 10, padding: 8, display: 'flex', gap: 5, zIndex: 50, boxShadow: 'var(--shadow-lg)' }}>
              {HIGHLIGHT_COLORS.map((c, i) => (
                <button key={i} onMouseDown={e => { e.preventDefault(); handleHighlight(c) }}
                  style={{ width: 18, height: 18, borderRadius: 4, background: c === 'transparent' ? 'var(--surface-3)' : c, border: '1px solid var(--border-strong)', cursor: 'pointer', padding: 0, fontSize: 10, color: 'var(--text-tertiary)' }}>
                  {c === 'transparent' ? <X size={10} aria-hidden="true" /> : ''}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ width: 1, height: 18, background: 'var(--border)', margin: '0 2px' }} />
        <button style={btnStyle()} onMouseDown={e => { e.preventDefault(); saveRange(); exec('insertUnorderedList') }} title="Bullet list">• list</button>
      </div>

      {/* Editor */}
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={() => onChange(ref.current?.innerHTML || '')}
        onMouseUp={saveRange}
        onKeyUp={saveRange}
        data-placeholder={placeholder}
        style={{
          minHeight,
          background: 'rgba(255,255,255,0.04)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 14px',
          fontSize: 14,
          outline: 'none',
          fontFamily: 'var(--font-sans)',
          lineHeight: 1.7,
          cursor: 'text',
          wordBreak: 'break-word',
        }}
      />
      <style>{`
        [contenteditable]:empty:before { content: attr(data-placeholder); color: var(--text-tertiary); pointer-events: none; }
      `}</style>
    </div>
  )
}

// --- Notice ---
export function Notice({ children, variant = 'muted', style = {} }) {
  const styles = {
    muted: { background: 'var(--gray-bg)', color: 'var(--text-secondary)', border: '1px solid var(--border)' },
    blue: { background: 'var(--blue-bg)', color: 'var(--blue-text)', border: '1px solid var(--blue-border)' },
    green: { background: 'var(--green-bg)', color: 'var(--green-text)', border: '1px solid var(--green-border)' },
  }
  return (
    <div style={{ borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: 13, lineHeight: 1.6, marginBottom: 14, ...styles[variant], ...style }}>
      {children}
    </div>
  )
}

// --- Spinner ---
export function Spinner() {
  return (
    <Loader2 size={14} className="spinner-icon" style={{ marginRight: 6, verticalAlign: 'middle' }} aria-hidden="true" />
  )
}

// --- Tabs ---
export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="tab-bar-scroll" style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '1.25rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
      {tabs.map(t => (
        <button
          key={t}
          onClick={() => onChange(t)}
          style={{
            fontSize: 12,
            fontWeight: 500,
            padding: '8px 14px',
            background: 'transparent',
            border: 'none',
            borderBottom: active === t ? '2px solid var(--accent)' : '2px solid transparent',
            color: active === t ? 'var(--accent)' : 'var(--text-secondary)',
            cursor: 'pointer',
            marginBottom: -1,
            transition: 'color 0.15s',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {t}
        </button>
      ))}
    </div>
  )
}

// --- Colored Chip: pass a "kind" to get section-specific color ---
export function Chip({ children, kind = 'default' }) {
  const kindStyles = {
    experience: { background: 'var(--chip-experience-bg)', color: 'var(--chip-experience-color)', border: '1px solid var(--chip-experience-border)' },
    education:  { background: 'var(--chip-education-bg)',  color: 'var(--chip-education-color)',  border: '1px solid var(--chip-education-border)' },
    org:        { background: 'var(--chip-org-bg)',         color: 'var(--chip-org-color)',         border: '1px solid var(--chip-org-border)' },
    skill:      { background: 'var(--chip-skill-bg)',       color: 'var(--chip-skill-color)',       border: '1px solid var(--chip-skill-border)' },
    interest:   { background: 'var(--chip-interest-bg)',   color: 'var(--chip-interest-color)',   border: '1px solid var(--chip-interest-border)' },
    honor:      { background: 'var(--chip-honor-bg)',       color: 'var(--chip-honor-color)',       border: '1px solid var(--chip-honor-border)' },
    location:   { background: 'var(--chip-location-bg)',   color: 'var(--chip-location-color)',   border: '1px solid var(--chip-location-border)' },
    default:    { background: 'var(--surface-alt)',          color: 'var(--text-secondary)',          border: '1px solid var(--border)' },
  }
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      fontSize: 12,
      padding: '5px 12px',
      borderRadius: 'var(--radius-full)',
      margin: '3px 4px',
      fontWeight: 500,
      letterSpacing: '0.01em',
      lineHeight: 1.4,
      wordBreak: 'break-word',
      overflow: 'hidden',
      maxWidth: '100%',
      boxSizing: 'border-box',
      ...kindStyles[kind] || kindStyles.default,
    }}>
      {children}
    </span>
  )
}

// --- Section label ---
export function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
      {children}
    </div>
  )
}

// --- AI output box ---
export function AIOutput({ children }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(143,227,255,0.07), rgba(197,255,90,0.04))',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.1rem 1.25rem',
      fontSize: 13,
      lineHeight: 1.85,
      color: 'var(--text-primary)',
      whiteSpace: 'pre-wrap',
      marginTop: 14,
    }}>
      {children}
    </div>
  )
}

export function IconButton({ label, icon: Icon, onClick, disabled = false, style = {} }) {
  return (
    <button className="icon-btn" aria-label={label} title={label} onClick={disabled ? undefined : onClick} disabled={disabled} style={style}>
      <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
    </button>
  )
}

export function EmptyState({ icon: Icon, title, body, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '2.25rem 1rem', color: 'var(--text-tertiary)' }}>
      {Icon && <Icon size={28} strokeWidth={1.6} style={{ marginBottom: 12, opacity: 0.68 }} aria-hidden="true" />}
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>{title}</div>
      {body && <div style={{ fontSize: 13, lineHeight: 1.6, maxWidth: 320, margin: '0 auto 14px' }}>{body}</div>}
      {action}
    </div>
  )
}

// --- Keyframe injection ---
export function GlobalStyles() {
  return (
    <style>{`
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      .fade-in { animation: fadeIn 0.2s ease forwards; }
      input:focus, textarea:focus, select:focus {
        border-color: var(--accent-glow) !important;
        box-shadow: 0 0 0 3px rgba(197,255,90,0.1);
      }
      button:active:not(:disabled) { transform: scale(0.98); }
    `}</style>
  )
}
