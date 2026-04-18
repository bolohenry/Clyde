import {
  ActionChip,
  ConversationState,
  ConversationTone,
  Message,
  StructuredContent,
  SuggestionType,
} from "@/types";
import { getTonePrefix } from "./tone";

let idCounter = 100;
function nextId(): string {
  return `msg-${++idCounter}`;
}

export function generateWelcomeMessage(): Message {
  return {
    id: "welcome-msg",
    role: "clyde",
    text: "Hi, I'm Clyde. I help people learn how to use AI — not by lecturing, but by helping you do real things. To start, just tell me in a few words: what do you have going on today?",
    timestamp: Date.now(),
  };
}

export function generateConversationResponse(
  state: ConversationState
): Message {
  const userMessages = state.messages.filter((m) => m.role === "user");
  const lastUserMsg = userMessages[userMessages.length - 1];
  if (!lastUserMsg) {
    return makeClydeMessage("What's on your plate today?");
  }

  const text = lastUserMsg.text.toLowerCase();
  const tone = state.detectedTone;
  const turnCount = state.turnCount;

  if (turnCount === 1) {
    return generateFirstFollowUp(text, tone, state.userContext);
  }
  if (turnCount === 2) {
    return generateSecondFollowUp(text, tone, state.userContext);
  }
  return generateLaterFollowUp(text, tone, state.userContext, turnCount);
}

function generateFirstFollowUp(
  userText: string,
  tone: ConversationTone,
  contexts: string[]
): Message {
  const prefix = getTonePrefix(tone);
  const punct = tone.formality === "casual" ? " —" : ".";

  // Only fire context-specific follow-ups when the user is clearly asking for help,
  // not just mentioning something in passing. Check for intent signals.
  const hasHelpIntent = /\b(help|need|want|how|plan|make|figure|sort|decide|stuck|unsure|trying)\b/.test(userText);

  if (hasHelpIntent) {
    if (contexts.includes("event planning")) {
      return makeClydeMessage(
        `${prefix}${punct} what kind of event? and roughly how far out is it?`
      );
    }
    if (contexts.includes("work task")) {
      return makeClydeMessage(
        `${prefix}${punct} what's the main thing you need to get done?`
      );
    }
    if (contexts.includes("travel planning")) {
      return makeClydeMessage(
        `${prefix}${punct} where are you headed? still in the planning stage or more like packing-stage?`
      );
    }
    if (contexts.includes("purchase decision")) {
      return makeClydeMessage(
        `${prefix}${punct} what are you looking at buying? do you have some options already or starting from scratch?`
      );
    }
    if (contexts.includes("decision making")) {
      return makeClydeMessage(
        `${prefix}${punct} what's the decision? what's making it hard?`
      );
    }
  }

  // Neutral, open follow-up that doesn't assume they want help
  const openFollowUps = [
    `${prefix}${punct} what else is going on today?`,
    `${prefix}${punct} anything on your plate that's been nagging at you?`,
    `${prefix}${punct} how's everything else going?`,
    `${prefix}${punct} what's the rest of your day looking like?`,
  ];
  const pick = openFollowUps[Math.floor(Math.random() * openFollowUps.length)];
  return makeClydeMessage(pick);
}

function generateSecondFollowUp(
  userText: string,
  tone: ConversationTone,
  contexts: string[]
): Message {
  const prefix = getTonePrefix(tone);
  const punct = tone.formality === "casual" ? " —" : ".";

  const helpOffers = getSuggestionsForContexts(contexts, tone);

  return makeClydeMessage(
    `${prefix}${punct} ok I think I'm getting the picture. ${helpOffers.text}`,
    helpOffers.chips
  );
}

function generateLaterFollowUp(
  userText: string,
  tone: ConversationTone,
  contexts: string[],
  turnCount: number
): Message {
  const connectors =
    tone.formality === "casual"
      ? ["alright", "ok cool", "got it", "perfect"]
      : ["Great", "Understood", "That helps", "Good to know"];
  const connector = connectors[Math.floor(Math.random() * connectors.length)];

  const suggestions = getPrimarySuggestion(contexts);

  return makeClydeMessage(
    `${connector} — I have a good sense of what you're dealing with. ${suggestions.text}`,
    suggestions.chips
  );
}

