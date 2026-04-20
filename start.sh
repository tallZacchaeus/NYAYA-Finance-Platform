#!/bin/bash
# NYAYA Finance Platform — start both servers

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Starting Laravel API on port 8001..."
cd "$PROJECT_DIR/api" && php artisan serve --port=8001 &
API_PID=$!

echo "Starting Next.js on port 3000..."
cd "$PROJECT_DIR" && npm run dev -- --port 3000 &
WEB_PID=$!

echo ""
echo "NYAYA Finance Platform is running:"
echo "  Frontend → http://localhost:3000"
echo "  API      → http://localhost:8001"
echo ""
echo "Login credentials (password: password):"
echo "  admin@nyaya.org          → Super Admin   → /admin"
echo "  finance@nyaya.org        → Finance Admin → /finance"
echo "  transport.lead@nyaya.org → Team Lead     → /team-lead"
echo "  requester@nyaya.org      → Requester     → /requester"
echo ""
echo "Press Ctrl+C to stop both servers."

trap "kill $API_PID $WEB_PID 2>/dev/null; exit" INT TERM
wait
