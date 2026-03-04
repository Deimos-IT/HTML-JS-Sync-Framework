
import * as vscode from 'vscode';
import { exec } from 'child_process';

export async function openLiveUiBuilder(fileUri?: vscode.Uri) {
    let targetPath: string | undefined;
    if (fileUri && fileUri.fsPath) {
        targetPath = fileUri.fsPath;
    } else if (vscode.window.activeTextEditor) {
        targetPath = vscode.window.activeTextEditor.document.uri.fsPath;
    }
    if (!targetPath) {
        vscode.window.showErrorMessage('No HTML file path available for Live UiBuilder.');
        return;
    }
    const exePath = 'E:\\AAA\\gitrepo\\UiBuilder\\bin\\Debug\\UIBuilder.exe';
    const command = `${exePath} -path "${targetPath}" -start-app 2`;
    exec(command, (error, stdout, stderr) => {
        if (error) {
            vscode.window.showErrorMessage(`Failed to launch UIBuilder: ${error.message}`);
            return;
        }
        console.log(stdout);
    });
}
