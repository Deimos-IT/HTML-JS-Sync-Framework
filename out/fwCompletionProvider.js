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
exports.FWCompletionProvider = exports.FW_ATTRIBUTES = void 0;
const vscode = __importStar(require("vscode"));
exports.FW_ATTRIBUTES = [
    "fw-id", //property
    "fw-click",
    "fw-change",
    "fw-beforeinput",
    "fw-keydown",
    "fw-keyup",
    "fw-paste",
];
class FWCompletionProvider {
    provideCompletionItems(document, position) {
        const line = document.lineAt(position).text;
        const textBeforeCursor = line.substring(0, position.character);
        // Only trigger when typing fw
        if (!textBeforeCursor.endsWith("f")) {
            return undefined;
        }
        return exports.FW_ATTRIBUTES.map(attr => {
            const is_function = (attr !== "fw-id");
            const item = new vscode.CompletionItem(attr, (is_function ? vscode.CompletionItemKind.Function : vscode.CompletionItemKind.Property));
            item.insertText = new vscode.SnippetString(`${attr}="$0"`);
            item.command = {
                command: "editor.action.triggerSuggest",
                title: "Re-trigger suggestions"
            };
            if (is_function) {
                item.detail = "FW event listener";
            }
            else {
                item.detail = "FW element reference";
            }
            //also change cursor position before last inserted "
            return item;
        });
    }
}
exports.FWCompletionProvider = FWCompletionProvider;
//# sourceMappingURL=fwCompletionProvider.js.map