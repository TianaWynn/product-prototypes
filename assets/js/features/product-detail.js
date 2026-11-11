/* features/product-detail.js — 产品详情视图、SKU 变体、跨区域/相似品关联、SKU 关联管理。*/
/* 视图跳转统一走 App.router（见 core/router.js）。 */
function navigateToProduct(id){
  const x=getSpu(id); if(!x){toast('未找到该 SPU');return;}
  activeProductSpu=id;
  App.router.show('product');
  closeModal();
  renderProductDetail(id);
  window.scrollTo({top:0,behavior:'instant'});
}
function goProject(){
  App.router.show('project');
  closeModal();
  window.scrollTo({top:0,behavior:'instant'});
}
function detailSkuCode(item){
  // The SKU suffixes below are demo identifiers; not source-system records.
  const suffixes={'PHK_3ES4':'QX5Q','PHK_3ERY':'4R9N','PHK_3ERV':'6H3D','PHK_3ERU':'7K2M','PHK_3ERT':'5P8A','PHK_3EPQ':'9C4V'};
  return item.id+(suffixes[item.id]||'QX5Q');
}
function countryText(item){
  const r=item.region||'';
  if(r.includes('英国')||r.includes('英规'))return '英国';
  if(r.includes('德国')||r.includes('欧规')||r.includes('欧洲'))return '德国、西班牙、法国、意大利、波兰';
  if(r.includes('美国')||r.includes('美规'))return '美国';
  if(r.includes('加拿大'))return '加拿大';
  return r.split('/')[0].trim()||'待确认';
}
function variantDesc(item){
  const reg=(item.region||'').split('/').pop().trim()||'区域待确认';
  const title=item.title||'';
  const features=[title.includes('WIFI')||title.includes('WiFi')?'带 WiFi':'',title.includes('制热')?'制热款':''].filter(Boolean);
  return '白色 · '+reg+(features.length?' · '+features.join(' / '):'');
}
function detailMembersFor(item){
  if(item.group&&groupInfo[item.group])return groupInfo[item.group].members.map(getSpu).filter(Boolean);
  return [];
}
function getGroupDisplayName(item){
  if(item.group&&groupInfo[item.group])return item.group.replace('GRP-','G-');
  return '';
}
function renderProductDetail(id){
  const x=getSpu(id); if(!x)return;
  activeProductSpu=id;
  const sku=detailSkuCode(x);
  document.getElementById('productCrumbSpu').textContent=x.id;
  document.getElementById('productCrumbSku').textContent=sku;
  document.getElementById('productSkuTitle').textContent='SKU:'+sku;
  document.getElementById('productTitleMini').textContent=x.title;
  document.getElementById('productHeroImage').src=thumbs[x.img];
  document.getElementById('productHeroImage').alt='模拟商品图 '+x.id;
  document.getElementById('productPurchasePrice').textContent=x.purchase;
  document.getElementById('productAttrSummary').textContent='color：White  region：'+((x.region||'').split('/').pop().trim()||'待确认');
  document.getElementById('detailSpuId').textContent=x.id;
  document.getElementById('detailSpuTitle').textContent=x.title;
  const stateMap={'linked':'已确认关联','candidate':'有候选待核验','none':'暂未关联'};
  const badge=document.getElementById('countryGroupBadge');
  if(x.group){badge.textContent='区域版本组 '+getGroupDisplayName(x);badge.style.display='inline-flex';}
  else{badge.textContent=stateMap[x.status]||'暂未关联';badge.style.display='inline-flex';}
  const members=detailMembersFor(x);
  const others=members.filter(m=>m.id!==id);
  document.getElementById('countryModuleSummary').textContent=x.group?('组内 '+members.length+' 个 SPU · 当前已确认'):('当前 '+stateMap[x.status]+' · 尚未形成正式关联');
  // Region availability reflects mock sample values only.
  const region=x.region||'';
  let pillHTML='';
  const countries=['美国','加拿大','墨西哥','德国','西班牙','法国','意大利','波兰','英国','日本','韩国','东南亚','中东','澳洲'];
  countries.forEach(c=>{
    let cls='no';
    if((region.includes('英国')||region.includes('英规'))&&c==='英国')cls='';
    else if((region.includes('欧规')||region.includes('德国')||region.includes('欧洲'))&&['德国','西班牙','法国','意大利','波兰'].includes(c))cls='';
    else if((region.includes('美国')||region.includes('美规'))&&c==='美国')cls='';
    pillHTML+=`<span class="country-pill ${cls}">${c} ${cls?'不可售':'可售'}</span>`;
  });
  document.getElementById('specSalePills').innerHTML=pillHTML;
  document.getElementById('totalSalePills').innerHTML=pillHTML;
  document.getElementById('bottomCountryPills').innerHTML=pillHTML;
  const strip=document.getElementById('productVariantStrip');
  const stripCards=(members.length?members:[x]).map(m=>`<div class="variant-card ${m.id===id?'active':''}" role="button" tabindex="0" onclick="navigateToProduct('${m.id}')" onkeydown="if(event.key==='Enter')navigateToProduct('${m.id}')"><img src="${thumbs[m.img]}" alt="商品图"><div><div class="variant-id">${detailSkuCode(m)}</div><div class="variant-desc">${escapeHtml(variantDesc(m))}</div><div class="variant-sub">${m.id} · ${m.id===id?'当前 SKU':'查看该区域产品'}</div></div></div>`).join('');
  strip.innerHTML=`<button class="variant-arrow" onclick="toast('演示：向左切换区域 SKU')">‹</button>${stripCards}<button class="variant-arrow" onclick="toast('演示：向右切换区域 SKU')">›</button>`;
  const body=document.getElementById('countryModuleBody');
  let header='';
  if(others.length){
    header=`<div class="country-module-title">其他国家/地区的对应 SKU <span class="relation-note">共 ${others.length} 条 · SPU 级关系已确认，以下为已维护对应关系的区域 SKU 示例</span></div><div class="relation-info">说明：当前展示的是已确认跨区域关联组内的其他区域产品。实际系统应在 SPU 关系确认后，继续依据颜色、尺寸、功能等变体属性核验 SKU 对应关系，不能默认所有 SKU 一一对应。</div><div style="overflow-x:auto"><table class="country-table"><colgroup><col style="width:170px"><col style="width:130px"><col><col style="width:115px"><col style="width:230px"><col style="width:110px"></colgroup><thead><tr><th>SKU</th><th>SPU</th><th>标题</th><th>区域属性</th><th>可售国家</th><th>关联状态</th></tr></thead><tbody>${others.map(m=>`<tr><td><a class="sku-code" onclick="navigateToProduct('${m.id}')">${detailSkuCode(m)}</a></td><td><a class="spu-code" onclick="navigateToProduct('${m.id}')">${m.id}</a></td><td class="title-cell" title="${escapeHtml(m.title)}">${escapeHtml(m.title)}</td><td>${escapeHtml((m.region||'').split('/').pop().trim())}</td><td>${escapeHtml(countryText(m))}</td><td><span class="badge badge-success">已确认关联</span></td></tr>`).join('')}</tbody></table></div>`;
  } else {
    const cand=(x.candidates||[]).map(getSpu).filter(Boolean);
    header=`<div class="country-module-title">其他国家/地区的对应 SKU <span class="relation-note">当前暂无已确认的跨 SPU SKU 关系</span></div><div class="empty-relation"><div style="font-size:14px;color:#606266;margin-bottom:6px">${cand.length?'发现 '+cand.length+' 个待核验候选':'暂无已确认的跨区域产品关联'}</div><div style="margin-bottom:12px">${cand.length?'候选不会直接作为已关联 SKU 展示；需先核验是否属于同一核心产品的不同区域版本，再确认 SKU 对应关系。':'该 SPU 当前没有已确认的其他区域版本，可返回项目详情页建立跨区域产品关联。'}</div>${cand.length?`<button class="btn-primary btn-small" onclick="openCandidate('${x.id}')">核验候选</button>`:`<button class="btn-small" onclick="goProject()">返回项目处理关联</button>`}</div>`;
  }
  body.innerHTML=header+'<div class="small-note" style="margin-top:9px">本页面为关联流程原型；所有关联组、SKU 编码和可售数据均为模拟示例。</div>';
}

