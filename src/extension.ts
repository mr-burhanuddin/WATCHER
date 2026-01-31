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

type WatcherRepoConfig = {
  autoStage?: boolean;
  baseBranch?: string;
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
  initDiagnostics(context);

  const runCommand = vscode.commands.registerCommand(
    "watcher.run",
    async () => {
      try {
        clearDiagnostics();

        const workspace = vscode.workspace.workspaceFolders?.[0];
        if (!workspace) {
          throw new Error("Watcher: No workspace open");
        }

        const rootPath = workspace.uri.fsPath;

        const repoConfig = loadRepoConfig(rootPath);
        const vscodeConfig = vscode.workspace.getConfiguration("watcher");

        const autoStage =
          repoConfig.autoStage ?? vscodeConfig.get<boolean>("autoStage", true);

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
        const baselineDiff = await getBaselineDiff(baseBranch);

        const checklist = loadChecklist(rootPath);

        const { chunks, truncated } = chunkDiff(diff);

        let aiResult = await reviewWithEditorAI({
          diff: chunks[0],
          baselineDiff,
          files,
          checklist: checklist?.checks,
        });

        for (let i = 1; i < chunks.length; i++) {
          const partial = await reviewWithEditorAI({
            diff: chunks[i],
            baselineDiff,
            files,
            checklist: checklist?.checks,
          });

          // Merge issues conservatively
          aiResult.issues.push(...partial.issues);
          aiResult.test_feedback.push(...partial.test_feedback);
        }

        if (truncated) {
          aiResult.confidence_score = Math.max(
            0,
            aiResult.confidence_score - 20,
          );

          aiResult.confidence_notes += " | Diff truncated due to size limits";
        }

        const verification = await verifyReviewWithAI({
          diff,
          baselineDiff,
          files,
          checklist: checklist?.checks,
          primary: aiResult,
        });

        // Adjust confidence based on disagreement
        if (verification.disagreementScore > 0) {
          aiResult.confidence_score = Math.max(
            0,
            aiResult.confidence_score -
              Math.floor(verification.disagreementScore / 2),
          );

          aiResult.confidence_notes += ` | Verification disagreement: ${verification.notes}`;
        }

        const watcherDir = path.join(rootPath, ".watcher");
        if (!fs.existsSync(watcherDir)) {
          fs.mkdirSync(watcherDir);
        }

        fs.writeFileSync(
          path.join(watcherDir, "WATCHER_REVIEW.md"),
          generateFullReport(aiResult),
          "utf8",
        );

        fs.writeFileSync(
          path.join(watcherDir, "PR_SUMMARY.md"),
          generatePRSummaryBlock(aiResult),
          "utf8",
        );

        publishDiagnostics(files, aiResult);

        if (autoStage) {
          await stageWatcherFiles(rootPath);
        }

        vscode.window.showInformationMessage(
          "Watcher: Review completed with inline diagnostics",
        );
      } catch (err) {
        vscode.window.showErrorMessage(`Watcher error: ${String(err)}`);
      }
    },
  );

  context.subscriptions.push(runCommand);
}

export function deactivate() {}
