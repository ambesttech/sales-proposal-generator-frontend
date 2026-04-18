/** Must match backend `app/graph/pipeline.py` node ids and ordering. */

export type GenerationStepDef = {
  id: string;
  title: string;
  detail?: string;
};

export const GENERATION_PIPELINE: GenerationStepDef[] = [
  {
    id: "intake",
    title: "Intake agent",
    detail: "Normalizing notes into an internal brief",
  },
  {
    id: "extract_requirements",
    title: "Requirements agent",
    detail: "Structuring goals, constraints, and commercial context",
  },
  {
    id: "proposal_writer",
    title: "Proposal writer",
    detail: "Drafting sections and commercial language",
  },
  {
    id: "quality_review",
    title: "Review agent",
    detail: "Completeness, consistency, and risk pass",
  },
];

export type GenerationStepStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed";

export type GenerationProgressState = {
  runId: string | null;
  steps: GenerationStepDef[];
  statusById: Record<string, GenerationStepStatus>;
};

export function optimisticGenerationProgress(): GenerationProgressState {
  const statusById: Record<string, GenerationStepStatus> = {};
  for (const s of GENERATION_PIPELINE) {
    statusById[s.id] = "pending";
  }
  statusById[GENERATION_PIPELINE[0].id] = "running";
  return {
    runId: null,
    steps: [...GENERATION_PIPELINE],
    statusById,
  };
}