function getSuggestionsForContexts(
  contexts: string[],
  tone: ConversationTone
): { text: string; chips: ActionChip[] } {
  const ctx = contexts[0] || "general task";

  const suggestions: Record<string, { text: string; chips: ActionChip[] }> = {
    "event planning": {
      text: "I could help you put together a checklist, figure out what to do first, or compare some options. What would be most useful?",
      chips: [
        { id: "chip-todo", label: "Make a checklist", type: "todo", icon: "✅" },
        { id: "chip-plan", label: "Plan it out", type: "plan", icon: "📋" },
        { id: "chip-compare", label: "Compare options", type: "compare", icon: "⚖️" },
      ],
    },
    "work task": {
      text: "I could help you break that down into steps, prioritize what matters most, or draft something. What sounds right?",
      chips: [
        { id: "chip-breakdown", label: "Break it down", type: "breakdown", icon: "🔍" },
        { id: "chip-prioritize", label: "Prioritize", type: "prioritize", icon: "🎯" },
        { id: "chip-draft", label: "Draft something", type: "draft", icon: "✏️" },
      ],
    },
    "travel planning": {
      text: "I could help you make a packing list, compare destinations or flights, or plan out your itinerary. What would help most?",
      chips: [
        { id: "chip-todo", label: "Packing list", type: "todo", icon: "🧳" },
        { id: "chip-compare", label: "Compare options", type: "compare", icon: "⚖️" },
        { id: "chip-plan", label: "Plan itinerary", type: "plan", icon: "🗺️" },
      ],
    },
    "purchase decision": {
      text: "Want me to help you compare your options side by side, or figure out what matters most to you in this decision?",
      chips: [
        { id: "chip-compare", label: "Compare options", type: "compare", icon: "⚖️" },
        { id: "chip-decide", label: "Think it through", type: "decide", icon: "🤔" },
        { id: "chip-breakdown", label: "Break down features", type: "breakdown", icon: "🔍" },
      ],
    },
    communication: {
      text: "I can help you draft the message, figure out the right tone, or outline what you want to say first. What sounds helpful?",
      chips: [
        { id: "chip-draft", label: "Draft the message", type: "draft", icon: "✏️" },
        { id: "chip-plan", label: "Outline first", type: "plan", icon: "📋" },
        { id: "chip-breakdown", label: "Figure out the tone", type: "breakdown", icon: "🎭" },
      ],
    },
    "meal planning": {
      text: "I could make you a meal plan, put together a grocery list, or help you decide what to cook tonight. What's most useful?",
      chips: [
        { id: "chip-plan", label: "Meal plan", type: "plan", icon: "🍽️" },
        { id: "chip-todo", label: "Grocery list", type: "todo", icon: "🛒" },
        { id: "chip-decide", label: "Decide tonight's dinner", type: "decide", icon: "🤔" },
      ],
    },
    "family logistics": {
      text: "I could help you organize the schedule, make a to-do list, or figure out the priorities. What would take the most off your plate?",
      chips: [
        { id: "chip-organize", label: "Organize schedule", type: "organize", icon: "📅" },
        { id: "chip-todo", label: "To-do list", type: "todo", icon: "✅" },
        { id: "chip-prioritize", label: "Prioritize", type: "prioritize", icon: "🎯" },
      ],
    },
    "financial planning": {
      text: "I could help you set up a budget, compare costs, or break down what you're spending. Where should we start?",
      chips: [
        { id: "chip-plan", label: "Make a budget", type: "plan", icon: "💰" },
        { id: "chip-compare", label: "Compare costs", type: "compare", icon: "⚖️" },
        { id: "chip-breakdown", label: "Break down spending", type: "breakdown", icon: "📊" },
      ],
    },
    scheduling: {
      text: "I can help you sort that into a schedule, prioritize what's important, or just make a clean list. What would help?",
      chips: [
        { id: "chip-organize", label: "Make a schedule", type: "organize", icon: "📅" },
        { id: "chip-prioritize", label: "Prioritize", type: "prioritize", icon: "🎯" },
        { id: "chip-todo", label: "Clean list", type: "todo", icon: "✅" },
      ],
    },
    "decision making": {
      text: "Want me to help you lay out the pros and cons, or just organize what you know so far?",
      chips: [
        { id: "chip-compare", label: "Pros and cons", type: "compare", icon: "⚖️" },
        { id: "chip-organize", label: "Organize thoughts", type: "organize", icon: "💭" },
        { id: "chip-next", label: "Next steps", type: "next-steps", icon: "➡️" },
      ],
    },
  };

  return (
    suggestions[ctx] || {
      text: "I could help you make a plan, break things down, or create a to-do list. What would be most useful right now?",
      chips: [
        { id: "chip-plan", label: "Make a plan", type: "plan", icon: "📋" },
        { id: "chip-breakdown", label: "Break it down", type: "breakdown", icon: "🔍" },
        { id: "chip-todo", label: "To-do list", type: "todo", icon: "✅" },
      ],
    }
  );
}

