/* Boot — must load last */
function fillDl(){
 const o=(id,a)=>{const e=$(id);if(e)e.innerHTML=[...new Set(a.filter(Boolean))].map(x=>`<option value="${esc(x)}">`).join('')};
 o('#dl-code',D.items.flatMap(i=>[i.code,i.odoo,i.name]));o('#dl-rep',[...D.reps.map(r=>r.name),...D.vouchers.map(v=>v.rep)]);o('#dl-hosp',[...D.hospitals.map(r=>r.name),...D.vouchers.map(v=>v.hospital)]);o('#dl-doc',D.vouchers.map(v=>v.doctor))
}
const _render=render;render=function(){_render();fillDl()};
window.onhashchange=()=>{R=location.hash.slice(2)||'dash';if(R!=='vform')V=null;if(F.tab&&R!=='vouchers')F.tab='';F={q:'',tab:F.tab};render();scrollTo(0,0)};
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
