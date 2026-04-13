// ===== DATABASE (localStorage) =====
const DB = {
  get: (k) => { try { return JSON.parse(localStorage.getItem('siap_' + k)) || null; } catch { return null; } },
  set: (k, v) => localStorage.setItem('siap_' + k, JSON.stringify(v)),
  del: (k) => localStorage.removeItem('siap_' + k)
};

// ===== SEED DATA =====
function initDB() {
  if (!DB.get('initialized')) {
    const users = [
      {
        id: 'u1', nip: '198501012010011001', nama: 'Administrator', golongan: 'PNS',
        pangkat: 'IIIc', jabatan: 'Administrator Sistem', unit: 'Bagian TI',
        email: 'admin@instansi.go.id', hp: '08111111111',
        username: 'admin', password: 'admin123', role: 'admin', status: 'Aktif',
        avatar: 'https://ui-avatars.com/api/?name=Admin&background=3b5bdb&color=fff&size=80'
      },
      {
        id: 'u2', nip: '199001012015032001', nama: 'Sri Tutut', golongan: 'PNS',
        pangkat: 'IIIa', jabatan: 'Pranata Komputer', unit: 'Bagian TI',
        email: 'sritutut@instansi.go.id', hp: '08222222222',
        username: 'pegawai', password: 'pegawai123', role: 'pegawai', status: 'Aktif',
        avatar: 'https://ui-avatars.com/api/?name=Sri+Tutut&background=e03131&color=fff&size=80'
      },
      {
        id: 'u3', nip: '199503152019081001', nama: 'Budi Santoso', golongan: 'PPPK',
        pangkat: 'IIIb', jabatan: 'Analis Kebijakan', unit: 'Bagian Perencanaan',
        email: 'budi@instansi.go.id', hp: '08333333333',
        username: 'budi', password: 'budi123', role: 'pegawai', status: 'Aktif',
        avatar: 'https://ui-avatars.com/api/?name=Budi+Santoso&background=2f9e44&color=fff&size=80'
      },
      {
        id: 'u4', nip: '198808202012042002', nama: 'Dewi Rahayu', golongan: 'PNS',
        pangkat: 'IIIb', jabatan: 'Pengelola Keuangan', unit: 'Bagian Keuangan',
        email: 'dewi@instansi.go.id', hp: '08444444444',
        username: 'dewi', password: 'dewi123', role: 'pegawai', status: 'Aktif',
        avatar: 'https://ui-avatars.com/api/?name=Dewi+Rahayu&background=7048e8&color=fff&size=80'
      }
    ];
    DB.set('users', users);

    // Seed some attendance data for the current month
    const absensi = [];
    const now = new Date();
    for (let i = 1; i <= now.getDate() - 1; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), i);
      if (d.getDay() === 0 || d.getDay() === 6) continue;
      const dateStr = formatDate(d);
      ['u2', 'u3', 'u4'].forEach(uid => {
        absensi.push({
          id: `abs_${uid}_${dateStr}`,
          userId: uid,
          tanggal: dateStr,
          masuk: `07:${Math.floor(Math.random() * 15 + 30).toString().padStart(2, '0')}`,
          istirahat: `12:00`,
          kembali: `13:0${Math.floor(Math.random() * 5)}`,
          pulang: `16:${Math.floor(Math.random() * 30 + 30).toString().padStart(2, '0')}`,
          status: 'Hadir',
          catatan: '',
          lat: -2.9761 + (Math.random() - .5) * .01,
          lon: 104.7754 + (Math.random() - .5) * .01
        });
      });
    }
    DB.set('absensi', absensi);
    DB.set('initialized', true);
  }
}

// ===== STATE =====
let currentUser = null;
let gpsLat = null;
let gpsLon = null;

