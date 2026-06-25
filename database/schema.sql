-- ==========================================
-- KOST DATA MANAGEMENT DATABASE SETUP SCRIPT
-- For MS SQL Server
-- ==========================================

-- 1. Create Database
-- Run this if the database doesn't exist yet:
-- CREATE DATABASE kost_db;
-- GO
-- USE kost_db;
-- GO

-- Drop tables in reverse order of dependencies if they exist
IF OBJECT_ID('dbo.PembayaranTahunan', 'U') IS NOT NULL DROP TABLE dbo.PembayaranTahunan;
IF OBJECT_ID('dbo.PembayaranListrik', 'U') IS NOT NULL DROP TABLE dbo.PembayaranListrik;
IF OBJECT_ID('dbo.Penghuni', 'U') IS NOT NULL DROP TABLE dbo.Penghuni;
IF OBJECT_ID('dbo.Kamar', 'U') IS NOT NULL DROP TABLE dbo.Kamar;
IF OBJECT_ID('dbo.Admin', 'U') IS NOT NULL DROP TABLE dbo.Admin;

-- Create Kamar Table
CREATE TABLE Kamar (
    id_kamar INT IDENTITY(1,1) PRIMARY KEY,
    no_kamar VARCHAR(50) NOT NULL UNIQUE,
    lantai INT NOT NULL,
    kapasitas INT NOT NULL
);

-- Create Admin Table
CREATE TABLE Admin (
    id_admin INT IDENTITY(1,1) PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL
);

-- Create Penghuni Table
CREATE TABLE Penghuni (
    id_penghuni INT IDENTITY(1,1) PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    jenis_kelamin VARCHAR(20) NOT NULL CHECK (jenis_kelamin IN ('Laki-laki', 'Perempuan')),
    no_hp VARCHAR(20) NOT NULL,
    alamat VARCHAR(MAX) NOT NULL,
    id_kamar INT NULL,
    CONSTRAINT FK_Penghuni_Kamar FOREIGN KEY (id_kamar) 
        REFERENCES Kamar(id_kamar) 
        ON DELETE SET NULL
);

-- Create PembayaranListrik Table
CREATE TABLE PembayaranListrik (
    id_listrik INT IDENTITY(1,1) PRIMARY KEY,
    id_penghuni INT NOT NULL,
    bulan VARCHAR(20) NOT NULL,
    tahun INT NOT NULL,
    jumlah_bayar DECIMAL(18, 2) NOT NULL,
    tanggal_bayar DATE NOT NULL,
    CONSTRAINT FK_Listrik_Penghuni FOREIGN KEY (id_penghuni) 
        REFERENCES Penghuni(id_penghuni) 
        ON DELETE CASCADE
);

-- Create PembayaranTahunan Table
CREATE TABLE PembayaranTahunan (
    id_tahunan INT IDENTITY(1,1) PRIMARY KEY,
    id_penghuni INT NOT NULL,
    tahun INT NOT NULL,
    jumlah_bayar DECIMAL(18, 2) NOT NULL,
    tanggal_bayar DATE NOT NULL,
    CONSTRAINT FK_Tahunan_Penghuni FOREIGN KEY (id_penghuni) 
        REFERENCES Penghuni(id_penghuni) 
        ON DELETE CASCADE
);

-- Seed Initial Data
-- Seed Kamar
INSERT INTO Kamar (no_kamar, lantai, kapasitas) VALUES 
('101', 1, 2),
('102', 1, 1),
('201', 2, 2),
('202', 2, 1),
('203', 2, 2);

-- Seed Penghuni
INSERT INTO Penghuni (nama, jenis_kelamin, no_hp, alamat, id_kamar) VALUES 
('Budi Santoso', 'Laki-laki', '081234567890', 'Jl. Merdeka No. 10, Surabaya', 1),
('Siti Rahma', 'Perempuan', '085678901234', 'Jl. Mawar No. 4, Malang', 2),
('Andi Wijaya', 'Laki-laki', '082345678901', 'Jl. Dahlia No. 15, Sidoarjo', 3),
('Rina Amelia', 'Perempuan', '089876543210', 'Jl. Melati No. 8, Gresik', 5);

-- Seed PembayaranListrik
INSERT INTO PembayaranListrik (id_penghuni, bulan, tahun, jumlah_bayar, tanggal_bayar) VALUES 
(1, 'Januari', 2026, 150000.00, '2026-01-05'),
(1, 'Februari', 2026, 160000.00, '2026-02-05'),
(2, 'Januari', 2026, 120000.00, '2026-01-07'),
(3, 'Januari', 2026, 200000.00, '2026-01-06'),
(4, 'Januari', 2026, 145000.00, '2026-01-08'),
(4, 'Februari', 2026, 155000.00, '2026-02-08');

-- Seed PembayaranTahunan
INSERT INTO PembayaranTahunan (id_penghuni, tahun, jumlah_bayar, tanggal_bayar) VALUES 
(1, 2026, 12000000.00, '2026-01-02'),
(2, 2026, 15000000.00, '2026-01-03'),
(3, 2026, 12000000.00, '2026-01-04'),
(4, 2026, 13000000.00, '2026-01-05');

-- Seed Admin
INSERT INTO Admin (username, password) VALUES ('admin', 'pinkadmin123');
