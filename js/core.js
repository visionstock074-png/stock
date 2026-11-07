/* Helpers, icons, shell, auth, sheets */
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today=()=>new Date().toISOString().slice(0,10);
const days=d=>Math.round((new Date(String(d).slice(0,10)+'T00:00:00')-new Date(new Date().toDateString()))/864e5);
const IC={
grid:'<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
file:'<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4M10 9H8M16 13H8M16 17H8"/>',
box:'<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/>',
steth:'<path d="M11 2v2M5 2v2M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1"/><path d="M8 15a6 6 0 0 0 12 0v-3"/><circle cx="20" cy="10" r="2"/>',
menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
building:'<rect width="16" height="20" x="4" y="2" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/>',
alert:'<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3M12 9v4M12 17h.01"/>',
gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
shield:'<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
out:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
dl:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
plus:'<path d="M5 12h14M12 5v14"/>',search:'<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',x:'<path d="M18 6 6 18M6 6l12 12"/>',
wrench:'<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94z"/>',
archive:'<rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8M10 12h4"/>',
trash:'<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
bell:'<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
filter:'<path d="M22 3H2l8 9.46V19l4 2v-8.54z"/>',chev:'<path d="m6 9 6 6 6-6"/>',
moon:'<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',edit:'<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
trend:'<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',arrow:'<path d="M5 12h14M12 5l7 7-7 7"/>',check:'<path d="M20 6 9 17l-5-5"/>',undo:'<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-15-6.7L3 13"/>'};
IC.send='<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>';
const ic=(n,s=20)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${IC[n]}</svg>`;
const bg=(c,t)=>`<span class="badge ${c}">${t}</span>`;
const tot=r=>(r.batches||[]).reduce((a,b)=>a+(+b.qty||0),0);
const live=r=>(r.batches||[]).filter(b=>+b.qty>0&&b.exp);
const minOf=r=>+r.min>0?+r.min:3;
const low=r=>tot(r)<minOf(r);
const soon=r=>live(r).some(b=>days(b.exp)>=0&&days(b.exp)<90);
const gone=r=>live(r).some(b=>days(b.exp)<0);
const ROLE={admin:'مالك التطبيق',keeper:'أمين مخزن / إدخال بيانات',viewer:'مشاهد'};
const VIEW=['dash','used','expired','maint','deficits','settings'];
const MENU=[['dash','لوحة التحكم','grid'],['vouchers','الإذونات','file'],['items','المخزون الرئيسي','box'],['reps','إدارة المندوبين','users'],['hospitals','إدارة المستشفيات','building'],['used','المستخدم','steth'],['expired','المنتهي / التالف','alert'],['maint','الصيانة','wrench'],['deficits','نواقص المخزن','bell'],['settings','الإعدادات','gear']];
let me=null,R='dash',F={q:'',tab:''};
const can=()=>me.role!=='viewer',adm=()=>me.role==='admin';
const go=r=>{location.hash='#/'+r};

/* Sheets (bottom modals) */
function sheet(title,body,foot){$('#sh').innerHTML=`<div class="ov" onclick="closeSheet()"></div><div class="sheet"><div class="sh-h"><b>${title}</b><button class="ib" onclick="closeSheet()">${ic('x')}</button></div><div class="sh-b">${body}</div>${foot?`<div class="sh-f">${foot}</div>`:''}</div>`;$('#sh').hidden=false}
const closeSheet=()=>{$('#sh').hidden=true;$('#sh').innerHTML=''};

/* Auth */
async function login(){
 const lock=+sessionStorage.mi_lock||0;
 if(Date.now()<lock)return $('#le').textContent='محاولات كثيرة، انتظر '+Math.ceil((lock-Date.now())/1000)+' ثانية';
 $('#le').textContent='';
 try{me=await authLogin($('#lu').value,$('#lp').value);sessionStorage.mi_try=0;await afterLogin();logAct('تسجيل دخول');go('dash');render()}
 catch(e){me=null;const n=(+sessionStorage.mi_try||0)+1;sessionStorage.mi_try=n;if(n>=5){sessionStorage.mi_lock=Date.now()+30000;sessionStorage.mi_try=0}$('#le').textContent=authMsg(e)}
}
const offlineView=()=>`<div class="lg"><div class="av">م</div><h1>MediStock</h1><div class="card"><p>تعذّر تحميل مكتبة Supabase. تحقق من الاتصال بالإنترنت ثم أعد المحاولة.</p><button class="btn pri blk" onclick="location.reload()">إعادة المحاولة</button></div></div>`;
const loginView=()=>`<div class="lg"><div class="av">م</div><h1>MediStock</h1><p class="sub">إدارة المخزون الطبي</p><div class="card" style="text-align:start"><div class="fld"><label>اسم المستخدم (أو بريد المالك)</label><input id="lu" autocomplete="username" autocapitalize="none"></div><div class="fld"><label>كلمة المرور</label><input id="lp" type="password" autocomplete="current-password" onkeydown="if(event.key==='Enter')login()"></div><p id="le" style="color:var(--red);margin:0 0 8px"></p><button class="btn pri blk" onclick="login()">دخول</button></div></div>`;
async function logout(){await authLogout();me=null;render()}
function dark(){document.documentElement.classList.toggle('dark');localStorage.mi_dark=document.documentElement.classList.contains('dark')?'1':'0';render()}
const toggleDr=()=>{$('#dr').classList.toggle('on');$('#dov').classList.toggle('off')};

/* Shell */
function render(){
 if(!me){$('#app').innerHTML=!sb?offlineView():loginView();return}
 const ok=MENU.filter(m=>me.role!=='viewer'||VIEW.includes(m[0]));
 if(R==='vform'?!can():!ok.some(m=>m[0]===R))R='dash';
 const nav=['dash','vouchers','items','used','expired','maint','deficits'].map(k=>ok.find(m=>m[0]===k)).filter(Boolean).slice(0,4);
 const nm=me.name||me.username;
 $('#app').innerHTML=`<header class="hdr"><div class="av">${esc(nm[0])}</div><div class="t"><b>MediStock</b><small>${ROLE[me.role]} · ${esc(me.username)}</small><small id="sp">${esc(syncLabel())}</small></div><button class="ib" onclick="toggleDr()">${ic('menu',26)}</button></header>
 <main class="wrap">${page()}</main>
 <nav class="nav">${nav.map(m=>`<button class="${R===m[0]?'on':''}" onclick="go('${m[0]}')">${ic(m[2],24)}${m[1].replace('المخزون الرئيسي','المخزون').replace('نواقص المخزن','النواقص').replace('المنتهي / التالف','التالف')}</button>`).join('')}<button onclick="toggleDr()">${ic('menu',24)}المزيد</button></nav>
 <div id="dov" class="ov off" onclick="toggleDr()"></div>
 <aside id="dr" class="drawer"><div class="dh"><button class="ib" style="color:#fff" onclick="toggleDr()">${ic('x')}</button><span>القائمة</span></div><div class="dm">${ok.map(m=>`<button class="mi ${R===m[0]?'on':''}" onclick="toggleDr();go('${m[0]}')">${ic(m[2],24)}${m[1]}</button>`).join('')}</div>
 <div class="ft"><button class="mi" onclick="dark();">${ic('moon',24)}الوضع الليلي</button>${can()?`<button class="mi" onclick="toggleDr();team()">${ic('shield',24)}إدارة المستخدمين</button>`:''}<button class="mi" style="color:#f0b4b4" onclick="logout()">${ic('out',24)}تسجيل الخروج</button></div></aside>`;
 if(R==='dash')drawChart();
}
function page(){return R==='dash'?dash():R==='vouchers'?vouchers():R==='vform'?vform():R==='settings'?settings():list(R)}
const head=(t,s,a)=>`<h1>${t}</h1><p class="sub">${s}</p><div class="ar">${a||''}</div>`;
const exBtn=(l,fn)=>`<button class="btn" onclick="${fn}">${ic('dl')} ${l} ${ic('chev',16)}</button>`;
const empty=(i,t,p,b)=>`<div class="card empty"><div class="ei">${ic(i,28)}</div><b>${t}</b><p>${p}</p>${b||''}</div>`;
