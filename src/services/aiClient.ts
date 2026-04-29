import { EvaluateInput, EvaluationResult } from "../types";
import { generateMockEvaluation } from "./mockAi";

const AI_MODE = import.meta.env.VITE_AI_MODE ?? (import.meta.env.PROD ? "api" : "mock");
const AI_ENDPOINT = import.meta.env.VITE_AI_ENDPOINT ?? "/api/evaluate";

export const evaluateProposal = async (input: EvaluateInput): Promise<EvaluationResult> => {
  if (AI_MODE === "mock") {
    return generateMockEvaluation(input);
  }

  const response = await fetch(AI_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    let message = "Evaluation request failed";

    try {
      const payload = (await response.json()) as { error?: string };
      if (payload.error) {
        message = payload.error;
      }
    } catch {
      // Keep the generic message when the server does not return JSON.
    }

    throw new Error(message);
  }

  return response.json() as Promise<EvaluationResult>;
};
