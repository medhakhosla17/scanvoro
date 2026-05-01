import { Link, Route, Routes, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import LinkChecker from "./pages/LinkChecker";
import EmailChecker from "./pages/EmailChecker";
import BankStatementChecker from "./pages/BankStatementChecker";

const appStyles = `
  :root {
    font-family: "Trebuchet MS", "Segoe UI", sans-serif;
    color: #d9e3f2;
    background:
      radial-gradient(circle at top left, rgba(91, 140, 194, 0.12), transparent 26%),
      radial-gradient(circle at top right, rgba(87, 151, 178, 0.08), transparent 20%),
      linear-gradient(180deg, #0b1624 0%, #102033 44%, #0a1420 100%);
    --safe: #22c55e;
    --warn: #fbbf24;
    --danger: #fb7185;
    --surface: rgba(15, 25, 39, 0.84);
    --surface-strong: rgba(18, 31, 48, 0.95);
    --surface-soft: rgba(19, 34, 52, 0.76);
    --border: rgba(154, 169, 189, 0.16);
    --border-strong: rgba(122, 167, 194, 0.28);
    --text-soft: #a9b7ca;
    --shadow: 0 26px 70px rgba(3, 9, 18, 0.42);
    --accent: #7aa7c2;
    --accent-strong: #85b8ce;
    --accent-warm: #f2c94c;
    --accent-warm-soft: rgba(242, 201, 76, 0.12);
  }

  * {
    box-sizing: border-box;
  }

  html {
    background: #0a1420;
  }

  body {
    margin: 0;
    min-height: 100vh;
    background: transparent;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  button,
  input,
  textarea {
    font: inherit;
  }

  .app-shell {
    min-height: 100vh;
    padding: 0;
    position: relative;
    display: flex;
    flex-direction: column;
  }

  .app-shell::before {
    content: "";
    position: fixed;
    inset: 0;
    background:
      radial-gradient(circle at 15% 20%, rgba(37, 99, 235, 0.12), transparent 0 26%),
      radial-gradient(circle at 85% 15%, rgba(122, 167, 194, 0.08), transparent 0 20%),
      radial-gradient(circle at 50% 100%, rgba(91, 140, 194, 0.08), transparent 0 28%);
    pointer-events: none;
  }

  .topbar {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 18px;
    padding: 16px 24px;
    border-bottom: 1px solid var(--border);
    background: rgba(10, 20, 32, 0.94);
    backdrop-filter: blur(18px);
    position: sticky;
    top: 0;
    z-index: 20;
  }

  .topbar-inner {
    max-width: 1240px;
    width: 100%;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 18px;
  }

  .brand-lockup {
    display: flex;
    align-items: center;
    gap: 14px;
    min-width: 0;
  }

  .logo-slot {
    width: 220px;
    height: 58px;
    flex: 0 0 auto;
    border-radius: 0;
    border: 0;
    background: transparent;
    display: grid;
    place-items: center;
    overflow: hidden;
    box-shadow: none;
  }

  .logo-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
    padding: 0;
    display: block;
  }

  .brand h1 {
    margin: 0;
    font-size: 1.7rem;
    letter-spacing: 0.03em;
    color: #eff4fb;
  }

  .brand p {
    margin: 5px 0 0;
    color: var(--text-soft);
    max-width: 460px;
  }

  .nav-links {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 22px;
  }

  .nav-pill {
    padding: 4px 0;
    border: 0;
    background: transparent;
    color: #ccd7e6;
    position: relative;
    transition: color 0.2s ease;
  }

  .nav-pill:hover {
    color: #eef4fb;
  }

  .nav-pill::after {
    content: "";
    position: absolute;
    left: 0;
    bottom: -6px;
    width: 100%;
    height: 2px;
    background: var(--accent-warm);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.2s ease;
  }

  .nav-pill.active::after,
  .nav-pill:hover::after {
    transform: scaleX(1);
  }

  .page-wrap {
    max-width: 1180px;
    margin: 0 auto;
    width: 100%;
    position: relative;
    z-index: 1;
  }

  .page-main {
    flex: 1;
    width: 100%;
    padding: 42px 28px 64px;
  }

  .hero-card,
  .content-card,
  .result-card,
  .dashboard-card,
  .feature-panel,
  .footer-shell {
    background: var(--surface);
    border: 1px solid var(--border);
    box-shadow: var(--shadow);
    border-radius: 26px;
    backdrop-filter: blur(14px);
  }

  .hero-card,
  .content-card,
  .footer-shell {
    padding: 30px;
  }

  .page-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 22px;
  }

  .hero-card h2,
  .content-card h2 {
    margin-top: 0;
    color: #edf3fa;
  }

  .hero-card p,
  .content-card p,
  .dashboard-card p,
  .feature-panel p,
  .footer-copy {
    color: var(--text-soft);
    line-height: 1.7;
  }

  .hero-banner {
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr);
    gap: 48px;
    align-items: stretch;
  }

  .home-layout {
    display: grid;
    gap: 48px;
  }

  .hero-main {
    padding: 28px 24px 24px;
    background:
      linear-gradient(180deg, rgba(122, 167, 194, 0.08), rgba(122, 167, 194, 0));
    overflow: hidden;
    position: relative;
    border: 0;
    box-shadow: none;
    border-radius: 0;
    backdrop-filter: none;
  }

  .hero-main::after {
    content: "";
    position: absolute;
    width: 220px;
    height: 220px;
    right: 8%;
    top: 0;
    background: radial-gradient(circle, rgba(56, 189, 248, 0.14), transparent 68%);
    pointer-events: none;
    filter: blur(10px);
  }

  .eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 0;
    border-radius: 999px;
    background: transparent;
    border: 0;
    color: #9fb6cb;
    font-size: 0.76rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 14px;
  }

  .hero-title {
    margin: 0 0 18px;
    font-size: clamp(1.72rem, 3.1vw, 2.6rem);
    line-height: 1.08;
    max-width: 560px;
    color: #edf3fa;
    letter-spacing: -0.03em;
  }

  .hero-copy {
    max-width: 560px;
    font-size: 0.98rem;
  }

  .hero-copy-secondary {
    margin-top: 14px;
    color: #b8c7d9;
    font-size: 0.93rem;
  }

  .hero-copy strong {
    color: #edf3fa;
    font-weight: 600;
  }

  .hero-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
    margin-top: 24px;
  }

  .hero-actions .secondary-button {
    background: rgba(21, 34, 50, 0.96);
    border: 1px solid rgba(148, 163, 184, 0.18);
    color: #d7e1ef;
  }

  .signal-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 18px;
    margin-top: 48px;
  }

  .signal-box {
    padding: 22px 22px 24px;
    border-radius: 24px;
    background: linear-gradient(180deg, rgba(18, 29, 44, 0.72), rgba(14, 24, 37, 0.5));
    border: 1px solid rgba(154, 169, 189, 0.08);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.02);
  }

  .signal-box span {
    display: block;
    color: #8ea8be;
    font-size: 0.76rem;
    margin-bottom: 10px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    line-height: 1.4;
  }

  .signal-box strong {
    font-size: 1.08rem;
    color: #edf3fa;
    line-height: 1.45;
  }

  .hero-side {
    display: grid;
    gap: 24px;
    align-content: start;
    padding-top: 34px;
  }

  .feature-panel {
    padding: 0;
    background: transparent;
    border: 0;
    box-shadow: none;
    border-radius: 0;
    backdrop-filter: none;
  }

  .feature-panel h3,
  .dashboard-card h3,
  .result-card h3,
  .result-card h4,
  .content-card h3 {
    margin-top: 0;
    color: #edf3fa;
  }

  .mini-list {
    margin: 0;
    padding-left: 18px;
    color: #bdcadd;
    line-height: 1.7;
  }

  .feature-panel-soft {
    padding: 24px 0 22px;
    border-bottom: 1px solid rgba(154, 169, 189, 0.14);
  }

  .feature-panel-list .mini-list {
    display: grid;
    gap: 10px;
  }

  .home-section {
    display: grid;
    gap: 22px;
  }

  .section-heading {
    max-width: 640px;
  }

  .section-heading h2 {
    margin: 0 0 10px;
    color: #edf3fa;
    font-size: clamp(1.4rem, 2.2vw, 1.95rem);
    letter-spacing: -0.02em;
  }

  .section-heading p {
    margin: 0;
    color: var(--text-soft);
    line-height: 1.7;
  }

  .section-divider {
    height: 1px;
    border: 0;
    margin: 0;
    background: linear-gradient(90deg, transparent, rgba(154, 169, 189, 0.28), transparent);
  }

  .dashboard-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
    gap: 20px;
  }

  .dashboard-card {
    padding: 26px;
    transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
    background: linear-gradient(180deg, rgba(19, 33, 50, 0.82), rgba(13, 22, 34, 0.88));
  }

  .dashboard-card:hover {
    transform: translateY(-6px);
    border-color: rgba(96, 165, 250, 0.32);
    box-shadow: 0 24px 58px rgba(6, 24, 52, 0.48);
  }

  .workflow-card {
    position: relative;
    overflow: hidden;
    background:
      linear-gradient(180deg, rgba(20, 31, 43, 0.86), rgba(13, 22, 34, 0.74));
    border-color: rgba(154, 169, 189, 0.14);
    box-shadow: 0 20px 44px rgba(6, 24, 52, 0.24);
  }

  .workflow-card::before {
    content: "";
    position: absolute;
    inset: 0 auto 0 0;
    width: 4px;
    background: #f2c94c;
  }

  .workflow-card::after {
    content: "";
    position: absolute;
    right: 18px;
    top: 18px;
    width: 12px;
    height: 12px;
    border-radius: 999px;
    background: rgba(242, 201, 76, 0.9);
  }

  .workflow-card .tool-kicker {
    color: #f2c94c;
  }

  .workflow-card h3 {
    max-width: 220px;
  }

  .workflow-card p,
  .workflow-card h3,
  .workflow-card .tool-kicker {
    padding-left: 8px;
  }

  .service-card {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0;
    align-items: start;
    background: rgba(18, 29, 44, 0.84);
    border: 1px solid rgba(154, 169, 189, 0.12);
    border-radius: 24px;
    box-shadow: 0 18px 40px rgba(6, 24, 52, 0.16);
    padding: 26px;
  }

  .service-card:hover {
    transform: translateY(-4px);
    border-color: rgba(122, 167, 194, 0.24);
    box-shadow: 0 24px 58px rgba(6, 24, 52, 0.32);
  }

  .service-content {
    display: grid;
    gap: 12px;
  }

  .service-meta {
    color: #aab8c8;
    font-size: 0.92rem;
  }

  .service-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .service-tag {
    color: #b8c7d9;
    font-size: 0.88rem;
    font-weight: 600;
    letter-spacing: 0.02em;
  }

  .service-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: fit-content;
    min-width: 118px;
    padding: 10px 16px;
    border-radius: 999px;
    background: #f2c94c;
    color: #1a2430;
    font-weight: 700;
  }

  .service-link:hover {
    background: #f5d76c;
  }

  .dashboard-card .tool-kicker {
    color: #9cc0d3;
    font-size: 0.86rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 12px;
    display: block;
  }

  .dashboard-card .tool-arrow {
    margin-top: 18px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: #d7e3ef;
    font-weight: 700;
  }

  .badge-row {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 18px;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 999px;
    font-size: 0.9rem;
    font-weight: 600;
    border: 1px solid transparent;
  }

  .badge.safe {
    background: rgba(34, 197, 94, 0.12);
    color: #86efac;
    border-color: rgba(34, 197, 94, 0.22);
  }

  .badge.suspicious {
    background: rgba(251, 191, 36, 0.12);
    color: #fde68a;
    border-color: rgba(251, 191, 36, 0.22);
  }

  .badge.high {
    background: rgba(244, 63, 94, 0.12);
    color: #fda4af;
    border-color: rgba(244, 63, 94, 0.22);
  }

  .field-group {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 18px;
  }

  .field-label {
    font-weight: 700;
    color: #d7e1ef;
  }

  .field-input,
  .field-textarea {
    width: 100%;
    padding: 14px 16px;
    border-radius: 16px;
    border: 1px solid rgba(148, 163, 184, 0.16);
    background: rgba(13, 23, 36, 0.9);
    font: inherit;
    color: #e8eef7;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.02);
  }

  .field-input::placeholder,
  .field-textarea::placeholder {
    color: #8d9eb4;
  }

  .field-textarea {
    min-height: 180px;
    resize: vertical;
  }

  .button-row {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .primary-button,
  .secondary-button {
    border: none;
    border-radius: 16px;
    padding: 12px 18px;
    font: inherit;
    font-weight: 700;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
  }

  .primary-button {
    background: linear-gradient(135deg, #56789a 0%, #7aa7c2 100%);
    color: white;
    box-shadow: 0 16px 30px rgba(60, 89, 117, 0.28);
  }

  .primary-button:hover {
    transform: translateY(-2px);
  }

  .primary-button:disabled,
  .secondary-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .secondary-button {
    background: rgba(21, 34, 50, 0.96);
    color: #d7e1ef;
    border: 1px solid rgba(148, 163, 184, 0.14);
  }

  .result-card {
    padding: 24px;
    background: linear-gradient(180deg, rgba(18, 31, 48, 0.92), rgba(13, 22, 35, 0.88));
  }

  .result-head {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }

  .score-pill {
    padding: 10px 14px;
    border-radius: 999px;
    color: white;
    font-weight: 700;
  }

  .score-pill.safe {
    background: var(--safe);
  }

  .score-pill.suspicious {
    background: #ca8a04;
  }

  .score-pill.risk {
    background: #d97706;
  }

  .score-pill.high {
    background: #e11d48;
  }

  .result-card ul {
    padding-left: 18px;
    color: #c7d2e1;
    line-height: 1.7;
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
    gap: 14px;
    margin-top: 18px;
  }

  .metric-box {
    padding: 16px;
    border-radius: 18px;
    background: rgba(13, 23, 36, 0.9);
    border: 1px solid rgba(148, 163, 184, 0.12);
    color: #aebccc;
  }

  .metric-box strong {
    display: block;
    margin-top: 6px;
    font-size: 1.2rem;
    color: #edf3fa;
  }

  .file-hint,
  .muted {
    color: var(--text-soft);
  }

  .code-block {
    white-space: pre-wrap;
    word-break: break-word;
    background: rgba(4, 11, 23, 0.94);
    color: #d7e2ef;
    padding: 18px;
    border-radius: 20px;
    overflow-x: auto;
    border: 1px solid rgba(148, 163, 184, 0.14);
  }

  .email-checker-page {
    display: grid;
    gap: 34px;
  }

  .email-hero {
    display: grid;
    grid-template-columns: minmax(0, 1.35fr) minmax(260px, 0.65fr);
    gap: 30px;
    align-items: end;
    padding: 10px 0 6px;
  }

  .email-hero-copy h2,
  .email-support-section h2 {
    margin: 0;
    color: #edf3fa;
    font-size: clamp(1.7rem, 3vw, 2.55rem);
    line-height: 1.12;
    max-width: 720px;
    letter-spacing: -0.02em;
  }

  .email-hero-copy p {
    margin: 16px 0 0;
    color: var(--text-soft);
    max-width: 690px;
    line-height: 1.75;
  }

  .email-hero-metrics {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    padding: 16px;
    border-radius: 8px;
    border: 1px solid rgba(154, 169, 189, 0.12);
    background: rgba(12, 23, 36, 0.74);
  }

  .email-hero-metrics div {
    display: grid;
    gap: 8px;
    min-width: 0;
  }

  .email-hero-metrics span,
  .email-input-stats span,
  .tool-kicker {
    color: #91a6bb;
    font-size: 0.76rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .email-hero-metrics strong {
    color: #edf3fa;
    font-size: 0.95rem;
    line-height: 1.35;
  }

  .email-tool-shell {
    padding: 26px;
    border-radius: 8px;
    border: 1px solid rgba(154, 169, 189, 0.14);
    background:
      linear-gradient(180deg, rgba(18, 31, 48, 0.92), rgba(10, 19, 31, 0.96));
    box-shadow: 0 22px 58px rgba(3, 9, 18, 0.32);
  }

  .email-tool-header {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 18px;
    margin-bottom: 22px;
    padding-bottom: 18px;
    border-bottom: 1px solid rgba(154, 169, 189, 0.12);
  }

  .email-tool-header h2,
  .result-panel-head h2 {
    margin: 8px 0 0;
    color: #edf3fa;
    letter-spacing: -0.01em;
  }

  .email-input-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .email-input-stats span {
    padding: 8px 11px;
    border-radius: 999px;
    border: 1px solid rgba(154, 169, 189, 0.12);
    background: rgba(13, 23, 36, 0.82);
    color: #c8d5e4;
  }

  .email-tool-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.08fr) minmax(320px, 0.92fr);
    gap: 22px;
    align-items: stretch;
  }

  .email-compose-panel,
  .email-result-panel,
  .email-support-grid article {
    border-radius: 8px;
    border: 1px solid rgba(154, 169, 189, 0.12);
    background: rgba(12, 23, 36, 0.64);
  }

  .email-compose-panel,
  .email-result-panel {
    padding: 22px;
  }

  .email-compose-panel .field-textarea {
    min-height: 430px;
    line-height: 1.65;
    border-radius: 8px;
    background: rgba(5, 12, 22, 0.72);
  }

  .email-analyze-button {
    min-width: 160px;
  }

  .email-error {
    margin-top: 14px;
  }

  .result-panel-head {
    margin-bottom: 16px;
  }

  .email-result-panel .result-card {
    border-radius: 8px;
    box-shadow: none;
    background: rgba(8, 16, 27, 0.72);
  }

  .email-empty-result {
    min-height: 340px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 12px;
    padding: 26px;
    border-radius: 8px;
    border: 1px dashed rgba(154, 169, 189, 0.18);
    background: rgba(6, 14, 24, 0.52);
  }

  .email-empty-result strong {
    color: #edf3fa;
    font-size: 1.15rem;
  }

  .email-empty-result p {
    margin: 0;
    color: var(--text-soft);
    line-height: 1.7;
  }

  .empty-result-lines {
    display: grid;
    gap: 10px;
    margin-top: 14px;
  }

  .empty-result-lines span {
    height: 10px;
    width: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, rgba(122, 167, 194, 0.18), rgba(122, 167, 194, 0.04));
  }

  .empty-result-lines span:nth-child(2) {
    width: 82%;
  }

  .empty-result-lines span:nth-child(3) {
    width: 62%;
  }

  .email-support-section {
    display: grid;
    gap: 22px;
    padding-top: 8px;
  }

  .email-support-section h2 {
    margin-top: 8px;
    font-size: clamp(1.45rem, 2.2vw, 2rem);
  }

  .email-support-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 18px;
  }

  .email-support-grid article {
    padding: 22px;
  }

  .email-support-grid h3 {
    margin: 0 0 10px;
    color: #edf3fa;
  }

  .email-support-grid p {
    margin: 0;
    color: var(--text-soft);
    line-height: 1.65;
  }

  .footer-shell {
    background: linear-gradient(180deg, rgba(9, 18, 29, 0.98), rgba(6, 13, 21, 0.98));
    border: 0;
    border-top: 1px solid var(--border);
    border-radius: 0;
    box-shadow: none;
    backdrop-filter: none;
    padding: 34px 24px 22px;
  }

  .footer-wrap {
    margin-top: auto;
    width: 100%;
  }

  .footer-inner {
    max-width: 1240px;
    margin: 0 auto;
    width: 100%;
    display: grid;
    grid-template-columns: minmax(280px, 1.7fr) minmax(170px, 0.8fr) minmax(210px, 0.9fr);
    gap: 52px;
    align-items: start;
  }

  .footer-brand {
    display: flex;
    flex-direction: column;
    gap: 18px;
    align-items: flex-start;
  }

  .footer-brand .logo-slot {
    width: 190px;
    height: 50px;
  }

  .topbar .logo-slot {
    width: 290px;
    height: 78px;
  }

  .footer-copy {
    max-width: 460px;
    margin: 0;
    font-size: 0.96rem;
  }

  .footer-column h4 {
    margin: 0 0 16px;
    color: #edf3fa;
    font-size: 0.82rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .footer-links {
    display: grid;
    gap: 12px;
  }

  .footer-column {
    min-width: 0;
  }

  .footer-link {
    color: #b8c7d9;
    font-size: 0.95rem;
    transition: color 0.2s ease, transform 0.2s ease;
  }

  .footer-link:hover {
    color: #edf3fa;
    transform: translateX(2px);
  }

  .footer-note {
    max-width: 1240px;
    margin: 28px auto 0;
    padding-top: 18px;
    border-top: 1px solid rgba(154, 169, 189, 0.12);
    color: #7f97bb;
    font-size: 0.88rem;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 12px;
  }

  @media (max-width: 960px) {
    .topbar-inner,
    .hero-banner,
    .footer-inner {
      grid-template-columns: 1fr;
      flex-direction: column;
    }

    .topbar-inner {
      align-items: flex-start;
    }

    .nav-links {
      justify-content: flex-start;
    }

    .footer-inner {
      gap: 30px;
    }

    .hero-banner {
      gap: 28px;
    }

    .email-hero,
    .email-tool-grid,
    .email-support-grid {
      grid-template-columns: 1fr;
    }

    .hero-side {
      padding-top: 0;
    }
  }

  @media (max-width: 720px) {
    .topbar .logo-slot {
      width: 210px;
      height: 58px;
    }

    .footer-brand .logo-slot {
      width: 170px;
      height: 46px;
    }

    .hero-card,
    .content-card,
    .hero-main {
      padding: 22px;
    }

    .page-main,
    .topbar,
    .footer-shell {
      padding-left: 16px;
      padding-right: 16px;
    }

    .page-main {
      padding-top: 28px;
      padding-bottom: 48px;
    }

    .home-layout {
      gap: 36px;
    }

    .signal-grid {
      grid-template-columns: 1fr;
    }

    .service-card {
      grid-template-columns: 1fr;
      padding: 20px;
    }

    .email-tool-shell,
    .email-compose-panel,
    .email-result-panel,
    .email-support-grid article {
      padding: 18px;
    }

    .email-hero-metrics {
      grid-template-columns: 1fr;
    }

    .email-compose-panel .field-textarea,
    .email-empty-result {
      min-height: 340px;
    }

    .hero-main {
      padding: 22px 18px 18px;
    }

    .feature-panel-soft {
      padding-top: 0;
    }
  }
`;

const navItems = [
  { path: "/", label: "Home" },
  { path: "/link-checker", label: "Link Checker" },
  { path: "/email-checker", label: "Email Checker" },
];

function LogoMark() {
  return (
    <div className="logo-slot" aria-hidden="true">
      <img className="logo-image" src="/logo-transparent.png" alt="" />
    </div>
  );
}

function NavBar() {
  const location = useLocation();

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="brand-lockup">
          <LogoMark />
        </div>
        <nav className="nav-links">
          {navItems.map((item) => {
            const isActive =
              item.path === "/"
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);

            return (
              <Link key={item.path} className={`nav-pill ${isActive ? "active" : ""}`} to={item.path}>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="footer-wrap">
      <div className="footer-shell">
        <div className="footer-inner">
          <div className="footer-brand">
            <LogoMark />
            <p className="footer-copy">
              Practical fraud screening for suspicious links and emails, with clear scoring and readable explanations
              for faster decisions.
            </p>
          </div>

          <div className="footer-column">
            <h4>Quick Links</h4>
            <div className="footer-links">
              <Link className="footer-link" to="/">
                Home
              </Link>
              <Link className="footer-link" to="/link-checker">
                Link Checker
              </Link>
              <Link className="footer-link" to="/email-checker">
                Email Checker
              </Link>
            </div>
          </div>

          <div className="footer-column">
            <h4>Why It Helps</h4>
            <div className="footer-links">
              <span className="footer-link">Rule-based scoring</span>
              <span className="footer-link">Fast risk explanations</span>
              <span className="footer-link">Simple review workflows</span>
            </div>
          </div>
        </div>
        <div className="footer-note">
          <span>Built for safer reviews and clearer decisions.</span>
          <span>Rule-based fraud detection toolkit</span>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <>
      <style>{appStyles}</style>
      <div className="app-shell">
        <NavBar />
        <main className="page-main">
          <div className="page-wrap">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/link-checker" element={<LinkChecker />} />
              <Route path="/email-checker" element={<EmailChecker />} />
              <Route path="/bank-statement-checker" element={<BankStatementChecker />} />
            </Routes>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
