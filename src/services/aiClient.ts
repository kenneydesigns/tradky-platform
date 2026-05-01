import {
  DraftSectionsInput,
  DraftSectionsResult,
  EvaluateInput,
  EvaluationResult,
  SectionSuggestionsInput,
  SectionSuggestionsResult,
} from "../types";
import { generateMockDraftSections, generateMockEvaluation, generateMockSectionSuggestions } from "./mockAi";

const AI_MODE = import.meta.env.VITE_AI_MODE ?? (import.meta.env.PROD ? "api" : "mock");
const EVALUATION_ENDPOINT = import.meta.env.VITE_AI_ENDPOINT ?? "/api/evaluate";
const DRAFT_SECTIONS_ENDPOINT = import.meta.env.VITE_AI_DRAFT_ENDPOINT ?? "/api/draft-sections";
const SECTION_SUGGESTIONS_ENDPOINT = import.meta.env.VITE_AI_SUGGESTIONS_ENDPOINT ?? "/api/section-suggestions";

type ApiErrorMessage = {
  message: string;
  canUseLocalFallback: boolean;
};

class ApiJsonError extends Error {}

const isJsonResponse = (response: Response) => response.headers.get("content-type")?.includes("application/json");

const readApiError = async (response: Response, fallback: string): Promise<ApiErrorMessage> => {
  let message = fallback;

  if (isJsonResponse(response)) {
    try {
      const payload = (await response.json()) as { error?: string };
      if (payload.error) {
        message = payload.error;
      }
    } catch {
      // Treat malformed JSON as an unavailable API route and use local fallback where possible.
      return { message, canUseLocalFallback: true };
    }

    return { message, canUseLocalFallback: false };
  }

  return { message, canUseLocalFallback: true };
};

const postJson = async <Input, Result>({
  endpoint,
  input,
  fallback,
  failureMessage,
}: {
  endpoint: string;
  input: Input;
  fallback: (input: Input) => Promise<Result>;
  failureMessage: string;
}): Promise<Result> => {
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const apiError = await readApiError(response, failureMessage);
      if (apiError.canUseLocalFallback) {
        return fallback(input);
      }

      throw new ApiJsonError(apiError.message);
    }

    if (!isJsonResponse(response)) {
      return fallback(input);
    }

    return response.json() as Promise<Result>;
  } catch (caught) {
    if (caught instanceof ApiJsonError) {
      throw caught;
    }

    return fallback(input);
  }
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
    const apiError = await readApiError(response, "Evaluation request failed");
    throw new Error(apiError.message);
  }

  return response.json() as Promise<EvaluationResult>;
};

export const draftVolumeSections = async (input: DraftSectionsInput): Promise<DraftSectionsResult> => {
  if (AI_MODE === "mock") {
    return generateMockDraftSections(input);
  }

  return postJson({
    endpoint: DRAFT_SECTIONS_ENDPOINT,
    input,
    fallback: generateMockDraftSections,
    failureMessage: "Section draft request failed",
  });
};

export const suggestVolumeSections = async (input: SectionSuggestionsInput): Promise<SectionSuggestionsResult> => {
  if (AI_MODE === "mock") {
    return generateMockSectionSuggestions(input);
  }

  return postJson({
    endpoint: SECTION_SUGGESTIONS_ENDPOINT,
    input,
    fallback: generateMockSectionSuggestions,
    failureMessage: "Section suggestions request failed",
  });
};
