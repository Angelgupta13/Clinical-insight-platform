# Clinical Insight Platform

## 🚀 Overview
The **Clinical Insight Platform** is a next-generation dashboard designed to harmonize, analyze, and monitor clinical trial data. It aggregates disparate data sources (EDC, Safety, Visits, Labs, Coding) into a unified **Risk Command Center**, powered by Agentic AI to provide proactive operational recommendations.

## ✨ Key Features
- **Data Harmonization**: Unifies 5+ distinct clinical report types into a single data lake.
- **Composite Risk Modeling**: Automatically calculates a "Risk Score" for each study based on Safety, Compliance, and Data Quality metrics.
- **Formal Quality Reporting**: Generates structured audit-ready reports for study portfolio reviews.
- **Agentic AI Co-pilot**: A "Reasoning Chain" agent (integrated with Gemini Pro) that detects anomalies and suggests corrective actions.
- **Premium Interface**: A "Glassmorphism" design system tailored for executive visibility ("Insight Flow" aesthetic).

## 🛠️ Tech Stack
- **Frontend**: Next.js 14, React, Tailwind CSS, Framer Motion, Lucide React.
- **Backend**: FastAPI, Pandas, Google Generative AI (Gemini).
- **Architecture**: Decoupled Client-Server with RESTful API.

## 📦 Installation

### Prerequisites
- Node.js 18+
- Python 3.10+
- Google Gemini API Key (Optional, for GenAI features)

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the server:
   ```bash
   uvicorn main:app --reload
   ```
   Server will start at `http://localhost:8000`.

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   App will start at `http://localhost:3000`.

## 🧪 Data Configuration
Place your anonymized study reports in the `dataset/` directory. The system automatically detects and ingests:
- `EDC_Metrics`
- `Missing_Pages`
- `eSAE Dashboard`
- `Visit Projection Tracker`
- `MedDRA` / `WHODD` coding reports

## 🤖 AI Agent Configuration
To enable the LLM features, set your environment variable:
```bash
export GEMINI_API_KEY="your_key_here"
```
*Note: The system gracefully falls back to a heuristic reasoning engine if no key is provided.*

## 📄 License
Proprietary - Prepared for Code Submission.
