const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const { explainCode } = require('./agent/agent.js');

/**
 * WebviewViewProvider implementation for the Coding Agent view
 */
class CodingAgentViewProvider {
    constructor(context) {
        this._extensionUri = context.extensionUri;
        this._view = undefined;
    }

    // This method is called when the view becomes visible
    resolveWebviewView(webviewView, context, _token) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        // Set the webview's initial html content
        this._updateWebview(webviewView);

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(async message => {
            if (message.command === 'explain') {
                const { code, language } = message;
                try {
                    // Show a progress indicator
                    await vscode.window.withProgress({
                        location: vscode.ProgressLocation.Notification,
                        title: "MondriCode Agent is thinking...",
                        cancellable: false
                    }, async (progress) => {
                        const explanation = await explainCode(code, language);
                        webviewView.webview.postMessage({ command: 'explanation', explanation });
                    });
                } catch (err) {
                    webviewView.webview.postMessage({ command: 'error', error: err.message });
                    vscode.window.showErrorMessage(`Coding Agent Error: ${err.message}`);
                }
            }
        });
    }

    // Helper method to update the webview content
    _updateWebview(webviewView) {
        try {
            const htmlPath = vscode.Uri.joinPath(this._extensionUri, 'src', 'panel', 'panel.html');
            let html = fs.readFileSync(htmlPath.fsPath, 'utf8');

            // Create a secure URI for the panel's JavaScript
            const panelJsUri = webviewView.webview.asWebviewUri(
                vscode.Uri.joinPath(this._extensionUri, 'src', 'panel', 'panel.js')
            );
            
            // Replace the script tag with the webview-safe URI
            html = html.replace(
                '<script src="panel.js"></script>', 
                `<script src="${panelJsUri}"></script>`
            );

            webviewView.webview.html = html;
        } catch (error) {
            console.error('Failed to update webview:', error);
            vscode.window.showErrorMessage(`Failed to load Coding Agent view: ${error.message}`);
        }
    }
}

/**
 * This is the main activation function that VS Code will call
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log("MondriCode Agent is now active!");
    
    // Create and register the webview view provider
    const provider = new CodingAgentViewProvider(context);
    
    // The provider is registered for a specific view ID defined in package.json
    const viewRegistration = vscode.window.registerWebviewViewProvider(
        "codingAgentView", // This ID MUST match the view ID in package.json
        provider,
        {
            // This ensures the provider is not recreated every time the view becomes visible
            webviewOptions: { retainContextWhenHidden: true }
        }
    );
    
    // Add the registration to subscriptions so it gets disposed when the extension is deactivated
    context.subscriptions.push(viewRegistration);
}

module.exports = {
    activate
};
