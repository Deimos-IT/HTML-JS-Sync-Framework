import * as vscode from 'vscode';
import { FWCodeActionProvider } from './codeActions';
import { provideFWDefinition } from './fwDefinitionProvider';
import { FWCompletionProvider } from './fwCompletionProvider';
import { openLiveUiBuilder } from './fwOpenLiveUIBuiler';

let diagnosticCollection: vscode.DiagnosticCollection;

export function activate(context: vscode.ExtensionContext) {
	diagnosticCollection = vscode.languages.createDiagnosticCollection('fwAttributes');
	context.subscriptions.push(diagnosticCollection);

	//trigger completion fw-xxx
	context.subscriptions.push(
		vscode.languages.registerCompletionItemProvider(
			{ language: "html" },
			new FWCompletionProvider(),
			"f" // trigger when typing "f" 
		)
	);

	// Register definition provider for Ctrl+Click
	context.subscriptions.push(
		vscode.languages.registerDefinitionProvider(
			{ language: "html" },
			{ provideDefinition: provideFWDefinition }
		)
	);

	vscode.languages.registerCodeActionsProvider(
		{ language: "html" },
		new FWCodeActionProvider(),
		{ providedCodeActionKinds: FWCodeActionProvider.providedCodeActionKinds }
	);

	context.subscriptions.push(
		vscode.commands.registerCommand(
			"fwAttributes.createHandler",
			async (handlerName: string, jsFilePath: string) => {
				await insertHandler(handlerName, jsFilePath);
			}
		)
	);

	// command for live UI builder
	context.subscriptions.push(
		vscode.commands.registerCommand(
			"fwAttributes.openLiveUiBuilder",
			async (fileUri?: vscode.Uri) => {
				await openLiveUiBuilder(fileUri);
			}
		)
	);
	// Validate on open
	context.subscriptions.push(
		vscode.workspace.onDidOpenTextDocument(doc => {
			if (isHtml(doc)) {
				validateDocument(doc);
			}
		})
	);

	// Validate on change
	context.subscriptions.push(
		vscode.workspace.onDidChangeTextDocument(event => {
			if (isHtml(event.document)) {
				validateDocument(event.document);
			}
		})
	);

	// Validate already open HTML docs
	vscode.workspace.textDocuments
		.filter(isHtml)
		.forEach(validateDocument);
}

export function deactivate() {
	if (diagnosticCollection) {
		diagnosticCollection.dispose();
	}
}

function isHtml(doc: vscode.TextDocument): boolean {
	return doc.languageId === 'html' || doc.fileName.endsWith('.html');
}
async function validateDocument(doc: vscode.TextDocument) {
	const diagnostics: vscode.Diagnostic[] = [];

	const text = doc.getText();
	const path = doc.uri.fsPath;
	// Regex to find fw-keydown="onKeyDown" / fw-keyup="onKeyUp"
	const attrRegex = /(fw-[a-zA-Z]+)\s*=\s*"([^"]+)"/g;

	let match: RegExpExecArray | null;
	while ((match = attrRegex.exec(text)) !== null) {
		const attrName = match[1];      // fw-keydown or fw-keyup
		if (attrName === "fw-id") {
			continue;
		}
		const handlerName = match[2];   // onKeyDown / onKeyUp
		const offset = match.index;

		const position = doc.positionAt(offset);
		const range = new vscode.Range(
			position,
			doc.positionAt(offset + match[0].length)
		);
		const path_js_file = path.replace(/\.html?$/, ".js");
		const exists = await handlerExistsInWorkspace(handlerName, path_js_file);

		if (!exists) {
			const diag = new vscode.Diagnostic(
				range,
				`Handler "${handlerName}" referenced by ${attrName} was not found in .${path_js_file.substring(path_js_file.lastIndexOf("\\"))}`,
				vscode.DiagnosticSeverity.Error
			);
			diag.source = "fwAttributes";
			diagnostics.push(diag);
			break;
		} else {
			//change the color of the text of the function and add a reference when ctrl+click it brings to the js file definition
		}
	}

	diagnosticCollection.set(doc.uri, diagnostics);
}

async function handlerExistsInWorkspace(handlerName: string, path_js_file: string): Promise<boolean> {
	try {
		const jsDoc = await vscode.workspace.openTextDocument(path_js_file);
		const text = jsDoc.getText();

		// Look for function `onKeyDown(`
		const handlerRegex = new RegExp(`\\b${handlerName}\\s*\\(`);
		return handlerRegex.test(text);
	} catch (error) {
		return false;
	}
}

async function insertHandler(handlerName: string, jsFilePath: string) {
	try {
		const jsDoc = await vscode.workspace.openTextDocument(jsFilePath);
		const editor = await vscode.window.showTextDocument(jsDoc);

		const insertText =
			`    /**
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
	} catch (err) {
		vscode.window.showErrorMessage("Failed to insert handler: " + err);
	}
}