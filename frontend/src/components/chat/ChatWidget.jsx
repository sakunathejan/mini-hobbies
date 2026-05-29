import { memo, useCallback, useEffect, useRef, useState } from "react";
import useChat from "../../hooks/useChat.js";
import ChatMessage from "./ChatMessage.jsx";

const ChatWidget = memo(() => {
  const [open, setOpen] = useState(false);
  const { messages, input, setInput, loading, handleSend, clearChat } = useChat();
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const onSend = useCallback(() => {
    if (input.trim() && !loading) handleSend(input);
  }, [input, loading, handleSend]);

  const onKeyDown = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }, [onSend]);

  const onSuggestionClick = useCallback((suggestion) => {
    handleSend(suggestion);
  }, [handleSend]);

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden" onClick={() => setOpen(false)} />
      )}
      <div className={`fixed bottom-4 right-4 z-50 flex flex-col transition-all duration-300 ${open ? "h-[600px] w-[380px] md:h-[580px]" : "h-14 w-14"}`}>
        {open ? (
          <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-gray-50 shadow-2xl ring-1 ring-gray-200">
            <div className="flex items-center justify-between bg-amber-800 px-4 py-3 text-white">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-600 text-xs font-bold">M</span>
                <div>
                  <p className="text-sm font-semibold leading-tight">MiniBot</p>
                  <p className="text-[10px] text-amber-200">{loading ? "typing..." : "online"}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={clearChat} className="rounded-lg px-2 py-1 text-xs text-amber-200 transition hover:bg-amber-700 hover:text-white" title="New chat">New</button>
                <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 transition hover:bg-amber-700" title="Close">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 scroll-smooth">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} msg={msg} onSuggestionClick={onSuggestionClick} />
              ))}
              {loading && (
                <div className="flex justify-start px-4">
                  <div className="rounded-2xl rounded-tl-sm bg-white px-4 py-3 shadow-sm ring-1 ring-gray-100">
                    <div className="flex gap-1.5">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-amber-400" style={{ animationDelay: "0ms" }} />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-amber-500" style={{ animationDelay: "150ms" }} />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-amber-600" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="border-t border-gray-200 bg-white px-4 py-3">
              <div className="flex items-center gap-2 rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 transition focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Ask me anything..."
                  className="min-h-[24px] flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
                  maxLength={500}
                  disabled={loading}
                />
                <button onClick={onSend} disabled={loading || !input.trim()} className="shrink-0 rounded-lg bg-amber-800 p-1.5 text-white transition hover:bg-amber-900 disabled:opacity-40">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button onClick={() => setOpen(true)} className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-800 text-white shadow-lg transition hover:bg-amber-900 hover:shadow-xl active:scale-95">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
          </button>
        )}
      </div>
    </>
  );
});

ChatWidget.displayName = "ChatWidget";

export default ChatWidget;
