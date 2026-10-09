
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

export default function VivaPage() {
  const router = useRouter();

  const [settings, setSettings] = useState<VivaSettings | null>(null);
  const [answer, setAnswer] = useState("");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem("vivaSetup");

    if (!saved) {
      router.replace("/setup");
      return;
    }

    try {
      const parsed = JSON.parse(saved) as VivaSettings;
      setSettings(parsed);
      setReady(true);
    } catch {
      sessionStorage.removeItem("vivaSetup");
      router.replace("/setup");
    }
  }, [router]);

  if (!ready || !settings) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        Preparing your viva...
      </main>
    );
  }

  const questions = [
    `What is ${settings.subject}, and why is it important?`,
    `Explain a key concept in ${settings.subject} with an example.`,
    `What are the main applications of ${settings.subject}?`,
  ];

  const question = questions[questionIndex % questions.length];
  const totalQuestions = settings.questionCount;

  function handleNext() {
    if (!answer.trim()) return;

    const updatedAnswers = [...answers, answer.trim()];
    setAnswers(updatedAnswers);
    setAnswer("");

    if (questionIndex + 1 >= totalQuestions) {
      sessionStorage.setItem(
        "vivaAnswers",
        JSON.stringify({
          settings,
          answers: updatedAnswers,
        })
      );
      router.push("/result");
      return;
    }

    setQuestionIndex((current) => current + 1);
  }

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
              width: `${((questionIndex + 1) / totalQuestions) * 100}%`,
            }}
          />
        </div>

        <p className="mt-3 text-sm text-slate-400">
          Question {questionIndex + 1} of {totalQuestions}
        </p>

        <section className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
          <p className="text-sm font-medium text-indigo-400">
            Question {questionIndex + 1}
          </p>

          <h2 className="mt-4 text-xl font-semibold leading-relaxed">
            {question}
          </h2>

          {settings.topics.length > 0 && (
            <p className="mt-3 text-sm text-slate-400">
              Topics selected: {settings.topics.join(", ")}
            </p>
          )}

          <label
            htmlFor="answer"
            className="mt-8 mb-2 block text-sm font-medium"
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
            {questionIndex + 1 >= totalQuestions
              ? "Finish Viva"
              : "Submit & Next"}
          </button>
        </section>
      </div>
    </main>
  );
}