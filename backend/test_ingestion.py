from data_processor import get_all_studies_summary, find_study_folders

print("Checking dataset access...")
folders = find_study_folders()
print(f"Found {len(folders)} study folders.")

if folders:
    print(f"First study: {folders[0]}")
    print("Running summary aggregation (this might take a moment)...")
    summary = get_all_studies_summary()
    for s in summary[:3]:
        print(f"Study: {s['study_id']}")
        print(f"  Risk Level: {s['risk']['level']} (Score: {s['risk']['score']})")
        print(f"  Metrics: {s['metrics']}")
else:
    print("No study folders found. Check path.")
