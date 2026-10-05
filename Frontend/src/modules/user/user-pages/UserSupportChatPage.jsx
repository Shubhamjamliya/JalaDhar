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
  IoPersonOutline
} from "react-icons/io5";
import api from "../../../services/api";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useAuth } from "../../../contexts/AuthContext";

const INITIAL_QUICK_ACTIONS = [
  { label: "📋 My Booking", text: "My Booking" },
  { label: "💳 Payment & Invoices", text: "Payment" },
  { label: "📄 Survey Report", text: "My Report" },
  { label: "📍 Track Expert", text: "Track Expert" },
  { label: "📅 Survey Schedule", text: "Survey Schedule" },
  { label: "📞 Support Helpline", text: "Support" }
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

const buildWelcomeMessage = (userName) => ({
  id: "welcome",
  sender: "bot",
  text: userName
    ? `🌊 **Welcome ${userName} to Jaladhaara 24/7 AI Support!**\n\nI am your dedicated groundwater survey assistant. Ask me anything about your live booking status, payment invoices, borewell drilling expectations, or downloading your certified survey report.\n\nYou can also click any of the quick options below to get started immediately.`
    : `🌊 **Welcome to Jaladhaara 24/7 AI Support!**\n\nI am your dedicated groundwater survey assistant. Ask me anything about your live booking status, payment invoices, borewell drilling expectations, or downloading your certified survey report.\n\nYou can also click any of the quick options below to get started immediately.`,
  buttons: ["My Booking", "Payment", "My Report", "Track Expert", "More Options"],
  links: [
    { text: "View Bookings", url: "/user/status" },
    { text: "Survey Reports", url: "/user/survey-reports" }
  ],
  timestamp: new Date().toISOString()
});

export default function UserSupportChatPage() {
  const navigate = useNavigate();
  const { language, supportedLanguages } = useLanguage();
  const { user } = useAuth();
  const userName = user?.name || "";
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const currentLangObj = supportedLanguages.find((l) => l.code === language) || {
    name: "English",
    nativeName: "English"
  };

  // Persistent Chat History from localStorage
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem("jaladhaara_support_chat_history");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Failed to load chat history:", e);
    }
    return [buildWelcomeMessage("")];
  });

  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const lastQueryRef = useRef(""); // tracks what was last sent to show context-aware loading text

  const getLoadingText = (query) => {
    const q = (query || "").toLowerCase();
    const BOOKING_WORDS = ['booking', 'survey', 'expert', 'schedule', 'track', 'report', 'history', 'payment', 'invoice', 'status', 'बुकिंग', 'सर्वे'];
    const DATE_WORDS = ['january','february','march','april','may','june','july','august','september','october','november','december','today','yesterday','this week','last month'];
    if (DATE_WORDS.some((d) => q.includes(d))) return "Searching your survey records...";
    if (BOOKING_WORDS.some((w) => q.includes(w))) return "Fetching your booking details...";
    return "Thinking...";
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    inputRef.current?.focus();
  }, []);

  // Update initial welcome message once user profile loads
  useEffect(() => {
    if (userName) {
      setMessages((prev) => {
        if (prev.length === 1 && (prev[0].id === 'welcome' || prev[0].id.startsWith('welcome-'))) {
          return [buildWelcomeMessage(userName)];
        }
        return prev;
      });
    }
  }, [userName]);

  // Save conversation history across browser refreshes & page changes
  useEffect(() => {
    try {
      localStorage.setItem("jaladhaara_support_chat_history", JSON.stringify(messages));
    } catch (e) {
      console.warn("Failed to save chat history:", e);
    }
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
        timestamp: new Date().toISOString()
      }
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
        userName: userName || undefined
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
      console.warn("[UserSupportChatPage] Error calling support API:", err.message);
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
          buttons: ["My Booking", "Payment", "Support"],
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetChat = () => {
    try {
      localStorage.removeItem("jaladhaara_support_chat_history");
    } catch (e) {}
    setMessages([buildWelcomeMessage(userName)]);
  };

  const renderMessageContent = (text) => {
    if (!text) return null;
    const lines = text.split("\n");

    return lines.map((line, idx) => {
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
    /* Full-Screen Standalone Viewport: overrides global navbar & bottom navigation */
    <div className="fixed inset-0 z-[100] bg-slate-100 flex justify-center items-center overflow-hidden">
      <div className="w-full h-full max-w-4xl bg-white flex flex-col overflow-hidden relative sm:border-x sm:border-slate-200 sm:shadow-2xl">
        
        {/* Full-Page App Header */}
        <header className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white px-3 sm:px-6 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] pb-3.5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => navigate("/user/help-support")}
              className="p-2 -ml-1 text-slate-200 hover:text-white hover:bg-white/10 rounded-2xl transition-all cursor-pointer flex items-center gap-1 text-xs font-bold"
              title="Back to Help & Support"
            >
              <IoArrowBack className="text-xl" />
              <span className="hidden sm:inline">Back</span>
            </button>

            <div className="h-6 w-px bg-slate-700/60 hidden sm:block" />

            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="relative">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
                  <IoWaterOutline className="text-xl sm:text-2xl" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full" />
              </div>

              <div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
                    Jaladhaara AI Assistant
                  </h1>
                  <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-[9px] sm:text-[10px] font-extrabold text-purple-300 flex items-center gap-1">
                    <IoSparkles className="text-amber-400 text-[10px]" />
                    <span>Live AI</span>
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs text-slate-300 flex items-center gap-1.5 font-medium">
                  <span className="text-emerald-400 font-bold">● Connected</span>
                  {userName && (
                    <>
                      <span>•</span>
                      <span className="text-purple-200 font-medium">User: <strong className="text-white font-semibold">{userName}</strong></span>
                    </>
                  )}
                  <span>•</span>
                  <span>{currentLangObj.nativeName || currentLangObj.name}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={handleResetChat}
              className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer"
              title="Reset conversation history"
            >
              <IoRefreshOutline className="text-xl" />
            </button>
          </div>
        </header>

        {/* Chat Messages Scrolling Body */}
        <main className="flex-1 p-3.5 sm:p-6 overflow-y-auto space-y-3.5 sm:space-y-4 bg-slate-50/70">
          {messages.map((msg) => {
            const isUser = msg.sender === "user";
            const timeString = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[90%] sm:max-w-[80%] rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed shadow-xs ${
                    isUser
                      ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-tr-xs"
                      : "bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs"
                  }`}
                >
                  {!isUser ? (
                    <div className="flex items-center gap-1.5 mb-1 text-[11px] font-bold text-purple-700">
                      <IoSparkles className="text-amber-500 text-xs" />
                      <span>Jaladhaara Ground Support</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-1.5 mb-1 text-[11px] font-semibold text-purple-200">
                      <IoPersonOutline className="text-xs" />
                      <span>{userName || "You"}</span>
                    </div>
                  )}

                  <div className="space-y-1">{renderMessageContent(msg.text)}</div>

                  {/* 1. Live Database Booking Card (When user has real bookings) */}
                  {!isUser && msg.liveBooking && (
                    <div className="mt-3 bg-gradient-to-br from-emerald-50/90 via-white to-blue-50/90 border border-emerald-200 rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-2.5">
                      <div className="flex items-center justify-between gap-2 border-b border-emerald-100 pb-2">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              msg.liveBooking.isCompleted
                                ? "bg-purple-100 text-purple-800"
                                : msg.liveBooking.isOngoing
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {msg.liveBooking.isCompleted
                              ? "Completed Survey"
                              : msg.liveBooking.isOngoing
                                ? "Active Booking"
                                : String(msg.liveBooking.status || "Survey").replace(/_/g, " ")}
                          </span>
                          <span className="text-xs font-black text-slate-900">
                            #{msg.liveBooking.displayId}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                          {msg.liveBooking.status}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs text-slate-700">
                        <p className="font-extrabold text-sm text-slate-900">
                          {msg.liveBooking.category}
                        </p>
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <IoPersonOutline className="text-sm text-purple-600 shrink-0" />
                          <span>Expert: <strong className="text-slate-900">{msg.liveBooking.expertName}</strong></span>
                          {!!msg.liveBooking.expertRating && Number(msg.liveBooking.expertRating) > 0 && (
                            <span className="text-amber-500 font-bold ml-1">
                              ★ {typeof msg.liveBooking.expertRating === 'object'
                                ? (msg.liveBooking.expertRating?.averageRating || 4.9)
                                : Number(msg.liveBooking.expertRating).toFixed(1)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <IoCalendarOutline className="text-sm text-blue-600 shrink-0" />
                          <span>Schedule: <strong className="text-slate-900">{new Date(msg.liveBooking.scheduledDate).toLocaleDateString()}</strong> ({msg.liveBooking.scheduledTime})</span>
                        </div>
                        {msg.liveBooking.location && (
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <IoLocationOutline className="text-sm text-rose-600 shrink-0" />
                            <span>Location: {msg.liveBooking.location}</span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-emerald-100">
                        {msg.liveBooking.isOngoing ? (
                          <button
                            onClick={() => navigate("/user/status?tab=ongoing")}
                            className="py-2 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <IoLocationOutline className="text-sm" />
                            <span>Track Expert</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => navigate("/user/survey-reports")}
                            className="py-2 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <IoDocumentTextOutline className="text-sm" />
                            <span>View Report</span>
                          </button>
                        )}
                        <button
                          onClick={() => navigate("/user/status")}
                          className="py-2 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>Full Details</span>
                          <IoArrowForward className="text-xs text-purple-600" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 1b. All Booking History List (when user asks for history) */}
                  {!isUser && msg.allBookings && msg.allBookings.length > 0 && (() => {
                    const PREVIEW_LIMIT = 3;
                    const preview = msg.allBookings.slice(0, PREVIEW_LIMIT);
                    const remaining = msg.allBookings.length - PREVIEW_LIMIT;
                    return (
                      <div className="mt-3 space-y-2">
                        {preview.map((booking, bIdx) => {
                          const rawStat = String(booking.status || "").toUpperCase();
                          const badgeLabel = booking.isCompleted
                            ? "Completed"
                            : booking.isOngoing
                              ? "Active"
                              : rawStat.replace(/_/g, " ");
                          const badgeClass = booking.isCompleted
                            ? "bg-purple-100 text-purple-800"
                            : booking.isOngoing
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-500";
                          const formattedDate = new Date(booking.scheduledDate).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric"
                          });
                          return (
                            <div
                              key={booking.id || bIdx}
                              className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs flex items-center justify-between gap-2"
                            >
                              <div className="flex-1 min-w-0 space-y-0.5">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${badgeClass}`}>
                                    {badgeLabel}
                                  </span>
                                  <span className="text-[10px] font-black text-slate-700">#{booking.displayId}</span>
                                </div>
                                <p className="text-xs font-bold text-slate-900 truncate">{booking.category}</p>
                                <p className="text-[10px] text-slate-500">
                                  {formattedDate} &nbsp;·&nbsp; {booking.expertName}
                                </p>
                              </div>
                              <button
                                onClick={() => navigate(booking.isOngoing ? "/user/status?tab=ongoing" : "/user/survey-reports")}
                                className="shrink-0 py-1.5 px-2.5 text-[10px] font-bold rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50 text-slate-600 hover:text-purple-700 transition-all cursor-pointer"
                              >
                                {booking.isOngoing ? "Track" : "Report"}
                              </button>
                            </div>
                          );
                        })}
                        {remaining > 0 && (
                          <button
                            onClick={() => navigate("/user/status")}
                            className="w-full py-2 text-xs font-bold text-purple-600 hover:text-purple-700 hover:bg-purple-50 border border-purple-200 rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <span>See all {msg.allBookings.length} bookings</span>
                            <IoArrowForward className="text-xs" />
                          </button>
                        )}
                      </div>
                    );
                  })()}

                  {!isUser && !msg.liveBooking && msg.actionCard && (
                    <div className="mt-3 bg-gradient-to-br from-indigo-50/90 via-white to-purple-50/90 border border-indigo-200/90 rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-2.5">
                      <div className="flex items-start gap-3">
                        <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-xs shrink-0 text-lg sm:text-xl">
                          {getActionCardIcon(msg.actionCard.icon)}
                        </div>
                        <div className="space-y-0.5">
                          <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-snug">
                            {msg.actionCard.title}
                          </h3>
                          <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed font-medium">
                            {msg.actionCard.description}
                          </p>
                        </div>
                      </div>

                      {msg.actionCard.primaryAction && (
                        <button
                          onClick={() => navigate(msg.actionCard.primaryAction.url)}
                          className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 active:scale-99 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer group"
                        >
                          <span>{msg.actionCard.primaryAction.label}</span>
                          <IoArrowForward className="text-xs group-hover:translate-x-1 transition-transform" />
                        </button>
                      )}

                      {msg.actionCard.helpline && (
                        <a
                          href={`tel:${msg.actionCard.helpline}`}
                          className="w-full py-2 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <IoCallOutline className="text-sm text-purple-600" />
                          <span>Call Helpline ({msg.actionCard.helpline})</span>
                        </a>
                      )}
                    </div>
                  )}

                  {/* 3. Fallback Direct Links */}
                  {!isUser && !msg.liveBooking && !msg.actionCard && msg.links && msg.links.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5 sm:gap-2">
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

                {/* Quick Action Suggestion Chips */}
                {!isUser && msg.buttons && msg.buttons.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 ml-1 max-w-[92%] sm:max-w-[88%]">
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

                {timeString && (
                  <span className="text-[10px] text-slate-400 mt-1 px-1">
                    {timeString}
                  </span>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-2xl px-4 py-3 w-fit shadow-xs">
              <div className="flex space-x-1.5">
                <span className="w-2 h-2 bg-purple-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
              </div>
              <span className="text-xs font-medium text-slate-500">
                {getLoadingText(lastQueryRef.current)}
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </main>

        {/* Suggested Quick Action Chips */}
        <section className="px-3.5 sm:px-4 py-2 bg-white/95 backdrop-blur-md border-t border-slate-100 overflow-x-auto scrollbar-none flex items-center gap-1.5 sm:gap-2 shrink-0">
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
            Suggested:
          </span>
          {INITIAL_QUICK_ACTIONS.map((action, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(action.text)}
              className="px-2.5 sm:px-3 py-1 bg-slate-100 hover:bg-purple-50 hover:border-purple-200 border border-transparent rounded-full text-xs font-medium text-slate-700 hover:text-purple-700 whitespace-nowrap transition-all cursor-pointer"
            >
              {action.label}
            </button>
          ))}
        </section>

        {/* Sticky Bottom Input Field */}
        <footer className="p-2.5 sm:p-4 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] bg-white border-t border-slate-200 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputText);
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask anything (e.g. 'What are my bookings?' or 'सर्वे रिपोर्ट कैसे देखें?')..."
              className="flex-1 px-4 py-2.5 sm:py-3 text-xs sm:text-sm bg-slate-50 rounded-2xl border border-slate-200 focus:outline-none focus:border-purple-500 focus:bg-white text-slate-800 placeholder-slate-400 transition-all shadow-inner"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || loading}
              className="p-3 sm:p-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-40 text-white rounded-2xl transition-all shadow-sm cursor-pointer shrink-0"
              title="Send message"
            >
              <IoSend className="text-base" />
            </button>
          </form>
        </footer>

      </div>
    </div>
  );
}
