import type { ProposalDocument, ProposalInputs } from "./types";

/**
 * Pure draft builder — swap this for an AI / agent orchestration layer later.
 */
export function buildProposalDraft(inputs: ProposalInputs): ProposalDocument {
  const client = inputs.clientName.trim() || "your organization";
  const site = inputs.website.trim();
  const budget = inputs.budget.trim() || "to be refined";
  const timeline = inputs.timeline.trim() || "aligned with your launch goals";
  const reqs = inputs.requirements.trim();

  const scopeBullets = reqs
    ? reqs
        .split(/\n|•|-\s+/)
        .map((s) => s.trim())
        .filter(Boolean)
    : [
        "Discovery workshop and success metrics",
        "Solution design and phased delivery plan",
        "Implementation, QA, and handover",
      ];

  const scopeBody =
    scopeBullets.map((b) => `• ${b}`).join("\n") +
    (site
      ? `\n\nWe will review ${site} to align the proposal with your current positioning and conversion paths.`
      : "");

  return {
    title: `Commercial proposal — ${client}`,
    generatedAt: new Date().toISOString(),
    sections: [
      {
        heading: "Executive summary",
        body: `Thank you for the opportunity to partner with ${client}. This proposal outlines how we will deliver the outcomes you described within the budget (${budget}) and timeline (${timeline}) you shared.`,
      },
      {
        heading: "Understanding & objectives",
        body: reqs
          ? `Based on your requirements, we will prioritize clarity, speed to value, and measurable impact across the engagement.`
          : `We will confirm objectives in a short discovery session so scope, milestones, and success metrics are shared and trackable.`,
      },
      {
        heading: "Scope of work",
        body: scopeBody,
      },
      {
        heading: "Investment & timeline",
        body: `Indicative investment: ${budget}.\nPlanned timeline: ${timeline}.\n\nFinal pricing and schedule are confirmed after discovery; this document is a working draft for discussion.`,
      },
      {
        heading: "Next steps",
        body: `1) Review this draft\n2) 30-minute alignment call\n3) Finalize statement of work and kickoff`,
      },
    ],
  };
}
