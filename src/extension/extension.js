const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const { explainCode } = require('../agent/agent');

class CodingAgentViewProvider {
    constructor(context) {
        this.context = context;
    }
    resolveWebviewView(webviewView) {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.file(path.join(this.context.extensionPath, 'src', 'panel'))]
        };

        const htmlPath = path.join(this.context.extensionPath, 'src', 'panel', 'panel.html');
        let html = fs.readFileSync(htmlPath, 'utf8');
        const panelJsPath = vscode.Uri.file(
            path.join(this.context.extensionPath, 'src', 'panel', 'panel.js')
        );
        const panelJsUri = webviewView.webview.asWebviewUri(panelJsPath);
        html = html.replace(
            '<script src="panel.js"></script>',
            `<script src="${panelJsUri}"></script>`
        );
        webviewView.webview.html = html;

        webviewView.webview.onDidReceiveMessage(async message => {
            if (message.command === 'explain') {
                const { code, language } = message;
                try {
                    const explanation = await explainCode(code, language);
                    webviewView.webview.postMessage({ command: 'explanation', explanation });
                } catch (err) {
                    webviewView.webview.postMessage({ command: 'error', error: err.message });
                }
            }
        });
    }
}

function registerPanelCommand(context) {
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            'codingAgentView',
            new CodingAgentViewProvider(context)
        )
    );
}

module.exports = { registerPanelCommand };