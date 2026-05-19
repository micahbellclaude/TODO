# Weekly & Daily To-Do App — Project Spec

## Overview

A personal productivity web app built for one user (no auth required, direct URL access) that digitizes a journal-based weekly/daily planning system. The app runs in a browser, persists data to a **new dedicated Supabase project**, and works across multiple devices throughout the day.

Stack: **React + Vite**, deployed to **Vercel**. Supabase for cloud persistence with localStorage fallback.

---

## Core Mental Model

The user has two "views" — mirroring a two-page journal spread:

- **Left panel** — context, focus areas, wins, and soft tracking (the "left page")
- **Right panel** — the master weekly task list and daily task list (the "right page")

The week is the primary unit of time. Each week has a history that persists indefinitely.

---

## Data Model

### Week
```
{
  id: uuid,
  start_date: date,        // Monday of the week
  end_date: date,          // Sunday
  status: "active" | "closed",
  left_sections: Section[],
  created_at: timestamp
}
```

### Task
```
{
  id: uuid,
  week_id: uuid,
  title: string,
  estimated_time: string,       // freeform label e.g. "30 min", "1.5 hr"
  estimated_minutes: number,    // parsed from label for math
  actual_minutes: number,       // accumulated from timer
  status: "todo" | "in_progress" | "done" | "waiting" | "removed",
  waiting_note: string,         // e.g. "Waiting to hear from Gaby about what network"
  waiting_since: timestamp,
  on_daily: boolean,
  daily_date: date,             // which day it was assigned to
  carry_from_task_id: uuid,     // if carried over from prior week
  carried_from_date: date,      // original date it was first placed on daily
  timer_started_at: timestamp,
  timer_running: boolean,
  created_at: timestamp,
  completed_at: timestamp,
  sort_order: number
}
```

### Intake Item
```
{
  id: uuid,
  week_id: uuid,
  title: string,
  status: "pending" | "sorted",
  sorted_to_task_id: uuid,
  created_at: timestamp
}
```

### Win
```
{
  id: uuid,
  week_id: uuid,
  client_name: string,
  gross_or_net: "gross" | "net",
  dollar_amount: number,
  campaign_timeframe: string,
  products_used: string,
  created_at: timestamp
}
```

### Left Section
```
{
  id: uuid,
  week_id: uuid,
  type: "wins" | "checkins" | "prospecting" | "sales_meeting" | "custom",
  title: string,
  content: string,             // freeform notes (markdown-friendly)
  prospecting_days: {          // only for type: "prospecting"
    mon: boolean, tue: boolean, wed: boolean,
    thu: boolean, fri: boolean
  },
  sort_order: number
}
```

---

## Layout

### Two-Panel Layout (desktop)
- **Left panel** (~35% width): Left-page sections
- **Right panel** (~65% width): Weekly task list + Daily task list (stacked or tabbed)

### Mobile
- Tab-based navigation: Left | Weekly | Daily

---

## Features

---

### 1. Weekly Task List (Right Panel — Top)

The master list of everything to get done this week.

**Display:**
- Each task row shows: `[ ] Task title | est. time | actual time | status badge`
- If task is "waiting": show a 🕐 or distinct color + the waiting note on hover/expand
- If task is overdue on actual vs estimated: show `(15 min / 30 min ⚠️ 15 min over)` inline
- **Total list time** displayed at top of weekly list: `Projected: 4h 20min | Actual: 2h 05min` — updates live

**Actions per task:**
- Add task (title + optional estimated time)
- Edit title or estimated time inline
- Mark complete
- Delete / remove
- Flag as **Waiting** — opens a small input: "What are you waiting for?" stores note + timestamp
  - After 3 days with no status change, task is visually flagged (color shift, badge: "⏳ 3 days")
- **Start Timer** — starts a running timer on that task
  - Timer persists if you navigate away (stored in DB)
  - **Pause** timer
  - **Edit time manually** (override actual time field)
  - Only one task can have an active timer at a time
- Move to Intake (rare, but possible)

**Waiting Alert:**
- Any waiting task older than 3 days gets a persistent visual flag in the weekly list
- No push notifications needed — visual only

---

### 2. Daily Task List (Right Panel — Bottom or Tab)

A focused list of tasks chosen for today from the weekly list.

**Build Daily List Mode:**
- Triggered manually each morning (or auto-prompted if daily list is empty at start of day)
- Starts with any unfinished tasks from yesterday, pre-populated
- Shows the full weekly list alongside — user taps a task to "send it" to today's list with a smooth animation (card slides/fades over)
- Once satisfied, user exits Build Mode

