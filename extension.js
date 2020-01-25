const vscode = require("vscode")
const { EOL } = require('os')

function activate(context) {
    context.subscriptions.push(vscode.commands.registerCommand('geeebe.duplicateText', duplicateText))
}

async function duplicateText() {
    const editor = vscode.window.activeTextEditor

    if (!editor) {
        return
    }

    for (const selection of editor.selections) {
        let { start, end } = selection

        await editor.edit((edit) => {
            // Duplicate line
            if (selection.isEmpty) {
                const text = editor.document.lineAt(start.line).text
                edit.insert(new vscode.Position(start.line, 0), `${text}${EOL}`)
            }

            // Duplicate selection
            else {
                const text = editor.document.getText(selection)

                if (!selection.isSingleLine) {
                    edit.insert(end, `${EOL}${text}`)
                } else {
                    edit.insert(start, text)
                }
            }
        })
    }
}

function deactivate() { }

module.exports = {
    activate,
    deactivate
}
