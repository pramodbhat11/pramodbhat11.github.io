require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

let model;

if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY missing in environment variables");
    // We catch this later or let it crash if critical, but for now log it.
} else {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
}

module.exports = {
    getCropDetails: async (cropName) => {
        if (!model) {
            throw new Error("Gemini AI model is not initialized. Check GEMINI_API_KEY.");
        }

        const prompt = `
Generate a clear and practical agricultural report for the crop: "${cropName}".

## 1. Ideal Growing Conditions
- Soil
- Temperature
- pH
- Rainfall

## 2. Best Sowing Season
- Indian context

## 3. Common Diseases & Pests
- Diseases
- Pests
- Organic control
- Chemical control

## 4. Market Insights
- Demand
- Price trend

## 5. Harvesting Tips
`;

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (err) {
            console.error("FULL GEMINI ERROR:", err);
            throw err;
        }
    }
};
