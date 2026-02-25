"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateFullReport = generateFullReport;
exports.generatePRSummaryBlock = generatePRSummaryBlock;
/**
 * Generates the full markdown review report
 * This is intended for human reviewers
 */
function generateFullReport(context) {
    const { ai, confidenceScore, riskLevel, prScore } = context;
    return `
## 🤖 Confidence Assessment
- Confidence Score: **${confidenceScore}/100**
- Risk Level: **${riskLevel}**
- Notes: ${ai.confidence_notes || "No additional notes"}

## 🧬 AI Attribution (New Code Only)
- AI Generated: **${ai.ai_percent_new_code}%**
- Human Written: **${ai.human_percent_new_code}%**

## 📝 PR Summary
${ai.summary || "No summary provided."}

---

## 📊 PR Score: ${prScore.score} / 100 (**${prScore.label}**)

### ✅ What’s Good
${renderList(ai.positives, "No notable positives identified.")}

### ⚠️ What Needs Attention
${renderList(ai.negatives, "No blocking issues identified.")}

### 🚨 Risks
${renderList(ai.risks, "No significant risks detected.")}

### 🧪 Test Feedback
${renderList(ai.test_feedback, "No test-related concerns.")}

### 🧠 AI Confidence
${ai.confidence_level}
`.trim();
}
/**
 * Generates a compact PR-ready summary block
 * Intended to be pasted into GitHub / GitLab PR description
 */
function generatePRSummaryBlock(context) {
    const { ai, confidenceScore, riskLevel, prScore } = context;
    return `
## 🤖 Watcher PR Review

**PR Score:** ${prScore.score} / 100 (${prScore.label})  
**Confidence:** ${confidenceScore}/100  
**Risk Level:** ${riskLevel}

### Summary
${ai.summary || "No summary provided."}

### Key Positives
${renderList(ai.positives, "No major positives highlighted.")}

### Key Issues
${renderList(ai.negatives, "No blocking issues highlighted.")}

### Risks
${renderList(ai.risks, "No significant risks detected.")}

_AI confidence level: ${ai.confidence_level}_
`.trim();
}
/**
 * Utility: renders bullet lists safely
 */
function renderList(items, emptyFallback) {
    if (!items || items.length === 0) {
        return `- ${emptyFallback}`;
    }
    return items.map((i) => `- ${i}`).join("\n");
}
//# sourceMappingURL=report.js.map