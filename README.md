# Networking OS ☕

An AI-powered coffee chat tracker. Add contacts, parse their LinkedIn profiles, generate prep briefs, write follow-up messages, and schedule chats + reminders directly to Google Calendar.

## Features

- **Contact tracker** — add people with name, role, company, and status
- **LinkedIn parser** — paste raw LinkedIn text and the AI extracts their summary, experience, education, skills, and inferred interests
- **AI prep brief** — generates tailored questions, talking points, and conversation starters
- **Follow-up writer** — generates a personalized post-chat follow-up message you can edit
- **Calendar scheduling** — creates 3 events: the coffee chat, a next-day follow-up reminder, and a 30-day check-in
- **Persistent storage** — contacts saved to localStorage (swap for a real DB when ready)

## Stack

- React + Vite
- Anthropic Claude API (claude-sonnet-4)
- Google Calendar (via backend or direct API)
- localStorage for persistence

## Getting Started

```bash
npm install
npm run dev
```

## Environment Variables

Create a `.env` file:

```
VITE_ANTHROPIC_API_KEY=your_key_here
```

> **Important:** Never expose your Anthropic API key in client-side code in production. Route API calls through a backend (Next.js API routes, Express, Supabase Edge Functions, etc.).

## Calendar Integration

In `src/App.jsx`, the `handleSchedule` function currently opens Google Calendar in a new tab. To make calendar scheduling fully automatic:

1. Set up a backend endpoint (e.g. `/api/schedule`)
2. Use the Google Calendar API with OAuth2 credentials
3. Call your endpoint from `handleSchedule`

The data passed to `handleSchedule` includes everything you need:
- `contact` — name, role, company
- `chatTime` — "10:00"
- `followUpDate` — day after the chat
- `checkInDate` — 30 days after the chat

## Project Structure

```
src/
  App.jsx              # Root component, routing, state
  index.css            # Global styles + CSS variables
  main.jsx             # Entry point
  components/
    UI.jsx             # Shared components (Button, Input, Avatar, etc.)
    ContactList.jsx    # Contact and Upcoming list views
    ContactDetail.jsx  # Contact detail sheet with all 4 tabs
  lib/
    ai.js              # Claude API calls + prompt definitions
    storage.js         # localStorage persistence
    utils.js           # Helpers (initials, formatDate, etc.)
```

## Deploying

Works great on Vercel, Netlify, or any static host. Just add your environment variables.

```bash
npm run build
```

## Future Ideas

- Supabase backend for multi-device sync
- Email send integration (send follow-ups directly)
- Reminder notifications via email/SMS
- Import contacts from CSV
- Tag/filter contacts by industry or goal
