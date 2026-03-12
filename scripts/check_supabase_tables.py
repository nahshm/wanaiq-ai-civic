import os
from supabase import create_client, Client

SUPABASE_URL = "https://zcnjpczplkbdmmovlrtv.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjbmpwY3pwbGtiZG1tb3ZscnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3MDQyNTMsImV4cCI6MjA3MzI4MDI1M30.NOgtKdqBtqZXFaTkypW0dTfYuPNW-nge7aiqmSeft20"

def main():
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

    try:
        # List tables in public schema
        response = supabase.rpc('pg_catalog.pg_tables').execute()
        if response.error:
            print(f"Error fetching tables: {response.error}")
            return

        # Alternatively, use SQL query to get tables
        sql = """
        SELECT tablename FROM pg_catalog.pg_tables
        WHERE schemaname = 'public';
        """
        tables_response = supabase.postgrest.rpc('sql', {'query': sql}).execute()
        if tables_response.error:
            print(f"Error executing SQL: {tables_response.error}")
            return

        print("Tables in Supabase public schema:")
        for table in tables_response.data:
            print(f"- {table['tablename']}")

        # Check for posts system tables
        expected_tables = ['users', 'communities', 'posts', 'post_media', 'comments']
        missing_tables = [t for t in expected_tables if t not in [table['tablename'] for table in tables_response.data]]

        if missing_tables:
            print(f"Missing expected tables: {missing_tables}")
        else:
            print("All expected posts system tables are present.")

    except Exception as e:
        print(f"Exception during Supabase check: {e}")

if __name__ == "__main__":
    main()
