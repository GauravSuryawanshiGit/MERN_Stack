require("dotenv").config();

const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testGemini() {
  try {
    console.log(
      "API Key:",
      process.env.GEMINI_API_KEY ? "Loaded ✅" : "Missing ❌"
    );

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const result = await model.generateContent("Say Hello");

    console.log("✅ Gemini Connected");
    console.log(result.response.text());
  } catch (err) {
    console.error("❌ Gemini Error");
    console.error(err);
  }
}

testGemini();