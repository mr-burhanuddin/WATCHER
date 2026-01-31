import * as vscode from "vscode";
import { WatcherAIResult } from "./ai";

let collection: vscode.DiagnosticCollection | null = null;

export function initDiagnostics(context: vscode.ExtensionContext) {
  collection = vscode.languages.createDiagnosticCollection("watcher");
  context.subscriptions.push(collection);
}

function riskToSeverity(
  risk: "LOW" | "MEDIUM" | "HIGH",
): vscode.DiagnosticSeverity {
  switch (risk) {
    case "HIGH":
      return vscode.DiagnosticSeverity.Error;
    case "MEDIUM":
      return vscode.DiagnosticSeverity.Warning;
    default:
      return vscode.DiagnosticSeverity.Information;
  }
}

export function publishDiagnostics(files: string[], ai: WatcherAIResult) {
  if (!collection) return;

  let summaryText = "";

  if (ai.confidence_notes.includes("Diff truncated")) {
    summaryText =
      "Large PR detected. Watcher review was partial due to size limits.";
  }

  summaryText =
    ai.issues.length > 0 ? ai.issues.join("; ") : "No major issues detected";

  const risk =
    ai.confidence_score < 50
      ? "HIGH"
      : ai.confidence_score < 75
        ? "MEDIUM"
        : "LOW";

  for (const file of files) {
    const uri = vscode.Uri.file(file);

    const diagnostic = new vscode.Diagnostic(
      new vscode.Range(0, 0, 0, 0),
      `Watcher Review (${risk} confidence): ${summaryText}`,
      riskToSeverity(risk),
    );

    diagnostic.source = "Watcher";

    collection.set(uri, [diagnostic]);
  }
}

export function clearDiagnostics() {
  collection?.clear();
}
