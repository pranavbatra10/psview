"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Globe, Zap } from "lucide-react";
import { magicFillFromUrl } from "@/app/actions/magic-fill";

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [scrapeStatus, setScrapeStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    industry: "",
    coreValues: "",
    hiringProfile: "",
    toneGuidelines: "",
  });

  // Magic Fill: Scrape URL and auto-fill all fields
  async function handleMagicFill() {
    if (!scrapeUrl.trim()) return;
    setIsScraping(true);
    setScrapeStatus(null);

    try {
      const result = await magicFillFromUrl(scrapeUrl.trim());

      if (result.error) {
        setScrapeStatus({ type: "error", message: result.error });
        return;
      }

      if (result.data) {
        setFormData({
          name: result.data.name || formData.name,
          industry: result.data.industry || formData.industry,
          coreValues: result.data.coreValues || formData.coreValues,
          hiringProfile: result.data.hiringProfile || formData.hiringProfile,
          toneGuidelines:
            result.data.toneGuidelines || formData.toneGuidelines,
        });
        setScrapeStatus({
          type: "success",
          message: "Company DNA extracted! Review and edit the fields below.",
        });
      }
    } catch (err: any) {
      setScrapeStatus({
        type: "error",
        message: err.message || "Something went wrong.",
      });
    } finally {
      setIsScraping(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/generate-persona", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success && data.companyId) {
        router.push(`/agent/${data.companyId}/simulate`);
      } else {
        alert("Error: " + (data.error || JSON.stringify(data)));
      }
    } catch (err) {
      console.error(err);
      alert("Error contacting the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-zinc-900 border-zinc-800 text-zinc-100">
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight text-white">
            PSVIEW Agent Playbook Configuration
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Configure your company{"'"}s internal DNA. Our cognitive state
            engine will synthesize a unique recruiting persona from this
            context.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ============================================ */}
            {/* MAGIC FILL — URL EXTRACTOR                   */}
            {/* ============================================ */}
            <div className="bg-zinc-950/70 border border-zinc-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-semibold text-amber-400">
                  Magic Fill
                </span>
                <span className="text-xs text-zinc-500">
                  — Paste a company website to auto-extract everything
                </span>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <Input
                    value={scrapeUrl}
                    onChange={(e) => setScrapeUrl(e.target.value)}
                    placeholder="https://stripe.com"
                    className="bg-zinc-900 border-zinc-700 pl-9 h-10 text-sm focus-visible:ring-amber-500/50"
                    disabled={isScraping}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleMagicFill();
                      }
                    }}
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleMagicFill}
                  disabled={isScraping || !scrapeUrl.trim()}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-semibold px-4 h-10 disabled:opacity-40 transition-all"
                >
                  {isScraping ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Extracting DNA...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Magic Fill
                    </>
                  )}
                </Button>
              </div>

              {/* Status message */}
              {scrapeStatus && (
                <div
                  className={`text-xs px-3 py-2 rounded-md ${
                    scrapeStatus.type === "success"
                      ? "bg-emerald-950/50 text-emerald-400 border border-emerald-800/50"
                      : "bg-red-950/50 text-red-400 border border-red-800/50"
                  }`}
                >
                  {scrapeStatus.type === "success" ? "✓ " : "✗ "}
                  {scrapeStatus.message}
                </div>
              )}
            </div>

            {/* ============================================ */}
            {/* FORM FIELDS                                  */}
            {/* ============================================ */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">
                  Company Name
                </label>
                <Input
                  required
                  placeholder="e.g., Stripe"
                  className="bg-zinc-950 border-zinc-800 focus:ring-emerald-500"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">
                  Industry
                </label>
                <Input
                  required
                  placeholder="e.g., Fintech / Developer Infrastructure"
                  className="bg-zinc-950 border-zinc-800"
                  value={formData.industry}
                  onChange={(e) =>
                    setFormData({ ...formData, industry: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">
                Core Values & Culture
              </label>
              <Textarea
                required
                placeholder="What makes your working environment unique? (e.g., Extreme async autonomy, fast shipping cycles, intense engineering rigor)"
                className="bg-zinc-950 border-zinc-800 min-h-[100px]"
                value={formData.coreValues}
                onChange={(e) =>
                  setFormData({ ...formData, coreValues: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">
                Ideal Candidate Profile (ICP)
              </label>
              <Textarea
                required
                placeholder="Who are you looking for? (e.g., Senior Product Engineers who build end-to-end and don't need management scaffolding)"
                className="bg-zinc-950 border-zinc-800 min-h-[100px]"
                value={formData.hiringProfile}
                onChange={(e) =>
                  setFormData({ ...formData, hiringProfile: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">
                Tone of Voice Guidelines
              </label>
              <Textarea
                required
                placeholder="How does your brand speak? (e.g., Warm, highly technical peer-to-peer dialogue. Zero generic recruiter jargon. Straight to the point.)"
                className="bg-zinc-950 border-zinc-800 min-h-[80px]"
                value={formData.toneGuidelines}
                onChange={(e) =>
                  setFormData({ ...formData, toneGuidelines: e.target.value })
                }
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 rounded-md transition-colors disabled:opacity-50"
            >
              {loading
                ? "Synthesizing AI Recruiting Persona..."
                : "Deploy Recruiter Agent"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
