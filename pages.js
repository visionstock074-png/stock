/* Pages: lists (CRUD), dashboard, vouchers, settings */
const ST={'قيد الصيانة':'red','تم الاستلام':'grn','خردة':'','معقّمة وجاهزة':'grn','تحتاج تعقيم':'amb','منتهي الصلاحية':'amb','تالف':'red'};
const acts=(t,r,x='')=>can()?`<div class="acts">${x}<button class="ib" onclick="openForm('${t}','${r.id}')">${ic('edit',18)}</button><button class="ib dng" onclick="rm('${t}','${r.id}')">${ic('trash',18)}</button></div>`:'';
const card=(t,r,title,sub,badge,chips,cls='',x='')=>`<div class="row ${cls}"><div class="rt"><div><b>${esc(title)}</b><small>${esc(sub)}</small></div>${badge}</div><div class="chips">${chips.filter(Boolean).map(c=>`<span class="chip">${esc(c)}</span>`).join('')}</div>${r.note?`<small style="margin-top:8px">${esc(r.note)}</small>`:''}${acts(t,r,x)}</div>`;
const pSum=r=>(r.parts||[]).reduce((a,p)=>a+(+p.qty||0),0);
const mLines=r=>r.lines||[{name:r.name,serial:r.serial,qty:1,ret:r.ret?1:0,retDate:r.ret||''}];   /* old single-item records still work */
const mTot=r=>mLines(r).reduce((a,l)=>a+(+l.qty||0),0);
const mRet=r=>mLines(r).reduce((a,l)=>a+Math.min(+l.ret||0,+l.qty||0),0);
const mst=r=>r.status==='خردة'?'خردة':(mTot(r)>0&&mRet(r)>=mTot(r)?'تم الاستلام':'قيد الصيانة');
const inMaint=t=>D.maint.some(m=>mst(m)==='قيد الصيانة'&&mLines(m).some(l=>l.iid===t.id&&(+l.ret||0)<(+l.qty||0)));
const reserved=r=>D.vouchers.filter(v=>v.status==='temp'&&!v.archived&&v.type!=='RCPT').reduce((a,v)=>a+v.lines.filter(l=>l.iid===r.id).reduce((x,l)=>x+(+l.qty||0),0),0);
const sum=(a,k)=>a.reduce((s,r)=>s+(+r[k]||0),0);
const expB=b=>{const d=days(b.exp);return d<0?bg('red','منتهي'):d<90?bg('amb',d+' يوم'):bg('',esc(b.exp))};
const P={
items:{t:'المخزون الرئيسي',sub:'الأجهزة الجديدة والمغلقة — مربوطة بأكواد منتجات Odoo مع دفعات صلاحية متعددة',add:'صنف جديد',icon:'box',ph:'بحث بالاسم أو كود الصنف أو كود Odoo أو رقم الدفعة...',empty:['لا توجد أصناف','أضف أول صنف إلى المخزون الرئيسي، أو عدّل معايير البحث.'],
 f:[['name','اسم الصنف','t','','مثال: جهاز قياس ضغط الدم'],['code','كود الصنف الداخلي','t','','MS-0142'],['odoo','كود منتج Odoo','t','','ODOO/REF'],['cat','التصنيف','t','','أجهزة تشخيص'],['unit','الوحدة','t'],['min','حد التنبيه (الحد الأدنى)','n'],['loc','موقع التخزين','t','','رف A3'],['batches','دفعات الصلاحية','b']],
 def:()=>({unit:'قطعة',min:3}),tabs:[['all','الكل',()=>1],['low','مخزون منخفض',low],['soon','قرب الانتهاء',r=>soon(r)||gone(r)]],
 row:r=>`<div class="row ${low(r)?'red':''}"><div class="rt"><div><b>${esc(r.name)}</b><small>${esc([r.code,r.odoo].filter(Boolean).join(' · '))}</small></div>${bg(low(r)?'red':'grn',tot(r)+' '+esc(r.unit||'قطعة'))}</div><div class="chips">${[r.cat,r.loc].filter(Boolean).map(c=>`<span class="chip">${esc(c)}</span>`).join('')}${reserved(r)?`<span class="chip" style="background:var(--abg);color:var(--amb)">خارج مع المناديب (مؤقت): ${reserved(r)}</span>`:''}</div>${(r.batches||[]).map(b=>`<div class="bl"><span>${b.no?esc(b.no)+' · ':''}${b.qty} ${esc(r.unit||'قطعة')}</span>${b.exp?expB(b):'<small>بدون صلاحية</small>'}</div>`).join('')}${acts('items',r)}</div>`,
 ex:r=>({'كود Odoo':r.odoo||'','الكود':r.code||'','الصنف':r.name,'التصنيف':r.cat||'','الإجمالي':tot(r),'أقرب صلاحية':live(r).map(b=>b.exp).sort()[0]||'','الموقع':r.loc||''})},
used:{t:'المخزون المستخدم',sub:'أدوات معقّمة وقابلة لإعادة الاستخدام — مربوطة بعهدة الأطباء والمندوبين والإدارة',add:'إضافة للعهدة',icon:'steth',ph:'بحث بالصنف أو اسم المستلم...',empty:['لا توجد أدوات بالعهدة','سجّل الأدوات المستخدمة وحدّد المسؤول عنها وحالة التعقيم.'],
 f:[['name','اسم الأداة','t','dl-code','مثال: منظار بطن'],['code','الكود','t','','US-0031'],['qty','الكمية','n'],['ster','حالة التعقيم','s',['معقّمة وجاهزة','تحتاج تعقيم']],['date','تاريخ آخر تعقيم','d'],['owner','العهدة لصالح','t','dl-rep','اسم الطبيب / المندوب'],['ptype','نوع الجهة','s',['مندوب','طبيب','إدارة','مستشفى']],['note','ملاحظات','t','','ملاحظات إضافية...']],
 def:()=>({qty:1,ster:'معقّمة وجاهزة',ptype:'مندوب'}),tabs:[['all','الكل',()=>1],['ok','معقّمة',r=>r.ster==='معقّمة وجاهزة'],['need','تحتاج تعقيم',r=>r.ster==='تحتاج تعقيم']],
 row:r=>card('used',r,r.name,r.code||'',bg(ST[r.ster],esc(r.ster)),[r.qty+' قطعة',r.owner,r.ptype,r.date&&'آخر تعقيم '+r.date]),
 ex:r=>({'الصنف':r.name,'الكود':r.code||'','الكمية':r.qty,'التعقيم':r.ster,'العهدة':r.owner||'','الجهة':r.ptype,'التاريخ':r.date||''})},
expired:{t:'المنتهي / التالف',fn:'المنتهي والتالف',sub:'أصناف مسحوبة من التداول تحت عهدة الإدارة',add:'تسجيل سحب',icon:'alert',ph:'بحث بالصنف أو العهدة...',empty:['لا توجد أصناف مسحوبة','تُسجَّل هنا الأصناف المنتهية أو التالفة عند سحبها من المخزون.'],
 f:[['name','اسم الصنف','t','dl-code','مثال: محلول معالجة 500 مل'],['code','الكود','t','','EX-0012'],['qty','الكمية','n'],['reason','سبب السحب','s',['منتهي الصلاحية','تالف']],['date','تاريخ السحب','d'],['custody','العهدة / الجهة','t'],['ref','المرجع (إذن/فاتورة)','t','','MD-2026-0012'],['note','ملاحظات','t','','تفاصيل التلف أو سبب الإتلاف...']],
 def:()=>({qty:1,reason:'منتهي الصلاحية',custody:'إدارة المخزون'}),tabs:[['all','الكل',()=>1],['e','منتهي',r=>r.reason==='منتهي الصلاحية'],['d','تالف',r=>r.reason==='تالف']],
 stats:()=>[['إجمالي السجلات',D.expired.length],['منتهية الصلاحية',D.expired.filter(r=>r.reason==='منتهي الصلاحية').length,'#d97706'],['تالفة',D.expired.filter(r=>r.reason==='تالف').length,'#dc2626'],['إجمالي القطع',sum(D.expired,'qty')]],
 row:r=>card('expired',r,r.name,r.code||'',bg(ST[r.reason],esc(r.reason)),[r.qty+' قطعة',r.custody,r.ref,r.date]),
 ex:r=>({'الصنف':r.name,'الكود':r.code||'','الكمية':r.qty,'السبب':r.reason,'العهدة':r.custody||'','المرجع':r.ref||'','التاريخ':r.date||''})},
tools:{t:'مخزن الآلات',sub:'الأجهزة وعلب الأدوات ومحتوياتها بالسيريال والعدد — كل الحقول اختيارية',add:'جهاز / علبة جديدة',icon:'case',opt:true,ph:'بحث بالاسم أو السيريال أو المحتويات...',empty:['لا توجد آلات','أضف جهازاً أو علبة أدوات (يمكن الحفظ بدون بيانات كاملة).'],
 f:[['name','اسم الجهاز / علبة الأدوات','t','','مثال: علبة عدسات'],['serial','السيريال (اختياري)','t'],['cat','التصنيف','t'],['note','ملاحظات','t'],['parts','محتويات الجهاز / العلبة','p']],
 def:()=>({}),tabs:[['all','الكل',()=>1],['out','في الصيانة',r=>inMaint(r)]],
 row:r=>`<div class="row ${inMaint(r)?'red':''}"><div class="rt"><div><b>${esc(r.name||'(بدون اسم)')}</b><small>${esc([r.serial&&'S/N '+r.serial,r.cat].filter(Boolean).join(' · '))}</small></div>${bg(inMaint(r)?'red':'',inMaint(r)?'🔧 في الصيانة':(pSum(r)?pSum(r)+' قطعة':'بدون محتويات'))}</div>${(r.parts||[]).map(p=>`<div class="bl"><span>${esc(p.name||'—')}${p.serial?' · S/N '+esc(p.serial):''}</span><b>${+p.qty||0}</b></div>`).join('')}${(r.parts||[]).length?`<div class="bl"><b>الإجمالي</b><b>${pSum(r)} قطعة</b></div>`:''}${r.note?`<small style="margin-top:8px">${esc(r.note)}</small>`:''}${acts('tools',r)}</div>`,
 ex:r=>({'الجهاز':r.name||'','السيريال':r.serial||'','التصنيف':r.cat||'','المحتويات':(r.parts||[]).map(p=>`${p.name||''}${p.serial?' ['+p.serial+']':''} x${p.qty||0}`).join(' | '),'إجمالي القطع':pSum(r)})},
deficits:{t:'نواقص المخزن',sub:'أصناف أوشكت على النفاد أو نفدت — أبلغ الإدارة مباشرةً',add:'إضافة نقص',icon:'bell',ph:'بحث بالصنف أو مقدم الطلب...',empty:['لا توجد نواقص','سجّل الأصناف الناقصة لإبلاغ الإدارة.'],
 f:[['name','الصنف','t','dl-code','اسم أو كود الصنف'],['qty','الكمية المطلوبة','n'],['by','مقدم الطلب','t'],['date','التاريخ','d'],['note','ملاحظات','t']],
 def:()=>({qty:1,by:me.name||me.username}),tabs:[['all','الكل',()=>1],['n','لم يُبلَّغ',r=>!r.notified],['y','تم الإبلاغ',r=>r.notified]],
 row:r=>card('deficits',r,r.name,'مطلوب: '+(r.qty||'-')+' · '+(r.by||''),bg(r.notified?'grn':'red',r.notified?'تم الإبلاغ':'لم يُبلَّغ'),[r.date],r.notified?'':'red',can()?`<button class="btn sm" onclick="notify('${r.id}')">${ic('bell',16)} إبلاغ الإدارة</button>`:''),
 ex:r=>({'الصنف':r.name,'الكمية':r.qty,'مقدم الطلب':r.by||'','التاريخ':r.date,'الإبلاغ':r.notified?'تم':'لم يتم'})},
reps:{t:'إدارة المندوبين',sub:'قائمة المندوبين المعتمدين للبحث السريع في الإذونات',add:'مندوب جديد',icon:'users',ph:'بحث بالاسم...',empty:['لا يوجد مندوبون','أضف المندوبين ليظهروا في بحث الإذونات.'],
 f:[['name','اسم المندوب','t'],['phone','الهاتف','t'],['note','ملاحظات','t']],def:()=>({}),tabs:[['all','الكل',()=>1]],
 row:r=>card('reps',r,r.name,r.phone||'',''  ,[]),ex:r=>({'المندوب':r.name,'الهاتف':r.phone||''})},
hospitals:{t:'إدارة المستشفيات',sub:'سجل المستشفيات والجهات',add:'مستشفى جديد',icon:'building',ph:'بحث بالاسم...',empty:['لا توجد مستشفيات','أضف المستشفيات ليظهروا في بحث الإذونات.'],
 f:[['name','اسم المستشفى / الجهة','t'],['city','المدينة','t'],['note','ملاحظات','t']],def:()=>({}),tabs:[['all','الكل',()=>1]],
 row:r=>card('hospitals',r,r.name,r.city||'','',[]),ex:r=>({'المستشفى':r.name,'المدينة':r.city||''})}
};
const seg=(tabs,cur,fn='F.tab=\'%\';render()')=>`<div class="seg">${tabs.map(([k,l,n])=>`<button class="${(cur||tabs[0][0])===k?'on':''}" onclick="${fn.replace('%',k)}">${l} <i>${n}</i></button>`).join('')}</div>`;
const srch=(ph,x='')=>`<div class="srch"><div>${ic('search')}<input value="${esc(F.q)}" placeholder="${ph}" oninput="F.q=this.value;$('#rows').innerHTML=R==='vouchers'?vrows():R==='maint'?mrows():rows(R)"></div>${x}</div>`;
function list(t){
 const p=P[t],tabs=p.tabs.map(([k,l,fn])=>[k,l,D[t].filter(fn).length]);
 return head(p.t,p.sub,exBtn('تصدير',`openExport('${p.fn||p.t}',()=>D['${t}'].map(P['${t}'].ex))`)+(can()&&p.add?`<button class="btn pri" onclick="openForm('${t}')">${ic('plus')} ${p.add}</button>`:''))
 +(p.stats?`<div class="stats">${p.stats().map(([l,v,c])=>`<div class="stat"><span>${l}</span><b style="color:${c||'inherit'}">${v}</b></div>`).join('')}</div>`:'')+srch(p.ph)+(p.tabs.length>1?seg(tabs,F.tab):'')+`<div id="rows">${rows(t)}</div>`
}
function rows(t){
 const p=P[t],tab=p.tabs.find(x=>x[0]===F.tab)||p.tabs[0],q=F.q.trim().toLowerCase();
 const a=D[t].filter(tab[2]).filter(r=>!q||JSON.stringify(Object.values(r)).toLowerCase().includes(q));
 return a.length?a.map(p.row).join(''):empty(p.icon,p.empty[0],p.empty[1],can()?`<button class="btn" onclick="openForm('${t}')">${ic('plus')} ${p.add}</button>`:'')
}
async function rm(t,id){if(!confirm('حذف هذا السجل نهائيًا (من التطبيق ومن قاعدة البيانات)؟'))return;await del(t,id);logAct('حذف من '+(P[t]?.t||t));render()}

