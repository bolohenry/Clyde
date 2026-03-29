export type MessageRole = "clyde" | "user";

export type SuggestionType =
  | "plan"
  | "prioritize"
  | "todo"
  | "compare"
  | "draft"
  | "breakdown"
  | "organize"
  | "decide"
  | "next-steps";

export interface ActionChip {
  id: string;
  label: string;
  type: SuggestionType;
  icon?: string;
}

export interface StructuredContent {
  type: "checklist" | "plan" | "comparison" | "draft" | "breakdown";
  title: string;
  items: StructuredItem[];
}

export interface StructuredItem {
  id: string;
  text: string;
  checked?: boolean;
  subItems?: string[];
  pro?: boolean;
}

export interface Message {
  id: string;
  role: MessageRole;
  text: string;
  timestamp: number;
  chips?: ActionChip[];
  structured?: StructuredContent;
  isTyping?: boolean;
}

export type ConversationPhase =
  | "welcome"
  | "conversation"
  | "transition"
  | "structured"
  | "learn"
  | "explanation"
  | "flexible";

export interface ConversationTone {
  formality: "casual" | "neutral" | "formal";
  energy: "low" | "medium" | "high";
  brevity: "terse" | "normal" | "verbose";
}

export interface ConversationState {
  phase: ConversationPhase;
  messages: Message[];
  turnCount: number;
  userContext: string[];
  detectedTone: ConversationTone;
  selectedAction: SuggestionType | null;
  showTransitionCue: boolean;
  explanationVisible: boolean;
  hasCompletedFirstFlow: boolean;
}

export type ChatAction =
  | { type: "ADD_MESSAGE"; message: Message }
  | { type: "UPDATE_MESSAGE"; id: string; updates: Partial<Message> }
  | { type: "SET_PHASE"; phase: ConversationPhase }
  | { type: "INCREMENT_TURN" }
  | { type: "ADD_CONTEXT"; context: string }
  | { type: "SET_TONE"; tone: ConversationTone }
  | { type: "SELECT_ACTION"; action: SuggestionType }
  | { type: "SHOW_TRANSITION_CUE"; show: boolean }
  | { type: "SHOW_EXPLANATION"; show: boolean }
  | { type: "COMPLETE_FIRST_FLOW" }
  | { type: "RESET" };
