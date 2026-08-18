CREATE DATABASE IF NOT EXISTS cinema_booking
CHARACTER SET utf8mb4
COLLATE utf8mb4_general_ci;

USE cinema_booking;

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

START TRANSACTION;

DROP TABLE IF EXISTS reservation_seats;
DROP TABLE IF EXISTS reservations;
DROP TABLE IF EXISTS showtimes;
DROP TABLE IF EXISTS shows;
DROP TABLE IF EXISTS theatres;
DROP TABLE IF EXISTS users;


-- =========================================================
-- USERS
-- =========================================================

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_general_ci;


-- =========================================================
-- CINEMAS
-- =========================================================

CREATE TABLE theatres (
    theatre_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    location VARCHAR(150) NOT NULL,
    description TEXT
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_general_ci;


-- =========================================================
-- MOVIES
-- =========================================================

CREATE TABLE shows (
    show_id INT AUTO_INCREMENT PRIMARY KEY,
    theatre_id INT,
    title VARCHAR(150),
    description TEXT,
    duration INT,
    age_rating VARCHAR(20),
    image_url VARCHAR(500) NULL,
    genre VARCHAR(100) NULL,
    language VARCHAR(100) NULL,

    FOREIGN KEY (theatre_id)
        REFERENCES theatres(theatre_id)
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_general_ci;


-- =========================================================
-- SHOWTIMES
-- =========================================================

CREATE TABLE showtimes (
    showtime_id INT AUTO_INCREMENT PRIMARY KEY,
    show_id INT,
    show_date DATETIME,
    hall VARCHAR(100),
    base_price DECIMAL(10,2),
    total_seats INT,

    FOREIGN KEY (show_id)
        REFERENCES shows(show_id)
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_general_ci;


-- =========================================================
-- RESERVATIONS
-- =========================================================

CREATE TABLE reservations (
    reservation_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    showtime_id INT,
    seats_count INT,
    total_price DECIMAL(10,2),
    status ENUM('ACTIVE','CANCELLED') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(user_id),

    FOREIGN KEY (showtime_id)
        REFERENCES showtimes(showtime_id)
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_general_ci;


-- =========================================================
-- RESERVATION SEATS
-- =========================================================

CREATE TABLE reservation_seats (
    reservation_seat_id INT AUTO_INCREMENT PRIMARY KEY,

    reservation_id INT NOT NULL,

    showtime_id INT NOT NULL,

    seat_number VARCHAR(10) NOT NULL,

    status ENUM('ACTIVE','CANCELLED') DEFAULT 'ACTIVE',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (reservation_id)
        REFERENCES reservations(reservation_id)
        ON DELETE CASCADE,

    FOREIGN KEY (showtime_id)
        REFERENCES showtimes(showtime_id)
        ON DELETE CASCADE,

    UNIQUE KEY unique_showtime_seat (
        showtime_id,
        seat_number
    )
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_general_ci;


-- =========================================================
-- USERS
-- =========================================================

INSERT INTO users
(name, email, password_hash, role)
VALUES
(
    'Admin',
    'admin@test.com',
    '$2b$10$cRAxdQF6Ez3cx3VI8gB7Z.P0Y39enHZLPCaebQ4lu7e2jWX.sWtjW',
    'admin'
),
(
    'Mar User',
    'user@test.com',
    '$2b$10$cRAxdQF6Ez3cx3VI8gB7Z.P0Y39enHZLPCaebQ4lu7e2jWX.sWtjW',
    'user'
);


-- =========================================================
-- CINEMAS
-- =========================================================

INSERT INTO theatres
(name, location, description)
VALUES
(
    'Odeon Cinema',
    'Athens',
    'Modern cinema with multiple movie halls.'
),
(
    'Cineworld',
    'London',
    'Large cinema complex with multiple screens.'
),
(
    'AMC Cinema',
    'New York',
    'Modern cinema with premium movie experiences.'
),
(
    'UCI Cinema',
    'Milan',
    'Popular cinema with comfortable movie halls.'
),
(
    'Cineplex',
    'Sydney',
    'Modern cinema with multiple screens.'
);


-- =========================================================
-- MOVIES
-- =========================================================

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
VALUES
(
    1,
    'Interstellar',
    'A group of explorers travel through a wormhole in space in search of a new home for humanity.',
    169,
    '12+',
    'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?auto=format&fit=crop&w=900&q=80',
    'Sci-Fi',
    'English'
),
(
    1,
    'The Dark Knight',
    'Batman faces one of his greatest enemies while Gotham City is threatened by chaos.',
    152,
    '12+',
    'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?auto=format&fit=crop&w=900&q=80',
    'Action',
    'English'
),
(
    2,
    'Inception',
    'A skilled thief enters the dreams of others to steal secrets.',
    148,
    '12+',
    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=900&q=80',
    'Sci-Fi',
    'English'
),
(
    2,
    'Avatar',
    'A marine explores an alien world and becomes involved in a conflict between its inhabitants and humans.',
    162,
    '12+',
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=900&q=80',
    'Adventure',
    'English'
),
(
    3,
    'The Matrix',
    'A computer programmer discovers that reality is not what it appears to be.',
    136,
    '16+',
    'https://images.unsplash.com/photo-1518709594023-6eab9bab7b23?auto=format&fit=crop&w=900&q=80',
    'Action',
    'English'
),
(
    4,
    'Gladiator',
    'A Roman general becomes a gladiator and seeks revenge.',
    155,
    '16+',
    'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=900&q=80',
    'Drama',
    'English'
),
(
    5,
    'The Grand Budapest Hotel',
    'A hotel concierge and his lobby boy become involved in a mysterious adventure.',
    99,
    '12+',
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80',
    'Comedy',
    'English'
);


-- =========================================================
-- SHOWTIMES
-- =========================================================

INSERT INTO showtimes
(show_id, show_date, hall, base_price, total_seats)
VALUES
(1, '2026-08-15 18:00:00', 'Screen 1', 8.50, 120),
(1, '2026-08-15 21:00:00', 'Screen 1', 10.00, 120),

(2, '2026-08-16 18:30:00', 'Screen 2', 9.00, 100),
(2, '2026-08-16 21:30:00', 'Screen 2', 10.50, 100),

(3, '2026-08-17 19:00:00', 'Screen 3', 9.50, 150),

(4, '2026-08-18 20:00:00', 'Screen 1', 10.00, 120),

(5, '2026-08-19 19:30:00', 'Screen 4', 8.50, 150),

(6, '2026-08-20 21:00:00', 'Screen 2', 9.50, 100),

(7, '2026-08-21 18:00:00', 'Screen 5', 8.00, 80);


COMMIT;
