const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const router = express.Router();

/*
=========================================================
REGISTER
=========================================================
*/

router.post('/register', async (req, res) => {
  let conn;

  try {
    const { name, email, password } = req.body;

    // Check required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'Missing fields'
      });
    }

    // Check password length
    if (password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters'
      });
    }

    conn = await pool.getConnection();

    // Check if email already exists
    const existing = await conn.query(
      `
      SELECT user_id
      FROM users
      WHERE email = ?
      `,
      [email]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        message: 'Email already exists'
      });
    }

    // Hash password
    const password_hash = await bcrypt.hash(
      password,
      10
    );

    /*
    Create normal user.

    IMPORTANT:
    New registrations are always "user".
    Admin users should be created/changed separately.
    */

    await conn.query(
      `
      INSERT INTO users
      (
        name,
        email,
        password_hash,
        role
      )
      VALUES (?, ?, ?, ?)
      `,
      [
        name,
        email,
        password_hash,
        'user'
      ]
    );

    return res.status(201).json({
      message: 'User registered successfully'
    });

  } catch (error) {

    console.error(
      'REGISTER ERROR:',
      error
    );

    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });

  } finally {

    if (conn) {
      conn.release();
    }
  }
});


/*
=========================================================
LOGIN
=========================================================
*/

router.post('/login', async (req, res) => {
  let conn;

  try {

    const {
      email,
      password
    } = req.body;

    // Check fields
    if (!email || !password) {
      return res.status(400).json({
        message: 'Missing email or password'
      });
    }

    conn = await pool.getConnection();

    /*
    Get user including role
    */

    const rows = await conn.query(
      `
      SELECT
        user_id,
        name,
        email,
        password_hash,
        role
      FROM users
      WHERE email = ?
      `,
      [email]
    );

    // User not found
    if (rows.length === 0) {
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }

    const user = rows[0];

    /*
    Check password
    */

    const validPassword =
      await bcrypt.compare(
        password,
        user.password_hash
      );

    if (!validPassword) {
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }

    /*
    Create JWT
    */

    const token = jwt.sign(
      {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET ||
        'my_super_secret_jwt_key',
      {
        expiresIn: '2h'
      }
    );

    /*
    Return user + token
    */

    return res.json({
      token,

      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {

    console.error(
      'LOGIN ERROR:',
      error
    );

    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });

  } finally {

    if (conn) {
      conn.release();
    }
  }
});


module.exports = router;