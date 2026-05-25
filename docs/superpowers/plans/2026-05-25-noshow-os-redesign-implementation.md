# NoShow OS Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the full current NoShow OS app into a dark, mobile-first Midnight Paper Brief Desk without changing existing product behavior.

**Architecture:** Keep React + Vite and preserve existing state, storage, PDF parsing, Anthropic calls, and scheduling behavior. Add a shared visual system, app shell, dossier components, lucide-only icon usage, and a copy/icon audit script so the redesign is verifiable. Refactor visual markup gradually instead of rewriting app logic.

**Tech Stack:** React 18, Vite 4, CSS variables/global CSS, lucide-react, existing localStorage/Supabase helpers, existing PDF and Anthropic API helpers.

---

## Scope Check

This is a broad visual redesign, but it is one coherent subsystem: the app-wide layout and visual language. The plan keeps the product behavior unchanged and slices work by visual ownership so each task is testable on its own.

## File Structure

- Modify `package.json`: add `lucide-react` dependency and `check:ui-copy` script.
- Modify `package-lock.json`: lock `lucide-react`.
- Create `scripts/check-ui-copy.mjs`: scans source for emoji glyphs and visible em dashes.
- Modify `src/index.css`: add Midnight Paper tokens, app layout classes, component classes, and responsive rules.
- Modify `src/components/UI.jsx`: update shared controls, lucide-friendly primitives, empty states, buttons, tabs, chips, notices, and avatar fallback.
- Create `src/components/Layout.jsx`: `AppShell`, `LeftRail`, `MobileTopBar`, `TodayDesk`, `RightOrbit`, `OrbitPanel`, and `MetricTile`.
- Modify `src/App.jsx`: use the app shell, rebuild Home as Brief Desk, wire existing tabs into the new layout, remove visible emojis, preserve existing state handlers.
- Modify `src/components/ContactList.jsx`: restyle contact, upcoming, and month calendar surfaces with shared classes and lucide icons.
- Modify `src/components/ContactDetail.jsx`: restyle contact detail as a dossier, replace section icons with lucide components, preserve PDF upload, parse, brief, notes, follow-up, and scheduling handlers.
- Modify `src/components/Onboarding.jsx`: bring onboarding into the same visual system and remove visible emojis.
- Modify `src/components/JobSearch.jsx`: restyle job recommendations and empty/loading states.
- Modify `src/components/NotionImport.jsx`: restyle import modal and remove visible emojis.
---

### Task 1: Add UI Copy Audit And lucide-react

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `scripts/check-ui-copy.mjs`

- [ ] **Step 1: Create the failing UI copy audit**

Create `scripts/check-ui-copy.mjs`:

```js
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const root = join(process.cwd(), 'src')
const ignoredDirs = new Set(['node_modules', 'dist', 'build'])
const sourceExtensions = new Set(['.js', '.jsx', '.ts', '.tsx', '.css', '.html'])
const emojiRegex = /\p{Extended_Pictographic}/u
const emDashRegex = /—/

function extensionOf(file) {
  const match = file.match(/\.[^.]+$/)
  return match ? match[0] : ''
}

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    if (ignoredDirs.has(entry)) continue
    const path = join(dir, entry)
    const stat = statSync(path)
    if (stat.isDirectory()) walk(path, files)
    else if (sourceExtensions.has(extensionOf(path))) files.push(path)
  }
  return files
}

const failures = []

for (const file of walk(root)) {
  const text = readFileSync(file, 'utf8')
  const lines = text.split('\n')
  lines.forEach((line, index) => {
    if (emojiRegex.test(line)) {
      failures.push(`${file}:${index + 1}: emoji glyph found`)
    }
    if (emDashRegex.test(line)) {
      failures.push(`${file}:${index + 1}: em dash found`)
    }
  })
}

if (failures.length) {
  console.error(failures.join('\n'))
  process.exit(1)
}

console.log('UI copy audit passed: no emoji glyphs or em dashes found in src/.')
```

