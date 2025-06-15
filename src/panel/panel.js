const vscode = acquireVsCodeApi();

document.getElementById('explainBtn').addEventListener('click', () => {
    const code = document.getElementById('code').value;
    const language = document.getElementById('language').value;
    vscode.postMessage({ command: 'explain', code, language });
});

window.addEventListener('message', event => {
    const message = event.data;
    if (message.command === 'explanation') {
        document.getElementById('result').textContent = message.explanation;
    } else if (message.command === 'error') {
        document.getElementById('result').textContent = 'Error: ' + message.error;
    }
});