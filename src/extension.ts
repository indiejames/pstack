'use strict';

import * as vscode from 'vscode';

// the stored locations
var locationStack: vscode.Location [] = [];

// maximum number of locations to store
var maxDepth = 1000;

// The following three functions are based on code in the vscode go to last edit extension
// https://github.com/plrenaudin/goto-last-edit-vscode

function scrollToLocation(editor, location) {
    editor.revealRange(location.range);
    editor.selection = new vscode.Selection(location.range.start, location.range.end);
}

function push(){
    let editor = vscode.window.activeTextEditor;
    let uri = editor.document.uri;
    let position = editor.selection.active;
    let location = new vscode.Location(uri, position);
    locationStack.push(location);
}

function pop(){
    if (locationStack.length > 0) {
        let location = locationStack.pop();
        
        var lastEditEditorFound = vscode.workspace.textDocuments.find(function (item) {
            return item.uri == location.uri;
        });

        if (lastEditEditorFound) {
            vscode.window.showTextDocument(lastEditEditorFound)
                .then(function (editor) { scrollToLocation(editor, location); });
        } else {
            vscode.workspace.openTextDocument(location.uri)
                .then(vscode.window.showTextDocument)
                .then(function (editor) { scrollToLocation(editor, location); });
        }
    }
}

export function activate(context: vscode.ExtensionContext) {

    let config = vscode.workspace.getConfiguration('pstack');
    let maxDepth = config.get('pstack.maxDepth');
 
    let pushDisposable = vscode.commands.registerCommand('pstack.push', () => {
        push();
    });
    
    context.subscriptions.push(pushDisposable);

    let popDisposable = vscode.commands.registerCommand('pstack.pop', () => {
        pop();        
    });    

    context.subscriptions.push(popDisposable);

    let api = {
        push() {
            push();
        },
        pop() {
            pop();
        }
    }

    // export our public interfaces for other extensions to use
    return api;
}

// this method is called when your extension is deactivated
export function deactivate() {
    locationStack = [];
}