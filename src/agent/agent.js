const { StateGraph } = require("@langchain/langgraph");
const { ChatOllama } = require("@langchain/ollama");
const { HumanMessage, SystemMessage } = require("@langchain/core/messages");
require("dotenv/config");

const llm = new ChatOllama({ model: "llama3:8b", temperature: 0.8 });

async function explainCode(codeToExplain, language) {
    const systemPrompt = "You are an expert programmer providing clear and concise explanations of code. Focus on the functionality and the 'how-it-works'.";
    const humanPrompt = `Please explain the following ${language} code in a clear, concise way. What does it do and how does it work?
\`\`\`${language}
${codeToExplain}
\`\`\``;

    const response = await llm.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(humanPrompt),
    ]);

    console.log(' --Generated response');
    return response.content.toString();
}

module.exports = { explainCode };