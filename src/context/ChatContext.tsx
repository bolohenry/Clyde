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
  generateStructuredOutput,
} from "@/engine/responses";
import { parseResponse } from "@/engine/parser";

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

let msgCounter = 200;
function nextMsgId(): string {
  return `msg-${++msgCounter}`;
}

async function callLLM(
  history: { role: "user" | "assistant"; content: string }[]
): Promise<string | null> {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.reply || null;
  } catch {
    return null;
  }
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(conversationReducer, initialState);
  const processingRef = useRef(false);
  const llmAvailableRef = useRef<boolean | null>(null);

  const getConversationHistory = useCallback(
    (extraUserMsg?: string) => {
      const history: { role: "user" | "assistant"; content: string }[] = [];
      for (const m of state.messages) {
        if (m.isTyping) continue;
        if (m.role === "clyde") {
          history.push({ role: "assistant", content: m.text });
        } else {
          history.push({ role: "user", content: m.text });
        }
      }
      if (extraUserMsg) {
        history.push({ role: "user", content: extraUserMsg });
      }
      return history;
    },
    [state.messages]
  );

  const addTypingMessage = useCallback(
    (id: string) => {
      const typingMsg: Message = {
        id,
        role: "clyde",
        text: "",
        isTyping: true,
        timestamp: Date.now(),
      };
      dispatch({ type: "ADD_MESSAGE", message: typingMsg });
    },
    [dispatch]
  );

  const finishMessage = useCallback(
    (id: string, text: string, extras?: Partial<Message>) => {
      dispatch({
        type: "UPDATE_MESSAGE",
        id,
        updates: { text, isTyping: false, ...extras },
      });
    },
    [dispatch]
  );

  const sendMessage = useCallback(
    async (text: string) => {
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

      if (state.phase === "welcome") {
        dispatch({ type: "SET_PHASE", phase: "conversation" });
      }

      if (
        state.phase === "flexible" ||
        state.phase === "explanation" ||
        state.phase === "structured" ||
        state.phase === "transition"
      ) {
        dispatch({ type: "SET_PHASE", phase: "conversation" });
        dispatch({ type: "SET_TURN_COUNT", count: 1 });
        dispatch({ type: "SHOW_TRANSITION_CUE", show: false });
        dispatch({ type: "SHOW_EXPLANATION", show: false });
      }

      const replyId = nextMsgId();
      addTypingMessage(replyId);

      // Try LLM first
      const history = getConversationHistory(text);
      const llmReply = await callLLM(history);

      if (llmReply) {
        llmAvailableRef.current = true;
        const parsed = parseResponse(llmReply);
        finishMessage(replyId, parsed.text, {
          structured: parsed.structured,
        });

        // Check if we should show transition cue
        const newTurnCount = state.turnCount + 1;
        const newState: ConversationState = {
          ...state,
          messages: [...state.messages, userMessage],
          turnCount: newTurnCount,
          userContext: [...new Set([...state.userContext, ...contexts])],
          detectedTone: tone,
          phase: "conversation",
        };

        if (parsed.structured) {
          dispatch({ type: "SET_PHASE", phase: "structured" });
          setTimeout(() => {
            dispatch({ type: "SHOW_TRANSITION_CUE", show: true });
          }, 2000);
        } else if (shouldTransition(newState)) {
          dispatch({ type: "SET_PHASE", phase: "transition" });
          setTimeout(() => {
            dispatch({ type: "SHOW_TRANSITION_CUE", show: true });
          }, 1500);
        }
      } else {
        // Fallback to mocked responses
        llmAvailableRef.current = false;
        const newState: ConversationState = {
          ...state,
          messages: [...state.messages, userMessage],
          turnCount: state.turnCount + 1,
          userContext: [...new Set([...state.userContext, ...contexts])],
          detectedTone: tone,
          phase: state.phase === "welcome" ? "conversation" : state.phase,
        };

        setTimeout(() => {
          if (
            shouldTransition(newState) &&
            newState.phase === "conversation"
          ) {
            dispatch({ type: "SET_PHASE", phase: "transition" });
            const response = generateConversationResponse(newState);
            finishMessage(replyId, response.text, {
              chips: response.chips,
            });
            setTimeout(() => {
              dispatch({ type: "SHOW_TRANSITION_CUE", show: true });
            }, 1500);
          } else {
            const response = generateConversationResponse(newState);
            finishMessage(replyId, response.text, {
              chips: response.chips,
            });
          }
        }, 800 + Math.random() * 500);
      }

      processingRef.current = false;
    },
    [state, dispatch, addTypingMessage, finishMessage, getConversationHistory]
  );

  const selectChipAction = useCallback(
    async (action: SuggestionType) => {
      dispatch({ type: "SELECT_ACTION", action });
      dispatch({ type: "SET_PHASE", phase: "structured" });
      dispatch({ type: "SHOW_TRANSITION_CUE", show: false });

      const replyId = nextMsgId();
      addTypingMessage(replyId);

      if (llmAvailableRef.current) {
        const actionLabels: Record<SuggestionType, string> = {
          plan: "make a plan",
          prioritize: "help me prioritize",
          todo: "make a to-do list",
          compare: "compare my options",
          draft: "draft something",
          breakdown: "break it down",
          organize: "organize this",
          decide: "help me decide",
          "next-steps": "figure out next steps",
        };
        const userRequest = actionLabels[action] || "help me with that";
        const history = getConversationHistory(userRequest);
        const llmReply = await callLLM(history);

        if (llmReply) {
          const parsed = parseResponse(llmReply);
          finishMessage(replyId, parsed.text, {
            structured: parsed.structured,
          });
          setTimeout(() => {
            dispatch({ type: "SHOW_TRANSITION_CUE", show: true });
          }, 2000);
          return;
        }
      }

      // Fallback to mocked
      setTimeout(() => {
        const output = generateStructuredOutput(
          { ...state, selectedAction: action },
          action
        );
        finishMessage(replyId, output.text, {
          structured: output.structured,
        });
        setTimeout(() => {
          dispatch({ type: "SHOW_TRANSITION_CUE", show: true });
        }, 2000);
      }, 1200);
    },
    [state, dispatch, addTypingMessage, finishMessage, getConversationHistory]
  );

  const showExplanation = useCallback(() => {
    dispatch({ type: "SET_PHASE", phase: "explanation" });
    dispatch({ type: "SHOW_TRANSITION_CUE", show: false });
    dispatch({ type: "SHOW_EXPLANATION", show: true });
    dispatch({ type: "COMPLETE_FIRST_FLOW" });
  }, [dispatch]);

  const tryAnotherUseCase = useCallback(async () => {
    dispatch({ type: "SET_PHASE", phase: "flexible" });
    dispatch({ type: "SHOW_TRANSITION_CUE", show: false });
    dispatch({ type: "SHOW_EXPLANATION", show: false });
    dispatch({ type: "COMPLETE_FIRST_FLOW" });

    const replyId = nextMsgId();
    addTypingMessage(replyId);

    if (llmAvailableRef.current) {
      const history = getConversationHistory();
      history.push({
        role: "user",
        content:
          "[The user wants to try another use case. Invite them to tell you what else they have going on. Be warm and brief.]",
      });
      const llmReply = await callLLM(history);
      if (llmReply) {
        finishMessage(replyId, llmReply.trim());
        return;
      }
    }

    setTimeout(() => {
      finishMessage(
        replyId,
        "Nice — you've got the hang of it. What else do you have going on? I can help with pretty much anything: planning, deciding, drafting, organizing, comparing options... just tell me what's on your mind."
      );
    }, 800);
  }, [dispatch, addTypingMessage, finishMessage, getConversationHistory]);

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
