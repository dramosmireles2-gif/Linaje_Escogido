const SUPABASE_URL = 'https://xzwyyzgcxhpbjioqdrmn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6d3l5emdjeGhwYmppb3Fkcm1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNzg0MjQsImV4cCI6MjA5Mzc1NDQyNH0.-En3HLRgdDbnHuQSUO7LfVyMR0-0xMUdZdECz5KGezY';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── INIT ──
document.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await db.auth.getSession();
  if (session) showAdmin(session.user);
});

// ── LOGIN ──
async function handleLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('loginBtn');
  const errorEl = document.getElementById('loginError');
  errorEl.style.display = 'none';
  btn.textContent = 'Entrando...';
  btn.disabled = true;

  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  const { data, error } = await db.auth.signInWithPassword({ email, password });

  if (error) {
    errorEl.style.display = 'block';
    btn.textContent = 'Entrar';
    btn.disabled = false;
    return;
  }
  showAdmin(data.user);
}

async function handleLogout() {
  await db.auth.signOut();
  document.getElementById('adminWrap').style.display = 'none';
  document.getElementById('loginWrap').style.display = 'flex';
}

function showAdmin(user) {
  document.getElementById('loginWrap').style.display = 'none';
  document.getElementById('adminWrap').style.display = 'flex';
  const name = user.email.split('@')[0];
  document.getElementById('adminUser').textContent = name.charAt(0).toUpperCase() + name.slice(1);
  document.getElementById('userAvatar').textContent = name.slice(0, 2).toUpperCase();
  loadAnuncios();
  loadHeroFotos();
  loadGaleriaFotos();
  loadPastorFoto();
  loadAlphaRegistros();
  loadPeticiones();
}

// ── TABS ──
function switchTab(tab, el) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  document.getElementById('panel-' + tab).classList.add('active');
  if (el) el.classList.add('active');
}

// ── TOAST ──
function showToast(msg, error = false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (error ? ' error' : '');
  setTimeout(() => t.className = 'toast', 3000);
}

