import { useState } from "react";
import InputBox from "../components/InputBox";
import ResultCard from "../components/ResultCard";
import { postJson } from "../lib/api";

const sampleStatement = `Account Name,Account Number,Email,Phone,TFN,Notes
Medha Carter,123456789012,medha.carter@example.com,0412345678,123456789,Salary payment reference
Jordan Lee,998877665544,jordan.lee@company.com,0498765432,987654321,Transfer to savings`;

export default function BankStatementChecker() {
  const [statementText, setStatementText] = useState(sampleStatement);
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const analyzeStatement = async (content) => {
    setLoading(true);
    setError("");

    try {
      const data = await postJson("/check-bank", { content }, "Unable to scan statement.");
      setResult(data);
    } catch (err) {
      setError(err.message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const text = await file.text();
    setFileName(file.name);
    setStatementText(text);
    analyzeStatement(text);
  };

  return (
    <div className="page-grid">
      <section className="content-card">
        <h2>Bank Statement Scanner</h2>
        <p className="file-hint">Upload a CSV or text file, or paste statement content to detect and redact sensitive values.</p>
        <InputBox label="Statement File" type="file" accept=".csv,.txt" onChange={handleFileUpload} />
        <InputBox
          label="Statement Content"
          value={statementText}
          onChange={(event) => setStatementText(event.target.value)}
          placeholder="Paste statement content here"
          multiline
        />
        <div className="button-row">
          <button className="primary-button" onClick={() => analyzeStatement(statementText)} disabled={loading}>
            {loading ? "Scanning..." : "Scan Statement"}
          </button>
        </div>
        {fileName ? <p className="muted">Loaded file: {fileName}</p> : null}
        {error ? <p className="badge high">{error}</p> : null}
      </section>

      <section className="content-card">
        <h2>Result</h2>
        {result ? (
          <ResultCard
            title="Bank Statement Scan"
            score={result.score}
            result={result.result}
            reasons={result.reasons}
            detectedFields={result.detectedFields}
            extra={
              <>
                <h4>Redacted Output</h4>
                <div className="code-block">{result.redactedData}</div>
              </>
            }
          />
        ) : (
          <p className="muted">Scan a statement to detect sensitive fields and view the redacted output.</p>
        )}
      </section>
    </div>
  );
}
