import * as fs from "fs";
import * as path from "path";
import YAML from "yaml";

export type ChecklistItem = {
  id: string;
  description: string;
};

export type Checklist = {
  checks: ChecklistItem[];
};

/**
 * Loads .watcher/checklist.yml if present
 */
export function loadChecklist(repoRoot: string): Checklist | null {
  const checklistPath = path.join(repoRoot, ".watcher", "checklist.yml");

  if (!fs.existsSync(checklistPath)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(checklistPath, "utf8");
    const parsed = YAML.parse(raw);

    if (!parsed?.checks || !Array.isArray(parsed.checks)) {
      throw new Error("Invalid checklist format");
    }

    return {
      checks: parsed.checks.map((c: any) => ({
        id: String(c.id),
        description: String(c.description),
      })),
    };
  } catch (err) {
    throw new Error("Watcher: Failed to parse .watcher/checklist.yml");
  }
}
