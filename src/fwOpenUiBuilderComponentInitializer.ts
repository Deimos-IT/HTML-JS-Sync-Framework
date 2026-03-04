
import * as vscode from 'vscode';
import { exec } from 'child_process';

export async function openUiBuilderComponentInitializer(fileUri?: vscode.Uri) {
    // invoked on a folder named "App"; no path required
    const exePath = 'E:\\AAA\\gitrepo\\UiBuilder\\bin\\Debug\\UIBuilder.exe';
    const command = `${exePath} -start-app 3`;
    exec(command, (error, stdout, stderr) => {
        if (error) {
            vscode.window.showErrorMessage(`Failed to launch UIBuilder: ${error.message}`);
            return;
        }
        console.log(stdout);
    });
}
