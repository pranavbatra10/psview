# PSVIEW Autonomous Recruiter Agent

![Next.js 15](https://img.shields.io/badge/Next.js%2015-black?style=for-the-badge&logo=next.js&logoColor=white)
![Vercel AI SDK](https://img.shields.io/badge/Vercel%20AI%20SDK-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Gemini 1.5 Pro](https://img.shields.io/badge/Gemini%201.5%20Pro-8E75B2?style=for-the-badge&logo=googlebard&logoColor=white)

[**Live Application**](#) • [**GitHub Repository**](#)

---

## Overview

The PSVIEW Autonomous Recruiter Agent is a highly advanced, state-driven cognitive pipeline designed to conduct personalized, real-time recruiting outreach. 

Unlike traditional "LLM prompt-wrappers" that simply stream unstructured text, this architecture is built on a rigid cognitive engine. It strictly decouples **intent analysis** from **message generation**, allowing the agent to reason about the candidate's objections, classify sentiment, and advance through a structured hiring funnel—all before it ever drafts a reply.

---

## Architectural X-Factors

This system was engineered with three critical advanced capabilities:

### 1. Deterministic State Constraints
The agent does not hallucinate its workflow. It is tethered to a robust, PostgreSQL-backed state machine (powered by Supabase). The AI is forced to progress linearly through a structured recruiting funnel (`COLD_OPEN` → `QUALIFYING` → `OBJECTION_HANDLING` → `SCHEDULING` → `CLOSED`), ensuring it never pitches an interview before properly qualifying the candidate.

### 2. Generative UI
Instead of relying on clunky markdown links, the AI utilizes explicit tool-calling to render interactive React components natively in the chat stream. When the agent successfully transitions a candidate to the `SCHEDULING` stage, it automatically injects a live Calendar scheduling widget directly into the conversational UI.

### 3. Defensive Safety Guardrails
To guarantee brand safety and prevent rogue outputs, we implemented a dual-LLM architecture. Every single outbound message is intercepted by a secondary, asynchronous QA critique loop. This "Brand Auditor" agent cross-references the proposed message against the company's strict "don't" rules (e.g., "no corporate speak", "no overpromising salaries"). If a violation is detected, the auditor silently rewrites the message to enforce compliance before it ever hits the client.

---

## Local Setup Instructions

Follow these steps to run the cognitive pipeline locally:

### 1. Clone the Repository
```bash
git clone https://github.com/pranavbatra10/psview.git
cd psview
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
We use a dual-key setup to load-balance AI inference and bypass free-tier rate limits.
```bash
cp .env.example .env.local
```
Open `.env.local` and populate the required API keys for Google Gemini and Supabase.

### 4. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to configure your first recruiter persona and launch the simulator.