// V4：产品详情页顶部 SKU 卡片只展示当前 SPU 下的 SKU；“不同国家产品”模块展示被确认关联的 SKU，可来自同 SPU 或已关联的其他区域 SPU。
let activeSkuCode = 'PHK_3ES4QX5Q';
let productRelationTab = 'country';
const skuMappingBySku = {
  // 仅为演示：当前英国 SKU 对应同 SPU 下的美规 SKU，以及区域版本组中另一个 SPU 的欧规 SKU。
  'PHK_3ES4QX5Q': ['PHK_3ES4M6US','PHK_3ERY4R9N'],
  'PHK_3ES4M6US': ['PHK_3ES4QX5Q'],
  'PHK_3ERY4R9N': ['PHK_3ES4QX5Q']
};
let skuManagerScope = 'same';
let skuManagerSearch = '';
let skuManagerPicked = new Set();

function normalizedRegion(item){
  const r=(item?.region||'').split('/').pop().trim();
  if(/英|british|uk/i.test(r)) return '英规';
  if(/欧|europe|germany|france|italy|poland|spain/i.test(r)) return '欧规';
  if(/美|america|united states|us standard/i.test(r)) return '美规';
  if(/日|japan/i.test(r)) return '日规';
  if(/韩|korea/i.test(r)) return '韩规';
  if(/澳|australia/i.test(r)) return '澳规';
  return r||'待确认';
}
function otherRegions(base){
  const order=['美规','欧规','英规'];
  return order.filter(r=>r!==base);
}
function productCoreAttrs(item){
  const t=(item?.title||'').toLowerCase();
  const btu=(t.match(/\b\d{4,5}\s*btu\b/i)||[])[0]?.replace(/\s+/g,'').toUpperCase()||'未知';
  return {
    btu,
    wifi:/wi\s*-?\s*fi/i.test(t),
    heating:/制热|冷暖/.test(t),
    cooling:/制冷|冷暖/.test(t)
  };
}
function countryTextForRegion(region){
  if(region==='英规') return '英国';
  if(region==='欧规') return '德国、西班牙、法国、意大利、波兰';
  if(region==='美规') return '美国';
  if(region==='日规') return '日本';
  if(region==='韩规') return '韩国';
  if(region==='澳规') return '澳洲';
  return '待确认';
}
function regionEnglish(region){
  return ({'英规':'British standard','欧规':'European standard','美规':'American standard','日规':'Japanese standard','韩规':'Korean standard','澳规':'Australian standard'})[region]||region;
}
function skuVariantsForSpu(item){
  const baseRegion=normalizedRegion(item);
  const baseCode=detailSkuCode(item);
  const attrs=productCoreAttrs(item);
  const allRegions=['美规','欧规','英规'];
  const codes={'美规':item.id+'M6US','欧规':item.id+'E6EU','英规':item.id+'UK6E'};
  const white=[{code:baseCode,spu:item.id,parent:item,color:'白色',region:baseRegion,title:(item.title||'产品')+' · 白色 '+baseRegion,attrs}];
  allRegions.filter(region=>region!==baseRegion).forEach(region=>white.push({
    code:codes[region]||item.id+'X6EU',spu:item.id,parent:item,color:'白色',region,
    title:(item.title||'产品')+' · 白色 '+region,attrs
  }));
  // 黑色样例用于演示属性过滤：它会显示在本 SPU 的 SKU 卡片中，但不会作为白色 SKU 的关联候选。
  const blackRegion=baseRegion==='英规'?'欧规':baseRegion==='欧规'?'英规':'欧规';
  white.push({code:item.id+'BK7H',spu:item.id,parent:item,color:'黑色',region:blackRegion,title:(item.title||'产品')+' · 黑色 '+blackRegion,attrs});
  return white.sort((a,b)=>{
    const order={'美规':0,'欧规':1,'英规':2};
    if(a.color!==b.color) return a.color==='白色'?-1:1;
    return (order[a.region]??9)-(order[b.region]??9);
  });
}
function findSkuRecord(code){
  if(!code) return null;
  for(const item of spuData){
    const found=skuVariantsForSpu(item).find(s=>s.code===code);
    if(found)return found;
  }
  return null;
}
function activeSkuRecord(item=getSpu(activeProductSpu)){
  if(!item)return null;
  let record=skuVariantsForSpu(item).find(s=>s.code===activeSkuCode);
  if(!record){activeSkuCode=detailSkuCode(item);record=skuVariantsForSpu(item).find(s=>s.code===activeSkuCode)}
  return record||null;
}
function skuCompatible(current,candidate){
  if(!current||!candidate||current.code===candidate.code)return false;
  if(current.color!==candidate.color)return false;
  if(current.region===candidate.region)return false;
  const a=current.attrs||productCoreAttrs(current.parent), b=candidate.attrs||productCoreAttrs(candidate.parent);
  return a.btu===b.btu && a.wifi===b.wifi && a.heating===b.heating && a.cooling===b.cooling;
}
function eligibleSkuCandidates(current){
  const item=getSpu(current?.spu||activeProductSpu); if(!item||!current)return [];
  const same=skuVariantsForSpu(item).filter(s=>s.code!==current.code).map(s=>({...s,source:'同 SPU'}));
  let cross=[];
  if(item.group&&groupInfo[item.group]){
    cross=detailMembersFor(item).filter(m=>m.id!==item.id).flatMap(m=>skuVariantsForSpu(m)).map(s=>({...s,source:'跨 SPU'}));
  }
  return [...same,...cross].filter(s=>skuCompatible(current,s));
}
function selectCurrentSku(code){
  const rec=findSkuRecord(code);
  if(!rec||rec.spu!==activeProductSpu)return;
  activeSkuCode=code;
  renderProductDetail(activeProductSpu);
}
function navigateToSku(spuId,skuCode){
  const rec=findSkuRecord(skuCode);
  if(!rec||rec.spu!==spuId){navigateToProduct(spuId);return;}
  activeProductSpu=spuId;activeSkuCode=skuCode;
  App.router.show('product');
  closeModal();renderProductDetail(spuId);window.scrollTo({top:0,behavior:'instant'});
}
navigateToProduct = function(id){
  const x=getSpu(id); if(!x){toast('未找到该 SPU');return;}
  activeProductSpu=id;activeSkuCode=detailSkuCode(x);
  App.router.show('product');
  closeModal();renderProductDetail(id);window.scrollTo({top:0,behavior:'instant'});
};