// ══════════════════════════════
// ANUNCIOS
// ══════════════════════════════
async function loadAnuncios() {
  const { data, error } = await db.from('anuncios').select('*').order('fecha', { ascending: false });
  const list = document.getElementById('anunciosList');
  const countEl = document.getElementById('anunciosCount');
  if (error || !data.length) {
    if (countEl) countEl.textContent = '0';
    list.innerHTML = '<div style="font-size:13px;color:var(--mid);">No hay anuncios aún.</div>';
    return;
  }
  if (countEl) countEl.textContent = data.length;
  list.innerHTML = `
    <table class="anuncios-table" id="anunciosTable">
      <thead><tr>
        <th>Imagen</th><th>Título</th><th>Fecha</th><th>Estado</th><th>Acciones</th>
      </tr></thead>
      <tbody>
        ${data.map(a => `
          <tr>
            <td>${a.imagen_url ? `<img class="anuncio-thumb" src="${a.imagen_url}" alt=""/>` : `<div class="anuncio-thumb-empty"></div>`}</td>
            <td style="font-weight:500;">${a.titulo}</td>
            <td style="color:var(--mid);white-space:nowrap;">${formatDate(a.fecha)}</td>
            <td style="white-space:nowrap;"><span class="status-dot ${a.activo ? 'on' : 'off'}"></span>${a.activo ? 'Activo' : 'Inactivo'}</td>
            <td>
              <div style="display:flex;gap:5px;">
                <button class="btn-icon" onclick="toggleAnuncio('${a.id}',${a.activo})" title="${a.activo ? 'Desactivar' : 'Activar'}">${a.activo ? '⏸' : '▶'}</button>
                <button class="btn-icon danger" onclick="deleteAnuncio('${a.id}','${a.imagen_url || ''}')" title="Eliminar">✕</button>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>`;
}

function filterAnuncios() {
  const q = document.getElementById('anuncioSearch').value.toLowerCase();
  document.querySelectorAll('#anunciosTable tbody tr').forEach(row => {
    const title = row.cells[1]?.textContent.toLowerCase() || '';
    row.style.display = title.includes(q) ? '' : 'none';
  });
}

async function handleAnuncio(e) {
  e.preventDefault();
  const btn = document.getElementById('anuncioBtn');
  btn.textContent = 'Publicando...';
  btn.disabled = true;

  let imagen_url = null;
  const file = document.getElementById('anuncioImagen').files[0];
  if (file) {
    const ext = file.name.split('.').pop();
    const path = `anuncios/${Date.now()}.${ext}`;
    const { error: upError } = await db.storage.from('fotos').upload(path, file);
    if (!upError) {
      const { data } = db.storage.from('fotos').getPublicUrl(path);
      imagen_url = data.publicUrl;
    }
  }

  const { error } = await db.from('anuncios').insert([{
    titulo: document.getElementById('anuncioTitulo').value,
    cuerpo: document.getElementById('anuncioCuerpo').value,
    fecha: document.getElementById('anuncioFecha').value,
    imagen_url,
    activo: true
  }]);

  btn.textContent = 'Publicar anuncio';
  btn.disabled = false;

  if (error) { showToast('Error al publicar.', true); return; }
  showToast('Anuncio publicado.');
  e.target.reset();
  loadAnuncios();
}

async function toggleAnuncio(id, activo) {
  const { error } = await db.from('anuncios').update({ activo: !activo }).eq('id', id);
  if (error) { showToast('Error al actualizar.', true); return; }
  showToast(activo ? 'Anuncio desactivado.' : 'Anuncio activado.');
  loadAnuncios();
}

async function deleteAnuncio(id, imagenUrl) {
  if (!confirm('¿Eliminar este anuncio?')) return;
  if (imagenUrl) {
    const path = imagenUrl.split('/fotos/')[1];
    if (path) await db.storage.from('fotos').remove([path]);
  }
  const { error } = await db.from('anuncios').delete().eq('id', id);
  if (error) { showToast('Error al eliminar.', true); return; }
  showToast('Anuncio eliminado.');
  loadAnuncios();
}

// ══════════════════════════════
// PASTORES
// ══════════════════════════════
async function loadPastorFoto() {
  const { data, error } = await db
    .from('pastores_foto')
    .select('*')
    .eq('activa', true)
    .order('created_at', { ascending: false })
    .limit(1);

  const preview = document.getElementById('pastorPreview');
  if (error || !data || !data.length) {
    preview.innerHTML = '<div style="font-size:13px;color:var(--mid);">No hay foto cargada aún.</div>';
    return;
  }

  const foto = data[0];
  preview.innerHTML = `
    <img src="${foto.url}" style="width:100%;border-radius:6px;border:1px solid var(--border);margin-bottom:12px;" alt="Foto pastores"/>
    <button class="btn btn-danger btn-sm" onclick="deletePastorFoto('${foto.id}','${foto.url}')">Eliminar foto</button>
  `;
}

async function handlePastorUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  showToast('Procesando imagen...');
  const compressed = await compressImage(file, 2);
  const sizeMB = (compressed.size / 1024 / 1024).toFixed(1);
  showToast(`Subiendo (${sizeMB} MB)...`);

  await db.from('pastores_foto').update({ activa: false }).eq('activa', true);

  const path = `pastores/${Date.now()}.jpg`;
  const { error: upError } = await db.storage.from('fotos').upload(path, compressed);
  if (upError) { showToast('Error al subir la foto.', true); e.target.value = ''; return; }

  const { data: urlData } = db.storage.from('fotos').getPublicUrl(path);
  const { error } = await db.from('pastores_foto').insert([{ url: urlData.publicUrl, activa: true, orden: 1 }]);

  e.target.value = '';
  if (error) { showToast('Error al guardar.', true); return; }
  showToast('Foto de pastores actualizada.');
  loadPastorFoto();
}

async function deletePastorFoto(id, url) {
  if (!confirm('¿Eliminar la foto de pastores?')) return;
  const path = url.split('/fotos/')[1];
  if (path) await db.storage.from('fotos').remove([path]);
  await db.from('pastores_foto').delete().eq('id', id);
  showToast('Foto eliminada.');
  loadPastorFoto();
}

async function compressImage(file, maxMB = 2) {
  return new Promise((resolve) => {
    const maxBytes = maxMB * 1024 * 1024;
    if (file.size <= maxBytes) { resolve(file); return; }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        const maxDim = 1920;
        if (width > maxDim) { height = Math.round(height * maxDim / width); width = maxDim; }
        if (height > maxDim) { width = Math.round(width * maxDim / height); height = maxDim; }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);

        let quality = 0.85;
        const tryCompress = () => {
          canvas.toBlob((blob) => {
            if (blob.size <= maxBytes || quality <= 0.1) {
              resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
            } else {
              quality = Math.round((quality - 0.1) * 10) / 10;
              tryCompress();
            }
          }, 'image/jpeg', quality);
        };
        tryCompress();
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// ══════════════════════════════
// HERO FOTOS
// ══════════════════════════════
async function loadHeroFotos() {
  const { data, error } = await db.from('hero_fotos').select('*').order('orden');
  const grid = document.getElementById('heroFotoGrid');
  if (error || !data.length) {
    grid.innerHTML = '<div style="font-size:13px;opacity:.4;grid-column:1/-1;">No hay fotos aún.</div>';
    return;
  }
  grid.innerHTML = data.map(f => `
    <div class="foto-item ${f.activa ? '' : 'inactivo'}">
      <img src="${f.url}" alt="Hero foto"/>
      <div class="foto-overlay">
        <button class="btn btn-sm" style="background:rgba(245,239,230,.15);color:#fff;border:1px solid rgba(255,255,255,.2);" onclick="toggleFoto('hero_fotos','${f.id}',${f.activa})">${f.activa ? 'Ocultar' : 'Mostrar'}</button>
        <button class="btn btn-danger btn-sm" onclick="deleteFoto('hero_fotos','${f.id}','${f.url}')">✕</button>
      </div>
    </div>
  `).join('');
}

async function handleHeroUpload(e) {
  await uploadFotos(e.target.files, 'hero_fotos', loadHeroFotos);
  e.target.value = '';
}

// ══════════════════════════════
// GALERÍA FOTOS
// ══════════════════════════════
async function loadGaleriaFotos() {
  const { data, error } = await db.from('galeria_fotos').select('*').order('orden');
  const grid = document.getElementById('galeriaFotoGrid');
  if (error || !data.length) {
    grid.innerHTML = '<div style="font-size:13px;opacity:.4;grid-column:1/-1;">No hay fotos aún.</div>';
    return;
  }
  grid.innerHTML = data.map(f => `
    <div class="foto-item ${f.activa ? '' : 'inactivo'}">
      <img src="${f.url}" alt="Galería foto"/>
      <div class="foto-overlay">
        <button class="btn btn-sm" style="background:rgba(245,239,230,.15);color:#fff;border:1px solid rgba(255,255,255,.2);" onclick="toggleFoto('galeria_fotos','${f.id}',${f.activa})">${f.activa ? 'Ocultar' : 'Mostrar'}</button>
        <button class="btn btn-danger btn-sm" onclick="deleteFoto('galeria_fotos','${f.id}','${f.url}')">✕</button>
      </div>
    </div>
  `).join('');
}

async function handleGaleriaUpload(e) {
  await uploadFotos(e.target.files, 'galeria_fotos', loadGaleriaFotos);
  e.target.value = '';
}

// ══════════════════════════════
// FOTOS COMPARTIDO
// ══════════════════════════════
async function uploadFotos(files, tabla, reload) {
  if (!files.length) return;
  showToast(`Subiendo ${files.length} foto(s)...`);

  const { data: existing } = await db.from(tabla).select('orden').order('orden', { ascending: false }).limit(1);
  let orden = existing && existing.length ? existing[0].orden + 1 : 1;

  for (const file of files) {
    if (file.size > 5 * 1024 * 1024) { showToast(`${file.name} supera 5MB.`, true); continue; }
    const ext = file.name.split('.').pop();
    const path = `${tabla}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: upError } = await db.storage.from('fotos').upload(path, file);
    if (upError) { showToast(`Error subiendo ${file.name}.`, true); continue; }

    const { data: urlData } = db.storage.from('fotos').getPublicUrl(path);
    await db.from(tabla).insert([{ url: urlData.publicUrl, orden, activa: true }]);
    orden++;
  }

  showToast('Fotos subidas correctamente.');
  reload();
}

