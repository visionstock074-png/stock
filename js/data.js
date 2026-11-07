/* Data layer: localStorage + Supabase in sync.
   - Every save()/del() updates localStorage immediately, then pushes to Supabase (failed ops wait in an outbox and retry).
   - pull() reads the server (source of truth) into localStorage.
   Supabase tables: id text primary key, data jsonb (see supabase.sql). The key below is a *publishable* key:
   it is public by design, so protection comes from Row Level Security policies, not from hiding the key. */
const SB_URL = "https://dttoeaofouybqzhqssbh.supabase.co";
const SB_KEY = "sb_publishable_ikcxwJwNv4jW-V8bd8EjSA_g57utZ36";
const mkClient = (o) => (window.supabase && SB_URL && SB_KEY) ? window.supabase.createClient(SB_URL, SB_KEY, o) : null;
const sb  = mkClient({auth:{persistSession:true, autoRefreshToken:true}});
const sb2 = mkClient({auth:{persistSession:false, autoRefreshToken:false, detectSessionInUrl:false, storageKey:'mi-admin-signup'}}); /* used only to create other users without touching my session */
const TB = ['items','used','expired','maint','deficits','vouchers','log','reps','hospitals','contacts'];
const D = {};
const LS = 'mi_';
const jget = (k,d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d } catch(e) { return d } };
const persist = t => localStorage.setItem(LS+t, JSON.stringify(D[t]));
TB.forEach(t => D[t] = jget(LS+t, []));
D.users = jget(LS+'users', []);   /* mirror of the profiles table (display only) */
let NEEDS_SETUP = false;
let Q = jget(LS+'q', []);            /* outbox: [{t, op:'up'|'del', id}] */
let syncErr = '', LASTW = 0;
const saveQ = () => localStorage.setItem(LS+'q', JSON.stringify(Q));
const okId = id => typeof id === 'string' && /^[\w-]{1,64}$/.test(id);
const newId = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36)+Math.random().toString(36).slice(2,10));
const enqueue = (t,op,id) => { Q = Q.filter(o => !(o.t===t && o.id===id)); Q.push({t,op,id}); saveQ() };
const syncLabel = () => !sb ? '💾 محلي فقط' : Q.length ? '⏳ '+Q.length+' عملية بانتظار المزامنة'+(syncErr?' — '+syncErr.slice(0,45):'') : '☁️ متزامن مع Supabase';
const updatePill = () => { const e = document.getElementById('sp'); if (e) e.textContent = syncLabel() };

async function doFlush() {
  if (!sb || !Q.length) { updatePill(); return }
  const rest = [];
  for (const o of Q) {
    try {
      let res;
      if (o.op === 'del') res = await sb.from(o.t).delete().eq('id', o.id);
      else { const r = D[o.t].find(x => x.id === o.id); if (!r) continue; res = await sb.from(o.t).upsert({id:r.id, data:r}) }
      if (res.error) throw res.error;
    } catch(e) {
      syncErr = e.message || String(e);
      if (e.code === '42501' || /row-level security|permission denied/i.test(syncErr)) syncErr = 'غير مصرّح لك بهذه العملية';   /* RLS refused: retrying is pointless */
      else rest.push(o);
    }
  }
  Q = rest; saveQ(); if (!rest.length) syncErr = '';
  updatePill();
}
let fl = Promise.resolve();
const flush = () => (fl = fl.then(doFlush, doFlush));

async function save(t, r) {
  if (!r.id) r.id = newId();
  const i = D[t].findIndex(x => x.id === r.id);
  i < 0 ? D[t].push(r) : D[t][i] = r;
  persist(t); LASTW = Date.now();
  enqueue(t, 'up', r.id); await flush();
  return r;
}
async function del(t, id) {
  D[t] = D[t].filter(x => x.id !== id);
  persist(t); LASTW = Date.now();
  enqueue(t, 'del', id); await flush();
}
async function pull() {
  if (!sb) return;
  await flush();
  for (const t of TB) {
    try {
      const { data, error } = await sb.from(t).select('id,data');
      if (error) throw error;
      const rows = (data || []).filter(r => okId(r.id) && r.data && typeof r.data === 'object').map(r => ({...r.data, id:r.id}));
      const flag = LS+'synced_'+t;
      const viewer = typeof me !== 'undefined' && me && me.role === 'viewer';
      if (!rows.length && D[t].length && !localStorage.getItem(flag) && !viewer) {      /* first sync of this device: upload local data once */
        D[t].forEach(r => { if (okId(r.id)) enqueue(t, 'up', r.id) });
      } else {                                                               /* server wins; keep my still-pending edits */
        const pend = new Map(Q.filter(o => o.t === t).map(o => [o.id, o.op]));
        const keep = D[t].filter(r => pend.get(r.id) === 'up');
        const kid = new Set(keep.map(r => r.id));
        D[t] = [...rows.filter(r => !kid.has(r.id) && pend.get(r.id) !== 'del'), ...keep];
      }
      localStorage.setItem(flag, '1'); persist(t);
    } catch(e) { syncErr = e.message || String(e) }
  }
  await flush();
}
const logAct = a => save('log', {ts:new Date().toISOString(), user:(typeof me!=='undefined'&&me)?me.username:'', action:a});

