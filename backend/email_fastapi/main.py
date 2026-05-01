from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .models import EmailAnalyzeRequest, EmailAnalyzeResponse
from .parsing import parse_email_text
from .scoring import analyze_email_risk

app = FastAPI(
    title="Scanvoro Email Checker API",
    version="1.0.0",
    description="Rule-based phishing and scam email analysis service for Scanvoro.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def healthcheck() -> dict:
    return {"message": "Scanvoro Email FastAPI service is running."}


@app.post("/analyze-email", response_model=EmailAnalyzeResponse)
def analyze_email(payload: EmailAnalyzeRequest) -> EmailAnalyzeResponse:
    parsed = parse_email_text(payload.email_text)
    result = analyze_email_risk(parsed)
    return EmailAnalyzeResponse(**result)
