import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  IoArrowBack,
  IoSend,
  IoSparkles,
  IoRefreshOutline,
  IoWaterOutline,
  IoArrowForward,
  IoCallOutline,
  IoCardOutline,
  IoReceiptOutline,
  IoCalendarOutline,
  IoLocationOutline,
  IoDocumentTextOutline,
  IoHeadsetOutline,
  IoStarOutline,
  IoPersonOutline,
  IoShieldCheckmarkOutline,
  IoCloudUploadOutline,
  IoNavigateOutline
} from "react-icons/io5";
import api from "../../../services/api";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useVendorAuth } from "../../../contexts/VendorAuthContext";
import logoImg from "@/modules/landing/assets/logo.png";

const INITIAL_QUICK_ACTIONS = [
  { label: "📋 Assigned Bookings", text: "My Bookings" },
  { label: "💰 Wallet & Payouts", text: "Wallet" },
  { label: "📄 Upload Report", text: "Upload Report" },
  { label: "📜 Expert Agreement", text: "Agreement" },
  { label: "⚖️ Partner Disputes", text: "Disputes" },
  { label: "📞 Expert Helpline", text: "Support" }
];

const getActionCardIcon = (iconName) => {
  switch (iconName) {
    case "card":
      return <IoCardOutline />;
    case "invoice":
      return <IoReceiptOutline />;
    case "booking":
    case "calendar":
      return <IoCalendarOutline />;
    case "location":
      return <IoLocationOutline />;
    case "document":
      return <IoDocumentTextOutline />;
    case "star":
      return <IoStarOutline />;
    case "support":
      return <IoHeadsetOutline />;
    default:
      return <IoWaterOutline />;
  }
};

const buildWelcomeMessage = (expertName) => {
  const expertDisplayName = expertName
    ? (/\bexpert\b/i.test(expertName.trim()) ? expertName.trim() : `Expert ${expertName.trim()}`)
    : 'Expert';

  return {
    id: "welcome",
    sender: "bot",
    text: expertName
      ? `🌊 **Welcome ${expertDisplayName} to Jaladhaara 24/7 AI Partner Support!**\n\nI am your dedicated field and technical assistant. Ask me anything about your assigned bookings, customer location & schedule, survey report guidelines & photo requirements, wallet earnings & bank withdrawals, or dispute resolution.\n\nYou can also click any of the quick options below to get started immediately.`
      : `🌊 **Welcome to Jaladhaara 24/7 AI Partner Support!**\n\nI am your dedicated assistant for Hydrogeologists & Groundwater Survey Experts. Ask me anything about your assigned bookings, report upload guidelines, wallet earnings & withdrawals, or partner policies.\n\nYou can also click any of the quick options below to get started immediately.`,
    buttons: ["My Bookings", "Wallet & Payouts", "Upload Report", "Expert Agreement", "Disputes"],
    links: [
      { text: "Assigned Bookings", url: "/vendor/bookings" },
      { text: "Wallet & Payouts", url: "/vendor/wallet" },
      { text: "Upload Reports", url: "/vendor/bookings" }
    ],
    timestamp: new Date().toISOString()
  };
};

