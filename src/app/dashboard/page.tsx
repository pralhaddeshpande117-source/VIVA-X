
"use client";

import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signOut,
  type User,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";

type Evaluation = {
  score: number;
  maxScore: number;
  strengths: string[];
  missingConcepts: string[];
  feedback: string;
  improvedAnswer: string;
  verdict: string;
};

type VivaSession = {
  id: string;
  completedAt: string;
  settings: {
    subject: string;
    difficulty: string;
    mode: string;
  };
  questions: string[];
  answers: string[];
  evaluations: (Evaluation | null)[];
};

function readHistory(uid: string): VivaSession[] {
  try {
    const saved = localStorage.getItem(`vivaHistory_${uid}`);
    if (!saved) return [];

    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item): item is VivaSession =>
        !!item &&
        typeof item.id === "string" &&
        typeof item.completedAt === "string" &&
        typeof item.settings?.subject === "string" &&
        Array.isArray(item.evaluations)
    );
  } catch {
    return [];
  }
}

function getSessionPercentage(session: VivaSession) {
  const valid = session.evaluations.filter(
    (item): item is Evaluation =>
      !!item &&
      Number.isFinite(item.score) &&
      Number.isFinite(item.maxScore) &&
      item.maxScore > 0
  );

  const earned = valid.reduce((sum, item) => sum + item.score, 0);
  const possible = valid.reduce((sum, item) => sum + item.maxScore, 0);

  return possible > 0
    ? { percentage: (earned / possible) * 100, count: valid.length }
    : null;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<VivaSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.replace("/signup");
        return;
      }

      setUser(currentUser);
      setSessions(readHistory(currentUser.uid));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await signOut(auth);
      router.replace("/signup");
    } catch (error) {
      console.error("Logout failed:", error);
      setLoggingOut(false);
    }
  }

  const evaluatedSessions = sessions
    .map((session) => ({
      session,
      result: getSessionPercentage(session),
    }))
    .filter(
      (item): item is {
        session: VivaSession;
        result: { percentage: number; count: number };
      } => item.result !== null
    );

  const evaluatedAnswers = evaluatedSessions.reduce(
    (sum, item) => sum + item.result.count,
    0
  );

  const totalEarned = evaluatedSessions.reduce(
    (sum, item) =>
      sum +
      item.session.evaluations.reduce(
        (inner, evaluation) =>
          inner +
          (evaluation &&
          Number.isFinite(evaluation.score) &&
          Number.isFinite(evaluation.maxScore) &&
          evaluation.maxScore > 0
            ? evaluation.score
            : 0),
        0
      ),
    0
  );

  const totalPossible = evaluatedSessions.reduce(
    (sum, item) =>
      sum +
      item.session.evaluations.reduce(
        (inner, evaluation) =>
          inner +
          (evaluation &&
          Number.isFinite(evaluation.score) &&
          Number.isFinite(evaluation.maxScore) &&
          evaluation.maxScore > 0
            ? evaluation.maxScore
            : 0),
        0
      ),
    0
  );

  const averageScore =
    totalPossible > 0 ? (totalEarned / totalPossible) * 100 : null;

  const subjectStats = Object.values(
    evaluatedSessions.reduce<
      Record<string, { earned: number; possible: number }>
    >((acc, item) => {
      const subject = item.session.settings.subject;
      if (!acc[subject]) acc[subject] = { earned: 0, possible: 0 };

      item.session.evaluations.forEach((evaluation) => {
        if (
          evaluation &&
          Number.isFinite(evaluation.score) &&
          Number.isFinite(evaluation.maxScore) &&
          evaluation.maxScore > 0
        ) {
          acc[subject].earned += evaluation.score;
          acc[subject].possible += evaluation.maxScore;
        }
      });

      return acc;
    }, {})
  )
    .map((stats, index) => {
      const subject = Object.keys(
        evaluatedSessions.reduce<Record<string, boolean>>((acc, item) => {
          acc[item.session.settings.subject] = true;
          return acc;
        }, {})
      )[index];

      return {
        subject,
        percentage: (stats.earned / stats.possible) * 100,
      };
    })
    .filter((item) => Number.isFinite(item.percentage))
    .sort((a, b) => b.percentage - a.percentage);

  const weakConcepts: Record<string, number> = {};

  evaluatedSessions.forEach(({ session }) => {
    session.evaluations.forEach((evaluation) => {
      evaluation?.missingConcepts?.forEach((concept) => {
        if (typeof concept === "string" && concept.trim()) {
          weakConcepts[concept.trim()] =
            (weakConcepts[concept.trim()] || 0) + 1;
        }
      });
    });
  });

  const improvementTopics = Object.entries(weakConcepts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const recentSessions = [...evaluatedSessions]
    .sort(
      (a, b) =>
        new Date(b.session.completedAt).getTime() -
        new Date(a.session.completedAt).getTime()
    )
    .slice(0, 7)
    .reverse();

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        Loading your dashboard...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-semibold tracking-widest text-indigo-400">
              VIVA-X
            </p>
            <h1 className="mt-2 text-3xl font-bold">
              Performance Dashboard
            </h1>
            <p className="mt-2 text-slate-400">
              Welcome, {user?.displayName || user?.email || "Student"}!
            </p>
          </div>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="rounded-lg border border-slate-700 px-4 py-2 hover:bg-slate-800 disabled:opacity-50"
          >
            {loggingOut ? "Logging out..." : "Log out"}
          </button>
        </header>

        <section className="mt-8 rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/70 to-slate-900 p-6 sm:p-8">
          <p className="text-sm font-semibold text-indigo-300">
            YOUR LEARNING JOURNEY
          </p>
          <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
            Prepare smarter. Improve every attempt.
          </h2>
          <p className="mt-3 max-w-2xl text-slate-400">
            Review your scores, track subjects, and discover concepts that
            deserve more practice.
          </p>
          <button
            onClick={() => router.push("/setup")}
            className="mt-6 rounded-lg bg-indigo-600 px-5 py-3 font-semibold hover:bg-indigo-500"
          >
            + Start a New Viva
          </button>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Vivas completed"
            value={String(sessions.length)}
            detail="Saved practice sessions"
          />
          <StatCard
            label="Average score"
            value={
              averageScore === null
                ? "—"
                : `${averageScore.toFixed(1)}%`
            }
            detail="Across evaluated answers"
          />
          <StatCard
            label="Questions evaluated"
            value={String(evaluatedAnswers)}
            detail="Successfully evaluated answers"
          />
          <StatCard
            label="Subjects practised"
            value={String(
              new Set(sessions.map((item) => item.settings.subject)).size
            )}
            detail="Distinct subjects in history"
          />
        </section>

        {sessions.length === 0 ? (
          <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/15 text-2xl text-indigo-300">
              <span>↗</span>
            </div>
            <h2 className="mt-5 text-xl font-bold">
              Your progress starts here
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-slate-400">
              Complete a viva and save its AI evaluations to see your scores,
              subject performance, and concepts to improve here.
            </p>
            <p className="mt-3 text-sm text-slate-500">
              Previous results won't appear until session history is connected.
            </p>
          </section>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-xl font-semibold">Score trend</h2>
              <p className="mt-2 text-sm text-slate-400">
                Your seven most recent sessions with evaluated answers.
              </p>

              {recentSessions.length === 0 ? (
                <p className="mt-6 text-slate-400">
                  No completed evaluations available yet.
                </p>
              ) : (
                <div className="mt-6 flex h-48 items-end gap-3">
                  {recentSessions.map(({ session, result }, index) => (
                    <div
                      key={session.id}
                      className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
                    >
                      <span className="text-xs text-slate-300">
                        {result.percentage.toFixed(0)}%
                      </span>
                      <div className="flex h-32 w-full items-end overflow-hidden rounded-t-md bg-slate-800">
                        <div
                          className="w-full rounded-t-md bg-indigo-500"
                          style={{
                            height: `${Math.max(3, result.percentage)}%`,
                          }}
                          title={`${result.percentage.toFixed(1)}%`}
                        />
                      </div>
                      <span className="text-xs text-slate-500">
                        {index + 1}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-xl font-semibold">Subject performance</h2>
              <p className="mt-2 text-sm text-slate-400">
                Your average scores by subject.
              </p>

              {subjectStats.length === 0 ? (
                <p className="mt-6 text-slate-400">
                  Subject statistics will appear after evaluations are saved.
                </p>
              ) : (
                <div className="mt-6 space-y-5">
                  {subjectStats.map((item) => (
                    <div key={item.subject}>
                      <div className="mb-2 flex justify-between gap-3 text-sm">
                        <span className="truncate text-slate-200">
                          {item.subject}
                        </span>
                        <span className="font-semibold text-indigo-300">
                          {item.percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full bg-indigo-500"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(0, item.percentage)
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-xl font-semibold">Concepts to improve</h2>
              <p className="mt-2 text-sm text-slate-400">
                Topics repeatedly identified as missing in your answers.
              </p>

              {improvementTopics.length === 0 ? (
                <p className="mt-6 text-slate-400">
                  No improvement topics have been recorded yet.
                </p>
              ) : (
                <ul className="mt-5 space-y-3">
                  {improvementTopics.map(([concept, count]) => (
                    <li
                      key={concept}
                      className="flex items-start justify-between gap-4 rounded-lg border border-slate-800 bg-slate-950 p-3"
                    >
                      <span className="text-sm text-slate-200">{concept}</span>
                      <span className="shrink-0 text-xs text-amber-300">
                        {count} {count === 1 ? "mention" : "mentions"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-xl font-semibold">Recent sessions</h2>
              <p className="mt-2 text-sm text-slate-400">
                Your latest saved viva attempts.
              </p>

              <div className="mt-5 space-y-3">
                {[...sessions]
                  .sort(
                    (a, b) =>
                      new Date(b.completedAt).getTime() -
                      new Date(a.completedAt).getTime()
                  )
                  .slice(0, 5)
                  .map((session) => {
                    const stats = getSessionPercentage(session);

                    return (
                      <div
                        key={session.id}
                        className="flex items-center justify-between gap-4 rounded-lg border border-slate-800 bg-slate-950 p-4"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-semibold">
                            {session.settings.subject}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {new Date(session.completedAt).toLocaleDateString()}{" "}
                            · {session.settings.difficulty}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="font-semibold text-indigo-300">
                            {stats
                              ? `${stats.percentage.toFixed(1)}%`
                              : "Pending"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {stats
                              ? `${stats.count} evaluated`
                              : "No scores"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </section>
          </div>
        )}

        <footer className="mt-10 border-t border-slate-800 py-6 text-center text-sm text-slate-500">
          VIVA-X · Practise. Learn. Improve.
        </footer>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-bold">{value}</p>
      <p className="mt-2 text-xs text-slate-500">{detail}</p>
    </div>
  );
}