/* Generic add/edit form */
const bRow=b=>`<div class="bt"><div class="g2"><div class="fld"><label>الكمية</label><input type="number" min="0" class="b-q" value="${esc(b.qty??0)}" oninput="bTot()"></div><div class="fld"><label>تاريخ الصلاحية</label><input type="date" class="b-e" value="${esc(b.exp||'')}"></div></div><div class="fld" style="margin-bottom:22px"><label>رقم الدفعة (اختياري)</label><input class="b-n" placeholder="B-2026-01" value="${esc(b.no||'')}"></div><button class="ib dng rm" onclick="this.parentElement.remove();bTot()">${ic('x',18)}</button></div>`;
const pRow=p=>`<div class="bt"><div class="fld"><label>اسم القطعة</label><input class="p-n" value="${esc(p.name||'')}"></div><div class="g2"><div class="fld" style="margin-bottom:22px"><label>السيريال</label><input class="p-s" value="${esc(p.serial||'')}"></div><div class="fld" style="margin-bottom:22px"><label>العدد</label><input type="number" min="0" class="p-q" value="${esc(p.qty??1)}" oninput="pTot()"></div></div><button class="ib dng rm" onclick="this.parentElement.remove();pTot()">${ic('x',18)}</button></div>`;
const pTot=()=>{$('#ptot').textContent=[...document.querySelectorAll('.p-q')].reduce((a,e)=>a+(+e.value||0),0)};
const bTot=()=>{$('#btot').textContent=[...document.querySelectorAll('.b-q')].reduce((a,e)=>a+(+e.value||0),0)};
function openForm(t,id){
 const p=P[t],r=D[t].find(x=>x.id===id)||{},df=p.def();
 const h=p.f.map(([k,l,ty,o,ph])=>{
  const v=r[k]??df[k]??(ty==='d'?today():'');
  if(ty==='b')return `<h3 style="margin:18px 0 6px">${ic('box',18)} ${l}</h3><small>قسّم الكمية على عدة دفعات بتاريخ صلاحية مختلف لكل دفعة.</small><button class="btn sm" style="margin:10px 0" onclick="$('#bts').insertAdjacentHTML('beforeend',bRow({qty:0}));bTot()">${ic('plus',16)} دفعة</button><div id="bts">${(r.batches?.length?r.batches:[{qty:0}]).map(bRow).join('')}</div><div class="tot"><span>إجمالي الكمية المحتسبة آلياً</span><span id="btot">${tot(r)}</span></div>`;
  if(ty==='p')return `<h3 style="margin:18px 0 6px">${ic('case',18)} ${l}</h3><small>اختياري — اسم القطعة والسيريال والعدد.</small><button class="btn sm" style="margin:10px 0" onclick="$('#pts').insertAdjacentHTML('beforeend',pRow({qty:1}));pTot()">${ic('plus',16)} قطعة</button><div id="pts">${(r.parts||[]).map(pRow).join('')}</div><div class="tot"><span>إجمالي عدد القطع (آلي)</span><span id="ptot">${pSum(r)}</span></div>`;
  const inp=ty==='s'?`<select id="f-${k}">${o.map(x=>`<option ${x===v?'selected':''}>${x}</option>`).join('')}</select>`:`<input id="f-${k}" type="${ty==='n'?'number':ty==='d'||ty==='e'?'date':'text'}" ${ty==='n'?'min="0"':''} ${typeof o==='string'&&o?`list="${o}"`:''} placeholder="${esc(ph||'')}" value="${esc(v)}">`;
  return `<div class="fld"><label>${l}</label>${inp}</div>`}).join('');
 sheet((id?'تعديل: ':'')+(p.add||p.t),h,`<button class="btn pri" onclick="saveForm('${t}','${id||''}')">حفظ</button><button class="btn" onclick="closeSheet()">إلغاء</button>`)
}
async function saveForm(t,id){
 const p=P[t],r={...(D[t].find(x=>x.id===id)||{})};
 for(const [k,,ty] of p.f){
  if(ty==='b')r.batches=[...document.querySelectorAll('#bts .bt')].map(e=>({qty:+e.querySelector('.b-q').value||0,exp:e.querySelector('.b-e').value,no:e.querySelector('.b-n').value}));
  else if(ty==='p')r.parts=[...document.querySelectorAll('#pts .bt')].map(e=>({name:e.querySelector('.p-n').value.trim(),serial:e.querySelector('.p-s').value.trim(),qty:+e.querySelector('.p-q').value||0})).filter(x=>x.name||x.serial||x.qty);
  else{const e=$('#f-'+k);r[k]=ty==='n'?+e.value:e.value}}
 if(!p.opt&&!String(r.name||'').trim())return alert('الاسم مطلوب');
 await save(t,r);logAct((id?'تعديل ':'إضافة ')+p.t);closeSheet();render();if(t==='items')sweepExpired();
 if(t==='deficits'&&!id&&waList().length&&confirm('تم الحفظ. إبلاغ الإدارة الآن عبر واتساب؟'))wa(`📋 طلب نقص جديد: ${r.name} (الكمية ${r.qty||'-'})`,async()=>{r.notified=true;await save(t,r);render()})
}

