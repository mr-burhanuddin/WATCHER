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
exports.getStagedFiles = getStagedFiles;
exports.getStagedDiff = getStagedDiff;
exports.getBaselineDiff = getBaselineDiff;
const child_process_1 = require("child_process");
const vscode = __importStar(require("vscode"));
/**
 * Get workspace root path
 */
function getWorkspaceRoot() {
    const folder = vscode.workspace.workspaceFolders?.[0];
    if (!folder) {
        throw new Error("Watcher: No workspace folder open");
    }
    return folder.uri.fsPath;
}
/**
 * Runs a shell command in the workspace root
 */
function run(command) {
    const cwd = getWorkspaceRoot();
    return new Promise((resolve, reject) => {
        (0, child_process_1.exec)(command, {
            cwd,
            maxBuffer: 10 * 1024 * 1024,
        }, (error, stdout, stderr) => {
            if (error) {
                reject(stderr || error.message);
            }
            else {
                resolve(stdout);
            }
        });
    });
}
/**
 * Ensures we are inside a git repository
 */
async function ensureGitRepo() {
    try {
        await run("git rev-parse --is-inside-work-tree");
    }
    catch {
        throw new Error("Watcher: This workspace is not a git repository. Open the repo root.");
    }
}
/**
 * Returns staged file paths
 */
async function getStagedFiles() {
    await ensureGitRepo();
    const output = await run("git diff --cached --name-only");
    return output
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean);
}
/**
 * Returns staged diff
 */
async function getStagedDiff() {
    await ensureGitRepo();
    return run("git diff --cached");
}
async function getBaselineDiff(baseBranch) {
    try {
        await run(`git rev-parse ${baseBranch}`);
    }
    catch {
        throw new Error(`Watcher: Base branch '${baseBranch}' does not exist`);
    }
    return run(`git diff ${baseBranch}...HEAD`);
}
//# sourceMappingURL=git.js.map