# PSVIEW Agent Sandbox

PSVIEW Agent Sandbox is a high-performance, single-tenant Next.js 15 (App Router) application that deploys an autonomous AI talent recruiter.

What makes this agent intelligent and not just an LLM call is its structural decoupling of cognitive synthesis from message generation: the agent is locked within an execution boundary that mandates candidate intent classification, cultural integrity checks, and systemic state transitions prior to drafting customer-facing copy.

## Technical Stack
- **Framework**: Next.js 15 (App Router)
- **UI & Styling**: Tailwind CSS, Shadcn UI (Zinc theme)
- **Database**: Supabase (PostgreSQL)
- **AI Core**: Vercel AI SDK (@ai-sdk/google) with `gemini-1.5-pro`
- **Validation**: Zod (for strict JSON schema validation)

## Architecture & Technical Decisions

### 1. Deterministic State Machine
Instead of relying on an open-ended conversational chain, the AI recruiter strictly adheres to a state machine (`COLD_OPEN`, `QUALIFYING`, `OBJECTION_HANDLING`, `SCHEDULING`, `CLOSED`). The agent explicitly evaluates the conversation stage at every turn and forces transitions to push the interview process forward.

### 2. Perceive -> Reason -> Act Cognitive Loop
We avoid raw text streaming. The core reasoning engine API (`/api/agent/turn`) uses strict JSON Schema enforcement (`generateObject`) to output four required properties on every turn:
- `perceivedIntent`: Real-time intent and objection classification.
- `internalMonologue`: The agent's private strategic planning sequence based on company core values.
- `proposedStageTransition`: The deterministic state shift.
- `replyMessage`: The clean, fully compliant candidate-facing response.

### 3. Server-Side Execution
All database mutations, AI orchestration, and context hydration are handled via secure Next.js Server Actions (`lib/actions.ts`) and API Routes (`app/api/agent/turn/route.ts`). The client only receives the final sanitized output and cognitive logs for the simulator UI, completely protecting the database credentials and AI API keys.

### 4. Split-Screen Playground Simulator
The UI provides an elegant split-screen diagnostic environment:
- **Candidate Sandbox**: A seamless chat interface for simulating the human candidate's behavior.
- **Intelligence Terminal**: A live diagnostic view rendering the agent's real-time thought process, state transitions, and specific constraints.

## Getting Started
1. **Database Setup**: Execute the queries found in `supabase.sql` within your Supabase project's SQL editor.
2. **Environment Configuration**: Ensure your `.env.local` contains `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `GOOGLE_GENERATIVE_AI_API_KEY`.
3. **Start the Agent**: Run `npm run dev` and navigate to `http://localhost:3000/new` to initialize your first autonomous recruiter.
