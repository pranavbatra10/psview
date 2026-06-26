"use server";

import { supabase } from "@/lib/supabase";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { redirect } from "next/navigation";

export async function createCompanyAction(prevState: any, formData: FormData) {
  const name = formData.get("name") as string;
  const industry = formData.get("industry") as string;
  const core_values = formData.get("core_values") as string;
  const hiring_profile = formData.get("hiring_profile") as string;
  const tone_guidelines = formData.get("tone_guidelines") as string;

  if (!name || !industry || !core_values || !hiring_profile || !tone_guidelines) {
    return { error: "All fields are required." };
  }

  try {
    const prompt = `
      Based on the following company profile, generate strict personality rules (persona_json) for an autonomous AI recruiter agent.
      
      Company Name: ${name}
      Industry: ${industry}
      Core Values: ${core_values}
      Hiring Profile: ${hiring_profile}
      Tone Guidelines: ${tone_guidelines}
    `;

    const { object: persona_json } = await generateObject({
      model: google("gemini-1.5-pro"),
      schema: z.object({
        voice_rules: z.array(z.string()),
        do: z.array(z.string()),
        dont: z.array(z.string()),
      }),
      prompt,
    });

    if (!supabase) {
      throw new Error("Supabase client is not initialized.");
    }

    const { data: companyData, error: companyError } = await supabase
      .from("companies")
      .insert({
        name,
        industry,
        core_values,
        hiring_profile,
        tone_guidelines,
        persona_json,
      })
      .select("id")
      .single();

    if (companyError || !companyData) {
      console.error("Supabase Insert Error:", companyError);
      return { error: "Failed to save company to the database." };
    }

    const { error: stateError } = await supabase
      .from("candidate_states")
      .insert({
        company_id: companyData.id,
        current_stage: "COLD_OPEN",
        chat_history: [],
      });

    if (stateError) {
      console.error("Candidate State Error:", stateError);
      return { error: "Failed to initialize candidate state." };
    }

    return { success: true, companyId: companyData.id };
  } catch (err: any) {
    console.error("Action Error:", err);
    return { error: err.message || "An unexpected error occurred." };
  }
}
