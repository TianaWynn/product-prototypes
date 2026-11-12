/* features/project-list.js — 项目 SPU 列表：统计、筛选、分页与表格渲染。 */

/* 「跨区域关联情况 / 关联操作」两列属于另一个需求，默认隐藏，按钮控制是否显示。 */
let showRelationColumns=false;
function toggleRelationColumns(){
  showRelationColumns=!showRelationColumns;
  const table=document.querySelector('.spu-table');
  if(table)table.classList.toggle('hide-relation',!showRelationColumns);
  const btn=document.getElementById('relationToggle');
  if(btn)btn.textContent=showRelationColumns?'隐藏跨区域关联列':'显示跨区域关联列';
}

function renderStats(totalFiltered=spuData.length){
 const groups = new Set(spuData.filter(x=>x.group).map(x=>x.group)).size;
 // 统计条已从界面移除，这里统一判空，避免元素不存在时报错。
 const setText=(id,val)=>{const el=document.getElementById(id);if(el)el.textContent=val;};
 setText('groupCount',groups);
 setText('candidateCount',spuData.filter(x=>x.status==='candidate').length);
 setText('unlinkedCount',spuData.filter(x=>x.status==='none').length);
 const detectionRows=spuData.map(x=>duplicateDetectionData[x.id]||{taskState:'pending'});
 setText('detectionPendingCount',detectionRows.filter(x=>x.taskState==='pending').length);
 setText('detectionDuplicateCount',detectionRows.filter(x=>x.status==='已完成'&&x.is_duplicate==='是').length);
 setText('detectionSuspectedCount',detectionRows.filter(x=>x.status==='已完成'&&x.is_duplicate==='疑似').length);
 setText('totalCount','（'+spuData.length+' 条）');
 setText('pageCount','共 '+totalFiltered+' 条');
}
function changePage(delta){currentPage+=delta;renderTable()}
function rowOperation(item){
 // 每行保留一个入口，按跨区域关联情况显示明确动作。
 const action=item.status==='candidate'?`openCandidate('${item.id}')`:item.status==='linked'?`openGroup('${item.id}')`:`openManual('${item.id}')`;
 const label=item.status==='candidate'?'核验关联':item.status==='linked'?'查看关联版本':'关联区域版本';
 return `<button onclick="${action}">${label}</button>`;
}

function renderTable(){
 const q=(document.getElementById('searchInput')?.value||'').toLowerCase().trim();
 const f=document.getElementById('statusFilter')?.value||'all';
 const df=document.getElementById('detectionFilter')?.value||'all';
 const filtered=spuData.filter(x=>{
  const base=((x.id+' '+x.title+' '+x.region).toLowerCase().includes(q))&&(f==='all'||(f==='linked'&&x.status==='linked')||(f==='candidate'&&x.status==='candidate')||(f==='none'&&x.status==='none'));
  const ds=duplicateDetectionState(x.id);
  return base&&(df==='all'||ds===df||(df==='running'&&['queued','processing'].includes(ds))||(df==='error'&&['no-info','failed','timeout'].includes(ds)));
 });
 const totalPages=Math.max(1,Math.ceil(filtered.length/pageSize));
 currentPage=Math.min(Math.max(1,currentPage),totalPages);
 const rows=filtered.slice((currentPage-1)*pageSize,currentPage*pageSize);
 document.getElementById('spuTbody').innerHTML=rows.map((x,i)=>`<tr>
  <td></td>
  <td><img class="product-thumb" src="${thumbs[x.img]}" alt="产品主图示意"></td>
  <td><a class="spu-link" href="javascript:void(0)" onclick="navigateToProduct('${x.id}')">${x.id}</a></td>
  <td><div class="title-text" title="${escapeHtml(x.title)}">${escapeHtml(x.title)}</div><div class="small-note" style="text-align:left;margin-top:3px">适用范围：${escapeHtml(x.region)}</div></td>
  <td><span class="pass">产品审核通过</span></td>
  <td>${duplicateDetectionCell(x)}</td>
  <td><div class="state-cell"><span class="badge ${badgeClass(x.status)}">${statusText(x.status)}</span>${x.group?`<span class="small-note">${Math.max(0,(groupInfo[x.group]?.members||[]).length-1)} 个关联版本 · ${x.group}</span>`:x.status==='candidate'?`<span class="small-note">${x.candidates.length} 条待确认建议</span>`:'<span class="small-note">—</span>'}</div></td>
  <td><div class="op-stack">${rowOperation(x)}</div></td>
  <td><span class="score">◎ ${x.score}</span></td>
  <td>${x.purchase}</td>
  <td class="price-cell">${x.prices}</td>
  <td class="profit">${profitCell(x.profit,0)}</td>
  <td class="profit">${profitCell(x.profit,1)}</td>
  <td class="profit">${profitCell(x.profit,2)}</td>
  ${spuBizCells(x)}
 </tr>`).join('');
 if(!rows.length)document.getElementById('spuTbody').innerHTML='<tr><td colspan="25"><div class="empty">没有找到符合条件的 SPU</div></td></tr>';
 const prev=document.getElementById('prevPage'); const next=document.getElementById('nextPage'); const current=document.getElementById('currentPageBtn');
 if(prev)prev.disabled=currentPage<=1;
 if(next)next.disabled=currentPage>=totalPages;
 if(current)current.textContent=currentPage+' / '+totalPages;
 renderStats(filtered.length);
}
