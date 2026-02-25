import { WatcherAIResult } from "./ai";

export type PRScoreResult = {
  score: number;
  label: "Excellent" | "Good" | "Needs Review" | "High Risk";
};

export function computePRScore(review: WatcherAIResult): PRScoreResult {
  let score =
    100 +
    review.positives.length * 5 -
    review.negatives.length * 5 -
    review.risks.length * 10 -
    review.test_feedback.length * 5;

  score = clamp(score, 0, 100);

  let label: PRScoreResult["label"] =
    score >= 90
      ? "Excellent"
      : score >= 75
        ? "Good"
        : score >= 60
          ? "Needs Review"
          : "High Risk";

  return { score, label };
}

export function computeConfidenceScore(
  level: "LOW" | "MEDIUM" | "HIGH",
  truncated: boolean,
  disagreementScore: number,
): number {
  let score = level === "HIGH" ? 90 : level === "MEDIUM" ? 70 : 40;

  if (truncated) score -= 20;
  score -= Math.floor(disagreementScore / 2);

  return clamp(score, 0, 100);
}

export function computeRiskLevel(
  confidenceScore: number,
  risksCount: number,
): "Low" | "⚠️ Caution" {
  if (confidenceScore < 50 || risksCount >= 2) {
    return "⚠️ Caution";
  }
  return "Low";
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