// ===== UTILITIES =====
function formatDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function formatDateID(d) {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const dt = typeof d === 'string' ? new Date(d) : d;
  return `${dt.getDate()} ${months[dt.getMonth()]} ${dt.getFullYear()}`;
}
function getDayID(d) {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return days[d.getDay()];
}
function todayStr() { return formatDate(new Date()); }
function nowTime() {
  const n = new Date();
  return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`;
}
function calcDurasi(masuk, pulang) {
  if (!masuk || !pulang) return '-';
  const [mh, mm] = masuk.split(':').map(Number);
  const [ph, pm] = pulang.split(':').map(Number);
  const diff = (ph * 60 + pm) - (mh * 60 + mm);
  if (diff < 0) return '-';
  return `${Math.floor(diff / 60)}j ${diff % 60}m`;
}
function showToast(msg, dur = 2500) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), dur);
}
function showMsg(el, msg, type) {
  el.textContent = msg;
  el.className = `absen-msg ${type}`;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 3500);
}
function statusBadge(s) {
  const map = { Hadir: 'green', Alpha: 'red', Izin: 'blue', Cuti: 'orange', Terlambat: 'orange' };
  return `<span class="badge badge-${map[s] || 'gray'}">${s}</span>`;
}

// ===== LIVE CLOCK =====
function startClock() {
  function tick() {
    const n = new Date();
    const hms = `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}:${String(n.getSeconds()).padStart(2, '0')}`;
    document.getElementById('live-clock').textContent = hms;
    document.getElementById('live-date').textContent = formatDateID(n);
    document.getElementById('w-date').textContent = formatDateID(n);
    document.getElementById('w-day').textContent = getDayID(n);
  }
  tick();
  setInterval(tick, 1000);
}

// ===== LOGIN =====
function doLogin() {
  const nip = document.getElementById('login-nip').value.trim();
  const pw = document.getElementById('login-pw').value;
  const users = DB.get('users') || [];
  const user = users.find(u => (u.username === nip || u.nip === nip) && u.password === pw && u.status === 'Aktif');
  if (!user) {
    document.getElementById('login-error').classList.remove('hidden');
    return;
  }
  currentUser = user;
  DB.set('session', user.id);
  document.getElementById('login-error').classList.add('hidden');
  enterApp();
}
function togglePw() {
  const inp = document.getElementById('login-pw');
  inp.type = inp.type === 'password' ? 'text' : 'password';
}
document.getElementById('login-pw').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
document.getElementById('login-nip').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });

// ===== SESSION =====
function checkSession() {
  const sid = DB.get('session');
  if (sid) {
    const users = DB.get('users') || [];
    const user = users.find(u => u.id === sid);
    if (user) { currentUser = user; enterApp(); return; }
  }
  document.getElementById('page-login').classList.add('active');
}
function enterApp() {
  document.getElementById('page-login').classList.remove('active');
  document.getElementById('page-login').classList.add('hidden');
  document.getElementById('page-app').classList.remove('hidden');
  document.getElementById('page-app').style.display = 'flex';
  loadUserUI();
  showSection('beranda');
  startClock();
  getGPS();
  // Admin visibility
  if (currentUser.role === 'admin') {
    document.getElementById('nav-pegawai').style.display = '';
    document.getElementById('admin-panel').style.display = '';
  } else {
    document.getElementById('nav-pegawai').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'none';
  }
}
function doLogout() {
  DB.del('session');
  currentUser = null;
  document.getElementById('page-app').style.display = 'none';
  document.getElementById('page-login').classList.remove('hidden');
  document.getElementById('page-login').classList.add('active');
  document.getElementById('login-nip').value = '';
  document.getElementById('login-pw').value = '';
}
function loadUserUI() {
  const u = currentUser;
  document.getElementById('sidebar-name').textContent = u.nama.split(' ')[0];
  document.getElementById('sidebar-role').textContent = u.jabatan;
  document.getElementById('sidebar-avatar').src = u.avatar;
  document.getElementById('welcome-name').textContent = u.nama;
  document.getElementById('welcome-unit').textContent = `• ${u.jabatan} | ${u.unit}`;
  document.getElementById('profil-name').textContent = u.nama;
  document.getElementById('profil-role').textContent = u.jabatan;
  document.getElementById('profil-avatar').src = u.avatar;
  document.getElementById('p-nip').textContent = u.nip;
  document.getElementById('p-gol').textContent = u.golongan + (u.pangkat ? ` (${u.pangkat})` : '');
  document.getElementById('p-jabatan').textContent = u.jabatan;
  document.getElementById('p-unit').textContent = u.unit;
  document.getElementById('p-email').textContent = u.email;
  loadBerandaStats();
}

// ===== NAVIGATION =====
const sectionTitles = {
  beranda: 'Beranda', absensi: 'Absensi Kehadiran',
  pegawai: 'Data Pegawai', laporan: 'Laporan Presensi', profil: 'Profil Saya'
};
function showSection(name) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  document.getElementById('section-' + name).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(b => {
    if (b.getAttribute('onclick') && b.getAttribute('onclick').includes(name)) b.classList.add('active');
  });
  document.getElementById('topbar-title').textContent = sectionTitles[name] || name;
  if (name === 'absensi') loadAbsensiPage();
  if (name === 'pegawai' && currentUser.role === 'admin') { renderPegawai(); populateUnitFilter(); }
  if (name === 'beranda') loadBerandaStats();
  if (name === 'laporan') initLaporan();
  // Close sidebar on mobile
  if (window.innerWidth < 640) document.getElementById('sidebar').classList.remove('open');
}
function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  if (window.innerWidth < 640) {
    sb.classList.toggle('open');
  } else {
    sb.classList.toggle('collapsed');
    document.querySelector('.main-content').classList.toggle('expanded');
  }
}

// ===== GPS =====
function getGPS() {
  if (!navigator.geolocation) {
    document.getElementById('gps-status').textContent = 'Tidak Didukung';
    document.getElementById('gps-addr').textContent = 'GPS tidak tersedia di browser ini';
    return;
  }
  document.getElementById('gps-status').textContent = 'Mendeteksi...';
  navigator.geolocation.getCurrentPosition(pos => {
    gpsLat = pos.coords.latitude;
    gpsLon = pos.coords.longitude;
    document.getElementById('gps-lat').textContent = `Latitude: ${gpsLat.toFixed(6)}`;
    document.getElementById('gps-lon').textContent = `Longitude: ${gpsLon.toFixed(6)}`;
    document.getElementById('gps-acc').textContent = `Akurasi: ±${Math.round(pos.coords.accuracy)} meter`;
    document.getElementById('gps-status').textContent = 'Terdeteksi ✓';
    document.getElementById('gps-status').className = 'badge badge-green';
    // Reverse geocode using nominatim
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${gpsLat}&lon=${gpsLon}&format=json`)
      .then(r => r.json()).then(d => {
        document.getElementById('gps-addr').textContent = `Alamat: ${d.display_name}`;
      }).catch(() => {
        document.getElementById('gps-addr').textContent = `Alamat: ${gpsLat.toFixed(4)}, ${gpsLon.toFixed(4)}`;
      });
  }, err => {
    document.getElementById('gps-status').textContent = 'Gagal';
    document.getElementById('gps-status').className = 'badge badge-red';
    document.getElementById('gps-addr').textContent = 'Izinkan akses lokasi di browser Anda';
  }, { enableHighAccuracy: true, timeout: 10000 });
}