**Display:**
- Each task shows: title, estimated time, and a subtle "age" indicator if it's been carried over (e.g. a small tag: "from Mon" or "day 3")
- Same timer controls as weekly list (synced — same task object)
- Same actual vs. estimated display

**Daily Reset:**
- Resets at 12:00am — any incomplete tasks are flagged as "carry over"
- New day prompt: "Build your daily list" — pre-loads yesterday's unfinished tasks, user confirms or removes each

---

### 3. Left Panel — Weekly Sections

Rendered as a vertical stack of cards, fully customizable each week.

**Default Template (pre-loaded each new week, editable):**
1. **Wins of the Week** (structured — see below)
2. **Check-Ins** (freeform notes)
3. **Prospecting** (M/T/W/T/F checkboxes)
4. **Sales Meeting** (freeform notes)

User can:
- Add a new custom section (just a title + freeform text area)
- Remove any section
- Reorder sections
- Rename sections

Sections persist within the week. They do not auto-carry to the next week — new week = default template, manually tweaked.

**Wins of the Week (structured fields):**
Each win is a record:
- Client Name
- Gross or Net (toggle)
- Dollar Amount
- Campaign Timeframe
- Products Used

Wins list as cards. Add / edit / delete wins. Display count: `Wins this week: 3`

---

### 4. Intake

A scratchpad area — accessible at all times (small drawer or collapsible panel, or dedicated section).

- Add items fast with no friction (just a text field, hit Enter)
- Items appear as a raw list
- Each item has a "Sort →" button that converts it into a weekly task (opens a small form to add estimated time, etc.) and removes it from Intake
- Intake badge shows count of unsorted items

---

### 5. Weekly Start / New Week Flow

**Triggering a new week:**
- User can manually trigger "Start New Week" at any time (e.g. Friday EOD)
- If not manually triggered, on Monday morning the app prompts: "Start your new week?"
- Both paths go through the same **Weekly Start Flow**

**Weekly Start Flow:**
1. Show all incomplete tasks from previous week
2. For each task, user picks: **Carry over** | **Remove** | **Edit & Carry**
3. Carried tasks appear in the new week's list
4. Left sections reset to default template (pre-populated, editable)
5. New week is created in DB, old week is closed

---

### 6. Timer System

- One active timer at a time (global constraint)
- Timer continues running even if user switches views — persists to DB every 30 seconds
- On return, timer shows elapsed time correctly
- Controls: **Start | Pause | Resume | Stop (mark done)**
- Manual time override: edit the "actual" field directly
- Completed task shows: `Est: 30 min | Actual: 42 min` inline on the row

---

### 7. Week History

- Accessible via a "Past Weeks" dropdown or sidebar nav
- Clicking a past week shows it in read-only mode (all tasks, statuses, left sections, wins)
- No editing of closed weeks

---

### 8. PDF Weekly Report (Export)

Available via a "Export Week Report" button on the current or past week.

**Report includes:**
- Week date range
- All tasks: title, estimated time, actual time, status
- Total projected vs. actual time
- Wins of the Week (all structured fields)
- Prospecting days checked off
- Any other left-side section content
- Intake items that were never sorted (if any)

Format: clean, printable PDF. Single or multi-page depending on content.

---

## Supabase Setup

- New dedicated Supabase project (separate from Prospecting App)
- Tables: `weeks`, `tasks`, `intake_items`, `wins`, `left_sections`
- All accessed via `fetch` with the anon key
- Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- localStorage fallback for offline resilience

---

## Design Direction

- Clean, editorial feel — this is a personal tool, not enterprise software
- Two-panel layout mirrors the physical journal spread
- Subtle animations: daily list build flow (card slides from weekly → daily), task completion (satisfying strike-through or fade)
- Dark or light mode TBD — suggest dark as default (less fatigue across a full work day)
- Mobile responsive (tab-based navigation on small screens)
- Typography: something with personality — not a generic sans-serif
- Color: restrained palette, one strong accent color for active/timer states

---

## Out of Scope (v1)

- Push notifications / email alerts
- Collaboration / sharing
- AI-generated suggestions
- Native mobile app
- Authentication / multi-user

---

## Open Questions Before Build

1. ~~Do you want a **week picker / calendar nav** in the header to jump between past weeks, or just prev/next arrows?~~ **→ Calendar picker in the header that lets you select by week (M–F work weeks only).**
2. ~~For the **Intake panel** — floating drawer, sidebar, or a dedicated section at the bottom of the left panel?~~ **→ Intake should be immediately visible on app open. Implement as a persistent strip or top section of the left panel — always in view, not hidden behind a toggle. Badge showing unsorted count.**
3. ~~Any preference on the **accent color** for active/timer states, or leave that to design judgment?~~ **→ Leave to design judgment.**
