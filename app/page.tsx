"use client";

import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";

type Advisor = {
  title: string;
  perspective: string;
  whatYouMayBeMissing: string;
  advice: string;
  question: string;
};

type BoardResponse = {
  advisors: {
    financial: Advisor;
    career: Advisor;
    family: Advisor;
    healthFitness: Advisor;
    romantic: Advisor;
    community: Advisor;
    personalGrowth: Advisor;
  };
  chair: {
    title: string;
    integratedRecommendation: string;
    tradeoffs: string;
    nextThreeActions: string;
    groundingReminder: string;
  };
};

type SavedDecision = {
  id: string;
  situation: string;
  decision_type: string;
  urgency: string;
  emotional_state: string;
  advisors: BoardResponse["advisors"];
  chair: BoardResponse["chair"];
  created_at: string;
};

const emptyBoard: BoardResponse = {
  advisors: {
    financial: {
      title: "Financial Advisor",
      perspective: "Your financial perspective will appear here.",
      whatYouMayBeMissing: "What you may be missing will appear here.",
      advice: "Advice will appear here.",
      question: "A question will appear here.",
    },
    career: {
      title: "Career Strategist",
      perspective: "Your career perspective will appear here.",
      whatYouMayBeMissing: "What you may be missing will appear here.",
      advice: "Advice will appear here.",
      question: "A question will appear here.",
    },
    family: {
      title: "Family Advisor",
      perspective: "Your family perspective will appear here.",
      whatYouMayBeMissing: "What you may be missing will appear here.",
      advice: "Advice will appear here.",
      question: "A question will appear here.",
    },
    healthFitness: {
      title: "Health & Fitness Coach",
      perspective: "Your health perspective will appear here.",
      whatYouMayBeMissing: "What you may be missing will appear here.",
      advice: "Advice will appear here.",
      question: "A question will appear here.",
    },
    romantic: {
      title: "Romantic Life Advisor",
      perspective: "Your romantic life perspective will appear here.",
      whatYouMayBeMissing: "What you may be missing will appear here.",
      advice: "Advice will appear here.",
      question: "A question will appear here.",
    },
    community: {
      title: "Community Advisor",
      perspective: "Your community perspective will appear here.",
      whatYouMayBeMissing: "What you may be missing will appear here.",
      advice: "Advice will appear here.",
      question: "A question will appear here.",
    },
    personalGrowth: {
      title: "Personal Growth Guide",
      perspective: "Your personal growth perspective will appear here.",
      whatYouMayBeMissing: "What you may be missing will appear here.",
      advice: "Advice will appear here.",
      question: "A question will appear here.",
    },
  },
  chair: {
    title: "Board Chair",
    integratedRecommendation: "Your integrated recommendation will appear here.",
    tradeoffs: "Your tradeoffs will appear here.",
    nextThreeActions: "Your next three actions will appear here.",
    groundingReminder: "Your grounding reminder will appear here.",
  },
};

