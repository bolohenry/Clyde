# Clyde — What's Next

## 🔧 Setup Required (Do This First)

These unlock features already in the codebase:

| Task | Where | What to do |
|------|-------|------------|
| Supabase bucket | Supabase dashboard → Storage | Create bucket named `clyde-share`, toggle **Public** on |
| Supabase env vars | Vercel → Settings → Env Vars | Add `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` |
| Vercel KV | Vercel → Storage → Create → KV | Auto-adds `KV_REST_API_URL` + `KV_REST_API_TOKEN` |
| Local env | Terminal | Run `vercel env pull .env.local` to sync vars for dev |

---

## 🚀 High Priority — Polish What's Already Built

### Voice / TTS
- [ ] Test Kokoro on mobile (WASM loading on Safari iOS is flaky — may need fallback handling)
- [ ] Add a Kokoro load progress indicator somewhere subtle (currently loads silently; a first-time user tapping the avatar gets nothing for 10–20s)
- [ ] Confirm auto-play doesn't double-fire if a message is received while Kokoro is still generating the previous one

### File Sharing (`/create`)
- [ ] Add a graceful UI message on `/create` when Supabase isn't configured ("File attachments need a quick setup — text-only links still work")
- [ ] Test the full end-to-end: attach image → create link → open in incognito → Clyde auto-sends and responds to the image
- [ ] Consider adding DOCX support (requires `mammoth` or similar for text extraction)

### `/create` Page UX
- [ ] Add dark mode support (the page is hardcoded light right now)
- [ ] Update placeholder text when only a file is attached — "Optional — add context" makes more sense than "Paste what they said..."

---

## 🧹 Technical Debt / Bugs

- [ ] **`StructuredOutput.tsx` ESLint warning** — `useCallback` has an unnecessary `editedTexts` dependency (line 141). Low risk but noisy.
- [ ] **`<img>` vs `<Image />`** — two places use `<img>` (ChatMessage, ChatInput). Next.js complains. Worth converting for LCP performance.
- [ ] **`sendMessage` in `Chat.tsx` useEffect deps** — ESLint flags it as outer-scope. Suppress with `// eslint-disable-next-line` or wrap `sendMessage` in a ref.
- [ ] **Share link ID collisions** — `Math.random().toString(36).slice(2,9)` gives ~2 billion combos, fine for now but worth swapping for `crypto.randomUUID()` when you have more traffic.

---

## 💡 Feature Ideas (Next Sprint Candidates)

### Sharing
- [ ] `/s/link/[id]` — a proper landing page for `?link=` shares instead of auto-redirecting to the main chat. Lets the recipient preview context before Clyde starts
- [ ] Share expiry display — show "Link expires in X days" on the `/create` done screen
- [ ] Analytics on share links (how often they're opened, used)

### Conversation
- [ ] Conversation export — download chat as PDF or plain text
- [ ] Multi-turn structured output — let users refine a plan/checklist in place rather than starting fresh
- [ ] System prompt customization — let power users set a persona or context that persists across sessions

### Growth
- [ ] PWA manifest + install-to-home-screen support (especially useful on mobile since it already behaves like a native app)
- [ ] OG image for `/create` and `/s/[id]` pages specifically (currently only the home page has one)
- [ ] A proper landing page at `/` when the user is coming from Google (not the current chat-first experience)

---

## 🔒 Security / Reliability (When You Have Real Users)

- [ ] Rate limiting on `/api/upload` and `/api/link` (a bad actor could spam Supabase storage or fill KV)
- [ ] File type validation server-side in `/api/upload` (currently only client-side)
- [ ] Supabase Storage lifecycle rule — auto-delete files older than 30 days to match link TTL
