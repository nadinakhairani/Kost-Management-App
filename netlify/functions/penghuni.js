// netlify/functions/penghuni.js
// Handler untuk semua operasi CRUD Penghuni
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
    const queryParams = event.queryStringParameters || {};

    try {
        // GET /api/penghuni — Ambil semua penghuni (dengan optional search & filter id_kamar)
        if (method === 'GET' && !hasId) {
            let query = supabase
                .from('Penghuni')
                .select(`
                    id_penghuni,
                    nama,
                    jenis_kelamin,
                    no_hp,
                    alamat,
                    id_kamar,
                    Kamar ( no_kamar )
                `)
                .order('nama', { ascending: true });

            if (queryParams.search) {
                query = query.ilike('nama', `%${queryParams.search}%`);
            }

            if (queryParams.id_kamar) {
                query = query.eq('id_kamar', parseInt(queryParams.id_kamar));
            }

            const { data, error } = await query;
            if (error) throw error;

            // Flatten: tambahkan no_kamar langsung ke objek
            const result = data.map(p => ({
                ...p,
                no_kamar: p.Kamar ? p.Kamar.no_kamar : null,
                Kamar: undefined
            }));

            return response(200, result);
        }

        // POST /api/penghuni — Tambah penghuni baru
        if (method === 'POST') {
            const { nama, jenis_kelamin, no_hp, alamat, id_kamar } = JSON.parse(event.body || '{}');

            if (!nama || !jenis_kelamin || !no_hp || !alamat) {
                return response(400, { error: 'Nama, jenis kelamin, no HP, dan alamat wajib diisi' });
            }

            // Verifikasi kapasitas kamar jika id_kamar diberikan
            if (id_kamar) {
                const { data: kamar } = await supabase
                    .from('Kamar')
                    .select('kapasitas')
                    .eq('id_kamar', id_kamar)
                    .single();

                if (!kamar) {
                    return response(404, { error: 'Kamar tidak ditemukan' });
                }

                const { count } = await supabase
                    .from('Penghuni')
                    .select('*', { count: 'exact', head: true })
                    .eq('id_kamar', id_kamar);

                if (count >= kamar.kapasitas) {
                    return response(400, { error: 'Kamar tersebut sudah penuh' });
                }
            }

            const { data, error } = await supabase
                .from('Penghuni')
                .insert({ nama, jenis_kelamin, no_hp, alamat, id_kamar: id_kamar || null })
                .select('id_penghuni')
                .single();

            if (error) throw error;
            return response(201, { message: 'Penghuni berhasil ditambahkan', id_penghuni: data.id_penghuni });
        }

        // PUT /api/penghuni/:id — Update penghuni
        if (method === 'PUT' && hasId) {
            const penghuniId = parseInt(id);
            const { nama, jenis_kelamin, no_hp, alamat, id_kamar } = JSON.parse(event.body || '{}');

            if (!nama || !jenis_kelamin || !no_hp || !alamat) {
                return response(400, { error: 'Nama, jenis kelamin, no HP, dan alamat wajib diisi' });
            }

            // Cek penghuni exists & ambil kamar lama
            const { data: existingPenghuni } = await supabase
                .from('Penghuni')
                .select('id_kamar')
                .eq('id_penghuni', penghuniId)
                .single();

            if (!existingPenghuni) {
                return response(404, { error: 'Penghuni tidak ditemukan' });
            }

            // Jika kamar berubah, verifikasi kapasitas kamar baru
            if (id_kamar && id_kamar !== existingPenghuni.id_kamar) {
                const { data: kamar } = await supabase
                    .from('Kamar')
                    .select('kapasitas')
                    .eq('id_kamar', id_kamar)
                    .single();

                if (!kamar) {
                    return response(404, { error: 'Kamar baru tidak ditemukan' });
                }

                const { count } = await supabase
                    .from('Penghuni')
                    .select('*', { count: 'exact', head: true })
                    .eq('id_kamar', id_kamar);

                if (count >= kamar.kapasitas) {
                    return response(400, { error: 'Kamar baru tersebut sudah penuh' });
                }
            }

            const { error } = await supabase
                .from('Penghuni')
                .update({ nama, jenis_kelamin, no_hp, alamat, id_kamar: id_kamar || null })
                .eq('id_penghuni', penghuniId);

            if (error) throw error;
            return response(200, { message: 'Data penghuni berhasil diperbarui' });
        }

        // DELETE /api/penghuni/:id — Hapus penghuni
        if (method === 'DELETE' && hasId) {
            const penghuniId = parseInt(id);

            const { data: existing } = await supabase
                .from('Penghuni')
                .select('id_penghuni')
                .eq('id_penghuni', penghuniId)
                .single();

            if (!existing) {
                return response(404, { error: 'Penghuni tidak ditemukan' });
            }

            const { error } = await supabase
                .from('Penghuni')
                .delete()
                .eq('id_penghuni', penghuniId);

            if (error) throw error;
            return response(200, { message: 'Data penghuni berhasil dihapus' });
        }

        return response(405, { error: 'Method tidak diizinkan' });

    } catch (err) {
        console.error('[penghuni function error]', err);
        return response(500, { error: err.message });
    }
};
