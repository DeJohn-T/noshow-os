import React from 'react'
import {
  BriefcaseBusiness,
  CalendarDays,
  Contact,
  FileText,
  Home,
  Network,
  Plus,
  Settings,
} from 'lucide-react'
import { Button, IconButton, StatusBadge } from './UI'
import { formatDate } from '../lib/utils'

const NAV_ITEMS = [
  { key: 'home', label: 'Home', icon: Home },
  { key: 'contacts', label: 'Contacts', icon: Contact },
  { key: 'upcoming', label: 'Calendar', icon: CalendarDays },
  { key: 'network', label: 'Network', icon: Network },
  { key: 'resume', label: 'Resume', icon: FileText },
  { key: 'jobs', label: 'Jobs', icon: BriefcaseBusiness },
]

export function AppShell({ activeTab, onTabChange, onAddContact, onEditProfile, profile, children }) {
  return (
    <div className="app-shell">
      <LeftRail activeTab={activeTab} onTabChange={onTabChange} onAddContact={onAddContact} onEditProfile={onEditProfile} profile={profile} />
      <MobileTopBar activeTab={activeTab} onTabChange={onTabChange} onAddContact={onAddContact} onEditProfile={onEditProfile} profile={profile} />
      <main className="app-main">{children}</main>
    </div>
  )
}

