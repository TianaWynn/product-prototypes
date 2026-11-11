/* features/cross-region.js — 跨区域产品关联：管理总览、系统建议核验、手动建立关联组。 */
function openManager(tab='overview'){
 currentModal={type:'manager',spu:''};
 managerTab=tab;
 managerManualPicked=new Set(); managerManualQuery=''; managerGroupName='';
 renderManager();
}
function switchManagerTab(tab){
 managerTab=tab;
 if(tab==='manual'){managerManualPicked=new Set();managerManualQuery='';managerGroupName='';}
 renderManager();
}
function updateManagerManualSearch(value, pos){
 managerManualQuery=value;
 renderManager();
 const input=document.getElementById('managerManualSearch');
 if(input){input.focus();try{input.setSelectionRange(pos,pos)}catch(e){}}
}
function toggleManagerManualPick(id,checked){
 if(checked)managerManualPicked.add(id);else managerManualPicked.delete(id);
 const count=document.getElementById('managerManualPickedCount');
 if(count)count.textContent=managerManualPicked.size;
 const button=document.getElementById('createManagerGroupBtn');
 if(button){button.disabled=managerManualPicked.size<2;button.textContent=`创建关联组（${managerManualPicked.size}）`;}
}
function createGroupFromManager(){
 const ids=[...managerManualPicked];
 if(ids.length<2){toast('至少选择 2 个 SPU');return;}
 if(ids.some(id=>getSpu(id)?.group)){toast('所选 SPU 中包含已加入关联组的产品，请重新选择');return;}
 const first=ids[0];
 for(let i=1;i<ids.length;i++)linkSpus(first,ids[i]);
 const groupId=getSpu(first)?.group;
 if(managerGroupName.trim()&&groupId&&groupInfo[groupId])groupInfo[groupId].name=managerGroupName.trim();
 managerManualPicked=new Set();managerTab='overview';
 renderTable();renderManager();
 toast(`已创建 ${groupId}，包含 ${ids.length} 个 SPU`);
}
function renderManager(){
 const groups=Object.keys(groupInfo).map(id=>({id,...groupInfo[id]}));
 const candidates=spuData.filter(x=>x.status==='candidate' && (x.candidates||[]).some(id=>getSpu(id)));
 const candidateCount=candidates.length;
 const unlinked=spuData.filter(x=>!x.group);
 const tabs=`<div class="modal-tabs manager-tabs">
   <button class="modal-tab ${managerTab==='overview'?'active':''}" onclick="switchManagerTab('overview')">总览</button>
   <button class="modal-tab ${managerTab==='candidates'?'active':''}" onclick="switchManagerTab('candidates')">系统建议 <span class="badge badge-warning">${candidateCount}</span></button>
   <button class="modal-tab ${managerTab==='manual'?'active':''}" onclick="switchManagerTab('manual')">手动选择</button>
 </div>`;
 let content='';
 if(managerTab==='overview'){
   content=`<div class="summary-cards">
     <div class="summary-card"><div class="label">已确认关联组</div><div class="num">${groups.length}</div></div>
     <div class="summary-card"><div class="label">待核验建议</div><div class="num">${candidateCount}</div></div>
     <div class="summary-card"><div class="label">未关联 SPU</div><div class="num">${unlinked.length}</div></div>
   </div>
   <div style="font-weight:600;color:#303133;margin:3px 0 9px">已确认关联组</div>
   ${groups.length?`<table class="data-table"><thead><tr><th style="width:125px">关联组</th><th>成员 SPU</th><th style="width:110px">成员数</th><th style="width:100px">操作</th></tr></thead><tbody>${groups.map(g=>`<tr><td><b>${g.id}</b></td><td>${g.members.map(id=>`<span class="badge badge-primary" style="margin:2px">${id}</span>`).join(' ')}</td><td>${g.members.length} 个</td><td><button class="btn-text" onclick="openGroup('${g.members[0]}')">查看</button></td></tr>`).join('')}</tbody></table>`:`<div class="empty" style="border:1px solid #ebeef5;border-radius:4px">当前还没有已确认的关联组</div>`}
   <div class="small-note" style="margin-top:10px">待核验和未关联 SPU 分别在「系统建议」与「手动选择」中处理。</div>`;
 } else if(managerTab==='candidates'){
   content=`<div class="manager-pane-note">系统根据标题、属性等推荐候选；确认后才建立 SPU 关联。</div>
   ${candidateCount?`<table class="data-table"><thead><tr><th style="width:130px">当前 SPU</th><th>候选 SPU</th><th style="width:140px">推荐依据</th><th style="width:100px">操作</th></tr></thead><tbody>${candidates.map(x=>`<tr><td><b>${x.id}</b><div class="small-note">${escapeHtml(x.region)}</div></td><td>${x.candidates.filter(id=>getSpu(id)).map(id=>{const y=getSpu(id);return `<div style="padding:3px 0"><b>${id}</b><span class="small-note"> · ${escapeHtml(y.region)}</span></div>`}).join('')}</td><td>标题 / 属性相似</td><td><button class="btn-text" onclick="openCandidate('${x.id}')">核验</button></td></tr>`).join('')}</tbody></table>`:`<div class="empty" style="border:1px solid #ebeef5;border-radius:4px">暂无待核验候选</div>`}`;
 } else if(managerTab==='manual'){
   const possible=unlinked.filter(x=>(x.id+' '+x.title+' '+x.region).toLowerCase().includes(managerManualQuery.toLowerCase()));
   content=`<div class="manager-pane-note">选择至少 2 个尚未关联的 SPU，确认属于同一核心产品的不同区域版本后建立关联。</div>
   <div class="search-row" style="margin-bottom:10px"><input class="filter-input" id="managerManualSearch" placeholder="搜索 SPU 编码 / 标题 / 区域" value="${escapeHtml(managerManualQuery)}" oninput="updateManagerManualSearch(this.value,this.selectionStart)"/><span class="subtext">已选 <b id="managerManualPickedCount">${managerManualPicked.size}</b></span><button onclick="managerManualPicked.clear();renderManager()">清空</button></div>
   <div class="form-row" style="margin:0 0 10px"><label for="managerGroupNameInput" style="min-width:74px">关联组名称</label><input id="managerGroupNameInput" placeholder="选填" value="${escapeHtml(managerGroupName)}" oninput="managerGroupName=this.value" /></div>
   <div class="manual-list" style="max-height:325px">${possible.length?possible.map(y=>`<label class="manual-item"><input type="checkbox" ${managerManualPicked.has(y.id)?'checked':''} onchange="toggleManagerManualPick('${y.id}',this.checked)"/><div class="manual-item-main"><div class="manual-item-title">${y.id}</div><div class="manual-item-desc">${escapeHtml(y.title.slice(0,100))}${y.title.length>100?'…':''}</div><div style="margin-top:4px"><span class="badge badge-primary">${escapeHtml(y.region)}</span> <span class="badge ${badgeClass(y.status)}">${statusText(y.status)}</span></div></div></label>`).join(''):`<div class="empty">没有符合条件的未关联 SPU</div>`}</div>
   <div style="display:flex;justify-content:flex-end;margin-top:12px"><button id="createManagerGroupBtn" class="btn-primary" onclick="createGroupFromManager()" ${managerManualPicked.size<2?'disabled':''}>创建关联组（${managerManualPicked.size}）</button></div>`;
 }
 showModal('跨区域产品关联',tabs+content,`<span class="small-note" style="margin-right:auto;align-self:center">模拟数据</span><button onclick="closeModal()">关闭</button>`,true);
}
function openCandidate(id){
 currentModal={type:'candidate',spu:id};const x=getSpu(id);if(!x)return;
 const ids=x.candidates.filter(c=>getSpu(c));
 const body=`<div class="alert">以下为系统推荐候选的交互示例，匹配依据为模拟内容。请先比较核心产品信息，开发确认后才建立 SPU 级关系。</div>
 <div class="compare-grid">
 <div class="compare-card"><div class="compare-title"><span>当前 SPU</span><span class="badge badge-primary">待核验对象</span></div><div class="compare-content"><div style="font-weight:600;color:#303133">${x.id}</div><div class="small-note" style="margin:5px 0 10px">${escapeHtml(x.title)}</div><div class="compare-line"><div class="compare-label">区域 / 制式</div><div>${x.region}</div></div><div class="compare-line"><div class="compare-label">信息质量评分</div><div>${x.score}</div></div><div class="compare-line"><div class="compare-label">所属关联组</div><div>${x.group||'暂无'}</div></div></div></div>
 <div class="compare-card"><div class="compare-title"><span>选择一个候选 SPU</span><span class="badge badge-warning">系统建议</span></div><div class="compare-content"><select id="candidateSelect" class="filter-select" style="width:100%" onchange="renderCandidateCompare('${id}')">${ids.length?ids.map(cid=>`<option value="${cid}">${cid} · ${getSpu(cid).region}</option>`).join(''):'<option value="">当前没有候选，请手动搜索</option>'}</select><div id="candidateCompareDetails">${candidateCompareHtml(ids[0])}</div></div></div>
 </div>
 <div class="alert" style="margin-top:14px;margin-bottom:0">核验原则：需确认核心产品、型号/关键规格一致，且存在销售国家/地区或区域制式差异；相似品类不等于关联版本。SPU 关联确认后，再分别核验 SKU 对应关系，不要求全部 SKU 一一对应。</div>`;
 const footer=`<button onclick="rejectCandidate('${id}')">不是对应版本</button><button onclick="deferCandidate('${id}')">暂不处理</button><button class="btn-primary" onclick="confirmCandidate('${id}')" ${ids.length?'':'disabled'}>确认区域版本关联</button>`;
 showModal('候选核验 · '+id,body,footer,true);
}
function candidateCompareHtml(cid){const y=getSpu(cid);if(!y)return '<div class="empty">暂无候选，可手动关联其他 SPU。</div>';return `<div style="font-weight:600;color:#303133;margin-top:12px">${y.id}</div><div class="small-note" style="margin:5px 0 10px">${escapeHtml(y.title)}</div><div class="compare-line"><div class="compare-label">区域 / 制式</div><div>${y.region}</div></div><div class="compare-line"><div class="compare-label">信息质量评分</div><div>${y.score}</div></div><div class="compare-line"><div class="compare-label">所属关联组</div><div>${y.group||'暂无'}</div></div><div class="compare-line"><div class="compare-label">候选原因</div><div>标题和部分产品属性相似；需核对产品主体与关键规格</div></div>`}
function renderCandidateCompare(id){const cid=document.getElementById('candidateSelect')?.value;document.getElementById('candidateCompareDetails').innerHTML=candidateCompareHtml(cid)}
function confirmCandidate(id){const x=getSpu(id);const cid=document.getElementById('candidateSelect')?.value;const y=getSpu(cid);if(!x||!y)return;linkSpus(id,cid);closeModal();renderTable();toast(`已演示确认：${id} 与 ${cid} 进入同一关联组`)}
function rejectCandidate(id){const x=getSpu(id);const cid=document.getElementById('candidateSelect')?.value;if(!x||!cid){closeModal();toast('没有可排除的候选');return}x.candidates=x.candidates.filter(v=>v!==cid);const y=getSpu(cid);if(y){y.candidates=y.candidates.filter(v=>v!==id);if(y.status==='candidate'&&y.candidates.length===0)y.status='none'}if(x.candidates.length===0)x.status='none';closeModal();renderTable();toast(`已记录 ${id} 与 ${cid} 不属于同一核心产品的区域版本，其他候选关系未受影响`)}
function deferCandidate(id){closeModal();toast(`已暂缓处理 ${id}，未改变正式关联关系`)}
function linkSpus(id,cid){const x=getSpu(id),y=getSpu(cid);if(!x||!y||id===cid)return;let target=x.group||y.group;if(!target)target='GRP-'+String(nextGroupNumber++).padStart(3,'0');const otherGroups=[x.group,y.group].filter(Boolean).filter(g=>g!==target);if(otherGroups.length){otherGroups.forEach(g=>{if(groupInfo[g]){groupInfo[g].members.forEach(m=>{const z=getSpu(m);if(z){z.group=target;z.status='linked'}});delete groupInfo[g]}})}if(!groupInfo[target])groupInfo[target]={name:'跨区域产品关联组（演示）',note:'由开发在原型中确认建立。',created:'2026-10-23',members:[]};[id,cid].forEach(v=>{if(!groupInfo[target].members.includes(v))groupInfo[target].members.push(v);const a=getSpu(v);a.group=target;a.status='linked';a.candidates=[]});groupInfo[target].name=groupInfo[target].members.length>2?'TCL 静音移动空调 · 多区域关联组':'移动空调 · 区域款关联组'}
function openGroup(id){const x=getSpu(id);if(!x)return;if(!x.group){showModal('跨区域关联情况 · '+id,`<div class="alert">该 SPU 尚未加入已确认的关联组。可以先处理系统候选，或在统一管理流程中手动添加关联 SPU。</div><div class="kv"><div>SPU 编码</div><div><b>${id}</b></div><div>产品标题</div><div>${escapeHtml(x.title)}</div><div>区域 / 制式</div><div>${x.region}</div><div>关联状态</div><div><span class="badge ${badgeClass(x.status)}">${statusText(x.status)}</span></div></div>`,`<button onclick="closeModal()">关闭</button><button class="btn-primary" onclick="openManual('${id}')">处理关联</button>`,false);return}
 const g=groupInfo[x.group];if(!g){toast('未找到模拟关联组信息');return}const members=g.members.map(mid=>{const y=getSpu(mid);return `<div class="group-member ${mid===id?'current':''}"><div><b>${mid}</b><div class="small-note" style="margin-top:4px">${escapeHtml(y?.title||'')}</div><div style="margin-top:6px"><span class="badge badge-primary">${y?.region||'区域待核验'}</span> ${mid===id?'<span class="badge badge-success">当前 SPU</span>':''}</div></div><button class="btn-text" onclick="openGroup('${mid}')">查看</button></div>`}).join('');
 const body=`<div class="group-panel"><div class="group-panel-head"><div style="flex:1"><div style="font-weight:600;color:#303133">${g.name}</div><div class="small-note" style="margin-top:4px">关联组 ID：${x.group} · 创建时间：${g.created}</div></div><span class="badge badge-success">已确认</span></div>${members}</div><div class="alert" style="margin-top:14px">${g.note||'当前为原型中的模拟关联组。'} 关联组确认后，可进一步核验组内各 SPU 的 SKU 区域版本对应关系。</div><div style="font-weight:600;margin-bottom:7px">关联组规则</div><div class="kv"><div>关系层级</div><div>SPU ↔ SPU 产品级关联</div><div>当前成员数</div><div>${g.members.length} 个 SPU</div><div>SKU 映射状态</div><div><span class="badge badge-warning">待单独核验</span></div><div>关联来源</div><div>开发人工确认（演示）</div></div>`;
 showModal('查看关联版本 · '+x.group,body,`<button onclick="closeModal()">关闭</button><button onclick="openManual('${id}')">＋ 添加 SPU</button><button class="btn-primary" onclick="toast('演示原型：SKU 区域映射维护尚未展开')">查看 SKU 对应关系</button>`,false);
}
function openManual(id){currentModal={type:'manual',spu:id,mode:id?'add':'create'};manualPicked=new Set();manualQuery='';manualGroupName='';renderManual();}
function renderManual(){
 const id=currentModal.spu;const x=getSpu(id);const baseGroup=x?.group||'';const createMode=!id;
 const possible=spuData.filter(y=>y.id!==id&&(createMode?!y.group:!(baseGroup&&y.group===baseGroup))&&(y.id+' '+y.title+' '+y.region).toLowerCase().includes(manualQuery.toLowerCase()));
 const selectedGroup=baseGroup?`当前 SPU：<b>${id}</b> · 加入关联组：<b>${baseGroup}</b>`:id?`当前 SPU：<b>${id}</b> · 选择至少一个其他 SPU，确认后建立关联。`:`请选择本项目内两个或以上 SPU，确认后系统会创建一个新的产品关联组。已进入其他已确认关联组的 SPU 默认隐藏，避免误合并已有关系组。`;
 const nameField=createMode?`<div class="form-row"><label for="manualGroupNameInput">关联组名称（选填）</label><input id="manualGroupNameInput" value="${escapeHtml(manualGroupName)}" placeholder="例如：移动空调英规/欧规版本" oninput="manualGroupName=this.value" /></div>`:'';
 const body=`<div class="alert">${createMode?'新建区域版本关联：请选择核心产品一致、但面向不同国家/地区的 SPU。':'手动关联区域版本：请选择需要加入当前跨区域产品关系的 SPU。'} 请先检索并勾选候选，确认后才会建立正式关系。<br><b>注意：</b>此处关联的是 SPU 与 SPU；具体 SKU 是否一一对应，需要在关联组建立后再按区域和变体属性核验。</div><div class="kv" style="margin-bottom:12px"><div>关联操作</div><div>${selectedGroup}</div></div>${nameField}<div class="search-row"><input class="filter-input" id="manualSearch" placeholder="搜索 SPU 编码 / 标题 / 区域" value="${escapeHtml(manualQuery)}" oninput="manualQuery=this.value;renderManual()"/><span class="subtext">已选择 <b id="manualPickedCount">${manualPicked.size}</b> 个</span><button onclick="manualPicked.clear();renderManual()">清空选择</button></div><div class="manual-list">${possible.length?possible.map(y=>`<label class="manual-item"><input type="checkbox" ${manualPicked.has(y.id)?'checked':''} onchange="toggleManualPick('${y.id}',this.checked)"/><div class="manual-item-main"><div class="manual-item-title">${y.id} <span class="badge ${badgeClass(y.status)}">${statusText(y.status)}</span></div><div class="manual-item-desc">${escapeHtml(y.title.slice(0,120))}${y.title.length>120?'…':''}</div><div style="margin-top:5px"><span class="badge badge-primary">${y.region}</span> ${y.candidates?.length?`<span class="badge badge-warning">${y.candidates.length} 个候选待核验</span>`:''}</div></div><button type="button" class="btn-text" onclick="event.preventDefault();openGroup('${y.id}')">查看</button></label>`).join(''):'<div class="empty">没有可选的 SPU。可清空搜索，或返回关联总览查看已有组。</div>'}</div><div class="small-note" style="margin-top:10px">当前项目共 ${spuData.length} 个模拟 SPU。可以使用上方搜索框筛选不同国家 / 制式，再勾选多个 SPU 进行组合。</div>`;
 const canSave=createMode?manualPicked.size>=2:manualPicked.size>=1;
 const buttonText=createMode?`创建关联组（${manualPicked.size}）`:`确认关联（${manualPicked.size}）`;
 const footer=`<button onclick="closeModal()">取消</button><button class="btn-primary" onclick="saveManual('${id}')" ${canSave?'':'disabled'}>${buttonText}</button>`;
 showModal(createMode?'新建区域版本关联':'手动关联区域版本',body,footer,true);
}
function toggleManualPick(id,checked){if(checked)manualPicked.add(id);else manualPicked.delete(id);renderManual()}
function saveManual(id){
 let ids=[...manualPicked];if(id&&!ids.includes(id))ids.push(id);
 if(ids.length<2){toast('至少选择两个 SPU 才能建立关联组');return}
 let first=ids[0];for(let i=1;i<ids.length;i++)linkSpus(first,ids[i]);
 const groupId=getSpu(first)?.group;
 if(!id&&manualGroupName.trim()&&groupId&&groupInfo[groupId])groupInfo[groupId].name=manualGroupName.trim();
 closeModal();renderTable();
 toast(!id?`已新建区域版本关联组：${groupId}，包含 ${ids.length} 个 SPU`:`已演示建立关联：${ids.join('、')} 已进入同一产品关联组`);
}
