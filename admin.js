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
  document.getElementById('adminUser').textContent = user.email;
  loadAnuncios();
  loadHeroFotos();
  loadGaleriaFotos();
  loadAlphaRegistros();
  loadOraciones();
}

async function loadOraciones() {
  const { data, error } = await db
    .from('peticiones_oracion')
    .select('*')
    .order('created_at', { ascending: false });

  const list = document.getElementById('oracionesList');
  
  if (error || !data.length) {
    list.innerHTML = '<div style="font-size:13px;opacity:.4;">No hay peticiones registradas.</div>';
    return;
  }

  list.innerHTML = data.map(o => `
    <div class="item-card">
      <div class="item-info">
        <div class="item-title">${o.nombre} ${o.apellidos || ''}</div>
        <div class="item-meta">
          ${formatDate(o.created_at.split('T')[0])} &nbsp;·&nbsp; 
          <span style="color:var(--mid)">${o.email || 'Sin email'}</span> &nbsp;·&nbsp; 
          <span style="color:var(--mid)">${o.telefono || ''}</span>
        </div>
        <div class="item-body" style="background:rgba(26,26,26,0.03); padding:10px; margin-top:8px; border-radius:4px;">
          "${o.peticion}"
        </div>
        <div style="font-size:11px; opacity:0.5; margin-top:8px;">
          Ubicación: ${o.ubicacion || 'No especificada'} | Referencia: ${o.referencia || 'N/A'}
        </div>
      </div>
    </div>
  `).join('');
}
// ── TABS ──
function switchTab(tab) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('panel-' + tab).classList.add('active');
  event.currentTarget.classList.add('active');
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
  if (error || !data.length) {
    list.innerHTML = '<div style="font-size:13px;opacity:.4;">No hay anuncios aún.</div>';
    return;
  }
  list.innerHTML = data.map(a => `
    <div class="item-card ${a.activo ? '' : 'inactivo'}">
      ${a.imagen_url ? `<img src="${a.imagen_url}" style="width:72px;height:72px;object-fit:cover;flex-shrink:0;border:1px solid rgba(26,26,26,.1);" alt=""/>` : ''}
      <div class="item-info">
        <div class="item-title">${a.titulo}</div>
        <div class="item-meta">${formatDate(a.fecha)} &nbsp;·&nbsp; <span class="badge ${a.activo ? 'badge-green' : 'badge-gray'}">${a.activo ? 'Activo' : 'Inactivo'}</span></div>
        <div class="item-body">${a.cuerpo}</div>
      </div>
      <div class="item-actions">
        <button class="btn btn-outline btn-sm" onclick="toggleAnuncio('${a.id}', ${a.activo})">${a.activo ? 'Desactivar' : 'Activar'}</button>
        <button class="btn btn-danger btn-sm" onclick="deleteAnuncio('${a.id}', '${a.imagen_url || ''}')">Eliminar</button>
      </div>
    </div>
  `).join('');
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
          <a href="mailto:${r.email}" style="color:var(--dark)">${r.email}</a>
          ${r.telefono ? ` &nbsp;·&nbsp; <a href="tel:${r.telefono}" style="color:var(--dark)">${r.telefono}</a>` : ''}
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
