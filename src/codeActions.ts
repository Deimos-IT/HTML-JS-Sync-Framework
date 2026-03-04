import * as vscode from 'vscode';

export class FWCodeActionProvider implements vscode.CodeActionProvider {
    static readonly providedCodeActionKinds = [
        vscode.CodeActionKind.QuickFix
    ];

    provideCodeActions(document: vscode.TextDocument, range: vscode.Range, context: vscode.CodeActionContext): vscode.CodeAction[] {
        const diagnostics = context.diagnostics.filter(d => d.source === "fwAttributes");

        if (diagnostics.length === 0) {
            return [];
        }

        const actions: vscode.CodeAction[] = [];

        for (const diag of diagnostics) {
            const match = diag.message.match(/Handler "([^"]+)"/);
            if (!match) continue;

            const handlerName = match[1];

            const jsFilePath = document.uri.fsPath.replace(/\.html?$/, ".js");

            const fix = new vscode.CodeAction(
                `Create function ${handlerName}() in JS file`,
                vscode.CodeActionKind.QuickFix
            );

            fix.command = {
                title: "Insert missing handler",
                command: "fwAttributes.createHandler",
                arguments: [handlerName, jsFilePath]
            };

            fix.diagnostics = [diag];
            fix.isPreferred = true;

            actions.push(fix);
        }

        return actions;
    }
}
