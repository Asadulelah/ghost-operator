/* GHOST OPERATOR - the director.
   Runs the ghost through endless, lightly-randomized work scenarios.
   The console narrates the reasoning. You can pause it, speed it,
   or just move your mouse and find out it noticed. */

const $ = id => document.getElementById(id);
const rnd = a => a[Math.floor(Math.random() * a.length)];

const D = { running: false, paused: false, tasks: 0, t0: 0, seenYou: false, speed: 1 };

/* ---------------- console ---------------- */
function say(txt, cls) {
  const d = document.createElement('div');
  d.className = 'cline ' + (cls || '');
  const ts = document.createElement('span'); ts.textContent = new Date().toTimeString().slice(0, 8);
  const tx = document.createElement('p'); tx.textContent = txt;
  d.append(ts, tx);
  $('console').prepend(d);
  while ($('console').children.length > 40) $('console').lastChild.remove();
}
const think = t => say(t, 'think');
const act = t => say(t, 'act');
const verdict = t => say(t, 'verdict');

function bumpTasks() {
  D.tasks++;
  $('stTasks').textContent = D.tasks;
}
setInterval(() => {
  if (!D.running) return;
  const s = Math.floor((Date.now() - D.t0) / 1000);
  $('stUp').textContent = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
}, 1000);

/* ---------------- scenarios ---------------- */
async function sLeadTriage() {
  think(rnd(NARRATE.scanLeads));
  await Ghost.click(document.querySelector('.nav-item[data-v="leads"]'));
  const rows = [...document.querySelectorAll('#leadRows tr')];
  for (const r of rows.slice(0, 3)) { await Ghost.moveToEl(r); await Ghost.wait(160 / D.speed); }
  const stale = LEADS.filter(l => l.last >= 5 && l.stage !== 'WON');
  if (!stale.length) { think('nothing stale. the board is clean. suspicious.'); return; }
  const l = rnd(stale);
  verdict(NARRATE.foundStale(l));
  await Ghost.click(document.querySelector(`#leadRows tr[data-lead="${l.id}"]`));
  await Ghost.wait(420 / D.speed);
  act(NARRATE.openRecord(l));
  await Ghost.click($('dCompose'));
  const mail = (l.last >= 8 ? EMAILS.stale : EMAILS.nudge)(l);
  think(rnd(NARRATE.draft));
  await Ghost.type($('cSub'), mail.subject);
  await Ghost.type($('cBody'), mail.body);
  await Ghost.click($('cSend'));
  act(rnd(NARRATE.send));
  CRM.touch(l.id); CRM.closeLead(); bumpTasks();
}

async function sFreshLead() {
  const fresh = LEADS.filter(l => l.stage === 'NEW');
  if (!fresh.length) return sLeadTriage();
  const l = rnd(fresh);
  verdict(NARRATE.foundFresh(l));
  await Ghost.click(document.querySelector('.nav-item[data-v="leads"]'));
  await Ghost.click(document.querySelector(`#leadRows tr[data-lead="${l.id}"]`));
  await Ghost.wait(380 / D.speed);
  await Ghost.click($('dCompose'));
  const mail = EMAILS.fresh(l);
  think(rnd(NARRATE.draft));
  await Ghost.type($('cSub'), mail.subject);
  await Ghost.type($('cBody'), mail.body);
  await Ghost.click($('cSend'));
  act(rnd(NARRATE.send));
  CRM.touch(l.id); CRM.setStage(l.id, 'CONTACTED'); CRM.closeLead(); bumpTasks();
}

async function sPromote() {
  const movable = LEADS.filter(l => ['CONTACTED', 'MEETING'].includes(l.stage));
  if (!movable.length) return;
  const l = rnd(movable);
  const next = STAGES[STAGES.indexOf(l.stage) + 1];
  CRM.toast(`reply received: ${l.name}`, 'in'); AudioEngine.ping();
  await Ghost.wait(700 / D.speed);
  verdict(NARRATE.drag(l, next));
  await Ghost.click(document.querySelector('.nav-item[data-v="pipeline"]'));
  await Ghost.wait(360 / D.speed);
  const card = document.querySelector(`.kcard[data-kc="${l.id}"]`);
  const col = document.querySelector(`.kcol[data-stage="${next}"]`);
  if (card && col) await Ghost.drag(card, col, () => { CRM.setStage(l.id, next); CRM.touch(l.id); });
  bumpTasks();
}

