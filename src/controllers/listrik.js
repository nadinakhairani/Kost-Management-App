const { poolPromise, sql } = require('../config/db');

// Get all electricity payments
const getAllListrik = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT pl.id_listrik, pl.id_penghuni, pl.bulan, pl.tahun, pl.jumlah_bayar, 
                   CONVERT(VARCHAR(10), pl.tanggal_bayar, 23) AS tanggal_bayar, 
                   p.nama AS nama_penghuni 
            FROM PembayaranListrik pl 
            JOIN Penghuni p ON pl.id_penghuni = p.id_penghuni 
            ORDER BY pl.tanggal_bayar DESC, pl.id_listrik DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Create electricity payment
const createListrik = async (req, res) => {
    const { id_penghuni, bulan, tahun, jumlah_bayar, tanggal_bayar } = req.body;

    if (!id_penghuni || !bulan || !tahun || !jumlah_bayar || !tanggal_bayar) {
        return res.status(400).json({ error: 'Semua field (Penghuni, Bulan, Tahun, Jumlah Bayar, Tanggal Bayar) wajib diisi' });
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
            .input('bulan', sql.VarChar, bulan)
            .input('tahun', sql.Int, tahun)
            .input('jumlah_bayar', sql.Decimal(18, 2), jumlah_bayar)
            .input('tanggal_bayar', sql.Date, tanggal_bayar)
            .query(`
                INSERT INTO PembayaranListrik (id_penghuni, bulan, tahun, jumlah_bayar, tanggal_bayar) 
                OUTPUT INSERTED.id_listrik 
                VALUES (@id_penghuni, @bulan, @tahun, @jumlah_bayar, @tanggal_bayar)
            `);

        res.status(201).json({
            message: 'Pembayaran listrik berhasil ditambahkan',
            id_listrik: result.recordset[0].id_listrik
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update electricity payment
const updateListrik = async (req, res) => {
    const { id } = req.params;
    const { id_penghuni, bulan, tahun, jumlah_bayar, tanggal_bayar } = req.body;

    if (!id_penghuni || !bulan || !tahun || !jumlah_bayar || !tanggal_bayar) {
        return res.status(400).json({ error: 'Semua field wajib diisi' });
    }

    try {
        const pool = await poolPromise;

        // Check if billing record exists
        const checkListrik = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT 1 FROM PembayaranListrik WHERE id_listrik = @id');

        if (checkListrik.recordset.length === 0) {
            return res.status(404).json({ error: 'Data pembayaran listrik tidak ditemukan' });
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
            .input('bulan', sql.VarChar, bulan)
            .input('tahun', sql.Int, tahun)
            .input('jumlah_bayar', sql.Decimal(18, 2), jumlah_bayar)
            .input('tanggal_bayar', sql.Date, tanggal_bayar)
            .query(`
                UPDATE PembayaranListrik 
                SET id_penghuni = @id_penghuni, bulan = @bulan, tahun = @tahun, 
                    jumlah_bayar = @jumlah_bayar, tanggal_bayar = @tanggal_bayar 
                WHERE id_listrik = @id
            `);

        res.json({ message: 'Pembayaran listrik berhasil diperbarui' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete electricity payment
const deleteListrik = async (req, res) => {
    const { id } = req.params;

    try {
        const pool = await poolPromise;

        const checkListrik = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT 1 FROM PembayaranListrik WHERE id_listrik = @id');

        if (checkListrik.recordset.length === 0) {
            return res.status(404).json({ error: 'Data pembayaran listrik tidak ditemukan' });
        }

        await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM PembayaranListrik WHERE id_listrik = @id');

        res.json({ message: 'Pembayaran listrik berhasil dihapus' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getAllListrik,
    createListrik,
    updateListrik,
    deleteListrik
};
