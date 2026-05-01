import { Link } from "react-router-dom";

const cards = [
  {
    title: "Link Fraud Checker",
    path: "/link-checker",
    kicker: "Web Security Review",
    description: "Review suspicious domains, risky protocols, fake brand lookalikes, and dangerous extensions with clear reasons.",
    tags: ["Links", "Domains", "Risk Score", "Phishing"],
  },
  {
    title: "Email Scam Checker",
    path: "/email-checker",
    kicker: "Message Screening",
    description: "Spot phishing language, password requests, urgency cues, and suspicious embedded links in copied email content.",
    tags: ["Email", "Urgency", "Scam Patterns", "Review"],
  },
];

const workflow = [
  {
    title: "1. Submit the content",
    description: "Paste a suspicious URL or email content for review.",
  },
  {
    title: "2. Apply transparent rules",
    description: "Scanvoro checks for risk signals like spoofed domains, unsafe URLs, urgency phrases, and impersonation patterns.",
  },
  {
    title: "3. Review the score",
    description: "Each tool returns a risk score, a status label, and plain-language reasons behind the result.",
  },
];

export default function Home() {
  return (
    <div className="home-layout">
      <section className="hero-banner">
        <div className="hero-main">
          <span className="eyebrow">Fraud Defense Workspace</span>
          <h2 className="hero-title">Scanvoro helps you inspect digital risk before it becomes damage.</h2>
          <p className="hero-copy">
            <strong>Scanvoro is a rule-based fraud detection toolkit</strong> designed for clear, fast reviews.
            Instead of relying on hidden AI decisions, it explains exactly why a link or email looks safe,
            suspicious, or high risk.
          </p>
          <p className="hero-copy hero-copy-secondary">
            Fraud Detection Toolkit built to inspect risky links and scam emails.
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#core-services">
              Start Checking
            </a>
          </div>
          <div className="signal-grid">
            <div className="signal-box">
              <span>Coverage</span>
              <strong>2 Core Services</strong>
            </div>
            <div className="signal-box">
              <span>Decision Style</span>
              <strong>Rule-Based</strong>
            </div>
            <div className="signal-box">
              <span>Output</span>
              <strong>Scores + Reasons</strong>
            </div>
          </div>
        </div>

        <div className="hero-side">
          <div className="feature-panel feature-panel-soft">
            <h3>What Scanvoro does</h3>
            <p>
              It screens high-risk digital inputs and turns them into quick, readable results that a user, analyst,
              or student can understand immediately.
            </p>
            <div className="badge-row">
              <span className="badge safe">Safe indicators</span>
              <span className="badge suspicious">Suspicious signals</span>
              <span className="badge high">High risk alerts</span>
            </div>
          </div>

          <div className="feature-panel feature-panel-list">
            <h3>Why it works</h3>
            <ul className="mini-list">
              <li>Checks URLs for spoofing patterns and insecure setups.</li>
              <li>Analyzes email wording that commonly appears in phishing attacks.</li>
            </ul>
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      <section className="home-section">
        <div className="section-heading">
          <h2>How Scanvoro Works</h2>
          <p>A simple review flow designed to keep decisions fast, readable, and easy to trust.</p>
        </div>
        <div className="dashboard-grid">
          {workflow.map((item) => (
            <div className="dashboard-card workflow-card" key={item.title}>
              <span className="tool-kicker">Process</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <hr className="section-divider" />

      <section className="home-section" id="core-services">
        <div className="section-heading">
          <h2>Explore the 2 Core Services</h2>
          <p>
            Scanvoro focuses on fast link and email review, so the toolkit stays clear and easy to navigate.
          </p>
        </div>
        <div className="dashboard-grid">
          {cards.map((card) => (
            <article className="dashboard-card service-card" key={card.path}>
              <div className="service-content">
                <div className="service-meta">{card.kicker}</div>
                <h3>{card.title}</h3>
                <p>{card.description}</p>
                <div className="service-tags">
                  {card.tags.map((tag) => (
                    <span className="service-tag" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
                <Link className="service-link" to={card.path}>
                  Open tool
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
