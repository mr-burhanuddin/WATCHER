import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";

import { getBaselineDiff, getStagedDiff, getStagedFiles } from "./git";
import { reviewWithEditorAI, verifyReviewWithAI } from "./ai";
import { generateFullReport, generatePRSummaryBlock } from "./report";
import {
  initDiagnostics,
  publishDiagnostics,
  clearDiagnostics,
} from "./diagnostics";

import { loadChecklist } from "./checklist";
import { chunkDiff } from "./diffChunker";
import { extractAddedLines } from "./diffUtils";
import {
  computePRScore,
  computeConfidenceScore,
  computeRiskLevel,
} from "./scoring";

type WatcherRepoConfig = {
  autoStage?: boolean;
  baseBranch?: string;
  showProblems?: boolean;
};

function loadRepoConfig(rootPath: string): WatcherRepoConfig {
  const configPath = path.join(rootPath, ".watcher", "config.json");
  if (!fs.existsSync(configPath)) return {};
  return JSON.parse(fs.readFileSync(configPath, "utf8"));
}

function stageWatcherFiles(repoRoot: string) {
  return new Promise<void>((resolve, reject) => {
    exec(
      "git add .watcher/WATCHER_REVIEW.md .watcher/PR_SUMMARY.md",
      { cwd: repoRoot },
      (err, _stdout, stderr) => {
        if (err) reject(stderr || err.message);
        else resolve();
      },
    );
  });
}

export function activate(context: vscode.ExtensionContext) {
  const runCommand = vscode.commands.registerCommand(
    "watcher.run",
    async () => {
      try {
        const workspace = vscode.workspace.workspaceFolders?.[0];
        if (!workspace) {
          throw new Error("Watcher: No workspace open");
        }

        const rootPath = workspace.uri.fsPath;
        const repoConfig = loadRepoConfig(rootPath);
        const vscodeConfig = vscode.workspace.getConfiguration("watcher");

        const autoStage =
          repoConfig.autoStage ?? vscodeConfig.get<boolean>("autoStage", true);

        const showProblems =
          repoConfig.showProblems ??
          vscodeConfig.get<boolean>("showProblems", true);

        if (showProblems) initDiagnostics(context);
        else clearDiagnostics();

        clearDiagnostics();

        const baseBranch =
          repoConfig.baseBranch || vscodeConfig.get<string>("baseBranch");

        if (!baseBranch) {
          throw new Error(
            "Watcher: baseBranch is not configured (repo or VS Code settings)",
          );
        }

        const files = await getStagedFiles();
        if (files.length === 0) {
          vscode.window.showWarningMessage("Watcher: No staged files found");
          return;
        }

        const diff = await getStagedDiff();
        const addedCodeOnly = extractAddedLines(diff);
        const baselineDiff = await getBaselineDiff(baseBranch);

        const checklist = loadChecklist(rootPath);
        const { chunks, truncated } = chunkDiff(diff);

        // --- Primary AI review ---
        let aiResult = await reviewWithEditorAI({
          diff: chunks[0],
          addedCode: addedCodeOnly,
          baselineDiff,
          files,
          checklist: checklist?.checks,
        });

        // --- Merge chunked results ---
        for (let i = 1; i < chunks.length; i++) {
          const partial = await reviewWithEditorAI({
            diff: chunks[i],
            addedCode: addedCodeOnly,
            baselineDiff,
            files,
            checklist: checklist?.checks,
          });

          aiResult.positives.push(...partial.positives);
          aiResult.negatives.push(...partial.negatives);
          aiResult.risks.push(...partial.risks);
          aiResult.test_feedback.push(...partial.test_feedback);
        }

        // --- Verification pass ---
        const verification = await verifyReviewWithAI({
          diff,
          baselineDiff,
          files,
          checklist: checklist?.checks,
          primary: aiResult,
        });

        // --- Deterministic scoring (Step C2) ---
        const confidenceScore = computeConfidenceScore(
          aiResult.confidence_level,
          truncated,
          verification.disagreementScore,
        );

        const prScore = computePRScore(aiResult);
        const riskLevel = computeRiskLevel(
          confidenceScore,
          aiResult.risks.length,
        );

        // --- Persist results ---
        const watcherDir = path.join(rootPath, ".watcher");
        if (!fs.existsSync(watcherDir)) {
          fs.mkdirSync(watcherDir);
        }

        fs.writeFileSync(
          path.join(watcherDir, "WATCHER_REVIEW.md"),
          generateFullReport({
            ai: aiResult,
            confidenceScore,
            riskLevel,
            prScore,
          }),
          "utf8",
        );

        fs.writeFileSync(
          path.join(watcherDir, "PR_SUMMARY.md"),
          generatePRSummaryBlock({
            ai: aiResult,
            confidenceScore,
            riskLevel,
            prScore,
          }),
          "utf8",
        );

        if (showProblems) {
          publishDiagnostics(files, aiResult);
        }

        if (autoStage) {
          await stageWatcherFiles(rootPath);
        }

        vscode.window.showInformationMessage(
          "Watcher: Review completed successfully",
        );
      } catch (err) {
        vscode.window.showErrorMessage(`Watcher error: ${String(err)}`);
      }
    },
  );

  context.subscriptions.push(runCommand);
}

export function deactivate() {}
