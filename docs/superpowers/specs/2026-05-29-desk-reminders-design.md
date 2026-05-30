# Today's Desk Reminders — Design Spec
**Date:** 2026-05-29
**Project:** NoShow OS (networking-os-v2)
**Status:** Approved

---

## Problem

The Today's Desk "Upcoming" and "Follow-ups" panels use overly strict filters that miss most contacts:

- **Upcoming** requires `status === 'scheduled'` — contacts in "schedule" status with a chatDate set don't appear
- **Follow-ups** requires `status === 'follow up' && !followUpText` — excludes circle back contacts entirely and hides follow-ups once a message is written
- `followUpDate` (set via "What's Next" date picker) is never surfaced on the desk at all
- The separate `CircleBackReminder` cycling card covers circle-back contacts but is isolated from the main panels

## Goal

Make both desk panels feel like a live "here's what needs your attention" surface. Broader data, smarter priority sorting, and light cycling behavior so the desk stays useful even with many contacts in the pipeline.

---

## Data Layer

### `upcomingMeetings` (replaces `upcoming`)

```js
contacts
  .filter(x => x.chatDate && x.chatDate >= todayStr)
  .sort((a, b) => new Date(a.chatDate + 'T12:00:00') - new Date(b.chatDate + 'T12:00:00'))
```

- No status restriction — any contact with a future chatDate appears
- Sorted by date ascending (soonest first)
- The `soonChats` filter for the hero area remains unchanged (`chatDate === today || chatDate === tomorrow`)

### `deskReminders` (replaces `needsFollowUp`)

Three groups pooled together, de-duped by contact ID:

| Priority | Source filter | Label |
|----------|--------------|-------|
| 1 (highest) | `c.followUpDate && c.followUpDate <= todayStr && c.nextAction !== 'done' && !isFinalStatus(c.status)` | "Overdue" |
| 2 | `normalizeStatus(c.status) === 'follow up'` | "Follow-up" |
| 3 | `normalizeStatus(c.status) === 'circle back'` | "Circle back" |

De-dupe logic: build the array in priority order, skip any contact ID already added. Final sort: overdue contacts first (by followUpDate asc), then follow-up, then circle back.

---

## UI Changes

### Upcoming panel

- Title and icon unchanged
- Renders from `upcomingMeetings` instead of `upcoming`
- Static list (no cycling) — dates are concrete, cycling adds no value
- Empty state: "No meetings scheduled yet."
- Shows up to 4 items (desktop) / 3 (mobile), with "View all" linking to the Upcoming tab

### Follow-ups panel

- Renders from `deskReminders`
- Each row gets a small colored status tag replacing the current generic "Write" / "Needs follow-up" text:
  - Overdue → rose, label "Overdue"
  - Follow-up → rose, label "Follow-up"
  - Circle back → `#60a5fa` (blue), label "Circle back"
- **Cycling behavior**: if `deskReminders.length > visibleSlots`, auto-rotate every 10s through pages, with dot pagination (same pattern as existing `CircleBackReminder`)
- Empty state: "All caught up."

### CircleBackReminder card removal

The `CircleBackReminder` component rendered above the two panels is removed. Circle-back contacts are now surfaced in the Follow-ups panel. The `circleBack` key in `homeConfig` is deprecated — it will be ignored rather than removed (no migration needed since it defaults to `true`).

---

## homeConfig

No new keys required. Existing toggles remain:
- `upcoming` → controls Upcoming panel
- `followUp` → controls Follow-ups panel
- `circleBack` → key left in config but no longer renders anything (treated as deprecated)

The `circleBack` key is not exposed in the Desk Modules customize UI (not in the toggle list), so no UI cleanup is needed.

---

## Files Affected

- `src/App.jsx` — update `upcoming` → `upcomingMeetings` derivation, add `deskReminders` derivation, update panel render logic, add cycling state/effect to Follow-ups panel, remove `CircleBackReminder` usage

---

## Out of Scope

- Changes to the hero "No meeting queued" area or `soonChats` logic
- Changes to the Upcoming tab (full meeting list view)
- Adding new contact fields
- Mobile layout changes beyond the existing `isMobile` slice caps
