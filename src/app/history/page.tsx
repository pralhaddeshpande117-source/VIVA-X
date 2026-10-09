
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

type VivaSettings = {
  subject: string;
  topics: string[];
  difficulty: string;
  questionCount: number;
  mode: string;
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

type VivaSession = {
  id: string;
  completedAt: string;
  settings: VivaSettings;
  questions: string[];
  answers: string[];
  evaluations: (Evaluation | null)[];
};

export default function HistoryPage() {
  const router = useRouter();

  const [sessions, setSessions] = useState<VivaSession[]>([]);
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

        if (saved) {
          const parsed: unknown = JSON.parse(saved);

          if (Array.isArray(parsed)) {
            setSessions(parsed as VivaSession[]);
          } else {
            setError("Your saved session history has an invalid format.");
          }
        } else {
          setSessions([]);
        }
      } catch {
        setError("Unable to load your session history.");
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [router]);

  function formatDate(dateString: string) {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return "Date unavailable";
    }

    return date.toLocaleString();
  }

  function getScore(session: VivaSession) {
    const validEvaluations = (session.evaluations ?? []).filter(
      (evaluation): evaluation is Evaluation =>
        evaluation !== null &&
        typeof evaluation.score === "number" &&
        typeof evaluation.maxScore === "number"
    );

    const score = validEvaluations.reduce(
      (sum, evaluation) => sum + evaluation.score,
      0
    );

    const maxScore = validEvaluations.reduce(
      (sum, evaluation) => sum + evaluation.maxScore,
      0
    );

    if (maxScore === 0) {
      return "Not evaluated";
    }

    return `${score} / ${maxScore} (${Math.round(
      (score / maxScore) * 100
    )}%)`;
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <button
          onClick={() => router.push("/dashboard")}
          className="mb-6 rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
        >
          ← Back to Dashboard
        </button>

        <p className="text-sm font-semibold tracking-widest text-indigo-400">
          VIVA-X
        </p>

        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
          Session History
        </h1>

        <p className="mt-3 text-slate-400">
          Review your previous viva practice sessions and AI-generated results.
        </p>

        {loading ? (
          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-8 text-slate-300">
            Loading your session history...
          </div>
        ) : error ? (
          <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-300">
            {error}
          </div>
        ) : sessions.length === 0 ? (
          <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10">
              <span className="text-3xl">📚</span>
            </div>

            <h2 className="mt-5 text-xl font-semibold">
              No sessions yet
            </h2>

            <p className="mt-2 text-slate-400">
              Complete your first AI viva, and your session will appear here.
            </p>

            <button
              onClick={() => router.push("/setup")}
              className="mt-6 rounded-lg bg-indigo-600 px-5 py-3 font-semibold hover:bg-indigo-500"
            >
              Start a Viva
            </button>
          </section>
        ) : (
          <section className="mt-8 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">
                Your Previous Sessions
              </h2>

              <p className="text-sm text-slate-400">
                {sessions.length}{" "}
                {sessions.length === 1 ? "session" : "sessions"}
              </p>
            </div>

            {sessions.map((session) => (
              <article
                key={session.id}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-indigo-500/50 sm:p-6"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {session.settings?.subject || "Untitled Subject"}
                    </h3>

                    <p className="mt-1 text-sm text-slate-400">
                      {formatDate(session.completedAt)}
                    </p>
                  </div>

                  <span className="w-fit rounded-full bg-indigo-500/10 px-3 py-1 text-sm font-medium text-indigo-300">
                    {session.settings?.difficulty || "Difficulty unavailable"}
                  </span>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-slate-950 p-4">
                    <p className="text-sm text-slate-400">Score</p>
                    <p className="mt-1 font-semibold">
                      {getScore(session)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-950 p-4">
                    <p className="text-sm text-slate-400">Questions</p>
                    <p className="mt-1 font-semibold">
                      {Array.isArray(session.questions)
                        ? session.questions.length
                        : 0}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-950 p-4">
                    <p className="text-sm text-slate-400">Mode</p>
                    <p className="mt-1 font-semibold">
                      {session.settings?.mode || "Not specified"}
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <button
                    onClick={() =>
                      router.push(
                        `/history/${encodeURIComponent(session.id)}`
                      )
                    }
                    className="rounded-lg bg-indigo-600 px-5 py-3 font-semibold hover:bg-indigo-500"
                  >
                    View Session Details →
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}