# Clyde — User Flows

## Flow 1: First-Run Experience (Core MVP)

```
Landing Page
│
├─ Chatbox visible immediately
├─ Clyde auto-types welcome message:
│   "Hi, I'm Clyde. I help people learn how to use AI — not by lecturing,
│    but by helping you do real things. To start, just tell me in a few
│    words: what do you have going on today?"
│
├─ User types a response (e.g., "gotta plan my kid's birthday party")
│
├─ Conversational Phase (3–5 turns)
│   ├─ Clyde mirrors tone: "oh nice — how old are they turning?"
│   ├─ Clyde gathers context naturally
│   ├─ Clyde surfaces helpful directions:
│   │   • "I could help you make a checklist"
│   │   • "Want me to compare venue options?"
│   │   • "I can draft the invite text if you want"
│   ├─ Suggestions may appear as inline text or subtle action chips
│   └─ Clyde detects when enough context is gathered
│
├─ Structured Action Phase
│   ├─ Clyde produces something concrete:
│   │   • A checklist, plan, draft, comparison table, etc.
│   ├─ Rendered in a clean card/panel within the chat
│   ├─ User can edit, refine, or ask for changes
│   └─ Feels like a natural continuation, not a mode switch
│
├─ Learn/Discover Transition
│   ├─ Subtle UI cue appears (glow, pulse, arrow)
│   ├─ Two paths offered:
│   │   1. "See how Clyde did that" → explanation of what happened
│   │   2. "Try something else" → new use case suggestions
│   └─ Clicking either opens a new panel/section
│
├─ Explanation State (if user chose "See how Clyde did that")
│   ├─ Shows what Clyde noticed in the conversation
│   ├─ Explains why it suggested a certain direction
│   ├─ Shows how plain language → structured output
│   ├─ Suggests what the user could try next
│   └─ Feels rewarding and confidence-building
│
└─ Flexibility State
    ├─ User can refine the output
    ├─ Branch into a new use case
    ├─ Save the workflow as a recipe/template (future)
    └─ Start from blank (unlocked after first guided success)
```

## Flow 2: Returning User (Future)

```
Landing Page
│
├─ Clyde remembers previous session
├─ "Welcome back — last time we worked on [X]. Want to pick up there, or something new?"
├─ User can continue or start fresh
└─ Saved recipes/templates available
```

## Flow 3: Freeform Exploration (Future)

```
Workspace View
│
├─ Blank canvas + chat sidebar
├─ User can start any task from scratch
├─ Access to saved recipes and templates
├─ Multi-step workflows with editable nodes
└─ Full control for confident users
```

## Conversation Design Rules

### Tone Mirroring
- If user writes "gotta plan a bday party" → Clyde responds casually
- If user writes "I need to organize a client presentation" → Clyde responds more formally
- Clyde never over-corrects tone (no corporate-speak for casual users, no slang for formal users)

### Conversation Length
- Default: 3–5 turns before structured action
- Shorter if: user is direct, context is clear, conversation stalls
- Longer if: user is exploratory, multiple threads emerge

### Transition Detection
Clyde should transition to structured help when:
- It has enough context to produce something useful
- The user repeats information (signal: "I already said that")
- The conversation energy drops (short replies, agreement-only)
- The user explicitly asks for help ("can you make me a list?")

### Suggestion Types
During conversation, Clyde may suggest:
| Category | Examples |
|----------|----------|
| Planning | "Make a plan," "Break this down," "Figure out the order" |
| Organizing | "Create a to-do list," "Sort by priority," "Group these" |
| Comparing | "Compare options," "Pros and cons," "Which is better?" |
| Drafting | "Write a message," "Draft an email," "Help me word this" |
| Deciding | "Think through this decision," "What should I consider?" |
| Researching | "Look into this," "What are my options?" |

Suggestions appear as:
1. Natural language within Clyde's messages
2. Subtle action chips below messages (tappable, not dominant)
