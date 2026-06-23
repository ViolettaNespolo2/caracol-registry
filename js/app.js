// app.js — UI logic and state

const CERT_TYPES = {
  LFAM: { label: 'LFAM Professional',           badge: 'bl', extraFields: true  },
  ACAD: { label: 'Caracol Academy — Heron AM',  badge: 'ba', extraFields: false },
  HERN: { label: 'Startup Training — Heron AM', badge: 'bh', extraFields: false },
  VIPR: { label: 'Startup Training — Vipra AM', badge: 'bv', extraFields: false },
};

const STATE = {
  entries:      [],
  selectedType: null,
};

// ── Boot ──────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('f-date').value = today();

if (!CONFIG.POWER_AUTOMATE_WRITE_URL) {
    document.getElementById('config-warning').style.display = 'block';
  }

  showTab('issue');
  await loadEntries();
});

// ── Tabs ──────────────────────────────────────────────────────────
function switchTab(id) {
  document.querySelectorAll('.tab').forEach((t, i) =>
    t.classList.toggle('active', ['issue', 'registry'][i] === id));
  document.querySelectorAll('.tab-section').forEach(s => s.style.display = 'none');
  document.getElementById('tab-' + id).style.display = 'block';
  if (id === 'registry') loadEntries();
}

function showTab(id) {
  document.querySelectorAll('.tab-section').forEach(s => s.style.display = 'none');
  document.getElementById('tab-' + id).style.display = 'block';
}

// ── Programme selection ───────────────────────────────────────────
function selectProg(type) {
  STATE.selectedType = type;
  document.querySelectorAll('.prog-card').forEach(c => c.classList.remove('selected'));
  document.getElementById('card-' + type).classList.add('selected');
  document.querySelectorAll('.lfam-only').forEach(el =>
    el.classList.toggle('on', CERT_TYPES[type].extraFields));
  document.getElementById('form-wrap').style.display = 'block';
  refreshId();
  clearB('issue-banner');
}

function refreshId() {
  const type = STATE.selectedType;
  if (!type) return;
  const yr  = new Date().getFullYear().toString().slice(2);
  const mo  = String(new Date().getMonth() + 1).padStart(2, '0');
  const seq = String(STATE.entries.filter(e => e.type === type).length + 1).padStart(2, '0');
  document.getElementById('f-certid').textContent = `${type}${yr}${mo}${seq}`;
}

// ── Issue ─────────────────────────────────────────────────────────
async function issueCert() {
  const name = document.getElementById('f-name').value.trim();
  const date = document.getElementById('f-date').value;
  if (!name) { showB('issue-banner', 'err', 'Please enter the recipient\'s full name.'); return; }
  if (!date) { showB('issue-banner', 'err', 'Please select an issue date.'); return; }

  const btn = document.getElementById('submit-btn');
  btn.disabled = true; btn.textContent = 'Saving…';

  const entry = {
    id:        document.getElementById('f-certid').textContent,
    type:      STATE.selectedType,
    typeName:  CERT_TYPES[STATE.selectedType].label,
    name,
    org:       val('f-org'),
    loc:       val('f-loc'),
    email:     val('f-email'),
    date,
    signer:    val('f-signer'),
    delivery:  val('f-delivery'),
    duration:  val('f-duration'),
    format:    val('f-format'),
    notes:     val('f-notes'),
    createdAt: new Date().toISOString(),
  };

  try {
    await API.submitEntry(entry);
    STATE.entries.unshift(entry);
    updateStats();
    showB('issue-banner', 'ok',
      `Certificate <strong>${entry.id}</strong> issued for ${esc(entry.name)} — saved to SharePoint.`);
    resetForm(true);
  } catch (e) {
    showB('issue-banner', 'err', 'Save failed — check your Power Automate flow is active.');
  }

  btn.disabled = false; btn.textContent = 'Save to registry';
}

