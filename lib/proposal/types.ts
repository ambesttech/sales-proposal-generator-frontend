export type ProposalInputs = {
  clientName: string;
  website: string;
  budget: string;
  timeline: string;
  requirements: string;
  /** Optional; sent to API for DB `user_id`. Use auth or NEXT_PUBLIC_USER_ID. */
  userId: string;
};

export type ProposalDocument = {
  title: string;
  sections: { heading: string; body: string }[];
  generatedAt: string;
};

/** Structured output from the LangGraph Review agent (snake_case keys from the API). */
export type AgentReview = {
  completeness_notes: string[];
  consistency_notes: string[];
  missing_sections: string[];
  risky_claims: string[];
  weak_writing: string[];
  suggested_fixes: string[];
  ready_to_send: boolean;
  overall_verdict: string;
};

export type RequirementsSummary = {
  goals?: string[];
  pain_points?: string[];
  constraints?: string[];
  budget?: string | null;
  timeline?: string | null;
};
