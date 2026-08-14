@echo off
echo Importing theater_booking database...
"C:\xampp\mysql\bin\mysql.exe" -u root < database\setup.sql
echo Done.
pause