function renderSkuRelationRows(current){
  const codes=[...(skuMappingBySku[current.code]||[])];
  const related=codes.map(findSkuRecord).filter(s=>s&&skuCompatible(current,s));
  if(!related.length) return '<div class="empty-relation" style="padding:20px">暂无关联 SKU</div>';
  const rows=related.map(s=>`<tr>
    <td><a class="sku-code" onclick="navigateToSku('${s.spu}','${s.code}')">${s.code}</a></td>
    <td><a class="spu-code" onclick="navigateToProduct('${s.spu}')">${s.spu}</a></td>
    <td>${s.region}</td><td>${countryTextForRegion(s.region)}</td>
    <td><span class="badge ${s.spu===current.spu?'badge-primary':'badge-success'}">${s.spu===current.spu?'同 SPU':'跨 SPU'}</span></td>
  </tr>`).join('');
  return `<div class="country-module-title" style="margin-bottom:8px">关联 SKU <span class="subtext">${related.length} 条</span></div>
  <div style="overflow-x:auto"><table class="country-table"><thead><tr><th>SKU</th><th>SPU</th><th>区域属性</th><th>可售国家</th><th>来源</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function renderSimilarSpuRows(item){
  const list=(similarSpuRelations[item.id]||similarSpuRelations['PHK_3ES4']||[]);
  const rows=list.map(x=>`<tr><td><span class="similar-spu" onclick="toast('示意：相似品名单由中台导入，本页面仅展示')">${x.spu}</span></td><td><img class="similar-thumb" src="${thumbs[x.img||0]}" alt="SPU图片"></td><td>${escapeHtml(x.title)}</td></tr>`).join('');
  return `<div class="readonly-tip">相似品为已维护关联关系的 SPU，在重复开品检测时将直接过滤，不再进入重复判断。该关联关系由其他中台提供名单并导入系统，本页面仅展示，不支持维护。</div><div style="overflow-x:auto"><table class="similar-table"><colgroup><col style="width:180px"><col style="width:120px"><col></colgroup><thead><tr><th>SPU</th><th>SPU图片</th><th>标题</th></tr></thead><tbody>${rows||'<tr><td colspan="3" class="empty">暂无相似品关联数据</td></tr>'}</tbody></table></div><div class="similar-note">示意数据：相似品关联组来自外部中台名单导入，仅用于详情展示及重复开品过滤。</div>`;
}
function switchRelationTab(tab){
  productRelationTab=tab;
  renderRelationModule();
}
function renderRelationModule(){
  const item=getSpu(activeProductSpu); if(!item) return;
  const countryTab=document.getElementById('countryTabCountry');
  const similarTab=document.getElementById('countryTabSimilar');
  const badge=document.getElementById('countryGroupBadge');
  const manageBtn=document.getElementById('countryManageBtn');
  if(countryTab) countryTab.classList.toggle('active',productRelationTab==='country');
  if(similarTab) similarTab.classList.toggle('active',productRelationTab==='similar');
  if(productRelationTab==='similar'){
    if(badge) badge.style.display='none';
    if(manageBtn) manageBtn.style.display='none';
    document.getElementById('countryModuleBody').innerHTML=renderSimilarSpuRows(item);
  }else{
    if(item.group){badge.textContent='区域版本组 '+getGroupDisplayName(item);badge.style.display='inline-flex';}
    else {badge.textContent='未关联组';badge.style.display='inline-flex';}
    if(manageBtn) manageBtn.style.display='inline-flex';
    const current=activeSkuRecord(item);
    document.getElementById('countryModuleBody').innerHTML=renderSkuRelationRows(current);
  }
}

const originalRenderProductDetail = renderProductDetail;
renderProductDetail = function(id){
  // 复用既有产品详情主体，只重绘 SKU 卡片和新增的“不同国家产品”关系区。
  originalRenderProductDetail(id);
  const item=getSpu(id); if(!item)return;
  activeProductSpu=id;
  const current=activeSkuRecord(item); if(!current)return;
  document.getElementById('productCrumbSpu').textContent=item.id;
  document.getElementById('productCrumbSku').textContent=current.code;
  document.getElementById('productSkuTitle').textContent='SKU:'+current.code;
  document.getElementById('productAttrSummary').textContent='color：'+(current.color==='白色'?'White':'Black')+'  region：'+regionEnglish(current.region);
  document.getElementById('countryModuleSummary').textContent='';
  const badge=document.getElementById('countryGroupBadge');
  if(item.group){badge.textContent='区域版本组 '+getGroupDisplayName(item);badge.style.display='inline-flex'}
  else {badge.textContent='未关联组';badge.style.display='inline-flex'}
  // 可售国家展示跟随当前选中的 SKU 区域；顶部 SKU 卡片始终属于当前 SPU。
  const region=current.region, allCountries=['美国','加拿大','墨西哥','德国','西班牙','法国','意大利','波兰','英国','日本','韩国','东南亚','中东','澳洲'];
  const available=new Set(countryTextForRegion(region).split('、'));
  const pills=allCountries.map(c=>`<span class="country-pill ${available.has(c)?'':'no'}">${c} ${available.has(c)?'可售':'不可售'}</span>`).join('');
  document.getElementById('specSalePills').innerHTML=pills;
  document.getElementById('totalSalePills').innerHTML=pills;
  document.getElementById('bottomCountryPills').innerHTML=pills;
  const variants=skuVariantsForSpu(item);
  const strip=document.getElementById('productVariantStrip');
  const cards=variants.map(s=>`<div class="variant-card ${s.code===current.code?'active':''}" role="button" tabindex="0" onclick="selectCurrentSku('${s.code}')" onkeydown="if(event.key==='Enter')selectCurrentSku('${s.code}')">
    <img src="${thumbs[item.img]}" alt="商品图"><div><div class="variant-id">${s.code}</div><div class="variant-desc">${s.color} · ${s.region}</div><div class="variant-sub">${item.id}${s.code===current.code?' · 当前 SKU':''}</div></div></div>`).join('');
  strip.innerHTML=cards?`<button class="variant-arrow" onclick="toast('当前列表只切换 ${item.id} 下的 SKU')">‹</button>${cards}<button class="variant-arrow" onclick="toast('当前列表只切换 ${item.id} 下的 SKU')">›</button>`:`<div class="empty">当前 SPU 暂无可展示的 SKU</div>`;
  renderRelationModule();
};

function openSkuRelationManager(){
  const item=getSpu(activeProductSpu), current=activeSkuRecord(item); if(!item||!current)return;
  skuManagerScope='same';skuManagerSearch='';skuManagerPicked=new Set(skuMappingBySku[current.code]||[]);
  renderSkuRelationManager();
}
function switchSkuManagerScope(scope){skuManagerScope=scope;skuManagerSearch='';renderSkuRelationManager()}
function renderSkuRelationManager(){
  const item=getSpu(activeProductSpu), current=activeSkuRecord(item);if(!item||!current)return;
  const candidates=eligibleSkuCandidates(current).filter(s=>skuManagerScope==='same'?s.source==='同 SPU':s.source==='跨 SPU');
  const q=skuManagerSearch.trim().toLowerCase();
  const filtered=candidates.filter(s=>(s.code+' '+s.spu+' '+s.region+' '+s.color).toLowerCase().includes(q));
  const groupExists=!!(item.group&&groupInfo[item.group]);
  const list=filtered.length?filtered.map(s=>`<label class="manual-item" style="padding:9px 10px">
    <input type="checkbox" ${skuManagerPicked.has(s.code)?'checked':''} onchange="toggleSkuManagerPick('${s.code}',this.checked)" />
    <div class="manual-item-main"><div class="manual-item-title">${s.code} <span class="badge ${s.source==='跨 SPU'?'badge-success':'badge-primary'}">${s.source}</span></div>
    <div class="manual-item-desc">${s.spu} · ${s.color} · ${s.region}</div></div>
    </label>`).join(''):'<div class="empty" style="padding:20px">无符合条件的 SKU</div>';
  const body=`<div class="sku-manager-context" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:12px"><b style="color:#303133">${current.code}</b><span class="badge badge-primary">${current.color}</span><span class="badge badge-primary">${current.region}</span></div>
    <div class="modal-tabs" style="margin-bottom:10px"><button class="modal-tab ${skuManagerScope==='same'?'active':''}" onclick="switchSkuManagerScope('same')">当前 SPU</button><button class="modal-tab ${skuManagerScope==='cross'?'active':''}" ${groupExists?'':'disabled'} onclick="switchSkuManagerScope('cross')">区域版本组其他 SPU</button></div>
    <div class="search-row" style="margin-top:0"><input class="filter-input" id="skuManagerSearch" placeholder="搜索 SKU / SPU" value="${escapeHtml(skuManagerSearch)}" onkeydown="if(event.key==='Enter'){skuManagerSearch=this.value;renderSkuRelationCandidateList()}" style="flex:1;width:auto"/><button onclick="skuManagerSearch=document.getElementById('skuManagerSearch').value;renderSkuRelationCandidateList()">搜索</button></div>
    <div class="small-note" style="margin:0 0 8px">颜色、BTU、功能一致，且区域不同</div>
    <div class="manual-list" style="max-height:310px">${list}</div>
    ${skuManagerScope==='cross'&&!groupExists?'<div class="small-note" style="margin-top:8px">请先在项目详情页确认跨区域 SPU 关联</div>':''}`;
  showModal('管理国家/地区版本对应关系',body,`<span class="small-note" style="margin-right:auto;align-self:center">已选 <b id="skuManagerPickedCount">${skuManagerPicked.size}</b> 条</span><button onclick="closeModal()">取消</button><button class="btn-primary" onclick="saveSkuRelations()">保存</button>`,true);
}
function renderSkuRelationCandidateList(){
  // 搜索时重绘列表，保留已选项
  const item=getSpu(activeProductSpu),current=activeSkuRecord(item);if(!current)return;
  const candidates=eligibleSkuCandidates(current).filter(s=>skuManagerScope==='same'?s.source==='同 SPU':s.source==='跨 SPU');
  const q=skuManagerSearch.trim().toLowerCase();
  const filtered=candidates.filter(s=>(s.code+' '+s.spu+' '+s.region+' '+s.color).toLowerCase().includes(q));
  const list=document.querySelector('.modal .manual-list');
  if(list)list.innerHTML=filtered.length?filtered.map(s=>`<label class="manual-item" style="padding:9px 10px"><input type="checkbox" ${skuManagerPicked.has(s.code)?'checked':''} onchange="toggleSkuManagerPick('${s.code}',this.checked)"/><div class="manual-item-main"><div class="manual-item-title">${s.code} <span class="badge ${s.source==='跨 SPU'?'badge-success':'badge-primary'}">${s.source}</span></div><div class="manual-item-desc">${s.spu} · ${s.color} · ${s.region}</div></div></label>`).join(''):'<div class="empty" style="padding:20px">无符合条件的 SKU</div>';
}
function toggleSkuManagerPick(code,checked){if(checked)skuManagerPicked.add(code);else skuManagerPicked.delete(code);const c=document.getElementById('skuManagerPickedCount');if(c)c.textContent=skuManagerPicked.size}
function saveSkuRelations(){
  const item=getSpu(activeProductSpu),current=activeSkuRecord(item);if(!item||!current)return;
  const allowed=new Set(eligibleSkuCandidates(current).map(s=>s.code));
  const selected=[...skuManagerPicked].filter(code=>allowed.has(code));
  const previous=[...(skuMappingBySku[current.code]||[])];
  previous.forEach(code=>{if(!selected.includes(code)){skuMappingBySku[code]=(skuMappingBySku[code]||[]).filter(v=>v!==current.code)}});
  skuMappingBySku[current.code]=selected;
  selected.forEach(code=>{if(!skuMappingBySku[code])skuMappingBySku[code]=[];if(!skuMappingBySku[code].includes(current.code))skuMappingBySku[code].push(current.code)});
  closeModal();renderProductDetail(activeProductSpu);toast('关联关系已保存（原型模拟）');
}
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
