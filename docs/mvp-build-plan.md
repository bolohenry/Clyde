# Clyde — MVP Build Plan

## Architecture

- **Framework:** Next.js 14+ with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State:** React context + useReducer for conversation state machine
- **AI:** Mocked conversation engine (rule-based for MVP; swappable for real LLM later)
- **Deployment:** Vercel-ready

## Project Structure

```
/
├── docs/                    # Product docs
├── src/
│   ├── app/
│   │   ├── layout.tsx       # Root layout, fonts, metadata
│   │   ├── page.tsx         # Landing page (= product entry point)
│   │   └── globals.css      # Global styles + Tailwind
│   ├── components/
│   │   ├── Chat.tsx              # Main chat container
│   │   ├── ChatMessage.tsx       # Individual message bubble
│   │   ├── ChatInput.tsx         # Text input area
│   │   ├── TypingIndicator.tsx   # Clyde "typing..." animation
│   │   ├── ActionChips.tsx       # Suggested action chips
│   │   ├── StructuredOutput.tsx  # Rendered plans/lists/drafts
│   │   ├── TransitionCue.tsx     # Learn/discover glow/pulse
│   │   ├── ExplanationPanel.tsx  # "How Clyde did that" panel
│   │   └── Header.tsx            # Minimal header/branding
│   ├── engine/
│   │   ├── conversation.ts       # Conversation state machine
│   │   ├── responses.ts          # Mocked response generation
│   │   ├── tone.ts               # Tone analysis + mirroring
│   │   └── transitions.ts        # Transition detection logic
│   ├── context/
│   │   └── ChatContext.tsx        # React context for chat state
│   └── types/
│       └── index.ts              # Shared TypeScript types
├── public/
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── .env.example
└── README.md
```

## Implementation Order

### Phase 1: Foundation
1. Initialize Next.js project with TypeScript + Tailwind
2. Define TypeScript types (Message, ConversationState, Phase, etc.)
3. Build ChatContext with state machine (phases: welcome → conversation → structured → learn → flexible)
4. Build conversation engine with mocked responses

### Phase 2: Core UI
5. Build Chat container component
6. Build ChatMessage with sender-aware styling
7. Build ChatInput with auto-focus and submit handling
8. Build TypingIndicator animation
9. Wire up landing page: chatbox visible, Clyde auto-types welcome

### Phase 3: Conversation Flow
10. Implement tone mirroring in response engine
11. Implement ActionChips for inline suggestions
12. Implement transition detection logic
13. Build StructuredOutput for plans, lists, comparisons, drafts

### Phase 4: Learn & Discover
14. Build TransitionCue (glow/pulse animation)
15. Build ExplanationPanel ("how Clyde did that")
16. Wire transition from structured output to learn/discover

### Phase 5: Flexibility
17. Add ability to refine structured output
18. Add "try something else" flow
19. Add freeform mode (unlocked after first guided success)

### Phase 6: Polish
20. Responsive design pass
21. Animation timing and easing
22. Accessibility (keyboard nav, screen reader basics)
23. Final copy pass

## In Scope for MVP

- Landing page with embedded chatbox
- Auto-typed welcome message from Clyde
- Conversational back-and-forth (3–5 turns, mocked)
- Tone mirroring (basic: casual vs. formal detection)
- Inline action chip suggestions
- Structured output rendering (checklist, plan, draft)
- Learn/discover transition UI
- Explanation panel
- Refine and "try something else" flows
- Mobile-responsive layout

## Out of Scope for MVP (Future)

- Real LLM API integration
- User accounts / authentication
- Persistent conversation history
- Saved recipes/templates/workflows
- Multi-step editable workflow builder
- Connected accounts (calendar, email, etc.)
- Analytics and tracking
- Push notifications
- Native mobile apps

## Dependencies

| Package | Purpose |
|---------|---------|
| next | Framework |
| react / react-dom | UI |
| typescript | Type safety |
| tailwindcss | Styling |
| @tailwindcss/typography | Prose styling for structured output |
| framer-motion | Animations (typing, transitions, glow) |

## Environment Variables

None required for MVP (all mocked). `.env.example` included for future LLM API key.
