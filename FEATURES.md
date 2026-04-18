# Clyde — Features to Build

## 1. Refine the Output
**What:** After Clyde generates a plan, checklist, or draft, let the user ask for changes in plain language — "make this shorter," "add more detail to step 2," "rewrite this for my boss." The output regenerates in place instead of starting a new conversation.

**Why:** Right now the output is take-it-or-leave-it. Refinement turns Clyde from a one-shot tool into an actual collaborator.

**Rough scope:**
- Add a "Refine..." text input below each structured output card
- Pass the original output + refinement request back to the LLM with a targeted prompt
- Animate the card updating in place (no full page reload)

---

## 2. Export to PDF
**What:** A "Download as PDF" button on any structured output — checklist, plan, comparison, or draft. Formatted cleanly, not just a browser print.

**Why:** People want to actually use what Clyde made. Saving it, printing it, or emailing it to someone requires a real file.

**Rough scope:**
- Use a client-side PDF library (e.g. `jspdf` or `@react-pdf/renderer`)
- Match Clyde's visual style — title, items, Clyde branding at the bottom
- Works offline, no server round-trip needed

---

## 4. Smarter Follow-Up Suggestions
**What:** After completing a flow, Clyde suggests *specific* next steps based on what just happened — not generic prompts. After a trip checklist → "draft a packing list" or "make a day-by-day itinerary." After a priority list → "turn the top 3 into a plan."

**Why:** The current `WhatElseCanAI` panel is generic. Contextual suggestions dramatically increase the chance users go deeper instead of closing the tab.

**Rough scope:**
- Map each `SuggestionType` + detected context to 2–3 follow-up suggestions
- Render them as tappable chips below the explanation panel
- Clicking one pre-fills the input or triggers the action directly

---

## 8. Image & File Input
**What:** Let users paste a screenshot, upload a photo, or attach a document and have Clyde reason about it. "Here's my to-do list screenshot — help me prioritize." "Here's the email I received — help me draft a reply."

**Why:** A huge share of the things people actually need help with aren't typed from scratch — they already exist somewhere. Meeting this users where they are is a step-change in usefulness.

**Rough scope:**
- Add paste/drag-and-drop support to the chat input
- Images → send to LLM via vision API (GPT-4o supports this)
- PDFs/text files → extract text client-side, inject into conversation context
- Show a thumbnail preview in the input before sending

---

## 9. Shareable Output Links
**What:** Generate a unique URL for any structured output so users can send it to someone else. No account needed — a short-lived public link that renders the card in a clean read-only view.

**Why:** Sharing is the main viral loop. If someone sends a Clyde-generated plan to a friend or colleague, that's a new user acquisition with zero ad spend.

**Rough scope:**
- On "Share," POST the output content to a simple API endpoint, store with a UUID key (Vercel KV or similar)
- Return a short URL (`clyde.app/s/abc123`) that renders a static read-only page
- Links expire after 7 days to keep storage manageable

---

## 10. Analytics
**What:** Basic event tracking to understand what's actually working — which use cases get completed, where users drop off, which outputs get copied or shared, and how many people return.

**Why:** Zero visibility right now. Without data, every product decision is a guess.

**Suggested events to track:**
- `conversation_started`
- `structured_output_generated` (with `type` and `use_case`)
- `output_copied` / `output_shared` / `output_exported`
- `explanation_viewed`
- `flow_completed` (first flow vs. repeat)
- `start_over_clicked`
- `session_restored` (returned user)

**Rough scope:**
- Add [Plausible](https://plausible.io) (privacy-friendly, no cookie banner needed) or PostHog
- One script tag + a thin `track()` wrapper used across the app
- No PII collected — just event names and properties

---

## New Logo
**What:** Replace the current text-based "C" favicon with a proper Clyde logo — a mark that works at small sizes (favicon, app icon) and large sizes (header, share cards).

**Directions to explore:**
- A speech bubble with a spark or lightning bolt inside (AI + conversation)
- A friendly abstract "C" mark with the clyde-blue (`#0c87f0`) as the primary color
- Something that reads as warm and approachable, not corporate or techy

**Deliverables needed:**
- SVG mark (scalable, for header and og:image)
- 32×32 favicon
- 180×180 Apple touch icon
- `og:image` (1200×630) for link previews

---

## "Let Me Google That For You"
**What:** When Clyde recognizes that a user needs to look something up — a product, a price, a local service, a how-to — it generates a pre-filled Google search URL and surfaces it as a tappable link. The user just clicks and hits Enter. Like the classic [lmgtfy.com](https://lmgtfy.app) but genuinely useful and context-aware.

**Example:** User says "I need to find a good plumber in Austin." Clyde responds with its usual help, and also shows: 🔍 [Search: "best-reviewed plumbers Austin TX"](https://google.com/search?q=best+reviewed+plumbers+Austin+TX)

**Why:** Clyde is good at structuring thinking but can't browse the web. Rather than pretending otherwise or leaving users stranded, this hands off gracefully — and feels like a helpful nudge rather than a dead end.

**Rough scope:**
- Clyde (or the LLM prompt) detects when a response would benefit from a real-world lookup
- Generate a tight, specific search query (not just the raw user input — an optimized version)
- Render it as a small pill/chip below the message: a magnifying glass icon + the query text, linking to `https://google.com/search?q=...`
- Could also offer alternatives: Google Maps for local businesses, YouTube for tutorials, Reddit for opinions
