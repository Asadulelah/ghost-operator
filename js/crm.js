/* GHOST OPERATOR - the CRM itself. A believable little SaaS.
   Plain DOM, fully functional: views, lead drawer, compose modal, kanban. */

const CRM = (() => {
  const $ = id => document.getElementById(id);
  const fmt = v => '$' + v.toLocaleString('en-US');
  let view = 'dashboard';

  function pipelineValue() { return LEADS.filter(l => l.stage !== 'WON').reduce((a, l) => a + l.value, 0); }
  function staleCount() { return LEADS.filter(l => l.last >= 5).length; }

  /* ---------- views ---------- */
  function nav(v) {
    view = v;
    document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('act', n.dataset.v === v));
    $('viewDashboard').style.display = v === 'dashboard' ? '' : 'none';
    $('viewLeads').style.display = v === 'leads' ? '' : 'none';
    $('viewPipeline').style.display = v === 'pipeline' ? '' : 'none';
    render();
  }

  function render() {
    /* dashboard */
    $('kpiPipe').textContent = fmt(pipelineValue());
    $('kpiOpen').textContent = LEADS.filter(l => l.stage !== 'WON').length;
    $('kpiStale').textContent = staleCount();
    $('kpiStale').parentElement.classList.toggle('warn', staleCount() > 0);
    /* leads table */
    $('leadRows').innerHTML = LEADS.map(l => `
      <tr data-lead="${l.id}" class="${l.last >= 5 ? 'stale' : ''}">
        <td><span class="avatar">${l.name.split(' ').map(p => p[0]).join('')}</span>${l.name}</td>
        <td class="dim">${l.company}</td>
        <td>${fmt(l.value)}</td>
        <td><span class="chip s-${l.stage}">${l.stage}</span></td>
        <td class="dim">${l.last === 0 ? 'today' : l.last + 'd ago'}</td>
        <td class="dim">${l.phone || '<span class="miss">missing</span>'}</td>
      </tr>`).join('');
    document.querySelectorAll('#leadRows tr').forEach(tr => tr.onclick = () => openLead(tr.dataset.lead));
    /* kanban */
    $('kanban').innerHTML = STAGES.map(s => `
      <div class="kcol" data-stage="${s}">
        <div class="kh">${s} <i>${LEADS.filter(l => l.stage === s).length}</i></div>
        ${LEADS.filter(l => l.stage === s).map(l => `
          <div class="kcard" data-kc="${l.id}">
            <b>${l.name}</b><span>${l.company}</span>
            <div class="kv">${fmt(l.value)}</div>
          </div>`).join('')}
      </div>`).join('');
  }

  /* ---------- lead drawer ---------- */
  let openId = null;
  function openLead(id) {
    openId = id;
    const l = LEADS.find(x => x.id === id);
    $('dName').textContent = l.name;
    $('dCo').textContent = l.company + ' · ' + fmt(l.value) + ' · ' + l.stage;
    $('dEmail').textContent = l.email;
    $('dPhone').value = l.phone;
    $('dPhone').placeholder = l.phone ? '' : 'no phone on record';
    $('dNote').textContent = '“' + l.note + '”';
    $('dLast').textContent = l.last === 0 ? 'touched today' : 'last touch ' + l.last + ' days ago';
    $('drawer').classList.add('open');
  }
  function closeLead() { $('drawer').classList.remove('open'); openId = null; }

  /* ---------- compose ---------- */
  function openCompose(to) {
    $('cTo').textContent = to;
    $('cSub').value = ''; $('cBody').value = '';
    $('compose').classList.add('open');
  }
  function closeCompose() { $('compose').classList.remove('open'); }

  /* ---------- toasts ---------- */
  function toast(msg, cls) {
    const t = document.createElement('div');
    t.className = 'toast ' + (cls || '');
    t.textContent = msg;
    $('toasts').appendChild(t);
    setTimeout(() => t.classList.add('go'), 30);
    setTimeout(() => { t.classList.remove('go'); setTimeout(() => t.remove(), 400); }, 4200);
  }

  /* ---------- mutations the ghost (or you) can perform ---------- */
  function touch(id) { const l = LEADS.find(x => x.id === id); l.last = 0; render(); }
  function setStage(id, s) { const l = LEADS.find(x => x.id === id); l.stage = s; render(); }
  function setPhone(id, p) { const l = LEADS.find(x => x.id === id); l.phone = p; render(); }
  function logLine(txt) {
    const d = document.createElement('div');
    d.innerHTML = `<span>${new Date().toTimeString().slice(0, 5)}</span> ${txt}`;
    $('opslog').prepend(d);
    while ($('opslog').children.length > 6) $('opslog').lastChild.remove();
  }

  /* wire static handlers */
  function init() {
    document.querySelectorAll('.nav-item').forEach(n => n.onclick = () => nav(n.dataset.v));
    $('dClose').onclick = closeLead;
    $('cClose').onclick = closeCompose;
    $('cSend').onclick = () => { closeCompose(); toast('email sent', 'ok'); };
    render(); nav('dashboard');
  }

  return { init, nav, render, openLead, closeLead, openCompose, closeCompose, toast, touch, setStage, setPhone, logLine, get view() { return view; }, get openId() { return openId; } };
})();