const sampleSituation =
  "I am trying to decide whether to spend the next few months going hard on learning AI coding and building startup prototypes, while also preparing to start my post-MBA job. Part of me wants freedom and creativity, but another part worries I will overextend myself.";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [situation, setSituation] = useState("");
  const [decisionType, setDecisionType] = useState("General life decision");
  const [urgency, setUrgency] = useState("Medium");
  const [emotionalState, setEmotionalState] = useState("Confused");

  const [board, setBoard] = useState<BoardResponse>(emptyBoard);
  const [savedDecisions, setSavedDecisions] = useState<SavedDecision[]>([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadSession() {
      const { data } = await supabase.auth.getSession();
      const currentUser = data.session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        loadSavedDecisions();
      }
    }

    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          loadSavedDecisions();
        } else {
          setSavedDecisions([]);
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  async function signUp() {
    setAuthLoading(true);
    setError("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      setError("Check your email to confirm your account, then log in.");
    }

    setAuthLoading(false);
  }

  async function logIn() {
    setAuthLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    }

    setAuthLoading(false);
  }

  async function logOut() {
    await supabase.auth.signOut();
    setUser(null);
    setSavedDecisions([]);
  }

  async function loadSavedDecisions() {
    const { data, error } = await supabase
      .from("life_board_decisions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Load saved decisions error:", error);
      setError(error.message);
      return;
    }

    setSavedDecisions(data ?? []);
  }

  async function saveDecisionToDatabase(generatedBoard: BoardResponse) {
    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { error } = await supabase.from("life_board_decisions").insert({
        user_id: user.id,
        situation,
        decision_type: decisionType,
        urgency,
        emotional_state: emotionalState,
        advisors: generatedBoard.advisors,
        chair: generatedBoard.chair,
      });

      if (error) {
        console.error("Save decision error:", error);
        setError(error.message);
        return;
      }

      await loadSavedDecisions();
    } finally {
      setSaving(false);
    }
  }

  async function generateBoardAdvice() {
    if (!situation.trim()) {
      setError("Please enter the situation or decision first.");
      return;
    }

    setLoading(true);
    setError("");
    setCopied(false);

    try {
      const response = await fetch("/api/generate-board", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          situation,
          decisionType,
          urgency,
          emotionalState,
        }),
      });

      const text = await response.text();
      const data: BoardResponse = JSON.parse(text);

      if (!response.ok) {
        throw new Error("Something went wrong.");
      }

      setBoard(data);
      setLoading(false);

      if (user) {
        saveDecisionToDatabase(data);
      }
    } catch (error) {
      console.error("Generate board advice error:", error);
      setError("Something went wrong generating board advice.");
      setLoading(false);
    }
  }

  function loadSavedDecision(item: SavedDecision) {
    setSituation(item.situation);
    setDecisionType(item.decision_type);
    setUrgency(item.urgency);
    setEmotionalState(item.emotional_state);
    setBoard({
      advisors: item.advisors,
      chair: item.chair,
    });
    setError("");
    setCopied(false);
  }

  async function deleteSavedDecision(id: string) {
    const { error } = await supabase
      .from("life_board_decisions")
      .delete()
      .eq("id", id);

    if (error) {
      setError(error.message);
      return;
    }

    await loadSavedDecisions();
  }

  function useSample() {
    setSituation(sampleSituation);
    setDecisionType("Career");
    setUrgency("Medium");
    setEmotionalState("Confused");
    setError("");
    setCopied(false);
  }

  function clearAll() {
    setSituation("");
    setDecisionType("General life decision");
    setUrgency("Medium");
    setEmotionalState("Confused");
    setBoard(emptyBoard);
    setError("");
    setCopied(false);
  }

  function formatBoardForCopy() {
    const advisors = Object.values(board.advisors)
      .map(
        (advisor) => `${advisor.title}

Perspective:
${advisor.perspective}

What you may be missing:
${advisor.whatYouMayBeMissing}

Advice:
${advisor.advice}

Question:
${advisor.question}`
      )
      .join("\n\n---\n\n");

    return `Life Board

Situation:
${situation}

Decision type: ${decisionType}
Urgency: ${urgency}
Emotional state: ${emotionalState}

${advisors}

---

${board.chair.title}

Integrated recommendation:
${board.chair.integratedRecommendation}

Tradeoffs:
${board.chair.tradeoffs}

Next three actions:
${board.chair.nextThreeActions}

Grounding reminder:
${board.chair.groundingReminder}`;
  }

  async function copyBoard() {
    await navigator.clipboard.writeText(formatBoardForCopy());
    setCopied(true);
  }

  function downloadBoard() {
    const text = formatBoardForCopy();
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "life-board-advice.txt";
    link.click();

    URL.revokeObjectURL(url);
  }

  const hasGeneratedBoard =
    board.chair.integratedRecommendation !==
    emptyBoard.chair.integratedRecommendation;

  const advisorList = [
    board.advisors.financial,
    board.advisors.career,
    board.advisors.family,
    board.advisors.healthFitness,
    board.advisors.romantic,
    board.advisors.community,
    board.advisors.personalGrowth,
  ];

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
          AI Builder Sprint
        </p>

        <h1 className="mt-2 text-4xl font-bold text-gray-900">Life Board</h1>

        <p className="mt-3 max-w-3xl text-lg text-gray-600">
          Bring a decision to your personal board of directors. Get perspective
          across money, career, family, health, romance, community, and personal growth.
        </p>

        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          {user ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-gray-600">
                  Logged in as <span className="font-medium">{user.email}</span>
                </p>

                {saving && (
                  <p className="mt-1 text-sm text-gray-400">
                    Saving decision to database...
                  </p>
                )}
              </div>

              <button
                onClick={logOut}
                className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Log out
              </button>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Log in to save your board sessions
              </h2>

              <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="rounded-xl border border-gray-300 p-3 text-gray-900"
                  placeholder="Email"
                  type="email"
                />

                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="rounded-xl border border-gray-300 p-3 text-gray-900"
                  placeholder="Password"
                  type="password"
                />

                <button
                  onClick={logIn}
                  disabled={authLoading}
                  className="rounded-xl bg-black px-4 py-3 font-medium text-white hover:bg-gray-800 disabled:bg-gray-400"
                >
                  Log in
                </button>

                <button
                  onClick={signUp}
                  disabled={authLoading}
                  className="rounded-xl border border-gray-300 px-4 py-3 font-medium text-gray-700 hover:bg-gray-100 disabled:text-gray-400"
                >
                  Sign up
                </button>
              </div>
            </div>
          )}

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <label className="block text-sm font-medium text-gray-700">
                What decision or situation are you thinking through?
              </label>

              <textarea
                value={situation}
                onChange={(event) => setSituation(event.target.value)}
                className="mt-2 h-44 w-full rounded-xl border border-gray-300 p-4 text-gray-900 shadow-sm focus:border-black focus:outline-none"
                placeholder="Example: I am deciding whether to focus on building a startup idea this summer or prioritize career stability..."
              />

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <select
                  value={decisionType}
                  onChange={(event) => setDecisionType(event.target.value)}
                  className="rounded-xl border border-gray-300 p-3 text-gray-900"
                >
                  <option>General life decision</option>
                  <option>Career</option>
                  <option>Financial</option>
                  <option>Family</option>
                  <option>Health & Fitness</option>
                  <option>Romantic</option>
                  <option>Community</option>
                  <option>Personal Growth</option>
                </select>

                <select
                  value={urgency}
                  onChange={(event) => setUrgency(event.target.value)}
                  className="rounded-xl border border-gray-300 p-3 text-gray-900"
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>

                <select
                  value={emotionalState}
                  onChange={(event) => setEmotionalState(event.target.value)}
                  className="rounded-xl border border-gray-300 p-3 text-gray-900"
                >
                  <option>Calm</option>
                  <option>Confused</option>
                  <option>Stressed</option>
                  <option>Excited</option>
                  <option>Sad</option>
                  <option>Angry</option>
                  <option>Hopeful</option>
                </select>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={generateBoardAdvice}
                  disabled={loading}
                  className="rounded-xl bg-black px-5 py-3 font-medium text-white hover:bg-gray-800 disabled:bg-gray-400"
                >
                  {loading ? "Board is thinking..." : "Ask My Board"}
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
                  Board Chair Recommendation
                </h2>

                <div className="flex gap-3">
                  <button
                    onClick={copyBoard}
                    disabled={!hasGeneratedBoard}
                    className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:text-gray-400"
                  >
                    {copied ? "Copied" : "Copy"}
                  </button>

                  <button
                    onClick={downloadBoard}
                    disabled={!hasGeneratedBoard}
                    className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:text-gray-400"
                  >
                    Download
                  </button>
                </div>
              </div>

              <div className="mt-6 grid gap-4">
                <ChairSection
                  title="Integrated Recommendation"
                  content={board.chair.integratedRecommendation}
                />
                <ChairSection title="Tradeoffs" content={board.chair.tradeoffs} />
                <ChairSection
                  title="Next Three Actions"
                  content={board.chair.nextThreeActions}
                />
                <ChairSection
                  title="Grounding Reminder"
                  content={board.chair.groundingReminder}
                />
              </div>
            </section>

            <section className="mt-6 grid gap-4 md:grid-cols-2">
              {advisorList.map((advisor) => (
                <AdvisorCard key={advisor.title} advisor={advisor} />
              ))}
            </section>
          </div>

          <aside className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">
              Saved Decisions
            </h2>

            {!user ? (
              <p className="mt-4 text-sm text-gray-500">
                Log in to save and view board sessions across devices.
              </p>
            ) : savedDecisions.length === 0 ? (
              <p className="mt-4 text-sm text-gray-500">
                Your saved board sessions will appear here.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {savedDecisions.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-gray-200 p-3 hover:bg-gray-50"
                  >
                    <button
                      onClick={() => loadSavedDecision(item)}
                      className="w-full text-left"
                    >
                      <p className="line-clamp-2 text-sm font-medium text-gray-900">
                        {item.situation}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {item.decision_type} ·{" "}
                        {new Date(item.created_at).toLocaleString()}
                      </p>
                    </button>

                    <button
                      onClick={() => deleteSavedDecision(item.id)}
                      className="mt-2 text-xs font-medium text-gray-400 hover:text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}

function AdvisorCard({ advisor }: { advisor: Advisor }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900">{advisor.title}</h3>

      <div className="mt-4 space-y-3">
        <MiniSection title="Perspective" content={advisor.perspective} />
        <MiniSection
          title="What you may be missing"
          content={advisor.whatYouMayBeMissing}
        />
        <MiniSection title="Advice" content={advisor.advice} />
        <MiniSection title="Question" content={advisor.question} />
      </div>
    </div>
  );
}

function ChairSection({ title, content }: { title: string; content: string }) {
  return (
    <div className="rounded-xl bg-gray-50 p-4">
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 whitespace-pre-line text-gray-700">{content}</p>
    </div>
  );
}

function MiniSection({ title, content }: { title: string; content: string }) {
  return (
    <div>
      <p className="text-sm font-semibold text-gray-900">{title}</p>
      <p className="mt-1 whitespace-pre-line text-sm text-gray-600">{content}</p>
    </div>
  );
}