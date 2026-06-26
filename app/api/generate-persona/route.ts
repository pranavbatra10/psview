import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function callGemini(prompt: string, apiKey: string) {
  // Try multiple models in order of preference
  const models = [
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
  ];

  let lastError = "";

  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
            },
          }),
        }
      );

      const data = await res.json();

      if (data.error) {
        lastError = `${model}: ${data.error.message}`;
        continue; // Try next model
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return JSON.parse(text);
      }
    } catch (err: any) {
      lastError = `${model}: ${err.message}`;
      continue;
    }
  }

  throw new Error(`All models failed. Last error: ${lastError}`);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, industry, coreValues, hiringProfile, toneGuidelines } = body;

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "No API key configured" }, { status: 500 });
    }

    const prompt = `Analyze this company profile and generate a strict recruiter persona playbook as JSON.

Company: ${name} (${industry})
Culture: ${coreValues}
Target Candidate: ${hiringProfile}
Desired Tone: ${toneGuidelines}

Return ONLY valid JSON in this exact format:
{
  "voice_rules": ["rule1", "rule2", "rule3"],
  "do": ["tactic1", "tactic2", "tactic3"],
  "dont": ["avoid1", "avoid2", "avoid3"]
}`;

    const personaJson = await callGemini(prompt, apiKey);

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
