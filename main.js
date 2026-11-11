/* Boot — must load last */
let DEFERRED=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();DEFERRED=e;if(me)render()});
window.addEventListener('appinstalled',()=>{DEFERRED=null;if(me)render()});
async function installApp(){if(!DEFERRED)return;DEFERRED.prompt();try{await DEFERRED.userChoice}catch(e){}DEFERRED=null;render()}
if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol))window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
/* Enter (or the phone keyboard's Next/Go) jumps to the next field instead of needing a tap */
document.addEventListener('focusin',e=>{const t=e.target;if(t.tagName==='INPUT'&&!t.hasAttribute('enterkeyhint'))t.setAttribute('enterkeyhint','next')});
document.addEventListener('keydown',e=>{
 if(e.key!=='Enter'||e.isComposing)return;const t=e.target;
 if(t.tagName!=='INPUT'||t.hasAttribute('onkeydown')||['button','checkbox','radio','submit'].includes(t.type))return;
 const scope=t.closest('.sheet,.card,.wrap')||document;
 const f=[...scope.querySelectorAll('input,select,textarea')].filter(x=>!x.disabled&&x.type!=='hidden'&&x.offsetParent!==null);
 const n=f[f.indexOf(t)+1];e.preventDefault();
 if(n){n.focus();if(n.tagName==='INPUT'&&!['date','number'].includes(n.type))try{n.select()}catch(_){}}else t.blur()
});
function fillDl(){
 const o=(id,a)=>{const e=$(id);if(e)e.innerHTML=[...new Set(a.filter(Boolean))].map(x=>`<option value="${esc(x)}">`).join('')};
 o('#dl-code',D.items.flatMap(i=>[i.code,i.odoo,i.name]));o('#dl-rep',[...D.reps.map(r=>r.name),...D.vouchers.map(v=>v.rep)]);o('#dl-hosp',[...D.hospitals.map(r=>r.name),...D.vouchers.map(v=>v.hospital)]);o('#dl-doc',D.vouchers.map(v=>v.doctor));o('#dl-eng',D.maint.map(m=>m.engineer))
}
const _render=render;render=function(){_render();fillDl()};
window.onhashchange=()=>{R=location.hash.slice(2)||'dash';if(R!=='vform')V=null;if(R!=='mform')M=null;if(F.tab&&R!=='vouchers')F.tab='';F={q:'',tab:F.tab};render();scrollTo(0,0)};
const idle=()=>{const a=document.activeElement;return $('#sh').hidden&&R!=='vform'&&!(a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function resync(){
 if(!me)return;
 let p;try{p=await loadProfile(me.id)}catch(e){p=me}
 if(!p){await logout();return}          /* my access was removed */
 me=p;await loadUsers().catch(()=>{});await pull();if(idle())render()
}
let RT=false;
function startRealtime(){ /* other devices' changes appear without reload */
 if(!sb||RT)return;RT=true;
 try{
  let tm;const ch=sb.channel('mi-sync');
  TB.forEach(t=>ch.on('postgres_changes',{event:'*',schema:'public',table:t},()=>{if(Date.now()-LASTW<2500)return;clearTimeout(tm);tm=setTimeout(resync,700)}));
  ch.subscribe();
 }catch(e){console.warn('realtime off',e)}
 window.addEventListener('online',resync);
}
async function afterLogin(){
 await loadUsers().catch(()=>{});
 await Promise.race([pull(),sleep(6000)]);
 if(can()&&!D.contacts.length&&localStorage.mi_wa){await save('contacts',{name:'الإدارة',phone:localStorage.mi_wa.replace(/\D/g,'')});localStorage.removeItem('mi_wa')}
 startRealtime()
}
(async()=>{
 if(localStorage.mi_dark==='1')document.documentElement.classList.add('dark');
 R=location.hash.slice(2)||'dash';
 me=await authRestore();
 if(me){await afterLogin()}
 render()
})();
