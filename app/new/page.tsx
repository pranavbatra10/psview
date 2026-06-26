"use client";

import { useActionState, useEffect } from "react";
import { createCompanyAction } from "@/lib/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function NewCompanyPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createCompanyAction, null);

  useEffect(() => {
    if (state?.success && state?.companyId) {
      router.push(`/agent/${state.companyId}/simulate`);
    }
  }, [state, router]);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-zinc-900 border-zinc-800 text-zinc-100 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight text-white">Initialize AI Recruiter</CardTitle>
          <CardDescription className="text-zinc-400">
            Define your company profile to generate the deterministic state machine for your autonomous agent.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-6">
            {state?.error && (
              <div className="p-3 text-sm text-red-400 bg-red-950/50 border border-red-900 rounded-md">
                {state.error}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-zinc-300">Company Name</Label>
                <Input 
                  id="name" 
                  name="name" 
                  placeholder="e.g. Acme Corp" 
                  required 
                  disabled={isPending}
                  className="bg-zinc-950 border-zinc-800 focus-visible:ring-zinc-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry" className="text-zinc-300">Industry</Label>
                <Input 
                  id="industry" 
                  name="industry" 
                  placeholder="e.g. B2B SaaS" 
                  required 
                  disabled={isPending}
                  className="bg-zinc-950 border-zinc-800 focus-visible:ring-zinc-700"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="core_values" className="text-zinc-300">Core Values</Label>
              <Input 
                id="core_values" 
                name="core_values" 
                placeholder="e.g. Move fast, customer first, radical candor" 
                required 
                disabled={isPending}
                className="bg-zinc-950 border-zinc-800 focus-visible:ring-zinc-700"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hiring_profile" className="text-zinc-300">Hiring Profile</Label>
              <Textarea 
                id="hiring_profile" 
                name="hiring_profile" 
                placeholder="Describe the ideal candidate. e.g. Senior Full-Stack Engineers with Next.js & Postgres experience, based in US." 
                required 
                disabled={isPending}
                className="min-h-[100px] bg-zinc-950 border-zinc-800 focus-visible:ring-zinc-700"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tone_guidelines" className="text-zinc-300">Tone Guidelines</Label>
              <Textarea 
                id="tone_guidelines" 
                name="tone_guidelines" 
                placeholder="How should the AI talk? e.g. Professional but enthusiastic, concise, no corporate jargon." 
                required 
                disabled={isPending}
                className="min-h-[100px] bg-zinc-950 border-zinc-800 focus-visible:ring-zinc-700"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200 font-semibold"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Persona...
                </>
              ) : (
                "Deploy Agent"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
