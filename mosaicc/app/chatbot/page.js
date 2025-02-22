"use client";

import { useState, useEffect, useRef } from "react";

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

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("chatHistory", JSON.stringify(messages));
    }
  }, [messages]);

  const clearHistory = () => {
    setMessages([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem("chatHistory");
    }
  };

  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    };
  }, []);

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

  const stopGeneration = () => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
      setIsTyping(false);
    }
  };

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

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !isTyping) sendMessage();
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h1>Chat</h1>
        <button onClick={clearHistory} title="Clear history">
          Clear
        </button>
      </div>
      
      <div ref={chatWindowRef} className="messages-window">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
            <div className="message-content">
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="typing-indicator">
            <div>...</div>
          </div>
        )}
      </div>
      
      <div className="input-area">
        <input
          type="text"
          className="chat-input"
          placeholder="Type message"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isTyping}
        />
        {isTyping ? (
          <button onClick={stopGeneration} className="stop-button">
            Stop
          </button>
        ) : (
          <button onClick={sendMessage} className="send-button">
            Send
          </button>
        )}
      </div>
    </div>
  );
}