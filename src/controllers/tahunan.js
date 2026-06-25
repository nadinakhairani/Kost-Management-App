const { poolPromise, sql } = require('../config/db');

// Get all annual payments
const getAllTahunan = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT pt.id_tahunan, pt.id_penghuni, pt.tahun, pt.jumlah_bayar, 
                   CONVERT(VARCHAR(10), pt.tanggal_bayar, 23) AS tanggal_bayar, 
                   p.nama AS nama_penghuni 
            FROM PembayaranTahunan pt 
            JOIN Penghuni p ON pt.id_penghuni = p.id_penghuni 
            ORDER BY pt.tanggal_bayar DESC, pt.id_tahunan DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Create annual payment
const createTahunan = async (req, res) => {
    const { id_penghuni, tahun, jumlah_bayar, tanggal_bayar } = req.body;

    if (!id_penghuni || !tahun || !jumlah_bayar || !tanggal_bayar) {
        return res.status(400).json({ error: 'Semua field (Penghuni, Tahun, Jumlah Bayar, Tanggal Bayar) wajib diisi' });
    }

    try {
        const pool = await poolPromise;

        // Verify resident exists
        const checkPenghuni = await pool.request()
            .input('id_penghuni', sql.Int, id_penghuni)
            .query('SELECT 1 FROM Penghuni WHERE id_penghuni = @id_penghuni');

        if (checkPenghuni.recordset.length === 0) {
            return res.status(404).json({ error: 'Penghuni tidak ditemukan' });
        }

        const result = await pool.request()
            .input('id_penghuni', sql.Int, id_penghuni)
            .input('tahun', sql.Int, tahun)
            .input('jumlah_bayar', sql.Decimal(18, 2), jumlah_bayar)
            .input('tanggal_bayar', sql.Date, tanggal_bayar)
            .query(`
                INSERT INTO PembayaranTahunan (id_penghuni, tahun, jumlah_bayar, tanggal_bayar) 
                OUTPUT INSERTED.id_tahunan 
                VALUES (@id_penghuni, @tahun, @jumlah_bayar, @tanggal_bayar)
            `);

        res.status(201).json({
            message: 'Pembayaran tahunan berhasil ditambahkan',
            id_tahunan: result.recordset[0].id_tahunan
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update annual payment
const updateTahunan = async (req, res) => {
    const { id } = req.params;
    const { id_penghuni, tahun, jumlah_bayar, tanggal_bayar } = req.body;

    if (!id_penghuni || !tahun || !jumlah_bayar || !tanggal_bayar) {
        return res.status(400).json({ error: 'Semua field wajib diisi' });
    }

    try {
        const pool = await poolPromise;

        // Check if billing record exists
        const checkTahunan = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT 1 FROM PembayaranTahunan WHERE id_tahunan = @id');

        if (checkTahunan.recordset.length === 0) {
            return res.status(404).json({ error: 'Data pembayaran tahunan tidak ditemukan' });
        }

        // Verify resident exists
        const checkPenghuni = await pool.request()
            .input('id_penghuni', sql.Int, id_penghuni)
            .query('SELECT 1 FROM Penghuni WHERE id_penghuni = @id_penghuni');

        if (checkPenghuni.recordset.length === 0) {
            return res.status(404).json({ error: 'Penghuni tidak ditemukan' });
        }

        await pool.request()
            .input('id', sql.Int, id)
            .input('id_penghuni', sql.Int, id_penghuni)
            .input('tahun', sql.Int, tahun)
            .input('jumlah_bayar', sql.Decimal(18, 2), jumlah_bayar)
            .input('tanggal_bayar', sql.Date, tanggal_bayar)
            .query(`
                UPDATE PembayaranTahunan 
                SET id_penghuni = @id_penghuni, tahun = @tahun, 
                    jumlah_bayar = @jumlah_bayar, tanggal_bayar = @tanggal_bayar 
                WHERE id_tahunan = @id
            `);

        res.json({ message: 'Pembayaran tahunan berhasil diperbarui' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete annual payment
const deleteTahunan = async (req, res) => {
    const { id } = req.params;

    try {
        const pool = await poolPromise;

        const checkTahunan = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT 1 FROM PembayaranTahunan WHERE id_tahunan = @id');

        if (checkTahunan.recordset.length === 0) {
            return res.status(404).json({ error: 'Data pembayaran tahunan tidak ditemukan' });
        }

        await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM PembayaranTahunan WHERE id_tahunan = @id');

        res.json({ message: 'Pembayaran tahunan berhasil dihapus' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getAllTahunan,
    createTahunan,
    updateTahunan,
    deleteTahunan
};
