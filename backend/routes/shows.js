const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

/*
========================================================
UPLOAD DIRECTORY
========================================================
*/

const uploadDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/*
========================================================
MULTER STORAGE
========================================================
*/

const storage = multer.diskStorage({

  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {

    const uniqueName =
      `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;

    cb(null, uniqueName);
  }

});

const upload = multer({ storage });


/*
========================================================
GET ALL SHOWS
========================================================
*/

router.get('/', async (req, res) => {

  let conn;

  try {

    const {
      theatreId,
      title,
      location
    } = req.query;

    conn = await pool.getConnection();

    let sql = `
      SELECT
        s.show_id,
        s.theatre_id,
        s.title,
        s.description,
        s.duration,
        s.age_rating,
        s.image_url,
        s.genre,
        s.language,

        t.name AS theatre_name,
        t.location,
        t.description AS theatre_description

      FROM shows s

      JOIN theatres t
        ON s.theatre_id = t.theatre_id

      WHERE 1=1
    `;

    const params = [];

    /*
    Filter by theatre
    */

    if (theatreId) {

      sql += ` AND s.theatre_id = ?`;

      params.push(theatreId);
    }

    /*
    Filter by title
    */

    if (title) {

      sql += ` AND s.title LIKE ?`;

      params.push(`%${title}%`);
    }

    /*
    Filter by location
    */

    if (location) {

      sql += ` AND t.location LIKE ?`;

      params.push(`%${location}%`);
    }

    sql += ` ORDER BY s.title`;

    const rows = await conn.query(
      sql,
      params
    );

    res.json(rows);

  } catch (error) {

    console.error(
      'SHOWS ERROR:',
      error
    );

    res.status(500).json({
      message: 'Server error'
    });

  } finally {

    if (conn) {
      conn.release();
    }

  }

});


/*
========================================================
GET SHOWTIMES + OCCUPIED SEATS
========================================================

IMPORTANT:

available_seats DOES NOT exist as a column
inside the showtimes table.

We calculate it here:

total_seats - occupied seats
========================================================
*/

router.get('/:showId/showtimes', async (req, res) => {

  let conn;

  try {

    const { showId } = req.params;

    conn = await pool.getConnection();


    /*
    ----------------------------------------------------
    GET SHOWTIMES
    ----------------------------------------------------
    */

    const rows = await conn.query(
      `
      SELECT
        st.showtime_id,
        st.show_id,
        st.show_date,
        st.hall,
        st.base_price,
        st.total_seats

      FROM showtimes st

      WHERE st.show_id = ?

      ORDER BY st.show_date
      `,
      [showId]
    );


    /*
    ----------------------------------------------------
    GET OCCUPIED SEATS FOR EVERY SHOWTIME
    ----------------------------------------------------
    */

    for (const showtime of rows) {

      const occupiedRows = await conn.query(
        `
        SELECT
          rs.seat_number

        FROM reservation_seats rs

        JOIN reservations r
          ON rs.reservation_id = r.reservation_id

        WHERE rs.showtime_id = ?

        AND r.status = 'ACTIVE'

        ORDER BY rs.seat_number
        `,
        [showtime.showtime_id]
      );


      /*
      Convert database rows into an array

      Example:

      [
        "A1",
        "A2",
        "B5"
      ]
      */

      showtime.occupied_seats =
        occupiedRows.map(
          row => String(row.seat_number).toUpperCase()
        );


      /*
      --------------------------------------------------
      CALCULATE AVAILABLE SEATS
      --------------------------------------------------
      */

      showtime.available_seats =
        Number(showtime.total_seats) -
        showtime.occupied_seats.length;

    }


    /*
    ----------------------------------------------------
    RETURN SHOWTIMES
    ----------------------------------------------------
    */

    res.json(rows);

  } catch (error) {

    console.error(
      'SHOWTIMES ERROR:',
      error
    );

    /*
    We return the actual error temporarily
    so we can see exactly what is wrong
    if something else happens.
    */

    res.status(500).json({
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
========================================================
CREATE SHOW - ADMIN
========================================================
*/

router.post(
  '/',
  authMiddleware,
  adminMiddleware,
  upload.single('image'),
  async (req, res) => {

    let conn;

    try {

      const {
        theatre_id,
        title,
        description,
        duration,
        age_rating,
        genre,
        language,
        image_url: imageUrlFromBody
      } = req.body;


      /*
      Check required fields
      */

      if (
        !theatre_id ||
        !title ||
        !duration
      ) {

        return res.status(400).json({
          message: 'Missing required fields'
        });

      }


      /*
      If an image was uploaded,
      use the uploaded image.

      Otherwise use image_url from body.
      */

      const image_url =
        req.file
          ? `/uploads/${req.file.filename}`
          : (imageUrlFromBody || null);


      conn = await pool.getConnection();


      /*
      Insert show
      */

      await conn.query(
        `
        INSERT INTO shows
        (
          theatre_id,
          title,
          description,
          duration,
          age_rating,
          image_url,
          genre,
          language
        )

        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          theatre_id,
          title,
          description || null,
          duration,
          age_rating || null,
          image_url,
          genre || null,
          language || null
        ]
      );


      res.status(201).json({
        message: 'Show created successfully'
      });

    } catch (error) {

      console.error(
        'CREATE SHOW ERROR:',
        error
      );

      res.status(500).json({
        message: 'Server error'
      });

    } finally {

      if (conn) {
        conn.release();
      }

    }

  }
);


