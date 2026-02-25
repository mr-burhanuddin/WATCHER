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
exports.clearDiagnostics = clearDiagnostics;
exports.publishDiagnostics = publishDiagnostics;
const vscode = __importStar(require("vscode"));
let diagnosticCollection;
/**
 * Initialize diagnostics collection
 */
function initDiagnostics(context) {
    if (!diagnosticCollection) {
        diagnosticCollection =
            vscode.languages.createDiagnosticCollection("watcher");
        context.subscriptions.push(diagnosticCollection);
    }
}
/**
 * Clear all Watcher diagnostics
 */
function clearDiagnostics() {
    diagnosticCollection?.clear();
}
/**
 * Publish diagnostics based on AI review
 * ONLY negatives and risks produce Problems
 */
function publishDiagnostics(files, ai) {
    if (!diagnosticCollection)
        return;
    const diagnosticsByFile = new Map();
    // Helper to push diagnostics
    function addDiagnostic(file, message, severity) {
        const uri = vscode.Uri.file(file);
        const diagnostic = new vscode.Diagnostic(new vscode.Range(0, 0, 0, 1), message, severity);
        if (!diagnosticsByFile.has(uri.fsPath)) {
            diagnosticsByFile.set(uri.fsPath, []);
        }
        diagnosticsByFile.get(uri.fsPath).push(diagnostic);
    }
    // Negatives → Warnings
    for (const issue of ai.negatives || []) {
        for (const file of files) {
            addDiagnostic(file, issue, vscode.DiagnosticSeverity.Warning);
        }
    }
    // Risks → Errors
    for (const risk of ai.risks || []) {
        for (const file of files) {
            addDiagnostic(file, risk, vscode.DiagnosticSeverity.Error);
        }
    }
    // Publish
    for (const [filePath, diags] of diagnosticsByFile.entries()) {
        diagnosticCollection.set(vscode.Uri.file(filePath), diags);
    }
}
//# sourceMappingURL=diagnostics.js.map