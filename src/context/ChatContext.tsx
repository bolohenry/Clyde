"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useReducer,
  useRef,
  useState,
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
import { usePersistence, loadPersistedState, clearPersistedState } from "@/hooks/usePersistence";

interface ChatContextValue {
  state: ConversationState;
  dispatch: React.Dispatch<ChatAction>;
  sendMessage: (text: string) => void;
  selectChipAction: (action: SuggestionType) => void;
  showExplanation: () => void;
  tryAnotherUseCase: () => void;
  startFreeform: () => void;
  retryLastMessage: () => void;
  resetConversation: () => void;
  hasSavedConversation: boolean;
  pendingInput: string;
  setPendingInput: (text: string) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

let msgCounter = 200;
function nextMsgId(): string {
  return `msg-${++msgCounter}`;
}

// Consume SSE stream from /api/chat and call onDelta for each text chunk.
// Returns the full accumulated text, or null if LLM not available.
async function streamLLM(
  history: { role: "user" | "assistant"; content: string }[],
  onDelta: (text: string) => void,
  onError: (code: Message["errorCode"], message: string) => void
): Promise<string | null> {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history }),
    });

    if (!res.ok || !res.body) {
      // Non-streaming error (e.g. 500 from missing API key)
      const data = await res.json().catch(() => ({}));
      if (data.code === "no_api_key") {
        onError("no_api_key", ""); // triggers silent fallback
        return null;
      }
      onError("llm_error", data.error || "Request failed");
      return null;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let accumulated = "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const raw = line.slice(6).trim();
        if (!raw) continue;

        let event: { type: string; text?: string; code?: string; message?: string };
        try {
          event = JSON.parse(raw);
        } catch {
          continue;
        }

        if (event.type === "delta" && event.text) {
          accumulated += event.text;
          onDelta(accumulated);
        } else if (event.type === "error") {
          onError(
            (event.code as Message["errorCode"]) ?? "llm_error",
            event.message ?? "Something went wrong."
          );
          return null;
        } else if (event.type === "done") {
          break;
        }
      }
    }

    return accumulated || null;
  } catch {
    onError("network", "Network error — check your connection.");
    return null;
  }
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  // Lazy init — reads localStorage exactly once on mount
  const [state, dispatch] = useReducer(conversationReducer, initialState, () => {
    const saved = typeof window !== "undefined" ? loadPersistedState() : null;
    return saved ?? initialState;
  });
  // Computed once: did we restore a previous conversation on mount?
  const [hasSavedConversation] = useState(
    () =>
      typeof window !== "undefined"
        ? (loadPersistedState()?.messages?.length ?? 0) > 0
        : false
  );
  const [pendingInput, setPendingInput] = useState("");
  usePersistence(state);
  const processingRef = useRef(false);
  const llmAvailableRef = useRef<boolean | null>(null);
  // Client-side cooldown: minimum 1.5s between sends
  const lastSendTimeRef = useRef(0);
  // Store last user message text + history for retry
  const lastUserMsgRef = useRef<string | null>(null);
  const lastHistoryRef = useRef<{ role: "user" | "assistant"; content: string }[]>([]);
  const lastReplyIdRef = useRef<string | null>(null);

  const getConversationHistory = useCallback(
    (extraUserMsg?: string) => {
      const history: { role: "user" | "assistant"; content: string }[] = [];
      for (const m of state.messages) {
        if (m.isTyping || m.isError) continue;
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

  const setMessageError = useCallback(
    (id: string, code: Message["errorCode"], message: string) => {
      dispatch({
        type: "UPDATE_MESSAGE",
        id,
        updates: { text: message, isTyping: false, isError: true, errorCode: code },
      });
    },
    [dispatch]
  );

  // Core reply logic: try streaming LLM, fall back to mock
  const generateReply = useCallback(
    async (
      replyId: string,
      history: { role: "user" | "assistant"; content: string }[],
      currentState: ConversationState
    ) => {
      const llmResult = await streamLLM(
        history,
        (accumulated) => {
          // Stream each delta into the message
          dispatch({
            type: "UPDATE_MESSAGE",
            id: replyId,
            updates: { text: accumulated, isTyping: false },
          });
        },
        (code, message) => {
          // No API key = silent fallback, other errors = show error state
          if (code === "no_api_key" || code === undefined) {
            llmAvailableRef.current = false;
          } else {
            setMessageError(replyId, code, message);
            processingRef.current = false;
          }
        }
      );

      if (llmResult) {
        llmAvailableRef.current = true;
        const parsed = parseResponse(llmResult);
        finishMessage(replyId, parsed.text, { structured: parsed.structured });

        if (parsed.structured) {
          dispatch({ type: "SET_PHASE", phase: "structured" });
          setTimeout(() => dispatch({ type: "SHOW_TRANSITION_CUE", show: true }), 2000);
        } else if (shouldTransition(currentState)) {
          dispatch({ type: "SET_PHASE", phase: "transition" });
          setTimeout(() => dispatch({ type: "SHOW_TRANSITION_CUE", show: true }), 1500);
        }
        processingRef.current = false;
        return;
      }

      if (llmAvailableRef.current === false) {
        // Use mocked fallback
        setTimeout(() => {
          if (shouldTransition(currentState) && currentState.phase === "conversation") {
            dispatch({ type: "SET_PHASE", phase: "transition" });
            const response = generateConversationResponse(currentState);
            finishMessage(replyId, response.text, { chips: response.chips });
            setTimeout(() => dispatch({ type: "SHOW_TRANSITION_CUE", show: true }), 1500);
          } else {
            const response = generateConversationResponse(currentState);
            finishMessage(replyId, response.text, { chips: response.chips });
          }
          processingRef.current = false;
        }, 800 + Math.random() * 500);
      } else {
        // Error was shown — don't keep processing flag locked
        processingRef.current = false;
      }
    },
    [dispatch, finishMessage, setMessageError]
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (processingRef.current) return;
      const now = Date.now();
      if (now - lastSendTimeRef.current < 1500) return; // 1.5s cooldown
      lastSendTimeRef.current = now;
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
      contexts.forEach((ctx) => dispatch({ type: "ADD_CONTEXT", context: ctx }));

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
      lastReplyIdRef.current = replyId;
      addTypingMessage(replyId);

      const history = getConversationHistory(text);
      lastUserMsgRef.current = text;
      lastHistoryRef.current = history;

      const newTurnCount = state.turnCount + 1;
      const projectedState: ConversationState = {
        ...state,
        messages: [...state.messages, userMessage],
        turnCount: newTurnCount,
        userContext: [...new Set([...state.userContext, ...contexts])],
        detectedTone: tone,
        phase: "conversation",
      };

      await generateReply(replyId, history, projectedState);
    },
    [state, dispatch, addTypingMessage, getConversationHistory, generateReply]
  );

  const retryLastMessage = useCallback(async () => {
    if (processingRef.current || !lastReplyIdRef.current) return;
    processingRef.current = true;

    const replyId = lastReplyIdRef.current;
    // Reset error state → back to typing indicator
    dispatch({
      type: "UPDATE_MESSAGE",
      id: replyId,
      updates: { text: "", isTyping: true, isError: false, errorCode: undefined },
    });

    const projectedState: ConversationState = {
      ...state,
      phase: state.phase === "welcome" ? "conversation" : state.phase,
    };

    await generateReply(replyId, lastHistoryRef.current, projectedState);
  }, [state, dispatch, generateReply]);

  // Progressive insight tips — shown after the 2nd, 3rd, 4th+ use cases
  const INSIGHT_TIPS = [
    "Notice something? You didn't write a special prompt. Just described what was going on — that's the whole skill.",
    "You're using AI the way it was meant to work: real context in, clear structure out. No templates needed.",
    "Each time you do this, you're building a new reflex. Most people never figure this out.",
  ];

  const maybeInjectInsight = useCallback(
    (useCaseIndex: number) => {
      // useCaseIndex is the 0-based index AFTER recording this use case
      // Show tip on 2nd (index 1), 3rd (index 2), cap at last tip
      if (useCaseIndex < 1) return;
      const tipIndex = Math.min(useCaseIndex - 1, INSIGHT_TIPS.length - 1);
      const tip = INSIGHT_TIPS[tipIndex];
      setTimeout(() => {
        dispatch({
          type: "ADD_MESSAGE",
          message: {
            id: `insight-${Date.now()}`,
            role: "clyde",
            text: tip,
            timestamp: Date.now(),
            isInsight: true,
          },
        });
      }, 3200);
    },
    [dispatch] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const selectChipAction = useCallback(
    async (action: SuggestionType) => {
      dispatch({ type: "SELECT_ACTION", action });
      dispatch({ type: "SET_PHASE", phase: "structured" });
      dispatch({ type: "SHOW_TRANSITION_CUE", show: false });

      // Track before the await so we capture current count
      const useCaseIndexAfter = state.triedUseCases.includes(action)
        ? state.triedUseCases.length
        : state.triedUseCases.length + 1;

      const replyId = nextMsgId();
      lastReplyIdRef.current = replyId;
      addTypingMessage(replyId);

      const onSuccess = (text: string, structured?: import("@/types").StructuredContent) => {
        finishMessage(replyId, text, { structured });
        dispatch({ type: "COMPLETE_USE_CASE", action });
        maybeInjectInsight(useCaseIndexAfter);
        setTimeout(() => dispatch({ type: "SHOW_TRANSITION_CUE", show: true }), 2000);
      };

      if (llmAvailableRef.current !== false) {
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
        lastHistoryRef.current = history;

        const llmResult = await streamLLM(
          history,
          (accumulated) => {
            dispatch({
              type: "UPDATE_MESSAGE",
              id: replyId,
              updates: { text: accumulated, isTyping: false },
            });
          },
          (code, message) => {
            if (code === "no_api_key") {
              llmAvailableRef.current = false;
            } else {
              setMessageError(replyId, code, message);
            }
          }
        );

        if (llmResult) {
          llmAvailableRef.current = true;
          const parsed = parseResponse(llmResult);
          onSuccess(parsed.text, parsed.structured);
          return;
        }

        // onError callback may have set this to false — re-check
        if ((llmAvailableRef.current as boolean | null) !== false) return;
      }

      // Fallback to mocked
      setTimeout(() => {
        const output = generateStructuredOutput(
          { ...state, selectedAction: action },
          action
        );
        onSuccess(output.text, output.structured);
      }, 1200);
    },
    [state, dispatch, addTypingMessage, finishMessage, setMessageError, getConversationHistory, maybeInjectInsight]
  );

  const showExplanation = useCallback(() => {
    dispatch({ type: "SET_PHASE", phase: "explanation" });
    dispatch({ type: "SHOW_TRANSITION_CUE", show: false });
    dispatch({ type: "SHOW_EXPLANATION", show: true });
    dispatch({ type: "COMPLETE_FIRST_FLOW" });
    dispatch({ type: "INCREMENT_FLOWS" });
  }, [dispatch]);

  const tryAnotherUseCase = useCallback(async () => {
    dispatch({ type: "SET_PHASE", phase: "flexible" });
    dispatch({ type: "SHOW_TRANSITION_CUE", show: false });
    dispatch({ type: "SHOW_EXPLANATION", show: false });
    dispatch({ type: "COMPLETE_FIRST_FLOW" });
    dispatch({ type: "INCREMENT_FLOWS" });

    const replyId = nextMsgId();
    lastReplyIdRef.current = replyId;
    addTypingMessage(replyId);

    if (llmAvailableRef.current !== false) {
      const history = getConversationHistory();
      history.push({
        role: "user",
        content:
          "[The user wants to try another use case. Invite them to tell you what else they have going on. Be warm and brief.]",
      });
      lastHistoryRef.current = history;

      const llmResult = await streamLLM(
        history,
        (accumulated) => {
          dispatch({
            type: "UPDATE_MESSAGE",
            id: replyId,
            updates: { text: accumulated, isTyping: false },
          });
        },
        (code, message) => {
          if (code === "no_api_key") {
            llmAvailableRef.current = false;
          } else {
            setMessageError(replyId, code, message);
          }
        }
      );

      if (llmResult) {
        llmAvailableRef.current = true;
        finishMessage(replyId, llmResult.trim());
        return;
      }

      // onError callback may have set this to false — re-check
      if ((llmAvailableRef.current as boolean | null) !== false) return;
    }

    setTimeout(() => {
      finishMessage(
        replyId,
        "Nice — you've got the hang of it. What else do you have going on? I can help with pretty much anything: planning, deciding, drafting, organizing, comparing options... just tell me what's on your mind."
      );
    }, 800);
  }, [dispatch, addTypingMessage, finishMessage, setMessageError, getConversationHistory]);

  const startFreeform = useCallback(() => {
    dispatch({ type: "SET_PHASE", phase: "flexible" });
    dispatch({ type: "SHOW_TRANSITION_CUE", show: false });
  }, [dispatch]);

  const resetConversation = useCallback(() => {
    clearPersistedState();
    dispatch({ type: "RESET" });
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
        retryLastMessage,
        resetConversation,
        hasSavedConversation,
        pendingInput,
        setPendingInput,
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
