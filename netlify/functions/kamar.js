// netlify/functions/kamar.js
// Handler untuk semua operasi CRUD Kamar
const supabase = require('./db');

// Helper untuk respons CORS
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
    // Handle preflight CORS
    if (event.httpMethod === 'OPTIONS') {
        return response(200, {});
    }

    const method = event.httpMethod;
    // Ambil ID dari path: /.netlify/functions/kamar/123 → "123"
    const pathParts = event.path.split('/').filter(Boolean);
    const id = pathParts[pathParts.length - 1];
    const hasId = id && !isNaN(parseInt(id));

    try {
        // GET /api/kamar — Ambil semua kamar
        if (method === 'GET' && !hasId) {
            const { data, error } = await supabase
                .from('Kamar')
                .select('*')
                .order('no_kamar', { ascending: true });

            if (error) throw error;
            return response(200, data);
        }

        // POST /api/kamar — Tambah kamar baru
        if (method === 'POST') {
            const { no_kamar, lantai, kapasitas } = JSON.parse(event.body || '{}');

            if (!no_kamar || lantai === undefined || kapasitas === undefined) {
                return response(400, { error: 'Nomor kamar, lantai, dan kapasitas wajib diisi' });
            }

            // Cek duplikat no_kamar
            const { data: existing } = await supabase
                .from('Kamar')
                .select('id_kamar')
                .eq('no_kamar', no_kamar)
                .single();

            if (existing) {
                return response(400, { error: `Kamar nomor ${no_kamar} sudah terdaftar` });
            }

            const { data, error } = await supabase
                .from('Kamar')
                .insert({ no_kamar, lantai, kapasitas })
                .select('id_kamar')
                .single();

            if (error) throw error;
            return response(201, { message: 'Kamar berhasil ditambahkan', id_kamar: data.id_kamar });
        }

        // PUT /api/kamar/:id — Update kamar
        if (method === 'PUT' && hasId) {
            const kamarId = parseInt(id);
            const { no_kamar, lantai, kapasitas } = JSON.parse(event.body || '{}');

            if (!no_kamar || lantai === undefined || kapasitas === undefined) {
                return response(400, { error: 'Nomor kamar, lantai, dan kapasitas wajib diisi' });
            }

            // Cek kamar exists
            const { data: existingRoom } = await supabase
                .from('Kamar')
                .select('id_kamar')
                .eq('id_kamar', kamarId)
                .single();

            if (!existingRoom) {
                return response(404, { error: 'Kamar tidak ditemukan' });
            }

            // Cek duplikat no_kamar (selain dirinya sendiri)
            const { data: duplicate } = await supabase
                .from('Kamar')
                .select('id_kamar')
                .eq('no_kamar', no_kamar)
                .neq('id_kamar', kamarId)
                .single();

            if (duplicate) {
                return response(400, { error: `Kamar nomor ${no_kamar} sudah digunakan oleh kamar lain` });
            }

            const { error } = await supabase
                .from('Kamar')
                .update({ no_kamar, lantai, kapasitas })
                .eq('id_kamar', kamarId);

            if (error) throw error;
            return response(200, { message: 'Kamar berhasil diperbarui' });
        }

        // DELETE /api/kamar/:id — Hapus kamar
        if (method === 'DELETE' && hasId) {
            const kamarId = parseInt(id);

            const { data: existingRoom } = await supabase
                .from('Kamar')
                .select('id_kamar')
                .eq('id_kamar', kamarId)
                .single();

            if (!existingRoom) {
                return response(404, { error: 'Kamar tidak ditemukan' });
            }

            const { error } = await supabase
                .from('Kamar')
                .delete()
                .eq('id_kamar', kamarId);

            if (error) throw error;
            return response(200, { message: 'Kamar berhasil dihapus' });
        }

        return response(405, { error: 'Method tidak diizinkan' });

    } catch (err) {
        console.error('[kamar function error]', err);
        return response(500, { error: err.message });
    }
};