// ===== ABSENSI =====
function getTodayAbsen() {
  const all = DB.get('absensi') || [];
  return all.find(a => a.userId === currentUser.id && a.tanggal === todayStr()) || null;
}
function loadAbsensiPage() {
  const ab = getTodayAbsen();
  const ids = ['masuk', 'istirahat', 'kembali', 'pulang'];
  const btnIds = ['btn-masuk', 'btn-istirahat', 'btn-kembali', 'btn-pulang'];
  ids.forEach(k => {
    const v = ab ? ab[k] : '--:--';
    document.getElementById('abs-' + k).textContent = v || '--:--';
  });
  // Button states
  if (!ab) {
    document.getElementById('btn-masuk').disabled = false;
    document.getElementById('btn-istirahat').disabled = true;
    document.getElementById('btn-kembali').disabled = true;
    document.getElementById('btn-pulang').disabled = true;
  } else {
    document.getElementById('btn-masuk').disabled = true;
    document.getElementById('btn-istirahat').disabled = !!ab.istirahat;
    document.getElementById('btn-kembali').disabled = !ab.istirahat || !!ab.kembali;
    document.getElementById('btn-pulang').disabled = !ab.kembali || !!ab.pulang;
  }
  renderRiwayat();
}
function doAbsen(type) {
  const all = DB.get('absensi') || [];
  const now = nowTime();
  const catatan = document.getElementById('absen-catatan').value;
  let rec = all.find(a => a.userId === currentUser.id && a.tanggal === todayStr());
  if (!rec) {
    rec = {
      id: `abs_${currentUser.id}_${todayStr()}`,
      userId: currentUser.id, tanggal: todayStr(),
      masuk: null, istirahat: null, kembali: null, pulang: null,
      status: 'Hadir', catatan: '', lat: gpsLat, lon: gpsLon
    };
    all.push(rec);
  }
  rec[type] = now;
  if (catatan) rec.catatan = catatan;
  // Determine status
  if (rec.masuk) {
    const [h, m] = rec.masuk.split(':').map(Number);
    if (h > 8 || (h === 8 && m > 0)) rec.status = 'Terlambat';
    else rec.status = 'Hadir';
  }
  DB.set('absensi', all);
  const labels = { masuk: 'Masuk', istirahat: 'Istirahat', kembali: 'Kembali Kerja', pulang: 'Pulang' };
  showMsg(document.getElementById('absen-msg'), `✅ Absen ${labels[type]} berhasil: ${now}`, 'success');
  showToast(`Absen ${labels[type]} pukul ${now}`);
  loadAbsensiPage();
  loadBerandaStats();
}
function renderRiwayat() {
  const all = DB.get('absensi') || [];
  const now = new Date();
  const myAbs = all.filter(a => a.userId === currentUser.id &&
    a.tanggal.startsWith(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`))
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  const tb = document.getElementById('riwayat-body');
  if (!myAbs.length) { tb.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:2rem">Belum ada data absensi bulan ini</td></tr>'; return; }
  tb.innerHTML = myAbs.map(a => `
    <tr>
      <td>${formatDateID(a.tanggal)}</td>
      <td><b>${a.masuk || '-'}</b></td>
      <td>${a.istirahat || '-'}</td>
      <td>${a.kembali || '-'}</td>
      <td><b>${a.pulang || '-'}</b></td>
      <td>${statusBadge(a.status)}</td>
    </tr>
  `).join('');
}

// ===== BERANDA STATS =====
function loadBerandaStats() {
  const ab = getTodayAbsen();
  ['masuk', 'istirahat', 'kembali', 'pulang'].forEach(k => {
    document.getElementById('dash-' + k).textContent = (ab && ab[k]) ? ab[k] : '--:--';
  });
  const badge = document.getElementById('today-status-badge');
  if (ab) {
    badge.textContent = ab.status;
    badge.className = 'badge badge-' + (ab.status === 'Hadir' ? 'green' : ab.status === 'Terlambat' ? 'orange' : 'gray');
  } else {
    badge.textContent = 'Belum Absen'; badge.className = 'badge badge-gray';
  }
  // Monthly stats
  const all = DB.get('absensi') || [];
  const now = new Date();
  const myAll = all.filter(a => a.userId === currentUser.id &&
    a.tanggal.startsWith(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`));
  const hadir = myAll.filter(a => a.status === 'Hadir' || a.status === 'Terlambat').length;
  const alpha = 0; // Simplified
  const cuti = myAll.filter(a => a.status === 'Cuti').length;
  const izin = myAll.filter(a => a.status === 'Izin').length;
  document.getElementById('stat-hadir').textContent = hadir;
  document.getElementById('stat-alpha').textContent = alpha;
  document.getElementById('stat-cuti').textContent = cuti;
  document.getElementById('stat-izin').textContent = izin;
}