/* WhatsApp + alerts */
const waList=()=>D.contacts.filter(c=>c.phone);
const waGood=d=>d.length>=8&&d.length<=15&&d[0]!=='0';
let WAMSG='',WACB=null;
function waOpen(phone,m){const a=document.createElement('a');a.href=`https://wa.me/${String(phone).replace(/\D/g,'')}?text=${encodeURIComponent(m)}`;a.target='_blank';a.rel='noopener';a.style.display='none';document.body.appendChild(a);a.click();a.remove()}
function wa(m,cb){
 const l=waList();
 if(!l.length){alert('أضف رقم واتساب واحدًا على الأقل من الإعدادات أولاً');go('settings');return false}
 if(l.length===1){waOpen(l[0].phone,m);cb&&cb();return true}
 WAMSG=m;WACB=cb||null;
 sheet('اختر مَن يستلم التنبيه',l.map(c=>`<button class="opt" onclick="waTo('${c.id}')">${ic('send',16)} ${esc(c.name)} <small>${esc(c.phone)}</small></button>`).join(''));return true
}
function waTo(id){const c=D.contacts.find(x=>x.id===id);if(!c)return;waOpen(c.phone,WAMSG);closeSheet();const cb=WACB;WACB=null;cb&&cb()}
const markN=async rid=>{const r=D.expired.find(x=>x.id===rid);if(r&&!r.notified){r.notified=true;await save('expired',r)}};
function waAlert(i){const x=alerts()[i];if(!x)return;wa(x.m,x.rid?async()=>{await markN(x.rid);render()}:null)}
function waAll(){const al=alerts();if(!al.length)return;let t='🔔 تنبيهات المخزن ('+al.length+')',n=0;for(const x of al){if((t+'\n'+x.m).length>1400)break;t+='\n'+x.m;n++}if(n<al.length)t+='\n… و'+(al.length-n)+' تنبيهات أخرى';const ids=al.slice(0,n).filter(x=>x.rid).map(x=>x.rid);wa(t,ids.length?async()=>{for(const id of ids)await markN(id);render()}:null)}
async function addContact(){
 const n=$('#cn').value.trim(),p=$('#cp').value.replace(/\D/g,'');
 if(!n)return alert('اكتب اسم الشخص');
 if(!waGood(p))return alert('أدخل الرقم بالصيغة الدولية بدون + أو أصفار بادئة، مثال: 201001234567');
 if(D.contacts.some(c=>c.phone===p))return alert('الرقم مضاف بالفعل');
 await save('contacts',{name:n,phone:p});logAct('إضافة رقم واتساب '+n);render()
}
async function delContact(id){if(!confirm('حذف هذا الرقم؟'))return;await del('contacts',id);render()}
const waTest=id=>{const c=D.contacts.find(x=>x.id===id);if(c)waOpen(c.phone,'✅ رسالة اختبار من Vision Stock')};
async function notify(id){const r=D.deficits.find(x=>x.id===id);wa(`🔔 نقص في المخزن: ${r.name} — الكمية: ${r.qty||'-'} — مقدم الطلب: ${r.by||'-'}`,async()=>{r.notified=true;await save('deficits',r);logAct('إبلاغ الإدارة بنقص: '+r.name);render()})}
function alerts(){
 const a=[];
 D.items.forEach(r=>{if(low(r))a.push({k:'r',m:`⚠️ مخزون منخفض: ${r.name} (${tot(r)})`});
  live(r).forEach(b=>{const d=days(b.exp);if(d<0)a.push({k:'r',m:`⛔ دفعة منتهية: ${r.name} — ${b.exp}`});else if(d<90)a.push({k:'a',m:`⏳ صلاحية قريبة: ${r.name} — ${b.exp} (${d} يوم)`})})});
 D.deficits.filter(d=>!d.notified).forEach(d=>a.push({k:'a',m:`📋 طلب نقص جديد: ${d.name} (${d.qty||'-'})`}));
 D.expired.filter(r=>r.auto&&!r.notified).forEach(r=>a.push({k:'r',m:`⛔ نُقل تلقائياً إلى المنتهي: ${r.name} × ${r.qty} (${r.note||''})`,rid:r.id}));
 return a
}

/* Dashboard */
const waBar=()=>{const n=waList().length;return `<div class="wa ${n?'ok':''}">${ic('send',18)}<span>${n?'جهات تنبيه واتساب: '+n:'لم تُضف أرقام واتساب للإدارة'}</span><button class="btn sm" onclick="go('settings')">${n?'إدارة':'إضافة رقم'}</button></div>`};
let DS='main',DM='most',chart=null;
const dashRows=()=>[['أصناف المخزن الرئيسي',D.items.length],['إجمالي القطع',sum(D.items.map(r=>({q:tot(r)})),'q')],['أجهزة مستخدمة (قطع)',sum(D.used,'qty')],['إذونات مفتوحة',D.vouchers.filter(v=>v.status==='temp'&&!v.archived).length],['منتهي/تالف (قطع)',sum(D.expired,'qty')],['قيد الصيانة',D.maint.filter(m=>mst(m)==='قيد الصيانة').length],['الآلات',D.tools.length],['نواقص مفتوحة',D.deficits.length],...alerts().map(a=>['تنبيه',a.m])].map(([a,b])=>({'المؤشر':a,'القيمة':b}));
function demand(){const m={};D.vouchers.filter(v=>v.type!=='RCPT'&&v.status!=='void').forEach(v=>v.lines.forEach(l=>m[l.name]=(m[l.name]||0)+(+l.qty||0)));return Object.entries(m).sort((a,b)=>DM==='most'?b[1]-a[1]:a[1]-b[1]).slice(0,5)}
function dash(){
 const it=D.items,nb=it.reduce((a,r)=>a+(r.batches||[]).length,0),pcs=it.reduce((a,r)=>a+tot(r),0),al=alerts();
 const st=(l,v,s,i,c)=>`<div class="stat"><div class="top"><span>${l}</span><i class="si" style="color:${c}">${ic(i,24)}</i></div><b>${v}</b><small>${s}</small></div>`;
 const sr=(l,v,r)=>`<div class="sr"><b class="pill ${r&&v?'r':''}">${v}</b><span>${l}</span></div>`;
 const bs=it.flatMap(r=>live(r)),dsRows={main:[sr('أصناف تحت الحد الأدنى',it.filter(low).length,1),sr('دفعات تنتهي خلال 90 يوماً',bs.filter(b=>days(b.exp)>=0&&days(b.exp)<90).length),sr('دفعات منتهية',bs.filter(b=>days(b.exp)<0).length,1),sr('إجمالي القطع في المخزون',pcs),sr('إجمالي عدد الدفعات',nb)],used:[sr('إجمالي الأدوات',D.used.length),sr('القطع بالعهدة',sum(D.used,'qty')),sr('معقّمة وجاهزة',D.used.filter(r=>r.ster==='معقّمة وجاهزة').length),sr('تحتاج تعقيم',D.used.filter(r=>r.ster==='تحتاج تعقيم').length,1)],exp:[sr('إجمالي السجلات',D.expired.length),sr('منتهية الصلاحية',D.expired.filter(r=>r.reason==='منتهي الصلاحية').length),sr('تالفة',D.expired.filter(r=>r.reason==='تالف').length,1),sr('إجمالي القطع',sum(D.expired,'qty'))]};
 const dm=demand();
 return `<div id="dash">`+head('لوحة التحكم',`مرحباً ${esc(me.username)} — نظرة عامة على حركة المخزون الطبي`,exBtn('تصدير لوحة التحكم',"openExport('لوحة التحكم',dashRows,{screen:1})"))
 +`<div class="card"><h3>${ic('search')} أداة بحث عن صنف</h3><small>ابحث بكود Odoo لعرض الكميات وتفصيل الصلاحيات — متاح لجميع الأدوار</small><input style="margin-top:10px" placeholder="ابحث بكود Odoo أو اسم الصنف..." oninput="lookup(this.value)"><div id="lk"></div></div>
 <div class="stats">${st('أصناف المخزون الرئيسي',it.length,pcs+' قطعة · '+nb+' دفعة','box','var(--p)')}${st('أجهزة مستخدمة',D.used.length,sum(D.used,'qty')+' قطعة بالعهدة','steth','#d97706')}${st('إذونات مفتوحة',D.vouchers.filter(v=>v.status==='temp'&&!v.archived).length,D.vouchers.filter(v=>v.status==='final').length+' نهائية','file','var(--mut)')}${st('منتهية / تالفة',D.expired.length,sum(D.expired,'qty')+' قطعة مسحوبة','alert','var(--red)')}${st('مع مهندس الصيانة',D.maint.filter(m=>mst(m)==='قيد الصيانة').length,D.maint.reduce((a,m)=>a+Math.max(0,mTot(m)-mRet(m)),0)+' قطعة لم تُستلم','wrench','#d97706')}${st('نواقص مفتوحة',D.deficits.filter(d=>!d.notified).length,D.deficits.length+' إجمالي','bell','var(--red)')}${st('مخزن الآلات',D.tools.length,D.tools.reduce((a,t)=>a+pSum(t),0)+' قطعة بداخلها','case','var(--p)')}${st('مخزون منخفض',it.filter(low).length,'أقل من الحد الأدنى','alert','var(--red)')}</div>
 <div class="card"><h3>${ic('trend')} حركة الإذونات <span class="badge" style="margin-inline-start:auto">6 أشهر</span></h3><div style="height:200px"><canvas id="ch"></canvas></div></div>
 <div class="card"><h3>${ic('bell')} سجل التنبيهات ${bg(al.length?'red':'',al.length)}</h3>${can()?waBar():''}${al.map((x,i)=>`<div class="al ${x.k}"><span class="ad">${ic(x.k==='r'?'alert':'bell',18)}</span><span class="am">${esc(x.m)}</span>${can()?`<button class="btn sm" onclick="waAlert(${i})">${ic('send',15)} إرسال</button>`:''}</div>`).join('')||'<div class="empty sm"><small>لا توجد تنبيهات حالياً — كل شيء تحت السيطرة.</small></div>'}${can()&&al.length?`<button class="btn pri blk" style="margin-top:6px" onclick="waAll()">${ic('send',18)} إرسال الكل عبر واتساب</button>`:''}</div>
 <div class="card"><h3>${ic('box')} معدلات الطلب</h3>${seg([['most','الأكثر طلباً',''],['least','الأقل طلباً','']],DM,"DM='%';render()")}${dm.map(([n,q])=>`<div class="sr"><b class="pill">${q}</b><span>${esc(n)}</span></div>`).join('')||'<div class="empty sm"><b>لا يوجد صرف بعد</b><small>ستظهر هنا معدلات الطلب بعد إنشاء إذونات الصرف.</small></div>'}</div>
 <div class="card"><h3>${ic('file')} حالة الأصناف</h3>${seg([['main','الرئيسي',it.length],['used','المستخدم',D.used.length],['exp','المنتهي/التالف',D.expired.length]],DS,"DS='%';render()")}${dsRows[DS].join('')}</div></div>`
}
function lookup(v){
 v=v.trim().toLowerCase();const a=v?D.items.filter(r=>[r.name,r.code,r.odoo].join(' ').toLowerCase().includes(v)).slice(0,5):[];
 $('#lk').innerHTML=a.map(r=>`<div class="row" style="margin:10px 0 0"><div class="rt"><div><b>${esc(r.name)}</b><small>${esc([r.code,r.odoo].filter(Boolean).join(' · '))}</small></div>${bg(low(r)?'red':'grn',tot(r)+' '+esc(r.unit||'قطعة'))}</div>${(r.batches||[]).map(b=>`<div class="bl"><span>${b.qty}${b.no?' · '+esc(b.no):''}</span>${b.exp?expB(b):''}</div>`).join('')}</div>`).join('')||(v?'<small style="margin-top:8px">لا توجد نتائج.</small>':'')
}
function drawChart(){
 const el=$('#ch');if(!el)return;if(chart){try{chart.destroy()}catch(e){}chart=null}
 if(typeof Chart==='undefined'){el.parentElement.innerHTML='<div class="empty sm"><small>تعذّر تحميل مكتبة الرسم البياني (تحقق من الاتصال).</small></div>';return}
 const ms=[...Array(6)].map((_,i)=>{const d=new Date();d.setMonth(d.getMonth()-5+i);return d}),k=d=>d.toISOString().slice(0,7);
 const dk=document.documentElement.classList.contains('dark'),c=dk?'#8ba39d':'#6a7f79';
 chart=new Chart(el,{type:'line',data:{labels:ms.map(d=>d.toLocaleDateString('ar-EG',{month:'short'})),datasets:[{data:ms.map(d=>D.vouchers.filter(v=>(v.date||'').slice(0,7)===k(d)).length),borderColor:dk?'#2dd4bf':'#0f766e',backgroundColor:'rgba(15,118,110,.12)',fill:true,tension:.35}]},options:{maintainAspectRatio:false,animation:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:c}},y:{beginAtZero:true,ticks:{color:c,precision:0}}}}})
}

