import * as vscode from 'vscode';

export const FW_ATTRIBUTES = [
    "fw-id",//property
    "fw-click",
    "fw-change",
    "fw-beforeinput",
    "fw-keydown",
    "fw-keyup",
    "fw-paste",
];
export class FWCompletionProvider implements vscode.CompletionItemProvider {
    provideCompletionItems(document: vscode.TextDocument, position: vscode.Position): vscode.CompletionItem[] | undefined {

        const line = document.lineAt(position).text;
        const textBeforeCursor = line.substring(0, position.character);

        // Only trigger when typing fw
        if (!textBeforeCursor.endsWith("f")) {
            return undefined;
        }

        return FW_ATTRIBUTES.map(attr => {
            const is_function = (attr !== "fw-id");
            const item = new vscode.CompletionItem(attr, (is_function ? vscode.CompletionItemKind.Function : vscode.CompletionItemKind.Property));
            item.insertText = new vscode.SnippetString(`${attr}="$0"`);
            item.command = {
                command: "editor.action.triggerSuggest",
                title: "Re-trigger suggestions"
            };
            if (is_function) {
                item.detail = "FW event listener";
            } else {
                item.detail = "FW element reference";
            }

            //also change cursor position before last inserted "
            return item;
        });
    }
}
