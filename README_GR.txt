MyTheaterBooking_MoreStyle

ΠΕΡΙΓΡΑΦΗ
Full-stack εφαρμογή κρατήσεων θεατρικών παραστάσεων με React Native / Expo frontend, Node.js / Express backend και MariaDB / MySQL βάση.
Το UI είναι εμπνευσμένο από σύγχρονες ticketing πλατφόρμες τύπου more.com: dark theme, cards, εικόνες, θέατρα, events και εισιτήρια.

ΔΟΜΗ
backend/      Node.js API
frontend/     Expo app / web app
database/     setup.sql για MariaDB/XAMPP

ΠΡΙΝ ΤΟ ΤΡΕΞΙΜΟ
1) Εγκατάσταση Node.js LTS.
2) XAMPP -> Start MySQL.
3) Δημιούργησε backend/.env αντιγράφοντας το backend/.env.example.
4) Κάνε import τη βάση:
   - είτε τρέχοντας IMPORT_DATABASE.bat
   - είτε phpMyAdmin -> Import -> database/setup.sql

DEFAULT .env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=theater_booking
JWT_SECRET=my_super_secret_jwt_key

ΕΓΚΑΤΑΣΤΑΣΗ
Τρέξε:
INSTALL_DEPENDENCIES.bat

Αν δεν δουλέψει, χειροκίνητα:
1ο terminal:
cd backend
npm install

2ο terminal:
cd frontend
npm install --legacy-peer-deps

ΕΚΚΙΝΗΣΗ
Backend:
START_BACKEND.bat
ή χειροκίνητα:
cd backend
node server.js

Frontend για browser:
START_FRONTEND_WEB.bat
ή:
cd frontend
npx expo start --web -c

Frontend για κινητό Expo Go:
START_FRONTEND_LAN.bat
ή:
cd frontend
npx expo start --lan -c

ΣΗΜΑΝΤΙΚΟ ΓΙΑ IP
- Για browser στον ίδιο υπολογιστή το frontend/api.js πρέπει να έχει:
  http://127.0.0.1:5000
- Για Expo Go σε κινητό πρέπει να έχει την IP του υπολογιστή, π.χ.:
  http://192.168.x.x:5000
- Την IP τη βρίσκεις με ipconfig -> IPv4 Address.
- Το κινητό και ο υπολογιστής πρέπει να είναι στο ίδιο Wi-Fi ή hotspot.

Για την database:
Την εισαγουμε στο xamp πατωντας mysql -> admin -> εισαγωγη -> databse/setup.sql

Το αρχειο .env.example.txt αλλαζει ονομα σε .env

DEFAULT LOGINS
Admin:
email: admin@test.com
password: 123456

User:
email: user@test.com
password: 123456

FEATURES
User:
- Register / Login
- Προβολή παραστάσεων
- Προβολή θεάτρων
- Αναζήτηση παραστάσεων
- Κράτηση εισιτηρίων
- Προβολή και ακύρωση κρατήσεων

Admin:
- Admin Panel
- Add / Edit / Delete παραστάσεων
- Image URL ή upload εικόνας
- Προβολή όλων των users
- Add / Edit / Delete users
- Αλλαγή role user/admin


