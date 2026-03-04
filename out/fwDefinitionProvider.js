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
exports.provideFWDefinition = provideFWDefinition;
const vscode = __importStar(require("vscode"));
/**
 * ctrl + click
 * @param document
 * @param position
 * @returns
 */
async function provideFWDefinition(document, position) {
    const range = document.getWordRangeAtPosition(position, /"[^"]+"/);
    if (!range)
        return null;
    const text = document.getText(range).replace(/"/g, "");
    const handlerName = text;
    // Check if cursor is inside fw-* attribute
    const line = document.lineAt(position.line).text;
    if (!line.includes("fw-"))
        return null;
    try {
        const jsPath = document.uri.fsPath.replace(/\.html?$/, ".js");
        let jsDoc = await vscode.workspace.openTextDocument(jsPath);
        let jsText = jsDoc.getText();
        const regex = new RegExp(`\\b${handlerName}\\s*\\(`);
        let match = regex.exec(jsText);
        if (!match) {
            const regex_fw_id = new RegExp(`fw-id=[\"']{1}${handlerName}`);
            match = regex_fw_id.exec(line);
            if (!match) {
                return null;
            }
            //fw id property
            let regexProperty = new RegExp(`${handlerName}:\\s*null`);
            match = regexProperty.exec(jsText);
            if (!match) {
                regexProperty = new RegExp(`['\"]{1}${handlerName}['\"]{1}:\\s*null`);
                match = regexProperty.exec(jsText);
            }
            if (!match) {
                // 4. Property missing → insert it
                const simple_property_name = new RegExp("^[a-zA-Z_]{1}[a-zA-Z0-9_]+$").exec(handlerName);
                const insertText = simple_property_name ?
                    `
        /**
         * @type HTMLElement
         */
        ${handlerName}: null,
    ` :
                    `
        /**
         * @type HTMLElement
         */
        "${handlerName}": null,
    `;
                const insertPosIndex = findEndOfElementsBlock(jsText);
                if (insertPosIndex === -1)
                    return null;
                const insertPos = jsDoc.positionAt(insertPosIndex);
                const editor = await vscode.window.showTextDocument(jsDoc);
                await editor.edit(editBuilder => {
                    editBuilder.insert(insertPos, insertText);
                });
                // Reload updated document
                jsDoc = await vscode.workspace.openTextDocument(jsPath);
                jsText = jsDoc.getText();
                // Find the newly inserted property
                match = regexProperty.exec(jsText);
                if (!match)
                    return null;
            }
        }
        const pos = jsDoc.positionAt(match.index);
        return new vscode.Location(jsDoc.uri, pos);
    }
    catch (error) {
        return null;
    }
}
function findEndOfElementsBlock(jsText) {
    const start = jsText.indexOf("elements = {");
    if (start === -1)
        return -1;
    // Start scanning after the opening brace
    let i = jsText.indexOf("{", start);
    if (i === -1)
        return -1;
    let depth = 1;
    i++;
    while (i < jsText.length && depth > 0) {
        const ch = jsText[i];
        if (ch === "{")
            depth++;
        else if (ch === "}")
            depth--;
        i++;
    }
    if (depth !== 0)
        return -1; // malformed block
    // Now i is right AFTER the closing brace
    // Move to the end of the line
    while (i < jsText.length && jsText[i] !== "\n") {
        i++;
    }
    return i - 2;
}
//# sourceMappingURL=fwDefinitionProvider.js.map