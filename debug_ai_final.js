require('dotenv').config();
const OpenAI = require("openai");

async function testModel(modelName) {
    console.log(`\n--- Testing Model: ${modelName} ---`);
    if (!process.env.OPENAI_API_KEY) {
        console.error("❌ SKIPPED: No API Key");
        return false;
    }

    try {
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: "Say hello" }],
            model: modelName,
        });
        console.log(`✅ SUCCESS: ${completion.choices[0].message.content}`);
        return true;
    } catch (e) {
        console.log(`❌ FAILED: ${e.message}`);
        return false;
    }
}

async function runTests() {
    console.log("Starting connectivity tests...");

    // Test GPT-4o
    await testModel("gpt-4o");

    // Test GPT-3.5 Turbo
    await testModel("gpt-3.5-turbo");
}

runTests();
