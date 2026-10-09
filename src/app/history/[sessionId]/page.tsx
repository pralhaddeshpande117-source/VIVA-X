
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

type Evaluation = {
  score: number;
  maxScore: number;
  verdict: string;
  strengths: string[];
  missingConcepts: string[];
  feedback: string;
  improvedAnswer: string;
};

type VivaSession = {
  id: string;
  completedAt: string;
  settings: {
    subject: string;
    topics: string[];
    difficulty: string;
    questionCount: number;
    mode: string;
  };
  questions: string[];
  answers: string[];
  evaluations: (Evaluation | null)[];
};

export default function SessionDetailsPage() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();

  const [session, setSession] = useState<VivaSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }

      try {
        const saved = localStorage.getItem(`vivaHistory_${user.uid}`);
        const history: VivaSession[] = saved ? JSON.parse(saved) : [];

        const found = history.find(
          (item) => item.id === params.sessionId
        );

        if (found) {
          setSession(found);
        } else {
          setError("This session could not be found in your saved history.");
        }
      } catch {
        setError("Unable to load this session. Please try again.");
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [params.sessionId, router]);

  function formatDate(dateString: string) {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return "Date unavailable";
    }

    return date.toLocaleString();
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        Loading session details...
      </main>
    );
  }

  if (error || !session) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h1 className="text-2xl font-bold">Session unavailable</h1>
          <p className="mt-3 text-slate-400">
            {error || "The requested session does not exist."}
          </p>
          <button
            onClick={() => router.push("/history")}
            className="mt-6 rounded-lg bg-indigo-600 px-5 py-3 font-semibold hover:bg-indigo-500"
          >
            Back to Session History
          </button>
        </div>
      </main>
    );
  }

  const evaluations = session.evaluations ?? [];
  const validEvaluations = evaluations.filter(
    (item): item is Evaluation =>
      item !== null &&
      typeof item.score === "number" &&
      typeof item.maxScore === "number"
  );

  const totalScore = validEvaluations.reduce(
    (sum, item) => sum + item.score,
    0
  );

  const maxScore = validEvaluations.reduce(
    (sum, item) => sum + item.maxScore,
    0
  );

  const percentage =
    maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : null;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-4xl">
        <button
          onClick={() => router.push("/history")}
          className="mb-6 rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
        >
          ← Back to Session History
        </button>

        <p className="text-sm font-semibold tracking-widest text-indigo-400">
          VIVA-X
        </p>

        <h1 className="mt-3 text-3xl font-bold">
          Session Details
        </h1>

        <p className="mt-2 text-slate-400">
          {formatDate(session.completedAt)}
        </p>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">Session Summary</h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-slate-950 p-4">
              <p className="text-sm text-slate-400">Subject</p>
              <p className="mt-1 font-semibold">
                {session.settings.subject}
              </p>
            </div>

            <div className="rounded-xl bg-slate-950 p-4">
              <p className="text-sm text-slate-400">Difficulty</p>
              <p className="mt-1 font-semibold">
                {session.settings.difficulty}
              </p>
            </div>

            <div className="rounded-xl bg-slate-950 p-4">
              <p className="text-sm text-slate-400">Mode</p>
              <p className="mt-1 font-semibold">
                {session.settings.mode}
              </p>
            </div>

            <div className="rounded-xl bg-slate-950 p-4">
              <p className="text-sm text-slate-400">Score</p>
              <p className="mt-1 font-semibold text-indigo-300">
                {percentage === null
                  ? "Not available"
                  : `${totalScore}/${maxScore} (${percentage}%)`}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">
            Questions and AI Feedback
          </h2>

          <div className="mt-5 space-y-5">
            {session.questions.map((question, index) => {
              const answer = session.answers[index] ?? "";
              const evaluation = evaluations[index];

              return (
                <article
                  key={`${session.id}-${index}`}
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

                  <p className="mt-3 leading-relaxed">{question}</p>

                  <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Your Answer
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-slate-300">
                    {answer.trim() || "No answer was recorded."}
                  </p>

                  {evaluation ? (
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
                        {evaluation.strengths?.length ? (
                          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
                            {evaluation.strengths.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-2 text-sm text-slate-400">
                            No specific strengths recorded.
                          </p>
                        )}
                      </div>

                      <div>
                        <p className="font-semibold text-amber-300">
                          Concepts to Improve
                        </p>
                        {evaluation.missingConcepts?.length ? (
                          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
                            {evaluation.missingConcepts.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-2 text-sm text-slate-400">
                            No missing concepts recorded.
                          </p>
                        )}
                      </div>

                      <div>
                        <p className="font-semibold">Examiner Feedback</p>
                        <p className="mt-2 text-sm leading-relaxed text-slate-300">
                          {evaluation.feedback}
                        </p>
                      </div>

                      <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 p-4">
                        <p className="font-semibold text-indigo-300">
                          Suggested Improved Answer
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
                          {evaluation.improvedAnswer}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-4 rounded-lg bg-slate-900 p-3 text-sm text-slate-400">
                      AI evaluation is unavailable for this answer.
                    </p>
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