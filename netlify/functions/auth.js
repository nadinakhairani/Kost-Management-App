// netlify/functions/auth.js
// Handler untuk Login dan Register Admin
const supabase = require('./db');

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

    if (event.httpMethod !== 'POST') {
        return response(405, { error: 'Method tidak diizinkan' });
    }

    // Tentukan sub-action dari path:
    // /.netlify/functions/auth/login → sub = "login"
    // /.netlify/functions/auth/register → sub = "register"
    const pathParts = event.path.split('/').filter(Boolean);
    const funcIndex = pathParts.findIndex(p => p === 'auth');
    const sub = funcIndex >= 0 ? pathParts[funcIndex + 1] : null;

    try {
        const { username, password } = JSON.parse(event.body || '{}');

        if (!username || !password) {
            return response(400, { error: 'Username dan password wajib diisi' });
        }

        // POST /api/auth/login
        if (!sub || sub === 'login') {
            const { data: admin, error } = await supabase
                .from('Admin')
                .select('id_admin, username, password')
                .eq('username', username)
                .single();

            if (error || !admin) {
                return response(401, { error: 'Username tidak terdaftar' });
            }

            if (admin.password !== password) {
                return response(401, { error: 'Password salah' });
            }

            return response(200, {
                message: 'Login berhasil',
                admin: {
                    id_admin: admin.id_admin,
                    username: admin.username
                }
            });
        }

        // POST /api/auth/register
        if (sub === 'register') {
            // Cek apakah username sudah digunakan
            const { data: existing } = await supabase
                .from('Admin')
                .select('id_admin')
                .eq('username', username)
                .single();

            if (existing) {
                return response(400, { error: 'Username sudah digunakan oleh akun lain' });
            }

            const { error } = await supabase
                .from('Admin')
                .insert({ username, password });

            if (error) throw error;

            return response(201, {
                message: 'Registrasi berhasil! Silakan masuk menggunakan akun baru Anda.'
            });
        }

        return response(404, { error: 'Endpoint auth tidak ditemukan' });

    } catch (err) {
        console.error('[auth function error]', err);
        return response(500, { error: err.message });
    }
};
