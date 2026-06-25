const { poolPromise, sql } = require('../config/db');

// Get all rooms
const getAllKamar = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM Kamar ORDER BY no_kamar ASC');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Create a room
const createKamar = async (req, res) => {
    const { no_kamar, lantai, kapasitas } = req.body;
    
    if (!no_kamar || lantai === undefined || kapasitas === undefined) {
        return res.status(400).json({ error: 'Nomor kamar, lantai, dan kapasitas wajib diisi' });
    }

    try {
        const pool = await poolPromise;
        
        // Check if no_kamar already exists
        const checkResult = await pool.request()
            .input('no_kamar', sql.VarChar, no_kamar)
            .query('SELECT 1 FROM Kamar WHERE no_kamar = @no_kamar');
            
        if (checkResult.recordset.length > 0) {
            return res.status(400).json({ error: `Kamar nomor ${no_kamar} sudah terdaftar` });
        }

        const result = await pool.request()
            .input('no_kamar', sql.VarChar, no_kamar)
            .input('lantai', sql.Int, lantai)
            .input('kapasitas', sql.Int, kapasitas)
            .query('INSERT INTO Kamar (no_kamar, lantai, kapasitas) OUTPUT INSERTED.id_kamar VALUES (@no_kamar, @lantai, @kapasitas)');
            
        res.status(201).json({ 
            message: 'Kamar berhasil ditambahkan', 
            id_kamar: result.recordset[0].id_kamar 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update a room
const updateKamar = async (req, res) => {
    const { id } = req.params;
    const { no_kamar, lantai, kapasitas } = req.body;

    if (!no_kamar || lantai === undefined || kapasitas === undefined) {
        return res.status(400).json({ error: 'Nomor kamar, lantai, dan kapasitas wajib diisi' });
    }

    try {
        const pool = await poolPromise;
        
        // Check if room exists
        const checkRoom = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT 1 FROM Kamar WHERE id_kamar = @id');
            
        if (checkRoom.recordset.length === 0) {
            return res.status(404).json({ error: 'Kamar tidak ditemukan' });
        }

        // Check if no_kamar is taken by another room
        const checkDuplicate = await pool.request()
            .input('id', sql.Int, id)
            .input('no_kamar', sql.VarChar, no_kamar)
            .query('SELECT 1 FROM Kamar WHERE no_kamar = @no_kamar AND id_kamar != @id');

        if (checkDuplicate.recordset.length > 0) {
            return res.status(400).json({ error: `Kamar nomor ${no_kamar} sudah digunakan oleh kamar lain` });
        }

        await pool.request()
            .input('id', sql.Int, id)
            .input('no_kamar', sql.VarChar, no_kamar)
            .input('lantai', sql.Int, lantai)
            .input('kapasitas', sql.Int, kapasitas)
            .query('UPDATE Kamar SET no_kamar = @no_kamar, lantai = @lantai, kapasitas = @kapasitas WHERE id_kamar = @id');

        res.json({ message: 'Kamar berhasil diperbarui' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete a room
const deleteKamar = async (req, res) => {
    const { id } = req.params;

    try {
        const pool = await poolPromise;
        const checkRoom = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT 1 FROM Kamar WHERE id_kamar = @id');
            
        if (checkRoom.recordset.length === 0) {
            return res.status(404).json({ error: 'Kamar tidak ditemukan' });
        }

        await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM Kamar WHERE id_kamar = @id');

        res.json({ message: 'Kamar berhasil dihapus' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getAllKamar,
    createKamar,
    updateKamar,
    deleteKamar
};
