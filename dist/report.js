"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateFullReport = generateFullReport;
exports.generatePRSummaryBlock = generatePRSummaryBlock;
function detectHallucinationRisk(text) {
    const triggers = [];
    const patterns = [
        "might be",
        "possibly",
        "appears to",
        "likely",
        "assumed",
        "cannot verify",
        "not sure",
        "unclear",
    ];
    const lower = text.toLowerCase();
    for (const p of patterns) {
        if (lower.includes(p)) {
            triggers.push(p);
        }
    }
    if (triggers.length >= 4) {
        return { risk: "HIGH", triggers };
    }
    if (triggers.length >= 2) {
        return { risk: "MEDIUM", triggers };
    }
    return { risk: "LOW", triggers };
}
function generateFullReport(ai) {
    const hallucination = detectHallucinationRisk(ai.summary + " " + ai.issues.join(" "));
    return `
# Watcher – Pull Request Review

## 🤖 Confidence Assessment
- Confidence Score: **${ai.confidence_score}/100**
- Risk Level: **${hallucination.risk !== "LOW"
        ? `⚠️ **Caution:** This review contains speculative language (${hallucination.triggers.join(", ")}). Manual verification recommended.`
        : hallucination.risk}**
- Notes: ${ai.confidence_notes.includes("Verification disagreement")
        ? "⚠️ **AI self-verification detected disagreement. Manual review recommended.**"
        : ai.confidence_notes.includes("Diff truncated")
            ? "⚠️ **Large PR detected:** Review is partial due to diff size limits."
            : ai.confidence_notes}

## AI Attribution
- AI Generated: **${ai.ai_generated_percent}%**
- Human Written: **${100 - ai.ai_generated_percent}%**

## Code Issues
${ai.issues.length > 0
        ? ai.issues.map((i) => `- ${i}`).join("\n")
        : "- No major issues detected"}

## Test Feedback
${ai.test_feedback.length > 0
        ? ai.test_feedback.map((t) => `- ${t}`).join("\n")
        : "- No test issues detected"}

## PR Summary
${ai.summary}

## Custom Checklist Results
${ai.checklist_results && ai.checklist_results.length > 0
        ? ai.checklist_results
            .map((r) => `- **${r.id}**: ${r.status} — ${r.notes}`)
            .join("\n")
        : "- No checklist applied"}

`;
}
function generatePRSummaryBlock(ai) {
    const hallucination = detectHallucinationRisk(ai.summary + " " + ai.issues.join(" "));
    return `
## 🤖 Watcher PR Review

**Confidence:** ${ai.confidence_score}/100  
**Risk Level:** ${hallucination.risk !== "LOW"
        ? "⚠️ **Manual review strongly recommended.**"
        : "✅ **High confidence review.**"}

## AI Attribution
- AI Generated: **${ai.ai_generated_percent}%**
- Human Written: **${100 - ai.ai_generated_percent}%**

### 🔍 Key Findings
${ai.issues.length > 0
        ? ai.issues.map((i) => `- ${i}`).join("\n")
        : "- No significant issues detected"}

### 🧪 Test Feedback
${ai.test_feedback.length > 0
        ? ai.test_feedback.map((t) => `- ${t}`).join("\n")
        : "- No test issues detected"}

### ✅ Checklist
${ai.checklist_results && ai.checklist_results.length > 0
        ? ai.checklist_results.map((r) => `- ${r.id}: ${r.status}`).join("\n")
        : "- No checklist applied"}

<details>
<summary>📄 Full Watcher Report</summary>

See \`.watcher/WATCHER_REVIEW.md\`

</details>
`;
}
//# sourceMappingURL=report.js.map