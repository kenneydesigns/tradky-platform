import { EvaluateInput, EvaluationResult } from "../types";
import { generateMockEvaluation } from "./mockAi";

const AI_MODE = import.meta.env.VITE_AI_MODE ?? "mock";
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
    throw new Error("Evaluation request failed");
  }

  return response.json() as Promise<EvaluationResult>;
};
