
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";

type Evaluation = {
  score?: number;
  verdict?: string;
  strengths?: string[] | string;
  missingConcepts?: string[] | string;
  feedback?: string;
  improvedAnswer?: string;
};

type VivaSession = {
  id: string;
  completedAt: string;
  settings?: {
    subject?: string;
    difficulty?: string;
    mode?: string;
  };
  questions?: unknown[];
  answers?: unknown[];
  evaluations?: (Evaluation | null)[];
};

function getScore(evaluation: Evaluation | null | undefined): number | null {
  if (!evaluation || typeof evaluation.score !== "number") return null;
  return Math.max(0, Math.min(100, evaluation.score));
}

function getSessionScore(session: VivaSession): number | null {
  const scores = (session.evaluations ?? [])
    .map(getScore)
    .filter((score): score is number => score !== null);

  if (scores.length === 0) return null;

  return Math.round(scores.reduce((total, score) => total + score, 0) / scores.length);
}

function getQuestionCount(session: VivaSession): number {
  return Math.max(
    session.questions?.length ?? 0,
    session.answers?.length ?? 0,
    session.evaluations?.length ?? 0
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;

  return Math.round(
    values.reduce((total, value) => total + value, 0) / values.length
  );
}

function ScoreTrendChart({ sessions }: { sessions: VivaSession[] }) {
  const points = sessions
    .filter((session) => getSessionScore(session) !== null)
    .slice(0, 7)
    .reverse();

  if (points.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-slate-500">
        Complete a viva to see your score trend.
      </div>
    );
  }

  const width = 600;
  const height = 190;
  const padding = 28;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const coordinates = points.map((session, index) => {
    const score = getSessionScore(session) ?? 0;

    return {
      x:
        points.length === 1
          ? width / 2
          : padding + (index / (points.length - 1)) * chartWidth,
      y: padding + ((100 - score) / 100) * chartHeight,
      score,
      label: formatDate(session.completedAt),
    };
  });

  const line = coordinates
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-52 w-full overflow-visible"
        role="img"
        aria-label="Viva score trend chart"
      >
        {[0, 25, 50, 75, 100].map((score) => {
          const y = padding + ((100 - score) / 100) * chartHeight;

          return (
            <g key={score}>
              <line
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="#334155"
                strokeDasharray="4 5"
              />
              <text x="0" y={y + 4} fill="#94a3b8" fontSize="11">
                {score}
              </text>
            </g>
          );
        })}

        <path
          d={line}
          fill="none"
          stroke="#818cf8"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {coordinates.map((point, index) => (
          <g key={`${point.label}-${index}`}>
            <circle
              cx={point.x}
              cy={point.y}
              r="5"
              fill="#818cf8"
              stroke="#0f172a"
              strokeWidth="2"
            />
            <text
              x={point.x}
              y={Math.max(14, point.y - 12)}
              textAnchor="middle"
              fill="#e2e8f0"
              fontSize="12"
              fontWeight="600"
            >
              {point.score}
            </text>
          </g>
        ))}
      </svg>

      <div className="mt-1 flex justify-between gap-2 text-xs text-slate-500">
        <span>{coordinates[0]?.label}</span>
        <span>{coordinates[coordinates.length - 1]?.label}</span>
      </div>
    </div>
  );
}