export default function VendorSupportChatPage() {
  const navigate = useNavigate();
  const { language, supportedLanguages } = useLanguage();
  const { vendor } = useVendorAuth();
  const expertName = vendor?.name || "";
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const currentLangObj = supportedLanguages.find((l) => l.code === language) || {
    name: "English",
    nativeName: "English"
  };

  // Persistent Chat History from localStorage
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem("jaladhaara_vendor_chat_history");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Failed to load vendor chat history:", e);
    }
    return [buildWelcomeMessage("")];
  });

  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const lastQueryRef = useRef("");

  const getLoadingText = (query) => {
    const q = (query || "").toLowerCase();
    const BOOKING_WORDS = ['booking', 'survey', 'customer', 'schedule', 'report', 'upload', 'wallet', 'payout', 'earnings', 'dispute'];
    if (BOOKING_WORDS.some((w) => q.includes(w))) return "Fetching expert operational data...";
    return "Thinking...";
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    inputRef.current?.focus();
  }, []);

  // Update initial welcome message once expert profile loads
  useEffect(() => {
    if (expertName) {
      setMessages((prev) => {
        if (prev.length === 1 && (prev[0].id === 'welcome' || prev[0].id.startsWith('welcome-'))) {
          return [buildWelcomeMessage(expertName)];
        }
        return prev;
      });
    }
  }, [expertName]);

  // Persist messages to localStorage
  useEffect(() => {
    try {
      if (messages.length > 0) {
        localStorage.setItem("jaladhaara_vendor_chat_history", JSON.stringify(messages));
      }
    } catch (e) {
      console.warn("Failed to save vendor chat history:", e);
    }
  }, [messages]);

  // Auto scroll to bottom smoothly
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputText).trim();
    if (!query || loading) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toISOString()
    };

    const newMessages = [
      ...messages,
      userMsg
    ];

    setMessages(newMessages);
    setInputText("");
    lastQueryRef.current = query;
    setLoading(true);

    try {
      const historyPayload = newMessages.slice(-6).map((m) => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.text
      }));

      const res = await api.post("/support/chat", {
        message: query,
        language: language || "en",
        conversationHistory: historyPayload,
        userName: expertName || undefined,
        userRole: "VENDOR"
      });

      if (res.data?.success && res.data.data) {
        const { reply, actionCard, liveBooking, allBookings, links, buttons, isAiPowered } = res.data.data;
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: "bot",
            text: reply,
            actionCard: actionCard || null,
            liveBooking: liveBooking || null,
            allBookings: Array.isArray(allBookings) && allBookings.length > 0 ? allBookings : null,
            links: links || [],
            buttons: buttons || [],
            isAi: isAiPowered,
            timestamp: new Date().toISOString()
          }
        ]);
      } else {
        throw new Error(res.data?.message || "Invalid server response");
      }
    } catch (err) {
      console.warn("[VendorSupportChatPage] Error calling support API:", err.message);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: "bot",
          text: "I'm having temporary trouble reaching the AI assistant. You can check your assigned bookings directly or reach our Partner Helpline at **+91 800-000-0000**.",
          links: [
            { text: "Assigned Bookings", url: "/vendor/bookings" },
            { text: "Partner Resolution", url: "/vendor/disputes" }
          ],
          buttons: ["My Bookings", "Wallet & Payouts", "Disputes"],
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetChat = () => {
    try {
      localStorage.removeItem("jaladhaara_vendor_chat_history");
    } catch (e) {}
    setMessages([buildWelcomeMessage(expertName)]);
  };

  const renderMessageContent = (text) => {
    if (!text) return null;

    const lines = text.split("\n");

    return lines.map((line, idx) => {
      // Check for markdown links: [Text](URL)
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      let elements = [];
      let lastIndex = 0;
      let match;

      while ((match = linkRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          elements.push(line.substring(lastIndex, match.index));
        }

        const linkText = match[1];
        const linkUrl = match[2];

        elements.push(
          <button
            key={`link-${idx}-${match.index}`}
            onClick={() => navigate(linkUrl)}
            className="inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-800 underline underline-offset-2 transition-colors mx-1 cursor-pointer bg-blue-50/80 px-2 py-0.5 rounded-md text-xs sm:text-sm"
          >
            <span>{linkText}</span>
            <IoArrowForward className="text-xs" />
          </button>
        );

        lastIndex = match.index + match[0].length;
      }

      if (lastIndex < line.length) {
        elements.push(line.substring(lastIndex));
      }

      return (
        <span key={idx} className="block min-h-[1.2em]">
          {elements.map((part, pIdx) => {
            if (typeof part === "string") {
              const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
              return boldParts.map((sub, sIdx) => {
                if (sub.startsWith("**") && sub.endsWith("**")) {
                  return (
                    <strong key={`bold-${pIdx}-${sIdx}`} className="font-extrabold text-slate-900">
                      {sub.slice(2, -2)}
                    </strong>
                  );
                }
                return sub;
              });
            }
            return part;
          })}
        </span>
      );
    });
  };

  return (
    /* Full-Screen Standalone Viewport: overrides global vendor navbar */
    <div className="fixed inset-0 z-[100] bg-slate-100 flex justify-center items-center overflow-hidden">
      <div className="w-full h-full max-w-4xl bg-white flex flex-col overflow-hidden relative sm:border-x sm:border-slate-200 sm:shadow-2xl">
        
        {/* Full-Page App Header - Compact & Professional */}
        <header className="bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950 text-white px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between border-b border-slate-800/80 shadow-xs shrink-0">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <button
              onClick={() => {
                if (window.history.length > 1) {
                  navigate(-1);
                } else {
                  navigate("/vendor/help");
                }
              }}
              className="p-1.5 -ml-1 text-slate-300 hover:text-white hover:bg-white/10 active:scale-95 rounded-full transition-all cursor-pointer flex items-center justify-center shrink-0"
              title="Back"
              aria-label="Back"
            >
              <IoArrowBack className="text-xl" />
            </button>

            {/* Jaladhaara Official Logo Avatar */}
            <div className="relative shrink-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white p-1 sm:p-1.2 shadow-sm border border-slate-700/50 flex items-center justify-center overflow-hidden">
                <img
                  src={logoImg}
                  alt="Jaladhaara"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-500 border-2 border-slate-900 rounded-full" />
            </div>

            {/* Title & Status - Clean Single-Line Hierarchy */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 leading-none">
                <h1 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                  Jaladhaara Expert Support
                </h1>
                <span className="px-1.5 py-0.5 rounded-full bg-blue-500/25 border border-blue-400/30 text-[9px] sm:text-[10px] font-extrabold text-blue-300 flex items-center gap-0.5 shrink-0">
                  <IoSparkles className="text-amber-400 text-[9px]" />
                  <span>AI</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-300 flex items-center gap-1.5 font-medium mt-1 truncate">
                <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Online
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-300 truncate">24/7 Field Support</span>
                <span className="text-slate-500">•</span>
                <span className="text-blue-300 font-medium shrink-0">{currentLangObj.nativeName || currentLangObj.name}</span>
              </p>
            </div>
          </div>

          {/* Header Right Actions */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-1.5">
            <a
              href="tel:+918000000000"
              className="p-1.5 sm:p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer flex items-center justify-center"
              title="Call Partner Helpline"
              aria-label="Call Partner Helpline"
            >
              <IoCallOutline className="text-lg sm:text-xl" />
            </a>
            <button
              onClick={handleResetChat}
              className="p-1.5 sm:p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer flex items-center justify-center"
              title="Reset conversation"
              aria-label="Reset conversation"
            >
              <IoRefreshOutline className="text-lg sm:text-xl" />
            </button>
          </div>
        </header>

        {/* Chat Messages Scrolling Body */}
        <main className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-2.5 sm:space-y-3 bg-[#f8fafc]">
          {messages.map((msg) => {
            const isUser = msg.sender === "user";
            const timeString = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[92%] sm:max-w-[80%] rounded-2xl p-3 sm:p-3.5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                    isUser
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-xs"
                      : "bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs"
                  }`}
                >
                  {!isUser ? (
                    <div className="flex items-center gap-1.5 mb-1 text-[11px] font-bold text-blue-700">
                      <div className="w-4 h-4 rounded-full bg-blue-50 flex items-center justify-center p-0.5 overflow-hidden shrink-0 border border-blue-200/60">
                        <img src={logoImg} alt="" className="w-full h-full object-contain" />
                      </div>
                      <span>Jaladhaara Expert Support</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-1.5 mb-1 text-[11px] font-semibold text-blue-200">
                      <IoPersonOutline className="text-xs" />
                      <span>You (Expert)</span>
                    </div>
                  )}

                  <div className="space-y-1.5 text-xs sm:text-sm">
                    {renderMessageContent(msg.text)}
                  </div>

                  {/* Rich Live Booking Card */}
                  {msg.liveBooking && (
                    <div className="mt-3 p-3 bg-gradient-to-br from-blue-50 to-indigo-50/60 rounded-xl border border-blue-200/80 space-y-2 text-slate-800 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-blue-900 flex items-center gap-1.5">
                          <IoDocumentTextOutline className="text-blue-600 text-sm" />
                          <span>Booking ID: {msg.liveBooking.displayId}</span>
                        </span>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 uppercase tracking-wide">
                          {msg.liveBooking.status}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-600 space-y-0.5">
                        <div className="font-semibold text-slate-800">{msg.liveBooking.category}</div>
                        <div>Customer: <strong className="text-slate-900">{msg.liveBooking.customerName}</strong> {msg.liveBooking.customerPhone ? `(${msg.liveBooking.customerPhone})` : ''}</div>
                        <div>Date: {new Date(msg.liveBooking.scheduledDate).toLocaleDateString()} at {msg.liveBooking.scheduledTime}</div>
                        <div>Location: {msg.liveBooking.location ? String(msg.liveBooking.location).replace(/,\s*,+/g, ',').replace(/^,\s*|,\s*$/g, '').trim() : 'Survey Location'}</div>
                        {msg.liveBooking.payoutAmount > 0 && (
                          <div className="text-emerald-700 font-bold">Your Service Share: ₹{msg.liveBooking.payoutAmount.toLocaleString("en-IN")}</div>
                        )}
                      </div>

                      <div className="pt-1.5 flex flex-wrap gap-2">
                        <button
                          onClick={() => navigate(`/vendor/bookings/${msg.liveBooking.id}`)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                        >
                          <IoNavigateOutline className="text-sm" />
                          <span>View Booking</span>
                        </button>
                        <button
                          onClick={() => navigate(`/vendor/bookings/${msg.liveBooking.id}/upload-report`)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                        >
                          <IoCloudUploadOutline className="text-sm" />
                          <span>Upload Report</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Specification Action Card */}
                  {msg.actionCard && !msg.liveBooking && (
                    <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200/90 flex flex-col gap-2">
                      <div className="flex items-start gap-2.5">
                        <div className="p-2 rounded-lg bg-blue-100 text-blue-600 text-lg shrink-0 mt-0.5">
                          {getActionCardIcon(msg.actionCard.icon)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 tracking-tight">
                            {msg.actionCard.title}
                          </h4>
                          <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                            {msg.actionCard.description}
                          </p>
                        </div>
                      </div>

                      {msg.actionCard.primaryAction && (
                        <button
                          onClick={() => navigate(msg.actionCard.primaryAction.url)}
                          className="w-full mt-1 py-1.5 px-3 rounded-lg bg-[#0A84FF] hover:bg-blue-600 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                        >
                          <span>{msg.actionCard.primaryAction.label || "Open"}</span>
                          <IoArrowForward className="text-xs" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Dynamic Follow-up Action Buttons */}
                  {Array.isArray(msg.buttons) && msg.buttons.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                      {msg.buttons.map((btnLabel, bIdx) => (
                        <button
                          key={bIdx}
                          onClick={() => handleSendMessage(btnLabel)}
                          className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/70 transition-all cursor-pointer active:scale-95 shadow-2xs"
                        >
                          {btnLabel}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="text-[9px] text-slate-400 text-right mt-1.5">
                    {timeString}
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex flex-col items-start space-y-1">
              <div className="bg-white border border-slate-200/80 rounded-2xl rounded-tl-xs p-3 shadow-2xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-xs font-semibold text-slate-600">
                  {getLoadingText(lastQueryRef.current)}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </main>

        {/* Quick Topic Chips Bar */}
        <div className="px-3 sm:px-4 py-1.5 bg-slate-50/90 border-t border-slate-200/70 overflow-x-auto no-scrollbar shrink-0 flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 hidden sm:inline">
            Quick Prompts:
          </span>
          {INITIAL_QUICK_ACTIONS.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(item.text)}
              disabled={loading}
              className="px-2.5 py-1 bg-white hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-full text-[11px] font-semibold transition-all whitespace-nowrap shrink-0 border border-slate-200 shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <footer className="p-2.5 sm:p-3 bg-white border-t border-slate-200/80 shrink-0 pb-[calc(0.6rem+env(safe-area-inset-bottom,0px))]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask about assigned bookings, report guidelines, wallet payouts..."
              disabled={loading}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0A84FF] focus:bg-white transition-all shadow-inner"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || loading}
              className="p-2 sm:p-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold transition-all shadow-xs active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center justify-center shrink-0"
              aria-label="Send message"
            >
              <IoSend className="text-base sm:text-lg" />
            </button>
          </form>
        </footer>

      </div>
    </div>
  );
}
