// netlify/functions/tahunan.js
// Handler untuk semua operasi CRUD PembayaranTahunan
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
        // GET /api/tahunan — Ambil semua pembayaran tahunan
        if (method === 'GET' && !hasId) {
            const { data, error } = await supabase
                .from('PembayaranTahunan')
                .select(`
                    id_tahunan,
                    id_penghuni,
                    tahun,
                    jumlah_bayar,
                    tanggal_bayar,
                    Penghuni ( nama )
                `)
                .order('tanggal_bayar', { ascending: false })
                .order('id_tahunan', { ascending: false });

            if (error) throw error;

            const result = data.map(t => ({
                ...t,
                nama_penghuni: t.Penghuni ? t.Penghuni.nama : 'Unknown',
                Penghuni: undefined
            }));

            return response(200, result);
        }

        // POST /api/tahunan — Tambah pembayaran tahunan baru
        if (method === 'POST') {
            const { id_penghuni, tahun, jumlah_bayar, tanggal_bayar } = JSON.parse(event.body || '{}');

            if (!id_penghuni || !tahun || !jumlah_bayar || !tanggal_bayar) {
                return response(400, { error: 'Semua field (Penghuni, Tahun, Jumlah Bayar, Tanggal Bayar) wajib diisi' });
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
                .from('PembayaranTahunan')
                .insert({ id_penghuni, tahun, jumlah_bayar, tanggal_bayar })
                .select('id_tahunan')
                .single();

            if (error) throw error;
            return response(201, { message: 'Pembayaran tahunan berhasil ditambahkan', id_tahunan: data.id_tahunan });
        }

        // PUT /api/tahunan/:id — Update pembayaran tahunan
        if (method === 'PUT' && hasId) {
            const tahunanId = parseInt(id);
            const { id_penghuni, tahun, jumlah_bayar, tanggal_bayar } = JSON.parse(event.body || '{}');

            if (!id_penghuni || !tahun || !jumlah_bayar || !tanggal_bayar) {
                return response(400, { error: 'Semua field wajib diisi' });
            }

            // Cek record exists
            const { data: existing } = await supabase
                .from('PembayaranTahunan')
                .select('id_tahunan')
                .eq('id_tahunan', tahunanId)
                .single();

            if (!existing) {
                return response(404, { error: 'Data pembayaran tahunan tidak ditemukan' });
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
                .from('PembayaranTahunan')
                .update({ id_penghuni, tahun, jumlah_bayar, tanggal_bayar })
                .eq('id_tahunan', tahunanId);

            if (error) throw error;
            return response(200, { message: 'Pembayaran tahunan berhasil diperbarui' });
        }

        // DELETE /api/tahunan/:id — Hapus pembayaran tahunan
        if (method === 'DELETE' && hasId) {
            const tahunanId = parseInt(id);

            const { data: existing } = await supabase
                .from('PembayaranTahunan')
                .select('id_tahunan')
                .eq('id_tahunan', tahunanId)
                .single();

            if (!existing) {
                return response(404, { error: 'Data pembayaran tahunan tidak ditemukan' });
            }

            const { error } = await supabase
                .from('PembayaranTahunan')
                .delete()
                .eq('id_tahunan', tahunanId);

            if (error) throw error;
            return response(200, { message: 'Pembayaran tahunan berhasil dihapus' });
        }

        return response(405, { error: 'Method tidak diizinkan' });

    } catch (err) {
        console.error('[tahunan function error]', err);
        return response(500, { error: err.message });
    }
};
