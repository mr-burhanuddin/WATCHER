import * as vscode from "vscode";
import { WatcherAIResult } from "./ai";

let diagnosticCollection: vscode.DiagnosticCollection | undefined;

/**
 * Initialize diagnostics collection
 */
export function initDiagnostics(context: vscode.ExtensionContext) {
  if (!diagnosticCollection) {
    diagnosticCollection =
      vscode.languages.createDiagnosticCollection("watcher");
    context.subscriptions.push(diagnosticCollection);
  }
}

/**
 * Clear all Watcher diagnostics
 */
export function clearDiagnostics() {
  diagnosticCollection?.clear();
}

/**
 * Publish diagnostics based on AI review
 * ONLY negatives and risks produce Problems
 */
export function publishDiagnostics(files: string[], ai: WatcherAIResult) {
  if (!diagnosticCollection) return;

  const diagnosticsByFile = new Map<string, vscode.Diagnostic[]>();

  // Helper to push diagnostics
  function addDiagnostic(
    file: string,
    message: string,
    severity: vscode.DiagnosticSeverity,
  ) {
    const uri = vscode.Uri.file(file);

    const diagnostic = new vscode.Diagnostic(
      new vscode.Range(0, 0, 0, 1),
      message,
      severity,
    );

    if (!diagnosticsByFile.has(uri.fsPath)) {
      diagnosticsByFile.set(uri.fsPath, []);
    }

    diagnosticsByFile.get(uri.fsPath)!.push(diagnostic);
  }

  // Negatives → Warnings
  for (const issue of ai.negatives || []) {
    for (const file of files) {
      addDiagnostic(file, issue, vscode.DiagnosticSeverity.Warning);
    }
  }

  // Risks → Errors
  for (const risk of ai.risks || []) {
    for (const file of files) {
      addDiagnostic(file, risk, vscode.DiagnosticSeverity.Error);
    }
  }

  // Publish
  for (const [filePath, diags] of diagnosticsByFile.entries()) {
    diagnosticCollection.set(vscode.Uri.file(filePath), diags);
  }
}
