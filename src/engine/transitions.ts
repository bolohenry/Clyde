import { ConversationState, Message } from "@/types";

export function shouldTransition(state: ConversationState): boolean {
  if (state.turnCount >= 5) return true;
  if (state.turnCount >= 3 && hasEnoughContext(state)) return true;
  if (state.turnCount >= 2 && isConversationStalling(state)) return true;
  if (userRequestedAction(state)) return true;
  return false;
}

function hasEnoughContext(state: ConversationState): boolean {
  return state.userContext.length >= 2;
}

function isConversationStalling(state: ConversationState): boolean {
  const userMessages = state.messages.filter((m) => m.role === "user");
  if (userMessages.length < 2) return false;
  const last = userMessages[userMessages.length - 1];
  const prev = userMessages[userMessages.length - 2];
  if (last.text.length < 15 && prev.text.length < 15) return true;
  const agreementPatterns = /^(yes|yeah|yep|ok|sure|right|exactly|correct|mhm|uh huh|yea)[\s.!]*$/i;
  if (agreementPatterns.test(last.text.trim())) return true;
  return false;
}

function userRequestedAction(state: ConversationState): boolean {
  const lastUserMsg = [...state.messages].reverse().find((m) => m.role === "user");
  if (!lastUserMsg) return false;
  const text = lastUserMsg.text.toLowerCase();
  const actionPhrases = [
    "can you help", "make me a", "create a", "help me",
    "give me a", "let's do", "let's make", "do that",
    "sounds good", "yes please", "go ahead", "let's go",
    "make a list", "make a plan", "write a", "draft a",
  ];
  return actionPhrases.some((phrase) => text.includes(phrase));
}

export function extractUserContext(message: Message): string[] {
  const text = message.text.toLowerCase();
  const contexts: string[] = [];

  const topicPatterns: [RegExp, string][] = [
    [/\b(birthday|party|celebration|event)\b/, "event planning"],
    [/\b(meeting|presentation|work|project|client|deadline)\b/, "work task"],
    [/\b(trip|travel|vacation|flight|hotel)\b/, "travel planning"],
    [/\b(move|apartment|house|rent|mortgage)\b/, "housing decision"],
    [/\b(buy|purchase|shop|compare|price)\b/, "purchase decision"],
    [/\b(email|message|text|write|respond|reply)\b/, "communication"],
    [/\b(cook|recipe|dinner|meal|grocery|food)\b/, "meal planning"],
    [/\b(exercise|gym|workout|health|doctor)\b/, "health & wellness"],
    [/\b(school|class|study|learn|homework)\b/, "learning"],
    [/\b(budget|money|finance|pay|bill|save)\b/, "financial planning"],
    [/\b(organize|clean|declutter|sort)\b/, "organizing"],
    [/\b(kids?|child|children|family|parent)\b/, "family logistics"],
    [/\b(schedule|calendar|plan|agenda)\b/, "scheduling"],
    [/\b(decide|choice|option|pick|choose)\b/, "decision making"],
  ];

  for (const [pattern, context] of topicPatterns) {
    if (pattern.test(text)) {
      contexts.push(context);
    }
  }

  if (contexts.length === 0) {
    contexts.push("general task");
  }

  return contexts;
}
