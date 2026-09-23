#!/usr/bin/env bash
set -euo pipefail

for db in rti_identity rti_merchants rti_payments rti_loyalty; do
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    SELECT 'CREATE DATABASE $db'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$db')\gexec
EOSQL
done
