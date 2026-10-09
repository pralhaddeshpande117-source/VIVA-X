
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
  questions?: string[];
  answers: string[];
};

type Evaluation = {
  score: number;
  maxScore: number;
  verdict: string;
  strengths: string[];
  missingConcepts: string[];
  feedback: string;
  improvedAnswer: string;
};

type EvaluationState = {
  evaluation?: Evaluation;
  error?: string;
};

export default function ResultPage() {
  const router = useRouter();

  const [result, setResult] = useState<VivaResultData | null>(null);
  const [evaluations, setEvaluations] = useState<EvaluationState[]>([]);
  const [ready, setReady] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadResults() {
      const saved = sessionStorage.getItem("vivaAnswers");

      if (!saved) {
        router.replace("/setup");
        return;
      }

      let data: VivaResultData;

      try {
        data = JSON.parse(saved) as VivaResultData;

        if (
          !data.settings ||
          !Array.isArray(data.answers) ||
          !data.settings.subject
        ) {
          throw new Error("Invalid saved viva data.");
        }
      } catch {
        sessionStorage.removeItem("vivaAnswers");
        router.replace("/setup");
        return;
      }

      if (cancelled) return;

      setResult(data);
      setReady(true);

      const questions = data.questions;

      if (
        !Array.isArray(questions) ||
        questions.length !== data.answers.length ||
        questions.some((q) => typeof q !== "string" || !q.trim())
      ) {
        setError(
          "The questions for this session are missing. Please start a new viva to receive AI evaluation."
        );
        return;
      }

      setEvaluating(true);

      const results = await Promise.all(
        questions.map(async (question, index): Promise<EvaluationState> => {
          try {
            const response = await fetch("/api/evaluate-answer", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                subject: data.settings.subject,
                difficulty: data.settings.difficulty,
                question,
                answer: data.answers[index],
              }),
            });

            const evaluationData = await response.json();

            if (!response.ok) {
              throw new Error(
                evaluationData.error || "Evaluation failed."
              );
            }

            return { evaluation: evaluationData as Evaluation };
          } catch (err) {
            return {
              error:
                err instanceof Error
                  ? err.message
                  : "Unable to evaluate this answer.",
            };
          }
        })
      );

      if (!cancelled) {
        setEvaluations(results);
        setEvaluating(false);
      }
    }

    loadResults();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!ready || !result) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        Loading your results...
      </main>
    );
  }

  const totalScore = evaluations.reduce(
    (sum, item) => sum + (item.evaluation?.score ?? 0),
    0
  );

  const evaluatedCount = evaluations.filter(
    (item) => item.evaluation
  ).length;

  const maxScore = evaluatedCount * 10;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold tracking-widest text-indigo-400">
          VIVA-X
        </p>

        <h1 className="mt-3 text-3xl font-bold">Viva Completed!</h1>

        <p className="mt-2 text-slate-400">
          Your {result.settings.subject} practice session results.
        </p>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">Session Summary</h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-950 p-4">
              <p className="text-sm text-slate-400">Subject</p>
              <p className="mt-1 font-semibold">
                {result.settings.subject}
              </p>
            </div>

            <div className="rounded-xl bg-slate-950 p-4">
              <p className="text-sm text-slate-400">Difficulty</p>
              <p className="mt-1 font-semibold">
                {result.settings.difficulty}
              </p>
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

          {evaluating && (
            <div className="mt-5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-4">
              <p className="font-semibold text-indigo-300">
                AI is evaluating your answers...
              </p>
              <p className="mt-1 text-sm text-slate-300">
                Please wait while Gemini reviews your responses.
              </p>
            </div>
          )}

          {error && (
            <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
              {error}
            </div>
          )}

          {evaluatedCount > 0 && (
            <div className="mt-5 rounded-xl border border-slate-700 bg-slate-950 p-5">
              <p className="text-sm text-slate-400">
                Total score from evaluated answers
              </p>
              <p className="mt-2 text-3xl font-bold text-indigo-300">
                {totalScore} / {maxScore}
              </p>
              <p className="mt-2 text-sm text-slate-400">
                {evaluatedCount} of {result.answers.length} answers evaluated.
                Failed evaluations are excluded from this total.
              </p>
            </div>
          )}
        </section>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">
            AI Answer Evaluation
          </h2>

          <div className="mt-5 space-y-5">
            {result.answers.map((answer, index) => {
              const evaluation = evaluations[index]?.evaluation;
              const evaluationError = evaluations[index]?.error;
              const question = result.questions?.[index];

              return (
                <article
                  key={index}
                  className="rounded-xl border border-slate-800 bg-slate-950 p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="font-semibold">
                      Question {index + 1}
                    </h3>

                    {evaluation && (
                      <span className="rounded-full bg-indigo-500/15 px-3 py-1 text-sm font-semibold text-indigo-300">
                        {evaluation.score}/{evaluation.maxScore}
                      </span>
                    )}
                  </div>

                  {question && (
                    <p className="mt-3 leading-relaxed text-white">
                      {question}
                    </p>
                  )}

                  <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Your answer
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-slate-300">
                    {answer}
                  </p>

                  {evaluating && !evaluation && !evaluationError && (
                    <p className="mt-4 text-sm text-indigo-300">
                      Evaluating this answer...
                    </p>
                  )}

                  {evaluationError && (
                    <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                      {evaluationError}
                    </p>
                  )}

                  {evaluation && (
                    <div className="mt-5 space-y-4 border-t border-slate-800 pt-5">
                      <div>
                        <p className="text-sm text-slate-400">Verdict</p>
                        <p className="mt-1 font-semibold">
                          {evaluation.verdict}
                        </p>
                      </div>

                      <div>
                        <p className="font-semibold text-emerald-300">
                          What you did well
                        </p>
                        {evaluation.strengths.length > 0 ? (
                          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
                            {evaluation.strengths.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-2 text-sm text-slate-400">
                            No specific strengths were identified.
                          </p>
                        )}
                      </div>

                      <div>
                        <p className="font-semibold text-amber-300">
                          Concepts to improve
                        </p>
                        {evaluation.missingConcepts.length > 0 ? (
                          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
                            {evaluation.missingConcepts.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-2 text-sm text-slate-400">
                            No major missing concepts identified.
                          </p>
                        )}
                      </div>

                      <div>
                        <p className="font-semibold">Examiner feedback</p>
                        <p className="mt-2 text-sm leading-relaxed text-slate-300">
                          {evaluation.feedback}
                        </p>
                      </div>

                      <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 p-4">
                        <p className="font-semibold text-indigo-300">
                          Suggested improved answer
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
                          {evaluation.improvedAnswer}
                        </p>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
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