async function toggleFoto(tabla, id, activa) {
  const { error } = await db.from(tabla).update({ activa: !activa }).eq('id', id);
  if (error) { showToast('Error al actualizar.', true); return; }
  showToast(activa ? 'Foto ocultada.' : 'Foto activada.');
  tabla === 'hero_fotos' ? loadHeroFotos() : loadGaleriaFotos();
}

async function deleteFoto(tabla, id, url) {
  if (!confirm('¿Eliminar esta foto?')) return;
  const path = url.split('/fotos/')[1];
  await db.storage.from('fotos').remove([path]);
  const { error } = await db.from(tabla).delete().eq('id', id);
  if (error) { showToast('Error al eliminar.', true); return; }
  showToast('Foto eliminada.');
  tabla === 'hero_fotos' ? loadHeroFotos() : loadGaleriaFotos();
}

// ══════════════════════════════
// PETICIONES DE ORACIÓN
// ══════════════════════════════
async function loadPeticiones() {
  const { data, error } = await db
    .from('peticiones_oracion')
    .select('*')
    .order('created_at', { ascending: false });

  const list = document.getElementById('peticionesList');
  const countEl = document.getElementById('peticionesCount');

  if (error) {
    list.innerHTML = '<div style="font-size:13px;opacity:.4;">Error al cargar peticiones.</div>';
    return;
  }
  if (!data.length) {
    countEl.textContent = '0 peticiones';
    list.innerHTML = '<div style="font-size:13px;opacity:.4;">Aún no hay peticiones.</div>';
    return;
  }

  countEl.textContent = `${data.length} petición${data.length !== 1 ? 'es' : ''}`;
  list.innerHTML = data.map(p => `
    <div class="item-card">
      <div class="item-info">
        <div class="item-title">${p.nombre || ''}${p.apellidos ? ' ' + p.apellidos : ''}</div>
        <div class="item-meta">
          ${formatDateTime(p.created_at)}
          ${p.ubicacion ? ` &nbsp;·&nbsp; ${p.ubicacion}` : ''}
        </div>
        <div class="item-body" style="margin-bottom:8px;font-style:italic;">"${p.peticion}"</div>
        <div style="font-size:12px;opacity:.5;">
          ${p.email ? `<a href="mailto:${p.email}" style="color:inherit;">${p.email}</a>` : ''}
          ${p.telefono ? ` &nbsp;·&nbsp; ${p.telefono}` : ''}
          ${p.decision_seguimiento ? ` &nbsp;·&nbsp; ${decisionLabel(p.decision_seguimiento)}` : ''}
        </div>
      </div>
    </div>
  `).join('');
}