/*
========================================================
UPDATE SHOW - ADMIN
========================================================
*/

router.put(
  '/:id',
  authMiddleware,
  adminMiddleware,
  upload.single('image'),
  async (req, res) => {

    let conn;

    try {

      const { id } = req.params;

      const {
        theatre_id,
        title,
        description,
        duration,
        age_rating,
        genre,
        language,
        image_url: imageUrlFromBody
      } = req.body;


      conn = await pool.getConnection();


      /*
      Get current show
      */

      const rows = await conn.query(
        `
        SELECT *
        FROM shows
        WHERE show_id = ?
        `,
        [id]
      );


      if (rows.length === 0) {

        return res.status(404).json({
          message: 'Show not found'
        });

      }


      const current = rows[0];


      /*
      Keep existing image if
      no new image was uploaded.
      */

      const image_url =
        req.file
          ? `/uploads/${req.file.filename}`
          : (
              imageUrlFromBody ||
              current.image_url
            );


      /*
      Update show
      */

      await conn.query(
        `
        UPDATE shows

        SET
          theatre_id = ?,
          title = ?,
          description = ?,
          duration = ?,
          age_rating = ?,
          image_url = ?,
          genre = ?,
          language = ?

        WHERE show_id = ?
        `,
        [
          theatre_id || current.theatre_id,
          title || current.title,
          description ?? current.description,
          duration || current.duration,
          age_rating ?? current.age_rating,
          image_url,
          genre ?? current.genre,
          language ?? current.language,
          id
        ]
      );


      res.json({
        message: 'Show updated successfully'
      });

    } catch (error) {

      console.error(
        'UPDATE SHOW ERROR:',
        error
      );

      res.status(500).json({
        message: 'Server error'
      });

    } finally {

      if (conn) {
        conn.release();
      }

    }

  }
);


/*
========================================================
DELETE SHOW - ADMIN
========================================================
*/

router.delete(
  '/:id',
  authMiddleware,
  adminMiddleware,
  async (req, res) => {

    let conn;

    try {

      const { id } = req.params;

      conn = await pool.getConnection();

      await conn.beginTransaction();


      /*
      --------------------------------------------------
      DELETE RESERVATION SEATS
      --------------------------------------------------
      */

      await conn.query(
        `
        DELETE rs

        FROM reservation_seats rs

        JOIN reservations r
          ON rs.reservation_id =
             r.reservation_id

        JOIN showtimes st
          ON r.showtime_id =
             st.showtime_id

        WHERE st.show_id = ?
        `,
        [id]
      );


      /*
      --------------------------------------------------
      DELETE RESERVATIONS
      --------------------------------------------------
      */

      await conn.query(
        `
        DELETE r

        FROM reservations r

        JOIN showtimes st
          ON r.showtime_id =
             st.showtime_id

        WHERE st.show_id = ?
        `,
        [id]
      );


      /*
      --------------------------------------------------
      DELETE SHOWTIMES
      --------------------------------------------------
      */

      await conn.query(
        `
        DELETE FROM showtimes

        WHERE show_id = ?
        `,
        [id]
      );


      /*
      --------------------------------------------------
      DELETE SHOW
      --------------------------------------------------
      */

      const result = await conn.query(
        `
        DELETE FROM shows

        WHERE show_id = ?
        `,
        [id]
      );


      if (result.affectedRows === 0) {

        await conn.rollback();

        return res.status(404).json({
          message: 'Show not found'
        });

      }


      await conn.commit();


      res.json({
        message: 'Show deleted successfully'
      });

    } catch (error) {

      if (conn) {

        try {

          await conn.rollback();

        } catch (rollbackError) {

          console.error(
            'ROLLBACK ERROR:',
            rollbackError
          );

        }

      }


      console.error(
        'DELETE SHOW ERROR:',
        error
      );


      res.status(500).json({
        message: 'Server error'
      });

    } finally {

      if (conn) {
        conn.release();
      }

    }

  }
);


/*
========================================================
EXPORT ROUTER
========================================================
*/

module.exports = router;