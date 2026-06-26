import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const PersonaSchema = z.object({
  voice_rules: z.array(z.string()),
  do: z.array(z.string()),
  dont: z.array(z.string()),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, industry, coreValues, hiringProfile, toneGuidelines } = body;

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY_FORM || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "No API key configured" }, { status: 500 });
    }

    const googleForm = createGoogleGenerativeAI({ apiKey });

    const prompt = `Analyze this company profile and generate a strict recruiter persona playbook.

Company: ${name} (${industry})
Culture: ${coreValues}
Target Candidate: ${hiringProfile}
Desired Tone: ${toneGuidelines}

You must extract their tone and requirements into strict actionable rules.`;

    let personaJson;
    try {
      // First try the ultra-stable 2.5-flash model
      const { object } = await generateObject({
        model: googleForm("gemini-2.5-flash"),
        schema: PersonaSchema,
        prompt,
        maxRetries: 0,
      });
      personaJson = object;
    } catch (err: any) {
      console.log("gemini-1.5-flash failed, falling back to gemini-2.5-flash:", err.message);
      // Fallback to 2.5-flash if 1.5-flash is temporarily unavailable
      const { object } = await generateObject({
        model: googleForm("gemini-2.5-flash"),
        schema: PersonaSchema,
        prompt,
        maxRetries: 0,
      });
      personaJson = object;
    }

    // Save to Supabase
    const { data, error } = await supabase
      .from("companies")
      .insert([{
        name,
        industry,
        core_values: coreValues,
        hiring_profile: hiringProfile,
        tone_guidelines: toneGuidelines,
        persona_json: personaJson,
      }])
      .select()
      .single();

    if (error) {
      console.error("Supabase Error:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Initialize candidate state
    await supabase.from("candidate_states").insert({
      company_id: data.id,
      current_stage: "COLD_OPEN",
      chat_history: [],
    });

    return NextResponse.json({ success: true, companyId: data.id });

  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