/* Vouchers */
let V=null,VF={type:'',status:''};
const VL={temp:['red','مؤقت'],final:['grn','نهائي'],void:['','ملغي']};
function vRows(){return D.vouchers.filter(v=>!v.archived).flatMap(v=>(v.lines.length?v.lines:[{}]).map(l=>({'رقم الإذن':v.no,'النوع':v.type==='RCPT'?'وارد':'صرف','رقم ورقي':v.paper||'','المندوب':v.rep||'','المستشفى':v.hospital||'','الطبيب':v.doctor||'','الكود':l.code||'','الصنف':l.name||'','الكمية':l.qty||'','الحالة':VL[v.status][1],'مرجع أودو':v.odoo||'','التاريخ':v.date})))}
function vouchers(){
 const arc=D.vouchers.filter(v=>v.archived).length,tab=F.tab||'act';
 return head('الإذونات','إذونات الصرف والوارد — بأرقام مسلسلة نظامية (DISP / RCPT)',exBtn('تصدير الإذونات',"openExport('الإذونات',vRows,{odoo:1})")+(can()?`<button class="btn pri" onclick="vNew()">${ic('plus')} إذن جديد</button>`:''))
 +seg([['act','الإذونات النشطة',D.vouchers.length-arc],['arch','الأرشيف',arc]],tab)+srch('رقم الإذن / الجهة / المستشفى...',`<button class="btn" onclick="vFilter()">${ic('filter')} فلتر</button>`)
 +(tab==='arch'&&can()?`<div class="card"><h3>${ic('archive')} أرشفة يدوية</h3><div class="fld"><label>أرشفة كل الإذونات الأقدم من</label><input type="date" id="ad"></div><button class="btn blk" onclick="archBefore()">أرشفة</button>${adm()?`<hr style="border:0;border-top:1px solid var(--bd);margin:16px 0"><h3 style="color:var(--red)">${ic('shield')} حذف نهائي بنطاق تاريخي (للمدير فقط)</h3><div class="fld"><label>حذف كل الإذونات الأقدم من</label><input type="date" id="pd"></div><button class="btn dng blk" onclick="purgeBefore()">${ic('trash',18)} حذف</button>`:''}</div>`:'')
 +`<div id="rows">${vrows()}</div>`
}
function vrows(){
 const arc=(F.tab||'act')==='arch',q=F.q.trim().toLowerCase();
 const a=D.vouchers.filter(v=>!!v.archived===arc&&(!VF.type||v.type===VF.type)&&(!VF.status||v.status===VF.status)&&(!q||JSON.stringify(Object.values(v)).toLowerCase().includes(q))).sort((x,y)=>(y.date||'').localeCompare(x.date||''));
 return a.length?a.map(vcard).join(''):empty('file',arc?'الأرشيف فارغ':'لا توجد إذونات',arc?'ستظهر هنا الإذونات المؤرشفة، مع إمكانية البحث بنطاق تاريخي.':'أنشئ إذن صرف مؤقت أو إذن وارد لتبدأ.',!arc&&can()?`<button class="btn" onclick="vNew()">${ic('plus')} إذن جديد</button>`:'')
}
function vcard(v){
 const n=v.lines.reduce((a,l)=>a+(+l.qty||0),0),[c,l]=v.rall?['','مغلق — مرتجع بالكامل']:VL[v.status],ed=can();
 return `<div class="row ${v.status==='temp'?'red':v.status==='final'?'grn':''}" style="${v.status==='void'?'opacity:.55':''}"><div class="rt"><div><b>${esc(v.no)}</b><small>${esc(v.date)}${v.paper?' · ورقي '+esc(v.paper):''}</small></div>${bg(c,l)}</div><div style="margin-top:6px">${esc([v.rep,v.hospital,v.doctor].filter(Boolean).join(' · ')||'—')}</div><div class="chips"><span class="chip">${v.lines.length} أصناف · ${n} قطعة</span>${v.returned&&v.returned.length?`<span class="chip" style="background:var(--gbg);color:var(--grn)">مرتجع للمخزن: ${v.returned.reduce((a,x)=>a+x.qty,0)}</span>`:''}${v.odoo?`<span class="chip">أودو ${esc(v.odoo)}</span>`:''}</div>
 ${ed?`<div class="acts">${v.archived?`<button class="btn sm" onclick="unarch('${v.id}')">${ic('undo',15)} استعادة</button>${adm()?`<button class="btn sm dng" onclick="purge('${v.id}')">${ic('trash',15)} حذف نهائي</button>`:''}`:`${v.status==='temp'?`<button class="btn sm pri" onclick="vFinal('${v.id}')">${ic('check',15)} إنهاء الإذن</button>`:''}${v.status!=='final'||adm()?`<button class="btn sm" onclick="vEdit('${v.id}')">تعديل</button>`:''}<button class="btn sm" onclick="odoo('${v.id}')">تصدير إلى أودو</button>${adm()&&v.status!=='void'?`<button class="btn sm" onclick="vVoid('${v.id}')">إلغاء</button>`:''}<button class="ib" onclick="arch('${v.id}')">${ic('archive',18)}</button>`}</div>`:''}</div>`
}
function vFilter(){sheet('فلتر الإذونات',`<div class="fld"><label>النوع</label><select id="vf-t"><option value="">الكل</option><option value="DISP" ${VF.type==='DISP'?'selected':''}>صرف</option><option value="RCPT" ${VF.type==='RCPT'?'selected':''}>وارد</option></select></div><div class="fld"><label>الحالة</label><select id="vf-s"><option value="">الكل</option><option value="temp" ${VF.status==='temp'?'selected':''}>مؤقت</option><option value="final" ${VF.status==='final'?'selected':''}>نهائي</option><option value="void" ${VF.status==='void'?'selected':''}>ملغي</option></select></div>`,`<button class="btn pri" onclick="VF={type:$('#vf-t').value,status:$('#vf-s').value};closeSheet();render()">تطبيق</button><button class="btn" onclick="VF={type:'',status:''};closeSheet();render()">مسح</button>`)}
/* stock movement: DISP deducts FIFO by expiry, RCPT adds; both reversible */
const bm=(b,exp,no)=>(b.exp||'')===(exp||'')&&(b.no||'')===(no||'');
const findBatch=(it,l)=>(it.batches||[]).find(b=>bm(b,l.exp,l.bno));
async function applyStock(v){
 v.ded=[];const short=[];
 for(const l of v.lines){
  const it=D.items.find(i=>i.id===l.iid)||D.items.find(i=>(l.code&&(i.code===l.code||i.odoo===l.code))||i.name===l.name);if(!it)continue;
  let need=+l.qty;it.batches=it.batches||[];
  if(v.type==='RCPT'){                                   /* incoming: add to the batch with this expiry (create if new) */
   const ex=l.exp||'',no=l.bno||'';let b=it.batches.find(x=>bm(x,ex,no));if(!b){b={exp:ex,qty:0,no};it.batches.push(b)}
   b.qty=(+b.qty||0)+need;v.ded.push({id:it.id,exp:ex,no,qty:-need})}
  else if('exp' in l){                                   /* outgoing from the batch the user picked */
   const b=findBatch(it,l),t=b?Math.min(+b.qty||0,need):0;
   if(t){b.qty-=t;v.ded.push({id:it.id,exp:b.exp||'',no:b.no||'',qty:t})}
   if(need-t>0)short.push(`${it.name} (${l.exp||'بدون صلاحية'}): ناقص ${need-t}`)}
  else{                                                  /* no batch chosen: oldest expiry first */
   for(const b of [...it.batches].sort((a,b)=>(a.exp||'9999').localeCompare(b.exp||'9999'))){if(need<=0)break;const t=Math.min(+b.qty||0,need);if(!t)continue;b.qty-=t;need-=t;v.ded.push({id:it.id,exp:b.exp||'',no:b.no||'',qty:t})}
   if(need>0)short.push(`${it.name}: ناقص ${need}`)}
  await save('items',it)}
 v.deducted=true;return short}
