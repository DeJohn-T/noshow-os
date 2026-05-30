# Desk Reminders Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Today's Desk's narrow Upcoming/Follow-ups panels with broader, smarter data so the desk surfaces everything that needs attention — any future meeting, any follow-up due, any circle-back contact.

**Architecture:** All changes are in `src/App.jsx`. Two derived arrays (`upcomingMeetings`, `deskReminders`) replace the current `upcoming` and `needsFollowUp`. The Follow-ups panel gets cycling state so it rotates through items when there are more than fit on screen. The dead `CircleBackReminder` component definition gets removed.

**Tech Stack:** React 18, vanilla JS (no new deps)

---

## File Map

| File | Change |
|------|--------|
| `src/App.jsx:184-230` | Remove dead `CircleBackReminder` component definition |
| `src/App.jsx:1805-1806` | Replace `upcoming` + `needsFollowUp` derivations with `upcomingMeetings` + `deskReminders` |
| `src/App.jsx:1812` | Update `soonChats` to reference `upcomingMeetings` instead of `upcoming` |
| `src/App.jsx:1898-1942` | Update both panel render blocks with new data + cycling logic |

---

## Task 1: Remove dead `CircleBackReminder` component

The `CircleBackReminder` function (lines ~184–230 in App.jsx) is defined but never rendered. Remove it.

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Delete the component definition**

In `src/App.jsx`, find and delete the entire function — from `function CircleBackReminder({` through its closing `}`. It is approximately lines 184–230. The full block looks like:

```jsx
function CircleBackReminder({ contacts, onSelect }) {
  const [idx, setIdx] = useState(0)
  const [fade, setFade] = useState(true)
  // ... the entire function body ...
}
```

Delete everything from `function CircleBackReminder` through the matching closing `}`.

- [ ] **Step 2: Verify the dev server still starts**

```bash
cd ~/CodingWorkspaces/networking-os-v2
npm run dev
```

Expected: no errors in terminal, app loads at localhost port shown.

- [ ] **Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "refactor: remove unused CircleBackReminder component"
```

---

## Task 2: Replace data derivations

Replace the two narrow filter lines and update the `soonChats` reference.

**Files:**
- Modify: `src/App.jsx:1805-1812`

- [ ] **Step 1: Replace `upcoming` and `needsFollowUp` derivations**

Find these two lines (around line 1805):
```js
const upcoming = contacts.filter(x => x.chatDate && normalizeStatus(x.status) === 'scheduled' && x.chatDate >= todayStr).sort((a, b) => new Date(a.chatDate + 'T12:00:00') - new Date(b.chatDate + 'T12:00:00'))
const needsFollowUp = contacts.filter(x => normalizeStatus(x.status) === 'follow up' && !x.followUpText)
```

Replace with:
```js
const upcomingMeetings = contacts
  .filter(x => x.chatDate && x.chatDate >= todayStr)
  .sort((a, b) => new Date(a.chatDate + 'T12:00:00') - new Date(b.chatDate + 'T12:00:00'))

const _reminderOverdue = contacts.filter(x =>
  x.followUpDate && x.followUpDate <= todayStr &&
  x.nextAction !== 'done' && !isFinalStatus(x.status)
)
const _reminderFollowUp = contacts.filter(x =>
  normalizeStatus(x.status) === 'follow up' &&
  !_reminderOverdue.find(o => o.id === x.id)
)
const _reminderCircleBack = contacts.filter(x =>
  normalizeStatus(x.status) === 'circle back' &&
  !_reminderOverdue.find(o => o.id === x.id) &&
  !_reminderFollowUp.find(o => o.id === x.id)
)
const deskReminders = [..._reminderOverdue, ..._reminderFollowUp, ..._reminderCircleBack]
```

- [ ] **Step 2: Update `soonChats` to use `upcomingMeetings`**

Find the line (a few lines below, around line 1812):
```js
const soonChats = upcoming.filter(c => c.chatDate === todayStr || c.chatDate === tomorrowStr)
```

Replace with:
```js
const soonChats = upcomingMeetings.filter(c => c.chatDate === todayStr || c.chatDate === tomorrowStr)
```

- [ ] **Step 3: Verify the app loads without console errors**

Open browser devtools console. Reload the home tab. Expected: no errors, the Upcoming and Follow-ups panels still render (data may differ — that's correct).

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx
git commit -m "feat: broaden desk reminder data — upcomingMeetings and deskReminders"
```

