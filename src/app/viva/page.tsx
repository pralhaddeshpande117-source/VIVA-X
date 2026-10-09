
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type VivaSettings = {
  subject: string;
  topics: string[];
  difficulty: string;
  questionCount: number;
  mode: string;
};

type VivaAnswerData = {
  settings: VivaSettings;
  questions: string[];
  answers: string[];
};

export default function VivaPage() {
  const router = useRouter();

  const [settings, setSettings] = useState<VivaSettings | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [answer, setAnswer] = useState("");
  const [answers, setAnswers] = useState<string[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadQuestions() {
      const saved = sessionStorage.getItem("vivaSetup");

      if (!saved) {
        router.replace("/setup");
        return;
      }

      let parsed: VivaSettings;

      try {
        parsed = JSON.parse(saved) as VivaSettings;
      } catch {
        router.replace("/setup");
        return;
      }

      setSettings(parsed);

      try {
        const response = await fetch("/api/generate-questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subject: parsed.subject,
            topics: parsed.topics,
            difficulty: parsed.difficulty,
            questionCount: parsed.questionCount,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Could not generate questions.");
        }

        if (
          !Array.isArray(data.questions) ||
          data.questions.some((q: unknown) => typeof q !== "string")
        ) {
          throw new Error("The API returned an invalid question list.");
        }

        if (!cancelled) {
          setQuestions(data.questions);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load questions. Please try again."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadQuestions();

    return () => {
      cancelled = true;
    };
  }, [router]);

  function handleNext() {
    if (!answer.trim() || !settings) return;

    const updatedAnswers = [...answers, answer.trim()];

    if (questionIndex + 1 >= questions.length) {
      const result: VivaAnswerData = {
        settings,
        questions,
        answers: updatedAnswers,
      };

      sessionStorage.setItem("vivaAnswers", JSON.stringify(result));
      router.push("/result");
      return;
    }

    setAnswers(updatedAnswers);
    setAnswer("");
    setQuestionIndex((current) => current + 1);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-center text-white">
        <div>
          <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-indigo-500" />
          <h1 className="text-xl font-bold">Generating your viva questions...</h1>
          <p className="mt-2 text-slate-400">
            Gemini is preparing questions based on your settings.
          </p>
        </div>
      </main>
    );
  }

  if (error || !settings || questions.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h1 className="text-2xl font-bold">Unable to start your viva</h1>
          <p className="mt-3 text-slate-400">
            {error || "No questions were generated. Please try again."}
          </p>
          <button
            onClick={() => router.push("/setup")}
            className="mt-6 rounded-lg bg-indigo-600 px-5 py-3 font-semibold hover:bg-indigo-500"
          >
            Back to Setup
          </button>
        </div>
      </main>
    );
  }

  const question = questions[questionIndex];

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold tracking-widest text-indigo-400">
              VIVA-X
            </p>
            <h1 className="mt-2 text-2xl font-bold">
              {settings.subject} Viva
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              {settings.difficulty} · {settings.mode}
            </p>
          </div>

          <button
            onClick={() => router.push("/dashboard")}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
          >
            Exit Viva
          </button>
        </header>

        <div className="mt-8 h-2 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all"
            style={{
              width: `${((questionIndex + 1) / questions.length) * 100}%`,
            }}
          />
        </div>

        <p className="mt-3 text-sm text-slate-400">
          Question {questionIndex + 1} of {questions.length}
        </p>

        <section className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
          <p className="text-sm font-medium text-indigo-400">
            AI-generated question
          </p>

          <h2 className="mt-4 text-xl font-semibold leading-relaxed">
            {question}
          </h2>

          <label
            htmlFor="answer"
            className="mb-2 mt-8 block text-sm font-medium"
          >
            Your answer
          </label>

          <textarea
            id="answer"
            rows={7}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Write your answer here..."
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-indigo-500"
          />

          <button
            onClick={handleNext}
            disabled={!answer.trim()}
            className="mt-5 w-full rounded-lg bg-indigo-600 px-5 py-3 font-semibold hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {questionIndex + 1 >= questions.length
              ? "Finish Viva"
              : "Submit & Next"}
          </button>
        </section>
      </div>
    </main>
  );
}