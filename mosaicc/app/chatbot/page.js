"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
export default function Chatbot() {
  const [messages, setMessages] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("chatHistory");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatWindowRef = useRef(null);
  const typingIntervalRef = useRef(null);

  // Save chat history to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("chatHistory", JSON.stringify(messages));
    }
  }, [messages]);

  // Clear chat history
  const clearHistory = () => {
    setMessages([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem("chatHistory");
    }
  };

  // Cleanup typing interval on unmount
  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    };
  }, []);

  // Auto-scroll to the bottom when new messages are added
  useEffect(() => {
    const chatWindow = chatWindowRef.current;
    if (!chatWindow || messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.sender === "bot") {
      chatWindow.scrollTo({
        top: chatWindow.scrollHeight,
        behavior: "auto",
      });
    }
  }, [messages]);

  // Stop message generation
  const stopGeneration = () => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
      setIsTyping(false);
    }
  };

  // Send message to the bot
  const sendMessage = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = { sender: "user", text: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsTyping(true);

    const conversation = updatedMessages.map((msg) => ({
      role: msg.sender === "user" ? "user" : "assistant",
      content: msg.text,
    }));

    try {
      const res = await fetch("/api/groq/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: conversation }),
      });

      const data = await res.json();

      if (data.result) {
        simulateTyping(data.result);
      } else {
        setMessages((prev) => [...prev, { sender: "bot", text: "No response" }]);
        setIsTyping(false);
      }
    } catch (error) {
      setMessages((prev) => [...prev, { sender: "bot", text: "Error" }]);
      setIsTyping(false);
    }
  };

  // Simulate typing effect for bot messages
  const simulateTyping = (text) => {
    let index = 0;
    let typedText = "";

    setMessages((prev) => [...prev, { sender: "bot", text: "" }]);

    typingIntervalRef.current = setInterval(() => {
      if (index >= text.length) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
        setIsTyping(false);
        return;
      }

      typedText += text[index];
      setMessages((prev) => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1].text = typedText;
        return newMessages;
      });
      index++;
    }, 20);
  };

  // Handle Enter key press
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !isTyping) sendMessage();
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <Link href={"/"}><h1 className="text-xl font-bold">Mosaicc</h1></Link>
        <button
          onClick={clearHistory}
          className="px-3 py-2 text-sm font-medium rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
        >
          Clear History
        </button>
      </div>

      {/* Messages Window */}
      <div
        ref={chatWindowRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800"
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-xl p-4 rounded-2xl ${
                msg.sender === "user"
                  ? "bg-blue-600 rounded-br-none"
                  : "bg-gray-800 rounded-bl-none"
              }`}
            >
              <p className="text-gray-100">{msg.text}</p>
              <div className="mt-1 text-xs text-gray-400">
                {msg.sender === "user" ? "You" : "Bot"}
              </div>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex items-center space-x-2 text-gray-400">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-gray-800 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isTyping}
            className="flex-1 p-3 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          />

          {isTyping ? (
            <button
              onClick={stopGeneration}
              className="px-6 py-3 font-medium rounded-lg bg-red-600 hover:bg-red-500 transition-colors"
            >
              Stop
            </button>
          ) : (
            <button
              onClick={sendMessage}
              className="px-6 py-3 font-medium rounded-lg bg-blue-600 hover:bg-blue-500 transition-colors"
            >
              Send
            </button>
          )}
        </div>
      </div>
    </div>
  );
}