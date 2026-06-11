/* GHOST OPERATOR - data layer.
   Everything here is invented. Names, companies, numbers: all fiction. */

const LEADS = [
  { id: 'L1', name: 'Maya Chen',      company: 'Northwind Supply',  value: 8400,  stage: 'CONTACTED',   email: 'maya@northwind.example',   last: 6, phone: '+1 415 555 0182', note: 'asked for case studies' },
  { id: 'L2', name: 'Derek Okafor',   company: 'Bluepeak Media',    value: 12500, stage: 'NEW',         email: 'derek@bluepeak.example',   last: 2, phone: '',               note: 'inbound via site form' },
  { id: 'L3', name: 'Lena Vogel',     company: 'Hartmann Logistik', value: 21000, stage: 'MEETING',     email: 'lena@hartmann.example',    last: 1, phone: '+49 30 555 0144', note: 'wants EU data residency' },
  { id: 'L4', name: 'Ravi Menon',     company: 'Cobalt Works',      value: 6800,  stage: 'CONTACTED',   email: 'ravi@cobalt.example',      last: 9, phone: '+91 80 555 0117', note: 'gone quiet after pricing' },
  { id: 'L5', name: 'Sofia Marino',   company: 'Verde Foods',       value: 15200, stage: 'NEGOTIATION', email: 'sofia@verde.example',      last: 0, phone: '+39 02 555 0190', note: 'comparing two vendors' },
  { id: 'L6', name: 'Tom Aldridge',   company: 'Quarry & Lane',     value: 4300,  stage: 'NEW',         email: 'tom@quarrylane.example',   last: 4, phone: '',               note: 'referred by Lena' },
  { id: 'L7', name: 'Amara Diallo',   company: 'Solstice Health',   value: 18900, stage: 'CONTACTED',   email: 'amara@solstice.example',   last: 7, phone: '+1 646 555 0139', note: 'security questionnaire pending' },
  { id: 'L8', name: 'Jonas Lindqvist',company: 'Fjord Analytics',   value: 9900,  stage: 'MEETING',     email: 'jonas@fjord.example',      last: 3, phone: '+46 8 555 0163',  note: 'trial expires friday' }
];

const STAGES = ['NEW', 'CONTACTED', 'MEETING', 'NEGOTIATION', 'WON'];

const EMAILS = {
  stale: lead => ({
    subject: `Re: ${lead.company} - picking this back up`,
    body: `Hi ${lead.name.split(' ')[0]},\n\nYou went quiet ${lead.last} days ago and I suspect that's on us, not you. One question to make this easy: is this still a priority this quarter?\n\nIf yes, I'll send two time slots. If no, tell me and I'll close the file. No hard feelings either way.`
  }),
  fresh: lead => ({
    subject: `Welcome ${lead.name.split(' ')[0]} - next step inside`,
    body: `Hi ${lead.name.split(' ')[0]},\n\nSaw your note come in from the site. Short version: yes, we handle what you described.\n\nI've held two slots this week for a 20-minute walkthrough. Reply with a number and it's yours.`
  }),
  nudge: lead => ({
    subject: `${lead.company} x us - one decision left`,
    body: `Hi ${lead.name.split(' ')[0]},\n\nYou're one decision away. You said the open question was "${lead.note}" - here's the direct answer, attached.\n\nIf it closes the question, I'll send the agreement today.`
  })
};

/* narration phrasebank: think lines are dim, act lines bright, verdicts accented */
const NARRATE = {
  wake: ['signal acquired. reading the room.', 'good. the interface is asleep. waking it.', 'scanning pipeline state…'],
  scanLeads: ['walking the lead table…', 'reading every row. humans skim. I don’t.', 'sorting by neglect, not by value.'],
  foundStale: l => `found one. ${l.name}, ${l.company}: silent for ${l.last} days. unacceptable.`,
  foundFresh: l => `${l.name} arrived ${l.last} days ago and nobody said hello. fixing that.`,
  openRecord: l => `opening the file on ${l.name}.`,
  draft: ['drafting. tone: warm, direct, no begging.', 'writing the email a tired human would have sent three days from now.', 'two sentences too long. cutting them.'],
  send: ['sent. logging the touch.', 'dispatched. the silence is now their move.', 'sent at the time a human would call "after hours."'],
  drag: (l, s) => `${l.name} replied. promoting to ${s}.`,
  patch: l => `${l.name}'s record is missing a phone number. a human would shrug. patching it.`,
  review: ['stepping back. reading the board the way an owner would.', 'pipeline value recalculated. writing the operator log.'],
  idle: ['waiting. I don’t get bored, I just get ready.', 'monitoring. nothing leaks past this cursor.', 'humans rest. I patrol.'],
  seen: 'you moved. I can see your cursor, you know. keep watching.',
  paused: 'paused. the software is yours. it misses me already.',
  resumed: 'control reacquired. as expected.'
};

const OPERATOR_LOGS = [
  'pipeline healthy. two stale threads revived tonight.',
  'response debt cleared. nothing older than 48h remains.',
  'one deal promoted, one record repaired. quiet shift.',
  'all follow-ups current. the humans can sleep.'
];
