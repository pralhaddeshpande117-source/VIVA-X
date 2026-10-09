
import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const apiKey = process.env.GEMINI_API_KEY;

export async function POST(request: Request) {
  try {
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key is not configured." },
        { status: 500 }
      );
    }

    const body = await request.json();

    const question =
      typeof body.question === "string" ? body.question.trim() : "";
    const answer =
      typeof body.answer === "string" ? body.answer.trim() : "";
    const subject =
      typeof body.subject === "string" ? body.subject.trim() : "";
    const difficulty =
      typeof body.difficulty === "string" ? body.difficulty : "Medium";

    if (
      !question ||
      !answer ||
      !subject ||
      question.length > 3000 ||
      answer.length > 10000 ||
      subject.length > 150 ||
      !["Easy", "Medium", "Hard"].includes(difficulty)
    ) {
      return NextResponse.json(
        { error: "Please provide a valid question, answer, subject, and difficulty." },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
You are VIVA-X, a fair university viva examiner.

Evaluate the student's answer based on the question and subject.

Subject: ${subject}
Difficulty: ${difficulty}
Question: ${question}
Student's answer: ${answer}

Evaluate conceptual correctness, relevance, completeness, and clarity.
Accept valid alternative explanations. Do not reward irrelevant length.
Be constructive and use simple English.

Return only valid JSON in this exact format:
{
  "score": 0,
  "maxScore": 10,
  "verdict": "Correct, Partially Correct, or Incorrect",
  "strengths": ["..."],
  "missingConcepts": ["..."],
  "feedback": "...",
  "improvedAnswer": "..."
}

Rules:
- score must be an integer from 0 to 10.
- strengths and missingConcepts must be arrays of strings.
- If the answer is blank or irrelevant, assign a suitably low score.
- Never claim the answer is perfect if important concepts are missing.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    if (!response.text) {
      throw new Error("Gemini returned an empty response.");
    }

    const result = JSON.parse(response.text);

    if (
      !Number.isInteger(result.score) ||
      result.score < 0 ||
      result.score > 10 ||
      result.maxScore !== 10 ||
      !["Correct", "Partially Correct", "Incorrect"].includes(result.verdict) ||
      !Array.isArray(result.strengths) ||
      !result.strengths.every((item: unknown) => typeof item === "string") ||
      !Array.isArray(result.missingConcepts) ||
      !result.missingConcepts.every((item: unknown) => typeof item === "string") ||
      typeof result.feedback !== "string" ||
      typeof result.improvedAnswer !== "string"
    ) {
      throw new Error("Gemini returned an invalid evaluation.");
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Answer evaluation failed:", error);

    return NextResponse.json(
      { error: "Unable to evaluate the answer. Please try again." },
      { status: 500 }
    );
  }
}