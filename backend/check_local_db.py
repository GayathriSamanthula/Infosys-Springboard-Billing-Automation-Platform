import psycopg2

LOCAL_URL = "postgresql://postgres:Gayatri1222@localhost:5432/billing_automation_platform"
NEON_URL = "postgresql://neondb_owner:npg_vCD3hok1SbAY@ep-falling-resonance-azwe4tx6.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

def check():
    print("--- LOCAL POSTGRESQL (localhost:5432) ---")
    l_conn = psycopg2.connect(LOCAL_URL)
    l_cur = l_conn.cursor()
    l_cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public';")
    l_tables = [t[0] for t in l_cur.fetchall()]
    for t in l_tables:
        l_cur.execute(f'SELECT COUNT(*) FROM "{t}";')
        count = l_cur.fetchone()[0]
        print(f"Local {t}: {count} rows")
    l_conn.close()

    print("\n--- NEON CLOUD POSTGRESQL ---")
    n_conn = psycopg2.connect(NEON_URL)
    n_cur = n_conn.cursor()
    n_cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public';")
    n_tables = [t[0] for t in n_cur.fetchall()]
    for t in n_tables:
        n_cur.execute(f'SELECT COUNT(*) FROM "{t}";')
        count = n_cur.fetchone()[0]
        print(f"Neon {t}: {count} rows")
    n_conn.close()

if __name__ == "__main__":
    check()
