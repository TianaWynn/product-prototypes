/* core/ui.js — 通用 UI 工具：文本转义、状态文案、弹窗(overlay/modal)、Toast。
   与具体业务无关，供各 features 复用。 */
function statusText(s){return s==='linked'?'已确认关联':s==='candidate'?'待确认关联':'暂无关联'}
function badgeClass(s){return s==='linked'?'badge-success':s==='candidate'?'badge-warning':'badge-info'}

function escapeHtml(s){return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;')}
function showModal(title,body,footer='',wide=true){
 document.getElementById('modalTitle').textContent=title;
 document.getElementById('modalBody').innerHTML=body;
 document.getElementById('modalFooter').innerHTML=footer||'<button onclick="closeModal()">关闭</button>';
 document.getElementById('modal').classList.toggle('wide',wide);
 document.getElementById('overlay').classList.add('show');
}
function closeModal(){document.getElementById('overlay').classList.remove('show')}
function overlayClose(e){if(e.target.id==='overlay')closeModal()}

function toast(s){const el=document.getElementById('toastBox');el.textContent=s;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2600)}
