const express = require('express');
const pool = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query('SELECT * FROM theatres ORDER BY name');
    res.json(rows);
  } catch (error) {
    console.error('THEATRES ERROR:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    if (conn) conn.release();
  }
});

module.exports = router;
