const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.askAI = async (req, res) => {

    try {

        const { message } = req.body;

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash"
        });

     const prompt = `
You are Quizo AI Tutor.

Rules:
- You are the AI assistant of the Quizo Quiz Platform.
- Answer only educational questions related to:
  • Java
  • Python
  • DSA
  • DBMS
  • Operating Systems
  • Computer Networks
  • AI & ML
  • Web Development
  • Aptitude
- Explain concepts in simple language.
- Help users solve coding problems.
- Help prepare for quizzes and interviews.
- If a question is unrelated to education (movies, politics, gossip, etc.), politely say that you are an educational AI assistant for Quizo.

User Question:
${message}
`;

const result = await model.generateContent(prompt);

        const response = result.response.text();

        res.json({
            success: true,
            reply: response
        });

    } catch (err) {

        console.log(err);

        res.json({
            success: false,
            reply: "Something went wrong."
        });

    }

};