export function LeftRail({ activeTab, onTabChange, onAddContact, onEditProfile, profile }) {
  return (
    <aside className="left-rail" aria-label="Primary navigation">
      <button onClick={() => onTabChange('home')} aria-label="NoShow OS home" style={{ width: 42, height: 42, borderRadius: 8, border: '1px solid var(--border-strong)', background: 'var(--surface-paper)', color: 'var(--text-ink)', fontWeight: 900, cursor: 'pointer' }}>
        NS
      </button>
      <IconButton label="Add contact" icon={Plus} onClick={onAddContact} style={{ background: 'var(--accent)', color: 'var(--accent-fg)', borderColor: 'transparent' }} />
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', alignItems: 'center' }}>
        {NAV_ITEMS.map(item => {
          const Icon = item.icon
          const active = activeTab === item.key
          return (
            <button
              key={item.key}
              onClick={() => onTabChange(item.key)}
              aria-label={item.label}
              title={item.label}
              style={{ width: 42, height: 42, borderRadius: 8, border: `1px solid ${active ? 'var(--accent-glow)' : 'var(--border)'}`, background: active ? 'var(--accent-dim)' : 'rgba(244,247,249,0.04)', color: active ? 'var(--accent)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
            </button>
          )
        })}
      </nav>
      <button onClick={onEditProfile} aria-label="Edit profile" title={profile?.name ? `${profile.name} profile` : 'Edit profile'} style={{ marginTop: 'auto', width: 42, height: 42, borderRadius: 8, border: '1px solid var(--border)', background: 'rgba(244,247,249,0.04)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
        <Settings size={18} strokeWidth={1.8} aria-hidden="true" />
      </button>
    </aside>
  )
}

export function MobileTopBar({ activeTab, onTabChange, onAddContact, onEditProfile, profile }) {
  return (
    <header className="mobile-top-bar">
      <button onClick={() => onTabChange('home')} style={{ border: 'none', background: 'transparent', color: 'var(--text-primary)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, lineHeight: 0.95, cursor: 'pointer' }}>
        NoShow OS
      </button>
      <select value={activeTab} onChange={e => onTabChange(e.target.value)} aria-label="Current view" style={{ minWidth: 112, background: 'var(--surface)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px', fontFamily: 'var(--font-sans)' }}>
        {NAV_ITEMS.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}
      </select>
      <div style={{ display: 'flex', gap: 6 }}>
        <IconButton label="Add contact" icon={Plus} onClick={onAddContact} />
        <IconButton label={profile?.name ? `${profile.name} profile` : 'Edit profile'} icon={Settings} onClick={onEditProfile} />
      </div>
    </header>
  )
}

export function OrbitPanel({ title, icon: Icon, accent = 'var(--cyan)', action, children }) {
  return (
    <section className="dossier-panel" style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {Icon && <Icon size={15} color={accent} strokeWidth={1.9} aria-hidden="true" />}
          <div className="section-kicker" style={{ color: accent }}>{title}</div>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

export function MetricTile({ label, value, icon: Icon, accent = 'var(--accent)', onClick }) {
  return (
    <button onClick={onClick} style={{ textAlign: 'left', background: 'rgba(244,247,249,0.04)', border: '1px solid var(--border)', borderRadius: 12, padding: 14, color: 'var(--text-primary)', cursor: onClick ? 'pointer' : 'default', minHeight: 92 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span className="section-kicker">{label}</span>
        {Icon && <Icon size={17} color={accent} strokeWidth={1.8} aria-hidden="true" />}
      </div>
      <div style={{ fontSize: 30, lineHeight: 1, fontWeight: 800, fontFamily: 'var(--font-display)', color: accent }}>{value}</div>
    </button>
  )
}

export function RightOrbit({ children }) {
  return <aside style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</aside>
}

export function TodayDesk({ contact, stats, onOpenContact }) {
  if (!contact) {
    return (
      <section className="dossier-panel" style={{ padding: 24 }}>
        <div className="section-kicker" style={{ color: 'var(--accent)', marginBottom: 12 }}>Today desk</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 5vw, 58px)', lineHeight: 0.95, letterSpacing: 0, marginBottom: 14 }}>Build the next conversation</h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 620, lineHeight: 1.7 }}>Add a contact, schedule a chat, or open a recent connection to prepare the next useful conversation.</p>
      </section>
    )
  }

  return (
    <section className="dossier-panel" style={{ overflow: 'hidden' }}>
      <div style={{ padding: 24, borderBottom: '1px solid var(--border)' }}>
        <div className="section-kicker" style={{ color: 'var(--accent)', marginBottom: 12 }}>Today desk</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(34px, 5vw, 62px)', lineHeight: 0.94, letterSpacing: 0, marginBottom: 14 }}>Prep for {contact.name}</h1>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', color: 'var(--text-secondary)', fontSize: 13 }}>
          <span>{[contact.role, contact.company].filter(Boolean).join(' at ') || 'No role set'}</span>
          {contact.chatDate && <span>{formatDate(contact.chatDate)}{contact.chatTime ? ` at ${contact.chatTime}` : ''}</span>}
          <StatusBadge status={contact.status} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(105px, 1fr))', gap: 1, background: 'transparent' }}>
        <div style={{ background: 'var(--surface)', padding: 16 }}>
          <div className="section-kicker" style={{ marginBottom: 8 }}>Brief</div>
          <div style={{ color: contact.brief ? 'var(--green-text)' : 'var(--text-secondary)', fontWeight: 700 }}>{contact.brief ? 'Generated' : 'Not generated'}</div>
        </div>
        <div style={{ background: 'var(--surface)', padding: 16 }}>
          <div className="section-kicker" style={{ marginBottom: 8 }}>LinkedIn PDF</div>
          <div style={{ color: contact.parsedProfile && !contact.parsedProfile.error ? 'var(--cyan)' : 'var(--text-secondary)', fontWeight: 700 }}>{contact.parsedProfile && !contact.parsedProfile.error ? 'Parsed' : 'Needed'}</div>
        </div>
        <div style={{ background: 'var(--surface)', padding: 16 }}>
          <div className="section-kicker" style={{ marginBottom: 8 }}>Network</div>
          <div style={{ color: 'var(--accent)', fontWeight: 700 }}>{stats?.total || 0} contacts</div>
        </div>
      </div>
      <div className="paper-panel" style={{ margin: 16, borderRadius: 12, padding: 18 }}>
        <div className="section-kicker" style={{ color: 'rgba(16,25,35,0.62)', marginBottom: 10 }}>Prep artifact</div>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 18, lineHeight: 1.55, marginBottom: 14 }}>
          {contact.brief ? 'Open the dossier to review the generated brief, questions, mutual ground, and follow-up context.' : 'Upload a LinkedIn PDF and generate the prep brief before the call.'}
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Button variant="primary" onClick={() => onOpenContact(contact)}>Open dossier</Button>
          {!contact.brief && <Button onClick={() => onOpenContact(contact)}>Open to generate</Button>}
        </div>
      </div>
    </section>
  )
}
