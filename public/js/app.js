/**
 * Kost Data Management App
 * Client-Side JavaScript Logic (SPA Style)
 */

document.addEventListener('DOMContentLoaded', () => {
    // Check Authentication State
    checkAuthState();

    // Navigation Switching
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Set active class
            navLinks.forEach(item => item.classList.remove('active'));
            link.classList.add('active');

            // Show corresponding section
            const targetSection = link.getAttribute('data-target');
            showSection(targetSection);
        });
    });

    // Initial load
    showSection('dashboard');
});

// Cache variables for options loading
let listKamarCached = [];
let listPenghuniCached = [];

// Helper: Show Section
function showSection(sectionName) {
    // Hide all sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(sec => sec.classList.add('d-none'));

    // Show target section
    const target = document.getElementById(`${sectionName}-section`);
    if (target) {
        target.classList.remove('d-none');
    }

    // Toggle marketing blocks and title container
    const marketingBlocks = document.getElementById('marketing-blocks');
    const titleContainer = document.getElementById('page-title-container');
    
    if (sectionName === 'dashboard') {
        if (marketingBlocks) marketingBlocks.classList.remove('d-none');
        if (titleContainer) titleContainer.classList.add('d-none');
    } else {
        if (marketingBlocks) marketingBlocks.classList.add('d-none');
        if (titleContainer) titleContainer.classList.remove('d-none');
    }

    // Update Page Title
    const titleElement = document.getElementById('page-title');
    if (titleElement) {
        const titles = {
            'kamar': 'Manajemen Data Kamar',
            'penghuni': 'Manajemen Data Penghuni',
            'listrik': 'Pembayaran Listrik Bulanan',
            'tahunan': 'Pembayaran Sewa Tahunan',
            'laporan': 'Laporan & Statistik'
        };
        titleElement.textContent = titles[sectionName] || 'Kost Management';
    }

    // Trigger Section Specific Loading
    if (sectionName === 'dashboard') {
        loadDashboardData();
    } else if (sectionName === 'kamar') {
        fetchKamar();
    } else if (sectionName === 'penghuni') {
        // Load rooms list for dropdowns first, then fetch residents
        loadRoomsDropdown().then(() => fetchPenghuni());
    } else if (sectionName === 'listrik') {
        loadResidentsDropdown().then(() => fetchListrik());
    } else if (sectionName === 'tahunan') {
        loadResidentsDropdown().then(() => fetchTahunan());
    } else if (sectionName === 'laporan') {
        loadLaporanData();
    }
}

// Helper: Format Rupiah
function formatRupiah(value) {
    if (value === null || value === undefined) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(value);
}

// Helper: Display Alerts
function showAlert(message, type = 'success') {
    const alertContainer = document.getElementById('alert-container');
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            <div><i class="bi bi-${type === 'success' ? 'check-circle' : 'exclamation-triangle'}-fill me-2"></i> ${message}</div>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    alertContainer.appendChild(wrapper);

    // Auto-remove after 4 seconds
    setTimeout(() => {
        const alert = bootstrap.Alert.getOrCreateInstance(wrapper.firstElementChild);
        if (alert) alert.close();
    }, 4000);
}

// ==========================================
// 1. DASHBOARD LOGIC
// ==========================================
async function loadDashboardData() {
    try {
        // Fetch global stats
        const response = await fetch('/api/reports/stats');
        const stats = await response.json();

        document.getElementById('stat-penghuni').textContent = stats.total_penghuni || 0;
        document.getElementById('stat-kamar').textContent = stats.total_kamar || 0;
        document.getElementById('stat-listrik').textContent = formatRupiah(stats.total_listrik);
        document.getElementById('stat-tahunan').textContent = formatRupiah(stats.total_tahunan);

        // Fetch Room ocupancy details for Dashboard
        const roomRepRes = await fetch('/api/reports/kamar-penghuni');
        const rooms = await roomRepRes.json();
        
        const tbody = document.querySelector('#dashboard-kamar-table tbody');
        tbody.innerHTML = '';

        if (rooms.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Belum ada data kamar.</td></tr>';
            return;
        }

        rooms.slice(0, 5).forEach(room => {
            const fillRate = room.kapasitas > 0 ? (room.jumlah_penghuni / room.kapasitas) : 0;
            let statusBadge = '';
            
            if (room.jumlah_penghuni === 0) {
                statusBadge = '<span class="badge bg-success">Kosong</span>';
            } else if (fillRate >= 1) {
                statusBadge = '<span class="badge bg-danger">Penuh</span>';
            } else {
                statusBadge = '<span class="badge bg-warning text-dark">Tersedia</span>';
            }

            tbody.innerHTML += `
                <tr>
                    <td class="fw-bold">${room.no_kamar}</td>
                    <td>Lantai ${room.lantai}</td>
                    <td>${room.kapasitas} Orang</td>
                    <td>${room.jumlah_penghuni} Terisi</td>
                    <td>${statusBadge}</td>
                </tr>
            `;
        });
    } catch (err) {
        console.error('Failed to load dashboard statistics:', err);
    }
}


