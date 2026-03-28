// components/UI.jsx — shared reusable components

import React from 'react'
import { initials, statusColor } from '../lib/utils'

// --- Avatar ---
const AVATAR_GRADIENTS = [
  ['#8b7fff', '#6366f1'],
  ['#f472b6', '#ec4899'],
  ['#4ade80', '#22c55e'],
  ['#fbbf24', '#f59e0b'],
  ['#38bdf8', '#0ea5e9'],
  ['#fb923c', '#f97316'],
  ['#a78bfa', '#7c3aed'],
  ['#34d399', '#10b981'],
]

const AVATAR_ICONS = ['☕', '✦', '◆', '●', '▲', '★', '◉', '⬟']

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
  const icon = AVATAR_ICONS[hash % AVATAR_ICONS.length]
  const iconSize = size < 40 ? 14 : 18

  // Try Clearbit first, then Google favicon
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
        {/* Blurred logo background */}
        <img
          src={src}
          alt=""
          style={{ position: 'absolute', inset: -4, width: 'calc(100% + 8px)', height: 'calc(100% + 8px)', objectFit: 'cover', filter: 'blur(4px) saturate(1.8)', opacity: logoState === 'loaded' ? 0.45 : 0, transition: 'opacity 0.2s' }}
        />
        {/* Dark overlay for contrast */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,25,35,0.35)', borderRadius: '50%' }} />
        {/* Crisp logo on top */}
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
          <span style={{ position: 'absolute', fontSize: iconSize, color: '#fff', zIndex: 1 }}>{icon}</span>
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
      {icon}
    </div>
  )
}

// --- Status Badge ---
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
      background: 'var(--surface)',
      color: 'var(--text-primary)',
      borderColor: 'var(--border-strong)',
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
      background: 'transparent',
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
    <span style={{
      display: 'inline-block',
      width: 13,
      height: 13,
      border: '2px solid var(--border-strong)',
      borderTopColor: 'var(--accent)',
      borderRadius: '50%',
      animation: 'spin 0.65s linear infinite',
      verticalAlign: 'middle',
      marginRight: 6,
    }} />
  )
}

// --- Tabs ---
export function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '1.25rem' }}>
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
          }}
        >
          {t}
        </button>
      ))}
    </div>
  )
}

// --- Colored Chip — pass a "kind" to get section-specific color ---
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
      background: 'linear-gradient(135deg, rgba(139,127,255,0.06), rgba(99,179,255,0.04))',
      border: '1px solid rgba(139,127,255,0.2)',
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

// --- Keyframe injection ---
export function GlobalStyles() {
  return (
    <style>{`
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      .fade-in { animation: fadeIn 0.2s ease forwards; }
      input:focus, textarea:focus, select:focus {
        border-color: var(--accent-glow) !important;
        box-shadow: 0 0 0 3px rgba(139,127,255,0.1);
      }
      button:active:not(:disabled) { transform: scale(0.98); }
    `}</style>
  )
}