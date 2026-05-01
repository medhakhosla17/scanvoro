from pydantic import BaseModel, Field


class EmailAnalyzeRequest(BaseModel):
    email_text: str = Field(..., min_length=1, description="Raw email content to analyze")


class SpellingError(BaseModel):
    word: str
    suggestion: str


class SpellingAnalysis(BaseModel):
    errors: list[SpellingError]


class EmailAnalyzeResponse(BaseModel):
    risk_score: int
    risk_level: str
    color: str
    reasons: list[str]
    spelling_analysis: SpellingAnalysis
