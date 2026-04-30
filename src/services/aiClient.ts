import { DraftSectionsInput, DraftSectionsResult, EvaluateInput, EvaluationResult } from "../types";
import { generateMockDraftSections, generateMockEvaluation } from "./mockAi";

const AI_MODE = import.meta.env.VITE_AI_MODE ?? (import.meta.env.PROD ? "api" : "mock");
const EVALUATION_ENDPOINT = import.meta.env.VITE_AI_ENDPOINT ?? "/api/evaluate";
const DRAFT_SECTIONS_ENDPOINT = import.meta.env.VITE_AI_DRAFT_ENDPOINT ?? "/api/draft-sections";

const readApiError = async (response: Response, fallback: string) => {
  let message = fallback;

  try {
    const payload = (await response.json()) as { error?: string };
    if (payload.error) {
      message = payload.error;
    }
  } catch {
    // Keep the fallback when the server does not return JSON.
  }

  return message;
};

export const evaluateProposal = async (input: EvaluateInput): Promise<EvaluationResult> => {
  if (AI_MODE === "mock") {
    return generateMockEvaluation(input);
  }

  const response = await fetch(EVALUATION_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "Evaluation request failed"));
  }

  return response.json() as Promise<EvaluationResult>;
};

export const draftVolumeSections = async (input: DraftSectionsInput): Promise<DraftSectionsResult> => {
  if (AI_MODE === "mock") {
    return generateMockDraftSections(input);
  }

  const response = await fetch(DRAFT_SECTIONS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "Section draft request failed"));
  }

  return response.json() as Promise<DraftSectionsResult>;
};
