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
        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <div className="shq-assistant-badge">
            <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--accent)" }} />
            FLEET ASSISTANT
          </div>
          <h1 className="shq-h1" style={{ fontSize: 25, letterSpacing: "-0.03em" }}>
            Ask anything about your fleet
          </h1>
          <p className="shq-sub" style={{ marginTop: 9 }}>
            Plain-English answers grounded in live telemetry across your appliances.
          </p>
        </div>

        <form
          className="shq-ask"
          onSubmit={(e) => {
            e.preventDefault();
            ask();
          }}
        >
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. Which units need attention right now?"
          />
          <button type="submit" disabled={loading} className="shq-btn-primary" style={{ flexShrink: 0 }}>
            {loading ? "Thinking…" : "Ask"}
          </button>
        </form>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
          {CHIPS.map((c) => (
            <button key={c} className="shq-chip" disabled={loading} onClick={() => ask(c)}>
              {c}
            </button>
          ))}
        </div>

        {error && (
          <div className="shq-answer" style={{ borderColor: "var(--st-critical-dot)" }}>
            <p style={{ margin: 0, fontSize: 14, color: "var(--st-critical-fg)" }}>Error: {error}</p>
          </div>
        )}

        {loading && (
          <div className="shq-answer" style={{ boxShadow: "var(--shadow-sm)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <span className="shq-spin" />
              <span style={{ fontSize: 12.5, color: "var(--text-3)" }}>Reading live telemetry…</span>
            </div>
            <div className="shq-line" style={{ width: "90%" }} />
            <div className="shq-line" style={{ width: "75%" }} />
            <div className="shq-line" style={{ width: "60%", marginBottom: 0 }} />
          </div>
        )}

        {!loading && answer && (
          <div className="shq-answer">
            <div className="shq-answer-head">
              <span style={{ width: 22, height: 22, borderRadius: 7, background: "var(--accent)", display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 1.5, paddingBottom: 5, flexShrink: 0 }}>
                <span style={{ width: 2, height: 5, borderRadius: 2, background: "#fff", opacity: 0.6 }} />
                <span style={{ width: 2, height: 8, borderRadius: 2, background: "#fff" }} />
                <span style={{ width: 2, height: 6, borderRadius: 2, background: "#fff", opacity: 0.8 }} />
              </span>
              <span>
                You asked · <span style={{ color: "var(--text-2)", fontWeight: 500 }}>{askedQ}</span>
              </span>
            </div>
            <p className="shq-answer-body">{answer}</p>
          </div>
        )}

        {!loading && !answer && !error && (
          <div className="shq-answer-idle">
            <p style={{ margin: 0, fontSize: 13.5, color: "var(--text-3)" }}>
              Answers appear here. Ask a question above or pick a suggestion to get started.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