async function restoreStock(v){
 for(const d of v.ded||[]){const it=D.items.find(i=>i.id===d.id);if(!it)continue;it.batches=it.batches||[];const b=it.batches.find(x=>bm(x,d.exp,d.no));b?b.qty=(+b.qty||0)+d.qty:it.batches.push({exp:d.exp,no:d.no||'',qty:d.qty});await save('items',it)}
 v.ded=[];v.deducted=false}
function vFinal(id){
 const v=D.vouchers.find(x=>x.id===id);
 sheet('إنهاء الإذن '+esc(v.no),`<p class="hint">اكتب لكل صنف الكمية <b>المرتجعة سليمة</b> من المندوب. المفتوح (المستخدم) = المصروف − المرتجع، وهو فقط ما يُخصم من المخزون ويُرفع على أودو. المرتجع يبقى في المخزن.</p>${v.lines.map((l,i)=>`<div class="ln"><div><b>${esc(l.name)}</b><small>صُرف ${l.qty}${l.exp?' · صلاحية '+esc(l.exp):''}</small></div><div class="qty"><small>مرتجع</small><input class="qin fr" type="number" min="0" max="${l.qty}" value="0" data-i="${i}" oninput="vfCalc('${id}')"></div><b id="fu${i}" style="min-width:28px;text-align:center">${l.qty}</b></div>`).join('')}<div class="tot" style="margin-top:10px"><span>إجمالي المفتوح (المستخدم)</span><span id="ftot">${v.lines.reduce((a,l)=>a+(+l.qty||0),0)}</span></div><div class="fld" style="margin-top:12px"><label>رقم الإذن الورقي النهائي (اختياري)</label><input id="fp" value="${esc(v.paper||'')}"></div>`,`<button class="btn pri" onclick="vFinalSave('${id}')">إنهاء الإذن</button><button class="btn" onclick="closeSheet()">إلغاء</button>`)
}
function vfCalc(id){const v=D.vouchers.find(x=>x.id===id);let t=0;document.querySelectorAll('.fr').forEach(e=>{const i=+e.dataset.i,q=+v.lines[i].qty,r=Math.min(Math.max(parseInt(e.value)||0,0),q);$('#fu'+i).textContent=q-r;t+=q-r});$('#ftot').textContent=t}
async function vFinalSave(id){
 const v=D.vouchers.find(x=>x.id===id),ret=[...document.querySelectorAll('.fr')].map(e=>Math.min(Math.max(parseInt(e.value)||0,0),+v.lines[+e.dataset.i].qty));
 const used=v.lines.map((l,i)=>({...l,sent:+l.qty,qty:+l.qty-ret[i]})),back=v.lines.map((l,i)=>({name:l.name,code:l.code,qty:ret[i]})).filter(x=>x.qty>0);
 v.paper=$('#fp').value.trim();v.returned=back;
 if(!used.some(l=>l.qty>0)){
  if(!confirm('كل الأصناف مرتجعة — سيُلغى الإذن المؤقت ولن يُخصم شيء. متابعة؟'))return;
  v.status='void';v.rall=true;v.note=(v.note?v.note+' — ':'')+'مرتجع بالكامل';await save('vouchers',v);logAct('إلغاء إذن مرتجع بالكامل '+v.no);closeSheet();return render()}
 v.lines=used.filter(l=>l.qty>0);v.status='final';
 const sh=await applyStock(v);await save('vouchers',v);logAct('إنهاء إذن '+v.no);closeSheet();render();
 if(sh.length)alert('تم الخصم من المتاح فقط. نقص في:\n'+sh.join('\n'))
}
async function vVoid(id){const v=D.vouchers.find(x=>x.id===id);if(v.deducted)await restoreStock(v);v.status='void';await save('vouchers',v);logAct('إلغاء إذن '+v.no);render()}
async function arch(id){if(!confirm('نقل الإذن إلى الأرشيف؟'))return;const v=D.vouchers.find(x=>x.id===id);v.archived=true;await save('vouchers',v);logAct('أرشفة '+v.no);render()}
async function unarch(id){const v=D.vouchers.find(x=>x.id===id);delete v.archived;await save('vouchers',v);render()}
async function purge(id){if(!confirm('حذف نهائي من قاعدة البيانات؟ لا يمكن التراجع.'))return;await del('vouchers',id);logAct('حذف نهائي لإذن');render()}
async function archBefore(){const d=$('#ad').value;if(!d)return alert('اختر التاريخ');const a=D.vouchers.filter(v=>!v.archived&&v.date<d);if(!a.length||!confirm(`أرشفة ${a.length} إذن؟`))return;for(const v of a){v.archived=true;await save('vouchers',v)}logAct('أرشفة يدوية قبل '+d);render()}
async function purgeBefore(){const d=$('#pd').value;if(!d)return alert('اختر التاريخ');const a=D.vouchers.filter(v=>v.date<d);if(!a.length||!confirm(`حذف ${a.length} إذن نهائيًا من قاعدة البيانات؟`))return;for(const v of a)await del('vouchers',v.id);logAct('حذف نهائي قبل '+d);render()}
/* Voucher form page */
function vNew(){V={type:'DISP',status:'temp',date:today(),paper:'',rep:'',hospital:'',doctor:'',ptype:'مندوب',note:'',lines:[]};go('vform')}
function vEdit(id){const v=D.vouchers.find(x=>x.id===id);if(v.status==='final'&&!adm())return alert('تعديل الإذن النهائي للمالك فقط');V=structuredClone(v);go('vform')}
const vlines=()=>V.lines.length?V.lines.map((l,i)=>{const it=l.iid&&D.items.find(x=>x.id===l.iid),spec=it&&('exp' in l)&&V.type!=='RCPT',av=spec?(findBatch(it,l)?+findBatch(it,l).qty:0):(it?tot(it):null);return `<div class="ln"><div><b>${esc(l.name)}</b><small>${esc(l.code||'')}${spec?` · ${l.exp?'صلاحية '+esc(l.exp):'بدون صلاحية'}${l.bno?' · '+esc(l.bno):''}`:''}${av!==null&&V.type!=='RCPT'?` · المتاح <span style="color:${l.qty>av?'var(--red)':'inherit'}">${av}</span>`:''}</small>${V.type==='RCPT'?`<input type="date" title="تاريخ الصلاحية" value="${esc(l.exp||'')}" onchange="V.lines[${i}].exp=this.value" style="margin-top:6px">`:''}</div><div class="qty"><button onclick="vq(${i},-1)">−</button><input class="qin" type="number" min="1" value="${l.qty}" onchange="vSet(${i},this.value)"><button onclick="vq(${i},1)">+</button></div><button class="ib dng" onclick="V.lines.splice(${i},1);vp()">${ic('x',18)}</button></div>`}).join(''):`<div class="empty sm"><div class="ei">${ic('plus',24)}</div><b>لم تُضف أصنافاً بعد</b><small>اكتب حروفاً من اسم الصنف في الخانة أعلاه واختر الدفعة (تاريخ الصلاحية) من المخزن الرئيسي.</small></div>`;const vsum=()=>`<div class="kv"><span>نوع الإذن</span><b>${V.type==='RCPT'?'وارد':'صرف'}</b></div><div class="kv"><span>الإصدار</span><b>${V.status==='final'?'نهائي':'مؤقت'}</b></div><div class="kv"><span>المستلم</span><b>${esc(V.rep)||'–'}</b></div><div class="kv"><span>المستشفى</span><b>${esc(V.hospital)||'–'}</b></div><div class="kv"><span>عدد الأصناف</span><b>${V.lines.length}</b></div><div class="kv"><span>إجمالي القطع</span><b>${V.lines.reduce((a,l)=>a+(+l.qty||0),0)}</b></div>${V.id&&V.deducted?'<div class="warn">تعديل إذن نهائي: يُعكس الخصم القديم ثم تُخصم الكميات الجديدة من المخزون.</div>':V.status==='final'?'<div class="warn" style="background:var(--gbg);color:var(--grn)">إذن نهائي (أخضر): يُحدَّث المخزون عند الحفظ.</div>':'<div class="warn">إذن مؤقت (أحمر): لا يُخصم من المخزون الآن. عند رجوع المندوب اضغط «إنهاء الإذن» وسجّل المرتجع، فيُخصم المفتوح فقط.</div>'}<button class="btn pri blk" onclick="vSave()">حفظ الإذن</button><button class="btn blk" style="border:0;margin-top:6px" onclick="history.back()">إلغاء</button>`;
const vp=()=>{$('#vl').innerHTML=vlines();$('#vs').innerHTML=vsum();$('#vc').textContent=V.lines.length};
const vq=(i,d)=>{V.lines[i].qty=Math.max(1,(+V.lines[i].qty||1)+d);vp()};
const vSet=(i,v)=>{V.lines[i].qty=Math.max(1,parseInt(v)||1);vp()};
function vform(){
 if(!V)return vNew(),'';
 const f=(k,l,ph,dl,h)=>`<div class="fld"><label>${l}</label><input ${dl?`list="${dl}"`:''} placeholder="${ph}" value="${esc(V[k])}" oninput="V.${k}=this.value;vp()">${h?`<div class="hint">${h}</div>`:''}</div>`;
 return `<button class="back" onclick="history.back()">${ic('arrow')} رجوع</button><h1>${V.id?'تعديل '+esc(V.no):'إذن جديد'}</h1><p class="sub">سيُولَّد رقم مسلسل نظامي تلقائياً عند الحفظ (DISP / RCPT)</p>
 <div class="card"><div class="fld"><label>نوع الإذن</label><select onchange="V.type=this.value;vp()"><option value="DISP" ${V.type==='DISP'?'selected':''}>إذن صرف</option><option value="RCPT" ${V.type==='RCPT'?'selected':''}>إذن وارد</option></select></div>
 <div class="fld"><label>طريقة الإصدار</label><select onchange="V.status=this.value;vp()"><option value="temp" ${V.status==='temp'?'selected':''}>مؤقت (يمكن التعديل لاحقاً)</option><option value="final" ${V.status==='final'?'selected':''}>نهائي</option></select></div>
 <div class="fld"><label>التاريخ</label><input type="date" value="${V.date}" oninput="V.date=this.value"></div>${f('paper','رقم الإذن الورقي (اختياري)','مثال: 1042','','غير إلزامي — إن وُجد إذن ورقي')}
 ${f('rep','1) المستلم / المندوب','اكتب للبحث أو اسم جديد...','dl-rep','اختر من قائمة المندوبين أو اكتب اسماً جديداً — غير إلزامي')}${f('hospital','2) المستشفى / الجهة','اكتب للبحث أو اسم جديد...','dl-hosp','من سجل المستشفيات أو إدخال حر')}${f('doctor','3) الطبيب','اسم الطبيب','dl-doc')}
 <div class="fld"><label>نوع الجهة</label><select onchange="V.ptype=this.value">${['مندوب','طبيب','إدارة','مستشفى'].map(x=>`<option ${V.ptype===x?'selected':''}>${x}</option>`).join('')}</select></div>
 <h3 style="margin:8px 0">الأصناف (<span id="vc">${V.lines.length}</span>)</h3>
 <div class="fld"><label>أضف من المخزن الرئيسي — اكتب حروفاً من اسم الصنف</label><input id="v-q" placeholder="مثال: فايبر" autocomplete="off" oninput="sgShow('v')" onfocus="sgShow('v')" onkeydown="if(event.key==='Enter'){event.preventDefault();sgEnter('v')}"><div id="v-r" class="sg"></div></div>
 <div id="vl">${vlines()}</div>
 <div class="fld" style="margin-top:14px"><label>ملاحظات</label><textarea rows="3" placeholder="ملاحظات على الإذن..." oninput="V.note=this.value">${esc(V.note)}</textarea></div></div><div class="card" id="vs">${vsum()}</div>`
}
function vAdd(l){const e=V.lines.find(x=>l.iid?(x.iid===l.iid&&(x.exp||'')===(l.exp||'')&&(x.bno||'')===(l.bno||'')):x.name===l.name);e?e.qty++:V.lines.push({...l,qty:1});vp()}
/* live search box shared by vouchers (main stock) and maintenance (tools store) */
function sgList(kind,q){
 q=q.trim().toLowerCase();
 if(kind==='v'){
  const out=[];
  D.items.forEach(r=>{
   const hay=[r.name,r.code,r.odoo,...(r.batches||[]).map(b=>b.no)].join(' ').toLowerCase();if(q&&!hay.includes(q))return;
   const bs=V.type==='RCPT'?[]:(r.batches||[]).map((b,i)=>({b,i})).filter(x=>+x.b.qty>0);
   if(!bs.length)out.push({id:r.id,t:r.name,s:(r.code||r.odoo||'')+(V.type==='RCPT'?'':' · لا توجد كمية'),b:V.type==='RCPT'?tot(r):0,c:V.type==='RCPT'?'grn':'red'});
   bs.forEach(({b,i})=>out.push({id:r.id+'#'+i,t:r.name,s:(r.code||r.odoo||'')+' · '+(b.exp?'صلاحية '+b.exp:'بدون صلاحية')+(b.no?' · '+b.no:''),b:b.qty,c:b.exp&&days(b.exp)<0?'red':b.exp&&days(b.exp)<90?'amb':'grn'}))});
  return out.slice(0,12)}
 const out=[];
 D.tools.forEach(t=>{const nm=t.name||'(بدون اسم)';
  if(!q||[nm,t.serial].join(' ').toLowerCase().includes(q))out.push({id:t.id,t:nm,s:t.serial?'S/N '+t.serial:'جهاز / علبة',b:'',c:''});
  (t.parts||[]).forEach((p,i)=>{if(q&&[p.name,p.serial,nm].join(' ').toLowerCase().includes(q))out.push({id:t.id+'#'+i,t:p.name||'—',s:'من: '+nm+(p.serial?' · S/N '+p.serial:''),b:p.qty||'',c:''})})});
 return out.slice(0,10)
}
function sgShow(kind){
 const q=$('#'+kind+'-q').value,box=$('#'+kind+'-r'),l=sgList(kind,q);
 const unreg=q.trim()&&!l.some(x=>x.t.toLowerCase()===q.trim().toLowerCase())?`<button type="button" class="sgi" onclick="sgPick('${kind}','')">${ic('plus',16)} إضافة «${esc(q.trim())}» كصنف غير مسجّل</button>`:'';
 box.innerHTML=l.map(x=>`<button type="button" class="sgi" onclick="sgPick('${kind}','${esc(x.id)}')"><span>${esc(x.t)}<small>${esc(x.s)}</small></span>${x.b!==''?bg(x.c,x.b):''}</button>`).join('')+unreg;
 box.classList.toggle('on',!!box.innerHTML)
}
const sgEnter=kind=>{const q=$('#'+kind+'-q').value,l=sgList(kind,q);if(l.length)sgPick(kind,l[0].id);else if(q.trim())sgPick(kind,'')};
function sgPick(kind,id){
 const q=$('#'+kind+'-q').value.trim();
 if(kind==='v'){const [iid,bi]=String(id).split('#'),it=D.items.find(x=>x.id===iid),b=it&&bi!==undefined?(it.batches||[])[+bi]:null;vAdd(it?(b?{iid:it.id,code:it.code||it.odoo||'',name:it.name,exp:b.exp||'',bno:b.no||''}:{iid:it.id,code:it.code||it.odoo||'',name:it.name}):{code:'',name:q})}
 else{
  const [tid,pi]=String(id).split('#'),t=D.tools.find(x=>x.id===tid);let l={name:q,serial:'',qty:1,ret:0,retDate:''};
  if(t){const p=pi!==undefined?(t.parts||[])[+pi]:null;l={iid:t.id,name:p?p.name||'':t.name||'',serial:p?p.serial||'':t.serial||'',qty:1,ret:0,retDate:''}}
  M.lines.push(l);mp()}
 $('#'+kind+'-q').value='';$('#'+kind+'-r').classList.remove('on');$('#'+kind+'-q').focus()
}
async function vSave(){
 const old=D.vouchers.find(x=>x.id===V.id);
 if(!V.lines.length)return alert('أضف صنفاً واحداً على الأقل');
 if(!V.no){const pf=V.type==='RCPT'?'RCPT':'DISP',n=D.vouchers.filter(v=>v.type===V.type||(!v.type&&pf==='DISP')).reduce((m,v)=>Math.max(m,+(v.no||'').replace(/\D/g,'')||0),0)+1;V.no=pf+'-'+String(n).padStart(3,'0')}
 if(old?.deducted){await restoreStock(old);V.ded=[];V.deducted=false}
 let s=[];if(V.status==='final')s=await applyStock(V);
 await save('vouchers',V);logAct('حفظ إذن '+V.no);V=null;
 if(location.hash==='#/vouchers')render();else go('vouchers');
 if(s.length)alert('تم الخصم من المتاح فقط. نقص في:\n'+s.join('\n'))
}

