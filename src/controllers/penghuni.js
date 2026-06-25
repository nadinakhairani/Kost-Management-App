const { poolPromise, sql } = require('../config/db');

// Get all residents (with optional search and room filters)
const getAllPenghuni = async (req, res) => {
    const { search, id_kamar } = req.query;

    try {
        const pool = await poolPromise;
        const request = pool.request();
        
        let query = `
            SELECT p.id_penghuni, p.nama, p.jenis_kelamin, p.no_hp, p.alamat, p.id_kamar, k.no_kamar 
            FROM Penghuni p 
            LEFT JOIN Kamar k ON p.id_kamar = k.id_kamar 
            WHERE 1=1
        `;

        if (search) {
            request.input('search', sql.VarChar, `%${search}%`);
            query += ' AND p.nama LIKE @search';
        }

        if (id_kamar) {
            request.input('id_kamar', sql.Int, id_kamar);
            query += ' AND p.id_kamar = @id_kamar';
        }

        query += ' ORDER BY p.nama ASC';

        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Create a resident
const createPenghuni = async (req, res) => {
    const { nama, jenis_kelamin, no_hp, alamat, id_kamar } = req.body;

    if (!nama || !jenis_kelamin || !no_hp || !alamat) {
        return res.status(400).json({ error: 'Nama, jenis kelamin, no HP, dan alamat wajib diisi' });
    }

    try {
        const pool = await poolPromise;

        // If id_kamar is provided, verify it exists and isn't full
        if (id_kamar) {
            const kamarCheck = await pool.request()
                .input('id_kamar', sql.Int, id_kamar)
                .query('SELECT kapasitas FROM Kamar WHERE id_kamar = @id_kamar');

            if (kamarCheck.recordset.length === 0) {
                return res.status(404).json({ error: 'Kamar tidak ditemukan' });
            }

            const kapasitas = kamarCheck.recordset[0].kapasitas;

            // Check current occupancy
            const occupancyCheck = await pool.request()
                .input('id_kamar', sql.Int, id_kamar)
                .query('SELECT COUNT(*) AS current_occupancy FROM Penghuni WHERE id_kamar = @id_kamar');

            const currentOccupancy = occupancyCheck.recordset[0].current_occupancy;

            if (currentOccupancy >= kapasitas) {
                return res.status(400).json({ error: 'Kamar tersebut sudah penuh' });
            }
        }

        const result = await pool.request()
            .input('nama', sql.VarChar, nama)
            .input('jenis_kelamin', sql.VarChar, jenis_kelamin)
            .input('no_hp', sql.VarChar, no_hp)
            .input('alamat', sql.VarChar, alamat)
            .input('id_kamar', sql.Int, id_kamar || null)
            .query(`
                INSERT INTO Penghuni (nama, jenis_kelamin, no_hp, alamat, id_kamar) 
                OUTPUT INSERTED.id_penghuni 
                VALUES (@nama, @jenis_kelamin, @no_hp, @alamat, @id_kamar)
            `);

        res.status(201).json({
            message: 'Penghuni berhasil ditambahkan',
            id_penghuni: result.recordset[0].id_penghuni
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update a resident
const updatePenghuni = async (req, res) => {
    const { id } = req.params;
    const { nama, jenis_kelamin, no_hp, alamat, id_kamar } = req.body;

    if (!nama || !jenis_kelamin || !no_hp || !alamat) {
        return res.status(400).json({ error: 'Nama, jenis kelamin, no HP, dan alamat wajib diisi' });
    }

    try {
        const pool = await poolPromise;

        // Check if resident exists
        const checkPenghuni = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT id_kamar FROM Penghuni WHERE id_penghuni = @id');

        if (checkPenghuni.recordset.length === 0) {
            return res.status(404).json({ error: 'Penghuni tidak ditemukan' });
        }

        const oldKamarId = checkPenghuni.recordset[0].id_kamar;

        // If id_kamar changes, verify new room capacity
        if (id_kamar && id_kamar !== oldKamarId) {
            const kamarCheck = await pool.request()
                .input('id_kamar', sql.Int, id_kamar)
                .query('SELECT kapasitas FROM Kamar WHERE id_kamar = @id_kamar');

            if (kamarCheck.recordset.length === 0) {
                return res.status(404).json({ error: 'Kamar baru tidak ditemukan' });
            }

            const kapasitas = kamarCheck.recordset[0].kapasitas;

            const occupancyCheck = await pool.request()
                .input('id_kamar', sql.Int, id_kamar)
                .query('SELECT COUNT(*) AS current_occupancy FROM Penghuni WHERE id_kamar = @id_kamar');

            const currentOccupancy = occupancyCheck.recordset[0].current_occupancy;

            if (currentOccupancy >= kapasitas) {
                return res.status(400).json({ error: 'Kamar baru tersebut sudah penuh' });
            }
        }

        await pool.request()
            .input('id', sql.Int, id)
            .input('nama', sql.VarChar, nama)
            .input('jenis_kelamin', sql.VarChar, jenis_kelamin)
            .input('no_hp', sql.VarChar, no_hp)
            .input('alamat', sql.VarChar, alamat)
            .input('id_kamar', sql.Int, id_kamar || null)
            .query(`
                UPDATE Penghuni 
                SET nama = @nama, jenis_kelamin = @jenis_kelamin, no_hp = @no_hp, alamat = @alamat, id_kamar = @id_kamar 
                WHERE id_penghuni = @id
            `);

        res.json({ message: 'Data penghuni berhasil diperbarui' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete a resident
const deletePenghuni = async (req, res) => {
    const { id } = req.params;

    try {
        const pool = await poolPromise;

        const checkPenghuni = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT 1 FROM Penghuni WHERE id_penghuni = @id');

        if (checkPenghuni.recordset.length === 0) {
            return res.status(404).json({ error: 'Penghuni tidak ditemukan' });
        }

        await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM Penghuni WHERE id_penghuni = @id');

        res.json({ message: 'Data penghuni berhasil dihapus' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getAllPenghuni,
    createPenghuni,
    updatePenghuni,
    deletePenghuni
};
