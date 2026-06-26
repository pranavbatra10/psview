# PSVIEW Autonomous Corporate Talent Agent

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)](https://nextjs.org/)
[![Vercel AI SDK](https://img.shields.io/badge/Vercel_AI_SDK-Core-black?style=flat&logo=vercel)](https://sdk.vercel.ai/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat&logo=supabase)](https://supabase.com/)
[![Gemini](https://img.shields.io/badge/Model-Gemini_2.5_Flash-blue?style=flat&logo=google)](https://ai.google.dev/)

**Live Production App:** [INSERT_VERCEL_URL_HERE]  
**GitHub Repository:** [https://github.com/pranavbatra10/psview](https://github.com/pranavbatra10/psview)  

---

## ⚡ System Overview

Most AI recruiting tools are simple "prompt wrappers" around standard chat models. They freely hallucinate text, lose track of candidate context, and fail to maintain brand safety.

The **PSVIEW Autonomous Corporate Talent Agent** solves this by enforcing a **structured cognitive pipeline**. The architecture physically decouples cognitive reasoning (intent extraction, state evaluation, rule validation) from outward message generation. The agent operates within a strict execution boundary backed by PostgreSQL, ensuring deterministic execution on every conversation turn.

---

## 🧠 Architectural X-Factors (Beyond Baseline Requirements)

To demonstrate founding-level AI engineering capabilities, this engine implements four advanced architectural layers:

### 1. Deterministic Finite State Machine (FSM)
The agent does not guess its objective. Conversations are mathematically locked into a directional state flow:
`COLD_OPEN` ➔ `QUALIFYING` ➔ `OBJECTION_HANDLING` ➔ `SCHEDULING` ➔ `CLOSED`

On every turn, the backend uses the Vercel AI SDK (`generateObject`) to extract candidate intent into strict JSON, persisting the exact conversation state to Supabase *before* updating the client UI.

### 2. Generative UI & Dynamic Tool Calling
When the agent successfully transitions a candidate into the `SCHEDULING` state, it bypasses static text links. Leveraging AI tool-calling, the backend dynamically emits and renders an interactive React `<Calendar>` component directly inside the candidate's chat feed.

### 3. Defensive Brand Safety Guardrails (Secondary LLM Loop)
Before any drafted response reaches the candidate, it is intercepted by an independent QA Agent. This secondary LLM evaluates the draft against the company's negative constraints (`dont` rules). If a tone violation or banned phrase is detected, the QA loop blocks the message, auto-rewrites it to maintain compliance, and logs a red visual warning to the recruiter's intelligence terminal.

### 4. Magic Fill Context Scraper
To eliminate manual onboarding friction, recruiters can paste any company's public career URL. A Next.js Server Action fetches the DOM, extracts unstructured culture/benefit copy, and transforms it into the strict structured JSON playbook required by the database schema.

---

## 🛠 Tech Stack

* **Framework:** Next.js 15 (App Router, Server Actions, TypeScript)
* **AI Orchestration:** Vercel AI SDK (`generateObject`, Tool Calling)
* **Database & ORM:** Supabase (PostgreSQL)
* **Primary LLM Engine:** Google Gemini 2.5 Flash (`gemini-2.5-flash`)
* **UI & Styling:** Tailwind CSS, Shadcn UI, Lucide Icons (Dark Zinc Theme)

---

## 🚀 Local Setup & Installation

Follow these steps to run the cognitive engine locally:

### 1. Clone the repository
```bash
git clone https://github.com/pranavbatra10/psview.git
cd psview
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the root directory based on `.env.example`. We utilize a dual-key load-balancing setup for inference:

```env
GOOGLE_GENERATIVE_AI_API_KEY_FORM="your_secondary_gemini_key_for_magic_fill"
GOOGLE_GENERATIVE_AI_API_KEY="your_gemini_key_here"
NEXT_PUBLIC_SUPABASE_URL="your_supabase_project_url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"
```

### 4. Run the development server
```bash
npm run dev
```

Navigate to [http://localhost:3000](http://localhost:3000) to configure a new company playbook and initialize the split-screen simulator.

---

*Architected and engineered for the PSVIEW Founding Engineer technical evaluation.*