- [ ] **Step 2: Add the audit script to `package.json`**

Change the `scripts` block to include:

```json
{
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "check:ui-copy": "node scripts/check-ui-copy.mjs"
}
```

- [ ] **Step 3: Run the audit and confirm it fails before the redesign**

Run: `npm run check:ui-copy`

Expected: `FAIL` with paths such as `src/App.jsx`, `src/components/ContactDetail.jsx`, `src/components/ContactList.jsx`, and `src/components/Onboarding.jsx` reporting emoji glyphs or em dashes.

- [ ] **Step 4: Install lucide-react**

Run: `npm install lucide-react`

Expected: `package.json` includes `"lucide-react"` under dependencies and `package-lock.json` updates.

- [ ] **Step 5: Commit the audit and dependency**

```bash
git add package.json package-lock.json scripts/check-ui-copy.mjs
git commit -m "chore: add UI copy audit and lucide icons"
```

---

### Task 2: Establish Midnight Paper Tokens And Layout CSS

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Replace the current token block with Midnight Paper tokens**

Use these CSS variables in `:root`, preserving existing variable names where existing components rely on them:

```css
:root {
  --bg: #0f1923;
  --bg-deep: #081016;
  --bg-ink: #101923;
  --surface: #162330;
  --surface-2: #1b2a36;
  --surface-3: #213241;
  --surface-paper: #f2efe7;
  --surface-paper-muted: #d8d2c5;
  --border: rgba(154, 167, 178, 0.18);
  --border-strong: rgba(216, 210, 197, 0.28);
  --text-primary: #f4f7f9;
  --text-secondary: rgba(226, 234, 240, 0.74);
  --text-tertiary: rgba(166, 178, 190, 0.5);
  --text-ink: #101923;
  --accent: #c5ff5a;
  --accent-fg: #081016;
  --accent-dim: rgba(197, 255, 90, 0.14);
  --accent-glow: rgba(197, 255, 90, 0.34);
  --cyan: #8fe3ff;
  --cyan-dim: rgba(143, 227, 255, 0.14);
  --rose: #ff7aa8;
  --rose-dim: rgba(255, 122, 168, 0.14);
  --amber: #f0ba4d;
  --amber-dim: rgba(240, 186, 77, 0.14);
  --green: #80e29b;
  --green-bg: rgba(128, 226, 155, 0.13);
  --green-text: #a7f3ba;
  --green-border: rgba(128, 226, 155, 0.28);
  --blue-bg: rgba(143, 227, 255, 0.12);
  --blue-text: #8fe3ff;
  --blue-border: rgba(143, 227, 255, 0.26);
  --red-text: #ff8a8a;
  --red-border: rgba(255, 138, 138, 0.32);
  --red-dim: rgba(255, 138, 138, 0.14);
  --gray-bg: rgba(244, 247, 249, 0.06);
  --gray-text: rgba(226, 234, 240, 0.62);
  --font-display: 'Syne', 'Space Grotesk', system-ui, sans-serif;
  --font-sans: 'DM Sans', Inter, system-ui, sans-serif;
  --font-mono: 'DM Mono', 'SFMono-Regular', Consolas, monospace;
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 18px;
  --radius-full: 9999px;
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.28);
  --shadow-md: 0 12px 32px rgba(0, 0, 0, 0.28);
  --shadow-lg: 0 24px 70px rgba(0, 0, 0, 0.44);
}
```

- [ ] **Step 2: Add the global app layout classes**

Append these classes after the animation declarations:

