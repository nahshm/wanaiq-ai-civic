#!/usr/bin/env python3
import sqlite3
import os

# Connect to the database
db_path = 'src/instance/wanaiq.db'
conn = sqlite3.connect(db_path)

# Read and execute the migration
with open('src/database/migrations/baraza_tables.sql', 'r') as f:
    sql = f.read()

conn.executescript(sql)
conn.commit()
conn.close()

print('Migration applied successfully')
