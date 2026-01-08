"""
Test script for Clinical Insight Platform data processing.
Run this to verify data loading and API functionality.
"""
import sys
import json

def test_data_processor():
    """Test data processor functionality."""
    print("=" * 60)
    print("CLINICAL INSIGHT PLATFORM - DATA PROCESSOR TEST")
    print("=" * 60)
    
    from data_processor import (
        find_study_folders, 
        get_all_studies_summary, 
        get_portfolio_summary,
        DATASET_ROOT
    )
    
    print(f"\n📁 Dataset Root: {DATASET_ROOT}")
    
    # Test 1: Find study folders
    print("\n1️⃣ Finding study folders...")
    folders = find_study_folders()
    print(f"   Found {len(folders)} study folders")
    
    if not folders:
        print("   ❌ No study folders found! Check DATASET_ROOT path.")
        return False
    
    print(f"   ✅ First study: {folders[0][:50]}...")
    
    # Test 2: Get all study summaries
    print("\n2️⃣ Loading study summaries (this may take a moment)...")
    summaries = get_all_studies_summary()
    print(f"   Loaded {len(summaries)} study summaries")
    
    # Test 3: Check critical fields
    print("\n3️⃣ Validating data structure...")
    
    errors = []
    for s in summaries[:3]:
        study_id = s.get('study_id', 'Unknown')
        
        # Check total_subjects is not 0 (would indicate load_edc_metrics bug)
        if s.get('total_subjects', 0) == 0:
            errors.append(f"   ⚠️ {study_id}: total_subjects is 0")
        
        # Check DQI exists
        if 'dqi' not in s:
            errors.append(f"   ❌ {study_id}: Missing DQI")
        
        # Check risk exists
        if 'risk' not in s:
            errors.append(f"   ❌ {study_id}: Missing risk score")
    
    if errors:
        for e in errors:
            print(e)
    else:
        print("   ✅ All critical fields present")
    
    # Test 4: Print sample summary
    print("\n4️⃣ Sample Study Summary:")
    print("-" * 40)
    
    for s in summaries[:3]:
        print(f"\n📊 {s.get('study_name', s.get('study_id'))}")
        print(f"   Subjects: {s.get('total_subjects', 0)}")
        print(f"   Risk: {s.get('risk', {}).get('level', 'Unknown')} (Score: {s.get('risk', {}).get('raw_score', 0)})")
        print(f"   DQI: {s.get('dqi', {}).get('score', 0)}% ({s.get('dqi', {}).get('level', 'Unknown')})")
        
        metrics = s.get('metrics', {})
        print(f"   Missing Pages: {metrics.get('missing_pages', 0)}")
        print(f"   SAE Issues: {metrics.get('sae_issues', 0)}")
        print(f"   Coding Issues: {metrics.get('coding_issues', 0)}")
        
        # Print recommendations
        recs = s.get('recommendations', [])
        if recs:
            print(f"   Recommendations: {len(recs)}")
            for r in recs[:2]:
                print(f"      - [{r.get('priority')}] {r.get('action')[:50]}...")
    
    # Test 5: Portfolio summary
    print("\n5️⃣ Portfolio Summary:")
    print("-" * 40)
    
    portfolio = get_portfolio_summary()
    print(f"   Total Studies: {portfolio.get('study_count', 0)}")
    print(f"   Total Subjects: {portfolio.get('total_subjects', 0):,}")
    print(f"   Average DQI: {portfolio.get('average_dqi', 0)}%")
    print(f"   Total SAE Issues: {portfolio.get('total_sae_issues', 0)}")
    
    risk_dist = portfolio.get('risk_distribution', {})
    print(f"\n   Risk Distribution:")
    print(f"      🔴 Critical: {risk_dist.get('Critical', 0)}")
    print(f"      🟠 High: {risk_dist.get('High', 0)}")
    print(f"      🟡 Medium: {risk_dist.get('Medium', 0)}")
    print(f"      🟢 Low: {risk_dist.get('Low', 0)}")
    
    print("\n" + "=" * 60)
    print("✅ DATA PROCESSOR TESTS COMPLETE")
    print("=" * 60)
    
    return True


def test_agent():
    """Test AI agent functionality."""
    print("\n" + "=" * 60)
    print("TESTING AI AGENT")
    print("=" * 60)
    
    from agent import process_query, detect_intent, QueryIntent
    
    test_queries = [
        ("Which study is at highest risk?", QueryIntent.RISK_ANALYSIS),
        ("Tell me about Study 15", QueryIntent.STUDY_DETAIL),
        ("What is the DQI score?", QueryIntent.DQI_QUERY),
        ("Give me a portfolio summary", QueryIntent.SUMMARY),
        ("What sites have issues?", QueryIntent.SITE_QUERY),
        ("What should we do?", QueryIntent.RECOMMENDATION),
    ]
    
    print("\n1️⃣ Testing Intent Detection:")
    for query, expected in test_queries:
        parsed = detect_intent(query)
        status = "✅" if parsed.intent == expected else "⚠️"
        print(f"   {status} '{query[:40]}...' -> {parsed.intent.value}")
    
    print("\n2️⃣ Testing Query Processing (first query only):")
    response = process_query("Which study is at highest risk?")
    print(f"\n{response[:500]}...")
    
    print("\n" + "=" * 60)
    print("✅ AGENT TESTS COMPLETE")
    print("=" * 60)


def test_api():
    """Test API endpoint responses (requires running server)."""
    print("\n" + "=" * 60)
    print("TESTING API ENDPOINTS (requires running server)")
    print("=" * 60)
    
    try:
        import requests
        
        base_url = "http://localhost:8000"
        
        endpoints = [
            ("/", "Health Check"),
            ("/config", "Configuration"),
            ("/api/studies?limit=2", "Studies List"),
            ("/api/portfolio", "Portfolio Summary"),
            ("/api/portfolio/risks", "Risk Distribution"),
            ("/api/portfolio/dqi", "DQI Overview"),
        ]
        
        for endpoint, name in endpoints:
            try:
                resp = requests.get(f"{base_url}{endpoint}", timeout=5)
                status = "✅" if resp.status_code == 200 else f"❌ ({resp.status_code})"
                print(f"   {status} {name}: {endpoint}")
            except Exception as e:
                print(f"   ⚠️ {name}: {e}")
        
    except ImportError:
        print("   ⚠️ requests library not installed, skipping API tests")


if __name__ == "__main__":
    # Run data processor tests
    success = test_data_processor()
    
    if success:
        # Run agent tests
        test_agent()
        
        # Optionally test API
        if "--api" in sys.argv:
            test_api()
    else:
        print("\n❌ Data processor tests failed, skipping remaining tests")
        sys.exit(1)
