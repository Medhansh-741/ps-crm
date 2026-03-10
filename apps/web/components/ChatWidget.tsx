"use client";

import React, { useState, useRef, useCallback } from "react";
import { MessageCircle } from "lucide-react";
import ChatPanel from "@/components/ChatPanel";

/* ------------------------------------------------------------------ */
/*  Component - Wrapper for ChatPanel with Floating Button            */
/* ------------------------------------------------------------------ */

export default function ChatWidget() {
  /* ----- state ----- */
  const [isOpen, setIsOpen] = useState(false);

  /* ----- refs ----- */
  const fabRef = useRef<HTMLButtonElement>(null);

  /* ----- open / close callbacks ----- */
  const openChat = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <>
      {/* ---- Floating Action Button ---- */}
      {!isOpen && (
        <button
          ref={fabRef}
          onClick={openChat}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#4f392e] text-white shadow-lg transition-transform hover:scale-110 active:scale-95 dark:bg-purple-600"
          aria-label="Open chat assistant"
        >
          <MessageCircle size={26} />
        </button>
      )}

      {/* ---- Chat Panel ---- */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 h-[520px] w-[380px] max-h-[85vh] max-w-[calc(100vw-2rem)]">
          <ChatPanel onClose={closeChat} />
        </div>
      )}
    </>
  );
}
