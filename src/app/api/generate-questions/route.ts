
import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const apiKey = process.env.GEMINI_API_KEY;

export async function POST(request: Request) {
  try {
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key is not configured on the server." },
        { status: 500 }
      );
    }

    const body = await request.json();

    const subject =
      typeof body.subject === "string" ? body.subject.trim() : "";
    const topics = Array.isArray(body.topics)
      ? body.topics.filter(
          (topic: unknown) =>
            typeof topic === "string" && topic.trim().length > 0
        )
      : [];
    const difficulty =
      typeof body.difficulty === "string" ? body.difficulty : "Medium";
    const questionCount = Number(body.questionCount);

    if (
      !subject ||
      subject.length > 150 ||
      topics.length > 20 ||
      !["Easy", "Medium", "Hard"].includes(difficulty) ||
      !Number.isInteger(questionCount) ||
      questionCount < 1 ||
      questionCount > 20
    ) {
      return NextResponse.json(
        { error: "Please provide valid viva settings." },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
You are VIVA-X, an experienced university viva examiner.

Generate exactly ${questionCount} distinct oral viva questions.

Subject: ${subject}
Topics: ${topics.length ? topics.join(", ") : "Choose important syllabus topics"}
Difficulty: ${difficulty}

Requirements:
- Keep every question relevant to the subject and selected topics.
- Use clear, student-friendly English.
- Questions must test understanding, not just memorization.
- Match the requested difficulty.
- Include a mix of conceptual, explanatory, and application-based questions where appropriate.
- Do not include answers or explanations.
- Return only valid JSON in this exact format:
{"questions":["Question 1","Question 2"]}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text;

    if (!text) {
      throw new Error("Gemini returned an empty response.");
    }

    const parsed = JSON.parse(text);

    if (
      !Array.isArray(parsed.questions) ||
      parsed.questions.length !== questionCount ||
      !parsed.questions.every(
        (question: unknown) =>
          typeof question === "string" && question.trim().length > 0
      )
    ) {
      throw new Error("Gemini returned an invalid question list.");
    }

    return NextResponse.json({
      questions: parsed.questions.map((question: string) =>
        question.trim()
      ),
    });
  } catch (error) {
    console.error("Question generation failed:", error);

    return NextResponse.json(
      { error: "Unable to generate questions. Please try again." },
      { status: 500 }
    );
  }
}