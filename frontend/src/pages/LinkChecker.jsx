import { useState } from "react";
import InputBox from "../components/InputBox";
import ResultCard from "../components/ResultCard";
import { postJson } from "../lib/api";

export default function LinkChecker() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCheck = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await postJson("/check-link", { url }, "Unable to analyze link.");
      setResult(data);
    } catch (err) {
      setError(err.message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-grid">
      <section className="content-card">
        <h2>Link Fraud Checker</h2>
        <p>Paste a URL to check for insecure protocols, suspicious words, fake domains, and risky extensions.</p>
        <InputBox
          label="URL"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://example.com/login"
        />
        <div className="button-row">
          <button className="primary-button" onClick={handleCheck} disabled={loading}>
            {loading ? "Checking..." : "Check Link"}
          </button>
        </div>
        {error ? <p className="badge high">{error}</p> : null}
      </section>

      <section className="content-card">
        <h2>Result</h2>
        {result ? (
          <ResultCard title="Link Analysis" score={result.score} result={result.result} reasons={result.reasons} />
        ) : (
          <p className="muted">Run a link check to see the risk score and reasons.</p>
        )}
      </section>
    </div>
  );
}
