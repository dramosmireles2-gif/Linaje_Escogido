const SUPABASE_URL = 'https://xzwyyzgcxhpbjioqdrmn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6d3l5emdjeGhwYmppb3Fkcm1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNzg0MjQsImV4cCI6MjA5Mzc1NDQyNH0.-En3HLRgdDbnHuQSUO7LfVyMR0-0xMUdZdECz5KGezY';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', () => {
  loadAnuncios();
  loadGaleria();
  loadHero();
  loadPastoresFoto();
  loadHeroContenido();
  loadHorarios();
});

// ── HERO ──
async function loadHero() {
  const { data, error } = await db
    .from('hero_fotos')
    .select('*')
    .eq('activa', true)
    .order('orden');

  if (error || !data || !data.length) return;

  const hero = document.querySelector('.hero');

  const slides = document.createElement('div');
  slides.style.cssText = 'position:absolute;inset:0;z-index:0;';
  data.forEach((f, i) => {
    const div = document.createElement('div');
    div.style.cssText = `position:absolute;inset:0;background:url('${f.url}') center/cover no-repeat;opacity:${i === 0 ? '0.45' : '0'};transition:opacity 1.2s ease;`;
    slides.appendChild(div);
  });
  hero.insertBefore(slides, hero.firstChild);

  hero.style.background = '#000';

  if (data.length > 1) {
    let current = 0;
    setInterval(() => {
      slides.children[current].style.opacity = '0';
      current = (current + 1) % slides.children.length;
      slides.children[current].style.opacity = '0.45';
    }, 5000);
  }
}

// ── ANUNCIOS ──
async function loadAnuncios() {
  const grid = document.getElementById('anunciosGrid');
  const { data, error } = await db
    .from('anuncios')
    .select('*')
    .eq('activo', true)
    .order('fecha', { ascending: false })
    .limit(3);

  if (error || !data || !data.length) {
    grid.innerHTML = '<div class="anuncio" style="opacity:.4;font-size:13px;">No hay anuncios por el momento.</div>';
    return;
  }

  grid.innerHTML = data.map(a => `
    <div class="anuncio">
      ${a.imagen_url ? `<img class="anuncio-img" src="${a.imagen_url}" alt="${a.titulo}"/>` : ''}
      <div class="anuncio-text">
        <div class="anuncio-date">${formatDate(a.fecha)}</div>
        <div class="anuncio-title">${a.titulo}</div>
        <div class="anuncio-body">${a.cuerpo}</div>
      </div>
    </div>
  `).join('');
}

// ── GALERÍA ──
async function loadGaleria() {
  const grid = document.getElementById('galeriaGrid');
  const { data, error } = await db
    .from('galeria_fotos')
    .select('*')
    .eq('activa', true)
    .order('orden');

  if (error || !data || !data.length) {
    grid.innerHTML = '<div style="opacity:.4;font-size:13px;padding:20px;">No hay fotos aún.</div>';
    return;
  }

  grid.innerHTML = data.map(f => `
    <div class="gallery-item">
      <img src="${f.url}" alt="Galería" style="width:100%;height:100%;object-fit:cover;display:block;"/>
    </div>
  `).join('');
}

// ── PASTORES ──
async function loadPastoresFoto() {

  const { data, error } = await db
    .from('pastores_foto')
    .select('*')
    .eq('activa', true)
    .order('created_at', { ascending:false })
    .limit(1)
    .single();

  if (error || !data) return;

  const pastorImg =
    document.querySelector('.pastor-img');

  if (pastorImg) {
    pastorImg.src = data.url;
  }

}

// ── FORMULARIOS ──
async function handleAlpha(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  const orig = btn.textContent;
  btn.textContent = 'Enviando...';
  btn.disabled = true;

  const { error } = await db.from('registros_alpha').insert([{
    nombre: document.getElementById('alphaNombre').value,
    apellidos: document.getElementById('alphaApellidos').value,
    email: document.getElementById('alphaEmail').value,
    telefono: document.getElementById('alphaTelefono').value || null
  }]);

  btn.textContent = orig;
  btn.disabled = false;

  if (error) {
    alert('Hubo un error al enviar tu registro. Por favor intenta de nuevo.');
    return;
  }
  alert('¡Registro recibido! Nos pondremos en contacto contigo pronto.');
  e.target.reset();
}

async function handleOracion(e) {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('button[type="submit"]');
  const orig = btn.textContent;
  btn.textContent = 'Enviando...';
  btn.disabled = true;

  const nombre = form.querySelector('input[placeholder="Tu nombre"]').value;
  const apellidos = form.querySelector('input[placeholder="Tus apellidos"]').value;
  const email = form.querySelector('input[type="email"]').value;
  const telefono = form.querySelector('input[type="tel"]').value;
  const peticion = form.querySelector('textarea').value;
  const ubicacion = document.getElementById('oracionPais').value;
  const referencia = document.getElementById('oracionReferencia').value;
  const decision_seguimiento = form.querySelector('select').value;

  const { error } = await db.from('peticiones_oracion').insert([{
    nombre, apellidos, email, telefono, peticion, ubicacion, referencia, decision_seguimiento
  }]);

  btn.textContent = orig;
  btn.disabled = false;

  if (error) {
    alert('Hubo un error al enviar tu petición. Intenta de nuevo.');
    return;
  }
  alert('¡Tu petición fue enviada! Estaremos orando por ti.');
  form.reset();
}

// ── UTILS ──
function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
}

async function loadHorarios() {

  const { data, error } = await db
    .from('horarios')
    .select('*')
    .eq('activo', true)
    .order('orden');

  const grid =
    document.getElementById('horariosGrid');

  if (error || !data.length) {

    grid.innerHTML =
      '<div style="opacity:.5;">No hay horarios disponibles.</div>';

    return;
  }

  grid.innerHTML = data.map((h, index) => `
    
    <div class="horario-card ${index % 2 ? 'dark' : ''}">

      <div class="horario-meta">
        ${h.titulo}
      </div>

      <div class="horario-day">
        ${h.dia}
      </div>

      <div class="horario-type">
        Servicio
      </div>

      <div class="horario-time">
        ${h.hora}
      </div>

    </div>

  `).join('');

}