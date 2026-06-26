"use server";

import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

const googleForm = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY_FORM || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});
import { z } from "zod";

// Zod schema matching our form state exactly
const ExtractedContextSchema = z.object({
  name: z.string().describe("The company name."),
  industry: z
    .string()
    .describe("The industry the company operates in (e.g., Fintech, DevTools, Healthcare)."),
  coreValues: z
    .string()
    .describe(
      "Extract company culture, values, and working style. Be specific and detailed."
    ),
  hiringProfile: z
    .string()
    .describe(
      "Extract the ideal candidate profile, technical requirements, or the type of people they hire."
    ),
  toneGuidelines: z
    .string()
    .describe(
      "Infer the tone of voice based on their website copy (e.g., formal, casual, highly technical, playful)."
    ),
});

// We don't need stripHtml anymore because Jina Reader API returns clean markdown

export async function magicFillFromUrl(url: string) {
  try {
    // Normalize URL
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith("http")) {
      normalizedUrl = "https://" + normalizedUrl;
    }

    // Fetch the page content via Jina Reader API (bypasses anti-bot & returns clean markdown)
    const res = await fetch(`https://r.jina.ai/${normalizedUrl}`, {
      headers: {
        Accept: "text/plain",
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!res.ok) {
      if (res.status === 429) {
        return { error: `Target website blocked the request (HTTP 429). They have strict anti-scraping protection.` };
      }
      return { error: `Failed to fetch URL (HTTP ${res.status}). Make sure it's a valid, public website.` };
    }

    let pageText = await res.text();
    
    // Truncate to stay within Gemini token limits if it's a massive page
    pageText = pageText.slice(0, 10000);

    if (pageText.length < 50) {
      return { error: "Could not extract meaningful text from this URL. The page may be JavaScript-rendered." };
    }

    const { object: extracted } = await generateObject({
      model: googleForm("gemini-2.5-flash"),
      schema: ExtractedContextSchema,
      maxRetries: 0,
      prompt: `You are analyzing a company's website to extract recruiting context. Based on the following website text, extract structured company information. Be detailed and specific — infer what you can from the copy, tone, and content.

WEBSITE TEXT:
${pageText}

Extract the company name, industry, core values/culture, ideal candidate profile, and tone guidelines from this content.`,
    });

    return { data: extracted };
  } catch (error: any) {
    console.error("Magic Fill Error:", error);

    if (error.name === "TimeoutError" || error.message?.includes("timeout")) {
      return { error: "Request timed out. The website may be too slow or unreachable." };
    }

    return { error: error.message || "Failed to extract company data from URL." };
  }
}
