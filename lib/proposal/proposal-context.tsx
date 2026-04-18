"use client";

import { flushSync } from "react-dom";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { buildProposalDraft } from "./build-proposal-draft";
import { notifyProposalsCatalogChanged } from "./proposals-api";
import {
  optimisticGenerationProgress,
  type GenerationProgressState,
  type GenerationStepDef,
} from "./generation-pipeline";
import type {
  AgentReview,
  ProposalDocument,
  ProposalInputs,
  RequirementsSummary,
} from "./types";

const defaultInputs: ProposalInputs = {
  clientName: "Acme Industries",
  website: "https://example.com",
  budget: "45k - 60k",
  timeline: "8 weeks, start May",
  requirements:
    "CRM integration\nPartner portal MVP\nAnalytics dashboard",
  userId:
    typeof process !== "undefined"
      ? (process.env.NEXT_PUBLIC_USER_ID ?? "")
      : "",
};

type GenerateApiResponse = {
  runId: string;
  proposal: ProposalDocument;
  review: AgentReview;
  normalizedBrief?: string;
  requirements?: RequirementsSummary;
  retrievalContext?: string;
};

type ProposalContextValue = {
  inputs: ProposalInputs;
  proposal: ProposalDocument;
  isGenerating: boolean;
  generationProgress: GenerationProgressState | null;
  agentReview: AgentReview | null;
  normalizedBrief: string | null;
  requirementsSummary: RequirementsSummary | null;
  lastError: string | null;
  setField: <K extends keyof ProposalInputs>(
    key: K,
    value: ProposalInputs[K],
  ) => void;
  regenerate: () => void;
  generateProposal: () => Promise<void>;
};

const ProposalContext = createContext<ProposalContextValue | null>(null);

function applyStartEvent(
  prev: GenerationProgressState,
  ev: Record<string, unknown>,
): GenerationProgressState {
  const stepsRaw = ev.steps;
  const steps: GenerationStepDef[] =
    Array.isArray(stepsRaw) && stepsRaw.length
      ? (stepsRaw as GenerationStepDef[])
      : prev.steps;
  const runId =
    typeof ev.runId === "string" && ev.runId.length ? ev.runId : prev.runId;
  return { ...prev, steps, runId };
}