```css
.app-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 84px minmax(0, 1fr);
  background:
    linear-gradient(120deg, rgba(143, 227, 255, 0.07), transparent 34%),
    radial-gradient(circle at top right, rgba(197, 255, 90, 0.08), transparent 30%),
    var(--bg);
}

.app-main {
  min-width: 0;
  padding: 20px;
}

.brief-desk-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 360px);
  gap: 16px;
  align-items: start;
}

.left-rail {
  position: sticky;
  top: 0;
  height: 100vh;
  border-right: 1px solid var(--border);
  background: rgba(8, 16, 22, 0.72);
  backdrop-filter: blur(18px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 16px 10px;
}

.mobile-top-bar {
  display: none;
}

.dossier-panel {
  background: linear-gradient(180deg, rgba(22, 35, 48, 0.96), rgba(16, 25, 35, 0.96));
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.paper-panel {
  background: var(--surface-paper);
  color: var(--text-ink);
  border: 1px solid rgba(216, 210, 197, 0.55);
}

.section-kicker {
  font-family: var(--font-mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--text-tertiary);
}

.icon-btn {
  width: 34px;
  height: 34px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: rgba(244, 247, 249, 0.04);
  color: var(--text-secondary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.icon-btn:hover,
.icon-btn:focus-visible {
  color: var(--accent);
  border-color: var(--accent-glow);
  outline: none;
}
```

- [ ] **Step 3: Add first-class mobile CSS**

Append these responsive rules:

```css
@media (max-width: 980px) {
  .app-shell {
    display: block;
  }

  .left-rail {
    display: none;
  }

  .mobile-top-bar {
    position: sticky;
    top: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-height: 58px;
    padding: 10px 14px;
    background: rgba(8, 16, 22, 0.86);
    border-bottom: 1px solid var(--border);
    backdrop-filter: blur(18px);
  }

  .app-main {
    padding: 14px;
  }

  .brief-desk-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .app-main {
    padding: 10px;
  }

  .dossier-panel,
  .paper-panel {
    border-radius: 12px;
  }
}
```

- [ ] **Step 4: Run build after CSS change**

Run: `npm run build`

Expected: Vite build succeeds.

- [ ] **Step 5: Commit tokens and layout CSS**

```bash
git add src/index.css
git commit -m "style: add Midnight Paper design tokens"
```

---

### Task 3: Update Shared UI Primitives For The New System

**Files:**
- Modify: `src/components/UI.jsx`

- [ ] **Step 1: Import lucide icons and remove emoji avatar fallback**

At the top of `UI.jsx`, add:

```js
import { Building2, Check, Loader2, X } from 'lucide-react'
```

Replace `AVATAR_ICONS` usage with initials-only fallback:

```js
const AVATAR_GRADIENTS = [
  ['#8fe3ff', '#3ba7c8'],
  ['#c5ff5a', '#7ea832'],
  ['#ff7aa8', '#b9476d'],
  ['#f0ba4d', '#9f7322'],
  ['#a6b4ff', '#6675c8'],
  ['#80e29b', '#359b58'],
]
```

Use `initials(name)` in the fallback avatar instead of an emoji glyph.

- [ ] **Step 2: Replace `CompanyLogo` fallback SVG with lucide**

Use this fallback branch:

```jsx
if (failed || !domain) {
  return <Building2 size={size} strokeWidth={1.8} style={{ flexShrink: 0, opacity: 0.42 }} aria-hidden="true" />
}
```

- [ ] **Step 3: Update `Button`, `Input`, `Textarea`, `Tabs`, `Notice`, `Spinner`, `AIOutput`, and `SectionLabel` to use tokens**

Keep component signatures unchanged. Apply these visual rules:

```js
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
```

Use `<Loader2 size={14} className="spinner-icon" />` inside `Spinner`, and add this CSS in `src/index.css` if missing:

```css
.spinner-icon {
  animation: spin 0.8s linear infinite;
}
```

- [ ] **Step 4: Add `EmptyState` and `IconButton` exports**

Add these exports near the other shared components:

```jsx
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
```

- [ ] **Step 5: Run the copy audit**

Run: `npm run check:ui-copy`

Expected: still fails because other source files contain emojis and em dashes. `src/components/UI.jsx` should no longer appear in the failure list.

- [ ] **Step 6: Commit shared UI primitives**

```bash
git add src/components/UI.jsx src/index.css
git commit -m "style: refresh shared UI primitives"
```

---

### Task 4: Build App Shell Components

