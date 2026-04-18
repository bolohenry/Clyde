"use client";

import { motion } from "framer-motion";
import { useChatContext } from "@/context/ChatContext";
import { SuggestionType } from "@/types";

interface Suggestion {
  label: string;
  prompt: string;
}

// Maps completed action → context keywords → suggested next prompts
function getSuggestions(action: SuggestionType | null, contexts: string[]): Suggestion[] {
  const ctx = contexts.join(" ").toLowerCase();

  const base: Record<SuggestionType, Suggestion[]> = {
    plan: [
      { label: "Turn it into a checklist", prompt: "Can you turn this plan into a checklist I can tick off?" },
      { label: "Add time estimates", prompt: "Can you add rough time estimates to each step?" },
      { label: "Identify blockers", prompt: "What are the most likely things that could block or slow this down?" },
    ],
    todo: [
      { label: "Prioritize the list", prompt: "Which of these should I tackle first? Help me prioritize." },
      { label: "Break down a task", prompt: "Can you break down the biggest task into smaller steps?" },
      { label: "Estimate time", prompt: "How long do you think each of these will realistically take?" },
    ],
    prioritize: [
      { label: "Make a plan from top 3", prompt: "Let's make a plan for the top 3 priorities." },
      { label: "Delegate what I can", prompt: "Which of these could I realistically delegate or skip?" },
      { label: "Schedule it", prompt: "Help me figure out when to actually do each of these this week." },
    ],
    compare: [
      { label: "Help me decide", prompt: "Based on the comparison, which option do you think I should go with?" },
      { label: "Add another option", prompt: "Let's add another option to compare." },
      { label: "What questions should I ask?", prompt: "What questions should I be asking before making this decision?" },
    ],
    draft: [
      { label: "Make it shorter", prompt: "Can you make this more concise — cut it by about half?" },
      { label: "Make it more formal", prompt: "Can you make the tone more professional?" },
      { label: "Add a subject line", prompt: "Can you suggest a good subject line for this?" },
    ],
    breakdown: [
      { label: "Turn into a plan", prompt: "Can you turn this breakdown into an ordered plan with steps?" },
      { label: "Which part first?", prompt: "Which piece should I tackle first and why?" },
      { label: "Estimate effort", prompt: "How much effort does each part typically take?" },
    ],
    organize: [
      { label: "Make it a checklist", prompt: "Can you format this as a checklist I can work through?" },
      { label: "Group by priority", prompt: "Can you re-organize this by priority — high to low?" },
      { label: "What am I missing?", prompt: "Is there anything important I might have forgotten?" },
    ],
    decide: [
      { label: "What would you do?", prompt: "If you had to pick, what would you do in my situation?" },
      { label: "List the risks", prompt: "What are the main risks of each option?" },
      { label: "Stress-test my choice", prompt: "I'm leaning one way — can you push back on it and tell me what could go wrong?" },
    ],
    "next-steps": [
      { label: "Make it a plan", prompt: "Can you turn these next steps into a full plan?" },
      { label: "What could go wrong?", prompt: "What obstacles might I hit on these next steps?" },
      { label: "Quick wins first", prompt: "Which of these can I actually do today or tomorrow?" },
    ],
  };

  // Context-aware overrides
  if (ctx.includes("travel") || ctx.includes("trip")) {
    return [
      { label: "Packing list", prompt: "Can you make me a packing list for this trip?" },
      { label: "Day-by-day itinerary", prompt: "Can you put together a rough day-by-day itinerary?" },
      { label: "Budget estimate", prompt: "Help me think through a rough budget for this trip." },
    ];
  }
  if (ctx.includes("email") || ctx.includes("message") || ctx.includes("communication")) {
    return [
      { label: "Draft a follow-up", prompt: "Can you draft a follow-up message for after this?" },
      { label: "Make it shorter", prompt: "Can you make this more concise?" },
      { label: "Change the tone", prompt: "Can you make the tone a bit warmer / more direct?" },
    ];
  }
  if (ctx.includes("work") || ctx.includes("project") || ctx.includes("deadline")) {
    return [
      { label: "Build a timeline", prompt: "Can you put together a rough timeline or schedule for this?" },
      { label: "Status update draft", prompt: "Can you draft a quick status update I could send to my team?" },
      { label: "Risk check", prompt: "What are the main risks I should watch out for?" },
    ];
  }

  return action ? (base[action] || base["plan"]) : base["plan"];
}

export default function ContextualFollowUps() {
  const { state, setPendingInput } = useChatContext();

  if (!state.explanationVisible && !state.showTransitionCue) return null;
  if (!state.selectedAction) return null;

  const suggestions = getSuggestions(state.selectedAction, state.userContext);

  const handleClick = (prompt: string) => {
    setPendingInput(prompt);
    window.requestAnimationFrame(() => {
      document.querySelector("[aria-label='Message to Clyde']")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.3 }}
      className="mx-auto max-w-lg mt-3 px-1"
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-2">
        What to do next
      </p>
      <div className="flex flex-wrap gap-1.5">
        {suggestions.map((s, i) => (
          <motion.button
            key={s.label}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.45 + i * 0.07, duration: 0.2 }}
            onClick={() => handleClick(s.prompt)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full
              text-[12px] font-medium border transition-all duration-150 group
              text-surface-600 dark:text-surface-300
              bg-[var(--surface-card-alt)] border-[var(--surface-border)]
              hover:border-clyde-300 dark:hover:border-clyde-700
              hover:text-clyde-700 dark:hover:text-clyde-300
              hover:bg-clyde-50 dark:hover:bg-clyde-950/40
              active:scale-95 min-h-[36px]"
          >
            {s.label}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="opacity-40 group-hover:opacity-100">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
