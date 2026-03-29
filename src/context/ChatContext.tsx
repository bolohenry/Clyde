"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useReducer,
  useRef,
} from "react";
import {
  ChatAction,
  ConversationState,
  Message,
  SuggestionType,
} from "@/types";
import { conversationReducer, initialState } from "@/engine/conversation";
import { analyzeTone } from "@/engine/tone";
import { extractUserContext, shouldTransition } from "@/engine/transitions";
import {
  generateConversationResponse,
  generateExplanation,
  generateStructuredOutput,
} from "@/engine/responses";

interface ChatContextValue {
  state: ConversationState;
  dispatch: React.Dispatch<ChatAction>;
  sendMessage: (text: string) => void;
  selectChipAction: (action: SuggestionType) => void;
  showExplanation: () => void;
  tryAnotherUseCase: () => void;
  startFreeform: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(conversationReducer, initialState);
  const processingRef = useRef(false);

  const simulateTyping = useCallback(
    (message: Message, delay: number = 800) => {
      const typingMsg: Message = {
        ...message,
        text: "",
        isTyping: true,
      };
      dispatch({ type: "ADD_MESSAGE", message: typingMsg });

      const actualDelay = delay + Math.random() * 500;
      setTimeout(() => {
        dispatch({
          type: "UPDATE_MESSAGE",
          id: message.id,
          updates: {
            text: message.text,
            isTyping: false,
            chips: message.chips,
            structured: message.structured,
          },
        });
      }, actualDelay);
    },
    [dispatch]
  );

  const sendMessage = useCallback(
    (text: string) => {
      if (processingRef.current) return;
      processingRef.current = true;

      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        text,
        timestamp: Date.now(),
      };
      dispatch({ type: "ADD_MESSAGE", message: userMessage });
      dispatch({ type: "INCREMENT_TURN" });

      const contexts = extractUserContext(userMessage);
      contexts.forEach((ctx) =>
        dispatch({ type: "ADD_CONTEXT", context: ctx })
      );

      const userMessages = [
        ...state.messages.filter((m) => m.role === "user").map((m) => m.text),
        text,
      ];
      const tone = analyzeTone(userMessages);
      dispatch({ type: "SET_TONE", tone });

      const newState: ConversationState = {
        ...state,
        messages: [...state.messages, userMessage],
        turnCount: state.turnCount + 1,
        userContext: [...new Set([...state.userContext, ...contexts])],
        detectedTone: tone,
      };

      if (state.phase === "welcome") {
        dispatch({ type: "SET_PHASE", phase: "conversation" });
        newState.phase = "conversation";
      }

      // In flexible mode, keep responding conversationally
      if (
        state.phase === "flexible" ||
        state.phase === "explanation" ||
        state.phase === "structured"
      ) {
        newState.phase = "conversation";
        newState.turnCount = 1;
        dispatch({ type: "SET_PHASE", phase: "conversation" });
        dispatch({ type: "SHOW_TRANSITION_CUE", show: false });
        dispatch({ type: "SHOW_EXPLANATION", show: false });
      }

      setTimeout(() => {
        if (
          shouldTransition(newState) &&
          newState.phase === "conversation"
        ) {
          dispatch({ type: "SET_PHASE", phase: "transition" });
          const response = generateConversationResponse(newState);
          simulateTyping(response, 1000);

          setTimeout(() => {
            dispatch({ type: "SHOW_TRANSITION_CUE", show: true });
          }, 2500);
        } else {
          const response = generateConversationResponse(newState);
          simulateTyping(response, 800);
        }
        processingRef.current = false;
      }, 500);
    },
    [state, dispatch, simulateTyping]
  );

  const selectChipAction = useCallback(
    (action: SuggestionType) => {
      dispatch({ type: "SELECT_ACTION", action });
      dispatch({ type: "SET_PHASE", phase: "structured" });
      dispatch({ type: "SHOW_TRANSITION_CUE", show: false });

      const newState = {
        ...state,
        selectedAction: action,
      };

      setTimeout(() => {
        const output = generateStructuredOutput(newState, action);
        simulateTyping(output, 1200);

        setTimeout(() => {
          dispatch({ type: "SHOW_TRANSITION_CUE", show: true });
        }, 3000);
      }, 300);
    },
    [state, dispatch, simulateTyping]
  );

  const showExplanation = useCallback(() => {
    dispatch({ type: "SET_PHASE", phase: "explanation" });
    dispatch({ type: "SHOW_TRANSITION_CUE", show: false });
    dispatch({ type: "SHOW_EXPLANATION", show: true });

    setTimeout(() => {
      dispatch({ type: "COMPLETE_FIRST_FLOW" });
    }, 300);
  }, [dispatch]);

  const tryAnotherUseCase = useCallback(() => {
    dispatch({ type: "SET_PHASE", phase: "flexible" });
    dispatch({ type: "SHOW_TRANSITION_CUE", show: false });
    dispatch({ type: "SHOW_EXPLANATION", show: false });
    dispatch({ type: "COMPLETE_FIRST_FLOW" });

    const msg: Message = {
      id: `clyde-flex-${Date.now()}`,
      role: "clyde",
      text: "Nice — you've got the hang of it. What else do you have going on? I can help with pretty much anything: planning, deciding, drafting, organizing, comparing options... just tell me what's on your mind.",
      timestamp: Date.now(),
    };

    setTimeout(() => {
      simulateTyping(msg, 800);
    }, 300);
  }, [dispatch, simulateTyping]);

  const startFreeform = useCallback(() => {
    dispatch({ type: "SET_PHASE", phase: "flexible" });
    dispatch({ type: "SHOW_TRANSITION_CUE", show: false });
  }, [dispatch]);

  return (
    <ChatContext.Provider
      value={{
        state,
        dispatch,
        sendMessage,
        selectChipAction,
        showExplanation,
        tryAnotherUseCase,
        startFreeform,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
}