function SubjectPerformanceChart({ sessions }: { sessions: VivaSession[] }) {
  const subjects = useMemo(() => {
    const grouped: Record<string, number[]> = {};

    sessions.forEach((session) => {
      const subject = session.settings?.subject?.trim() || "General";
      const score = getSessionScore(session);

      if (score === null) return;

      if (!grouped[subject]) grouped[subject] = [];
      grouped[subject].push(score);
    });

    return Object.entries(grouped)
      .map(([subject, scores]) => ({
        subject,
        score: average(scores) ?? 0,
        count: scores.length,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [sessions]);

  if (subjects.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-slate-500">
        Subject performance will appear here after your first evaluated viva.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {subjects.map((item) => (
        <div key={item.subject}>
          <div className="mb-2 flex items-center justify-between gap-3 text-sm">
            <span className="truncate text-slate-300">{item.subject}</span>
            <span className="shrink-0 font-semibold text-white">
              {item.score}%
            </span>
          </div>

          <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all"
              style={{ width: `${item.score}%` }}
            />
          </div>

          <p className="mt-1 text-xs text-slate-500">
            {item.count} evaluated {item.count === 1 ? "session" : "sessions"}
          </p>
        </div>
      ))}
    </div>
  );
}

function ImprovementConcepts({ sessions }: { sessions: VivaSession[] }) {
  const concepts = useMemo(() => {
    const counts: Record<string, number> = {};

    sessions.forEach((session) => {
      (session.evaluations ?? []).forEach((evaluation) => {
        const missing = evaluation?.missingConcepts;
        if (!missing) return;

        const items = Array.isArray(missing) ? missing : [missing];

        items.forEach((item) => {
          const concept = String(item).trim();
          if (concept) {
            counts[concept] = (counts[concept] ?? 0) + 1;
          }
        });
      });
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [sessions]);

  if (concepts.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-500">
        Areas for improvement will appear after your answers are evaluated.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {concepts.map(([concept, count]) => (
        <div
          key={concept}
          className="flex items-start justify-between gap-3"
        >
          <div className="flex items-start gap-3">
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-400" />
            <span className="text-sm leading-5 text-slate-300">{concept}</span>
          </div>

          <span className="shrink-0 rounded-full border border-slate-700 px-2 py-1 text-xs text-slate-400">
            {count}×
          </span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [history, setHistory] = useState<VivaSession[]>([]);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);

      if (!currentUser) {
        router.replace("/login");
        return;
      }

      try {
        const stored = localStorage.getItem(
          `vivaHistory_${currentUser.uid}`
        );

        if (stored) {
          const parsed: unknown = JSON.parse(stored);

          if (Array.isArray(parsed)) {
            const validSessions = parsed.filter(
              (session): session is VivaSession =>
                session !== null &&
                typeof session === "object" &&
                typeof session.id === "string"
            );

            setHistory(
              validSessions.sort(
                (a, b) =>
                  new Date(b.completedAt).getTime() -
                  new Date(a.completedAt).getTime()
              )
            );
          } else {
            setHistory([]);
          }
        } else {
          setHistory([]);
        }
      } catch (error) {
        console.error("Could not read viva history:", error);
        setHistory([]);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    setLoggingOut(true);

    try {
      await signOut(auth);
      router.replace("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      setLoggingOut(false);
    }
  };

  const scoredSessions = history.filter(
    (session) => getSessionScore(session) !== null
  );

  const scores = scoredSessions.map(
    (session) => getSessionScore(session) as number
  );

  const averageScore = average(scores);

  const questionsEvaluated = history.reduce(
    (total, session) =>
      total +
      (session.evaluations ?? []).filter(
        (evaluation) => getScore(evaluation) !== null
      ).length,
    0
  );

  const subjectsPractised = new Set(
    history.map((session) => session.settings?.subject?.trim() || "General")
  ).size;

  const recentSessions = history.slice(0, 5);

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
        <div className="text-center">
          <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-4 border-slate-700 border-t-indigo-500" />
          <p>Loading your dashboard...</p>
        </div>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-950/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <button
            onClick={() => router.push("/")}
            className="text-xl font-bold tracking-tight"
          >
            VIVA<span className="text-indigo-400">-X</span>
          </button>

          <div className="flex items-center gap-3">
            <span className="hidden max-w-48 truncate text-sm text-slate-400 sm:inline">
              {user.email}
            </span>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-500 hover:bg-slate-900 disabled:opacity-50"
            >
              {loggingOut ? "Logging out..." : "Log out"}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <section className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 p-7 sm:p-10">
          <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

          <div className="relative">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-indigo-300">
              Your learning workspace
            </p>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Welcome back{user.displayName ? `, ${user.displayName}` : ""}!
            </h1>

            <p className="mt-4 max-w-2xl leading-7 text-slate-300">
              Practise technical interviews, evaluate your answers with AI,
              and track your progress as you prepare for your next viva.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => router.push("/setup")}
                className="rounded-lg bg-indigo-600 px-5 py-3 font-semibold transition hover:bg-indigo-500"
              >
                + Start a New Viva
              </button>

              <button
                onClick={() => router.push("/history")}
                className="rounded-lg border border-slate-700 px-5 py-3 font-semibold transition hover:border-slate-500 hover:bg-slate-800"
              >
                View Session History →
              </button>
            </div>
          </div>
        </section>

        <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Vivas Completed"
            value={history.length.toString()}
            description="Total practice sessions"
            icon="✦"
          />

          <MetricCard
            title="Average Score"
            value={averageScore === null ? "—" : `${averageScore}%`}
            description={
              averageScore === null
                ? "Complete an evaluated viva"
                : "Across evaluated sessions"
            }
            icon="↗"
          />

          <MetricCard
            title="Questions Evaluated"
            value={questionsEvaluated.toString()}
            description="AI-evaluated answers"
            icon="✓"
          />

          <MetricCard
            title="Subjects Practised"
            value={history.length === 0 ? "0" : subjectsPractised.toString()}
            description="Different subjects"
            icon="▤"
          />
        </section>

        <section className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="mb-5">
              <h2 className="text-lg font-semibold">Score Trend</h2>
              <p className="mt-1 text-sm text-slate-400">
                Your latest evaluated sessions, from oldest to newest.
              </p>
            </div>

            <ScoreTrendChart sessions={history} />
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="mb-5">
              <h2 className="text-lg font-semibold">Subject Performance</h2>
              <p className="mt-1 text-sm text-slate-400">
                Average score by subject.
              </p>
            </div>

            <SubjectPerformanceChart sessions={history} />
          </div>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-lg font-semibold">Areas to Improve</h2>
            <p className="mb-6 mt-1 text-sm text-slate-400">
              Concepts that appeared in your AI feedback.
            </p>

            <ImprovementConcepts sessions={history} />
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Recent Sessions</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Revisit your previous viva evaluations.
                </p>
              </div>

              <button
                onClick={() => router.push("/history")}
                className="shrink-0 text-sm font-medium text-indigo-400 transition hover:text-indigo-300"
              >
                View all →
              </button>
            </div>

            {recentSessions.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-700 px-5 py-10 text-center">
                <div className="mb-3 text-3xl">✦</div>
                <p className="font-medium text-slate-200">
                  No sessions yet
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Start your first viva to see your session history and
                  performance here.
                </p>

                <button
                  onClick={() => router.push("/setup")}
                  className="mt-5 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold transition hover:bg-indigo-500"
                >
                  Start Practising
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentSessions.map((session) => {
                  const score = getSessionScore(session);

                  return (
                    <button
                      key={session.id}
                      onClick={() =>
                        router.push(
                          `/history/${encodeURIComponent(session.id)}`
                        )
                      }
                      className="flex w-full items-center justify-between gap-4 rounded-lg border border-slate-800 bg-slate-950 p-4 text-left transition hover:border-indigo-500/50 hover:bg-slate-900"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-100">
                          {session.settings?.subject || "General Viva"}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {formatDate(session.completedAt)}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-300">
                            {session.settings?.difficulty || "Difficulty N/A"}
                          </span>

                          <span className="rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-300">
                            {getQuestionCount(session)} questions
                          </span>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        <div className="text-right">
                          <p
                            className={`text-lg font-bold ${
                              score !== null && score >= 70
                                ? "text-emerald-400"
                                : score !== null
                                  ? "text-amber-400"
                                  : "text-slate-500"
                            }`}
                          >
                            {score === null ? "—" : `${score}%`}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {score === null ? "Not scored" : "Score"}
                          </p>
                        </div>

                        <span
                          aria-hidden="true"
                          className="text-xl text-slate-500"
                        >
                          →
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <footer className="py-8 text-center text-xs text-slate-600">
          VIVA-X · AI-powered viva practice
        </footer>
      </div>
    </main>
  );
}

function MetricCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 transition hover:border-slate-700">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight">{value}</p>
          <p className="mt-2 text-xs text-slate-500">{description}</p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-indigo-500/20 bg-indigo-500/10 text-lg text-indigo-300">
          {icon}
        </div>
      </div>
    </div>
  );
}