// ===== DATA PEGAWAI (admin) =====
function renderPegawai() {
  const users = DB.get('users') || [];
  const search = document.getElementById('search-pegawai').value.toLowerCase();
  const gol = document.getElementById('filter-golongan').value;
  const unit = document.getElementById('filter-unit').value;
  const filtered = users.filter(u =>
    (!search || u.nama.toLowerCase().includes(search) || u.nip.includes(search)) &&
    (!gol || u.golongan === gol) &&
    (!unit || u.unit === unit)
  );
  const tb = document.getElementById('pegawai-body');
  if (!filtered.length) { tb.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:2rem">Data tidak ditemukan</td></tr>'; return; }
  tb.innerHTML = filtered.map((u, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><code style="font-size:.78rem">${u.nip}</code></td>
      <td><b>${u.nama}</b></td>
      <td><span class="badge badge-${u.golongan === 'PNS' ? 'blue' : 'orange'}">${u.golongan}</span>${u.pangkat ? ` <small>(${u.pangkat})</small>` : ''}</td>
      <td>${u.jabatan}</td>
      <td>${u.unit}</td>
      <td><span class="badge badge-${u.status === 'Aktif' ? 'green' : 'red'}">${u.status}</span></td>
      <td>
        <button class="btn-outline" style="padding:.3rem .7rem;font-size:.78rem" onclick="editPegawai('${u.id}')">✏️ Edit</button>
        <button onclick="hapusPegawai('${u.id}')" style="background:#ffebee;color:#c62828;border:none;border-radius:6px;padding:.3rem .7rem;font-size:.78rem;cursor:pointer;margin-left:.25rem">🗑</button>
      </td>
    </tr>
  `).join('');
}
function populateUnitFilter() {
  const users = DB.get('users') || [];
  const units = [...new Set(users.map(u => u.unit))];
  const sel = document.getElementById('filter-unit');
  const cur = sel.value;
  sel.innerHTML = '<option value="">Semua Unit</option>' + units.map(u => `<option value="${u}">${u}</option>`).join('');
  sel.value = cur;
  // Laporan filter
  const lapSel = document.getElementById('lap-pegawai-filter');
  lapSel.innerHTML = '<option value="">Semua Pegawai</option>' + users.map(u => `<option value="${u.id}">${u.nama}</option>`).join('');
}
function openModalPegawai() {
  document.getElementById('pegawai-id').value = '';
  document.getElementById('modal-pegawai-title').textContent = 'Tambah Pegawai';
  ['nip','nama','jabatan','unit','email','hp','username'].forEach(f => document.getElementById('f-' + f).value = '');
  document.getElementById('f-password').value = '';
  document.getElementById('f-golongan').value = 'PNS';
  document.getElementById('f-pangkat').value = '';
  document.getElementById('f-status').value = 'Aktif';
  document.getElementById('f-role').value = 'pegawai';
  document.getElementById('modal-pegawai').classList.remove('hidden');
}
function editPegawai(id) {
  const users = DB.get('users') || [];
  const u = users.find(x => x.id === id);
  if (!u) return;
  document.getElementById('pegawai-id').value = u.id;
  document.getElementById('modal-pegawai-title').textContent = 'Edit Pegawai';
  document.getElementById('f-nip').value = u.nip;
  document.getElementById('f-nama').value = u.nama;
  document.getElementById('f-golongan').value = u.golongan;
  document.getElementById('f-pangkat').value = u.pangkat || '';
  document.getElementById('f-jabatan').value = u.jabatan;
  document.getElementById('f-unit').value = u.unit;
  document.getElementById('f-email').value = u.email;
  document.getElementById('f-hp').value = u.hp;
  document.getElementById('f-username').value = u.username;
  document.getElementById('f-password').value = '';
  document.getElementById('f-status').value = u.status;
  document.getElementById('f-role').value = u.role;
  document.getElementById('modal-pegawai').classList.remove('hidden');
}
function closeModalPegawai() { document.getElementById('modal-pegawai').classList.add('hidden'); }
function savePegawai() {
  const nip = document.getElementById('f-nip').value.trim();
  const nama = document.getElementById('f-nama').value.trim();
  if (!nip || !nama) { showToast('⚠️ NIP dan Nama wajib diisi'); return; }
  const users = DB.get('users') || [];
  const editId = document.getElementById('pegawai-id').value;
  const newPw = document.getElementById('f-password').value;
  if (editId) {
    const idx = users.findIndex(u => u.id === editId);
    if (idx >= 0) {
      users[idx] = { ...users[idx],
        nip, nama,
        golongan: document.getElementById('f-golongan').value,
        pangkat: document.getElementById('f-pangkat').value,
        jabatan: document.getElementById('f-jabatan').value,
        unit: document.getElementById('f-unit').value,
        email: document.getElementById('f-email').value,
        hp: document.getElementById('f-hp').value,
        username: document.getElementById('f-username').value,
        status: document.getElementById('f-status').value,
        role: document.getElementById('f-role').value,
        ...(newPw ? { password: newPw } : {})
      };
    }
    showToast('✅ Data pegawai berhasil diperbarui');
  } else {
    const newUser = {
      id: 'u' + Date.now(), nip, nama,
      golongan: document.getElementById('f-golongan').value,
      pangkat: document.getElementById('f-pangkat').value,
      jabatan: document.getElementById('f-jabatan').value,
      unit: document.getElementById('f-unit').value,
      email: document.getElementById('f-email').value,
      hp: document.getElementById('f-hp').value,
      username: document.getElementById('f-username').value,
      password: newPw || 'pegawai123',
      status: document.getElementById('f-status').value,
      role: document.getElementById('f-role').value,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(nama)}&background=3b5bdb&color=fff&size=80`
    };
    users.push(newUser);
    showToast('✅ Pegawai baru berhasil ditambahkan');
  }
  DB.set('users', users);
  closeModalPegawai();
  renderPegawai();
  populateUnitFilter();
}
function hapusPegawai(id) {
  if (id === 'u1') { showToast('❌ Tidak bisa menghapus akun administrator'); return; }
  if (!confirm('Yakin ingin menghapus pegawai ini?')) return;
  const users = (DB.get('users') || []).filter(u => u.id !== id);
  DB.set('users', users);
  renderPegawai();
  showToast('🗑 Pegawai berhasil dihapus');
}

// ===== LAPORAN =====
function initLaporan() {
  const now = new Date();
  document.getElementById('lap-bulan').value = now.getMonth() + 1;
  const ySel = document.getElementById('lap-tahun');
  ySel.innerHTML = '';
  for (let y = now.getFullYear(); y >= now.getFullYear() - 3; y--) {
    ySel.innerHTML += `<option value="${y}">${y}</option>`;
  }
  populateUnitFilter();
}
function generateLaporan() {
  const bulan = parseInt(document.getElementById('lap-bulan').value);
  const tahun = parseInt(document.getElementById('lap-tahun').value);
  const pegawaiId = document.getElementById('lap-pegawai-filter').value;
  const bulanNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  const prefix = `${tahun}-${String(bulan).padStart(2, '0')}`;
  const all = DB.get('absensi') || [];
  const users = DB.get('users') || [];
  let data = all.filter(a => a.tanggal.startsWith(prefix));
  if (pegawaiId) data = data.filter(a => a.userId === pegawaiId);
  // Sort
  data.sort((a, b) => a.tanggal.localeCompare(b.tanggal) || a.userId.localeCompare(b.userId));
  document.getElementById('lap-title').textContent = `Laporan Presensi - ${bulanNames[bulan - 1]} ${tahun}`;
  // Stats
  const hadirCount = data.filter(a => a.status === 'Hadir' || a.status === 'Terlambat').length;
  document.getElementById('lap-stats').innerHTML = `
    <div class="stat-card blue"><div class="stat-icon">📋</div><div class="stat-val">${data.length}</div><div class="stat-lbl">Total Record</div></div>
    <div class="stat-card green"><div class="stat-icon">✅</div><div class="stat-val">${hadirCount}</div><div class="stat-lbl">Hadir</div></div>
    <div class="stat-card orange"><div class="stat-icon">⏰</div><div class="stat-val">${data.filter(a=>a.status==='Terlambat').length}</div><div class="stat-lbl">Terlambat</div></div>
    <div class="stat-card red"><div class="stat-icon">❌</div><div class="stat-val">${data.filter(a=>a.status==='Alpha').length}</div><div class="stat-lbl">Alpha</div></div>
  `;
  const tb = document.getElementById('laporan-body');
  if (!data.length) {
    tb.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:2rem;color:var(--text-muted)">Tidak ada data untuk periode ini</td></tr>';
  } else {
    tb.innerHTML = data.map((a, i) => {
      const user = users.find(u => u.id === a.userId) || {};
      return `<tr>
        <td>${i + 1}</td>
        <td><b>${user.nama || '-'}</b></td>
        <td><span class="badge badge-${user.golongan === 'PNS' ? 'blue' : 'orange'}">${user.golongan || '-'}</span></td>
        <td>${formatDateID(a.tanggal)}</td>
        <td>${a.masuk || '-'}</td>
        <td>${a.istirahat || '-'}</td>
        <td>${a.kembali || '-'}</td>
        <td>${a.pulang || '-'}</td>
        <td>${calcDurasi(a.masuk, a.pulang)}</td>
        <td>${statusBadge(a.status)}</td>
      </tr>`;
    }).join('');
  }
  document.getElementById('laporan-result').style.display = '';
  // Store for export
  window._laporanData = data;
  window._laporanUsers = users;
}

// ===== EXPORT CSV =====
function exportCSV() {
  if (!window._laporanData) { showToast('⚠️ Generate laporan dulu'); return; }
  const users = window._laporanUsers;
  const rows = [['No','NIP','Nama','Golongan','Pangkat','Tanggal','Jam Masuk','Istirahat','Kembali','Jam Pulang','Durasi','Status','Catatan']];
  window._laporanData.forEach((a, i) => {
    const u = users.find(x => x.id === a.userId) || {};
    rows.push([i + 1, u.nip || '', u.nama || '', u.golongan || '', u.pangkat || '',
      formatDateID(a.tanggal), a.masuk || '', a.istirahat || '', a.kembali || '', a.pulang || '',
      calcDurasi(a.masuk, a.pulang), a.status, a.catatan || '']);
  });
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'Laporan_Absensi_SIAP.csv'; a.click();
  URL.revokeObjectURL(url);
  showToast('📥 CSV berhasil diunduh');
}

// ===== GOOGLE DRIVE =====
function sendToGoogleDrive() {
  if (!window._laporanData) { showToast('⚠️ Generate laporan dulu'); return; }
  document.getElementById('modal-gdrive').classList.remove('hidden');
}
function closeGDrive() { document.getElementById('modal-gdrive').classList.add('hidden'); }
function kirimGDrive() {
  const url = document.getElementById('gdrive-url').value.trim();
  const filename = document.getElementById('gdrive-filename').value.trim() || 'Laporan_Absensi.csv';
  if (!url) { showToast('⚠️ Masukkan URL Google Apps Script'); return; }
  // Build CSV
  const users = window._laporanUsers;
  const rows = [['No','NIP','Nama','Golongan','Pangkat','Tanggal','Jam Masuk','Istirahat','Kembali','Jam Pulang','Durasi','Status','Catatan']];
  window._laporanData.forEach((a, i) => {
    const u = users.find(x => x.id === a.userId) || {};
    rows.push([i + 1, u.nip || '', u.nama || '', u.golongan || '', u.pangkat || '',
      formatDateID(a.tanggal), a.masuk || '', a.istirahat || '', a.kembali || '', a.pulang || '',
      calcDurasi(a.masuk, a.pulang), a.status, a.catatan || '']);
  });
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const payload = { filename, content: csv, mimeType: 'text/csv' };
  showToast('📤 Mengirim ke Google Drive...');
  fetch(url, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'text/plain' }
  }).then(r => r.text()).then(res => {
    closeGDrive();
    showToast('✅ Berhasil dikirim ke Google Drive!');
  }).catch(err => {
    showToast('❌ Gagal kirim. Periksa URL dan coba lagi.');
  });
}

