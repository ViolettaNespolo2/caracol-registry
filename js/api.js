// api.js — Power Automate calls
const API = (() => {

  async function submitEntry(entry) {
    const res = await fetch(CONFIG.POWER_AUTOMATE_WRITE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    if (!res.ok) throw new Error(`submit failed: ${res.status}`);
    return res;
  }

  async function loadEntries() {
    const res = await fetch(CONFIG.POWER_AUTOMATE_READ_URL, {
      method: 'GET',
    });
    if (!res.ok) throw new Error(`load failed: ${res.status}`);
    const data = await res.json();
    // Power Automate returns Excel rows — map column names to our field names
    return (data.entries || []).map(row => ({
      id:           row.ID        || row.id        || '',
      type:         row.Type      || row.type      || '',
      typeName:     row.CertificateType || row.typeName || '',
      name:         row.Name      || row.name      || '',
      org:          row.Organisation || row.org    || '',
      loc:          row.Location  || row.loc       || '',
      email:        row.Email     || row.email     || '',
      date:         row.Date      || row.date      || '',
      signer:       row.Signer    || row.signer    || '',
      delivery:     row.Delivery  || row.delivery  || '',
      duration:     row.Duration  || row.duration  || '',
      format:       row.Format    || row.format    || '',
      notes:        row.Notes     || row.notes     || '',
      createdAt:    row.CreatedAt || row.createdAt || '',
    }));
  }

  return { submitEntry, loadEntries };
})();
