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

    let sorted = sortSelections(editor.selections).reverse()

    for (const selection of sorted) {
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

                if (!selection.isSingleLine && config.addNewLineB4Duplication) {
                    let space = editor.document.lineAt(start.line).text.match(/^\s+/)

                    edit.insert(end, `${EOL}${space && space.length ? space[0] : ''}${text}`)
                } else {
                    edit.insert(start, text)
                }
            }
        })
    }
}

async function readConfig() {
    return config = await vscode.workspace.getConfiguration(PACKAGE_NAME)
}

function sortSelections(arr) {
    return arr.sort((a, b) => { // make sure its sorted correctly
        if (a.start.line > b.start.line) return 1
        if (b.start.line > a.start.line) return -1

        return 0
    })
}

function deactivate() { }

module.exports = {
    activate,
    deactivate
}
