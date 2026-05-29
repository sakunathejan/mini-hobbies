import { useCallback, useRef, useState } from "react";
import { sendMessage } from "../services/chatService.js";

const useChat = () => {
  const [messages, setMessages] = useState([
    { id: "welcome", role: "bot", text: "Hey there! 👋 I'm MiniBot, your personal collector assistant. Looking for diecast cars, anime figures, or just browsing?", suggestions: ["Hot Wheels under 3000", "Naruto figures", "Best deals", "New arrivals"] }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState({});
  const idCounter = useRef(1);

  const addMessage = useCallback((msg) => {
    setMessages((prev) => [...prev, { ...msg, id: `msg_${idCounter.current++}` }]);
  }, []);

  const handleSend = useCallback(async (text) => {
    if (!text.trim() || loading) return;
    const userMsg = text.trim();
    setInput("");
    addMessage({ role: "user", text: userMsg });
    setLoading(true);
    try {
      const response = await sendMessage(userMsg, context);
      addMessage({ role: "bot", ...response });
      if (response.type === "products") {
        setContext((prev) => ({ ...prev, lastSearch: userMsg }));
      }
    } catch {
      addMessage({ role: "bot", text: "Sorry, I ran into a hiccup. Please try again! 😅", suggestions: ["Try again", "Show products", "Help"] });
    } finally {
      setLoading(false);
    }
  }, [loading, context, addMessage]);

  const clearChat = useCallback(() => {
    setMessages([
      { id: "welcome", role: "bot", text: "Hey there! 👋 I'm MiniBot, your personal collector assistant. Looking for diecast cars, anime figures, or just browsing?", suggestions: ["Hot Wheels under 3000", "Naruto figures", "Best deals", "New arrivals"] }
    ]);
    setContext({});
    idCounter.current = 1;
  }, []);

  return { messages, input, setInput, loading, handleSend, clearChat };
};

export default useChat;