/* Settings + users */
const MX=[['لوحة التحكم وبحث معلومات الأصناف','✓','✓','✓'],['المخزون الرئيسي ومخزن الآلات — إضافة / تعديل / حذف','✓','✓','عرض'],['المخزون المستخدم — إضافة / تعديل / حذف','✓','✓','عرض'],['المنتهي / التالف — إضافة / تعديل / حذف','✓','✓','عرض'],['الصيانة (إذن بعدة أصناف) والنواقص','✓','✓','عرض'],['البيانات الأساسية (المندوبون والمستشفيات)','✓','✓','—'],['الإذونات — إنشاء وتعديل وإنهاء (تعديل النهائي للمالك فقط)','✓','✓','عرض'],['إلغاء الإذونات (Void)','✓','—','—'],['تصدير إلى Odoo وربط المرجع','✓','✓','—'],['التصدير PDF / Excel / Word مع فلتر التاريخ','✓','✓','✓'],['إضافة مستخدمين جدد','✓','✓','—'],['إدارة الأدوار وحذف المستخدمين','✓','—','—'],['الحذف النهائي بنطاق تاريخي من قاعدة البيانات','✓','—','—']];
function settings(){
 return head('الإعدادات','المستخدمون، الأدوار، والأرشيف')+`<div class="card"><h3>${ic('users')} المستخدمون</h3><div class="row"><small>الحساب الحالي</small><b>${esc(me.username)}</b><div class="chips"><span class="chip">${ROLE[me.role]}</span></div></div>${can()?`<button class="btn pri blk" onclick="uForm()">${ic('plus',18)} إضافة مستخدم جديد</button><button class="btn blk" style="margin-top:10px" onclick="team()">${ic('shield',18)} إدارة المستخدمين والأدوار</button>`:''}${can()?`<hr style="border:0;border-top:1px solid var(--bd);margin:16px 0"><h3>${ic('archive')} الأرشيف</h3><small style="margin-bottom:10px">انقل الإذونات القديمة إلى الأرشيف مع إمكانية البحث بنطاق تاريخي.</small><button class="btn blk" onclick="F.tab='arch';go('vouchers')">الانتقال إلى الأرشيف</button>`:''}</div>
 ${can()?`<div class="card"><h3>${ic('bell')} أرقام واتساب الإدارة</h3>${D.contacts.map(c=>`<div class="sr"><button class="ib dng" onclick="delContact('${c.id}')">${ic('trash',18)}</button><span style="flex:1;margin-inline-start:8px">${esc(c.name)}<small>${esc(c.phone)}</small></span><button class="btn sm" onclick="waTest('${c.id}')">اختبار</button></div>`).join('')||'<small>لا توجد أرقام بعد.</small>'}<div class="g2" style="margin-top:12px"><div class="fld"><label>الاسم</label><input id="cn" placeholder="مدير المخزن"></div><div class="fld"><label>الرقم (دولي)</label><input id="cp" inputmode="tel" placeholder="201001234567"></div></div><button class="btn pri blk" onclick="addContact()">${ic('plus',18)} إضافة رقم</button><small style="margin-top:8px">عند وجود أكثر من رقم تظهر قائمة لاختيار المستلم عند كل إرسال.</small></div>`:''}
 ${adm()?`<div class="card"><h3>${ic('shield')} بيانات حساب المالك</h3><div class="fld"><label>البريد الإلكتروني / اسم المستخدم</label><input id="ou" value="${esc(me.username)}" autocapitalize="none" autocomplete="username"></div><div class="fld"><label>كلمة المرور الحالية (مطلوبة)</label><input id="oc" type="password" autocomplete="current-password"></div><div class="fld"><label>كلمة مرور جديدة (اتركها فارغة بدون تغيير)</label><input id="on" type="password" autocomplete="new-password"></div><div class="fld"><label>تأكيد كلمة المرور الجديدة</label><input id="on2" type="password" autocomplete="new-password"></div><button class="btn pri blk" onclick="saveOwner()">حفظ التعديلات</button></div>`:''}
 ${matchMedia('(display-mode: standalone)').matches?'':`<div class="card"><h3>${ic('dl')} تثبيت على الشاشة الرئيسية</h3>${DEFERRED?`<button class="btn pri blk" onclick="installApp()">تثبيت Vision Stock</button>`:'<small>من قائمة كروم ⋮ اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية». (آيفون: زر المشاركة ثم «إضافة إلى الشاشة الرئيسية»)</small>'}</div>`}
 <div class="card"><h3>${ic('shield')} مصفوفة الصلاحيات</h3><div style="overflow-x:auto"><table class="mx"><tr><th>الصلاحية</th><th>مدير</th><th>أمين</th><th>مشاهد</th></tr>${MX.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</table></div></div>
 ${adm()?`<div class="card"><h3>سجل الأنشطة</h3>${[...D.log].sort((a,b)=>b.ts.localeCompare(a.ts)).slice(0,30).map(l=>`<div class="sr"><button class="ib dng" onclick="del('log','${l.id}').then(render)">${ic('x',16)}</button><span style="flex:1;margin-inline-start:8px">${esc(l.action)}<small>${esc(l.user)} · ${new Date(l.ts).toLocaleString('ar-EG')}</small></span></div>`).join('')||'<small>لا توجد أنشطة.</small>'}<button class="btn dng blk" style="margin-top:12px" onclick="if(confirm('حذف السجل نهائيًا من قاعدة البيانات؟'))Promise.all(D.log.map(l=>del('log',l.id))).then(render)">تفريغ السجل نهائيًا</button></div>`:''}`
}
async function team(){
 await loadUsers();
 sheet('الفريق',D.users.map(u=>`<div class="row"><div class="rt"><div><b>${esc(u.name||u.username)}</b><small>@${esc(u.username)}</small></div>${adm()&&u.id!==me.id?`<button class="ib dng" onclick="uDel('${u.id}')">${ic('trash',18)}</button>`:''}</div><div style="margin-top:8px">${adm()&&u.id!==me.id?`<select onchange="setRole('${u.id}',this.value)">${Object.entries(ROLE).map(([k,v])=>`<option value="${k}" ${u.role===k?'selected':''}>${v}</option>`).join('')}</select>`:bg(u.role==='admin'?'amb':'',ROLE[u.role])}</div></div>`).join(''),can()?`<button class="btn pri" onclick="uForm()">${ic('plus',18)} إضافة مستخدم</button>`:'')
}
function uForm(){sheet('إضافة مستخدم جديد',`<div class="fld"><label>الاسم الكامل</label><input id="un" placeholder="مثال: سارة العتيبي"></div><div class="fld"><label>اسم المستخدم</label><input id="uu" placeholder="sara" autocapitalize="none"><div class="hint">3–30 حرفاً، أحرف إنجليزية وأرقام و _ فقط</div></div><div class="fld"><label>كلمة المرور</label><input id="up" type="password" autocomplete="new-password"><div class="hint">اتركها فارغة ليُولَّد كلمة مرور مؤقتة تلقائياً</div></div><div class="fld"><label>الدور</label><select id="ur">${Object.entries(ROLE).filter(([k])=>adm()||k!=='admin').map(([k,v])=>`<option value="${k}" ${k==='keeper'?'selected':''}>${v}</option>`).join('')}</select></div>`,`<button class="btn pri" onclick="uSave()">إنشاء الحساب</button><button class="btn" onclick="closeSheet()">إلغاء</button>`)}
async function uSave(){
 const u=$('#uu').value.trim(),role=$('#ur').value;let p=$('#up').value,gen='';
 if(!can())return;
 if(!/^[A-Za-z0-9_]{3,30}$/.test(u))return alert('اسم المستخدم غير صالح');
 if(role==='admin'&&!adm())return;
 if(!p){p=[...crypto.getRandomValues(new Uint8Array(10))].map(x=>'abcdefghjkmnpqrstuvwxyz23456789'[x%31]).join('');gen='\nكلمة المرور المؤقتة: '+p}else if(p.length<8)return alert('كلمة المرور 8 أحرف على الأقل');
 try{await createUser(u,$('#un').value.trim(),p,role)}catch(e){return alert(authMsg(e))}
 logAct('إضافة مستخدم '+u);closeSheet();render();alert('تم إنشاء الحساب.'+gen)
}
async function setRole(id,role){
 if(!adm())return;const {error}=await sb.from('profiles').update({role}).eq('id',id);
 if(error){alert(authMsg(error));return team()}
 const u=D.users.find(x=>x.id===id);if(u){u.role=role;persist('users');logAct('تغيير دور '+u.username)}
}
async function uDel(id){
 if(!adm()||id===me.id||!confirm('حذف صلاحيات المستخدم؟ (يمكن حذف حسابه نهائياً من Supabase > Authentication)'))return;
 const {error}=await sb.from('profiles').delete().eq('id',id);if(error)return alert(authMsg(error));
 D.users=D.users.filter(x=>x.id!==id);persist('users');logAct('حذف مستخدم');team()
}
async function saveOwner(){
 if(!adm())return;
 const nu=$('#ou').value.trim(),np=$('#on').value;
 if(!isEmail(nu)&&!/^[A-Za-z0-9_]{3,30}$/.test(nu))return alert('أدخل بريدًا إلكترونيًا صحيحًا أو اسم مستخدم (3–30 حرفًا إنجليزيًا/أرقام/_)');
 if(np){if(np.length<8)return alert('كلمة المرور الجديدة 8 أحرف على الأقل');if(np!==$('#on2').value)return alert('تأكيد كلمة المرور غير مطابق')}
 const v=await sb.auth.signInWithPassword({email:loginEmail(me.username),password:$('#oc').value});
 if(v.error)return alert('كلمة المرور الحالية غير صحيحة');
 try{
  if(np){const r=await sb.auth.updateUser({password:np});if(r.error)throw r.error}
  if(loginEmail(nu)!==loginEmail(me.username)){
   if(D.users.some(x=>x.id!==me.id&&x.username.toLowerCase()===nu.toLowerCase()))return alert('اسم المستخدم مستخدم بالفعل');
   const r=await sb.auth.updateUser({email:loginEmail(nu)});if(r.error)throw r.error}
  const r=await sb.from('profiles').update({username:nu}).eq('id',me.id);if(r.error)throw r.error;
 }catch(e){return alert(authMsg(e))}
 me={...me,username:nu};localStorage.mi_profile=JSON.stringify(me);await loadUsers();logAct('تعديل بيانات حساب المالك');alert('تم الحفظ');render()
}


