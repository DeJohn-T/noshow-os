# NoShow OS Redesign Design

Date: 2026-05-25
Owner: Deej Thompson
Status: Approved design direction

## Summary

NoShow OS will be redesigned as a dark, editorial personal networking workspace. The full current app remains in scope: home dashboard, contacts, contact detail, onboarding/profile, calendar and scheduling, follow-ups, notes, network map, resume, job search, highlights, quick notes, scheduled tasks, and the LinkedIn PDF to prep brief flow.

The redesign is visual and experiential only. It must not remove features, add new product capabilities, change the core data model, switch frameworks, or alter the existing flow for parsing LinkedIn PDFs and generating prep briefs.

Approved direction:

- Layout: Brief Desk.
- Visual system: Midnight Paper.
- App center of gravity: Today-first, with the next meeting or highest-priority prep target as the main object.

## Goals

- Make the app feel like a considered product rather than a first MVP.
- Preserve every current feature while improving layout, hierarchy, density, and polish.
- Make the generated prep brief feel like a designed artifact worth showing in a portfolio case study.
- Keep the dark NoShow OS mood, but make it richer, more structured, and more intentional.
- Treat mobile as a first-class surface because Deej actively uses NoShow OS on his phone.
- Remove emojis from all visible UI and copy.
- Use lucide-react for all icons.

## Non-Goals

- No account, database, or authentication redesign.
- No framework switch away from React and Vite.
- No feature invention.
- No changes to Anthropic prompt behavior unless required by visual formatting.
- No changes to client-side PDF parsing behavior.
- No new persistence model.

## Layout Architecture

The redesigned app opens into a today-first workspace. Home should answer: who is next, what needs prep, what follow-up is due, and what should Deej do now.

The primary desktop layout has three zones:

- Left rail: persistent navigation and profile identity.
- Center desk: next meeting, contact identity, prep status, profile signals, and prep brief artifact.
- Right orbit: follow-ups due, upcoming meetings, tasks, quick notes, highlights, and other supporting modules.

The center desk is the main stage. When there is an upcoming or high-priority contact, the center should foreground that person and their prep state. When there is no upcoming meeting, the center should gracefully shift to the best next action: add a contact, schedule a chat, generate a brief, or review follow-ups.

Contact detail remains tabbed, but should feel like a dossier rather than a modal packed with inline cards. Overview, Notes, LinkedIn, Resume, and Prep Brief stay in place. The UI should make the LinkedIn PDF upload, parsed profile, and generated prep brief feel like one coherent flow.

Contacts, calendar, network map, resume, and job search should inherit the same app shell and visual language. They should not feel like separate design experiments.

## Visual System

The approved mood is Midnight Paper: dark, layered, editorial, and energetic without becoming a bright page.

Base palette:

- Dark navy and charcoal foundation.
- Off-white and muted paper tones for high-priority reading surfaces.
- Slate and blue-gray borders.
- Strong but controlled accents for state and action.

Color should have variety. It should not be a one-color dark dashboard. Use a primary citron or acid-lime accent for core actions, a secondary cyan or blue accent for scheduling and prep states, and a warmer coral or rose accent for follow-up moments. The overall page should remain dark.

Prep brief surfaces can use muted paper or inked panels so the generated output feels special. Contacts, calendar, network map, tasks, resume, and job tools should use darker panels with color-coded rails, markers, and status accents.

Typography should pair editorial character with app clarity:

- Strong display type for page titles, contact names, and major dossier moments.
- Clean sans for controls, labels, lists, and body UI.
- Mono only for small metadata or system labels when useful.

The final font choices are implementation details, but the tone should avoid fake newspaper styling. This is a product, not a costume.

## Component System

The implementation should introduce reusable visual components and reduce the amount of inline styling currently concentrated in `src/App.jsx` and `src/components/ContactDetail.jsx`.

Planned component families:

