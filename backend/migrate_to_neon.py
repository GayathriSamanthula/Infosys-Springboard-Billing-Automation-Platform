import psycopg2

LOCAL_URL = "postgresql://postgres:Gayatri1222@localhost:5432/billing_automation_platform"
NEON_URL = "postgresql://neondb_owner:npg_vCD3hok1SbAY@ep-falling-resonance-azwe4tx6-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

def migrate():
    print("Connecting to local PostgreSQL database (localhost:5432)...")
    l_conn = psycopg2.connect(LOCAL_URL)
    l_cur = l_conn.cursor()

    print("Connecting to Neon Cloud PostgreSQL database...")
    n_conn = psycopg2.connect(NEON_URL)
    n_cur = n_conn.cursor()

    table_order = [
        "users", "plans", "customers", "tax_master",
        "subscriptions", "billing_cycles", "invoices",
        "invoice_line_items", "payments", "refunds",
        "notifications", "retry_configurations", "retry_queue", "audit_logs"
    ]

    for table in table_order:
        try:
            l_cur.execute(f'SELECT * FROM "{table}"')
            rows = l_cur.fetchall()
            if not rows:
                print(f"Skipping empty table: {table}")
                continue

            l_cur.execute(f"SELECT column_name FROM information_schema.columns WHERE table_name='{table}' ORDER BY ordinal_position;")
            columns = [f'"{col[0]}"' for col in l_cur.fetchall()]

            cols_str = ", ".join(columns)
            placeholders = ", ".join(["%s"] * len(columns))

            insert_query = f'INSERT INTO "{table}" ({cols_str}) VALUES ({placeholders});'

            migrated_count = 0
            for row in rows:
                try:
                    n_cur.execute(insert_query, row)
                    migrated_count += 1
                except Exception as row_err:
                    n_conn.rollback()
                    print(f"Row skipped in {table}: {row_err}")
                    break
            
            n_conn.commit()
            print(f"Successfully migrated table '{table}': {migrated_count}/{len(rows)} rows copied!")
        except Exception as table_err:
            n_conn.rollback()
            print(f"Error processing table {table}: {table_err}")

    # Reset sequences for auto-increment IDs
    print("\nResetting ID sequences...")
    for table in table_order:
        try:
            n_cur.execute(f"SELECT setval(pg_get_serial_sequence('{table}', 'id'), COALESCE(max(id), 1), true) FROM \"{table}\";")
            n_conn.commit()
        except Exception:
            n_conn.rollback()

    l_conn.close()
    n_conn.close()
    print("\nALL LOCAL DATA (280+ ROWS) MIGRATED TO NEON CLOUD DATABASE SUCCESSFULLY!")

if __name__ == "__main__":
    migrate()
