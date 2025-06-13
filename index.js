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
    const { codeToExplain } = state;

    const systemPrompt = "You are an expert programmer providing clear and concise explanations of code. Focus on the functionality and the 'how-it-works'.";
    const humanPrompt = `Please explain the JavaScript snippet in a clear, concise way. What does it do and how does it work? 
    \`\`\`javascript
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

//create graph
const graph = new StateGraph( { channels: graphState });

//add single node with name & function to graph, set graphs root node, set its leaf node
graph.addNode("explainer", explainCodeNode);
graph.setEntryPoint("explainer");
graph.setFinishPoint("explainer");

const app = graph.compile();

async function main(){
    console.log("Starting the Code Explainer Agent...");

    const code = `const bubbleSort = (arr) => {
        let n = arr.length;
        for (let i = 0; i < n - 1; i ++){
            for (let j = 0; j < n -i -1; j++){
                if (arr[j] > arr[j + 1]){
                    [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
                }
            } 
        }
        return arr;
        };`;

        //graph input 
        const input = { codeToExplain: code };

        // use Stream to see execution steps
        for await (const event of await app.stream(input)){
            for (const [key, value] of Object.entries(event)) {
                console.log(`\n## Event: ${key} ##`);
                console.log(JSON.stringify(value, null, 2));
            }
        }
}

main();