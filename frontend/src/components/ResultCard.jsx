function getRiskColor(score) {
  if (typeof score !== "number") {
    return "#00C853";
  }

  if (score <= 25) {
    return "#00C853";
  }

  if (score <= 45) {
    return "#FFD600";
  }

  if (score <= 75) {
    return "#FF9100";
  }

  return "#D50000";
}

export default function ResultCard({
  title = "Analysis Result",
  score,
  result,
  color,
  reasons = [],
  detectedFields = [],
  highlights = [],
  alerts = [],
  extra,
}) {
  const resolvedColor = color || getRiskColor(score);
  const reasonList = Array.isArray(reasons) ? reasons.filter(Boolean) : [];
  const reasonText = typeof reasons === "string" ? reasons.trim() : "";

  return (
    <section className="result-card">
      <div className="result-head">
        <div>
          <h3>{title}</h3>
          <p className="muted">Status: {result || "Not available"}</p>
        </div>
        {typeof score === "number" ? (
          <span className="score-pill" style={{ background: resolvedColor }}>
            Risk Score: {score}/100
          </span>
        ) : null}
      </div>

      {highlights.length > 0 ? (
        <>
          <h4>Suspicious Patterns</h4>
          <ul>
            {highlights.map((item, index) => (
              <li key={`${item}-${index}`}>{item}</li>
            ))}
          </ul>
        </>
      ) : null}

      {reasonList.length > 0 ? (
        <>
          <h4>Reasons</h4>
          <ul>
            {reasonList.map((reason, index) => (
              <li key={`${reason}-${index}`}>{reason}</li>
            ))}
          </ul>
        </>
      ) : null}

      {reasonText ? (
        <>
          <h4>Reason</h4>
          <p>{reasonText}</p>
        </>
      ) : null}

      {alerts.length > 0 ? (
        <>
          <h4>Alerts</h4>
          <ul>
            {alerts.map((alert, index) => (
              <li key={`${alert}-${index}`}>{alert}</li>
            ))}
          </ul>
        </>
      ) : null}

      {detectedFields.length > 0 ? (
        <>
          <h4>Detected Sensitive Fields</h4>
          <ul>
            {detectedFields.map((field, index) => (
              <li key={`${field}-${index}`}>{field}</li>
            ))}
          </ul>
        </>
      ) : null}

      {extra}
    </section>
  );
}
