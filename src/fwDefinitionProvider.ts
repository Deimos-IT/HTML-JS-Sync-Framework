import * as vscode from 'vscode';
/**
 * ctrl + click
 * @param document 
 * @param position 
 * @returns 
 */
export async function provideFWDefinition(document: vscode.TextDocument, position: vscode.Position): Promise<vscode.Location | null> {

    const range = document.getWordRangeAtPosition(position, /"[^"]+"/);
    if (!range) return null;

    const text = document.getText(range).replace(/"/g, "");
    const handlerName = text;

    // Check if cursor is inside fw-* attribute
    const line = document.lineAt(position.line).text;
    if (!line.includes("fw-")) return null;
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
    `:
                    `
        /**
         * @type HTMLElement
         */
        "${handlerName}": null,
    `;
                const insertPosIndex = findEndOfElementsBlock(jsText) - 1;
                if (insertPosIndex === -1) return null;

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
                if (!match) return null;
            }
        }

        const pos = jsDoc.positionAt(match.index);
        return new vscode.Location(jsDoc.uri, pos);
    } catch (error) {
        return null;
    }
}
function findEndOfElementsBlock(jsText: string): number {
    const start = jsText.indexOf("elements = {");
    if (start === -1) return -1;

    // Start scanning after the opening brace
    let i = jsText.indexOf("{", start);
    if (i === -1) return -1;

    let depth = 1;
    i++;

    while (i < jsText.length && depth > 0) {
        const ch = jsText[i];

        if (ch === "{") depth++;
        else if (ch === "}") depth--;

        i++;
    }

    if (depth !== 0) return -1; // malformed block

    // Now i is right AFTER the closing brace
    // Move to the end of the line
    while (i < jsText.length && jsText[i] !== "\n") {
        i++;
    }

    return i - 2;
}
