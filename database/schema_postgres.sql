-- ==========================================
-- KOST DATA MANAGEMENT DATABASE SETUP SCRIPT
-- Untuk PostgreSQL (Supabase)
-- ==========================================
-- Jalankan script ini di Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql/new
-- ==========================================

-- Drop tables dalam urutan terbalik (dependencies)
DROP TABLE IF EXISTS public."PembayaranTahunan" CASCADE;
DROP TABLE IF EXISTS public."PembayaranListrik" CASCADE;
DROP TABLE IF EXISTS public."Penghuni" CASCADE;
DROP TABLE IF EXISTS public."Kamar" CASCADE;
DROP TABLE IF EXISTS public."Admin" CASCADE;

-- ==========================================
-- Buat Tabel Kamar
-- ==========================================
CREATE TABLE public."Kamar" (
    id_kamar  SERIAL PRIMARY KEY,
    no_kamar  VARCHAR(50) NOT NULL UNIQUE,
    lantai    INTEGER NOT NULL,
    kapasitas INTEGER NOT NULL
);

-- ==========================================
-- Buat Tabel Admin
-- ==========================================
CREATE TABLE public."Admin" (
    id_admin  SERIAL PRIMARY KEY,
    username  VARCHAR(50) NOT NULL UNIQUE,
    password  VARCHAR(100) NOT NULL
);

-- ==========================================
-- Buat Tabel Penghuni
-- ==========================================
CREATE TABLE public."Penghuni" (
    id_penghuni   SERIAL PRIMARY KEY,
    nama          VARCHAR(100) NOT NULL,
    jenis_kelamin VARCHAR(20) NOT NULL CHECK (jenis_kelamin IN ('Laki-laki', 'Perempuan')),
    no_hp         VARCHAR(20) NOT NULL,
    alamat        TEXT NOT NULL,
    id_kamar      INTEGER NULL,
    CONSTRAINT fk_penghuni_kamar FOREIGN KEY (id_kamar)
        REFERENCES public."Kamar"(id_kamar)
        ON DELETE SET NULL
);

-- ==========================================
-- Buat Tabel PembayaranListrik
-- ==========================================
CREATE TABLE public."PembayaranListrik" (
    id_listrik   SERIAL PRIMARY KEY,
    id_penghuni  INTEGER NOT NULL,
    bulan        VARCHAR(20) NOT NULL,
    tahun        INTEGER NOT NULL,
    jumlah_bayar NUMERIC(18, 2) NOT NULL,
    tanggal_bayar DATE NOT NULL,
    CONSTRAINT fk_listrik_penghuni FOREIGN KEY (id_penghuni)
        REFERENCES public."Penghuni"(id_penghuni)
        ON DELETE CASCADE
);

-- ==========================================
-- Buat Tabel PembayaranTahunan
-- ==========================================
CREATE TABLE public."PembayaranTahunan" (
    id_tahunan   SERIAL PRIMARY KEY,
    id_penghuni  INTEGER NOT NULL,
    tahun        INTEGER NOT NULL,
    jumlah_bayar NUMERIC(18, 2) NOT NULL,
    tanggal_bayar DATE NOT NULL,
    CONSTRAINT fk_tahunan_penghuni FOREIGN KEY (id_penghuni)
        REFERENCES public."Penghuni"(id_penghuni)
        ON DELETE CASCADE
);

-- ==========================================
-- Row Level Security (RLS)
-- Matikan RLS agar bisa diakses dari Netlify Functions
-- menggunakan Service Role Key
-- ==========================================
ALTER TABLE public."Kamar"             DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."Admin"             DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."Penghuni"          DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."PembayaranListrik" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."PembayaranTahunan" DISABLE ROW LEVEL SECURITY;

-- ==========================================
-- Seed Data Awal
-- ==========================================

-- Seed Kamar
INSERT INTO public."Kamar" (no_kamar, lantai, kapasitas) VALUES
('101', 1, 2),
('102', 1, 1),
('201', 2, 2),
('202', 2, 1),
('203', 2, 2);

-- Seed Penghuni
INSERT INTO public."Penghuni" (nama, jenis_kelamin, no_hp, alamat, id_kamar) VALUES
('Budi Santoso',  'Laki-laki', '081234567890', 'Jl. Merdeka No. 10, Surabaya', 1),
('Siti Rahma',    'Perempuan', '085678901234', 'Jl. Mawar No. 4, Malang',      2),
('Andi Wijaya',   'Laki-laki', '082345678901', 'Jl. Dahlia No. 15, Sidoarjo',  3),
('Rina Amelia',   'Perempuan', '089876543210', 'Jl. Melati No. 8, Gresik',     5);

-- Seed PembayaranListrik
INSERT INTO public."PembayaranListrik" (id_penghuni, bulan, tahun, jumlah_bayar, tanggal_bayar) VALUES
(1, 'Januari',  2026, 150000.00, '2026-01-05'),
(1, 'Februari', 2026, 160000.00, '2026-02-05'),
(2, 'Januari',  2026, 120000.00, '2026-01-07'),
(3, 'Januari',  2026, 200000.00, '2026-01-06'),
(4, 'Januari',  2026, 145000.00, '2026-01-08'),
(4, 'Februari', 2026, 155000.00, '2026-02-08');

-- Seed PembayaranTahunan
INSERT INTO public."PembayaranTahunan" (id_penghuni, tahun, jumlah_bayar, tanggal_bayar) VALUES
(1, 2026, 12000000.00, '2026-01-02'),
(2, 2026, 15000000.00, '2026-01-03'),
(3, 2026, 12000000.00, '2026-01-04'),
(4, 2026, 13000000.00, '2026-01-05');

-- Seed Admin
INSERT INTO public."Admin" (username, password) VALUES ('admin', 'pinkadmin123');

-- ==========================================
-- Reset sequences agar ID lanjut dari seed data
-- ==========================================
SELECT setval(pg_get_serial_sequence('public."Kamar"',             'id_kamar'),    (SELECT MAX(id_kamar)    FROM public."Kamar"),             true);
SELECT setval(pg_get_serial_sequence('public."Admin"',             'id_admin'),    (SELECT MAX(id_admin)    FROM public."Admin"),             true);
SELECT setval(pg_get_serial_sequence('public."Penghuni"',          'id_penghuni'), (SELECT MAX(id_penghuni) FROM public."Penghuni"),          true);
SELECT setval(pg_get_serial_sequence('public."PembayaranListrik"', 'id_listrik'),  (SELECT MAX(id_listrik)  FROM public."PembayaranListrik"), true);
SELECT setval(pg_get_serial_sequence('public."PembayaranTahunan"', 'id_tahunan'),  (SELECT MAX(id_tahunan)  FROM public."PembayaranTahunan"), true);
