#!/bin/bash
# Start the intentionally vulnerable student portal for lab use

echo "=================================================="
echo "  UniPortal - Intentionally Vulnerable Lab App"
echo "  FOR EDUCATIONAL USE ONLY - DO NOT DEPLOY"
echo "=================================================="
echo ""

# Start backend
echo "[1/2] Starting backend on http://localhost:3001 ..."
cd backend && node server.js &
BACKEND_PID=$!

sleep 1

# Start frontend
echo "[2/2] Starting frontend on http://localhost:3000 ..."
cd ../frontend && npm run dev &
FRONTEND_PID=$!

echo ""
echo "  App ready at: http://localhost:3000"
echo ""
echo "  Demo accounts (password: password123)"
echo "    student1@uni.edu"
echo "    student2@uni.edu"
echo "    lecturer@uni.edu"
echo ""
echo "Press Ctrl+C to stop both servers."
echo ""

# Wait and clean up on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM
wait