function getPrimarySuggestion(contexts: string[]): {
  text: string;
  chips: ActionChip[];
} {
  return {
    text: "Want me to put something together for you? I can make a plan, a list, or help you think it through — just say the word.",
    chips: [
      { id: "chip-go", label: "Let's do it", type: "plan", icon: "🚀" },
      { id: "chip-todo", label: "Make me a list", type: "todo", icon: "✅" },
      { id: "chip-compare", label: "Help me decide", type: "compare", icon: "⚖️" },
    ],
  };
}


export function generateStructuredOutput(
  state: ConversationState,
  actionType: SuggestionType
): Message {
  const userMessages = state.messages
    .filter((m) => m.role === "user")
    .map((m) => m.text);
  const combinedContext = userMessages.join(" ");
  const contexts = state.userContext;
  const tone = state.detectedTone;

  const structured = buildStructuredContent(actionType, contexts, combinedContext);
  const introText = getStructuredIntroText(actionType, tone);

  return {
    id: nextId(),
    role: "clyde",
    text: introText,
    timestamp: Date.now(),
    structured,
  };
}

function getStructuredIntroText(
  actionType: SuggestionType,
  tone: ConversationTone
): string {
  const casual = tone.formality === "casual";

  const intros: Record<SuggestionType, string> = {
    plan: casual
      ? "here's a plan based on what you told me:"
      : "Here's a plan based on what you've shared:",
    prioritize: casual
      ? "here's how I'd prioritize things:"
      : "Here's a suggested priority order:",
    todo: casual
      ? "here's your to-do list:"
      : "Here's a to-do list based on our conversation:",
    compare: casual
      ? "here's a comparison to help you decide:"
      : "Here's a comparison of your options:",
    draft: casual
      ? "here's a draft for you:"
      : "Here's a draft based on what you described:",
    breakdown: casual
      ? "here's how I'd break that down:"
      : "Here's a breakdown of the key parts:",
    organize: casual
      ? "here's everything organized:"
      : "Here's an organized view of what you described:",
    decide: casual
      ? "here's what I'd think about:"
      : "Here are the key considerations:",
    "next-steps": casual
      ? "here's what I'd do next:"
      : "Here are the suggested next steps:",
  };

  return intros[actionType];
}

function buildStructuredContent(
  actionType: SuggestionType,
  contexts: string[],
  userText: string
): StructuredContent {
  const ctx = contexts[0] || "general task";

  switch (actionType) {
    case "todo":
    case "organize":
      return buildChecklist(ctx, userText);
    case "plan":
    case "next-steps":
      return buildPlan(ctx, userText);
    case "compare":
    case "decide":
      return buildComparison(ctx, userText);
    case "draft":
      return buildDraft(ctx, userText);
    case "breakdown":
    case "prioritize":
      return buildBreakdown(ctx, userText);
    default:
      return buildPlan(ctx, userText);
  }
}

function buildChecklist(ctx: string, userText: string): StructuredContent {
  const checklists: Record<string, StructuredContent> = {
    "event planning": {
      type: "checklist",
      title: "Event Checklist",
      items: [
        { id: "c1", text: "Set a date and time", checked: false },
        { id: "c2", text: "Choose a venue or location", checked: false },
        { id: "c3", text: "Create guest list", checked: false },
        { id: "c4", text: "Send invitations", checked: false },
        { id: "c5", text: "Plan food and drinks", checked: false },
        { id: "c6", text: "Decorations and supplies", checked: false },
        { id: "c7", text: "Plan activities or entertainment", checked: false },
        { id: "c8", text: "Confirm RSVPs", checked: false },
      ],
    },
    "work task": {
      type: "checklist",
      title: "Task Checklist",
      items: [
        { id: "c1", text: "Clarify the goal and deadline", checked: false },
        { id: "c2", text: "Gather materials and info needed", checked: false },
        { id: "c3", text: "Outline the main deliverable", checked: false },
        { id: "c4", text: "Do the core work", checked: false },
        { id: "c5", text: "Review and refine", checked: false },
        { id: "c6", text: "Share or submit", checked: false },
      ],
    },
    "travel planning": {
      type: "checklist",
      title: "Travel Checklist",
      items: [
        { id: "c1", text: "Book flights/transportation", checked: false },
        { id: "c2", text: "Reserve accommodation", checked: false },
        { id: "c3", text: "Check passport/documents", checked: false },
        { id: "c4", text: "Plan daily itinerary", checked: false },
        { id: "c5", text: "Pack essentials", checked: false },
        { id: "c6", text: "Arrange pet/house sitting", checked: false },
        { id: "c7", text: "Download offline maps", checked: false },
      ],
    },
  };

  return (
    checklists[ctx] || {
      type: "checklist" as const,
      title: "To-Do List",
      items: [
        { id: "c1", text: "Define what done looks like", checked: false },
        { id: "c2", text: "List everything involved", checked: false },
        { id: "c3", text: "Pick the most important thing", checked: false },
        { id: "c4", text: "Do that first", checked: false },
        { id: "c5", text: "Then move to the next", checked: false },
      ],
    }
  );
}

