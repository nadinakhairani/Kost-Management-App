const sql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_DATABASE || 'kost_db',
    port: parseInt(process.env.DB_PORT, 10) || 1433,
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: true,
        enableArithAbort: true,
        connectionTimeout: 4000 // Timeout in 4 seconds if connection fails
    }
};

console.log(`Configuring DB connection to ${config.server}:${config.port}/${config.database} as user ${config.user}`);

// ====================================================================
// IN-MEMORY MOCK DATABASE ENGINE (Fallback if SQL Server is Offline)
// ====================================================================
const mockData = {
    Kamar: [
        { id_kamar: 1, no_kamar: '101', lantai: 1, kapasitas: 2 },
        { id_kamar: 2, no_kamar: '102', lantai: 1, kapasitas: 1 },
        { id_kamar: 3, no_kamar: '201', lantai: 2, kapasitas: 2 },
        { id_kamar: 4, no_kamar: '202', lantai: 2, kapasitas: 1 },
        { id_kamar: 5, no_kamar: '203', lantai: 2, kapasitas: 2 }
    ],
    Penghuni: [
        { id_penghuni: 1, nama: 'Budi Santoso', jenis_kelamin: 'Laki-laki', no_hp: '081234567890', alamat: 'Jl. Merdeka No. 10, Surabaya', id_kamar: 1 },
        { id_penghuni: 2, nama: 'Siti Rahma', jenis_kelamin: 'Perempuan', no_hp: '085678901234', alamat: 'Jl. Mawar No. 4, Malang', id_kamar: 2 },
        { id_penghuni: 3, nama: 'Andi Wijaya', jenis_kelamin: 'Laki-laki', no_hp: '082345678901', alamat: 'Jl. Dahlia No. 15, Sidoarjo', id_kamar: 3 },
        { id_penghuni: 4, nama: 'Rina Amelia', jenis_kelamin: 'Perempuan', no_hp: '089876543210', alamat: 'Jl. Melati No. 8, Gresik', id_kamar: 5 }
    ],
    PembayaranListrik: [
        { id_listrik: 1, id_penghuni: 1, bulan: 'Januari', tahun: 2026, jumlah_bayar: 150000.00, tanggal_bayar: '2026-01-05' },
        { id_listrik: 2, id_penghuni: 1, bulan: 'Februari', tahun: 2026, jumlah_bayar: 160000.00, tanggal_bayar: '2026-02-05' },
        { id_listrik: 3, id_penghuni: 2, bulan: 'Januari', tahun: 2026, jumlah_bayar: 120000.00, tanggal_bayar: '2026-01-07' },
        { id_listrik: 4, id_penghuni: 3, bulan: 'Januari', tahun: 2026, jumlah_bayar: 200000.00, tanggal_bayar: '2026-01-06' },
        { id_listrik: 5, id_penghuni: 4, bulan: 'Januari', tahun: 2026, jumlah_bayar: 145000.00, tanggal_bayar: '2026-01-08' },
        { id_listrik: 6, id_penghuni: 4, bulan: 'Februari', tahun: 2026, jumlah_bayar: 155000.00, tanggal_bayar: '2026-02-08' }
    ],
    PembayaranTahunan: [
        { id_tahunan: 1, id_penghuni: 1, tahun: 2026, jumlah_bayar: 12000000.00, tanggal_bayar: '2026-01-02' },
        { id_tahunan: 2, id_penghuni: 2, tahun: 2026, jumlah_bayar: 15000000.00, tanggal_bayar: '2026-01-03' },
        { id_tahunan: 3, id_penghuni: 3, tahun: 2026, jumlah_bayar: 12000000.00, tanggal_bayar: '2026-01-04' },
        { id_tahunan: 4, id_penghuni: 4, tahun: 2026, jumlah_bayar: 13000000.00, tanggal_bayar: '2026-01-05' }
    ],
    Admin: [
        { id_admin: 1, username: 'admin', password: 'pinkadmin123' }
    ]
};

