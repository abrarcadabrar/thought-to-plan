"use client";

import { useEffect, useState } from "react";

type Plan = {
  summary: string;
  goals: string;
  blockers: string;
  nextActions: string;
  hardTruth: string;
};

type HistoryItem = {
  id: string;
  thoughts: string;
  plan: Plan;
  createdAt: string;
};

const emptyPlan: Plan = {
  summary: "Your summary will appear here.",
  goals: "Your goals will appear here.",
  blockers: "Your blockers will appear here.",
  nextActions: "Your next actions will appear here.",
  hardTruth: "Your hard truth will appear here.",
};

const sampleThought =
  "I want to build an AI startup but I keep jumping between wellness, consulting automation, and sports training. I feel like I need a technical cofounder, but I also want to learn to build myself. I don't know where to focus.";

export default function Home() {
  const [thoughts, setThoughts] = useState("");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<Plan>(emptyPlan);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const savedHistory = localStorage.getItem("thoughtToPlanHistory");

    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  function saveHistory(newHistory: HistoryItem[]) {
    setHistory(newHistory);
    localStorage.setItem("thoughtToPlanHistory", JSON.stringify(newHistory));
  }

  async function generatePlan() {
    if (!thoughts.trim()) {
      setError("Please enter your thoughts first.");
      return;
    }

    setLoading(true);
    setError("");
    setCopied(false);

    try {
      const response = await fetch("/api/generate-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ thoughts }),
      });

      const text = await response.text();

      let data: Plan;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Backend did not return valid JSON: " + text);
      }

      if (!response.ok) {
        throw new Error("Something went wrong.");
      }

      setPlan(data);

      const newItem: HistoryItem = {
        id: crypto.randomUUID(),
        thoughts,
        plan: data,
        createdAt: new Date().toLocaleString(),
      };

      saveHistory([newItem, ...history]);
    } catch (error) {
      console.error("Generate plan error:", error);
      setError(
        "Something went wrong generating your plan. Check your API key, route, or terminal error."
      );
    } finally {
      setLoading(false);
    }
  }

  function clearAll() {
    setThoughts("");
    setPlan(emptyPlan);
    setError("");
    setCopied(false);
  }

  function useSample() {
    setThoughts(sampleThought);
    setError("");
    setCopied(false);
  }

  function loadHistoryItem(item: HistoryItem) {
    setThoughts(item.thoughts);
    setPlan(item.plan);
    setError("");
    setCopied(false);
  }

  function deleteHistoryItem(id: string) {
    const updatedHistory = history.filter((item) => item.id !== id);
    saveHistory(updatedHistory);
  }

  function clearHistory() {
    saveHistory([]);
  }

  function formatPlanForCopy() {
    return `Thought-to-Plan

Original Thoughts:
${thoughts}

Summary:
${plan.summary}

Goals:
${plan.goals}

Blockers:
${plan.blockers}

Next Actions:
${plan.nextActions}

Hard Truth:
${plan.hardTruth}`;
  }

  async function copyPlan() {
    await navigator.clipboard.writeText(formatPlanForCopy());
    setCopied(true);
  }

  function downloadPlan() {
    const text = formatPlanForCopy();
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "thought-to-plan.txt";
    link.click();

    URL.revokeObjectURL(url);
  }

  const hasGeneratedPlan = plan.summary !== emptyPlan.summary;

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
          AI Builder Sprint
        </p>

        <h1 className="mt-2 text-4xl font-bold text-gray-900">
          Thought-to-Plan
        </h1>

        <p className="mt-3 text-lg text-gray-600">
          Paste messy thoughts and turn them into a clear, structured action
          plan.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <label className="block text-sm font-medium text-gray-700">
                  Your thoughts
                </label>

                <p className="text-sm text-gray-400">
                  {thoughts.length} characters
                </p>
              </div>

              <textarea
                value={thoughts}
                onChange={(event) => setThoughts(event.target.value)}
                className="mt-2 h-48 w-full rounded-xl border border-gray-300 p-4 text-gray-900 shadow-sm focus:border-black focus:outline-none"
                placeholder="Example: I want to build a startup, but I feel overwhelmed and don't know what to focus on..."
              />

              {error && (
                <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={generatePlan}
                  disabled={loading}
                  className="rounded-xl bg-black px-5 py-3 font-medium text-white hover:bg-gray-800 disabled:bg-gray-400"
                >
                  {loading ? "Generating..." : "Generate Plan"}
                </button>

                <button
                  onClick={useSample}
                  disabled={loading}
                  className="rounded-xl border border-gray-300 px-5 py-3 font-medium text-gray-700 hover:bg-gray-100 disabled:text-gray-400"
                >
                  Use Sample
                </button>

                <button
                  onClick={clearAll}
                  disabled={loading}
                  className="rounded-xl border border-gray-300 px-5 py-3 font-medium text-gray-700 hover:bg-gray-100 disabled:text-gray-400"
                >
                  Clear
                </button>
              </div>
            </div>

            <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-2xl font-semibold text-gray-900">
                  Your Plan
                </h2>

                <div className="flex gap-3">
                  <button
                    onClick={copyPlan}
                    disabled={!hasGeneratedPlan}
                    className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:text-gray-400"
                  >
                    {copied ? "Copied" : "Copy"}
                  </button>

                  <button
                    onClick={downloadPlan}
                    disabled={!hasGeneratedPlan}
                    className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:text-gray-400"
                  >
                    Download
                  </button>
                </div>
              </div>

              <div className="mt-6 space-y-5">
                <PlanSection title="Summary" content={plan.summary} />
                <PlanSection title="Goals" content={plan.goals} />
                <PlanSection title="Blockers" content={plan.blockers} />
                <PlanSection title="Next Actions" content={plan.nextActions} />
                <PlanSection title="Hard Truth" content={plan.hardTruth} />
              </div>
            </section>
          </div>

          <aside className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-gray-900">History</h2>

              <button
                onClick={clearHistory}
                disabled={history.length === 0}
                className="text-sm font-medium text-gray-500 hover:text-gray-900 disabled:text-gray-300"
              >
                Clear All
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {history.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Your past plans will appear here after you generate one.
                </p>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-gray-200 p-3 hover:bg-gray-50"
                  >
                    <button
                      onClick={() => loadHistoryItem(item)}
                      className="w-full text-left"
                    >
                      <p className="line-clamp-2 text-sm font-medium text-gray-900">
                        {item.thoughts}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {item.createdAt}
                      </p>
                    </button>

                    <button
                      onClick={() => deleteHistoryItem(item.id)}
                      className="mt-2 text-xs font-medium text-gray-400 hover:text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function PlanSection({ title, content }: { title: string; content: string }) {
  return (
    <div>
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 whitespace-pre-line text-gray-600">{content}</p>
    </div>
  );
}