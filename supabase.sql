CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  industry TEXT,
  core_values TEXT,
  hiring_profile TEXT,
  tone_guidelines TEXT,
  persona_json JSONB, -- The AI-generated strict personality rules
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE candidate_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  current_stage VARCHAR(50) DEFAULT 'INITIAL_OUTBOUND', 
  engagement_score INT DEFAULT 0,
  chat_history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
