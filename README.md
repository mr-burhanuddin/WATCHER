## Watcher 🤖🔍

**Editor-native AI Pull Request Reviewer**

Watcher is a **VS Code–compatible extension** that performs **AI-assisted Pull Request reviews directly inside your editor**. It utilizes either the **editor’s built-in AI models** (Copilot / Cursor / Windsurf / compatible editors) or a **local Ollama instance**.

It reviews **staged Git changes**, highlights issues inline, generates **PR-ready summaries**, and helps human reviewers focus on what actually matters.

> ✅ No OpenAI keys  
> ✅ No external API dependencies (uses local or editor AI)  
> ✅ No CI dependencies (requires only standard `git` CLI)  
> ✅ Works entirely inside your environment

---

## ✨ What Watcher Does

Watcher analyzes your **staged code** and provides:

- 🤖 **AI vs Human code attribution**
- 🔍 **Code quality & logic review**
- 🧪 **Test coverage feedback**
- 🆕 **Regression detection (baseline comparison)**
- ✅ **Custom checklist support**
- 🧠 **AI confidence scoring & hallucination detection**
- ⚠️ **Inline editor diagnostics (Problems panel)**
- 📝 **PR-ready Markdown summaries**
- 🛡️ **Performance & safety controls for large PRs**

All without leaving your editor.

---

## 🧠 How Watcher Works (High Level)

1. Reads **staged Git changes**
2. Optionally compares against a **user-defined base branch**
3. Applies **custom checklist rules** (if provided)
4. Uses **editor-provided AI models** or a **local Ollama instance** to review the changes
5. Runs a **self-verification pass** to detect AI disagreement
6. Generates:
   - Detailed review report
   - PR summary
   - Inline diagnostics

---

## 🚀 How to Use Watcher

### 1️⃣ Install the Extension

Install Watcher from the VS Code marketplace (or sideload during development).

---

### 2️⃣ Stage Your Changes

Watcher only reviews **staged files**:

```bash
git add .
```

---

### 3️⃣ Run Watcher

Use any of the following:

- **Command Palette**

  ```
  Ctrl + Shift + P → Watcher: Run PR Review
  ```

- **Keybinding** (optional)

- **VS Code Task**

- **`code --command watcher.run`** (VS Code must already be open)

---

### 4️⃣ Review the Output

Watcher generates:

```
.watcher/
├── WATCHER_REVIEW.md   ← Full detailed review
└── PR_SUMMARY.md       ← GitHub-ready PR summary
```

It also:

- Adds inline warnings/errors in the editor
- Populates the **Problems** panel

---

## 📁 Generated Files

### `.watcher/WATCHER_REVIEW.md`

Detailed technical analysis including:

- AI Confidence & Risk level
- AI vs Human tracking (New Code)
- AI Positives, Negatives & Risks
- Test feedback

### `.watcher/PR_SUMMARY.md`

Concise, GitHub-ready summary suitable for PR descriptions.

---

## ⚙️ Configuration

Watcher supports **both global (VS Code)** and **per-repository** configuration.

### 🔹 Configuration Priority

```
.watcher/config.json   ← highest priority
VS Code settings       ← fallback
Defaults               ← last resort
```

---

### 🔹 VS Code Settings

Open:

```
Settings → Extensions → Watcher
```

| Setting              | Description                           | Default        |
| -------------------- | ------------------------------------- | -------------- |
| `watcher.autoStage`  | Auto-stage Watcher files after review | `true`         |
| `watcher.baseBranch` | Base branch for regression comparison | `"origin/dev"` |
| `watcher.showProblems` | Show AI findings in VS Code Problems | `false` |
| `watcher.aiProvider` | AI Provider to use (`vscode` or `ollama`) | `"vscode"` |
| `watcher.ollamaUrl` | URL of local Ollama instance | `"http://localhost:11434"` |
| `watcher.ollamaModel` | Model name to use with Ollama | `"yi-coder:1.5b"` |

---

### 🔹 Per-Repo Config

Create:

```
.watcher/config.json
```

Example:

```json
{
  "autoStage": true,
  "baseBranch": "origin/dev"
}
```

---

## 🆕 Baseline Comparison (Regression Detection)

Watcher can compare your PR against a **user-defined base branch** to detect:

- New issues introduced
- Test regressions
- Changes that worsen existing code

> Base branch **must be explicitly configured** (no guessing).

---

## ✅ Custom Checklist Support

Teams can define **custom review rules**.

Create:

```
.watcher/checklist.yml
```

Example:

```yaml
checks:
  - id: no-console
    description: "No console.log statements in production code"

  - id: tests-required
    description: "All public APIs must have tests"

  - id: no-todo
    description: "No new TODO comments introduced"
```

Watcher will:

- Evaluate each checklist item during its review
- Mark it as **PASS / FAIL / UNCERTAIN** internally and use this context to guide its `negatives` and `risks` output
> Note: Explicit Checklist result printing in reports and diagnostics is currently not implemented, though AI evaluates them internally.

---

## 🧠 Confidence Score & Hallucination Guard

Watcher assigns a **confidence score (0–100)** to every review based on:

- AI self-assessment (LOW, MEDIUM, HIGH)
- AI self-verification (disagreement detection)
- Diff size & truncation limits

Low confidence reviews are **explicitly flagged** so humans know when to be cautious.

---

## ⚠️ Inline Editor Diagnostics

Watcher integrates with VS Code diagnostics:

- Errors / warnings appear inline
- Issues show up in the **Problems** panel
- Severity is based on issue category: Negatives become Warnings, Risks become Errors.

This makes Watcher feel like a native linting tool.

---

## 🛡️ Performance & Safety Controls

Watcher is safe for large PRs:

- Diff size limits
- Deterministic chunking
- Maximum AI calls
- Graceful degradation (never crashes)

When a PR is too large:

- Review is partial (truncated beyond max chunk limit)
- Confidence score is automatically penalized

---

## 🔒 What Watcher Does NOT Do

Watcher is intentionally **editor-only**.

❌ No Watcher-specific CLI (`npm run watcher` will not work)
❌ No CI execution
❌ No GitHub API calls
❌ No auto-posting PR comments
❌ No commit message rewriting

This is required to safely use **editor-provided AI models** or **local Ollama instances**.

---

## 🧩 Supported Editors

Watcher works in any editor that supports VS Code extensions and the Language Model API, including:

- VS Code (Note: Watcher automatically selects the model with the smallest context window to minimize resource usage)
- Cursor
- Windsurf
- Antigravity
- Other compatible forks

---

## 🧠 Best Practices

- Run Watcher **before committing**
- Keep checklist rules small & focused
- Always review low-confidence outputs manually
- Use baseline comparison for large refactors

---

## 📌 Summary

Watcher is designed to:

- Assist, not replace, human reviewers
- Reduce review noise
- Surface real risks
- Stay transparent and configurable

If you trust your editor — you can trust Watcher.

---

## 📄 License

MIT
