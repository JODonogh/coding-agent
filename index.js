import { StateGraph } from "@langchain/langgraph";
import { ChatOllama } from "@langchain/ollama";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import "dotenv/config";

/**
 * @typedef {Object} GraphState
 * @property {Object} codeToExplain
 * @property {string} explanation
 */

const llm = new ChatOllama({ model: "llama3", temperature: 0.8});

/** 
 * @param {GraphState} state
 * @returns {Promise<Partial<GraphState>>}
 */

async function explainCodeNode(state) {
    console.log("-> executing the 'explainCodeNode'....");
    const { codeToExplain, language } = state;

    const systemPrompt = "You are an expert programmer providing clear and concise explanations of code. Focus on the functionality and the 'how-it-works'.";
    const humanPrompt = `Please explain the following ${language} code in a clear, concise way. What does it do and how does it work?
    \`\`\`${language}
    ${codeToExplain}
    \`\`\``;

    const response = await llm.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(humanPrompt),
    ]);
    const explanation = response.content.toString();

    console.log(' - Generated explanation.');
    return { explanation: explanation };
}

const graphState = {
    codeToExplain: { value: (x,y) => y, default: () => ""},
    explanation: { value: (x, y) => y, default: () => ""},
}

/** 
* @param {vscode.ExtensionContext} context
*/
function activate(context) {
    console.log("Congratulations, your extension 'coding-agent' is now active!");

    let disposable = vscode.commands.registerCommand('coding-agent.startExplanation', async () => {
        const editor = vscode.window.activeTextEditor;
        if(!editor){
            vscode.window.showInformationMessage('No active editor found.');
            return;
        }

    const codeToExplain = await vscode.window.showInputBox({
        prompt: 'Paste the code you want explained',
        placeHolder: 'Enter your code here',
        ignoreFocusOut: true,
        value: '',
        multiline: true // Only supported in VS Code Insiders or with custom UI
    });

    if (!codeToExplain) {
        vscode.window.showInformationMessage('No code provided.');
        return;
    }

        const selectedCode = editor.document.getText(editor.selection);
        if(!selectedCode){
            vscode.window.showInformationMessage('Please select a piece of code to explain.');
            return;
        }
    
            // Prompt user for language
    const language = await vscode.window.showInputBox({
        prompt: 'Enter the programming language (e.g., python, javascript, java, etc.)',
        placeHolder: 'e.g., python',
        ignoreFocusOut: true
    });

    if (!language) {
        vscode.window.showInformationMessage('No language provided.');
        return;
    }

    vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Coding Agent is thinking....",
            cancellable: false
        }, async (progress) => {
            try {
                const finalState = await app.invoke({ codeToExplain: selectedCode});
                const explanation = finalState.explanation;
                const doc = await vscode.workspace.openTextDocument({ content: explanation, language: 'markdown'});
                await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
            } catch(error){
                console.error("Error running coding agent:", error);
                vscode.window.showErrorMessage("Failed to run agent. Is Ollama running?");
            }
        });

    // Pass both to your agent
    const finalState = await app.invoke({ codeToExplain, language });
    });

    context.subscriptions.push(disposable);
}

//create graph
const graph = new StateGraph( { channels: graphState });
graph.addNode("explainer", explainCodeNode);
graph.setEntryPoint("explainer");
graph.setFinishPoint("explainer");
const app = graph.compile();

module.exports = {
    activate
};