class MockRequest {
    constructor() {
        this.inputs = {};
    }
    input(name, type, value) {
        if ((name === 'id' || name.startsWith('id_')) && typeof value === 'string' && /^\d+$/.test(value)) {
            this.inputs[name] = parseInt(value, 10);
        } else {
            this.inputs[name] = value;
        }
        return this;
    }
    async query(sqlStr) {
        sqlStr = sqlStr.trim();
        
        // --- KAMAR QUERIES ---
        if (sqlStr.includes('SELECT * FROM Kamar')) {
            let list = [...mockData.Kamar];
            list.sort((a, b) => a.no_kamar.localeCompare(b.no_kamar));
            return { recordset: list };
        }
        if (sqlStr.includes('SELECT 1 FROM Kamar WHERE no_kamar = @no_kamar AND id_kamar != @id')) {
            const exists = mockData.Kamar.some(k => k.no_kamar === this.inputs.no_kamar && k.id_kamar !== this.inputs.id);
            return { recordset: exists ? [1] : [] };
        }
        if (sqlStr.includes('SELECT 1 FROM Kamar WHERE no_kamar = @no_kamar')) {
            const exists = mockData.Kamar.some(k => k.no_kamar === this.inputs.no_kamar);
            return { recordset: exists ? [1] : [] };
        }
        if (sqlStr.includes('SELECT 1 FROM Kamar WHERE id_kamar = @id')) {
            const exists = mockData.Kamar.some(k => k.id_kamar === this.inputs.id);
            return { recordset: exists ? [1] : [] };
        }
        if (sqlStr.includes('INSERT INTO Kamar')) {
            const nextId = mockData.Kamar.reduce((max, k) => Math.max(max, k.id_kamar), 0) + 1;
            mockData.Kamar.push({
                id_kamar: nextId,
                no_kamar: this.inputs.no_kamar,
                lantai: this.inputs.lantai,
                kapasitas: this.inputs.kapasitas
            });
            return { recordset: [{ id_kamar: nextId }] };
        }
        if (sqlStr.includes('UPDATE Kamar SET')) {
            const idx = mockData.Kamar.findIndex(k => k.id_kamar === this.inputs.id);
            if (idx !== -1) {
                mockData.Kamar[idx].no_kamar = this.inputs.no_kamar;
                mockData.Kamar[idx].lantai = this.inputs.lantai;
                mockData.Kamar[idx].kapasitas = this.inputs.kapasitas;
            }
            return { recordset: [] };
        }
        if (sqlStr.includes('DELETE FROM Kamar WHERE id_kamar = @id')) {
            mockData.Kamar = mockData.Kamar.filter(k => k.id_kamar !== this.inputs.id);
            mockData.Penghuni.forEach(p => {
                if (p.id_kamar === this.inputs.id) p.id_kamar = null;
            });
            return { recordset: [] };
        }

        // --- PENGHUNI QUERIES ---
        if (sqlStr.includes('FROM Penghuni p') && sqlStr.includes('LEFT JOIN Kamar k')) {
            let list = mockData.Penghuni.map(p => {
                const kamar = mockData.Kamar.find(k => k.id_kamar === p.id_kamar);
                return { ...p, no_kamar: kamar ? kamar.no_kamar : null };
            });
            if (this.inputs.search) {
                const s = this.inputs.search.replace(/%/g, '').toLowerCase();
                list = list.filter(p => p.nama.toLowerCase().includes(s));
            }
            if (this.inputs.id_kamar) {
                list = list.filter(p => p.id_kamar === this.inputs.id_kamar);
            }
            list.sort((a, b) => a.nama.localeCompare(b.nama));
            return { recordset: list };
        }
        if (sqlStr.includes('SELECT kapasitas FROM Kamar WHERE id_kamar = @id_kamar')) {
            const kamar = mockData.Kamar.find(k => k.id_kamar === this.inputs.id_kamar);
            return { recordset: kamar ? [{ kapasitas: kamar.kapasitas }] : [] };
        }
        if (sqlStr.includes('SELECT COUNT(*) AS current_occupancy FROM Penghuni WHERE id_kamar = @id_kamar')) {
            const count = mockData.Penghuni.filter(p => p.id_kamar === this.inputs.id_kamar).length;
            return { recordset: [{ current_occupancy: count }] };
        }
        if (sqlStr.includes('INSERT INTO Penghuni')) {
            const nextId = mockData.Penghuni.reduce((max, p) => Math.max(max, p.id_penghuni), 0) + 1;
            mockData.Penghuni.push({
                id_penghuni: nextId,
                nama: this.inputs.nama,
                jenis_kelamin: this.inputs.jenis_kelamin,
                no_hp: this.inputs.no_hp,
                alamat: this.inputs.alamat,
                id_kamar: this.inputs.id_kamar
            });
            return { recordset: [{ id_penghuni: nextId }] };
        }
        if (sqlStr.includes('SELECT id_kamar FROM Penghuni WHERE id_penghuni = @id')) {
            const p = mockData.Penghuni.find(x => x.id_penghuni === this.inputs.id);
            return { recordset: p ? [{ id_kamar: p.id_kamar }] : [] };
        }
        if (sqlStr.includes('SELECT 1 FROM Penghuni WHERE id_penghuni = @id_penghuni')) {
            const exists = mockData.Penghuni.some(x => x.id_penghuni === this.inputs.id_penghuni);
            return { recordset: exists ? [1] : [] };
        }
        if (sqlStr.includes('SELECT 1 FROM Penghuni WHERE id_penghuni = @id')) {
            const exists = mockData.Penghuni.some(x => x.id_penghuni === this.inputs.id);
            return { recordset: exists ? [1] : [] };
        }
        if (sqlStr.includes('UPDATE Penghuni')) {
            const idx = mockData.Penghuni.findIndex(x => x.id_penghuni === this.inputs.id);
            if (idx !== -1) {
                mockData.Penghuni[idx].nama = this.inputs.nama;
                mockData.Penghuni[idx].jenis_kelamin = this.inputs.jenis_kelamin;
                mockData.Penghuni[idx].no_hp = this.inputs.no_hp;
                mockData.Penghuni[idx].alamat = this.inputs.alamat;
                mockData.Penghuni[idx].id_kamar = this.inputs.id_kamar;
            }
            return { recordset: [] };
        }
        if (sqlStr.includes('DELETE FROM Penghuni WHERE id_penghuni = @id')) {
            mockData.Penghuni = mockData.Penghuni.filter(x => x.id_penghuni !== this.inputs.id);
            mockData.PembayaranListrik = mockData.PembayaranListrik.filter(x => x.id_penghuni !== this.inputs.id);
            mockData.PembayaranTahunan = mockData.PembayaranTahunan.filter(x => x.id_penghuni !== this.inputs.id);
            return { recordset: [] };
        }

        // --- LISTRIK QUERIES ---
        if (sqlStr.includes('FROM PembayaranListrik pl') && sqlStr.includes('JOIN Penghuni p')) {
            let list = mockData.PembayaranListrik.map(l => {
                const p = mockData.Penghuni.find(x => x.id_penghuni === l.id_penghuni);
                return { ...l, nama_penghuni: p ? p.nama : 'Unknown' };
            });
            list.sort((a, b) => b.tanggal_bayar.localeCompare(a.tanggal_bayar));
            return { recordset: list };
        }
        if (sqlStr.includes('SELECT 1 FROM PembayaranListrik WHERE id_listrik = @id')) {
            const exists = mockData.PembayaranListrik.some(x => x.id_listrik === this.inputs.id);
            return { recordset: exists ? [1] : [] };
        }
        if (sqlStr.includes('INSERT INTO PembayaranListrik')) {
            const nextId = mockData.PembayaranListrik.reduce((max, x) => Math.max(max, x.id_listrik), 0) + 1;
            mockData.PembayaranListrik.push({
                id_listrik: nextId,
                id_penghuni: this.inputs.id_penghuni,
                bulan: this.inputs.bulan,
                tahun: this.inputs.tahun,
                jumlah_bayar: this.inputs.jumlah_bayar,
                tanggal_bayar: this.inputs.tanggal_bayar
            });
            return { recordset: [{ id_listrik: nextId }] };
        }
        if (sqlStr.includes('UPDATE PembayaranListrik')) {
            const idx = mockData.PembayaranListrik.findIndex(x => x.id_listrik === this.inputs.id);
            if (idx !== -1) {
                mockData.PembayaranListrik[idx].id_penghuni = this.inputs.id_penghuni;
                mockData.PembayaranListrik[idx].bulan = this.inputs.bulan;
                mockData.PembayaranListrik[idx].tahun = this.inputs.tahun;
                mockData.PembayaranListrik[idx].jumlah_bayar = this.inputs.jumlah_bayar;
                mockData.PembayaranListrik[idx].tanggal_bayar = this.inputs.tanggal_bayar;
            }
            return { recordset: [] };
        }
        if (sqlStr.includes('DELETE FROM PembayaranListrik WHERE id_listrik = @id')) {
            mockData.PembayaranListrik = mockData.PembayaranListrik.filter(x => x.id_listrik !== this.inputs.id);
            return { recordset: [] };
        }

        // --- TAHUNAN QUERIES ---
        if (sqlStr.includes('FROM PembayaranTahunan pt') && sqlStr.includes('JOIN Penghuni p')) {
            let list = mockData.PembayaranTahunan.map(t => {
                const p = mockData.Penghuni.find(x => x.id_penghuni === t.id_penghuni);
                return { ...t, nama_penghuni: p ? p.nama : 'Unknown' };
            });
            list.sort((a, b) => b.tanggal_bayar.localeCompare(a.tanggal_bayar));
            return { recordset: list };
        }
        if (sqlStr.includes('SELECT 1 FROM PembayaranTahunan WHERE id_tahunan = @id')) {
            const exists = mockData.PembayaranTahunan.some(x => x.id_tahunan === this.inputs.id);
            return { recordset: exists ? [1] : [] };
        }
        if (sqlStr.includes('INSERT INTO PembayaranTahunan')) {
            const nextId = mockData.PembayaranTahunan.reduce((max, x) => Math.max(max, x.id_tahunan), 0) + 1;
            mockData.PembayaranTahunan.push({
                id_tahunan: nextId,
                id_penghuni: this.inputs.id_penghuni,
                tahun: this.inputs.tahun,
                jumlah_bayar: this.inputs.jumlah_bayar,
                tanggal_bayar: this.inputs.tanggal_bayar
            });
            return { recordset: [{ id_tahunan: nextId }] };
        }
        if (sqlStr.includes('UPDATE PembayaranTahunan')) {
            const idx = mockData.PembayaranTahunan.findIndex(x => x.id_tahunan === this.inputs.id);
            if (idx !== -1) {
                mockData.PembayaranTahunan[idx].id_penghuni = this.inputs.id_penghuni;
                mockData.PembayaranTahunan[idx].tahun = this.inputs.tahun;
                mockData.PembayaranTahunan[idx].jumlah_bayar = this.inputs.jumlah_bayar;
                mockData.PembayaranTahunan[idx].tanggal_bayar = this.inputs.tanggal_bayar;
            }
            return { recordset: [] };
        }
        if (sqlStr.includes('DELETE FROM PembayaranTahunan WHERE id_tahunan = @id')) {
            mockData.PembayaranTahunan = mockData.PembayaranTahunan.filter(x => x.id_tahunan !== this.inputs.id);
            return { recordset: [] };
        }

        // --- REPORT & STATS QUERIES ---
        if (sqlStr.includes('SELECT COUNT(*) AS total_penghuni FROM Penghuni')) {
            return { recordset: [{ total_penghuni: mockData.Penghuni.length }] };
        }
        if (sqlStr.includes('SELECT COUNT(*) AS total_kamar FROM Kamar')) {
            return { recordset: [{ total_kamar: mockData.Kamar.length }] };
        }
        if (sqlStr.includes('SELECT SUM(jumlah_bayar) AS total_listrik FROM PembayaranListrik')) {
            const sum = mockData.PembayaranListrik.reduce((acc, curr) => acc + curr.jumlah_bayar, 0);
            return { recordset: [{ total_listrik: sum }] };
        }
        if (sqlStr.includes('SELECT SUM(jumlah_bayar) AS total_tahunan FROM PembayaranTahunan')) {
            const sum = mockData.PembayaranTahunan.reduce((acc, curr) => acc + curr.jumlah_bayar, 0);
            return { recordset: [{ total_tahunan: sum }] };
        }

        // --- REPORT: KAMAR OCCUPANCY ---
        if (sqlStr.includes('FROM Kamar k') && sqlStr.includes('COUNT(p.id_penghuni)')) {
            let list = mockData.Kamar.map(k => {
                const count = mockData.Penghuni.filter(p => p.id_kamar === k.id_kamar).length;
                return {
                    id_kamar: k.id_kamar,
                    no_kamar: k.no_kamar,
                    lantai: k.lantai,
                    kapasitas: k.kapasitas,
                    jumlah_penghuni: count,
                    sisa_slot: k.kapasitas - count
                };
            });
            list.sort((a, b) => a.no_kamar.localeCompare(b.no_kamar));
            return { recordset: list };
        }

        // --- REPORT: LISTRIK MONTHLY ---
        if (sqlStr.includes('FROM PembayaranListrik') && sqlStr.includes('GROUP BY') && sqlStr.includes('bulan')) {
            let grouped = {};
            mockData.PembayaranListrik.forEach(l => {
                const key = `${l.bulan}-${l.tahun}`;
                if (!grouped[key]) {
                    grouped[key] = { bulan: l.bulan, tahun: l.tahun, total_bayar: 0, total_transaksi: 0 };
                }
                grouped[key].total_bayar += l.jumlah_bayar;
                grouped[key].total_transaksi += 1;
            });
            let list = Object.values(grouped);
            const monthOrder = { 'Januari': 1, 'Februari': 2, 'Maret': 3, 'April': 4, 'Mei': 5, 'Juni': 6, 'Juli': 7, 'Agustus': 8, 'September': 9, 'Oktober': 10, 'November': 11, 'Desember': 12 };
            list.sort((a, b) => {
                if (a.tahun !== b.tahun) return b.tahun - a.tahun;
                return (monthOrder[a.bulan] || 99) - (monthOrder[b.bulan] || 99);
            });
            return { recordset: list };
        }

        // --- REPORT: TAHUNAN ---
        if (sqlStr.includes('FROM PembayaranTahunan') && sqlStr.includes('GROUP BY') && sqlStr.includes('tahun') && !sqlStr.includes('bulan')) {
            let grouped = {};
            mockData.PembayaranTahunan.forEach(t => {
                const key = t.tahun;
                if (!grouped[key]) {
                    grouped[key] = { tahun: t.tahun, total_bayar: 0, total_transaksi: 0 };
                }
                grouped[key].total_bayar += t.jumlah_bayar;
                grouped[key].total_transaksi += 1;
            });
            let list = Object.values(grouped);
            list.sort((a, b) => b.tahun - a.tahun);
            return { recordset: list };
        }

        // --- AUTH / ADMIN QUERIES ---
        if (sqlStr.includes('FROM Admin WHERE username = @username')) {
            const user = mockData.Admin.find(u => u.username === this.inputs.username);
            return { recordset: user ? [user] : [] };
        }
        if (sqlStr.includes('INSERT INTO Admin')) {
            const nextId = mockData.Admin.reduce((max, u) => Math.max(max, u.id_admin), 0) + 1;
            mockData.Admin.push({
                id_admin: nextId,
                username: this.inputs.username,
                password: this.inputs.password
            });
            return { recordset: [] };
        }

        console.warn('Mock DB unhandled query:', sqlStr);
        return { recordset: [] };
    }
}

const mockPool = {
    request: () => new MockRequest()
};

// ====================================================================
// SQL Server Connection Attempt
// ====================================================================
const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('Database Connection Established successfully!');
        return pool;
    })
    .catch(err => {
        console.log('====================================================================');
        console.log(' WARNING: KONEKSI SQL SERVER GAGAL (TIDAK DAPAT LOGIN / OFFLINE)!');
        console.log(' Aplikasi otomatis beralih ke MODE SIMULASI (Mock Database).');
        console.log(' Anda bisa tetap menguji semua fitur CRUD di browser Anda.');
        console.log('====================================================================');
        
        // Resolve with the mock pool instead of throwing error
        return mockPool;
    });

module.exports = {
    sql,
    poolPromise
};
