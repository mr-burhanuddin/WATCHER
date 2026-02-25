"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computePRScore = computePRScore;
exports.computeConfidenceScore = computeConfidenceScore;
exports.computeRiskLevel = computeRiskLevel;
function computePRScore(review) {
    let score = 100 +
        review.positives.length * 5 -
        review.negatives.length * 5 -
        review.risks.length * 10 -
        review.test_feedback.length * 5;
    score = clamp(score, 0, 100);
    let label = score >= 90
        ? "Excellent"
        : score >= 75
            ? "Good"
            : score >= 60
                ? "Needs Review"
                : "High Risk";
    return { score, label };
}
function computeConfidenceScore(level, truncated, disagreementScore) {
    let score = level === "HIGH" ? 90 : level === "MEDIUM" ? 70 : 40;
    if (truncated)
        score -= 20;
    score -= Math.floor(disagreementScore / 2);
    return clamp(score, 0, 100);
}
function computeRiskLevel(confidenceScore, risksCount) {
    if (confidenceScore < 50 || risksCount >= 2) {
        return "⚠️ Caution";
    }
    return "Low";
}
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
//# sourceMappingURL=scoring.js.map