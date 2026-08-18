const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

const router = express.Router();


/*
=========================================================
GET MY RESERVATIONS
=========================================================
*/

router.get('/my', authMiddleware, async (req, res) => {

  let conn;

  try {

    conn = await pool.getConnection();

    const rows = await conn.query(
      `
      SELECT
        r.reservation_id,
        r.user_id,
        r.showtime_id,
        r.seats_count,
        r.total_price,
        r.status,
        r.created_at,

        s.title,
        s.image_url,

        st.show_date,
        st.hall,

        t.name AS theatre_name,

        GROUP_CONCAT(
          rs.seat_number
          ORDER BY rs.seat_number
          SEPARATOR ', '
        ) AS seat_numbers

      FROM reservations r

      JOIN showtimes st
        ON r.showtime_id = st.showtime_id

      JOIN shows s
        ON st.show_id = s.show_id

      JOIN theatres t
        ON s.theatre_id = t.theatre_id

      LEFT JOIN reservation_seats rs
        ON r.reservation_id = rs.reservation_id
        AND rs.status = 'ACTIVE'

      WHERE r.user_id = ?

      GROUP BY
        r.reservation_id,
        r.user_id,
        r.showtime_id,
        r.seats_count,
        r.total_price,
        r.status,
        r.created_at,
        s.title,
        s.image_url,
        st.show_date,
        st.hall,
        t.name

      ORDER BY r.created_at DESC
      `,
      [req.user.user_id]
    );

    res.json(rows);

  } catch (error) {

    console.error(
      'MY RESERVATIONS ERROR:',
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
=========================================================
ADMIN - GET ALL RESERVATIONS
=========================================================
*/

router.get(
  '/admin/all',
  authMiddleware,
  adminMiddleware,
  async (req, res) => {

    let conn;

    try {

      conn = await pool.getConnection();

      const rows = await conn.query(
        `
        SELECT
          r.reservation_id,
          r.user_id,
          r.showtime_id,
          r.seats_count,
          r.total_price,
          r.status,
          r.created_at,

          u.name AS user_name,
          u.email AS user_email,

          s.show_id,
          s.title,
          s.image_url,

          st.show_date,
          st.hall,
          st.base_price,
          st.total_seats,

          t.theatre_id,
          t.name AS theatre_name,
          t.location,

          GROUP_CONCAT(
            rs.seat_number
            ORDER BY rs.seat_number
            SEPARATOR ', '
          ) AS seat_numbers

        FROM reservations r

        JOIN users u
          ON r.user_id = u.user_id

        JOIN showtimes st
          ON r.showtime_id = st.showtime_id

        JOIN shows s
          ON st.show_id = s.show_id

        JOIN theatres t
          ON s.theatre_id = t.theatre_id

        LEFT JOIN reservation_seats rs
          ON r.reservation_id = rs.reservation_id
          AND rs.status = 'ACTIVE'

        GROUP BY
          r.reservation_id,
          r.user_id,
          r.showtime_id,
          r.seats_count,
          r.total_price,
          r.status,
          r.created_at,

          u.name,
          u.email,

          s.show_id,
          s.title,
          s.image_url,

          st.show_date,
          st.hall,
          st.base_price,
          st.total_seats,

          t.theatre_id,
          t.name,
          t.location

        ORDER BY r.created_at DESC
        `
      );

      res.json(rows);

    } catch (error) {

      console.error(
        'ADMIN RESERVATIONS ERROR:',
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
=========================================================
CREATE RESERVATION
=========================================================
*/

router.post('/', authMiddleware, async (req, res) => {

  let conn;

  try {

    const {
      showtime_id,
      seat_numbers
    } = req.body;


    /*
    Validate request
    */

    if (
      !showtime_id ||
      !Array.isArray(seat_numbers) ||
      seat_numbers.length === 0
    ) {

      return res.status(400).json({
        message: 'Please select at least one seat.'
      });
    }


    /*
    Remove duplicates and clean seat numbers
    */

    const selectedSeats = [
      ...new Set(
        seat_numbers
          .map(seat =>
            String(seat)
              .trim()
              .toUpperCase()
          )
          .filter(Boolean)
      )
    ];


    if (selectedSeats.length === 0) {

      return res.status(400).json({
        message: 'Please select at least one seat.'
      });
    }


    conn = await pool.getConnection();

    await conn.beginTransaction();


    /*
    Get showtime
    */

    const showtimeRows = await conn.query(
      `
      SELECT *
      FROM showtimes
      WHERE showtime_id = ?
      FOR UPDATE
      `,
      [showtime_id]
    );


    if (showtimeRows.length === 0) {

      await conn.rollback();

      return res.status(404).json({
        message: 'Showtime not found.'
      });
    }


    const showtime = showtimeRows[0];


    /*
    Check if selected seats are already reserved
    */

    const placeholders =
      selectedSeats
        .map(() => '?')
        .join(',');


    const occupiedSeats =
      await conn.query(
        `
        SELECT seat_number
        FROM reservation_seats
        WHERE showtime_id = ?
        AND seat_number IN (${placeholders})
        AND status = 'ACTIVE'
        FOR UPDATE
        `,
        [
          showtime_id,
          ...selectedSeats
        ]
      );


    if (occupiedSeats.length > 0) {

      const alreadyTaken =
        occupiedSeats.map(
          seat => seat.seat_number
        );


      await conn.rollback();

      return res.status(409).json({
        message:
          `These seats are already reserved: ${alreadyTaken.join(', ')}`
      });
    }


    /*
    Check total capacity
    */

    const reservedRows =
      await conn.query(
        `
        SELECT COUNT(*) AS reserved
        FROM reservation_seats
        WHERE showtime_id = ?
        AND status = 'ACTIVE'
        `,
        [showtime_id]
      );


    const reserved =
      Number(
        reservedRows[0].reserved || 0
      );


    const totalSeats =
      Number(showtime.total_seats);


    if (
      reserved + selectedSeats.length >
      totalSeats
    ) {

      await conn.rollback();

      return res.status(400).json({
        message:
          'Not enough seats available.'
      });
    }


    /*
    Calculate price
    */

    const seatsCount =
      selectedSeats.length;


    const totalPrice =
      Number(showtime.base_price) *
      seatsCount;


    /*
    Create reservation
    */

    const reservationResult =
      await conn.query(
        `
        INSERT INTO reservations
        (
          user_id,
          showtime_id,
          seats_count,
          total_price,
          status
        )
        VALUES (?, ?, ?, ?, 'ACTIVE')
        `,
        [
          req.user.user_id,
          showtime_id,
          seatsCount,
          totalPrice
        ]
      );


    const reservationId =
      Number(
        reservationResult.insertId
      );


    /*
    Save individual seats
    */

    for (
      const seatNumber of selectedSeats
    ) {

      await conn.query(
        `
        INSERT INTO reservation_seats
        (
          reservation_id,
          showtime_id,
          seat_number,
          status
        )
        VALUES (?, ?, ?, 'ACTIVE')
        `,
        [
          reservationId,
          showtime_id,
          seatNumber
        ]
      );
    }


    await conn.commit();


    res.status(201).json({

      message:
        'Reservation created successfully.',

      reservation_id:
        reservationId,

      seats:
        selectedSeats,

      seats_count:
        seatsCount,

      total_price:
        totalPrice
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


    /*
    Duplicate seat protection
    */

    if (
      error.code ===
      'ER_DUP_ENTRY'
    ) {

      return res.status(409).json({
        message:
          'One or more selected seats have just been reserved by another user.'
      });
    }


    console.error(
      'CREATE RESERVATION ERROR:',
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
=========================================================
ADMIN - GET OCCUPIED SEATS FOR SHOWTIME
=========================================================
*/

router.get(
  '/admin/showtime/:showtimeId/seats',
  authMiddleware,
  adminMiddleware,
  async (req, res) => {

    let conn;

    try {

      const {
        showtimeId
      } = req.params;


      conn =
        await pool.getConnection();


      const rows =
        await conn.query(
          `
          SELECT
            rs.seat_number,
            rs.reservation_id,
            rs.status
          FROM reservation_seats rs
          WHERE rs.showtime_id = ?
          AND rs.status = 'ACTIVE'
          ORDER BY rs.seat_number
          `,
          [showtimeId]
        );


      res.json(rows);

    } catch (error) {

      console.error(
        'ADMIN SEATS ERROR:',
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
=========================================================
ADMIN - EDIT RESERVATION SEATS
=========================================================
*/

router.put(
  '/admin/:id/seats',
  authMiddleware,
  adminMiddleware,
  async (req, res) => {

    let conn;

    try {

      const {
        id
      } = req.params;


      const {
        seat_numbers
      } = req.body;


      /*
      Validate seats
      */

      if (
        !Array.isArray(seat_numbers) ||
        seat_numbers.length === 0
      ) {

        return res.status(400).json({
          message:
            'Please select at least one seat.'
        });
      }


      /*
      Clean seats
      */

      const selectedSeats = [
        ...new Set(
          seat_numbers
            .map(seat =>
              String(seat)
                .trim()
                .toUpperCase()
            )
            .filter(Boolean)
        )
      ];


      if (
        selectedSeats.length === 0
      ) {

        return res.status(400).json({
          message:
            'Please select at least one seat.'
        });
      }


      conn =
        await pool.getConnection();


      await conn.beginTransaction();


      /*
      Get reservation
      */

      const reservationRows =
        await conn.query(
          `
          SELECT
            r.*,
            st.total_seats,
            st.base_price
          FROM reservations r

          JOIN showtimes st
            ON r.showtime_id =
               st.showtime_id

          WHERE r.reservation_id = ?

          FOR UPDATE
          `,
          [id]
        );


      if (
        reservationRows.length === 0
      ) {

        await conn.rollback();

        return res.status(404).json({
          message:
            'Reservation not found.'
        });
      }


      const reservation =
        reservationRows[0];


      /*
      Only active reservations
      can be edited
      */

      if (
        reservation.status !==
        'ACTIVE'
      ) {

        await conn.rollback();

        return res.status(400).json({
          message:
            'Only active reservations can be edited.'
        });
      }


      const showtimeId =
        reservation.showtime_id;


      const totalSeats =
        Number(
          reservation.total_seats
        );


      /*
      Check cinema capacity
      */

      if (
        selectedSeats.length >
        totalSeats
      ) {

        await conn.rollback();

        return res.status(400).json({
          message:
            'Too many seats selected.'
        });
      }


      /*
      Lock existing seats belonging
      to this reservation
      */

      await conn.query(
        `
        SELECT *
        FROM reservation_seats
        WHERE reservation_id = ?
        AND status = 'ACTIVE'
        FOR UPDATE
        `,
        [id]
      );


      /*
      Check if another reservation
      already owns selected seats
      */

      const placeholders =
        selectedSeats
          .map(() => '?')
          .join(',');


      const occupied =
        await conn.query(
          `
          SELECT
            seat_number,
            reservation_id
          FROM reservation_seats

          WHERE showtime_id = ?

          AND seat_number IN (${placeholders})

          AND status = 'ACTIVE'

          AND reservation_id <> ?

          FOR UPDATE
          `,
          [
            showtimeId,
            ...selectedSeats,
            id
          ]
        );


      if (
        occupied.length > 0
      ) {

        const taken =
          occupied.map(
            row =>
              row.seat_number
          );


        await conn.rollback();

        return res.status(409).json({
          message:
            `These seats are already reserved: ${taken.join(', ')}`
        });
      }


      /*
      Remove old seats
      */

      await conn.query(
        `
        DELETE FROM reservation_seats
        WHERE reservation_id = ?
        `,
        [id]
      );


      /*
      Add new seats
      */

      for (
        const seatNumber of selectedSeats
      ) {

        await conn.query(
          `
          INSERT INTO reservation_seats
          (
            reservation_id,
            showtime_id,
            seat_number,
            status
          )
          VALUES (?, ?, ?, 'ACTIVE')
          `,
          [
            id,
            showtimeId,
            seatNumber
          ]
        );
      }


      /*
      Recalculate reservation
      */

      const newSeatsCount =
        selectedSeats.length;


      const newTotalPrice =
        Number(
          reservation.base_price
        ) *
        newSeatsCount;


      await conn.query(
        `
        UPDATE reservations

        SET
          seats_count = ?,
          total_price = ?

        WHERE reservation_id = ?
        `,
        [
          newSeatsCount,
          newTotalPrice,
          id
        ]
      );


      await conn.commit();


      res.json({

        message:
          'Reservation seats updated successfully.',

        reservation_id:
          Number(id),

        seats:
          selectedSeats,

        seats_count:
          newSeatsCount,

        total_price:
          newTotalPrice
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


      if (
        error.code ===
        'ER_DUP_ENTRY'
      ) {

        return res.status(409).json({
          message:
            'One or more selected seats are already reserved.'
        });
      }


      console.error(
        'ADMIN EDIT RESERVATION ERROR:',
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
=========================================================
ADMIN - DELETE RESERVATION
=========================================================
*
* ADMIN ONLY
*
* This permanently deletes:
*
* 1. reservation_seats records
* 2. reservation record
*
* The user can then reserve these seats again.
*
=========================================================
*/

router.delete(
  '/admin/:id',
  authMiddleware,
  adminMiddleware,
  async (req, res) => {

    let conn;

    try {

      const {
        id
      } = req.params;


      conn =
        await pool.getConnection();


      await conn.beginTransaction();


      /*
      Check if reservation exists
      */

      const reservationRows =
        await conn.query(
          `
          SELECT
            reservation_id,
            showtime_id,
            status
          FROM reservations
          WHERE reservation_id = ?
          FOR UPDATE
          `,
          [id]
        );


      if (
        reservationRows.length === 0
      ) {

        await conn.rollback();

        return res.status(404).json({
          message:
            'Reservation not found.'
        });
      }


      /*
      Delete reservation seats FIRST
      */

      await conn.query(
        `
        DELETE FROM reservation_seats
        WHERE reservation_id = ?
        `,
        [id]
      );


      /*
      Delete reservation SECOND
      */

      const result =
        await conn.query(
          `
          DELETE FROM reservations
          WHERE reservation_id = ?
          `,
          [id]
        );


      if (
        result.affectedRows === 0
      ) {

        await conn.rollback();

        return res.status(404).json({
          message:
            'Reservation could not be deleted.'
        });
      }


      /*
      Everything succeeded
      */

      await conn.commit();


      res.json({
        message:
          'Reservation deleted successfully.'
      });


    } catch (error) {

      /*
      Rollback if something failed
      */

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
        'ADMIN DELETE RESERVATION ERROR:',
        error
      );


      res.status(500).json({
        message:
          'Server error'
      });


    } finally {

      if (conn) {
        conn.release();
      }
    }
  }
);


/*
=========================================================
USER - CANCEL RESERVATION
=========================================================
*
* USER CAN ONLY CANCEL THEIR OWN RESERVATION.
*
* This does NOT permanently delete the reservation.
* It changes the reservation status to CANCELLED.
*
=========================================================
*/

router.delete(
  '/:id',
  authMiddleware,
  async (req, res) => {

    let conn;

    try {

      const {
        id
      } = req.params;


      conn =
        await pool.getConnection();


      await conn.beginTransaction();


      /*
      Cancel reservation
      */

      const result =
        await conn.query(
          `
          UPDATE reservations

          SET status = 'CANCELLED'

          WHERE reservation_id = ?

          AND user_id = ?

          AND status = 'ACTIVE'
          `,
          [
            id,
            req.user.user_id
          ]
        );


      if (
        result.affectedRows === 0
      ) {

        await conn.rollback();

        return res.status(404).json({
          message:
            'Reservation not found.'
        });
      }


      /*
      Release seats
      */

      await conn.query(
        `
        UPDATE reservation_seats

        SET status = 'CANCELLED'

        WHERE reservation_id = ?

        AND status = 'ACTIVE'
        `,
        [id]
      );


      await conn.commit();


      res.json({
        message:
          'Reservation cancelled successfully.'
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
        'CANCEL RESERVATION ERROR:',
        error
      );


      res.status(500).json({
        message:
          'Server error'
      });


    } finally {

      if (conn) {
        conn.release();
      }
    }
  }
);


module.exports = router;
