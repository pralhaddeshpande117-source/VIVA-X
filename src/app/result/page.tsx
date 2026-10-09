
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

type VivaResultData = {
  settings: VivaSettings;
  answers: string[];
};

export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<VivaResultData | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem("vivaAnswers");

    if (!saved) {
      router.replace("/setup");
      return;
    }

    try {
      setResult(JSON.parse(saved) as VivaResultData);
      setReady(true);
    } catch {
      sessionStorage.removeItem("vivaAnswers");
      router.replace("/setup");
    }
  }, [router]);

  if (!ready || !result) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        Loading your results...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold tracking-widest text-indigo-400">
          VIVA-X
        </p>

        <h1 className="mt-3 text-3xl font-bold">Viva Completed!</h1>

        <p className="mt-2 text-slate-400">
          You've completed your {result.settings.subject} practice session.
        </p>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">Session Summary</h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-950 p-4">
              <p className="text-sm text-slate-400">Subject</p>
              <p className="mt-1 font-semibold">{result.settings.subject}</p>
            </div>

            <div className="rounded-xl bg-slate-950 p-4">
              <p className="text-sm text-slate-400">Difficulty</p>
              <p className="mt-1 font-semibold">{result.settings.difficulty}</p>
            </div>

            <div className="rounded-xl bg-slate-950 p-4">
              <p className="text-sm text-slate-400">Answers submitted</p>
              <p className="mt-1 font-semibold">{result.answers.length}</p>
            </div>

            <div className="rounded-xl bg-slate-950 p-4">
              <p className="text-sm text-slate-400">Mode</p>
              <p className="mt-1 font-semibold">{result.settings.mode}</p>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">Your Submitted Answers</h2>

          <p className="mt-2 text-sm text-slate-400">
            These are your saved responses. AI evaluation has not been
            connected yet, so no score is assigned.
          </p>

          <div className="mt-5 space-y-4">
            {result.answers.map((answer, index) => (
              <div
                key={index}
                className="rounded-xl border border-slate-800 bg-slate-950 p-4"
              >
                <h3 className="font-medium">Answer {index + 1}</h3>
                <p className="mt-2 whitespace-pre-wrap text-slate-300">
                  {answer}
                </p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={() => router.push("/setup")}
            className="rounded-lg bg-indigo-600 px-5 py-3 font-semibold hover:bg-indigo-500"
          >
            Practise Again
          </button>

          <button
            onClick={() => router.push("/dashboard")}
            className="rounded-lg border border-slate-700 px-5 py-3 font-semibold hover:bg-slate-800"
          >
            Dashboard
          </button>
        </div>
      </div>
    </main>
  );
}