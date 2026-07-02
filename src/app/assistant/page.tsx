// src/app/assistant/page.tsx
"use client";

import { useState } from "react";

const CHIPS = [
  "What should I be worried about right now?",
  "Which units need attention?",
  "What's offline right now?",
  "Summarize fleet health",
];

export default function AssistantPage() {
  const [question, setQuestion] = useState("");
  const [askedQ, setAskedQ] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask(q?: string) {
    const query = (q ?? question).trim();
    if (!query) return;
    setQuestion(query);
    setAskedQ(query);
    setLoading(true);
    setError(null);
    setAnswer(null);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: query }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setAnswer(data.answer);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <div className="shq-page shq-page--assistant">
        <div style={{ marginBottom: 24 }}>
          <p className="shq-kicker" style={{ margin: 0 }}>Assistant / Fleet Q&amp;A</p>
          <h1 className="shq-h1">Ask the fleet</h1>
          <p className="shq-sub">Plain-English answers grounded in the live telemetry snapshot — it only speaks from the data.</p>
        </div>

        <form
          className="shq-ask"
          onSubmit={(e) => {
            e.preventDefault();
            ask();
          }}
        >
          <span className="prompt">&gt;</span>
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="which units need attention right now?"
          />
          <button type="submit" disabled={loading} className="shq-btn-primary" style={{ flexShrink: 0 }}>
            {loading ? "…" : "Ask"}
          </button>
        </form>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          {CHIPS.map((c) => (
            <button key={c} className="shq-chip" disabled={loading} onClick={() => ask(c)}>
              {c}
            </button>
          ))}
        </div>

        {error && (
          <div className="shq-answer" style={{ borderColor: "var(--st-critical-dot)" }}>
            <p className="shq-answer-body" style={{ color: "var(--st-critical-fg)" }}>Error: {error}</p>
          </div>
        )}

        {loading && (
          <div className="shq-answer">
            <div className="shq-answer-head">
              <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <span className="shq-spin" />
                <span className="shq-micro">Reading live telemetry…</span>
              </span>
            </div>
            <div style={{ padding: 18 }}>
              <div className="shq-line" style={{ width: "88%" }} />
              <div className="shq-line" style={{ width: "72%" }} />
              <div className="shq-line" style={{ width: "55%", marginBottom: 0 }} />
            </div>
          </div>
        )}

        {!loading && answer && (
          <div className="shq-answer">
            <div className="shq-answer-head">
              <span className="shq-micro">Answer</span>
              <span className="shq-mono" style={{ fontSize: 11.5, color: "var(--text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                &gt; {askedQ}
              </span>
            </div>
            <p className="shq-answer-body">{answer}</p>
          </div>
        )}

        {!loading && !answer && !error && (
          <div className="shq-answer-idle">
            <p className="shq-mono" style={{ margin: 0, fontSize: 12, color: "var(--text-3)" }}>
              Answers appear here. Ask above or pick a suggestion.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
