"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedSection } from "./AnimatedSection";
import { FaWhatsapp } from "react-icons/fa";
import Image from "next/image";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTION_CHIPS = [
  "Do you deliver to Lekki?",
  "Wetin una get for size 12?",
  "How much e go cost?",
  "My order never reach",
];

const DEMO_BUSINESS = {
  name: "Zara Lagos",
  description: "Fashion store selling shoes, bags, and clothing.",
};

export function LiveDemo() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Hi! I'm Han, the AI for ${DEMO_BUSINESS.name} 👋 We sell premium shoes, bags, and clothing. How can I help you today?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/demo/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: messages,
          business: DEMO_BUSINESS,
        }),
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, demo is temporarily unavailable. Sign up to try the real thing!",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section id="live-demo" className="bg-slate-900 py-28 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: copy */}
          <AnimatedSection direction="right">
            <p className="text-sky-400 text-sm font-medium uppercase tracking-widest mb-4">
              Try it now
            </p>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6 leading-tight">
              Talk to Han.
              <br />
              <span className="han-gradient-text">No sign-up needed.</span>
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed mb-8">
              Type a message as if you were a customer. Use English, Pidgin, or
              mix them — Han handles it all. This is the real AI, live.
            </p>

            {/* Suggestion chips */}
            <div className="flex flex-wrap gap-2">
              {SUGGESTION_CHIPS.map((chip) => (
                <button
                  key={chip}
                  onClick={() => sendMessage(chip)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 border border-white/5 text-slate-400 text-sm hover:border-sky-500/30 hover:text-sky-400 transition-all duration-200"
                >
                  {chip}
                </button>
              ))}
            </div>
          </AnimatedSection>

          {/* Right: WhatsApp-style chat UI */}
          <AnimatedSection direction="left">
            <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl max-w-sm mx-auto lg:mx-0 lg:ml-auto">
              {/* WhatsApp header */}
              <div className="bg-[#1F2C34] px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-sky-500/20 flex items-center justify-center">
                  <Image
                    src="/icons/han-icon-circle.svg"
                    alt="Han"
                    width={36}
                    height={36}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {DEMO_BUSINESS.name}
                  </p>
                  <p className="text-[#8696A0] text-xs">
                    {isLoading ? "typing..." : "online"}
                  </p>
                </div>
                <FaWhatsapp className="text-[#25D366] text-xl" />
              </div>

              {/* Messages */}
              <div
                className="bg-[#0B141A] h-80 overflow-y-auto p-4 flex flex-col gap-2"
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.01'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
                }}
              >
                <AnimatePresence initial={false}>
                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.25 }}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[78%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                          msg.role === "user"
                            ? "bg-[#005C4B] text-white rounded-tr-sm"
                            : "bg-[#1F2C34] text-[#E9EDEF] rounded-tl-sm"
                        }`}
                      >
                        {msg.content}
                        <span className="block text-right text-[10px] mt-1 opacity-50">
                          {new Date().toLocaleTimeString("en-NG", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </motion.div>
                  ))}

                  {/* Typing indicator */}
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex justify-start"
                    >
                      <div className="bg-[#1F2C34] px-4 py-3 rounded-xl rounded-tl-sm flex gap-1 items-center">
                        {[0, 0.15, 0.3].map((delay, i) => (
                          <motion.div
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-[#8696A0]"
                            animate={{ y: [0, -4, 0] }}
                            transition={{
                              duration: 0.7,
                              delay,
                              repeat: Infinity,
                            }}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="bg-[#1F2C34] px-3 py-2 flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                  placeholder="Message..."
                  className="flex-1 bg-[#2A3942] text-[#E9EDEF] placeholder-[#8696A0] text-sm px-4 py-2 rounded-full outline-none"
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || isLoading}
                  className="w-9 h-9 rounded-full bg-[#00A884] disabled:bg-[#2A3942] flex items-center justify-center transition-colors"
                >
                  <svg
                    className="w-4 h-4 text-white translate-x-0.5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </button>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}
