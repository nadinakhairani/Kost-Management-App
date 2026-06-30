// netlify/functions/listrik.js
// Handler untuk semua operasi CRUD PembayaranListrik
const supabase = require('./db');

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
};

const response = (statusCode, body) => ({
    statusCode,
    headers,
    body: JSON.stringify(body)
});

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return response(200, {});
    }

    const method = event.httpMethod;
    const pathParts = event.path.split('/').filter(Boolean);
    const id = pathParts[pathParts.length - 1];
    const hasId = id && !isNaN(parseInt(id));

    try {
        // GET /api/listrik — Ambil semua pembayaran listrik
        if (method === 'GET' && !hasId) {
            const { data, error } = await supabase
                .from('PembayaranListrik')
                .select(`
                    id_listrik,
                    id_penghuni,
                    bulan,
                    tahun,
                    jumlah_bayar,
                    tanggal_bayar,
                    Penghuni ( nama )
                `)
                .order('tanggal_bayar', { ascending: false })
                .order('id_listrik', { ascending: false });

            if (error) throw error;

            const result = data.map(l => ({
                ...l,
                nama_penghuni: l.Penghuni ? l.Penghuni.nama : 'Unknown',
                Penghuni: undefined
            }));

            return response(200, result);
        }

        // POST /api/listrik — Tambah pembayaran listrik baru
        if (method === 'POST') {
            const { id_penghuni, bulan, tahun, jumlah_bayar, tanggal_bayar } = JSON.parse(event.body || '{}');

            if (!id_penghuni || !bulan || !tahun || !jumlah_bayar || !tanggal_bayar) {
                return response(400, { error: 'Semua field (Penghuni, Bulan, Tahun, Jumlah Bayar, Tanggal Bayar) wajib diisi' });
            }

            // Verifikasi penghuni exists
            const { data: penghuni } = await supabase
                .from('Penghuni')
                .select('id_penghuni')
                .eq('id_penghuni', id_penghuni)
                .single();

            if (!penghuni) {
                return response(404, { error: 'Penghuni tidak ditemukan' });
            }

            const { data, error } = await supabase
                .from('PembayaranListrik')
                .insert({ id_penghuni, bulan, tahun, jumlah_bayar, tanggal_bayar })
                .select('id_listrik')
                .single();

            if (error) throw error;
            return response(201, { message: 'Pembayaran listrik berhasil ditambahkan', id_listrik: data.id_listrik });
        }

        // PUT /api/listrik/:id — Update pembayaran listrik
        if (method === 'PUT' && hasId) {
            const listrikId = parseInt(id);
            const { id_penghuni, bulan, tahun, jumlah_bayar, tanggal_bayar } = JSON.parse(event.body || '{}');

            if (!id_penghuni || !bulan || !tahun || !jumlah_bayar || !tanggal_bayar) {
                return response(400, { error: 'Semua field wajib diisi' });
            }

            // Cek record exists
            const { data: existing } = await supabase
                .from('PembayaranListrik')
                .select('id_listrik')
                .eq('id_listrik', listrikId)
                .single();

            if (!existing) {
                return response(404, { error: 'Data pembayaran listrik tidak ditemukan' });
            }

            // Verifikasi penghuni exists
            const { data: penghuni } = await supabase
                .from('Penghuni')
                .select('id_penghuni')
                .eq('id_penghuni', id_penghuni)
                .single();

            if (!penghuni) {
                return response(404, { error: 'Penghuni tidak ditemukan' });
            }

            const { error } = await supabase
                .from('PembayaranListrik')
                .update({ id_penghuni, bulan, tahun, jumlah_bayar, tanggal_bayar })
                .eq('id_listrik', listrikId);

            if (error) throw error;
            return response(200, { message: 'Pembayaran listrik berhasil diperbarui' });
        }

        // DELETE /api/listrik/:id — Hapus pembayaran listrik
        if (method === 'DELETE' && hasId) {
            const listrikId = parseInt(id);

            const { data: existing } = await supabase
                .from('PembayaranListrik')
                .select('id_listrik')
                .eq('id_listrik', listrikId)
                .single();

            if (!existing) {
                return response(404, { error: 'Data pembayaran listrik tidak ditemukan' });
            }

            const { error } = await supabase
                .from('PembayaranListrik')
                .delete()
                .eq('id_listrik', listrikId);

            if (error) throw error;
            return response(200, { message: 'Pembayaran listrik berhasil dihapus' });
        }

        return response(405, { error: 'Method tidak diizinkan' });

    } catch (err) {
        console.error('[listrik function error]', err);
        return response(500, { error: err.message });
    }
};