async function sPatchRecord() {
  const broken = LEADS.filter(l => !l.phone);
  if (!broken.length) return;
  const l = broken[0];
  verdict(NARRATE.patch(l));
  await Ghost.click(document.querySelector('.nav-item[data-v="leads"]'));
  await Ghost.click(document.querySelector(`#leadRows tr[data-lead="${l.id}"]`));
  await Ghost.wait(380 / D.speed);
  const phone = '+1 ' + (200 + Math.floor(Math.random() * 700)) + ' 555 0' + (100 + Math.floor(Math.random() * 80));
  await Ghost.type($('dPhone'), phone);
  CRM.setPhone(l.id, phone);
  act('record repaired. nothing stays broken on my shift.');
  CRM.closeLead(); bumpTasks();
}

async function sReview() {
  think(rnd(NARRATE.review));
  await Ghost.click(document.querySelector('.nav-item[data-v="dashboard"]'));
  for (const k of document.querySelectorAll('.kpi')) { await Ghost.moveToEl(k); await Ghost.wait(220 / D.speed); }
  CRM.logLine(rnd(OPERATOR_LOGS));
  act('operator log written.');
  bumpTasks();
}

const SCENARIOS = [sLeadTriage, sFreshLead, sPromote, sPatchRecord, sReview];

/* ---------------- the loop ---------------- */
async function run() {
  D.running = true; D.t0 = Date.now();
  for (const line of NARRATE.wake) { think(line); await Ghost.wait(500); }
  let last = -1;
  while (true) {
    if (D.paused) { await Ghost.wait(400); continue; }
    let i; do { i = Math.floor(Math.random() * SCENARIOS.length); } while (i === last);
    last = i;
    try { await SCENARIOS[i](); } catch (e) { /* a scenario losing its target is fine; move on */ }
    think(rnd(NARRATE.idle));
    await Ghost.drift();
    await Ghost.wait((900 + Math.random() * 1600) / D.speed);
  }
}

/* ---------------- it sees you ---------------- */
let moveCount = 0;
addEventListener('pointermove', () => {
  if (!D.running || D.seenYou || D.paused) return;
  if (++moveCount < 40) return;
  D.seenYou = true;
  AudioEngine.sting();
  document.body.classList.add('seen');
  verdict(NARRATE.seen);
  setTimeout(() => document.body.classList.remove('seen'), 2600);
});

/* ---------------- controls ---------------- */
$('startSound').onclick = () => { AudioEngine.enable(true); $('sndTgl').textContent = 'SOUND ON'; $('sndTgl').classList.add('on'); begin(); };
$('startSilent').onclick = begin;
function begin() {
  $('intro').classList.add('gone');
  Ghost.init();
  run();
}
$('sndTgl').onclick = e => {
  const on = AudioEngine.toggle();
  e.target.textContent = on ? 'SOUND ON' : 'SOUND OFF';
  e.target.classList.toggle('on', on);
};
$('motTgl').onclick = e => {
  const off = document.documentElement.classList.toggle('no-motion');
  Ghost.setMotion(!off);
  e.target.textContent = off ? 'MOTION OFF' : 'MOTION ON';
};
$('pauseBtn').onclick = e => {
  D.paused = !D.paused;
  e.target.textContent = D.paused ? 'RESUME THE GHOST' : 'PAUSE / TAKE CONTROL';
  e.target.classList.toggle('on', D.paused);
  document.body.classList.toggle('human', D.paused);
  say(D.paused ? NARRATE.paused : NARRATE.resumed, D.paused ? 'think' : 'verdict');
};
document.querySelectorAll('.spd').forEach(b => b.onclick = () => {
  document.querySelectorAll('.spd').forEach(x => x.classList.remove('on'));
  b.classList.add('on');
  D.speed = +b.dataset.s; Ghost.setSpeed(D.speed);
});

CRM.init();
