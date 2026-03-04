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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const codeActions_1 = require("./codeActions");
const fwDefinitionProvider_1 = require("./fwDefinitionProvider");
const fwCompletionProvider_1 = require("./fwCompletionProvider");
const fwOpenLiveUIBuiler_1 = require("./fwOpenLiveUIBuiler");
const fwOpenUiBuilderComponentInitializer_1 = require("./fwOpenUiBuilderComponentInitializer");
let diagnosticCollection;
function activate(context) {
    diagnosticCollection = vscode.languages.createDiagnosticCollection('fwAttributes');
    context.subscriptions.push(diagnosticCollection);
    //trigger completion fw-xxx
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider({ language: "html" }, new fwCompletionProvider_1.FWCompletionProvider(), "f" // trigger when typing "f" 
    ));
    // Register definition provider for Ctrl+Click
    context.subscriptions.push(vscode.languages.registerDefinitionProvider({ language: "html" }, { provideDefinition: fwDefinitionProvider_1.provideFWDefinition }));
    vscode.languages.registerCodeActionsProvider({ language: "html" }, new codeActions_1.FWCodeActionProvider(), { providedCodeActionKinds: codeActions_1.FWCodeActionProvider.providedCodeActionKinds });
    context.subscriptions.push(vscode.commands.registerCommand("fwAttributes.createHandler", async (handlerName, jsFilePath) => {
        await insertHandler(handlerName, jsFilePath);
    }));
    // command for live UI builder
    context.subscriptions.push(vscode.commands.registerCommand("fwAttributes.openLiveUiBuilder", async (fileUri) => {
        await (0, fwOpenLiveUIBuiler_1.openLiveUiBuilder)(fileUri);
    }));
    // command for FWComponent initializer
    context.subscriptions.push(vscode.commands.registerCommand("fwAttributes.openUiBuilderComponentInitializer", async (fileUri) => {
        await (0, fwOpenUiBuilderComponentInitializer_1.openUiBuilderComponentInitializer)(fileUri);
    }));
    // Validate on open
    context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(doc => {
        if (isHtml(doc)) {
            validateDocument(doc);
        }
    }));
    // Validate on change
    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(event => {
        if (isHtml(event.document)) {
            validateDocument(event.document);
        }
    }));
    // Validate already open HTML docs
    vscode.workspace.textDocuments
        .filter(isHtml)
        .forEach(validateDocument);
}
function deactivate() {
    if (diagnosticCollection) {
        diagnosticCollection.dispose();
    }
}
function isHtml(doc) {
    return doc.languageId === 'html' || doc.fileName.endsWith('.html');
}
async function validateDocument(doc) {
    const diagnostics = [];
    const text = doc.getText();
    const path = doc.uri.fsPath;
    // Regex to find fw-keydown="onKeyDown" / fw-keyup="onKeyUp"
    const attrRegex = /(fw-[a-zA-Z]+)\s*=\s*"([^"]+)"/g;
    let match;
    while ((match = attrRegex.exec(text)) !== null) {
        const attrName = match[1]; // fw-keydown or fw-keyup
        if (attrName === "fw-id") {
            continue;
        }
        const handlerName = match[2]; // onKeyDown / onKeyUp
        const offset = match.index;
        const position = doc.positionAt(offset);
        const range = new vscode.Range(position, doc.positionAt(offset + match[0].length));
        const path_js_file = path.replace(/\.html?$/, ".js");
        const exists = await handlerExistsInWorkspace(handlerName, path_js_file);
        if (!exists) {
            const diag = new vscode.Diagnostic(range, `Handler "${handlerName}" referenced by ${attrName} was not found in .${path_js_file.substring(path_js_file.lastIndexOf("\\"))}`, vscode.DiagnosticSeverity.Error);
            diag.source = "fwAttributes";
            diagnostics.push(diag);
            break;
        }
        else {
            //change the color of the text of the function and add a reference when ctrl+click it brings to the js file definition
        }
    }
    diagnosticCollection.set(doc.uri, diagnostics);
}
async function handlerExistsInWorkspace(handlerName, path_js_file) {
    try {
        const jsDoc = await vscode.workspace.openTextDocument(path_js_file);
        const text = jsDoc.getText();
        // Look for function `onKeyDown(`
        const handlerRegex = new RegExp(`\\b${handlerName}\\s*\\(`);
        return handlerRegex.test(text);
    }
    catch (error) {
        return false;
    }
}
async function insertHandler(handlerName, jsFilePath) {
    try {
        const jsDoc = await vscode.workspace.openTextDocument(jsFilePath);
        const editor = await vscode.window.showTextDocument(jsDoc);
        const insertText = `    /**
     * Auto-generated handler
     * @param {Event} event
     */
    ${handlerName}(event) {
        /**
         * @type HTMLElement
         */
        const element_with_this_event = this;
        /**
         * @type ${jsFilePath.substring(jsFilePath.lastIndexOf("\\") + 1).replace(/(.js$)/, '')}
         */
        const owner = element_with_this_event.fwInstanceReference;
        // TODO: implement
    }
    `;
        // Insert before last closing brace of the class
        const text = jsDoc.getText();
        const key_region_event_listeners = "//#region Framework Event Listeners";
        const ss = text.indexOf(key_region_event_listeners);
        const classEnd = text.substring(ss).lastIndexOf("//#endregion") + ss;
        if (classEnd === -1) {
            vscode.window.showErrorMessage("Could not find class end in JS file.");
            return;
        }
        const pos = jsDoc.positionAt(classEnd);
        await editor.edit(editBuilder => {
            editBuilder.insert(pos, insertText);
        });
        vscode.window.showInformationMessage(`Created handler ${handlerName}(...) in ./${jsFilePath.substring(jsFilePath.lastIndexOf("\\") + 1)}`);
    }
    catch (err) {
        vscode.window.showErrorMessage("Failed to insert handler: " + err);
    }
}
//# sourceMappingURL=extension.js.map