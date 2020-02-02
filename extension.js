const vscode = require("vscode")
const { EOL } = require('os')
const PACKAGE_NAME = 'duplicate-selection-or-line'

let config = {}
let dis = []
const changesEvent = new vscode.EventEmitter()

async function activate(context) {
    await readConfig()

    vscode.workspace.onDidChangeConfiguration(async (e) => {
        if (e.affectsConfiguration(PACKAGE_NAME)) {
            await readConfig()
        }
    })

    changesEvent.event((oldselection) => {
        clearAll()

        dis.push(
            vscode.window.onDidChangeTextEditorSelection((e) => {
                let newSelections = []
                let { selections, textEditor } = e
                for (let i = 0; i < selections.length; i++) {
                    const current = selections[i]

                    if (!current.start.isEqual(oldselection.start)) {
                        newSelections.push(current)
                        continue
                    }

                    let range = new vscode.Range(
                        oldselection.end.line + 1,
                        0,
                        current.end.line,
                        current.end.character
                    )
                    newSelections.push(new vscode.Selection(range.start, range.end))
                }

                textEditor.selections = newSelections
                clearAll()
            })
        )
    })

    context.subscriptions.push(vscode.commands.registerCommand('geeebe.duplicateText', duplicateText))
}

function clearAll() {
    dis.map((e) => e.dispose())
    dis = []
}

async function duplicateText() {
    const editor = vscode.window.activeTextEditor

    if (!editor) {
        return
    }

    let sorted = sortSelections(editor.selections).reverse()

    for (const selection of sorted) {
        let { start, end } = selection

        await editor.edit(
            (edit) => {
                // Duplicate line
                if (selection.isEmpty) {
                    const text = editor.document.lineAt(start.line).text
                    edit.insert(new vscode.Position(start.line, 0), `${text}${EOL}`)
                }

                // Duplicate selection
                else {
                    const text = editor.document.getText(selection)

                    if (!selection.isSingleLine && config.addNewLineB4Duplication) {
                        changesEvent.fire(selection)
                        let space = editor.document.lineAt(start.line).text.match(/^\s+/)

                        edit.insert(end, `${EOL}${space && space.length ? space[0] : ''}${text}`)
                    } else {
                        edit.insert(start, text)
                    }
                }
            },
            { undoStopBefore: false, undoStopAfter: false }
        )
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