function decisionLabel(val) {
  const map = { si: 'Tomó decisión hoy', no: 'No tomó decisión', ya: 'Ya era cristiano/a' };
  return map[val] || val;
}

function exportPeticiones() {
  db.from('peticiones_oracion').select('*').order('created_at', { ascending: false })
    .then(({ data }) => {
      if (!data || !data.length) { showToast('No hay peticiones para exportar.', true); return; }
      const header = 'Nombre,Apellidos,Email,Teléfono,Petición,Ubicación,Referencia,Decisión,Fecha';
      const csv = [header, ...data.map(p =>
        `"${p.nombre||''}","${p.apellidos||''}","${p.email||''}","${p.telefono||''}","${(p.peticion||'').replace(/"/g,'""')}","${p.ubicacion||''}","${p.referencia||''}","${p.decision_seguimiento||''}","${formatDateTime(p.created_at)}"`
      )].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `peticiones-oracion-${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });
}

// ══════════════════════════════
// REGISTROS ALPHA
// ══════════════════════════════
async function loadAlphaRegistros() {
  const { data, error } = await db
    .from('registros_alpha')
    .select('*')
    .order('fecha_registro', { ascending: false });

  const list = document.getElementById('alphaList');
  const countEl = document.getElementById('alphaCount');

  if (error) {
    list.innerHTML = '<div style="font-size:13px;opacity:.4;">Error al cargar registros.</div>';
    return;
  }
  if (!data.length) {
    countEl.textContent = '0 registros';
    list.innerHTML = '<div style="font-size:13px;opacity:.4;">Aún no hay registros.</div>';
    return;
  }

  countEl.textContent = `${data.length} registro${data.length !== 1 ? 's' : ''}`;
  list.innerHTML = data.map(r => `
    <div class="item-card">
      <div class="item-info">
        <div class="item-title">${r.nombre} ${r.apellidos}</div>
        <div class="item-meta">${formatDateTime(r.fecha_registro)}</div>
        <div class="item-body">
          <a href="mailto:${r.email}" style="color:var(--cream)">${r.email}</a>
          ${r.telefono ? ` &nbsp;·&nbsp; <a href="tel:${r.telefono}" style="color:var(--cream)">${r.telefono}</a>` : ''}
        </div>
      </div>
    </div>
  `).join('');
}

function exportAlpha() {
  const rows = document.querySelectorAll('#alphaList .item-card');
  if (!rows.length) { showToast('No hay registros para exportar.', true); return; }

  db.from('registros_alpha').select('*').order('fecha_registro', { ascending: false })
    .then(({ data }) => {
      if (!data) return;
      const header = 'Nombre,Apellidos,Email,Teléfono,Fecha de registro';
      const csv = [header, ...data.map(r =>
        `"${r.nombre}","${r.apellidos}","${r.email}","${r.telefono || ''}","${formatDateTime(r.fecha_registro)}"`
      )].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `registros-alpha-${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });
}

// ── UTILS ──
function formatDateTime(dateStr) {
  return new Date(dateStr).toLocaleDateString('es-MX', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
}
