import { exec } from "child_process";
import * as vscode from "vscode";

/**
 * Get workspace root path
 */
function getWorkspaceRoot(): string {
  const folder = vscode.workspace.workspaceFolders?.[0];
  if (!folder) {
    throw new Error("Watcher: No workspace folder open");
  }
  return folder.uri.fsPath;
}

/**
 * Runs a shell command in the workspace root
 */
function run(command: string): Promise<string> {
  const cwd = getWorkspaceRoot();

  return new Promise((resolve, reject) => {
    exec(
      command,
      {
        cwd,
        maxBuffer: 10 * 1024 * 1024,
      },
      (error, stdout, stderr) => {
        if (error) {
          reject(stderr || error.message);
        } else {
          resolve(stdout);
        }
      },
    );
  });
}

/**
 * Ensures we are inside a git repository
 */
async function ensureGitRepo() {
  try {
    await run("git rev-parse --is-inside-work-tree");
  } catch {
    throw new Error(
      "Watcher: This workspace is not a git repository. Open the repo root.",
    );
  }
}

/**
 * Returns staged file paths
 */
export async function getStagedFiles(): Promise<string[]> {
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
export async function getStagedDiff(): Promise<string> {
  await ensureGitRepo();
  return run("git diff --cached");
}

export async function getBaselineDiff(baseBranch: string): Promise<string> {
  try {
    await run(`git rev-parse ${baseBranch}`);
  } catch {
    throw new Error(`Watcher: Base branch '${baseBranch}' does not exist`);
  }

  return run(`git diff ${baseBranch}...HEAD`);
}
