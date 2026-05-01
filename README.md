# Scanvoro - Fraud Detection Toolkit

Scanvoro is a full-stack rule-based fraud detection toolkit for checking links and scam emails.

## Features

- Link fraud checker with URL-based rules
- Email scam checker powered by a modular Python FastAPI service

## Project Structure

```text
Scanvoro/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── App.jsx
│   │   └── main.jsx
├── backend/
│   ├── routes/
│   ├── services/
│   ├── email_fastapi/
│   └── server.js
├── start.bat
├── package.json
└── README.md
```

## One-Command Startup

Scanvoro uses separate frontend and backend services, so both must run in parallel during development.
That is why the project includes:

- a Windows batch file for one-click startup
- a root `package.json` using `concurrently` for a single npm command

### Option A: Windows batch file

Use the root-level [start.bat](C:/Users/Medha/Scanvoro/start.bat).

It:

- opens the FastAPI backend in one terminal
- opens the React frontend in another terminal
- keeps both processes separate so logs are easy to read

Run it by double-clicking `start.bat`, or from a terminal:

```bat
start.bat
```

### Option B: Root npm command

Install the root-level dependency once:

```bash
npm install
```

Then start everything together:

```bash
npm run start
```

Available root scripts:

- `npm run start` -> starts backend and frontend together
- `npm run backend` -> starts only the FastAPI backend
- `npm run frontend` -> starts only the React frontend

## Daily VS Code Workflow

If you open Scanvoro in VS Code and want the simplest repeatable setup, use two terminals.

### Terminal 1: Backend

```bash
cd backend
npm run email
```

This starts the FastAPI email backend on `http://localhost:8000` and automatically uses `backend/.venv`.

### Terminal 2: Frontend

```bash
cd frontend
npm run dev
```

This starts the Vite frontend on `http://localhost:5173` and automatically opens the app in your browser.

### What to run every time

When you open the project again, the normal workflow is:

1. Open VS Code
2. Open terminal 1 and run:

```bash
cd backend
npm run email
```

3. Open terminal 2 and run:

```bash
cd frontend
npm run dev
```

That is all you need for normal development.

## Backend Services

### Express backend

```bash
cd backend
npm install
npm start
```

The Express backend runs on `http://localhost:5000`.

### Email Checker API (FastAPI)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r email_fastapi/requirements.txt
python -m uvicorn email_fastapi.main:app --reload --port 8000
```

The FastAPI email analysis service runs on `http://localhost:8000`.

## Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173`.

## API Endpoints

- `POST /api/check-link`
- `POST /api/check-transactions`
- `POST /api/check-bank`
- `POST /analyze-email` (FastAPI email service)

## Notes

- The toolkit uses rule-based logic only.
- No AI or machine learning models are used.
- The code is kept simple and beginner-friendly while staying modular.
- The email checker uses a dedicated Python FastAPI service with modular parsing and scoring logic.
