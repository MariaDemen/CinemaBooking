@echo off
echo Installing backend dependencies...
cd backend
call npm install
cd ..
echo Installing frontend dependencies...
cd frontend
call npm install --legacy-peer-deps
cd ..
echo Done.
pause