/* ===== Maintenance: one voucher per engineer, many items; red until everything is received, then green ===== */
let M=null;
const mRows=()=>D.maint.flatMap(r=>mLines(r).map(l=>({'رقم الإذن':r.no||'','المهندس':r.engineer||'','الصنف':l.name||'','السيريال':l.serial||'','الكمية':l.qty||0,'المستلم':Math.min(+l.ret||0,+l.qty||0),'التاريخ':r.date||'','تاريخ الاستلام':l.retDate||'','الحالة':mst(r)})));
function maintPage(){
 const c=f=>D.maint.filter(f).length;
 return head('الصيانة','إذن الصيانة يظل مفتوحاً (أحمر) حتى يستلم كل ما مع المهندس، ثم يتحول أخضر تلقائياً',exBtn('تصدير',"openExport('الصيانة',mRows)")+(can()?`<button class="btn pri" onclick="mNew()">${ic('plus')} إذن صيانة</button>`:''))
 +srch('بحث بالمهندس أو الصنف أو السيريال...')+seg([['all','الكل',D.maint.length],['u','مفتوح',c(r=>mst(r)==='قيد الصيانة')],['r','تم الاستلام',c(r=>mst(r)==='تم الاستلام')]],F.tab)+`<div id="rows">${mrows()}</div>`
}
function mrows(){
 const q=F.q.trim().toLowerCase(),tab=F.tab||'all';
 const a=D.maint.filter(r=>tab==='all'||(tab==='u'?mst(r)==='قيد الصيانة':mst(r)==='تم الاستلام')).filter(r=>!q||JSON.stringify([r.engineer,r.no,r.note,mLines(r)]).toLowerCase().includes(q)).sort((x,y)=>(y.date||'').localeCompare(x.date||''));
 return a.length?a.map(mcard).join(''):empty('wrench','لا توجد إذونات صيانة','سجّل ما أخذه مهندس الصيانة لمتابعة استلامه.',can()?`<button class="btn" onclick="mNew()">${ic('plus')} إذن صيانة</button>`:'')
}
function mcard(r){
 const st=mst(r),open=st==='قيد الصيانة',T=mTot(r),G=mRet(r);
 return `<div class="row ${open?'red':st==='خردة'?'':'grn'}"><div class="rt"><div><b>${esc(r.no||'')} · ${esc(r.engineer||'بدون مهندس')}</b><small>${esc(r.date||'')}</small></div>${bg(open?'red':st==='خردة'?'':'grn',open?'🔒 مفتوح — مع المهندس':st==='خردة'?'خردة':'✅ تم الاستلام بالكامل')}</div>
 <div class="chips"><span class="chip">أُخذ ${T} قطعة</span><span class="chip">رجع ${G}</span><span class="chip">المتبقي ${Math.max(0,T-G)}</span></div>
 ${mLines(r).map(l=>`<div class="bl"><span>${esc(l.name||'—')}${l.serial?' · S/N '+esc(l.serial):''}</span><span>${Math.min(+l.ret||0,+l.qty||0)}/${+l.qty||0}${l.retDate?' · '+esc(l.retDate):''}</span></div>`).join('')}${r.note?`<small style="margin-top:8px">${esc(r.note)}</small>`:''}
 ${can()?`<div class="acts">${open?`<button class="btn sm pri" onclick="mRecv('${r.id}')">${ic('check',15)} تسجيل استلام</button>`:''}<button class="btn sm" onclick="mEdit('${r.id}')">تعديل</button><button class="ib dng" onclick="rm('maint','${r.id}')">${ic('trash',18)}</button></div>`:''}</div>`
}
function mNew(){M={engineer:'',date:today(),note:'',lines:[]};go('mform')}
function mEdit(id){const r=D.maint.find(x=>x.id===id);M=structuredClone(r);M.lines=structuredClone(mLines(r));go('mform')}
const mlines=()=>M.lines.length?M.lines.map((l,i)=>`<div class="bt"><div class="fld"><label>الصنف / النوع (مثال: عدسة 30 درجة)</label><input value="${esc(l.name)}" oninput="M.lines[${i}].name=this.value;mp(1)"></div><div class="g2"><div class="fld"><label>السيريال</label><input value="${esc(l.serial)}" oninput="M.lines[${i}].serial=this.value"></div><div class="fld"><label>العدد</label><input type="number" min="0" value="${+l.qty||0}" oninput="mSet(${i},'qty',this.value)"></div></div><div class="g2"><div class="fld" style="margin-bottom:22px"><label>رجع منه (عدد)</label><input type="number" min="0" value="${+l.ret||0}" oninput="mSet(${i},'ret',this.value)"></div><div class="fld" style="margin-bottom:22px"><label>تاريخ الاستلام</label><input type="date" value="${esc(l.retDate||'')}" oninput="M.lines[${i}].retDate=this.value"></div></div><button class="ib dng rm" onclick="M.lines.splice(${i},1);mp()">${ic('x',18)}</button></div>`).join(''):`<div class="empty sm"><div class="ei">${ic('wrench',24)}</div><b>لم تُضف أصنافاً بعد</b><small>اكتب حروفاً من اسم الآلة أو العلبة في الخانة أعلاه، أو أضف سطراً يدوياً.</small></div>`;
const mSet=(i,k,v)=>{M.lines[i][k]=Math.max(0,parseInt(v)||0);mp(1)};
const msum=()=>{const T=M.lines.reduce((a,l)=>a+(+l.qty||0),0),G=M.lines.reduce((a,l)=>a+Math.min(+l.ret||0,+l.qty||0),0),done=T>0&&G>=T;return `<div class="kv"><span>المهندس</span><b>${esc(M.engineer)||'–'}</b></div><div class="kv"><span>عدد الأصناف</span><b>${M.lines.length}</b></div><div class="kv"><span>إجمالي القطع مع المهندس</span><b>${T}</b></div><div class="kv"><span>القطع المستلمة</span><b>${G}</b></div><div class="kv"><span>المتبقي</span><b>${Math.max(0,T-G)}</b></div>${done?'<div class="warn" style="background:var(--gbg);color:var(--grn)">كل القطع مستلمة — سيتحول الإذن للأخضر.</div>':'<div class="warn">الإذن مفتوح (أحمر) حتى تُستلم كل القطع التي مع المهندس.</div>'}<button class="btn pri blk" onclick="mSave()">حفظ الإذن</button><button class="btn blk" style="border:0;margin-top:6px" onclick="history.back()">إلغاء</button>`};
const mp=all=>{if(all!==1)$('#ml').innerHTML=mlines();$('#ms').innerHTML=msum();$('#mc').textContent=M.lines.length};
function mform(){
 if(!M)return mNew(),'';
 return `<button class="back" onclick="history.back()">${ic('arrow')} رجوع</button><h1>${M.id?'تعديل '+esc(M.no||''):'إذن صيانة جديد'}</h1><p class="sub">كل الحقول اختيارية — يمكنك الحفظ والتعديل في أي وقت</p>
 <div class="card"><div class="fld"><label>اسم مهندس الصيانة</label><input list="dl-eng" value="${esc(M.engineer)}" oninput="M.engineer=this.value;mp(1)"></div><div class="fld"><label>تاريخ إرسال الأصناف للمهندس</label><input type="date" value="${esc(M.date)}" oninput="M.date=this.value"></div>
 <h3 style="margin:8px 0">الأصناف مع المهندس (<span id="mc">${M.lines.length}</span>)</h3>
 <div class="fld"><label>أضف من مخزن الآلات — اكتب حروفاً من الاسم</label><input id="m-q" placeholder="مثال: عدسة" autocomplete="off" oninput="sgShow('m')" onfocus="sgShow('m')" onkeydown="if(event.key==='Enter'){event.preventDefault();sgEnter('m')}"><div id="m-r" class="sg"></div></div>
 <div id="ml">${mlines()}</div><button class="btn sm" style="margin-top:6px" onclick="M.lines.push({name:'',serial:'',qty:1,ret:0,retDate:''});mp()">${ic('plus',16)} سطر يدوي</button>
 <div class="fld" style="margin-top:14px"><label>ملاحظات</label><textarea rows="3" oninput="M.note=this.value">${esc(M.note||'')}</textarea></div></div><div class="card" id="ms">${msum()}</div>`
}
async function mSave(){
 const r={...M};
 r.lines=M.lines.map(l=>{const q=Math.max(0,parseInt(l.qty)||0),g=Math.min(Math.max(0,parseInt(l.ret)||0),q);return {...l,qty:q,ret:g,retDate:g>0?(l.retDate||today()):''}});
 delete r.name;delete r.serial;delete r.ret;r.status=mst(r);
 if(!r.no)r.no='MNT-'+String(D.maint.reduce((m,x)=>Math.max(m,+(x.no||'').replace(/\D/g,'')||0),0)+1).padStart(3,'0');
 await save('maint',r);logAct('حفظ إذن صيانة '+r.no);M=null;go('maint')
}
function mRecv(id){
 const r=D.maint.find(x=>x.id===id),L=mLines(r);
 const rows=L.map((l,i)=>{const left=(+l.qty||0)-(+l.ret||0);return left>0?`<div class="ln"><div><b>${esc(l.name||'—')}</b><small>${l.serial?'S/N '+esc(l.serial)+' · ':''}متبقي ${left}</small></div><div class="qty"><input class="qin mr" type="number" min="0" max="${left}" value="0" data-i="${i}"></div></div>`:''}).join('');
 sheet('تسجيل استلام من المهندس',`<div class="fld"><label>تاريخ الاستلام</label><input type="date" id="rd" value="${today()}"></div><button class="btn sm" onclick="document.querySelectorAll('.mr').forEach(e=>e.value=e.max)">استلام كل المتبقي</button>${rows}<p class="hint">يظل الإذن أحمر حتى يُستلم كل شيء، ثم يتحول أخضر تلقائياً.</p>`,`<button class="btn pri" onclick="mRecvSave('${id}')">تأكيد الاستلام</button><button class="btn" onclick="closeSheet()">إلغاء</button>`)
}
async function mRecvSave(id){
 const r=D.maint.find(x=>x.id===id),d=$('#rd').value;if(!d)return alert('اختر التاريخ');
 const L=structuredClone(mLines(r));let n=0;
 document.querySelectorAll('.mr').forEach(e=>{const l=L[+e.dataset.i],left=(+l.qty||0)-(+l.ret||0),q=Math.min(Math.max(parseInt(e.value)||0,0),left);if(q>0){l.ret=(+l.ret||0)+q;l.retDate=d;n+=q}});
 if(!n)return alert('اكتب عدد القطع المستلمة');
 r.lines=L;r.status=mst(r);await save('maint',r);logAct('استلام من الصيانة '+(r.no||''));closeSheet();render()
}


