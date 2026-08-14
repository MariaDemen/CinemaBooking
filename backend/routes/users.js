const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

const router = express.Router();

router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query('SELECT user_id, name, email, role, created_at FROM users ORDER BY user_id');
    res.json(rows);
  } catch (error) {
    console.error('GET USERS ERROR:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    if (conn) conn.release();
  }
});

router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  let conn;
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;
    conn = await pool.getConnection();
    await conn.query('UPDATE users SET name = ?, email = ?, role = ? WHERE user_id = ?', [name, email, role, id]);
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('UPDATE USER ERROR:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    if (conn) conn.release();
  }
});

router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  let conn;
  try {
    const { id } = req.params;
    conn = await pool.getConnection();
    await conn.query('DELETE FROM reservations WHERE user_id = ?', [id]);
    await conn.query('DELETE FROM users WHERE user_id = ?', [id]);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('DELETE USER ERROR:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    if (conn) conn.release();
  }
});

module.exports = router;
