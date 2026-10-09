
"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.replace("/signup");
        return;
      }

      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  async function handleLogout() {
    try {
      await signOut(auth);
      router.replace("/signup");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        Loading your dashboard...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-semibold tracking-widest text-indigo-400">
              VIVA-X
            </p>
            <h1 className="mt-2 text-3xl font-bold">Your Dashboard</h1>
            <p className="mt-2 text-slate-400">
              Welcome, {user?.displayName || user?.email || "Student"}!
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-lg border border-slate-700 px-4 py-2 hover:bg-slate-800"
          >
            Log out
          </button>
        </header>

        <section className="mt-10 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">Start a Viva</h2>
            <p className="mt-2 text-slate-400">
              Practise answering viva questions and strengthen your concepts.
            </p>
            <button
              onClick={() => router.push("/setup")}
              className="mt-6 rounded-lg bg-indigo-600 px-5 py-3 font-semibold hover:bg-indigo-500"
            >
              Start Preparing
            </button>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">Your Progress</h2>
            <p className="mt-2 text-slate-400">
              Your performance and topic analytics will appear here as you
              complete viva sessions.
            </p>
            <p className="mt-4 text-sm text-indigo-300">
              No sessions completed yet
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}