**Files:**
- Create: `src/components/Layout.jsx`

- [ ] **Step 1: Create `Layout.jsx` with shell components**

Create the file with these exports:

```jsx
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
  { key: 'map', label: 'Network', icon: Network },
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
            <button key={item.key} onClick={() => onTabChange(item.key)} aria-label={item.label} title={item.label}
              style={{ width: 42, height: 42, borderRadius: 8, border: `1px solid ${active ? 'var(--accent-glow)' : 'var(--border)'}`, background: active ? 'var(--accent-dim)' : 'rgba(244,247,249,0.04)', color: active ? 'var(--accent)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
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
      <button onClick={() => onTabChange('home')} style={{ border: 'none', background: 'transparent', color: 'var(--text-primary)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, cursor: 'pointer' }}>
        NoShow OS
      </button>
      <select value={activeTab} onChange={e => onTabChange(e.target.value)} aria-label="Current view" style={{ minWidth: 128, background: 'var(--surface)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px', fontFamily: 'var(--font-sans)' }}>
        {NAV_ITEMS.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}
      </select>
      <div style={{ display: 'flex', gap: 8 }}>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 1, background: 'var(--border)' }}>
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
```

- [ ] **Step 2: Run build**

Run: `npm run build`

Expected: build succeeds after creating the new file.

- [ ] **Step 3: Commit layout components**

```bash
git add src/components/Layout.jsx
git commit -m "feat: add redesign app shell components"
```

---

### Task 5: Rebuild Home Into Brief Desk

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Import the new shell and lucide icons**

Add imports:

```js
import { AlertCircle, Bell, CalendarDays, CheckCircle2, Clock, Contact, FileText, ListChecks, MessageSquareText, Network, NotebookText, Plus, Search, Sparkles, UserRound } from 'lucide-react'
import { AppShell, TodayDesk, RightOrbit, OrbitPanel, MetricTile } from './components/Layout'
```

- [ ] **Step 2: Replace visible emoji strings in home-only constants**

Change `PRO_TIPS` to remove `icon` and em dashes:

```js
const PRO_TIPS = [
  { text: 'Upload LinkedIn PDFs for instant profiles. It pulls skills, experience, and more automatically.' },
  { text: 'Set chat dates on contacts to keep meetings organized and reminders visible.' },
  { text: 'Send follow-ups within 24 hours. The sooner you reach out, the stronger the connection.' },
  { text: 'Prep briefs are the cheat sheet before every coffee chat.' },
  { text: "Mention something specific from their background. It shows you've done the work." },
  { text: 'Add your skills and resume to improve prep briefs and job matches.' },
]
```

Change `VIBES` labels:

```js
const VIBES = [
  { label: 'Great', value: 'great', color: '#80e29b', bg: 'rgba(128,226,155,0.12)', border: 'rgba(128,226,155,0.3)' },
  { label: 'Solid', value: 'okay', color: '#f0ba4d', bg: 'rgba(240,186,77,0.12)', border: 'rgba(240,186,77,0.3)' },
  { label: 'Awkward', value: 'awkward', color: '#ff7aa8', bg: 'rgba(255,122,168,0.12)', border: 'rgba(255,122,168,0.3)' },
]
```

- [ ] **Step 3: Compute the primary today contact in `App`**

Add this memo after `upcoming` and `due` calculations are available:

```js
const todayDeskContact = useMemo(() => {
  const scheduled = contacts
    .filter(c => c.chatDate && c.status === 'scheduled')
    .sort((a, b) => new Date(a.chatDate + 'T12:00:00') - new Date(b.chatDate + 'T12:00:00'))
  if (scheduled.length) return scheduled[0]
  const needsBrief = contacts.find(c => c.parsedProfile && !c.parsedProfile.error && !c.brief)
  if (needsBrief) return needsBrief
  return contacts[0] || null
}, [contacts])
```

- [ ] **Step 4: Wrap the app body in `AppShell`**

Replace the top-level app layout inside the authenticated return with:

