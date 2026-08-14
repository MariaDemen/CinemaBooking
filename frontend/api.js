import axios from 'axios';

// Για browser στον ίδιο υπολογιστή κράτα 127.0.0.1.
// Για Expo Go σε κινητό άλλαξε το σε http://Η_IP_ΤΟΥ_PC:5000.
const API = axios.create({
  baseURL: 'http://127.0.0.1:5000'
});

export default API;