/* ===== Expired batches move automatically from the main stock to "المنتهي / التالف" ===== */
let SWEEPING=false;
function toast(m){const e=document.createElement('div');e.className='toast';e.textContent=m;document.body.appendChild(e);setTimeout(()=>e.remove(),9000)}
async function sweepExpired(){
 if(SWEEPING||!me||!can())return 0;
 SWEEPING=true;const moved=[];
 try{
  for(const it of [...D.items]){
   const gone=(it.batches||[]).filter(b=>+b.qty>0&&b.exp&&days(b.exp)<0);
   if(!gone.length)continue;
   for(const b of gone){
    const id='x_'+String(it.id).replace(/\W/g,'').slice(0,8)+'_'+b.exp+'_'+String(b.no||'').replace(/\W/g,'').slice(0,10);   /* same batch => same record, so two devices never duplicate it */
    const old=D.expired.find(x=>x.id===id);
    const rec=old?{...old,qty:Math.max(+old.qty||0,+b.qty)}:{id,name:it.name,code:it.code||it.odoo||'',qty:+b.qty,reason:'منتهي الصلاحية',date:today(),custody:'إدارة المخزون',ref:'نقل تلقائي',note:`دفعة ${b.no?b.no+' · ':''}صلاحية ${b.exp}`,auto:true,notified:false,iid:it.id};
    await save('expired',rec);moved.push(`${it.name} × ${b.qty}`)}
   it.batches=it.batches.filter(b=>!gone.includes(b));
   await save('items',it)}
 }finally{SWEEPING=false}
 if(moved.length){logAct('نقل تلقائي للمنتهي: '+moved.length+' دفعة');toast('⛔ نُقل '+moved.length+' صنف منتهي الصلاحية من المخزون الرئيسي إلى المنتهي/التالف: '+moved.slice(0,3).join('، ')+(moved.length>3?'…':''));if(typeof idle==='function'&&idle())render()}
 return moved.length}
