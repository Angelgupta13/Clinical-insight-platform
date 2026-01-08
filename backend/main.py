from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os

app = FastAPI(title="Clinical Trial Insight Platform")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development convenience
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {"status": "ok", "message": "Clinical Insight Platform Backend is running"}

@app.get("/config")
def get_config():
    # Return current configuration/paths for debugging
    return {
        "dataset_path": r"c:\Users\angel gupta\Desktop\project\dataset",
        "cwd": os.getcwd()
    }

@app.get("/api/studies")
def list_studies():
    from data_processor import get_all_studies_summary
    return get_all_studies_summary()

@app.get("/api/agent")
def ask_agent(query: str):
    from agent import process_query
    response = process_query(query)
    return {"response": response}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