---

## Task 3: Update Upcoming panel render

Swap the panel to use `upcomingMeetings` and update the empty state text.

**Files:**
- Modify: `src/App.jsx` (the `homeConfig.upcoming` OrbitPanel block, around line 1901)

- [ ] **Step 1: Update the Upcoming panel JSX**

Find the `homeConfig.upcoming` block. It currently starts with:
```jsx
{homeConfig.upcoming && (
  <OrbitPanel title="Upcoming" icon={CalendarDays} ...>
    {upcoming.length === 0 ? (
      <div ...>No scheduled meetings yet.</div>
    ) : (
      <div ...>
        {upcoming.slice(0, isMobile ? 3 : 4).map(c => (
```

Replace every reference to `upcoming` inside this block with `upcomingMeetings`:
```jsx
{homeConfig.upcoming && (
  <OrbitPanel title="Upcoming" icon={CalendarDays} accent="var(--green-text)" action={<button onClick={() => setTab('upcoming')} style={{ background: 'transparent', border: 'none', color: 'var(--green-text)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>View all</button>}>
    {upcomingMeetings.length === 0 ? (
      <div style={{ color: 'var(--text-tertiary)', fontSize: 13, padding: '16px 0' }}>No meetings scheduled yet.</div>
    ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {upcomingMeetings.slice(0, isMobile ? 3 : 4).map(c => (
          <button key={c.id} onClick={() => setDetail(c)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 0', background: 'transparent', border: 'none', borderTop: '1px solid var(--border)', color: 'var(--text-primary)', textAlign: 'left', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
            <Avatar name={c.name} company={c.company} size={32} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
              <span style={{ display: 'block', color: 'var(--text-tertiary)', fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{[c.role, c.company].filter(Boolean).join(' at ') || 'No role set'}</span>
            </span>
            <span style={{ color: 'var(--text-secondary)', fontSize: 11, textAlign: 'right' }}>{formatDate(c.chatDate)}</span>
          </button>
        ))}
      </div>
    )}
  </OrbitPanel>
)}
```

- [ ] **Step 2: Verify in browser**

On the home tab, check the Upcoming panel now shows contacts in any status that have a future `chatDate` — not just those in "scheduled" status.

