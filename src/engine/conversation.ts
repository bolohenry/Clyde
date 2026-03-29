import { ChatAction, ConversationState, ConversationTone } from "@/types";

export const initialState: ConversationState = {
  phase: "welcome",
  messages: [],
  turnCount: 0,
  userContext: [],
  detectedTone: { formality: "neutral", energy: "medium", brevity: "normal" },
  selectedAction: null,
  showTransitionCue: false,
  explanationVisible: false,
  hasCompletedFirstFlow: false,
};

export function conversationReducer(
  state: ConversationState,
  action: ChatAction
): ConversationState {
  switch (action.type) {
    case "ADD_MESSAGE":
      return {
        ...state,
        messages: [...state.messages, action.message],
      };

    case "UPDATE_MESSAGE":
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.id ? { ...m, ...action.updates } : m
        ),
      };

    case "SET_PHASE":
      return {
        ...state,
        phase: action.phase,
      };

    case "INCREMENT_TURN":
      return {
        ...state,
        turnCount: state.turnCount + 1,
      };

    case "SET_TURN_COUNT":
      return {
        ...state,
        turnCount: action.count,
      };

    case "ADD_CONTEXT":
      return {
        ...state,
        userContext: [...new Set([...state.userContext, action.context])],
      };

    case "SET_TONE":
      return {
        ...state,
        detectedTone: action.tone,
      };

    case "SELECT_ACTION":
      return {
        ...state,
        selectedAction: action.action,
      };

    case "SHOW_TRANSITION_CUE":
      return {
        ...state,
        showTransitionCue: action.show,
      };

    case "SHOW_EXPLANATION":
      return {
        ...state,
        explanationVisible: action.show,
      };

    case "COMPLETE_FIRST_FLOW":
      return {
        ...state,
        hasCompletedFirstFlow: true,
      };

    case "RESET":
      return initialState;

    default:
      return state;
  }
}
