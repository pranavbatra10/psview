"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, Send, Brain, Terminal, ShieldCheck, ShieldAlert } from "lucide-react";
import InterviewCalendar from "@/components/InterviewCalendar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface AgentTurnResponse {
  perceivedIntent: string;
  internalMonologue: string;
  proposedStageTransition: string;
  uiAction?: string;
  replyMessage: string;
  qa?: { passedQA: boolean; reasoning: string };
  error?: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  uiAction?: string;
}

interface IntelligenceLog {
  perceivedIntent: string;
  internalMonologue: string;
  proposedStageTransition: string;
  turnNumber: number;
  qa?: { passedQA: boolean; reasoning: string };
}

export default function ClientSimulator({
  company,
  initialState,
}: {
  company: any;
  initialState: any;
}) {
  const [chatHistory, setChatHistory] = useState<Message[]>(
    initialState.chat_history || []
  );
  const [intelligenceLogs, setIntelligenceLogs] = useState<IntelligenceLog[]>(
    []
  );
  const [currentStage, setCurrentStage] = useState(
    initialState.current_stage || "COLD_OPEN"
  );
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [turnCount, setTurnCount] = useState(0);

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const logScrollRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  // Auto-scroll chat and terminal to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
    if (logScrollRef.current) {
      logScrollRef.current.scrollTop = logScrollRef.current.scrollHeight;
    }
  }, [chatHistory, intelligenceLogs, isLoading]);

  // On mount: trigger COLD_OPEN if the chat is empty
  useEffect(() => {
    if (chatHistory.length === 0 && !initialized.current) {
      initialized.current = true;
      triggerAgentTurn(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function triggerAgentTurn(userMessage: string | null) {
    setIsLoading(true);
    try {
      const res = await fetch("/api/agent/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: company.id,
          candidateMessage: userMessage,
          chatHistory: chatHistory,
        }),
      });

      const data: AgentTurnResponse = await res.json();

      if (data.error) {
        setChatHistory((prev) => [
          ...prev,
          { role: "assistant", content: `[SYSTEM ERROR]: ${data.error}` },
        ]);
        return;
      }

      // Update chat history (include uiAction metadata on assistant messages)
      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: data.replyMessage, uiAction: data.uiAction },
      ]);

      // Update current stage
      setCurrentStage(data.proposedStageTransition);

      // Log the intelligence data
      const newTurn = turnCount + 1;
      setTurnCount(newTurn);
      setIntelligenceLogs((prev) => [
        ...prev,
        {
          perceivedIntent: data.perceivedIntent,
          internalMonologue: data.internalMonologue,
          proposedStageTransition: data.proposedStageTransition,
          turnNumber: newTurn,
          qa: data.qa,
        },
      ]);
    } catch (e: any) {
      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: `[NETWORK ERROR]: ${e.message}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const msg = input.trim();
    setInput("");

    // Optimistically append user message
    setChatHistory((prev) => [...prev, { role: "user", content: msg }]);

    // Trigger the cognitive loop
    triggerAgentTurn(msg);
  }

  const stageBadgeColor: Record<string, string> = {
    COLD_OPEN: "bg-blue-900/50 text-blue-300 border-blue-700",
    QUALIFYING: "bg-amber-900/50 text-amber-300 border-amber-700",
    OBJECTION_HANDLING: "bg-red-900/50 text-red-300 border-red-700",
    SCHEDULING: "bg-emerald-900/50 text-emerald-300 border-emerald-700",
    CLOSED: "bg-purple-900/50 text-purple-300 border-purple-700",
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 h-full min-h-[700px] w-full">
      {/* ========================================= */}
      {/* LEFT PANEL: CANDIDATE CHAT SANDBOX (50%)  */}
      {/* ========================================= */}
      <Card className="flex-1 flex flex-col bg-zinc-900 border-zinc-800 text-zinc-100 shadow-xl overflow-hidden h-full">
        <CardHeader className="border-b border-zinc-800 bg-zinc-900 shrink-0">
          <CardTitle className="text-xl font-bold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Send className="h-5 w-5 text-zinc-400" />
              Candidate Sandbox
            </span>
            <span
              className={`text-xs px-3 py-1 rounded-full font-mono font-semibold border ${
                stageBadgeColor[currentStage] ||
                "bg-zinc-800 text-zinc-400 border-zinc-700"
              }`}
            >
              {currentStage}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
          {/* Chat messages */}
          <div
            ref={chatScrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar"
          >
            {chatHistory.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col ${
                  msg.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-zinc-100 text-zinc-900 rounded-br-sm font-medium"
                      : "bg-zinc-800 text-zinc-100 border border-zinc-700 rounded-bl-sm"
                  }`}
                >
                  {msg.content}
                </div>
                {/* Generative UI: Render calendar widget when agent triggers SCHEDULING */}
                {msg.uiAction === "RENDER_CALENDAR" && (
                  <InterviewCalendar />
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-zinc-800 border border-zinc-700 text-zinc-400 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Agent is thinking...
                </div>
              </div>
            )}
          </div>

          {/* Input bar */}
          <div className="p-4 bg-zinc-900 border-t border-zinc-800 shrink-0">
            <form onSubmit={handleSend} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your response as a candidate..."
                className="bg-zinc-950 border-zinc-700 focus-visible:ring-zinc-600 flex-1 text-sm h-11"
                disabled={isLoading}
              />
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-zinc-100 h-11 text-zinc-900 hover:bg-zinc-300 font-semibold px-6"
              >
                <Send className="h-4 w-4 mr-2" />
                Reply
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* ========================================= */}
      {/* RIGHT PANEL: INTELLIGENCE TERMINAL (50%)  */}
      {/* ========================================= */}
      <Card className="flex-1 flex flex-col bg-zinc-950 border-zinc-800 text-zinc-100 shadow-xl overflow-hidden h-full">
        <CardHeader className="border-b border-zinc-800 bg-zinc-950 shrink-0">
          <CardTitle className="text-xl font-bold flex items-center gap-2 text-emerald-400 font-mono">
            <Terminal className="h-5 w-5" />
            Intelligence Terminal
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-4 overflow-hidden flex flex-col font-mono text-xs md:text-sm gap-4">
          {/* Active Configuration */}
          <div className="border border-zinc-800 bg-zinc-900/40 rounded-lg px-4 mb-6 shrink-0">
            <Accordion type="single" collapsible defaultValue="">
              <AccordionItem value="config" className="border-none">
                <AccordionTrigger className="py-3 text-zinc-400 font-semibold hover:no-underline hover:text-zinc-300 transition-colors">
                  <span className="flex items-center">
                    <Brain className="h-3.5 w-3.5 mr-1.5" />
                    View Active Persona Config: {company.name}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pt-3 pb-0">
                  <div className="space-y-2 text-xs">
                    <p>
                      <span className="text-zinc-600 block mb-0.5">Voice:</span>{" "}
                      <span className="text-zinc-300">
                        {JSON.stringify(
                          company.persona_json?.voice_rules || [],
                          null,
                          0
                        )}
                      </span>
                    </p>
                    <p>
                      <span className="text-zinc-600 block mb-0.5">Do:</span>{" "}
                      <span className="text-zinc-300">
                        {JSON.stringify(company.persona_json?.do || [], null, 0)}
                      </span>
                    </p>
                    <p>
                      <span className="text-zinc-600 block mb-0.5">{"Don't"}:</span>{" "}
                      <span className="text-zinc-300">
                        {JSON.stringify(company.persona_json?.dont || [], null, 0)}
                      </span>
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Intelligence Logs */}
          <div className="flex-1 flex flex-col min-h-0">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3 shrink-0">
              Live Reasoning Stream
            </h3>
            <div
              ref={logScrollRef}
              className="flex-1 overflow-y-auto min-h-0 space-y-6 pr-2 no-scrollbar"
            >
            {intelligenceLogs.length === 0 && !isLoading && (
              <div className="text-zinc-600 text-center mt-8">
                <Terminal className="h-8 w-8 mx-auto mb-3 opacity-50" />
                <p>Waiting for agent cognitive data...</p>
                <p className="text-xs mt-1 opacity-60">
                  The agent{"'"}s thinking process will appear here in
                  real-time.
                </p>
              </div>
            )}

            {intelligenceLogs.map((log, i) => (
              <div
                key={i}
                className="bg-zinc-900/60 p-4 rounded-lg border border-zinc-800 shadow-inner"
              >
                <div className="text-emerald-500 mb-3 opacity-70 text-xs">
                  {`Turn ${log.turnNumber} Captured`}
                </div>
                <div className="space-y-3">
                  {/* Perceived Intent */}
                  <div>
                    <span className="text-zinc-500 block mb-1 text-xs uppercase tracking-wider">
                      Perceived Intent
                    </span>
                    <span className="text-blue-300">{log.perceivedIntent}</span>
                  </div>

                  {/* Internal Monologue */}
                  <div>
                    <span className="text-zinc-500 block mb-1 text-xs uppercase tracking-wider">
                      Internal Monologue
                    </span>
                    <span className="text-yellow-400/90 leading-relaxed block">
                      {log.internalMonologue}
                    </span>
                  </div>

                  {/* Stage Transition */}
                  <div className="pt-2 mt-2 border-t border-zinc-800/50 flex items-center gap-2">
                    <span className="text-zinc-500 text-xs uppercase tracking-wider">
                      Stage:
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-semibold border ${
                        stageBadgeColor[log.proposedStageTransition] ||
                        "bg-zinc-800 text-zinc-400 border-zinc-700"
                      }`}
                    >
                      {log.proposedStageTransition}
                    </span>
                  </div>

                  {/* Guardrail QA Result */}
                  {log.qa && (
                    <div
                      className={`mt-3 pt-3 border-t border-zinc-800/50 rounded-md px-3 py-2 text-xs ${
                        log.qa.passedQA
                          ? "bg-emerald-950/30 border border-emerald-800/40"
                          : "bg-red-950/40 border border-red-700/50"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 font-semibold">
                        {log.qa.passedQA ? (
                          <>
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                            <span className="text-emerald-400">QA Passed</span>
                          </>
                        ) : (
                          <>
                            <ShieldAlert className="h-3.5 w-3.5 text-red-400" />
                            <span className="text-red-400">
                              Guardrail Triggered & Rewritten
                            </span>
                          </>
                        )}
                      </div>
                      <p
                        className={`leading-relaxed ${
                          log.qa.passedQA
                            ? "text-emerald-300/70"
                            : "text-red-300/80"
                        }`}
                      >
                        {log.qa.reasoning}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="text-emerald-500/50 animate-pulse mt-4 flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Processing cognitive loop...
              </div>
            )}
          </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
