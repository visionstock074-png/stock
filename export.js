/* Export: PDF / Excel / Word with date range, Odoo CSV — every path has a no-library fallback */
let EX=null;
const SLUG={'لوحة التحكم':'dashboard','المخزون الرئيسي':'main-inventory','المخزون المستخدم':'used-inventory','المنتهي والتالف':'expired-damaged','الصيانة':'maintenance','مخزن الآلات':'tools','نواقص المخزن':'deficits','إدارة المندوبين':'reps','إدارة المستشفيات':'hospitals','الإذونات':'vouchers'};
const fname=(n,e)=>(SLUG[n]||String(n).replace(/[^A-Za-z0-9_-]/g,'')||'export')+'_'+today()+'.'+e;
function dl(blob,name){const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;a.style.display='none';document.body.appendChild(a);a.click();setTimeout(()=>{a.remove();URL.revokeObjectURL(u)},5000)}
function openExport(name,rows,o={}){
 EX={name,rows,...o};
 sheet('تصدير '+name,`<div class="g2"><div class="fld"><label>من تاريخ</label><input type="date" id="xa"></div><div class="fld"><label>إلى تاريخ</label><input type="date" id="xb"></div></div><p class="hint">يُطبَّق النطاق على الملف المصدَّر (يُترك فارغًا لتصدير الكل).</p>
 <button class="opt" onclick="runExp('pdf')">PDF ${o.screen?'(كما يظهر على الشاشة)':'(جدول)'}</button><button class="opt" onclick="runExp('xlsx')">Excel (XLSX)</button><button class="opt" onclick="runExp('docx')">Word (DOCX)</button>${o.odoo?`<button class="opt" onclick="runExp('odoo')">تصدير إلى أودو (CSV)</button>`:''}`)
}
function tableHtml(name,rows,a,b){
 const keys=Object.keys(rows[0]),th='border:1px solid #888;padding:4px;color:#000;';
 return `<table style="border-collapse:collapse;width:100%;direction:rtl;font-family:sans-serif;font-size:12px"><caption style="font-weight:bold;font-size:16px;padding:6px;color:#000">${esc(name)} ${a||''} ${b?'→ '+b:''}</caption><tr>${keys.map(k=>`<th style="${th}background:#eee">${esc(k)}</th>`).join('')}</tr>${rows.map(r=>`<tr>${keys.map(k=>`<td style="${th}">${esc(r[k])}</td>`).join('')}</tr>`).join('')}</table>`
}
async function runExp(fmt){
 const a=$('#xa').value,b=$('#xb').value,ex=EX;
 if(a&&b&&a>b)return alert('تاريخ البداية بعد تاريخ النهاية');
 try{
  if(fmt==='odoo'){closeSheet();return odooBulk(a,b)}
  if(fmt==='pdf'&&ex.screen){closeSheet();await pdfScreen(ex.name);logAct('تصدير '+ex.name+' (pdf)');return}
  const rows=ex.rows().filter(r=>{const d=r['التاريخ'];return !d||((!a||d>=a)&&(!b||d<=b))});
  if(!rows.length)return alert('لا توجد بيانات في هذا النطاق');
  closeSheet();
  if(fmt==='xlsx')xlsxOut(ex.name,rows);
  else if(fmt==='docx')dl(new Blob(['\ufeff<html dir="rtl" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"></head><body>'+tableHtml(ex.name,rows,a,b)+'</body></html>'],{type:'application/msword'}),fname(ex.name,'doc'));
  else await pdfTable(ex.name,rows,a,b);
  logAct('تصدير '+ex.name+' ('+fmt+')')
 }catch(e){console.error(e);alert('تعذّر التصدير: '+(e.message||e))}
}
const cx=v=>typeof v==='string'&&/^[=+\-@\t\r]/.test(v)?"'"+v:v;
function xlsxOut(name,rows0){
 const rows=rows0.map(r=>Object.fromEntries(Object.entries(r).map(([k,v])=>[k,cx(v)])));
 if(typeof XLSX!=='undefined'){
  const wb=XLSX.utils.book_new();wb.Workbook={Views:[{RTL:true}]};XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(rows),'Sheet1');
  dl(new Blob([XLSX.write(wb,{bookType:'xlsx',type:'array'})],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),fname(name,'xlsx'))
 }else{ /* library blocked/offline: CSV opens directly in Excel */
  const k=Object.keys(rows[0]);
  dl(new Blob(['\ufeff'+[k,...rows.map(r=>k.map(x=>r[x]))].map(r=>r.map(csvQ).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}),fname(name,'csv'));
  alert('تعذّر تحميل مكتبة Excel (لا يوجد اتصال)، فتم التصدير بصيغة CSV تُفتح مباشرة في Excel.')
 }
}
function printHtml(html,title){
 const f=document.createElement('iframe');f.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;border:0';document.body.appendChild(f);
 const d=f.contentWindow.document;d.open();d.write(`<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>${esc(title)}</title></head><body style="font-family:sans-serif">${html}</body></html>`);d.close();
 setTimeout(()=>{f.contentWindow.focus();f.contentWindow.print()},400);setTimeout(()=>f.remove(),90000)
}
async function pdfTable(name,rows,a,b){
 const html=tableHtml(name,rows,a,b);
 if(typeof html2canvas==='undefined'||!window.jspdf)return printHtml(html,name); /* fallback: print dialog -> Save as PDF */
 const h=document.createElement('div');h.style.cssText='position:fixed;left:-9999px;top:0;width:900px;background:#fff;padding:16px';h.innerHTML=html;document.body.appendChild(h);
 try{await toPdf(h,fname(name,'pdf'),'#ffffff')}catch(e){console.error(e);printHtml(html,name)}finally{h.remove()}
}
async function pdfScreen(name){
 if(typeof html2canvas==='undefined'||!window.jspdf)return window.print();
 try{await toPdf($('#dash'),fname(name,'pdf'))}catch(e){console.error(e);window.print()}
}
async function toPdf(el,file,bgc){
 const c=await html2canvas(el,{scale:2,useCORS:true,logging:false,backgroundColor:bgc||getComputedStyle(document.body).backgroundColor});
 const p=new jspdf.jsPDF('p','pt','a4'),w=p.internal.pageSize.getWidth(),h=p.internal.pageSize.getHeight(),ih=c.height*w/c.width,img=c.toDataURL('image/jpeg',.92);
 let y=0,left=ih-h;p.addImage(img,'JPEG',0,0,w,ih);
 while(left>0){y-=h;p.addPage();p.addImage(img,'JPEG',0,y,w,ih);left-=h}
 dl(p.output('blob'),file)
}
const csvQ=s=>'"'+String(s??'').replace(/"/g,'""')+'"';
function odooCsv(vs,file){
 const head=['Reference','Origin','Partner','Scheduled Date','Move Lines/Product','Move Lines/Quantity','Odoo Reference ID','Rep','Hospital','Doctor'];
 const rows=vs.flatMap(v=>v.lines.map(l=>[v.odoo||v.no,v.paper||v.no,v.hospital||v.rep,v.date,l.code||l.name,l.qty,v.odoo||'',v.rep||'',v.hospital||'',v.doctor||''].map(cx)));
 dl(new Blob(['\ufeff'+[head,...rows].map(r=>r.map(csvQ).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}),file)
}
async function odoo(id){
 const v=D.vouchers.find(x=>x.id===id);if(v.status!=='final')return alert('أنهِ الإذن المؤقت أولاً — يُرفع على أودو الإذن النهائي (المفتوح فقط).');const ref=prompt('Odoo Reference ID (مثال WH/OUT/00012)',v.odoo||'');if(ref===null)return;
 v.odoo=ref;await save('vouchers',v);odooCsv([v],fname('odoo_'+v.no,'csv'));logAct('تصدير أودو '+v.no);render()
}
const odooBulk=(a,b)=>{const vs=D.vouchers.filter(v=>v.status==='final'&&v.lines.length&&(!a||v.date>=a)&&(!b||v.date<=b));if(!vs.length)return alert('لا توجد إذونات نهائية في هذا النطاق (يُصدَّر لأودو الإذن النهائي فقط)');odooCsv(vs,fname('odoo_vouchers','csv'))};