```jsx
<AppShell
  activeTab={tab}
  onTabChange={setTab}
  onAddContact={() => setShowAdd(true)}
  onEditProfile={() => setShowEdit(true)}
  profile={profile}
>
  {/* existing tab content and modals move inside here */}
</AppShell>
```

Keep existing modals, `ContactDetail`, `AddModal`, `ScheduleModal`, `DebriefModal`, `BrainDumpPanel`, `NotionImport`, and onboarding behavior intact.

- [ ] **Step 5: Replace the Home tab body with Brief Desk composition**

For `tab === 'home'`, render:

```jsx
<div className="brief-desk-grid">
  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
    <TodayDesk
      contact={todayDeskContact}
      stats={stats}
      onOpenContact={setDetail}
    />
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, minmax(0, 1fr))', gap: 10 }}>
      <MetricTile label="Total" value={stats.total} icon={Contact} accent="var(--accent)" onClick={() => setTab('contacts')} />
      <MetricTile label="Scheduled" value={stats.scheduled} icon={CalendarDays} accent="var(--green)" onClick={() => setTab('upcoming')} />
      <MetricTile label="Completed" value={stats.completed} icon={CheckCircle2} accent="var(--cyan)" onClick={() => setTab('contacts')} />
      <MetricTile label="Followed Up" value={stats.followedUp} icon={MessageSquareText} accent="var(--rose)" onClick={() => setTab('contacts')} />
    </div>
    {/* keep existing recent contacts, insights, network score, and highlights as dark dossier panels */}
  </div>
  <RightOrbit>
    <OrbitPanel title="Upcoming" icon={Clock} accent="var(--cyan)" action={<button onClick={() => setTab('upcoming')} style={{ background: 'none', border: 'none', color: 'var(--cyan)', cursor: 'pointer', fontSize: 12 }}>View all</button>}>
      {/* move existing upcoming summary rows here */}
    </OrbitPanel>
    <OrbitPanel title="Follow-ups" icon={Bell} accent="var(--rose)">
      {/* move existing follow-up reminder rows here */}
    </OrbitPanel>
    <OrbitPanel title="Tasks" icon={ListChecks} accent="var(--accent)">
      <TodoInput onAdd={addTodo} />
      <div style={{ marginTop: 12 }}><TodoList todos={todos} onToggle={toggleTodo} onDelete={deleteTodo} /></div>
    </OrbitPanel>
    <OrbitPanel title="Quick Notes" icon={NotebookText} accent="var(--amber)">
      <button onClick={() => setShowBrainDump(true)} style={{ width: '100%', background: 'rgba(244,247,249,0.04)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>Open quick notes</button>
    </OrbitPanel>
  </RightOrbit>
</div>
```

Move existing home modules into the commented areas rather than deleting them. Preserve their handlers and state.

- [ ] **Step 6: Run audit and build**

Run: `npm run check:ui-copy`

Expected: still fails because non-home files contain emojis or em dashes.

Run: `npm run build`

Expected: build succeeds.

- [ ] **Step 7: Commit home redesign**

```bash
git add src/App.jsx src/components/Layout.jsx
git commit -m "feat: redesign home as Brief Desk"
```

---

### Task 6: Redesign Contacts, Upcoming, And Calendar Surfaces