export function ProposalProvider({ children }: { children: ReactNode }) {
  const [inputs, setInputs] = useState<ProposalInputs>(defaultInputs);
  const [proposal, setProposal] = useState<ProposalDocument>(() =>
    buildProposalDraft(defaultInputs),
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] =
    useState<GenerationProgressState | null>(null);
  const [agentReview, setAgentReview] = useState<AgentReview | null>(null);
  const [normalizedBrief, setNormalizedBrief] = useState<string | null>(null);
  const [requirementsSummary, setRequirementsSummary] =
    useState<RequirementsSummary | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const progressClearTimerRef = useRef<number | null>(null);

  const setField = useCallback(
    <K extends keyof ProposalInputs>(key: K, value: ProposalInputs[K]) => {
      setInputs((prev) => {
        const next = { ...prev, [key]: value };
        setProposal(buildProposalDraft(next));
        setLastError(null);
        return next;
      });
    },
    [],
  );

  const regenerate = useCallback(() => {
    setProposal(buildProposalDraft(inputs));
    setLastError(null);
    setAgentReview(null);
    setNormalizedBrief(null);
    setRequirementsSummary(null);
  }, [inputs]);

  const generateProposal = useCallback(async () => {
    if (progressClearTimerRef.current !== null) {
      window.clearTimeout(progressClearTimerRef.current);
      progressClearTimerRef.current = null;
    }

    setLastError(null);
    setGenerationProgress(optimisticGenerationProgress());
    setIsGenerating(true);

    let completedOk = false;

    try {
      const publicBase =
        process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";
      const url = publicBase
        ? `${publicBase}/api/v1/proposals/generate/stream`
        : "/api/v1/proposals/generate/stream";

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: inputs.clientName,
          website: inputs.website,
          budget: inputs.budget,
          timeline: inputs.timeline,
          requirements: inputs.requirements,
          userId: inputs.userId,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        let data: unknown = null;
        try {
          data = text ? JSON.parse(text) : null;
        } catch {
          data = null;
        }
        const rawDetail =
          typeof data === "object" && data !== null && "detail" in data
            ? (data as { detail: unknown }).detail
            : undefined;
        let detail: string;
        if (typeof rawDetail === "string") {
          detail = rawDetail;
        } else if (Array.isArray(rawDetail)) {
          detail = rawDetail
            .map((item) =>
              typeof item === "object" &&
              item !== null &&
              "msg" in item &&
              typeof (item as { msg: unknown }).msg === "string"
                ? (item as { msg: string }).msg
                : JSON.stringify(item),
            )
            .join("; ");
        } else {
          detail = text || `Request failed (${res.status})`;
        }
        throw new Error(detail);
      }

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error("The server returned an empty response body.");
      }

      const decoder = new TextDecoder();
      let buffer = "";
      const streamResult: { payload: GenerateApiResponse | null } = {
        payload: null,
      };

      const consumeStreamEvent = (ev: Record<string, unknown>) => {
        const t = ev.type;
        if (t === "start") {
          setGenerationProgress((prev) =>
            prev ? applyStartEvent(prev, ev) : prev,
          );
        } else if (t === "step" && typeof ev.id === "string") {
          const st = ev.status;
          const nextStatus =
            st === "running"
              ? "running"
              : st === "completed"
                ? "completed"
                : "pending";
          setGenerationProgress((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              statusById: {
                ...prev.statusById,
                [ev.id as string]: nextStatus,
              },
            };
          });
        } else if (t === "done") {
          const { type: _t, ...rest } = ev as { type?: string } &
            Record<string, unknown>;
          streamResult.payload = rest as unknown as GenerateApiResponse;
          setGenerationProgress((prev) => {
            if (!prev) return prev;
            const nextStatus = { ...prev.statusById };
            for (const s of prev.steps) {
              nextStatus[s.id] = "completed";
            }
            return { ...prev, statusById: nextStatus };
          });
        } else if (t === "error") {
          const msg =
            typeof ev.message === "string"
              ? ev.message
              : "Generation failed.";
          throw new Error(msg);
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          consumeStreamEvent(JSON.parse(line) as Record<string, unknown>);
        }
      }

      if (buffer.trim()) {
        consumeStreamEvent(JSON.parse(buffer.trim()) as Record<string, unknown>);
      }

      const finalPayload = streamResult.payload;
      if (
        !finalPayload ||
        !finalPayload.proposal?.sections ||
        finalPayload.proposal.sections.length === 0
      ) {
        throw new Error("Stream ended without a proposal.");
      }

      const donePayload: GenerateApiResponse = finalPayload;

      flushSync(() => {
        setProposal(donePayload.proposal);
        setAgentReview(donePayload.review ?? null);
        setNormalizedBrief(donePayload.normalizedBrief ?? null);
        setRequirementsSummary(donePayload.requirements ?? null);
      });

      notifyProposalsCatalogChanged();

      completedOk = true;
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Could not generate the proposal.";
      setLastError(msg);
      setAgentReview(null);
      setNormalizedBrief(null);
      setRequirementsSummary(null);
      setGenerationProgress(null);
    } finally {
      setIsGenerating(false);
      if (completedOk) {
        progressClearTimerRef.current = window.setTimeout(() => {
          setGenerationProgress(null);
          progressClearTimerRef.current = null;
        }, 1400);
      }
    }
  }, [inputs]);

  const value = useMemo(
    () => ({
      inputs,
      proposal,
      isGenerating,
      generationProgress,
      agentReview,
      normalizedBrief,
      requirementsSummary,
      lastError,
      setField,
      regenerate,
      generateProposal,
    }),
    [
      inputs,
      proposal,
      isGenerating,
      generationProgress,
      agentReview,
      normalizedBrief,
      requirementsSummary,
      lastError,
      setField,
      regenerate,
      generateProposal,
    ],
  );

  return (
    <ProposalContext.Provider value={value}>{children}</ProposalContext.Provider>
  );
}

export function useProposal() {
  const ctx = useContext(ProposalContext);
  if (!ctx) {
    throw new Error("useProposal must be used within ProposalProvider");
  }
  return ctx;
}
