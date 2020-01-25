const vscode = require("vscode")
const { EOL } = require('os')
const PACKAGE_NAME = 'duplicate-selection-or-line'

let config = {}

async function activate(context) {
    await readConfig()

    vscode.workspace.onDidChangeConfiguration(async (e) => {
        if (e.affectsConfiguration(PACKAGE_NAME)) {
            await readConfig()
        }
    })

    context.subscriptions.push(vscode.commands.registerCommand('geeebe.duplicateText', duplicateText))
}

async function duplicateText() {
    const editor = vscode.window.activeTextEditor

    if (!editor) {
        return
    }

    let multi = false

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
                multi = true
                const text = editor.document.getText(selection)

                if (!selection.isSingleLine && config.addNewLineB4Duplication) {
                    edit.insert(end, `${EOL}${text}`)
                } else {
                    edit.insert(start, text)
                }
            }
        })
    }

    if (multi && config.formatAfterDuplication) {
        vscode.commands.executeCommand('editor.action.formatSelection')
    }
}

async function readConfig() {
    return config = await vscode.workspace.getConfiguration(PACKAGE_NAME)
}

function deactivate() { }

module.exports = {
    activate,
    deactivate
}
