declare const process: {
  env: Record<string, string | undefined>;
};

type ApiRequest = {
  method?: string;
};

type ApiResponse = {
  end: (body?: string) => void;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
  status: (statusCode: number) => ApiResponse;
};

export default function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.status(405).end("Method not allowed.");
    return;
  }

  const token = process.env.OPENAI_APPS_CHALLENGE_TOKEN ?? process.env.OPENAI_APPS_CHALLENGE;
  if (!token) {
    res.status(404).end("OpenAI Apps verification token is not configured.");
    return;
  }

  res.status(200).end(token.trim());
}
