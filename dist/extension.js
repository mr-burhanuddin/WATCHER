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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const git_1 = require("./git");
const ai_1 = require("./ai");
const report_1 = require("./report");
const diagnostics_1 = require("./diagnostics");
const checklist_1 = require("./checklist");
const diffChunker_1 = require("./diffChunker");
const diffUtils_1 = require("./diffUtils");
const scoring_1 = require("./scoring");
function loadRepoConfig(rootPath) {
    const configPath = path.join(rootPath, ".watcher", "config.json");
    if (!fs.existsSync(configPath))
        return {};
    return JSON.parse(fs.readFileSync(configPath, "utf8"));
}
function stageWatcherFiles(repoRoot) {
    return new Promise((resolve, reject) => {
        (0, child_process_1.exec)("git add .watcher/WATCHER_REVIEW.md .watcher/PR_SUMMARY.md", { cwd: repoRoot }, (err, _stdout, stderr) => {
            if (err)
                reject(stderr || err.message);
            else
                resolve();
        });
    });
}
function activate(context) {
    const runCommand = vscode.commands.registerCommand("watcher.run", async () => {
        try {
            const workspace = vscode.workspace.workspaceFolders?.[0];
            if (!workspace) {
                throw new Error("Watcher: No workspace open");
            }
            const rootPath = workspace.uri.fsPath;
            const repoConfig = loadRepoConfig(rootPath);
            const vscodeConfig = vscode.workspace.getConfiguration("watcher");
            const autoStage = repoConfig.autoStage ?? vscodeConfig.get("autoStage", true);
            const showProblems = repoConfig.showProblems ??
                vscodeConfig.get("showProblems", true);
            if (showProblems)
                (0, diagnostics_1.initDiagnostics)(context);
            else
                (0, diagnostics_1.clearDiagnostics)();
            (0, diagnostics_1.clearDiagnostics)();
            const baseBranch = repoConfig.baseBranch || vscodeConfig.get("baseBranch");
            if (!baseBranch) {
                throw new Error("Watcher: baseBranch is not configured (repo or VS Code settings)");
            }
            const files = await (0, git_1.getStagedFiles)();
            if (files.length === 0) {
                vscode.window.showWarningMessage("Watcher: No staged files found");
                return;
            }
            const diff = await (0, git_1.getStagedDiff)();
            const addedCodeOnly = (0, diffUtils_1.extractAddedLines)(diff);
            const baselineDiff = await (0, git_1.getBaselineDiff)(baseBranch);
            const checklist = (0, checklist_1.loadChecklist)(rootPath);
            const { chunks, truncated } = (0, diffChunker_1.chunkDiff)(diff);
            // --- Primary AI review ---
            let aiResult = await (0, ai_1.reviewWithEditorAI)({
                diff: chunks[0],
                addedCode: addedCodeOnly,
                baselineDiff,
                files,
                checklist: checklist?.checks,
            });
            // --- Merge chunked results ---
            for (let i = 1; i < chunks.length; i++) {
                const partial = await (0, ai_1.reviewWithEditorAI)({
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
            const verification = await (0, ai_1.verifyReviewWithAI)({
                diff,
                baselineDiff,
                files,
                checklist: checklist?.checks,
                primary: aiResult,
            });
            // --- Deterministic scoring (Step C2) ---
            const confidenceScore = (0, scoring_1.computeConfidenceScore)(aiResult.confidence_level, truncated, verification.disagreementScore);
            const prScore = (0, scoring_1.computePRScore)(aiResult);
            const riskLevel = (0, scoring_1.computeRiskLevel)(confidenceScore, aiResult.risks.length);
            // --- Persist results ---
            const watcherDir = path.join(rootPath, ".watcher");
            if (!fs.existsSync(watcherDir)) {
                fs.mkdirSync(watcherDir);
            }
            fs.writeFileSync(path.join(watcherDir, "WATCHER_REVIEW.md"), (0, report_1.generateFullReport)({
                ai: aiResult,
                confidenceScore,
                riskLevel,
                prScore,
            }), "utf8");
            fs.writeFileSync(path.join(watcherDir, "PR_SUMMARY.md"), (0, report_1.generatePRSummaryBlock)({
                ai: aiResult,
                confidenceScore,
                riskLevel,
                prScore,
            }), "utf8");
            if (showProblems) {
                (0, diagnostics_1.publishDiagnostics)(files, aiResult);
            }
            if (autoStage) {
                await stageWatcherFiles(rootPath);
            }
            vscode.window.showInformationMessage("Watcher: Review completed successfully");
        }
        catch (err) {
            vscode.window.showErrorMessage(`Watcher error: ${String(err)}`);
        }
    });
    context.subscriptions.push(runCommand);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map