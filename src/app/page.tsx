
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-white">
      {/* Navigation */}
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-xl font-extrabold shadow-lg shadow-indigo-600/20">
            V
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wide">VIVA-X</h1>
            <p className="text-xs text-slate-400">AI Viva Examiner</p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative mx-auto max-w-7xl px-6 pb-20 pt-16 lg:px-10 lg:pb-28 lg:pt-24">
        <div className="pointer-events-none absolute left-1/2 top-10 -z-0 h-80 w-80 -translate-x-1/2 rounded-full bg-indigo-600/20 blur-[120px]" />

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-200">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Your personal AI-powered viva practice platform
          </div>

          <h2 className="mt-8 text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
            Prepare smarter.
            <span className="mt-2 block bg-gradient-to-r from-indigo-400 via-violet-400 to-blue-400 bg-clip-text text-transparent">
              Perform confidently.
            </span>
          </h2>

          <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-slate-400 sm:text-lg">
            Practice technical viva questions, test your understanding, and
            improve your answers with AI-powered feedback. Turn preparation
            into confidence, one question at a time.
          </p>

          <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-7 py-4 font-semibold shadow-xl shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:bg-indigo-500"
            >
              Start Practising
              <span aria-hidden="true">→</span>
            </Link>

            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900/70 px-7 py-4 font-semibold transition hover:border-slate-500 hover:bg-slate-800"
            >
              I already have an account
            </Link>
          </div>
        </div>

        {/* Product Preview */}
        <div className="relative mx-auto mt-16 max-w-4xl">
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-indigo-600/30 via-violet-500/20 to-blue-600/30 blur-xl" />

          <div className="relative rounded-2xl border border-slate-700/80 bg-slate-900 p-5 shadow-2xl sm:p-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-5">
              <div>
                <p className="text-sm font-medium text-indigo-400">
                  LIVE PRACTICE PREVIEW
                </p>
                <h3 className="mt-2 text-lg font-bold sm:text-xl">
                  Database Management Systems
                </h3>
              </div>
              <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-300">
                Practice mode
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between text-sm">
              <span className="text-slate-400">Sample viva question</span>
              <span className="text-indigo-300">01 / 05</span>
            </div>

            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-5 sm:p-6">
              <p className="text-lg font-semibold leading-relaxed sm:text-xl">
                What is database normalization, and why is it important?
              </p>

              <div className="mt-6 space-y-2">
                <div className="h-2 w-full rounded-full bg-slate-800" />
                <div className="h-2 w-5/6 rounded-full bg-slate-800" />
                <div className="h-2 w-2/3 rounded-full bg-slate-800" />
              </div>

              <p className="mt-5 text-sm text-slate-500">
                Your answers will be evaluated during an actual practice
                session.
              </p>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-sm text-slate-400">Questions</p>
                <p className="mt-2 font-semibold">AI-generated</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-sm text-slate-400">Difficulty</p>
                <p className="mt-2 font-semibold">Your choice</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-sm text-slate-400">Feedback</p>
                <p className="mt-2 font-semibold">AI-powered</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-slate-800/80 bg-slate-900/40">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-indigo-400">
              Built for better preparation
            </p>
            <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
              Everything you need to practise
            </h2>
            <p className="mt-4 leading-7 text-slate-400">
              Move beyond reading notes. Practise answering questions and
              identify the concepts you need to strengthen.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            <FeatureCard
              icon="✦"
              title="AI-generated questions"
              description="Generate subject-specific viva questions based on your selected topics and difficulty."
            />
            <FeatureCard
              icon="◎"
              title="Intelligent feedback"
              description="Receive answer scores, strengths, missing concepts, and suggested improved answers."
            />
            <FeatureCard
              icon="↗"
              title="Learn and improve"
              description="Use feedback from each practice session to identify gaps in your understanding."
            />
          </div>

          <div className="mt-14 text-center">
            <h3 className="text-2xl font-bold">
              Your next viva starts here.
            </h3>
            <p className="mt-3 text-slate-400">
              Build confidence through consistent practice.
            </p>
            <Link
              href="/signup"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-7 py-3.5 font-semibold transition hover:bg-indigo-500"
            >
              Create Your Account <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-7 text-center sm:flex-row sm:text-left lg:px-10">
          <p className="font-semibold text-slate-300">
            VIVA-X <span className="font-normal text-slate-500">· AI Viva Examiner</span>
          </p>
          <p className="text-sm text-slate-500">
            Practise. Learn. Improve.
          </p>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 transition hover:-translate-y-1 hover:border-indigo-500/50">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/15 text-2xl text-indigo-300">
        {icon}
      </div>
      <h3 className="mt-5 text-lg font-bold">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-400">{description}</p>
    </div>
  );
}