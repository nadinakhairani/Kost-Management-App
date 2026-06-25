const { poolPromise, sql } = require('../config/db');

// Login controller
const login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username dan password wajib diisi' });
    }

    try {
        const pool = await poolPromise;
        
        // Query the admin credentials
        const result = await pool.request()
            .input('username', sql.VarChar, username)
            .query('SELECT * FROM Admin WHERE username = @username');

        if (result.recordset.length === 0) {
            return res.status(401).json({ error: 'Username tidak terdaftar' });
        }

        const admin = result.recordset[0];

        // Perform password check
        if (admin.password !== password) {
            return res.status(401).json({ error: 'Password salah' });
        }

        // Successfully authenticated
        res.json({
            message: 'Login berhasil',
            admin: {
                id_admin: admin.id_admin,
                username: admin.username
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Register controller
const register = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username dan password wajib diisi' });
    }

    try {
        const pool = await poolPromise;

        // Check if username already exists
        const checkUser = await pool.request()
            .input('username', sql.VarChar, username)
            .query('SELECT * FROM Admin WHERE username = @username');

        if (checkUser.recordset.length > 0) {
            return res.status(400).json({ error: 'Username sudah digunakan oleh akun lain' });
        }

        // Insert new admin credentials
        await pool.request()
            .input('username', sql.VarChar, username)
            .input('password', sql.VarChar, password)
            .query('INSERT INTO Admin (username, password) VALUES (@username, @password)');

        res.status(201).json({
            message: 'Registrasi berhasil! Silakan masuk menggunakan akun baru Anda.'
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    login,
    register
};
