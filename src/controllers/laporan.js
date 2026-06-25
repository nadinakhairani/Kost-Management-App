const { poolPromise } = require('../config/db');

// Get overall stats for the dashboard
const getDashboardStats = async (req, res) => {
    try {
        const pool = await poolPromise;
        
        // Execute multiple queries parallelly for dashboard cards
        const [penghuniRes, kamarRes, listrikRes, tahunanRes] = await Promise.all([
            pool.request().query('SELECT COUNT(*) AS total_penghuni FROM Penghuni'),
            pool.request().query('SELECT COUNT(*) AS total_kamar FROM Kamar'),
            pool.request().query('SELECT SUM(jumlah_bayar) AS total_listrik FROM PembayaranListrik'),
            pool.request().query('SELECT SUM(jumlah_bayar) AS total_tahunan FROM PembayaranTahunan')
        ]);

        res.json({
            total_penghuni: penghuniRes.recordset[0].total_penghuni,
            total_kamar: kamarRes.recordset[0].total_kamar,
            total_listrik: listrikRes.recordset[0].total_listrik || 0,
            total_tahunan: tahunanRes.recordset[0].total_tahunan || 0
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get residents count per room (JOIN, GROUP BY, COUNT)
const getPenghuniPerKamarReport = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT k.id_kamar, k.no_kamar, k.lantai, k.kapasitas, 
                   COUNT(p.id_penghuni) AS jumlah_penghuni,
                   (k.kapasitas - COUNT(p.id_penghuni)) AS sisa_slot
            FROM Kamar k
            LEFT JOIN Penghuni p ON k.id_kamar = p.id_kamar
            GROUP BY k.id_kamar, k.no_kamar, k.lantai, k.kapasitas
            ORDER BY k.no_kamar ASC
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get total electricity payment report by Month and Year (GROUP BY, SUM, COUNT)
const getListrikReport = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT bulan, tahun, 
                   SUM(jumlah_bayar) AS total_bayar, 
                   COUNT(id_listrik) AS total_transaksi
            FROM PembayaranListrik
            GROUP BY bulan, tahun
            ORDER BY tahun DESC, 
                     CASE bulan
                        WHEN 'Januari' THEN 1
                        WHEN 'Februari' THEN 2
                        WHEN 'Maret' THEN 3
                        WHEN 'April' THEN 4
                        WHEN 'Mei' THEN 5
                        WHEN 'Juni' THEN 6
                        WHEN 'Juli' THEN 7
                        WHEN 'Agustus' THEN 8
                        WHEN 'September' THEN 9
                        WHEN 'Oktober' THEN 10
                        WHEN 'November' THEN 11
                        WHEN 'Desember' THEN 12
                        ELSE 99
                     END ASC
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get total annual payment report by Year (GROUP BY, SUM, COUNT)
const getTahunanReport = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT tahun, 
                   SUM(jumlah_bayar) AS total_bayar, 
                   COUNT(id_tahunan) AS total_transaksi
            FROM PembayaranTahunan
            GROUP BY tahun
            ORDER BY tahun DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getDashboardStats,
    getPenghuniPerKamarReport,
    getListrikReport,
    getTahunanReport
};
