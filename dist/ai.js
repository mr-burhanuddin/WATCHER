"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewWithEditorAI = reviewWithEditorAI;
exports.verifyReviewWithAI = verifyReviewWithAI;
const vscode = __importStar(require("vscode"));
const modelSelector_1 = require("./modelSelector");
/**
 * Helper to query the configured AI provider (VS Code LM or Ollama)
 */
async function queryAI(prompt, token) {
    const config = vscode.workspace.getConfiguration("watcher");
    const provider = config.get("aiProvider", "vscode");
    if (provider === "ollama") {
        const url = config.get("ollamaUrl", "http://localhost:11434");
        const modelName = config.get("ollamaModel", "qwen2.5-coder:1.5b");
        try {
            // Allow user to use trailing slash or not
            const endpoint = url.endsWith("/") ? `${url}api/chat` : `${url}/api/chat`;
            const body = {
                model: modelName,
                messages: [{ role: "user", content: prompt }],
                stream: false,
                format: "json", // Force JSON mode for better parsing
                options: {
                    temperature: 0.2, // Low temperature for consistent code review
                },
            };
            const res = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                throw new Error(`Ollama Error: ${res.status} ${res.statusText}`);
            }
            const data = (await res.json());
            if (!data || !data.message || !data.message.content) {
                throw new Error("Ollama returned invalid response structure");
            }
            return data.message.content;
        }
        catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            throw new Error(`Watcher (Ollama): ${msg}. Make sure Ollama is running and model '${modelName}' is pulled.`);
        }
    }
    else {
        // Default: VS Code Language Model API
        const model = await (0, modelSelector_1.selectCheapChatModel)();
        const response = await model.sendRequest([vscode.LanguageModelChatMessage.User(prompt)], {}, token);
        let text = "";
        for await (const chunk of response.text) {
            text += chunk;
        }
        return text;
    }
}
/**
 * Primary AI review using editor-provided AI model or Local AI
 */
async function reviewWithEditorAI(input) {
    const prompt = `
You are assisting a HUMAN pull request reviewer.

Your role is to classify findings, not to judge outcomes.

IMPORTANT CONTEXT RULES:
- AI attribution MUST be based ONLY on the newly added code
- Do NOT consider removed lines, unchanged context, or baseline code for attribution
- Use the full diff ONLY to understand logic and intent

OUTPUT RULES (STRICT):
- Bullet points only
- Max 5 positives, 5 negatives, 3 risks
- Each bullet must be <= 120 characters
- No generic advice
- No speculation
- No repetition
- VALID JSON ONLY
- NO markdown, NO prose outside JSON

CATEGORIES:
- positives: what is clearly done well
- negatives: concrete issues that should be addressed
- risks: changes that may cause future or indirect issues
- test_feedback: gaps or concerns related to tests
- summary: concise description of what changed (2–3 lines)

Files changed:
${input.files.join("\n")}

Baseline Diff (existing code context – DO NOT use for attribution):
${input.baselineDiff ?? "Not available"}

Newly Added Code (ONLY source for AI attribution):
${input.addedCode || "No newly added code"}

Full Git Diff (context only):
${input.diff}

Custom Review Checklist:
${input.checklist
        ? input.checklist.map((c) => `- (${c.id}) ${c.description}`).join("\n")
        : "No custom checklist provided"}

Checklist rules (if provided):
- Evaluate EACH checklist item
- Mark as PASS, FAIL, or UNCERTAIN
- Provide a short, factual note

OUTPUT FORMAT (JSON ONLY):
{
  "ai_percent_new_code": number,
  "human_percent_new_code": number,
  "positives": string[],
  "negatives": string[],
  "risks": string[],
  "test_feedback": string[],
  "summary": string,
  "confidence_level": "LOW" | "MEDIUM" | "HIGH",
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
    try {
        const text = await queryAI(prompt, new vscode.CancellationTokenSource().token);
        // Attempt parsing
        try {
            const parsed = JSON.parse(text);
            // Safety: ensure human % is consistent
            if (typeof parsed.ai_percent_new_code === "number" &&
                typeof parsed.human_percent_new_code !== "number") {
                parsed.human_percent_new_code = Math.max(0, 100 - parsed.ai_percent_new_code);
            }
            return parsed;
        }
        catch {
            throw new Error("Watcher: AI response was not valid JSON.\n\nRaw response:\n" + text);
        }
    }
    catch (err) {
        throw new Error(`Watcher Review Failed: ${err instanceof Error ? err.message : String(err)}`);
    }
}
/**
 * Secondary lightweight verification pass
 * Used ONLY to detect disagreement / hallucination risk
 */
async function verifyReviewWithAI(input) {
    const prompt = `
You are verifying an AI-generated PR review.

PRIMARY SUMMARY:
${input.primary.summary}

PRIMARY NEGATIVES:
${input.primary.negatives.join("\n") || "None"}

PRIMARY RISKS:
${input.primary.risks.join("\n") || "None"}

TASK:
- Independently review the staged diff
- Identify ONLY disagreements or missing concerns
- Do NOT repeat agreements
- Be strict and concise

RULES:
- No speculation
- JSON ONLY

Git Diff:
${input.diff}

OUTPUT FORMAT:
{
  "disagreementScore": number,
  "notes": string
}
`;
    try {
        const text = await queryAI(prompt, new vscode.CancellationTokenSource().token);
        return JSON.parse(text);
    }
    catch (err) {
        if (err instanceof Error && err.message.includes("No AI model available")) {
            return {
                disagreementScore: 0,
                notes: "Verification skipped (no AI model available)",
            };
        }
        // For other errors (parsing or network), we default to a safe failure
        return {
            disagreementScore: 50,
            notes: `Verification response invalid or failed: ${err instanceof Error ? err.message : String(err)}`,
        };
    }
}
//# sourceMappingURL=ai.js.map