function buildPlan(ctx: string, userText: string): StructuredContent {
  const plans: Record<string, StructuredContent> = {
    "event planning": {
      type: "plan",
      title: "Event Plan",
      items: [
        {
          id: "p1",
          text: "Phase 1: Lock in the basics",
          subItems: ["Pick a date", "Decide on venue", "Set a rough budget"],
        },
        {
          id: "p2",
          text: "Phase 2: People and invites",
          subItems: ["Finalize guest list", "Send invitations", "Track RSVPs"],
        },
        {
          id: "p3",
          text: "Phase 3: Details",
          subItems: ["Food and drinks", "Decorations", "Activities"],
        },
        {
          id: "p4",
          text: "Phase 4: Day-of",
          subItems: ["Setup timeline", "Delegate tasks", "Enjoy it"],
        },
      ],
    },
    "work task": {
      type: "plan",
      title: "Action Plan",
      items: [
        {
          id: "p1",
          text: "Step 1: Get clear on the goal",
          subItems: ["What does success look like?", "Who needs this and when?"],
        },
        {
          id: "p2",
          text: "Step 2: Gather what you need",
          subItems: ["Information", "Materials", "Input from others"],
        },
        {
          id: "p3",
          text: "Step 3: Do the work",
          subItems: ["Start with the hardest part", "Time-box each piece"],
        },
        {
          id: "p4",
          text: "Step 4: Review and ship",
          subItems: ["Self-review", "Get feedback if needed", "Submit"],
        },
      ],
    },
  };

  return (
    plans[ctx] || {
      type: "plan" as const,
      title: "Your Plan",
      items: [
        {
          id: "p1",
          text: "Step 1: Clarify what you want",
          subItems: ["What's the end goal?", "What would make this feel done?"],
        },
        {
          id: "p2",
          text: "Step 2: Break it into pieces",
          subItems: ["List everything involved", "Group related items"],
        },
        {
          id: "p3",
          text: "Step 3: Prioritize",
          subItems: [
            "What matters most?",
            "What has a deadline?",
            "What's quick to knock out?",
          ],
        },
        {
          id: "p4",
          text: "Step 4: Take action",
          subItems: ["Start with the top priority", "Check off as you go"],
        },
      ],
    }
  );
}

function buildComparison(ctx: string, userText: string): StructuredContent {
  return {
    type: "comparison",
    title: "Options Comparison",
    items: [
      {
        id: "opt1",
        text: "Option A",
        subItems: [
          "Pro: Usually the simpler choice",
          "Pro: Less time commitment",
          "Con: Might not be exactly what you want",
        ],
        pro: true,
      },
      {
        id: "opt2",
        text: "Option B",
        subItems: [
          "Pro: More tailored to what you described",
          "Pro: Better long-term",
          "Con: Takes more effort upfront",
        ],
        pro: true,
      },
    ],
  };
}

function buildDraft(ctx: string, userText: string): StructuredContent {
  return {
    type: "draft",
    title: "Draft",
    items: [
      {
        id: "d1",
        text: "Hi — I wanted to reach out about what we discussed. I've been thinking it over and here's where I'm at:\n\nI think the best path forward is to [specific action]. This way we can [benefit] without [downside].\n\nLet me know what you think, and we can go from there.\n\nThanks!",
      },
    ],
  };
}

function buildBreakdown(ctx: string, userText: string): StructuredContent {
  return {
    type: "breakdown",
    title: "Breakdown",
    items: [
      {
        id: "b1",
        text: "The big picture",
        subItems: [
          "What you're really trying to do",
          "Why it matters right now",
        ],
      },
      {
        id: "b2",
        text: "The moving parts",
        subItems: ["People involved", "Decisions to make", "Things to do"],
      },
      {
        id: "b3",
        text: "What to focus on first",
        subItems: [
          "The thing that unblocks everything else",
          "The quick win that builds momentum",
        ],
      },
    ],
  };
}


function makeClydeMessage(text: string, chips?: ActionChip[]): Message {
  return {
    id: nextId(),
    role: "clyde",
    text,
    timestamp: Date.now(),
    chips,
  };
}
