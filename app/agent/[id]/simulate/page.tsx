import { createClient } from "@supabase/supabase-js";
import ClientSimulator from "./ClientSimulator";
import { notFound } from "next/navigation";

// Server-side Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function SimulatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Fetch company data (server-side, secure)
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("*")
    .eq("id", id)
    .single();

  if (companyError || !company) {
    return notFound();
  }

  // Fetch the latest candidate state for this company
  const { data: state, error: stateError } = await supabase
    .from("candidate_states")
    .select("*")
    .eq("company_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (stateError || !state) {
    return notFound();
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-zinc-950 p-4 lg:p-8">
      <ClientSimulator company={company} initialState={state} />
    </div>
  );
}
