import pandas as pd
import io

try:
    with open("last_upload_debug.csv", "r", encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    df = pd.read_csv(io.StringIO(content), sep=None, engine='python')
    print(f"Columns: {df.columns.tolist()}")
    
    # Check values in relevant columns
    cols = ['Abundance', 'Nativeness', 'Conservation Status', 'Occurrence', 'Record Status']
    for col in cols:
        if col in df.columns:
            print(f"\nValue counts for {col}:")
            print(df[col].value_counts().head(10))

except Exception as e:
    print(f"Error: {e}")
