#!/bin/sh
# ─────────────────────────────────────────────────────────────────────────────
# CouchDB database initialisation
#
# Creates the 8 PouchDB collections used by the Expense Tracker app and
# enables the single-node cluster mode.
#
# This script is mounted into the couchdb-init service which depends on the
# couchdb service being healthy before running.
# ─────────────────────────────────────────────────────────────────────────────

set -e

COUCH_URL="http://${COUCHDB_USER}:${COUCHDB_PASSWORD}@couchdb:5984"

echo "[init] Waiting for CouchDB..."
until curl -sf "${COUCH_URL}/_up" > /dev/null 2>&1; do
  sleep 2
done
echo "[init] CouchDB is up."

# ── Single-node cluster setup ─────────────────────────────────────────────────
echo "[init] Enabling single-node cluster..."
curl -sf -X POST "${COUCH_URL}/_cluster_setup" \
  -H "Content-Type: application/json" \
  -d "{\"action\":\"enable_single_node\",\"username\":\"${COUCHDB_USER}\",\"password\":\"${COUCHDB_PASSWORD}\",\"bind_address\":\"0.0.0.0\",\"port\":5984,\"singlenode\":true}" \
  > /dev/null || echo "[init] Cluster already configured."

# ── Create PouchDB databases ──────────────────────────────────────────────────
for DB in accounts transactions categories creditcards loans budgets recurring shared; do
  STATUS=$(curl -sf -o /dev/null -w "%{http_code}" -X PUT "${COUCH_URL}/${DB}" || true)
  if [ "${STATUS}" = "201" ]; then
    echo "[init] Created database: ${DB}"
  elif [ "${STATUS}" = "412" ]; then
    echo "[init] Database already exists: ${DB}"
  else
    echo "[init] WARNING: unexpected status ${STATUS} for database ${DB}"
  fi
done

echo "[init] Initialization complete."
