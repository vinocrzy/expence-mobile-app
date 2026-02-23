# ─────────────────────────────────────────────────────────────────────────────
# Expense Tracker — Expo Metro Bundler (Development server)
#
# Runs the Expo / Metro dev server so that physical devices or emulators
# on the same network can load the JS bundle over LAN/tunnel.
#
# Usage (via docker-compose):
#   docker compose up metro
#
# Ports:
#   8081  → Metro bundler (JS bundle endpoint)
#   19000 → Expo Go (legacy protocol)
#   19001 → Expo DevTools WS
#   19002 → Expo DevTools UI
# ─────────────────────────────────────────────────────────────────────────────

FROM node:22-slim AS base

# ── System dependencies ───────────────────────────────────────────────────────
# git  : required by some postinstall scripts
# python3 / make / g++ : native module compilation (e.g. pouchdb-adapter-*)
RUN apt-get update && apt-get install -y --no-install-recommends \
      git \
      curl \
      python3 \
      make \
      g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ── Install JS dependencies ───────────────────────────────────────────────────
# Copy manifests first so Docker can cache this layer independently of source
COPY package.json package-lock.json* yarn.lock* ./
RUN npm install --legacy-peer-deps

# ── Copy project source ───────────────────────────────────────────────────────
COPY . .

# ── Expose ports ─────────────────────────────────────────────────────────────
EXPOSE 8081 19000 19001 19002

# ── Metro / Expo config ───────────────────────────────────────────────────────
# Let Metro listen on all interfaces so the host machine can connect
ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
# Do NOT set CI=1 — it disables hot reload / watch mode in Metro

# ── Start Expo ────────────────────────────────────────────────────────────────
# --host lan   → advertise the container's LAN IP (override with METRO_HOST env)
# --no-install → skip auto dependency installation inside the container
CMD ["npx", "expo", "start", "--host", "lan", "--port", "8081"]