/* ===== Auth: Supabase Auth (email = username@medistock.app) + role from the `profiles` table, enforced by RLS ===== */
/* Owner signs in with a REAL email. Every other user signs in with just a username + password:
   the username is mapped to an internal email on a real domain (Supabase rejects fake domains like .app / example.com).
   No mail is ever sent to these internal addresses. */
const EMAIL_DOMAIN = 'gmail.com';
const emailOf = u => 'medistock.' + String(u).trim().toLowerCase().replace(/[^a-z0-9_]/g, '') + '@' + EMAIL_DOMAIN;
const isEmail = x => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(x).trim());
const loginEmail = id => isEmail(id) ? String(id).trim().toLowerCase() : emailOf(id);   /* '@' present => owner's real email */
const authMsg = e => { const m = (e && e.message) || String(e);
  if (/invalid login/i.test(m)) return 'بيانات الدخول غير صحيحة';
  if (/already (been )?registered/i.test(m)) return 'اسم المستخدم مستخدم بالفعل';
  if (/rate limit|too many/i.test(m)) return 'محاولات كثيرة، حاول لاحقاً';
  if (/signups? not allowed|signup.*disabled/i.test(m)) return 'التسجيل معطّل في Supabase — فعّل Email provider';
  if (/confirm email must be disabled/i.test(m)) return 'عطّل Confirm email من Supabase > Authentication > Providers > Email';
  if (/row-level security|permission denied/i.test(m)) return 'غير مصرّح لك بهذه العملية';
  return m };
async function loadProfile(uid) { const {data, error} = await sb.from('profiles').select('id,username,name,role').eq('id', uid).maybeSingle(); if (error) throw error; return data }
async function loadUsers() { const {data, error} = await sb.from('profiles').select('id,username,name,role'); if (!error && data) { D.users = data; persist('users') } }
async function authLogin(username, password) {
  if (!sb) throw new Error('تعذّر الاتصال بـ Supabase');
  const {data, error} = await sb.auth.signInWithPassword({email: loginEmail(username), password});
  if (error) throw error;
  const p = await loadProfile(data.user.id);
  if (!p) { await sb.auth.signOut(); throw new Error('الحساب بدون صلاحيات — راجع المالك') }
  localStorage.mi_profile = JSON.stringify(p); return p }
async function authSetup(email, name, password) {                       /* owner: real email */
  email = String(email).trim().toLowerCase();
  const {data, error} = await sb.auth.signUp({email, password});
  if (error) throw error;
  if (!data.session) throw new Error('confirm email must be disabled');
  const p = {id: data.user.id, username: email, name: name || email, role: 'admin'};
  const r = await sb.from('profiles').insert(p); if (r.error) throw r.error;
  localStorage.mi_profile = JSON.stringify(p); return p }
async function authRestore() {
  if (!sb) return null;
  try {
    const {data} = await sb.auth.getSession(); if (!data.session) return null;
    try { const p = await loadProfile(data.session.user.id); if (p) { localStorage.mi_profile = JSON.stringify(p); return p } return null }
    catch(e) { const c = jget('mi_profile', null); return c && c.id === data.session.user.id ? c : null }   /* offline: cached profile */
  } catch(e) { return null } }
async function authLogout() {
  try { await flush() } catch(e) {}
  if (sb) { try { await sb.auth.signOut() } catch(e) {} }
  TB.forEach(t => { D[t] = []; persist(t); localStorage.removeItem(LS+'synced_'+t) });   /* no data left on the device */
  D.users = []; persist('users'); Q = []; saveQ(); localStorage.removeItem('mi_profile'); sessionStorage.clear() }
async function createUser(username, name, password, role) {
  const r = await sb2.auth.signUp({email: emailOf(username), password});
  if (r.error) throw r.error;
  if (!r.data.user || (r.data.user.identities && !r.data.user.identities.length)) throw new Error('already registered');
  const p = {id: r.data.user.id, username, name: name || username, role};
  const x = await sb.from('profiles').insert(p); if (x.error) throw x.error;
  D.users.push(p); persist('users'); return p }
