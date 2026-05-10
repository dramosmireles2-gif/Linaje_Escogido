const SUPABASE_URL = 'https://xzwyyzgcxhpbjioqdrmn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6d3l5emdjeGhwYmppb3Fkcm1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNzg0MjQsImV4cCI6MjA5Mzc1NDQyNH0.-En3HLRgdDbnHuQSUO7LfVyMR0-0xMUdZdECz5KGezY';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', () => {
  loadAnuncios();
});

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
      <div class="anuncio-date">${formatDate(a.fecha)}</div>
      <div class="anuncio-title">${a.titulo}</div>
      <div class="anuncio-body">${a.cuerpo}</div>
    </div>
  `).join('');
}

// ── FORMULARIOS ──
function handleAlpha(e) {
  e.preventDefault();
  alert('¡Registro recibido! Nos pondremos en contacto contigo pronto.');
  e.target.reset();
}

function handleOracion(e) {
  e.preventDefault();
  alert('¡Tu petición fue enviada! Estaremos orando por ti.');
  e.target.reset();
}

// ── UTILS ──
function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
}
