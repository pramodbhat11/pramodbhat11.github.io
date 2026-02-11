require('dotenv').config();
const OpenAI = require("openai");

async function testAI() {
    console.log("Testing OpenAI API...");
    console.log("Key available:", !!process.env.OPENAI_API_KEY);

    if (!process.env.OPENAI_API_KEY) {
        console.error("ERROR: No API Key found.");
        return;
    }

    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

    try {
        console.log("Sending prompt...");
        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: "Explain growing tomatoes in one sentence." }],
            model: "gpt-4o",
        });
        console.log("Response:", completion.choices[0].message.content);
        console.log("✅ SUCCESS");
    } catch (e) {
        console.error("❌ FAILED:", e.message);
        console.error("Full Error:", JSON.stringify(e, null, 2));
    }
}

testAI();