**Files:**
- Modify: `src/components/ContactList.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Import lucide icons in `ContactList.jsx`**

Add:

```js
import { CalendarDays, Clock, Contact, Plus, Search, UserRound } from 'lucide-react'
import { EmptyState } from './UI'
```

- [ ] **Step 2: Replace empty states with lucide `EmptyState`**

For empty contacts:

```jsx
return (
  <EmptyState
    icon={UserRound}
    title="No contacts yet"
    body="Add someone you want to connect with, then attach their LinkedIn PDF before the chat."
  />
)
```

For empty upcoming:

```jsx
return (
  <EmptyState
    icon={CalendarDays}
    title="Nothing scheduled"
    body="Set a chat date on a contact and schedule it when you are ready."
  />
)
```

- [ ] **Step 3: Restyle contact rows without changing props**

Keep the `ContactList({ contacts, onSelect })` signature. Change row style to:

```js
style={{
  position: 'relative',
  overflow: 'hidden',
  background: 'rgba(244,247,249,0.04)',
  border: `1px solid ${statusColors.border}`,
  borderRadius: 'var(--radius-md)',
  padding: '0.85rem 1rem',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  cursor: 'pointer',
  transition: 'border-color 0.15s, transform 0.15s, background 0.15s',
}}
```

Keep `Avatar`, `StatusBadge`, date formatting, and click behavior unchanged.

- [ ] **Step 4: Replace arrows and warning glyphs in upcoming rows**

Use lucide icons:

```jsx
<Clock size={15} strokeWidth={1.8} aria-hidden="true" />
<CalendarDays size={15} strokeWidth={1.8} aria-hidden="true" />
```

Replace button text `Schedule →` with `Schedule`.

- [ ] **Step 5: Update `MonthCalendar` controls**

Use text labels or lucide chevrons imported from `lucide-react`:

```js
import { ChevronLeft, ChevronRight } from 'lucide-react'
```

Buttons render:

```jsx
<ChevronLeft size={15} aria-hidden="true" />
<ChevronRight size={15} aria-hidden="true" />
```

- [ ] **Step 6: Run audit and build**

Run: `npm run check:ui-copy`

Expected: `src/components/ContactList.jsx` no longer appears in failures.

Run: `npm run build`

Expected: build succeeds.

- [ ] **Step 7: Commit contacts and calendar restyle**

```bash
git add src/components/ContactList.jsx src/App.jsx
git commit -m "style: redesign contacts and calendar surfaces"
```

---

### Task 7: Redesign Contact Detail As A Dossier

**Files:**
- Modify: `src/components/ContactDetail.jsx`
- Modify: `src/components/UI.jsx` if extra shared controls are needed

- [ ] **Step 1: Import lucide icons**

Add:

```js
import {
  Award,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  Clipboard,
  Download,
  FileText,
  GraduationCap,
  Link,
  Mail,
  MapPin,
  MessageSquareText,
  Network,
  NotebookText,
  Send,
  Sparkles,
  Target,
  Upload,
  UserRound,
  X,
} from 'lucide-react'
```

- [ ] **Step 2: Replace `BRIEF_SECTIONS` emoji icons with lucide components**

Use:

```js
const BRIEF_SECTIONS = [
  { key: 'BACKGROUND', icon: UserRound, gradient: 'linear-gradient(135deg, rgba(143,227,255,0.12), rgba(143,227,255,0.03))', border: 'rgba(143,227,255,0.28)', accent: '#8fe3ff' },
  { key: 'MUTUAL GROUND', icon: Network, gradient: 'linear-gradient(135deg, rgba(128,226,155,0.12), rgba(128,226,155,0.03))', border: 'rgba(128,226,155,0.28)', accent: '#80e29b' },
  { key: 'THEIR CAREER STORY', icon: BriefcaseBusiness, gradient: 'linear-gradient(135deg, rgba(240,186,77,0.12), rgba(240,186,77,0.03))', border: 'rgba(240,186,77,0.28)', accent: '#f0ba4d' },
  { key: 'GOALS for THIS CHAT', alt: 'GOALS FOR THIS CHAT', icon: Target, gradient: 'linear-gradient(135deg, rgba(255,122,168,0.12), rgba(255,122,168,0.03))', border: 'rgba(255,122,168,0.28)', accent: '#ff7aa8' },
  { key: 'QUESTIONS TO ASK', icon: MessageSquareText, gradient: 'linear-gradient(135deg, rgba(143,227,255,0.12), rgba(143,227,255,0.03))', border: 'rgba(143,227,255,0.28)', accent: '#8fe3ff' },
  { key: 'WHAT TO HIGHLIGHT ABOUT YOU', icon: Sparkles, gradient: 'linear-gradient(135deg, rgba(197,255,90,0.12), rgba(197,255,90,0.03))', border: 'rgba(197,255,90,0.28)', accent: '#c5ff5a' },
  { key: 'CONVERSATION STARTERS', icon: Send, gradient: 'linear-gradient(135deg, rgba(240,186,77,0.12), rgba(240,186,77,0.03))', border: 'rgba(240,186,77,0.28)', accent: '#f0ba4d' },
]
```

In `BriefDisplay`, render:

```jsx
const Icon = s.icon
...
<Icon size={14} strokeWidth={1.8} aria-hidden="true" /> {s.key}
```

- [ ] **Step 3: Replace all visible emoji strings in `ContactDetail.jsx`**

Examples:

```jsx
<span>Follow-up</span>
```

instead of:

```jsx
<span>✉️ Follow-up</span>
```

Use lucide icons beside labels:

```jsx
<Mail size={14} strokeWidth={1.8} aria-hidden="true" />
<span>Follow-up</span>
```

Replace visible em dash copy:

```jsx
<Notice variant="blue" style={{ marginBottom: 10 }}>LinkedIn profile, More, Save to PDF, then drop below.</Notice>
```

- [ ] **Step 4: Restyle root contact detail container**

Replace the root container style with:

```js
{
  background: 'linear-gradient(180deg, rgba(22,35,48,0.98), rgba(16,25,35,0.98))',
  borderRadius: 'var(--radius-xl)',
  border: '1px solid var(--border-strong)',
  padding: '1.25rem',
  width: '100%',
  maxWidth: 920,
  maxHeight: '88vh',
  overflowY: 'auto',
  boxShadow: 'var(--shadow-lg)',
}
```

- [ ] **Step 5: Restyle PDF drop zones**

Drop zones should use `Upload` and `FileText` icons:

```jsx
{parsing
  ? <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}><Spinner /> Parsing PDF...</div>
  : pdfName
    ? <div><FileText size={24} style={{ marginBottom: 6 }} aria-hidden="true" /><div style={{ fontSize: 13, fontWeight: 600 }}>{pdfName}</div><div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>Click to replace</div></div>
    : <div><Upload size={28} style={{ marginBottom: 6, opacity: 0.72 }} aria-hidden="true" /><div style={{ fontSize: 13 }}>Drop LinkedIn PDF here</div><div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>or click to browse</div></div>}
