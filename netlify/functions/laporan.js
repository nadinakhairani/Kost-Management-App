// netlify/functions/laporan.js
// Handler untuk semua endpoint laporan / reports
const supabase = require('./db');

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
};

const response = (statusCode, body) => ({
    statusCode,
    headers,
    body: JSON.stringify(body)
});

// Urutan bulan untuk sorting
const MONTH_ORDER = {
    'Januari': 1, 'Februari': 2, 'Maret': 3, 'April': 4,
    'Mei': 5, 'Juni': 6, 'Juli': 7, 'Agustus': 8,
    'September': 9, 'Oktober': 10, 'November': 11, 'Desember': 12
};

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return response(200, {});
    }

    if (event.httpMethod !== 'GET') {
        return response(405, { error: 'Method tidak diizinkan' });
    }

    // Ambil sub-path setelah /laporan/ atau /reports/
    const pathParts = event.path.split('/').filter(Boolean);
    const funcIndex = pathParts.findIndex(p => p === 'laporan' || p === 'reports');
    const sub = funcIndex >= 0 ? pathParts[funcIndex + 1] : null;

    try {
        // GET /api/reports/stats — Dashboard stats
        if (!sub || sub === 'stats') {
            const [
                { count: total_penghuni },
                { count: total_kamar },
                { data: listrikData },
                { data: tahunanData }
            ] = await Promise.all([
                supabase.from('Penghuni').select('*', { count: 'exact', head: true }),
                supabase.from('Kamar').select('*', { count: 'exact', head: true }),
                supabase.from('PembayaranListrik').select('jumlah_bayar'),
                supabase.from('PembayaranTahunan').select('jumlah_bayar')
            ]);

            const total_listrik = (listrikData || []).reduce((sum, r) => sum + parseFloat(r.jumlah_bayar || 0), 0);
            const total_tahunan = (tahunanData || []).reduce((sum, r) => sum + parseFloat(r.jumlah_bayar || 0), 0);

            return response(200, {
                total_penghuni: total_penghuni || 0,
                total_kamar: total_kamar || 0,
                total_listrik,
                total_tahunan
            });
        }

        // GET /api/reports/kamar-occupancy — Laporan hunian kamar
        if (sub === 'kamar-penghuni') {
            const { data: kamarList, error: kamarError } = await supabase
                .from('Kamar')
                .select('id_kamar, no_kamar, lantai, kapasitas')
                .order('no_kamar', { ascending: true });

            if (kamarError) throw kamarError;

            const { data: penghuniList, error: penghuniError } = await supabase
                .from('Penghuni')
                .select('id_kamar')
                .not('id_kamar', 'is', null);

            if (penghuniError) throw penghuniError;

            const result = kamarList.map(k => {
                const jumlah_penghuni = penghuniList.filter(p => p.id_kamar === k.id_kamar).length;
                return {
                    ...k,
                    jumlah_penghuni,
                    sisa_slot: k.kapasitas - jumlah_penghuni
                };
            });

            return response(200, result);
        }

        // GET /api/reports/listrik — Laporan listrik per bulan
        if (sub === 'listrik-bulanan') {
            const { data, error } = await supabase
                .from('PembayaranListrik')
                .select('bulan, tahun, jumlah_bayar');

            if (error) throw error;

            // Group by bulan + tahun
            const grouped = {};
            data.forEach(l => {
                const key = `${l.tahun}-${l.bulan}`;
                if (!grouped[key]) {
                    grouped[key] = { bulan: l.bulan, tahun: l.tahun, total_bayar: 0, total_transaksi: 0 };
                }
                grouped[key].total_bayar += parseFloat(l.jumlah_bayar || 0);
                grouped[key].total_transaksi += 1;
            });

            const result = Object.values(grouped).sort((a, b) => {
                if (b.tahun !== a.tahun) return b.tahun - a.tahun;
                return (MONTH_ORDER[a.bulan] || 99) - (MONTH_ORDER[b.bulan] || 99);
            });

            return response(200, result);
        }

        // GET /api/reports/tahunan — Laporan pembayaran tahunan per tahun
        if (sub === 'tahunan-tahunan') {
            const { data, error } = await supabase
                .from('PembayaranTahunan')
                .select('tahun, jumlah_bayar');

            if (error) throw error;

            // Group by tahun
            const grouped = {};
            data.forEach(t => {
                if (!grouped[t.tahun]) {
                    grouped[t.tahun] = { tahun: t.tahun, total_bayar: 0, total_transaksi: 0 };
                }
                grouped[t.tahun].total_bayar += parseFloat(t.jumlah_bayar || 0);
                grouped[t.tahun].total_transaksi += 1;
            });

            const result = Object.values(grouped).sort((a, b) => b.tahun - a.tahun);
            return response(200, result);
        }

        return response(404, { error: 'Endpoint laporan tidak ditemukan' });

    } catch (err) {
        console.error('[laporan function error]', err);
        return response(500, { error: err.message });
    }
};
