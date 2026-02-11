require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // Note: listModels is on the genAI instance or model? 
        // Docs say genAI.getGenerativeModel... but listing might be different?
        // Actually, the SDK might not expose listModels directly on the main class easily in all versions.
        // Let's try a simple fetch to the API endpoint manually if SDK fails, but SDK usually has it.
        // Wait, standard SDK doesn't always have listModels exposed in the main helper.
        // Let's use a simple fetch to be sure.

        const key = process.env.GEMINI_API_KEY;
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

        const response = await fetch(url);
        const data = await response.json();

        console.log("Available Models:");
        if (data.models) {
            data.models.forEach(m => {
                if (m.supportedGenerationMethods.includes("generateContent")) {
                    console.log("- " + m.name);
                }
            });
        } else {
            console.log("No models found or error:", data);
        }

    } catch (e) {
        console.error("Error listing models:", e);
    }
}

listModels();