function resetForm(keepType) {
  ['f-name','f-org','f-loc','f-email','f-delivery','f-duration','f-format','f-notes'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  document.getElementById('f-date').value = today();
  if (!keepType) {
    STATE.selectedType = null;
    document.querySelectorAll('.prog-card').forEach(c => c.classList.remove('selected'));
    document.getElementById('form-wrap').style.display = 'none';
    document.getElementById('f-certid').textContent = '—';
  } else {
    refreshId();
  }
}

// ── Registry ──────────────────────────────────────────────────────
async function loadEntries() {
  if (!CONFIG.POWER_AUTOMATE_URL) return;
  document.getElementById('reg-list').innerHTML =
    '<div class="loading"><div class="spinner"></div>Loading registry…</div>';
  try {
    STATE.entries = await API.loadEntries();
    updateStats();
    renderReg();
  } catch (e) {
    document.getElementById('reg-list').innerHTML =
      '<div class="empty">Could not load entries — check your Power Automate flow.</div>';
  }
}

function renderReg() {
  const q  = (document.getElementById('search-input')?.value || '').toLowerCase();
  const tf = document.getElementById('type-filter')?.value || '';

  const list = STATE.entries.filter(e => {
    const mt = !tf || e.type === tf;
    const ms = !q  || e.name.toLowerCase().includes(q)
                   || e.id.toLowerCase().includes(q)
                   || (e.org || '').toLowerCase().includes(q);
    return mt && ms;
  });

  const el = document.getElementById('reg-list');
  if (!list.length) {
    el.innerHTML = '<div class="empty">No certificates match your filters.</div>';
    return;
  }

  el.innerHTML = list.map(e => {
    const cfg = CERT_TYPES[e.type] || { label: e.type, badge: 'bl' };
    const d   = e.date ? e.date.split('-').reverse().join('/') : '—';
    return `<div class="t-row">
      <div><span class="cert-tag">${esc(e.id)}</span></div>
      <div>
        <div class="r-name">${esc(e.name)}</div>
        <div class="r-sub">${esc([e.org, e.loc].filter(Boolean).join(' · '))}</div>
      </div>
      <div><span class="prog-badge ${cfg.badge}">${cfg.label}</span></div>
      <div class="date-c">${d}</div>
    </div>`;
  }).join('');
}

function updateStats() {
  document.getElementById('s-total').textContent = STATE.entries.length;
  document.getElementById('s-lfam').textContent  = STATE.entries.filter(e => e.type === 'LFAM').length;
  document.getElementById('s-acad').textContent  = STATE.entries.filter(e => e.type === 'ACAD').length;
  document.getElementById('s-st').textContent    = STATE.entries.filter(e => e.type === 'HERN' || e.type === 'VIPR').length;
}

function exportCSV() {
  const cols = ['ID','Type','Name','Organisation','Location','Email','Date','Signer','Delivery','Duration','Format','Notes','Created'];
  const rows = STATE.entries.map(e =>
    [e.id, CERT_TYPES[e.type]?.label || e.type, e.name, e.org, e.loc, e.email,
     e.date, e.signer, e.delivery, e.duration, e.format, e.notes, e.createdAt]
    .map(v => `"${(v || '').replace(/"/g, '""')}"`)
    .join(','));
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([[cols.join(','), ...rows].join('\n')], { type: 'text/csv' }));
  a.download = 'caracol_certificates.csv';
  a.click();
}

// ── Helpers ───────────────────────────────────────────────────────
function val(id)  { return (document.getElementById(id)?.value || '').trim(); }
function esc(s)   { return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function today()  { return new Date().toISOString().split('T')[0]; }
function clearB(id) { const el = document.getElementById(id); if (el) el.innerHTML = ''; }

function showB(id, type, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  const cls = type === 'ok' ? 'b-ok' : 'b-err';
  el.innerHTML = `<div class="banner ${cls}">${msg}</div>`;
  if (type === 'ok') setTimeout(() => { el.innerHTML = ''; }, 5000);
}
