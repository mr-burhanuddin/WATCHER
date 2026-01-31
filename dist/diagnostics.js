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
exports.initDiagnostics = initDiagnostics;
exports.publishDiagnostics = publishDiagnostics;
exports.clearDiagnostics = clearDiagnostics;
const vscode = __importStar(require("vscode"));
let collection = null;
function initDiagnostics(context) {
    collection = vscode.languages.createDiagnosticCollection("watcher");
    context.subscriptions.push(collection);
}
function riskToSeverity(risk) {
    switch (risk) {
        case "HIGH":
            return vscode.DiagnosticSeverity.Error;
        case "MEDIUM":
            return vscode.DiagnosticSeverity.Warning;
        default:
            return vscode.DiagnosticSeverity.Information;
    }
}
function publishDiagnostics(files, ai) {
    if (!collection)
        return;
    let summaryText = "";
    if (ai.confidence_notes.includes("Diff truncated")) {
        summaryText =
            "Large PR detected. Watcher review was partial due to size limits.";
    }
    summaryText =
        ai.issues.length > 0 ? ai.issues.join("; ") : "No major issues detected";
    const risk = ai.confidence_score < 50
        ? "HIGH"
        : ai.confidence_score < 75
            ? "MEDIUM"
            : "LOW";
    for (const file of files) {
        const uri = vscode.Uri.file(file);
        const diagnostic = new vscode.Diagnostic(new vscode.Range(0, 0, 0, 0), `Watcher Review (${risk} confidence): ${summaryText}`, riskToSeverity(risk));
        diagnostic.source = "Watcher";
        collection.set(uri, [diagnostic]);
    }
}
function clearDiagnostics() {
    collection?.clear();
}
//# sourceMappingURL=diagnostics.js.map