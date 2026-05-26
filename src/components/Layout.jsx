import React from 'react'
import {
  BriefcaseBusiness,
  CalendarDays,
  CircleAlert,
  CheckCircle2,
  Contact,
  FileText,
  Home,
  Network,
  Plus,
  Settings,
  Sparkles,
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
      <button className="mobile-brand" onClick={() => onTabChange('home')} style={{ border: 'none', background: 'transparent', color: 'var(--text-primary)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, lineHeight: 0.95, cursor: 'pointer' }}>
        NoShow OS
      </button>
      <select className="mobile-view-select" value={activeTab} onChange={e => onTabChange(e.target.value)} aria-label="Current view" style={{ minWidth: 112, background: 'var(--surface)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px', fontFamily: 'var(--font-sans)' }}>
        {NAV_ITEMS.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}
      </select>
      <div className="mobile-actions" style={{ display: 'flex', gap: 6 }}>
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

export function TodayDesk({ contact, stats, onOpenContact, onOpenContacts, onAddContact }) {
  if (!contact) {
    return (
      <section className="dossier-panel today-desk today-desk-empty" style={{ padding: 24, overflow: 'hidden' }}>
        <div className="section-kicker" style={{ color: 'var(--accent)', marginBottom: 12 }}>Today desk</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20, alignItems: 'end' }}>
          <div>
            <h1 className="today-desk-title" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 5vw, 58px)', lineHeight: 0.95, letterSpacing: 0, marginBottom: 14 }}>No meeting queued</h1>
            <p style={{ color: 'var(--text-secondary)', maxWidth: 620, lineHeight: 1.7, margin: 0 }}>Schedule a chat or choose who you want to prepare for. The desk only promotes upcoming meetings now, so completed contacts stay out of the lead spot.</p>
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            <div style={{ background: 'rgba(244,247,249,0.04)', border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
              <div className="section-kicker" style={{ marginBottom: 8 }}>Network</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, lineHeight: 1, fontWeight: 800, color: 'var(--cyan)' }}>{stats?.total || 0}</div>
              <div style={{ color: 'var(--text-tertiary)', fontSize: 12, marginTop: 6 }}>contacts ready when you are</div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <Button variant="primary" onClick={onOpenContacts}><Contact size={14} strokeWidth={1.8} aria-hidden="true" /> Open contacts</Button>
              <Button onClick={onAddContact}><Plus size={14} strokeWidth={1.8} aria-hidden="true" /> Add contact</Button>
            </div>
          </div>
        </div>
      </section>
    )
  }

  const hasParsedProfile = contact.parsedProfile && !contact.parsedProfile.error
  const hasBrief = !!contact.brief
  const prepStatus = !hasParsedProfile
    ? {
        icon: CircleAlert,
        title: 'LinkedIn PDF needed',
        body: 'Upload their profile PDF before you generate the brief.',
        accent: 'var(--amber)',
        background: 'rgba(251,191,36,0.08)',
        border: 'rgba(251,191,36,0.22)',
        action: 'Open dossier',
      }
    : hasBrief
      ? {
          icon: CheckCircle2,
          title: 'Brief ready',
          body: 'Questions, mutual ground, and follow-up context are ready.',
          accent: 'var(--green-text)',
          background: 'rgba(74,222,128,0.08)',
          border: 'rgba(74,222,128,0.22)',
          action: 'Open dossier',
        }
      : {
          icon: Sparkles,
          title: 'Ready to generate',
          body: 'PDF is parsed. Open the dossier and generate the prep brief.',
          accent: 'var(--cyan)',
          background: 'rgba(143,227,255,0.08)',
          border: 'rgba(143,227,255,0.22)',
          action: 'Open to generate',
        }
  const PrepStatusIcon = prepStatus.icon

  return (
    <section className="dossier-panel today-desk" style={{ overflow: 'hidden' }}>
      <div className="today-desk-header" style={{ padding: 24, borderBottom: '1px solid var(--border)' }}>
        <div className="section-kicker" style={{ color: 'var(--accent)', marginBottom: 12 }}>Today desk</div>
        <h1 className="today-desk-title" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(34px, 5vw, 62px)', lineHeight: 0.94, letterSpacing: 0, marginBottom: 14 }}>Prep for {contact.name}</h1>
        <div className="today-desk-meta" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', color: 'var(--text-secondary)', fontSize: 13 }}>
          <span>{[contact.role, contact.company].filter(Boolean).join(' at ') || 'No role set'}</span>
          {contact.chatDate && <span>{formatDate(contact.chatDate)}{contact.chatTime ? ` at ${contact.chatTime}` : ''}</span>}
          <StatusBadge status={contact.status} />
        </div>
      </div>
      <div className="today-status-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(105px, 1fr))', gap: 1, background: 'transparent' }}>
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
      <div className="today-prep-status" style={{ margin: 16, borderRadius: 12, padding: '12px 14px', background: prepStatus.background, border: `1px solid ${prepStatus.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 220, flex: 1 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(244,247,249,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <PrepStatusIcon size={17} color={prepStatus.accent} strokeWidth={1.9} aria-hidden="true" />
          </div>
          <div>
            <div className="section-kicker" style={{ color: prepStatus.accent, marginBottom: 4 }}>{prepStatus.title}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.45 }}>{prepStatus.body}</div>
          </div>
        </div>
        <Button variant={hasBrief ? 'default' : 'primary'} onClick={() => onOpenContact(contact)}>{prepStatus.action}</Button>
      </div>
    </section>
  )
}
