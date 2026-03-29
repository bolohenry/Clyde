"use client";

import { useChatContext } from "@/context/ChatContext";
import { motion, AnimatePresence } from "framer-motion";

export default function ExplanationPanel() {
  const { state, tryAnotherUseCase } = useChatContext();

  if (!state.explanationVisible) return null;

  const contexts = state.userContext;
  const action = state.selectedAction || "plan";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-lg mt-4 mb-4"
      >
        <div className="rounded-2xl bg-gradient-to-br from-clyde-50 to-white border border-clyde-200 overflow-hidden">
          <div className="px-6 py-4 bg-clyde-500">
            <h3 className="text-white font-semibold text-base">
              How Clyde did that
            </h3>
            <p className="text-clyde-100 text-sm mt-0.5">
              A peek behind the curtain
            </p>
          </div>

          <div className="px-6 py-5 space-y-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-base">👀</span>
                <h4 className="text-sm font-semibold text-surface-800">
                  What I noticed
                </h4>
              </div>
              <p className="text-sm text-surface-600 leading-relaxed ml-7">
                From your messages, I picked up on{" "}
                {contexts.length > 0
                  ? contexts.map((c, i) => (
                      <span key={c}>
                        {i > 0 && i < contexts.length - 1 && ", "}
                        {i > 0 && i === contexts.length - 1 && " and "}
                        <span className="font-medium text-clyde-600">{c}</span>
                      </span>
                    ))
                  : "what you had going on"}
                . That context is what helped me figure out how to help.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-base">🎯</span>
                <h4 className="text-sm font-semibold text-surface-800">
                  Why I suggested a {action}
                </h4>
              </div>
              <p className="text-sm text-surface-600 leading-relaxed ml-7">
                Based on what you described, turning it into a{" "}
                <span className="font-medium">{action}</span> seemed like the
                most practical next step. AI is really good at taking fuzzy
                thoughts and organizing them into something clear.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-base">⚡</span>
                <h4 className="text-sm font-semibold text-surface-800">
                  The key insight
                </h4>
              </div>
              <p className="text-sm text-surface-600 leading-relaxed ml-7">
                You don't need to write a perfect prompt. You just described your
                day in normal words, and AI turned that into something useful.
                That's the whole trick — start with real context, and let AI
                structure it.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-base">🚀</span>
                <h4 className="text-sm font-semibold text-surface-800">
                  What to try next
                </h4>
              </div>
              <p className="text-sm text-surface-600 leading-relaxed ml-7">
                Now that you've seen how this works, try it with something else.
                AI can help with drafting messages, comparing options, making
                decisions, breaking down problems — pretty much any thinking task.
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={tryAnotherUseCase}
              className="w-full mt-2 px-4 py-3 rounded-xl bg-clyde-500 text-white
                text-sm font-semibold hover:bg-clyde-600 transition-colors
                duration-150 flex items-center justify-center gap-2"
            >
              <span>✨</span>
              Try another use case
            </motion.button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
