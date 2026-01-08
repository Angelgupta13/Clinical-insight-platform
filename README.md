# Clinical Insight Platform v2.0

## 🚀 Overview
The **Clinical Insight Platform** is a next-generation dashboard designed to harmonize, analyze, and monitor clinical trial data. It aggregates disparate data sources (EDC, Safety, Visits, Labs, Coding, EDRR, Inactivated Forms) into a unified **Risk Command Center**, powered by Agentic AI to provide proactive operational recommendations.

## ✨ Key Features

### Data Integration Layer
- **Unified Data Processing**: Combines all 9 clinical data file types into a single view
- **Data Sources Supported**:
  - EDC Metrics (Subject Level Metrics)
  - Missing Pages Report
  - Visit Projection Tracker (Missing Visits)
  - SAE Dashboard (DM & Safety tabs)
  - MedDRA Coding Reports
  - WHODD Coding Reports
  - Lab Metrics (Missing Lab Names/Ranges)
  - EDRR (Edit Check Discrepancy Reports)
  - Inactivated Forms/Folders Report

### Core Analytics
- **Data Quality Index (DQI)**: Composite scoring system with weighted components:
  - Visit Completeness (30%)
  - Query Resolution (25%)
  - SDV Status (20%)
  - Coding Completeness (15%)
  - Form Signatures (10%)
- **Composite Risk Modeling**: Weighted risk score calculation with breakdown
- **Clean Patient Status**: Track data cleanliness at patient level
- **% Missing Pages/CRF Calculations**: Real-time completeness metrics

### Interactive Dashboard
- **Portfolio Risk Heatmap**: Visual risk distribution across all studies
- **DQI Visualization**: Circular progress with component breakdown
- **Quality Assurance Report**: Sortable, filterable study table
- **Study Drill-Down Modal**: Click any study for detailed metrics, DQI breakdown, and recommendations
- **Glassmorphism Design**: Premium executive-style interface

### AI-Powered Features
- **Generative AI Agent**: Natural language query processing with Gemini integration
- **Intent Detection**: Recognizes risk, DQI, study, site, and recommendation queries
- **Auto-Generated Recommendations**: Actionable suggestions based on metrics
- **Markdown-Rendered Responses**: Rich formatted AI outputs

### Collaboration Tools
- **Alerts System**: Critical/Warning/Info alerts with filtering
- **Comments/Notes**: Add notes to studies with @mentions
- **Team Notifications**: Notify role-based teams (CRA, DM, Safety, QA, etc.)
- **Acknowledgment Tracking**: Track who addressed which alerts

## 🛠️ Tech Stack
- **Frontend**: Next.js 14, React, Tailwind CSS, Framer Motion, Lucide React
- **Backend**: FastAPI, Pandas, Google Generative AI (Gemini)
- **Architecture**: Decoupled Client-Server with RESTful API

## 📦 Installation

### Prerequisites
- Node.js 18+
- Python 3.10+
- Google Gemini API Key (Optional, for GenAI features)

### Backend Setup
```bash
cd backend

# Create virtual environment (optional but recommended)
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -e .

# Or using uv (faster)
uv pip install -e .

# Run the server
python main.py
```
Server will start at `http://localhost:8000`

### Frontend Setup
```bash
cd frontend

# Install dependencies
pnpm install
# or: npm install

# Run the development server
pnpm run dev
# or: npm run dev
```
App will start at `http://localhost:3000`

## 🧪 Data Configuration
Place your anonymized study reports in the `dataset/QC Anonymized Study Files/` directory. Each study should have its own folder containing:
- `*EDC_Metrics*.xlsx`
- `*Missing_Pages*.xlsx`
- `*eSAE Dashboard*.xlsx`
- `*Visit Projection Tracker*.xlsx`
- `*Missing_Lab_Name*.xlsx`
- `*MedDRA*.xlsx`
- `*WHODD*.xlsx`
- `*EDRR*.xlsx`
- `*Inactivated*.xlsx`

## 🤖 AI Agent Configuration
To enable the LLM features, set your environment variable:
```bash
# Windows
set GEMINI_API_KEY=your_key_here

# Linux/Mac
export GEMINI_API_KEY="your_key_here"
```
*Note: The system gracefully falls back to a heuristic reasoning engine if no key is provided.*

## 📡 API Endpoints

### Core
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/config` | GET | Current configuration |

### Studies
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/studies` | GET | List all studies (supports sorting, filtering) |
| `/api/studies/{study_id}` | GET | Get detailed study information |
| `/api/studies/{study_id}/sites` | GET | Get site-level breakdown |
| `/api/studies/{study_id}/patients` | GET | Get patient-level data |
| `/api/studies/{study_id}/recommendations` | GET | Get AI recommendations |

### Portfolio
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/portfolio` | GET | High-level portfolio summary |
| `/api/portfolio/risks` | GET | Risk distribution |
| `/api/portfolio/dqi` | GET | DQI overview across studies |

### AI Agent
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/agent?query=...` | GET | Natural language query processing |

### Collaboration
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/alerts` | GET | List alerts (supports filtering) |
| `/api/alerts/count` | GET | Unread alert counts |
| `/api/alerts/{id}/acknowledge` | POST | Acknowledge an alert |
| `/api/comments` | GET/POST | List/Create comments |
| `/api/notifications/{user}` | GET | User notifications |
| `/api/team/roles` | GET | Available team roles |
| `/api/team/notify` | POST | Send team notification |

### Export
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/export/summary` | GET | Export portfolio summary |
| `/api/export/study/{study_id}` | GET | Export study details |

## 📊 DQI Calculation

The Data Quality Index uses a weighted formula:

```
DQI = (0.30 × Visit Completeness Score) +
      (0.25 × Query Resolution Rate) +
      (0.20 × SDV Completion Rate) +
      (0.15 × Coding Completeness) +
      (0.10 × Form Signature Rate)
```

Each component is scored 0-100, resulting in a final DQI of 0-100.

### DQI Levels
| Score | Level |
|-------|-------|
| 90-100 | Excellent |
| 75-89 | Good |
| 60-74 | Fair |
| 40-59 | Poor |
| 0-39 | Critical |

## 📄 License
Proprietary - Prepared for Hackathon Submission
