    
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SetupPage() {
  const router = useRouter();

  const [subject, setSubject] = useState("DBMS");
  const [topics, setTopics] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [questionCount, setQuestionCount] = useState("10");
  const [mode, setMode] = useState("Practice");
  const [error, setError] = useState("");

  function handleStart(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!subject.trim()) {
      setError("Please enter a subject.");
      return;
    }

    const settings = {
      subject: subject.trim(),
      topics: topics
        .split(",")
        .map((topic) => topic.trim())
        .filter(Boolean),
      difficulty,
      questionCount: Number(questionCount),
      mode,
    };

    sessionStorage.setItem("vivaSetup", JSON.stringify(settings));
    router.push("/viva");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-2xl">
        <p className="text-sm font-semibold tracking-widest text-indigo-400">
          VIVA-X
        </p>

        <h1 className="mt-3 text-3xl font-bold">Set Up Your Viva</h1>
        <p className="mt-2 text-slate-400">
          Customize your practice session before you begin.
        </p>

        <form
          onSubmit={handleStart}
          className="mt-8 space-y-6 rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8"
        >
          <div>
            <label htmlFor="subject" className="mb-2 block text-sm font-medium">
              Subject
            </label>
            <input
              id="subject"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. DBMS, Java, DSA"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="topics" className="mb-2 block text-sm font-medium">
              Topics (comma-separated)
            </label>
            <textarea
              id="topics"
              rows={3}
              value={topics}
              onChange={(e) => setTopics(e.target.value)}
              placeholder="e.g. SQL, Normalization, Transactions"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="difficulty" className="mb-2 block text-sm font-medium">
              Difficulty
            </label>
            <select
              id="difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-indigo-500"
            >
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
          </div>

          <div>
            <label htmlFor="questionCount" className="mb-2 block text-sm font-medium">
              Number of questions
            </label>
            <select
              id="questionCount"
              value={questionCount}
              onChange={(e) => setQuestionCount(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-indigo-500"
            >
              <option value="5">5 questions</option>
              <option value="10">10 questions</option>
              <option value="15">15 questions</option>
              <option value="20">20 questions</option>
            </select>
          </div>

          <div>
            <label htmlFor="mode" className="mb-2 block text-sm font-medium">
              Viva mode
            </label>
            <select
              id="mode"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-indigo-500"
            >
              <option>Practice</option>
              <option>Exam Simulation</option>
            </select>
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-lg bg-indigo-600 px-5 py-3 font-semibold hover:bg-indigo-500"
          >
            Start Viva
          </button>
        </form>
      </div>
    </main>
  );
}