// ==========================================
// 2. KAMAR LOGIC (CRUD)
// ==========================================
async function fetchKamar() {
    try {
        const response = await fetch('/api/kamar');
        const kamars = await response.json();
        listKamarCached = kamars;
        
        const tbody = document.querySelector('#kamar-table tbody');
        tbody.innerHTML = '';

        if (kamars.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">Data kamar kosong. Silakan tambah kamar baru.</td></tr>';
            return;
        }

        kamars.forEach(kamar => {
            tbody.innerHTML += `
                <tr>
                    <td>K-${kamar.id_kamar}</td>
                    <td class="fw-bold">${kamar.no_kamar}</td>
                    <td>Lantai ${kamar.lantai}</td>
                    <td>${kamar.kapasitas}</td>
                    <td class="text-end">
                        <button class="btn btn-outline-primary btn-sm me-1 rounded-pill" onclick="editKamar(${kamar.id_kamar})">
                            <i class="bi bi-pencil-square"></i> Edit
                        </button>
                        <button class="btn btn-outline-danger btn-sm rounded-pill" onclick="deleteKamar(${kamar.id_kamar})">
                            <i class="bi bi-trash"></i> Hapus
                        </button>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        showAlert('Gagal mengambil data kamar: ' + err.message, 'danger');
    }
}

function resetKamarForm() {
    document.getElementById('kamarForm').reset();
    document.getElementById('kamar-id').value = '';
    document.getElementById('kamarModalLabel').textContent = 'Tambah Kamar';
}

async function saveKamar(event) {
    event.preventDefault();
    const id = document.getElementById('kamar-id').value;
    const no_kamar = document.getElementById('kamar-no').value;
    const lantai = parseInt(document.getElementById('kamar-lantai').value, 10);
    const kapasitas = parseInt(document.getElementById('kamar-kapasitas').value, 10);

    const payload = { no_kamar, lantai, kapasitas };
    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/kamar/${id}` : '/api/kamar';

    try {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();

        if (!response.ok) throw new Error(result.error || 'Terjadi kesalahan sistem');

        showAlert(result.message);
        
        // Hide modal
        const modalEl = document.getElementById('kamarModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();

        fetchKamar();
    } catch (err) {
        showAlert(err.message, 'danger');
    }
}

function editKamar(id) {
    const kamar = listKamarCached.find(k => k.id_kamar === id);
    if (!kamar) return;

    document.getElementById('kamar-id').value = kamar.id_kamar;
    document.getElementById('kamar-no').value = kamar.no_kamar;
    document.getElementById('kamar-lantai').value = kamar.lantai;
    document.getElementById('kamar-kapasitas').value = kamar.kapasitas;
    document.getElementById('kamarModalLabel').textContent = 'Edit Kamar';

    const modal = new bootstrap.Modal(document.getElementById('kamarModal'));
    modal.show();
}

async function deleteKamar(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus data kamar ini?')) return;

    try {
        const response = await fetch(`/api/kamar/${id}`, { method: 'DELETE' });
        const result = await response.json();

        if (!response.ok) throw new Error(result.error);

        showAlert(result.message);
        fetchKamar();
    } catch (err) {
        showAlert('Gagal menghapus kamar: ' + err.message, 'danger');
    }
}


// ==========================================
// 3. PENGHUNI LOGIC (CRUD, SEARCH, FILTER)
// ==========================================
async function loadRoomsDropdown() {
    try {
        const response = await fetch('/api/kamar');
        const kamars = await response.json();
        
        // Populate filter dropdown
        const filterSelect = document.getElementById('filter-kamar');
        const savedFilterVal = filterSelect.value;
        filterSelect.innerHTML = '<option value="">Semua Kamar</option>';
        kamars.forEach(k => {
            filterSelect.innerHTML += `<option value="${k.id_kamar}">Kamar ${k.no_kamar}</option>`;
        });
        filterSelect.value = savedFilterVal;

        // Populate modal select
        const modalSelect = document.getElementById('penghuni-kamar');
        modalSelect.innerHTML = '<option value="">Belum Memiliki Kamar (Kosong)</option>';
        kamars.forEach(k => {
            modalSelect.innerHTML += `<option value="${k.id_kamar}">Kamar ${k.no_kamar} (Kapasitas: ${k.kapasitas})</option>`;
        });
    } catch (err) {
        console.error('Failed to load rooms into dropdown:', err);
    }
}

async function fetchPenghuni() {
    const search = document.getElementById('search-penghuni').value;
    const id_kamar = document.getElementById('filter-kamar').value;

    let url = '/api/penghuni?';
    if (search) url += `search=${encodeURIComponent(search)}&`;
    if (id_kamar) url += `id_kamar=${id_kamar}&`;

    try {
        const response = await fetch(url);
        const residents = await response.json();
        listPenghuniCached = residents;

        const tbody = document.querySelector('#penghuni-table tbody');
        tbody.innerHTML = '';

        if (residents.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">Data penghuni tidak ditemukan.</td></tr>';
            return;
        }

        residents.forEach(p => {
            const roomText = p.no_kamar ? `<span class="badge bg-primary">Kamar ${p.no_kamar}</span>` : '<span class="badge bg-secondary">Unassigned</span>';
            tbody.innerHTML += `
                <tr>
                    <td>P-${p.id_penghuni}</td>
                    <td class="fw-bold">${p.nama}</td>
                    <td>${p.jenis_kelamin}</td>
                    <td>${p.no_hp}</td>
                    <td><small>${p.alamat}</small></td>
                    <td>${roomText}</td>
                    <td class="text-end">
                        <button class="btn btn-outline-primary btn-sm me-1 rounded-pill" onclick="editPenghuni(${p.id_penghuni})">
                            <i class="bi bi-pencil-square"></i> Edit
                        </button>
                        <button class="btn btn-outline-danger btn-sm rounded-pill" onclick="deletePenghuni(${p.id_penghuni})">
                            <i class="bi bi-trash"></i> Hapus
                        </button>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        showAlert('Gagal mengambil data penghuni: ' + err.message, 'danger');
    }
}

function resetPenghuniForm() {
    document.getElementById('penghuniForm').reset();
    document.getElementById('penghuni-id').value = '';
    document.getElementById('penghuniModalLabel').textContent = 'Tambah Penghuni';
}

async function savePenghuni(event) {
    event.preventDefault();
    const id = document.getElementById('penghuni-id').value;
    const nama = document.getElementById('penghuni-nama').value;
    const jenis_kelamin = document.getElementById('penghuni-jk').value;
    const no_hp = document.getElementById('penghuni-hp').value;
    const alamat = document.getElementById('penghuni-alamat').value;
    const id_kamar = document.getElementById('penghuni-kamar').value;

    const payload = { nama, jenis_kelamin, no_hp, alamat, id_kamar: id_kamar ? parseInt(id_kamar, 10) : null };
    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/penghuni/${id}` : '/api/penghuni';

    try {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();

        if (!response.ok) throw new Error(result.error || 'Terjadi kesalahan sistem');

        showAlert(result.message);

        // Hide modal
        const modalEl = document.getElementById('penghuniModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();

        fetchPenghuni();
    } catch (err) {
        showAlert(err.message, 'danger');
    }
}

function editPenghuni(id) {
    const p = listPenghuniCached.find(x => x.id_penghuni === id);
    if (!p) return;

    document.getElementById('penghuni-id').value = p.id_penghuni;
    document.getElementById('penghuni-nama').value = p.nama;
    document.getElementById('penghuni-jk').value = p.jenis_kelamin;
    document.getElementById('penghuni-hp').value = p.no_hp;
    document.getElementById('penghuni-alamat').value = p.alamat;
    document.getElementById('penghuni-kamar').value = p.id_kamar || '';
    document.getElementById('penghuniModalLabel').textContent = 'Edit Penghuni';

    const modal = new bootstrap.Modal(document.getElementById('penghuniModal'));
    modal.show();
}

async function deletePenghuni(id) {
    if (!confirm('Menghapus penghuni juga akan menghapus data riwayat pembayarannya. Lanjutkan?')) return;

    try {
        const response = await fetch(`/api/penghuni/${id}`, { method: 'DELETE' });
        const result = await response.json();

        if (!response.ok) throw new Error(result.error);

        showAlert(result.message);
        fetchPenghuni();
    } catch (err) {
        showAlert('Gagal menghapus penghuni: ' + err.message, 'danger');
    }
}


// ==========================================
// 4. PEMBAYARAN LISTRIK LOGIC (CRUD)
// ==========================================
async function loadResidentsDropdown() {
    try {
        const response = await fetch('/api/penghuni');
        const residents = await response.json();
        
        // Populate electrical modal select
        const listrikSelect = document.getElementById('listrik-penghuni');
        listrikSelect.innerHTML = '<option value="">Pilih Penghuni</option>';
        
        // Populate annual modal select
        const tahunanSelect = document.getElementById('tahunan-penghuni');
        tahunanSelect.innerHTML = '<option value="">Pilih Penghuni</option>';

        residents.forEach(p => {
            const label = `${p.nama} (${p.no_kamar ? 'Kamar ' + p.no_kamar : 'Unassigned'})`;
            listrikSelect.innerHTML += `<option value="${p.id_penghuni}">${label}</option>`;
            tahunanSelect.innerHTML += `<option value="${p.id_penghuni}">${label}</option>`;
        });
    } catch (err) {
        console.error('Failed to load residents for billing dropdown:', err);
    }
}

let listListrikCached = [];
async function fetchListrik() {
    try {
        const response = await fetch('/api/listrik');
        const listListrik = await response.json();
        listListrikCached = listListrik;

        const tbody = document.querySelector('#listrik-table tbody');
        tbody.innerHTML = '';

        if (listListrik.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">Data pembayaran listrik kosong.</td></tr>';
            return;
        }

        listListrik.forEach(l => {
            tbody.innerHTML += `
                <tr>
                    <td>LST-${l.id_listrik}</td>
                    <td class="fw-bold">${l.nama_penghuni}</td>
                    <td>${l.bulan} ${l.tahun}</td>
                    <td class="text-info fw-bold">${formatRupiah(l.jumlah_bayar)}</td>
                    <td>${l.tanggal_bayar}</td>
                    <td class="text-end">
                        <button class="btn btn-outline-primary btn-sm me-1 rounded-pill" onclick="editListrik(${l.id_listrik})">
                            <i class="bi bi-pencil-square"></i> Edit
                        </button>
                        <button class="btn btn-outline-danger btn-sm rounded-pill" onclick="deleteListrik(${l.id_listrik})">
                            <i class="bi bi-trash"></i> Hapus
                        </button>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        showAlert('Gagal mengambil data listrik: ' + err.message, 'danger');
    }
}

function resetListrikForm() {
    document.getElementById('listrikForm').reset();
    document.getElementById('listrik-id').value = '';
    document.getElementById('listrik-tahun').value = new Date().getFullYear();
    document.getElementById('listrik-tanggal').value = new Date().toISOString().split('T')[0];
    document.getElementById('listrikModalLabel').textContent = 'Tambah Pembayaran Listrik';
}

async function saveListrik(event) {
    event.preventDefault();
    const id = document.getElementById('listrik-id').value;
    const id_penghuni = parseInt(document.getElementById('listrik-penghuni').value, 10);
    const bulan = document.getElementById('listrik-bulan').value;
    const tahun = parseInt(document.getElementById('listrik-tahun').value, 10);
    const jumlah_bayar = parseFloat(document.getElementById('listrik-jumlah').value);
    const tanggal_bayar = document.getElementById('listrik-tanggal').value;

    const payload = { id_penghuni, bulan, tahun, jumlah_bayar, tanggal_bayar };
    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/listrik/${id}` : '/api/listrik';

    try {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();

        if (!response.ok) throw new Error(result.error || 'Terjadi kesalahan sistem');

        showAlert(result.message);

        const modalEl = document.getElementById('listrikModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();

        fetchListrik();
    } catch (err) {
        showAlert(err.message, 'danger');
    }
}

function editListrik(id) {
    const l = listListrikCached.find(x => x.id_listrik === id);
    if (!l) return;

    document.getElementById('listrik-id').value = l.id_listrik;
    document.getElementById('listrik-penghuni').value = l.id_penghuni;
    document.getElementById('listrik-bulan').value = l.bulan;
    document.getElementById('listrik-tahun').value = l.tahun;
    document.getElementById('listrik-jumlah').value = l.jumlah_bayar;
    document.getElementById('listrik-tanggal').value = l.tanggal_bayar;
    document.getElementById('listrikModalLabel').textContent = 'Edit Pembayaran Listrik';

    const modal = new bootstrap.Modal(document.getElementById('listrikModal'));
    modal.show();
}

async function deleteListrik(id) {
    if (!confirm('Hapus transaksi pembayaran listrik ini?')) return;

    try {
        const response = await fetch(`/api/listrik/${id}`, { method: 'DELETE' });
        const result = await response.json();

        if (!response.ok) throw new Error(result.error);

        showAlert(result.message);
        fetchListrik();
    } catch (err) {
        showAlert('Gagal menghapus transaksi listrik: ' + err.message, 'danger');
    }
}


// ==========================================
// 5. PEMBAYARAN TAHUNAN LOGIC (CRUD)
// ==========================================
let listTahunanCached = [];
async function fetchTahunan() {
    try {
        const response = await fetch('/api/tahunan');
        const listTahunan = await response.json();
        listTahunanCached = listTahunan;

        const tbody = document.querySelector('#tahunan-table tbody');
        tbody.innerHTML = '';

        if (listTahunan.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">Data sewa tahunan kosong.</td></tr>';
            return;
        }

        listTahunan.forEach(t => {
            tbody.innerHTML += `
                <tr>
                    <td>THN-${t.id_tahunan}</td>
                    <td class="fw-bold">${t.nama_penghuni}</td>
                    <td>Sewa Tahun ${t.tahun}</td>
                    <td class="text-warning fw-bold">${formatRupiah(t.jumlah_bayar)}</td>
                    <td>${t.tanggal_bayar}</td>
                    <td class="text-end">
                        <button class="btn btn-outline-primary btn-sm me-1 rounded-pill" onclick="editTahunan(${t.id_tahunan})">
                            <i class="bi bi-pencil-square"></i> Edit
                        </button>
                        <button class="btn btn-outline-danger btn-sm rounded-pill" onclick="deleteTahunan(${t.id_tahunan})">
                            <i class="bi bi-trash"></i> Hapus
                        </button>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        showAlert('Gagal mengambil data tahunan: ' + err.message, 'danger');
    }
}

function resetTahunanForm() {
    document.getElementById('tahunanForm').reset();
    document.getElementById('tahunan-id').value = '';
    document.getElementById('tahunan-tahun').value = new Date().getFullYear();
    document.getElementById('tahunan-tanggal').value = new Date().toISOString().split('T')[0];
    document.getElementById('tahunanModalLabel').textContent = 'Tambah Pembayaran Tahunan';
}

async function saveTahunan(event) {
    event.preventDefault();
    const id = document.getElementById('tahunan-id').value;
    const id_penghuni = parseInt(document.getElementById('tahunan-penghuni').value, 10);
    const tahun = parseInt(document.getElementById('tahunan-tahun').value, 10);
    const jumlah_bayar = parseFloat(document.getElementById('tahunan-jumlah').value);
    const tanggal_bayar = document.getElementById('tahunan-tanggal').value;

    const payload = { id_penghuni, tahun, jumlah_bayar, tanggal_bayar };
    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/tahunan/${id}` : '/api/tahunan';

    try {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();

        if (!response.ok) throw new Error(result.error || 'Terjadi kesalahan sistem');

        showAlert(result.message);

        const modalEl = document.getElementById('tahunanModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();

        fetchTahunan();
    } catch (err) {
        showAlert(err.message, 'danger');
    }
}

function editTahunan(id) {
    const t = listTahunanCached.find(x => x.id_tahunan === id);
    if (!t) return;

    document.getElementById('tahunan-id').value = t.id_tahunan;
    document.getElementById('tahunan-penghuni').value = t.id_penghuni;
    document.getElementById('tahunan-tahun').value = t.tahun;
    document.getElementById('tahunan-jumlah').value = t.jumlah_bayar;
    document.getElementById('tahunan-tanggal').value = t.tanggal_bayar;
    document.getElementById('tahunanModalLabel').textContent = 'Edit Pembayaran Tahunan';

    const modal = new bootstrap.Modal(document.getElementById('tahunanModal'));
    modal.show();
}

async function deleteTahunan(id) {
    if (!confirm('Hapus transaksi pembayaran tahunan sewa ini?')) return;

    try {
        const response = await fetch(`/api/tahunan/${id}`, { method: 'DELETE' });
        const result = await response.json();

        if (!response.ok) throw new Error(result.error);

        showAlert(result.message);
        fetchTahunan();
    } catch (err) {
        showAlert('Gagal menghapus transaksi sewa tahunan: ' + err.message, 'danger');
    }
}


// ==========================================
// 6. LAPORAN LOGIC (AGGREGATIONS & STATS)
// ==========================================
async function loadLaporanData() {
    try {
        // 1. Report: Room Occupancy Status (JOIN, GROUP BY, COUNT)
        const roomRes = await fetch('/api/reports/kamar-penghuni');
        const rooms = await roomRes.json();
        
        const kamarTableTbody = document.querySelector('#report-kamar-table tbody');
        kamarTableTbody.innerHTML = '';
        rooms.forEach(room => {
            const badgeClass = room.sisa_slot <= 0 ? 'bg-danger' : (room.jumlah_penghuni === 0 ? 'bg-success' : 'bg-warning text-dark');
            const statusLabel = room.sisa_slot <= 0 ? 'Penuh' : `Sisa ${room.sisa_slot} Slot`;

            kamarTableTbody.innerHTML += `
                <tr>
                    <td>K-${room.id_kamar}</td>
                    <td class="fw-bold">Kamar ${room.no_kamar}</td>
                    <td>Lantai ${room.lantai}</td>
                    <td>${room.kapasitas} Orang</td>
                    <td><span class="badge bg-secondary fs-7">${room.jumlah_penghuni} Penghuni</span></td>
                    <td><span class="badge ${badgeClass}">${statusLabel}</span></td>
                </tr>
            `;
        });

        // 2. Report: Electricity Monthly Summary (GROUP BY, SUM)
        const listrikRes = await fetch('/api/reports/listrik-bulanan');
        const listListrik = await listrikRes.json();
        
        const listrikTableTbody = document.querySelector('#report-listrik-table tbody');
        listrikTableTbody.innerHTML = '';

        if (listListrik.length === 0) {
            listrikTableTbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Belum ada transaksi listrik.</td></tr>';
        } else {
            listListrik.forEach(l => {
                listrikTableTbody.innerHTML += `
                    <tr>
                        <td>${l.bulan}</td>
                        <td class="fw-bold">${l.tahun}</td>
                        <td>${l.total_transaksi} Transaksi</td>
                        <td class="text-success fw-bold">${formatRupiah(l.total_bayar)}</td>
                    </tr>
                `;
            });
        }

        // 3. Report: Annual Summary (GROUP BY, SUM)
        const tahunanRes = await fetch('/api/reports/tahunan-tahunan');
        const listTahunan = await tahunanRes.json();
        
        const tahunanTableTbody = document.querySelector('#report-tahunan-table tbody');
        tahunanTableTbody.innerHTML = '';

        if (listTahunan.length === 0) {
            tahunanTableTbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">Belum ada transaksi sewa tahunan.</td></tr>';
        } else {
            listTahunan.forEach(t => {
                tahunanTableTbody.innerHTML += `
                    <tr>
                        <td class="fw-bold">${t.tahun}</td>
                        <td>${t.total_transaksi} Transaksi</td>
                        <td class="text-success fw-bold">${formatRupiah(t.total_bayar)}</td>
                    </tr>
                `;
            });
        }

    } catch (err) {
        showAlert('Gagal memuat rekap laporan: ' + err.message, 'danger');
    }
}

// ==========================================
// 7. AUTHENTICATION LOGIC (LOGIN / LOGOUT)
// ==========================================
function checkAuthState() {
    const adminUser = localStorage.getItem('adminUser');
    const loginWrapper = document.getElementById('login-wrapper');
    const appWrapper = document.getElementById('app-wrapper');
    
    if (adminUser) {
        if (loginWrapper) loginWrapper.classList.add('d-none');
        if (appWrapper) appWrapper.classList.remove('d-none');
    } else {
        if (loginWrapper) loginWrapper.classList.remove('d-none');
        if (appWrapper) appWrapper.classList.add('d-none');
    }
}

async function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const loginAlert = document.getElementById('login-alert');
    const loginErrorMsg = document.getElementById('login-error-msg');
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Login gagal');
        }
        
        // Save admin session in localStorage
        localStorage.setItem('adminUser', JSON.stringify(result.admin));
        
        // Hide error alert
        if (loginAlert) loginAlert.classList.add('d-none');
        
        // Refresh view states
        checkAuthState();
        
        // Show dashboard home
        showSection('dashboard');
        
    } catch (err) {
        if (loginAlert && loginErrorMsg) {
            loginErrorMsg.textContent = err.message;
            loginAlert.classList.remove('d-none');
        }
    }
}

function logout() {
    if (confirm('Apakah Anda yakin ingin keluar (logout)?')) {
        localStorage.removeItem('adminUser');
        window.location.reload();
    }
}

function toggleAuthView(view) {
    const loginView = document.getElementById('login-view');
    const registerView = document.getElementById('register-view');
    
    // Clear forms and alerts when switching
    document.getElementById('loginForm').reset();
    document.getElementById('registerForm').reset();
    
    const loginAlert = document.getElementById('login-alert');
    const registerAlert = document.getElementById('register-alert');
    const registerSuccessAlert = document.getElementById('register-success-alert');
    
    if (loginAlert) loginAlert.classList.add('d-none');
    if (registerAlert) registerAlert.classList.add('d-none');
    if (registerSuccessAlert) registerSuccessAlert.classList.add('d-none');
    
    if (view === 'register') {
        loginView.classList.add('d-none');
        registerView.classList.remove('d-none');
    } else {
        loginView.classList.remove('d-none');
        registerView.classList.add('d-none');
    }
}

async function handleRegister(event) {
    event.preventDefault();
    const username = document.getElementById('register-username').value.trim();
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    
    const registerAlert = document.getElementById('register-alert');
    const registerErrorMsg = document.getElementById('register-error-msg');
    const registerSuccessAlert = document.getElementById('register-success-alert');
    const registerSuccessMsg = document.getElementById('register-success-msg');
    
    // Hide alerts
    if (registerAlert) registerAlert.classList.add('d-none');
    if (registerSuccessAlert) registerSuccessAlert.classList.add('d-none');
    
    if (password !== confirmPassword) {
        if (registerAlert && registerErrorMsg) {
            registerErrorMsg.textContent = 'Konfirmasi password tidak cocok!';
            registerAlert.classList.remove('d-none');
        }
        return;
    }
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Registrasi gagal');
        }
        
        // Show success alert
        if (registerSuccessAlert && registerSuccessMsg) {
            registerSuccessMsg.textContent = result.message || 'Registrasi berhasil! Silakan masuk.';
            registerSuccessAlert.classList.remove('d-none');
        }
        
        // Auto toggle back to login form after 2 seconds
        setTimeout(() => {
            toggleAuthView('login');
            // Populate the username to make it easy to login
            document.getElementById('login-username').value = username;
        }, 2000);
        
    } catch (err) {
        if (registerAlert && registerErrorMsg) {
            registerErrorMsg.textContent = err.message;
            registerAlert.classList.remove('d-none');
        }
    }
}
