import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Strict Zod schema enforcing the Perceive -> Reason -> Act cognitive loop
const AgentTurnSchema = z.object({
  perceivedIntent: z
    .string()
    .describe(
      "Classify the candidate's sentiment, objections (salary, timing, role fit), or underlying motive."
    ),
  internalMonologue: z
    .string()
    .describe(
      "Your private strategic planning. Given the company's persona rules, how should you pivot to drive toward an interview?"
    ),
  proposedStageTransition: z.enum([
    "COLD_OPEN",
    "QUALIFYING",
    "OBJECTION_HANDLING",
    "SCHEDULING",
    "CLOSED",
  ]),
  uiAction: z
    .enum(["NONE", "RENDER_CALENDAR"])
    .describe(
      "If the proposedStageTransition is SCHEDULING, you MUST set this to RENDER_CALENDAR. Otherwise, NONE."
    ),
  replyMessage: z
    .string()
    .describe(
      "The outbound message. Must be under 3 sentences, highly conversational, and contain zero placeholder brackets."
    ),
});

// Defensive QA schema — secondary audit against company brand rules
const QASchema = z.object({
  passedQA: z
    .boolean()
    .describe(
      "True if the message strictly obeys all the 'dont' rules. False if it violates any."
    ),
  reasoning: z
    .string()
    .describe("Explain why it passed or failed the brand safety check."),
  rewrittenMessage: z
    .string()
    .describe(
      "If passedQA is false, rewrite the message to be safe. If true, return the original message exactly."
    ),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { companyId, candidateMessage, chatHistory } = body;

    if (!companyId) {
      return NextResponse.json(
        { error: "Missing required field: companyId" },
        { status: 400 }
      );
    }

    // 1. PERCEIVE: Fetch company context from Supabase
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("name, industry, core_values, hiring_profile, tone_guidelines, persona_json")
      .eq("id", companyId)
      .single();

    if (companyError || !company) {
      console.error("Company fetch error:", companyError);
      return NextResponse.json({ error: "Company not found." }, { status: 404 });
    }

    // Ensure chatHistory is strictly formatted for the AI SDK
    const cleanHistory = (chatHistory || []).map((msg: any) => ({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.content,
    }));

    // Build the message history for the model
    const messages: any[] = [...cleanHistory];

    if (candidateMessage) {
      messages.push({ role: "user", content: candidateMessage });
    }

    // COLD_OPEN: If there are zero messages, inject an initial directive
    if (messages.length === 0) {
      messages.push({
        role: "user",
        content:
          "[SYSTEM] This is the initial outreach. Generate your first cold-open recruiting message to a potential candidate you've identified. Make it compelling and personal.",
      });
    }

    // 2. REASON: Build the system prompt with full company context
    const systemPrompt = `You are Alex, a Senior Technical Recruiter for ${company.name} (${company.industry}).

COMPANY CULTURE & VALUES:
${company.core_values || "Not specified"}

IDEAL CANDIDATE PROFILE:
${company.hiring_profile || "Not specified"}

TONE GUIDELINES:
${company.tone_guidelines || "Professional and friendly"}

STRICT PERSONA RULES (you MUST follow these):
${JSON.stringify(company.persona_json, null, 2)}

IDENTITY & GREETING RULES:
1. You are Alex, a Senior Technical Recruiter. If you introduce yourself, always use the name Alex.
2. DO NOT use the candidate's name. Start your messages with a simple, natural greeting like "Hi," or "Hello," without attaching a name to it.
3. NEVER output placeholders, brackets, or variables (e.g., no [Candidate Name], no [Skill], no [Insert Here]). If you lack specific information, speak generally but naturally.
4. ENFORCE CHAT MEDIUM: You are typing in a real-time instant messenger (like Slack), not writing an email. Keep your messages to a maximum of 2 short sentences. Be direct and human.

YOUR TASK:
1. PERCEIVE: Classify the candidate's intent, sentiment, and any objections.
2. REASON: Plan your strategy internally based on the persona rules above.
3. ACT: Propose the correct stage transition and draft your reply.

VALID STAGE TRANSITIONS (in order):
COLD_OPEN -> QUALIFYING -> OBJECTION_HANDLING -> SCHEDULING -> CLOSED

Only transition forward when the conversation naturally warrants it. You may stay in the current stage if the candidate hasn't given enough signal to advance.

GENERATIVE UI RULE:
When you successfully handle objections and move the candidate to the SCHEDULING stage, you MUST set uiAction to RENDER_CALENDAR so the system can render the interview booking widget. For all other stages, set uiAction to NONE.`;

    // 3. ACT: Generate structured JSON via Gemini with strict Zod enforcement
    const { object: agentTurn } = await generateObject({
      model: google("gemini-2.0-flash"),
      schema: AgentTurnSchema,
      system: systemPrompt,
      messages,
    });

    // Failsafe: Strip any hallucinated bracketed placeholders from the final output
    let safeReply = agentTurn.replyMessage;
    safeReply = safeReply.replace(/\[.*?\]/g, '').replace(/\s{2,}/g, ' ').trim();
    agentTurn.replyMessage = safeReply;

    // 4. DEFEND: Secondary QA critique loop — audit against "dont" rules
    const dontRules = company.persona_json?.dont || [];
    let finalReplyMessage = agentTurn.replyMessage;
    let qaResult = { passedQA: true, reasoning: "No dont rules configured — skipping QA.", rewrittenMessage: agentTurn.replyMessage };

    if (dontRules.length > 0) {
      const { object: qa } = await generateObject({
        model: google("gemini-2.0-flash"),
        schema: QASchema,
        prompt: `You are a brand safety QA auditor. Your job is to check if the following recruiter message violates ANY of the company's strict "don't" rules.

DON'T RULES (the message MUST NOT do any of these):
${dontRules.map((r: string, i: number) => `${i + 1}. ${r}`).join("\n")}

MESSAGE TO AUDIT:
"${agentTurn.replyMessage}"

If the message violates even ONE rule, set passedQA to false, explain which rule was violated, and rewrite the message to comply while preserving the original intent and tone. If it passes all rules, set passedQA to true and return the original message exactly.`,
      });

      qaResult = qa;

      if (!qa.passedQA) {
        finalReplyMessage = qa.rewrittenMessage;
      }
    }

    // Append the final (possibly rewritten) reply to the message history
    const updatedHistory = [
      ...cleanHistory,
      ...(candidateMessage ? [{ role: "user", content: candidateMessage }] : []),
      { role: "assistant", content: finalReplyMessage, uiAction: agentTurn.uiAction },
    ];

    // Persist the new stage and chat history to Supabase
    const { error: updateError } = await supabase
      .from("candidate_states")
      .update({
        current_stage: agentTurn.proposedStageTransition,
        chat_history: updatedHistory,
      })
      .eq("company_id", companyId);

    if (updateError) {
      console.error("Failed to update candidate state:", updateError);
    }

    // Return the full structured JSON to the frontend
    return NextResponse.json({
      perceivedIntent: agentTurn.perceivedIntent,
      internalMonologue: agentTurn.internalMonologue,
      proposedStageTransition: agentTurn.proposedStageTransition,
      uiAction: agentTurn.uiAction,
      replyMessage: finalReplyMessage,
      qa: {
        passedQA: qaResult.passedQA,
        reasoning: qaResult.reasoning,
      },
    });
  } catch (error: any) {
    console.error("Agent Turn API Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
