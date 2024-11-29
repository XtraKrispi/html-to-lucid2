// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { HTMLElement, Node, parse, TextNode, valid } from 'node-html-parser';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "html-to-lucid2" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    const disposable = vscode.commands.registerCommand('html-to-lucid2.convert', () => {
        // The code you place here will be executed every time your command is executed
        // Display a message box to the user
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const selections = editor.selections;
            const spaces = !!editor.options.insertSpaces;
            const numberOfSpaces: number = editor.options.tabSize as number;
            const tabCharacter = spaces ? Array(numberOfSpaces).fill(" ").join("") : "\t";
            const selectedText =
                selections
                    .filter(s => !s.isEmpty)
                    .map((s) => ({
                        selection: s, html: convertToLucid(editor.document.getText(new vscode.Range(s.start, s.end)), tabCharacter)
                            || editor.document.getText(new vscode.Range(s.start, s.end))
                    }));

            for (const converted of selectedText) {
                editor.edit(editBuilder => {
                    editBuilder.delete(converted.selection);
                    editBuilder.insert(converted.selection.start, converted.html);
                });
            }
        }
    });

    context.subscriptions.push(disposable);
}

function convertToLucid(html: string, tabCharacter: string): string | null {
    if (!valid(html)) {
        return null;
    }

    const root = parse(html);

    const convertedNodes = root.removeWhitespace().childNodes.map(convertNode(0, tabCharacter));

    const converted = convertedNodes.join("");
    console.log(converted);
    return converted;
}

function convertNode(level: number, tabCharacter: string) {
    let tabs = Array(level).fill(tabCharacter).join("");
    return function (node: Node): string {
        if (node instanceof HTMLElement) {
            const attributes =
                Object
                    .entries(node.attributes)
                    .map(([key, value]) => `${key}_ "${value}"`)
                    .join(", ");

            const childNodes = node.childNodes.length ? node.childNodes.map(convertNode(level + 1, tabCharacter)) : [`${tabs}${tabCharacter}mempty`];
            const innerHtml = node.isVoidElement ? "" : ` do\n${childNodes.join("\n")}`;
            const outerHtml = `${tabs}${node.rawTagName}_ [${attributes}]${innerHtml}`;

            return outerHtml;
        } else if (node instanceof TextNode) {
            return node.rawText === "\n" ? "" : `${tabs}"${node.rawText}"`;
        }

        return "";
    };
}

// This method is called when your extension is deactivated
export function deactivate() { }
