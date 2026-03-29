# Clyde

Learn how to use AI — not through lectures, but by doing real things you already care about.

## What is Clyde?

Clyde is a conversational product for people who are comfortable with technology but haven't adopted generative AI in a meaningful way. Instead of starting with a blank prompt or a course, Clyde starts by asking about your real day — and helps you discover where AI is useful in your life.

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm

### Setup

```bash
npm install
cp .env.example .env.local  # optional, no keys needed for MVP
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm start
```

## Architecture

- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Mocked conversation engine** (swappable for real LLM API)

## Project Structure

```
src/
├── app/          # Next.js App Router pages
├── components/   # React components
├── context/      # React context (chat state machine)
├── engine/       # Conversation engine (responses, tone, transitions)
└── types/        # TypeScript type definitions
docs/
├── product-brief.md
├── user-flows.md
└── mvp-build-plan.md
```

## Product Flow

1. Land on the page — chatbox is already visible
2. Clyde types a welcome message automatically
3. Tell Clyde what you have going on today
4. Have a short, natural conversation
5. Clyde suggests helpful actions (plans, lists, comparisons, drafts)
6. See a structured output based on your conversation
7. Learn how Clyde did it, or try another use case

## Docs

See the `docs/` folder for:
- [Product Brief](docs/product-brief.md)
- [User Flows](docs/user-flows.md)
- [MVP Build Plan](docs/mvp-build-plan.md)