```

- [ ] **Step 6: Run audit and build**

Run: `npm run check:ui-copy`

Expected: `src/components/ContactDetail.jsx` no longer appears in failures.

Run: `npm run build`

Expected: build succeeds.

- [ ] **Step 7: Commit contact dossier redesign**

```bash
git add src/components/ContactDetail.jsx src/components/UI.jsx
git commit -m "style: redesign contact detail dossier"
```

---

### Task 8: Restyle Supporting Surfaces And Finish Copy/Icon Audit

**Files:**
- Modify: `src/components/Onboarding.jsx`
- Modify: `src/components/JobSearch.jsx`
- Modify: `src/components/NotionImport.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Replace onboarding emoji and em dash copy**

Import:

```js
import { Check, FileText, Upload } from 'lucide-react'
```

Use text without em dashes:

```jsx
<div style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', marginBottom: 44 }}>Be specific. This personalizes everything.</div>
```

Replace PDF visual glyphs with `<FileText />` and `<Upload />`.

- [ ] **Step 2: Replace job search empty state**

Import:

```js
import { BriefcaseBusiness, Sparkles } from 'lucide-react'
import { EmptyState, Spinner } from './UI'
```

Use:

```jsx
<EmptyState
  icon={BriefcaseBusiness}
  title="No matches yet"
  body="Generate a first list from your profile, resume, and skills."
/>
```

- [ ] **Step 3: Replace Notion import icons and em dash copy**

Import:

```js
import { ClipboardPaste, FileText, X } from 'lucide-react'
```

Replace tab text with icon plus label:

