import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  IoSend,
  IoSparkles,
  IoRefreshOutline,
  IoWaterOutline,
  IoArrowForward,
  IoAlertCircleOutline,
  IoCheckmarkCircle
} from "react-icons/io5";
import api from "../../../services/api";
import { useLanguage } from "../../../contexts/LanguageContext";

const INITIAL_QUICK_ACTIONS = [
  { label: "📋 My Booking", text: "My Booking" },
  { label: "💳 Payment & Invoices", text: "Payment" },
  { label: "📄 My Report", text: "My Report" },
  { label: "📍 Track Expert", text: "Track Expert" },
  { label: "📅 Survey Schedule", text: "Survey Schedule" },
  { label: "📞 Support Helpline", text: "Support" }
];

export default function UserSupportChatbot() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      id: "welcome",
      sender: "bot",
      text: "🌊 **Welcome to Jaladhaara Support!**\n\nI am your 24/7 Groundwater Survey Assistant powered by AI. How can I help you today? You can select a quick option below or ask me any question about your booking, payment, depth estimation, or survey reports.",
      buttons: ["My Booking", "Payment", "My Report", "Track Expert", "More Options"],
      links: [
        { text: "View Bookings", url: "/user/status" },
        { text: "Survey Reports", url: "/user/survey-reports" }
      ],
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputText).trim();
    if (!query || loading) return;

    const userMessageId = `user-${Date.now()}`;
    const newMessages = [
      ...messages,
      {
        id: userMessageId,
        sender: "user",
        text: query,
        timestamp: new Date()
      }
    ];

    setMessages(newMessages);
    setInputText("");
    setLoading(true);

    try {
      // Build lightweight conversation history for the backend
      const historyPayload = newMessages.slice(-6).map((m) => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.text
      }));

      const res = await api.post("/support/chat", {
        message: query,
        language: language || "en",
        conversationHistory: historyPayload
      });

      if (res.data?.success && res.data.data) {
        const { reply, links, buttons, isAiPowered } = res.data.data;
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: "bot",
            text: reply,
            links: links || [],
            buttons: buttons || [],
            isAi: isAiPowered,
            timestamp: new Date()
          }
        ]);
      } else {
        throw new Error(res.data?.message || "Invalid server response");
      }
    } catch (err) {
      console.warn("[UserSupportChatbot] Error communicating with support API:", err.message);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: "bot",
          text: "I'm having temporary trouble reaching the AI assistant. You can check your bookings directly or reach our customer helpline at **+91 800-000-0000**.",
          links: [
            { text: "My Bookings", url: "/user/status" },
            { text: "Create Dispute Ticket", url: "/user/disputes/create" }
          ],
          buttons: ["My Booking", "Payment", "Helpline"],
          timestamp: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: "bot",
        text: "🌊 Conversation reset. How can I assist you with your Jaladhaara groundwater survey today?",
        buttons: ["My Booking", "Payment", "My Report", "Track Expert", "More Options"],
        links: [
          { text: "View Bookings", url: "/user/status" },
          { text: "Survey Reports", url: "/user/survey-reports" }
        ],
        timestamp: new Date()
      }
    ]);
  };

  // Helper to render markdown links and bold formatting cleanly
  const renderMessageContent = (text) => {
    if (!text) return null;

    // Split text by newlines
    const lines = text.split("\n");

    return lines.map((line, idx) => {
      // Basic bold formatting **word**
      const boldParts = line.split(/(\*\*[^*]+\*\*)/g);

      return (
        <span key={idx} className="block min-h-[1.2rem]">
          {boldParts.map((part, pIdx) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return (
                <strong key={pIdx} className="font-bold text-slate-900">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return part;
          })}
        </span>
      );
    });
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col transition-all">
      {/* Chatbot Top Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <IoWaterOutline className="text-2xl" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Jaladhaara 24/7 AI Assistant
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-[10px] font-extrabold text-purple-300 flex items-center gap-1">
                <IoSparkles className="text-amber-400 text-xs" />
                <span>Ollama AI</span>
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium">
              Instant Groundwater Survey Guidance &amp; Booking Support
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetChat}
            title="Reset conversation"
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer"
          >
            <IoRefreshOutline className="text-lg" />
          </button>
        </div>
      </div>

      {/* Chat Messages Body */}
      <div className="p-4 sm:p-5 h-[420px] overflow-y-auto space-y-4 bg-slate-50/50">
        {messages.map((msg) => {
          const isUser = msg.sender === "user";
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-xs ${
                  isUser
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-tr-xs"
                    : "bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs"
                }`}
              >
                {/* Bot Tag */}
                {!isUser && (
                  <div className="flex items-center gap-1.5 mb-1.5 text-[11px] font-bold text-purple-700">
                    <IoSparkles className="text-amber-500 text-xs" />
                    <span>Jaladhaara Support</span>
                  </div>
                )}

                {/* Message Text */}
                <div className="space-y-1">{renderMessageContent(msg.text)}</div>

                {/* Rendered Direct Links */}
                {!isUser && msg.links && msg.links.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap gap-2">
                    {msg.links.map((link, lIdx) => (
                      <button
                        key={lIdx}
                        onClick={() => navigate(link.url)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold border border-purple-200 transition-all cursor-pointer"
                      >
                        <span>{link.text}</span>
                        <IoArrowForward className="text-xs" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Bot Quick Buttons / Chips */}
              {!isUser && msg.buttons && msg.buttons.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2 ml-1 max-w-[85%]">
                  {msg.buttons.map((btnLabel, bIdx) => (
                    <button
                      key={bIdx}
                      onClick={() => handleSendMessage(btnLabel)}
                      className="px-3 py-1 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-full text-xs font-semibold text-slate-700 hover:text-indigo-600 transition-all shadow-2xs cursor-pointer"
                    >
                      {btnLabel}
                    </button>
                  ))}
                </div>
              )}

              <span className="text-[10px] text-slate-400 mt-1 px-1">
                {msg.timestamp?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-4 py-3 w-fit shadow-xs">
            <div className="flex space-x-1.5">
              <span className="w-2 h-2 bg-purple-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
            </div>
            <span className="text-xs font-medium text-slate-500">
              Jaladhaara Assistant is typing...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Starting Action Chips */}
      <div className="px-4 py-2 bg-white border-t border-slate-100 overflow-x-auto scrollbar-none flex items-center gap-2">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
          Quick Ask:
        </span>
        {INITIAL_QUICK_ACTIONS.map((action, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(action.text)}
            className="px-3 py-1 bg-slate-100/80 hover:bg-purple-50 hover:border-purple-200 border border-transparent rounded-full text-xs font-medium text-slate-600 hover:text-purple-700 whitespace-nowrap transition-all cursor-pointer"
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(inputText);
        }}
        className="p-3 sm:p-4 bg-white border-t border-slate-200/90 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask anything (e.g. 'How to track my expert?' or 'सर्वे रिपोर्ट कैसे देखें?')..."
          className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-slate-50 rounded-2xl border border-slate-200 focus:outline-none focus:border-purple-500 focus:bg-white text-slate-800 placeholder-slate-400 transition-all"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || loading}
          className="p-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-40 text-white rounded-2xl transition-all shadow-sm cursor-pointer shrink-0"
          title="Send message"
        >
          <IoSend className="text-base" />
        </button>
      </form>
    </div>
  );
}
