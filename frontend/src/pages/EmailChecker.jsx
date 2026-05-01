import { useState } from "react";
import InputBox from "../components/InputBox";
import ResultCard from "../components/ResultCard";

const sampleEmail = `From: support@secure-payments-alert.com
Subject: Urgent: verify your account immediately

Dear customer,

Your account will be suspended unless you confirm your password and OTP immediately.
Please verify now at http://secure-payments-check.xyz/login to avoid disruption.

Regards,
Security Team`;

const EMAIL_API_BASE = import.meta.env.VITE_EMAIL_API_BASE || "/email-api";

export default function EmailChecker() {
  const [emailText, setEmailText] = useState(sampleEmail);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const wordCount = emailText.trim() ? emailText.trim().split(/\s+/).length : 0;
  const linkCount = (emailText.match(/https?:\/\/\S+/gi) || []).length;

  const handleAnalyze = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(`${EMAIL_API_BASE}/analyze-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email_text: emailText }),
      });
      const rawBody = await response.text();
      const data = rawBody ? JSON.parse(rawBody) : null;

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            data?.error ||
            (response.status >= 500
              ? "Email analysis backend failed. Make sure the FastAPI email service is running on port 8000."
              : "Unable to analyze email.")
        );
      }

      console.log("[Scanvoro Email UI]", {
        final_risk_score: data?.risk_score,
        final_risk_level: data?.risk_level,
        final_color: data?.color,
      });
      setResult(data);
    } catch (err) {
      setError(
        err instanceof SyntaxError
          ? "Email analysis backend returned an invalid response. Start the full app from the project root with npm start."
          : err instanceof TypeError
          ? "Cannot reach the Email Checker API. Start the FastAPI server on port 8000 and try again."
          : err.message
      );
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="email-checker-page">
      <section className="email-hero">
        <div className="email-hero-copy">
          <span className="eyebrow">Email Risk Review</span>
          <h3>Inspect suspicious messages before they reach your next decision.</h3>
          <p>
            Paste an email to review phishing language, urgent payment cues, sender mismatches, suspicious links,
            and impersonation patterns in one clear report.
          </p>
        </div>
        <div className="email-hero-metrics" aria-label="Email checker highlights">
          <div>
            <span>Checks</span>
            <strong>Language</strong>
          </div>
          <div>
            <span>Reviews</span>
            <strong>Links</strong>
          </div>
          <div>
            <span>Output</span>
            <strong>Score + reasons</strong>
          </div>
        </div>
      </section>

      <section className="email-tool-shell">
        <div className="email-tool-header">
          <div>
            <span className="tool-kicker">Analyzer</span>
            <h2>Email Scam Checker</h2>
          </div>
          <div className="email-input-stats">
            <span>{wordCount} words</span>
            <span>{linkCount} links</span>
          </div>
        </div>

        <div className="email-tool-grid">
          <section className="email-compose-panel">
            <InputBox
              label="Email Content"
              value={emailText}
              onChange={(event) => setEmailText(event.target.value)}
              placeholder="Paste email text here"
              multiline
            />
            <div className="button-row">
              <button className="primary-button email-analyze-button" onClick={handleAnalyze} disabled={loading}>
                {loading ? "Analyzing..." : "Analyze Email"}
              </button>
            </div>
            {error ? <p className="badge high email-error">{error}</p> : null}
          </section>

          <section className="email-result-panel">
            <div className="result-panel-head">
              <span className="tool-kicker">Report</span>
              <h2>Risk Result</h2>
            </div>
            {result ? (
              <ResultCard
                title="Email Analysis"
                score={result.risk_score}
                result={result.risk_level}
                color={result.color}
                reasons={result.reasons}
              />
            ) : (
              <div className="email-empty-result">
                <strong>Ready for analysis</strong>
                <p>Run a check to see the risk level, score, and plain-language scam reasons.</p>
                <div className="empty-result-lines" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}
          </section>
        </div>
      </section>

      <section className="email-support-section">
        <div>
          <span className="eyebrow">What The Report Covers</span>
          <h3>Built for quick, confident email screening.</h3>
        </div>
        <div className="email-support-grid">
          <article>
            <h3>Sender Signals</h3>
            <p>Highlights suspicious sender details, mismatched domains, and impersonation patterns.</p>
          </article>
          <article>
            <h3>Message Intent</h3>
            <p>Looks for urgency, credential requests, payment pressure, and unsafe instructions.</p>
          </article>
          <article>
            <h3>Readable Reasons</h3>
            <p>Explains the score in simple language so users can act without guessing.</p>
          </article>
        </div>
      </section>
    </div>
  );
}