```jsx
<ClipboardPaste size={14} aria-hidden="true" />
<span>Paste Notes</span>
```

- [ ] **Step 4: Finish `App.jsx` visible emoji removal**

Replace labels and glyphs in modals, task panels, resume tips, network map, stats, and buttons with lucide icons or plain text. Specific replacements:

```js
const RESUME_TIPS = [
  { title: 'Keep it to one page', body: 'For students and recent grads, one page is the standard. Recruiters spend about 7 seconds on a first scan.' },
  { title: 'Lead with impact numbers', body: 'Replace "helped with marketing" with "grew Instagram engagement 40% in 3 months." Quantify everything you can.' },
  { title: 'Beat applicant tracking systems', body: "Mirror exact keywords from the job description. Don't paraphrase the important terms." },
  { title: 'Tailor for every role', body: 'Keep a master resume and create a trimmed, targeted version for each application. Generic resumes get filtered out.' },
  { title: 'Start every bullet with an action verb', body: '"Led," "Built," "Designed," and "Increased" are stronger than "Responsible for" or "Helped with."' },
  { title: 'Use ruthless formatting', body: 'Keep fonts consistent, align margins, skip photos, save as PDF, and use a clear file name.' },
]
```

- [ ] **Step 5: Run the audit until it passes**

Run: `npm run check:ui-copy`

Expected: `UI copy audit passed: no emoji glyphs or em dashes found in src/.`

- [ ] **Step 6: Run build**

Run: `npm run build`

Expected: build succeeds.

- [ ] **Step 7: Commit supporting surface polish**

```bash
git add src/App.jsx src/components/Onboarding.jsx src/components/JobSearch.jsx src/components/NotionImport.jsx
git commit -m "style: polish supporting redesign surfaces"
```

---

### Task 9: Browser Verification And Mobile Polish

**Files:**
- Modify: files identified from browser QA, usually `src/index.css`, `src/App.jsx`, `src/components/Layout.jsx`, `src/components/ContactDetail.jsx`, or `src/components/ContactList.jsx`

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`

Expected: Vite dev server starts and prints a localhost URL.

- [ ] **Step 2: Open the app in Browser/IAB**

Use Browser/IAB at the dev server URL. Check desktop first.

Desktop checks:

- Left rail visible and usable.
- Home uses Brief Desk layout.
- Today desk has a clear primary contact or empty next action.
- Right orbit does not overflow.
- Contact list rows are dense and scannable.
- Contact detail opens and remains usable.
- LinkedIn PDF upload zone is visible.
- Prep Brief tab is readable.

- [ ] **Step 3: Check mobile viewport**

Use a mobile-size viewport around 390px wide.

Mobile checks:

- No horizontal scrolling.
- Mobile top bar is visible.
- Main action controls fit.
- Today desk appears before orbit modules.
- Contact detail modal fits within viewport.
- Tabs are scrollable or wrapped without clipped text.
- PDF drop zones and generated brief sections remain readable.

- [ ] **Step 4: Fix concrete browser issues**

For each issue found, make the smallest targeted change. Example fixes:

```css
@media (max-width: 640px) {
  .contact-detail-grid {
    grid-template-columns: 1fr;
  }
}
```

```css
.tab-bar-scroll {
  overflow-x: auto;
  scrollbar-width: none;
}
```

- [ ] **Step 5: Run final checks**

Run:

```bash
npm run check:ui-copy
npm run build
```

Expected:

- Copy audit passes.
- Vite build succeeds.

- [ ] **Step 6: Commit browser QA fixes**

```bash
git add src
git commit -m "fix: polish responsive redesign QA"
```

---

## Final Verification

Before handoff, run:

```bash
git status --short
npm run check:ui-copy
npm run build
```

Expected:

- `git status --short` shows only intentional uncommitted changes or is clean.
- Copy audit passes.
- Build passes.

Browser verification must cover desktop and mobile. The final response should mention the localhost URL used, desktop/mobile checks completed, copy audit result, build result, and any remaining intentional deviations.
