import * as vscode from "vscode";

export type WatcherAIResult = {
  ai_generated_percent: number;
  issues: string[];
  test_feedback: string[];
  summary: string;

  confidence_score: number;
  confidence_notes: string;

  // NEW
  checklist_results?: {
    id: string;
    status: "PASS" | "FAIL" | "UNCERTAIN";
    notes: string;
  }[];
};

export async function reviewWithEditorAI(input: {
  diff: string;
  baselineDiff?: string;
  files: string[];
  checklist?: { id: string; description: string }[];
}): Promise<WatcherAIResult> {
  const models = await vscode.lm.selectChatModels({});
  if (!models.length) {
    throw new Error("Watcher: No AI model available in this editor");
  }

  const model = models[0];

  const prompt = `
You are a senior software engineer reviewing a pull request.

Tasks:
1. Estimate percentage of AI-generated vs human-written code.
2. Identify logic bugs, code smells, and architectural issues.
3. Review test quality and missing test cases.
4. Provide a concise PR summary.
5. Assess your confidence in this review.

Rules:
- Be strict and technical
- Do NOT hallucinate
- If something cannot be determined from the diff, say so
- Output VALID JSON ONLY
- No markdown, no prose outside JSON

Files:
${input.files.join("\n")}

Baseline Diff (existing code context):
${input.baselineDiff ?? "Not available"}

Git Diff:
${input.diff}

Custom Review Checklist:
${
  input.checklist
    ? input.checklist.map((c) => `- (${c.id}) ${c.description}`).join("\n")
    : "No custom checklist provided"
}

If a checklist is provided:
- Evaluate EACH checklist item
- Mark as PASS, FAIL, or UNCERTAIN
- Provide a short note for each


Output format:
{
  "ai_generated_percent": number,
  "issues": string[],
  "test_feedback": string[],
  "summary": string,
  "confidence_score": number, // 0–100
  "confidence_notes": string,
  "checklist_results": [
  {
    "id": string,
    "status": "PASS" | "FAIL" | "UNCERTAIN",
    "notes": string
  }
]

}
`;

  const response = await model.sendRequest(
    [vscode.LanguageModelChatMessage.User(prompt)],
    {},
    new vscode.CancellationTokenSource().token,
  );

  let text = "";
  for await (const chunk of response.text) {
    text += chunk;
  }

  try {
    return JSON.parse(text) as WatcherAIResult;
  } catch {
    throw new Error(
      "Watcher: AI response was not valid JSON. Raw response:\n" + text,
    );
  }
}

/**
 * Runs a lightweight verification pass to detect AI disagreement
 */
export async function verifyReviewWithAI(input: {
  diff: string;
  baselineDiff?: string;
  files: string[];
  checklist?: { id: string; description: string }[];
  primary: WatcherAIResult;
}): Promise<{
  disagreementScore: number; // 0–100
  notes: string;
}> {
  const models = await vscode.lm.selectChatModels({});
  if (!models.length) {
    return {
      disagreementScore: 0,
      notes: "Verification skipped (no AI model available)",
    };
  }

  const model = models[0];

  const prompt = `
You are verifying an AI-generated PR review.

Primary Review Summary:
${input.primary.summary}

Primary Issues:
${input.primary.issues.join("\n")}

Checklist Results:
${
  input.primary.checklist_results
    ? input.primary.checklist_results
        .map((r) => `${r.id}: ${r.status}`)
        .join("\n")
    : "No checklist"
}

Task:
- Review the staged diff independently
- Determine whether you AGREE or DISAGREE with the primary review
- Identify missing or overstated concerns

Rules:
- Be strict
- Focus only on disagreements
- Output VALID JSON only

Git Diff:
${input.diff}

Output format:
{
  "disagreementScore": number, // 0–100 (0 = full agreement)
  "notes": string
}
`;

  const response = await model.sendRequest(
    [vscode.LanguageModelChatMessage.User(prompt)],
    {},
    new vscode.CancellationTokenSource().token,
  );

  let text = "";
  for await (const chunk of response.text) {
    text += chunk;
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      disagreementScore: 50,
      notes: "Verification response was invalid",
    };
  }
}
