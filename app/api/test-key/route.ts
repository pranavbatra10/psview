import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json({ error: "No API key found in env" });
  }

  // Test the key directly against Google's REST API (bypassing SDK entirely)
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    const data = await res.json();

    if (data.error) {
      return NextResponse.json({ 
        status: "KEY_ERROR", 
        keyPrefix: apiKey.substring(0, 10) + "...",
        error: data.error 
      });
    }

    // List available model names
    const modelNames = data.models?.map((m: any) => m.name).filter((n: string) => 
      n.includes("gemini")
    ) || [];

    return NextResponse.json({ 
      status: "KEY_WORKS",
      keyPrefix: apiKey.substring(0, 10) + "...",
      availableGeminiModels: modelNames.slice(0, 15),
    });
  } catch (err: any) {
    return NextResponse.json({ status: "FETCH_ERROR", message: err.message });
  }
}
