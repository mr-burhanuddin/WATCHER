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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadChecklist = loadChecklist;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const yaml_1 = __importDefault(require("yaml"));
/**
 * Loads .watcher/checklist.yml if present
 */
function loadChecklist(repoRoot) {
    const checklistPath = path.join(repoRoot, ".watcher", "checklist.yml");
    if (!fs.existsSync(checklistPath)) {
        return null;
    }
    try {
        const raw = fs.readFileSync(checklistPath, "utf8");
        const parsed = yaml_1.default.parse(raw);
        if (!parsed?.checks || !Array.isArray(parsed.checks)) {
            throw new Error("Invalid checklist format");
        }
        return {
            checks: parsed.checks.map((c) => ({
                id: String(c.id),
                description: String(c.description),
            })),
        };
    }
    catch (err) {
        throw new Error("Watcher: Failed to parse .watcher/checklist.yml");
    }
}
//# sourceMappingURL=checklist.js.map