- `AppShell`: owns the overall layout, responsive behavior, and background.
- `LeftRail`: persistent navigation, brand, and profile controls.
- `TodayDesk`: primary home surface for next meeting and prep state.
- `RightOrbit`: supporting modules such as follow-ups, tasks, quick notes, highlights, and upcoming.
- `DossierPanel`: reusable contact/prep panel with editorial section treatment.
- `SectionHeader`: title, label, icon, and action layout for dense panels.
- `ActionButton`: primary, secondary, ghost, and danger variants.
- `IconButton`: lucide icon-only controls with accessible labels.
- `StatusPill`: status, date, and workflow state markers.
- `EmptyState`: consistent icon-led empty states using lucide icons.
- `ListRow`: compact contact, task, reminder, and activity rows.

Cards should be used only for repeated items, modals, and genuinely framed tools. The redesign should avoid nested cards and avoid making every section a floating rounded container.

## Data Flow

No data model changes are planned.

Existing state and persistence stay intact:

- Contacts.
- Profile.
- Resume data.
- Highlights.
- Todos.
- Scheduled tasks.
- Brain dump notes.
- Job recommendations.
- Supabase/localStorage behavior.
- Parsed LinkedIn profiles.
- Generated prep briefs.
- Generated follow-ups.

The redesign changes where existing data is shown and how it is prioritized. The next meeting becomes the primary object on the home surface. Secondary modules orbit around it without changing their storage or behavior.

## Core Flow

The core flow must remain:

1. User uploads a LinkedIn PDF.
2. App parses it client-side.
3. Anthropic API generates a structured prep brief.
4. User reads the brief before the call.

The redesign should make this flow feel more direct and premium:

- PDF upload should be visually clear and calm.
- Parsing state should be compact and legible.
- Parsed profile sections should feel structured, not scattered.
- Generated brief should read like a dossier, with strong section hierarchy.
- Retry and regenerate actions should remain available where they already exist.

## Copy And Icon Rules

- No emojis anywhere in visible UI or copy.
- No visible em dashes in UI copy.
- Icons must come from lucide-react only.
- Product name is NoShow OS.
- Creator name is Deej Thompson.
- Do not invent new product claims or features.
- Existing visible copy can be tightened for tone and clarity as long as behavior stays the same.

## Error And Empty States

Empty states should be designed, concise, and useful. Use lucide icons, short labels, and direct next actions. Avoid playful filler and avoid feature promises.

Upload, parsing, and AI generation states should communicate:

- What is happening.
- Whether the user can wait, retry, or replace input.
- What failed when an error occurs.

Existing failure behavior can be restyled and clarified, but not expanded into new workflows.

## Responsive Behavior

Desktop should use the full Brief Desk composition. Tablet can collapse the left rail into a compact nav and stack the right orbit beneath or beside the center depending on available width. Mobile is a first-class target, not an afterthought, because this app is used before and around real coffee chats. Mobile should become a single-column, task-first flow:

- Top brand and primary action.
- Today or next meeting module.
- Prep brief and contact actions.
- Orbit modules below.
- Navigation available through compact tabs or a drawer-like control.

Text must fit in its containers on mobile and desktop. Fixed-format UI elements such as rails, list rows, counters, and toolbar controls need stable dimensions so hover and dynamic states do not shift layout.

Mobile verification should happen in the same implementation pass as desktop verification. The redesign is not complete if the desktop app is polished but the phone layout feels like a compressed fallback.

## Motion

Motion should support hierarchy rather than decorate the app. Suitable motion:

- Small entrance sequencing for the Today Desk and orbit modules.
- Subtle active rail transitions.
- Loading state motion for parse and generation.
- Brief section reveal after generation.
- Hover and focus transitions for controls and rows.

Respect `prefers-reduced-motion`.

## Verification Plan

Implementation should be verified with:

- `npm run build`.
- Browser desktop check.
- Browser mobile-size check.
- Core path walkthrough: add contact, open contact, upload LinkedIn PDF, parse result display, generate prep brief state, contact list, upcoming/calendar, notes, follow-up generation, resume, and job surfaces where reachable.
- Visual checks for no emojis, no visible em dashes, lucide-only icons, text fit, responsive layout, and no nested card clutter.

## Open Decisions

The following details are intentionally deferred to implementation while staying within the approved direction:

- Exact font families.
- Exact hex values for the Midnight Paper palette.
- Final component file split.
- Whether contact detail stays modal-like or becomes a fuller routed-feeling panel within the current app architecture.

These are implementation decisions, not changes to the approved product direction.
