import * as vscode from "vscode";

/**
 * Selects the cheapest available chat model
 * based on smallest context window.
 *
 * Works with STABLE VS Code LM API.
 */
export async function selectCheapChatModel(): Promise<vscode.LanguageModelChat> {
  const models = await vscode.lm.selectChatModels({});

  if (!models.length) {
    throw new Error("Watcher: No AI model available in this editor");
  }

  // Sort by smallest context window (cheapest heuristic)
  const sorted = [...models].sort(
    (a, b) => a.maxInputTokens - b.maxInputTokens,
  );

  return sorted[0];
}