// ===== SHOW ALL ABSENSI (admin) =====
function showAllAbsensi() {
  const panel = document.getElementById('all-absensi-panel');
  panel.classList.toggle('hidden');
  if (!panel.classList.contains('hidden')) {
    const all = DB.get('absensi') || [];
    const users = DB.get('users') || [];
    const recent = all.slice().sort((a, b) => b.tanggal.localeCompare(a.tanggal)).slice(0, 50);
    const tb = document.getElementById('all-absensi-body');
    tb.innerHTML = recent.map(a => {
      const u = users.find(x => x.id === a.userId) || {};
      return `<tr>
        <td><b>${u.nama || '-'}</b></td>
        <td>${formatDateID(a.tanggal)}</td>
        <td>${a.masuk || '-'}</td><td>${a.istirahat || '-'}</td>
        <td>${a.kembali || '-'}</td><td>${a.pulang || '-'}</td>
        <td>${statusBadge(a.status)}</td>
      </tr>`;
    }).join('');
  }
}

// ===== GANTI PASSWORD =====
function gantiPassword() {
  const lama = document.getElementById('pw-lama').value;
  const baru = document.getElementById('pw-baru').value;
  const konfirm = document.getElementById('pw-konfirm').value;
  const msg = document.getElementById('pw-msg');
  if (lama !== currentUser.password) { showMsg(msg, '❌ Password lama salah', 'error'); return; }
  if (baru.length < 6) { showMsg(msg, '❌ Password baru minimal 6 karakter', 'error'); return; }
  if (baru !== konfirm) { showMsg(msg, '❌ Konfirmasi password tidak cocok', 'error'); return; }
  const users = DB.get('users') || [];
  const idx = users.findIndex(u => u.id === currentUser.id);
  if (idx >= 0) { users[idx].password = baru; currentUser.password = baru; }
  DB.set('users', users);
  showMsg(msg, '✅ Password berhasil diubah', 'success');
  document.getElementById('pw-lama').value = '';
  document.getElementById('pw-baru').value = '';
  document.getElementById('pw-konfirm').value = '';
}

// ===== INIT =====
initDB();
checkSession();