- [ ] **Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "feat: upcoming panel shows any contact with a future chatDate"
```

---

## Task 4: Update Follow-ups panel with new data, labels, and cycling

This is the biggest task. Replace `needsFollowUp` with `deskReminders`, add type-aware labels, and add cycling behavior when there are more items than fit.

**Files:**
- Modify: `src/App.jsx` (the `homeConfig.followUp` OrbitPanel block + add cycling state near top of home component)

- [ ] **Step 1: Add cycling state**

Find the block of `useState` calls in the main `App` function (search for `const [tab, setTab]` to orient yourself). Add these two lines nearby:

```js
const [reminderPage, setReminderPage] = useState(0)
const [reminderFade, setReminderFade] = useState(true)
```

- [ ] **Step 2: Add computed values and cycling effect**

`reminderPageSize` and `reminderTotalPages` reference `deskReminders`, so they MUST go right after the `deskReminders` line (around line 1810) — not near the useState calls. The CLAUDE.md rule is: define variables before referencing them. Add these immediately after `const deskReminders = [...]`:

```js
const reminderPageSize = isMobile ? 3 : 4
const reminderTotalPages = Math.ceil(deskReminders.length / reminderPageSize)
```

Then add the cycling effect near the other `useEffect` calls in the file (search for `useEffect` to find the cluster):

```js
useEffect(() => {
  if (reminderTotalPages <= 1) return
  const t = setInterval(() => {
    setReminderFade(false)
    setTimeout(() => {
      setReminderPage(p => (p + 1) % reminderTotalPages)
      setReminderFade(true)
    }, 300)
  }, 10000)
  return () => clearInterval(t)
}, [reminderTotalPages])
```

- [ ] **Step 3: Replace the Follow-ups panel JSX**

Find the `homeConfig.followUp` OrbitPanel block. Replace it entirely with:

```jsx
{homeConfig.followUp && (
  <OrbitPanel title="Follow-ups" icon={Bell} accent="var(--rose)">
    {deskReminders.length === 0 ? (
      <div style={{ color: 'var(--text-tertiary)', fontSize: 13, padding: '16px 0' }}>All caught up.</div>
    ) : (
      <>
        <div
          style={{
            display: 'flex', flexDirection: 'column', gap: 8,
            opacity: reminderFade ? 1 : 0,
            transform: reminderFade ? 'none' : 'translateY(4px)',
            transition: 'all 0.3s ease'
          }}
        >
          {deskReminders
            .slice(reminderPage * reminderPageSize, (reminderPage + 1) * reminderPageSize)
            .map(c => {
              const isOverdue = c.followUpDate && c.followUpDate <= todayStr && c.nextAction !== 'done' && !isFinalStatus(c.status)
              const isCircleBack = normalizeStatus(c.status) === 'circle back'
              const tagLabel = isOverdue ? 'Overdue' : isCircleBack ? 'Circle back' : 'Follow-up'
              const tagColor = isCircleBack ? '#60a5fa' : 'var(--rose)'
              return (
                <button key={c.id} onClick={() => setDetail(c)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 0', background: 'transparent', border: 'none', borderTop: '1px solid var(--border)', color: 'var(--text-primary)', textAlign: 'left', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                  <Avatar name={c.name} company={c.company} size={32} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
                    <span style={{ display: 'block', color: 'var(--text-tertiary)', fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{[c.role, c.company].filter(Boolean).join(' at ') || 'No role set'}</span>
                  </span>
                  <span style={{ color: tagColor, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>{tagLabel}</span>
                </button>
              )
            })}
        </div>
        {reminderTotalPages > 1 && (
          <div style={{ display: 'flex', gap: 4, marginTop: 10, justifyContent: 'center' }}>
            {Array.from({ length: reminderTotalPages }).map((_, i) => (
              <div
                key={i}
                onClick={() => {
                  setReminderFade(false)
                  setTimeout(() => { setReminderPage(i); setReminderFade(true) }, 200)
                }}
                style={{
                  width: i === reminderPage ? 14 : 5, height: 5,
                  borderRadius: 3,
                  background: i === reminderPage ? 'var(--rose)' : 'rgba(255,122,168,0.2)',
                  transition: 'all 0.3s', cursor: 'pointer'
                }}
              />
            ))}
          </div>
        )}
      </>
    )}
  </OrbitPanel>
)}
```

- [ ] **Step 4: Verify in browser**

Check the Follow-ups panel:
- Contacts in `'follow up'` status appear (regardless of whether they have a message written)
- Contacts in `'circle back'` status appear with a blue "Circle back" tag
- Contacts with an overdue `followUpDate` appear with a rose "Overdue" tag
- If there are more than 4 contacts (desktop) / 3 (mobile), dot pagination appears and the panel cycles every 10s

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx
git commit -m "feat: follow-ups panel pools circle back + overdue reminders with cycling"
```

---

## Task 5: Reset reminderPage when deskReminders changes

If contacts change (status update, new contact), the current page index could go out of bounds. Guard against it.

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Add a reset effect**

Near the other `useEffect` calls, add:

```js
useEffect(() => {
  setReminderPage(0)
}, [deskReminders.length])
```

- [ ] **Step 2: Verify no out-of-bounds crash**

Move a contact from 'circle back' to 'complete' while on the home tab. Expected: Follow-ups panel updates cleanly, no blank page or crash.

- [ ] **Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "fix: reset reminder page when reminder count changes"
```
