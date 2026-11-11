/* features/duplicate-detection.js — 重复品检测（当前完整实现）。
   本文件为合并后的唯一实现：每个函数只保留一份最终逻辑，不再保留历史版本覆盖链。
   内容：
     1. 检测状态模型与结果展示（任务状态 / 业务结论双维度）
     2. 项目列表的检测单元格与统计
     3. 重复品检测报告弹窗（候选单表展示、判断依据、规则参考）
     4. 产品详情页的检测信息条与手动检测、Webhook 回调模拟
   数据契约见 assets/js/data/mock-data.js 中的 duplicateDetectionData。 */

/* ========================= 一、原型数据准备（加载时执行，顺序敏感） ========================= */

// 列表页对比示例 SPU（原型仅用于展示不同候选呈现方式，不创建独立页面）。
const duplicateLayoutExamples = [
 {id:'PHK_3TBA', layout:'tab', title:'新品 DL 9600BTU 静音移动空调 220V 英规 ABS', counts:[1,2,2,3], img:0},
 {id:'PHK_3FLA', layout:'flat',title:'新品 DL 9600BTU 静音移动空调 220V 英规 ABS',counts:[1,2,2,3],img:1},
 {id:'PHK_3TBB', layout:'tab', title:'新品 DL 9600BTU 移动空调 单制冷 欧规 ABS', counts:[0,2,0,2],img:2},
 {id:'PHK_3FLB', layout:'flat',title:'新品 DL 9600BTU 移动空调 单制冷 欧规 ABS', counts:[0,2,0,2],img:3},
 {id:'PHK_3TBC', layout:'tab', title:'新品 DL 9600BTU 移动空调 115V 美规 ABS', counts:[0,0,2,1],img:4},
 {id:'PHK_3FLC', layout:'flat',title:'新品 DL 9600BTU 移动空调 115V 美规 ABS', counts:[0,0,2,1],img:5}
];
const newlyAddedLayoutSpus = duplicateLayoutExamples.map(x=>({
 id:x.id,title:x.title, region:x.id.endsWith('C')?'美国 / 美规':x.id.endsWith('B')?'德国 / 欧规':'英国 / 英规',
 score:'95.1',purchase:'1288.3000', prices:'DE Amazon - MSF：429.99',profit:'MSF：8.5%',img:x.img,status:'none',group:'',candidates:[]
}));
// 插入列表前部，打开页面无需翻页即可看到 Tab/单表对比示例。
spuData.unshift(...newlyAddedLayoutSpus);
for(const x of duplicateLayoutExamples){
 const [a,b,c,d]=x.counts;
 duplicateDetectionData[x.id]=makeDemoDuplicateRecord(x.id,a,b,c,d);
 // 代表 SKU 与候选均为模拟，不应理解为真实运行过 Skill。
}
// 两种零候选原因只保留在追溯数据中；不出现在列表或业务报告。
['PHK_3EMX','PHK_3EDE'].forEach(id=>{delete duplicateDetectionData[id].mock_trace});
// 没有检测记录的 SPU：未检测；与创建任务后的“待检测”区分。
delete duplicateDetectionData['PHK_3ERT'];
spuData.push(
 {id:'PHK_3EXF',title:'新品 DL 9600BTU 静音移动空调 单制冷 欧规 ABS（示例：返回解析失败）',region:'德国 / 欧规',score:'93.4',purchase:'1280.3000',prices:'DE Amazon - MSF：429.99',profit:'DE MSF：7.9%',img:3,status:'none',group:'',candidates:[]},
 {id:'PHK_3EXN',title:'新品 DL 9600BTU 静音移动空调 WiFi 美规 ABS（示例：未检测）',region:'美国 / 美规',score:'91.7',purchase:'1295.1000',prices:'US Amazon - MSF：399.99',profit:'US MSF：8.1%',img:4,status:'none',group:'',candidates:[]}
);
duplicateDetectionData['PHK_3EXF']={taskState:'failed',taskId:'DEMO-PARSE-01',status:'',is_duplicate:'',error_message:'AI 回调内容未通过结果 Schema 校验，数据格式解析失败。',error_code:'INVALID_JSON'};
// 过去的任务保留副本。新任务不覆盖旧任务历史。
const duplicateTaskHistory={};
Object.keys(duplicateDetectionData).forEach(id=>{
  const item=duplicateDetectionData[id];
  if(item&&item.taskState==='completed'||item&&['failed','timeout'].includes(item.taskState)){
    duplicateTaskHistory[id]=[JSON.parse(JSON.stringify(item))];
  }
});
let duplicateDemoSerial=30;
let manualReturnTemplate={};
// Initialize normalized backend-like fields and illustrative timestamps for the prototype data.
Object.entries(duplicateDetectionData).forEach(([id,d],i)=>{
 const taskStatus=inferTaskStatus({...d,task_status:''});
 if(!d.detected_at && taskStatus!=='NOT_STARTED'){
  const minute=String(10+(i%45)).padStart(2,'0');
  const sampleTime=`2026-11-04 14:${minute}`;
  if(taskStatus==='SUCCESS')d.completed_at=d.completed_at||sampleTime;
  else if(taskStatus==='FAILED')d.failed_at=d.failed_at||sampleTime;
  else d.started_at=d.started_at||sampleTime;
  d.detected_at=sampleTime;
 }
 d.skill_status=d.status||d.skill_status||'';
 d.task_status=taskStatus;
 d.result_status=inferResultStatus(d,taskStatus);
});

/* ========================= 二、排除规则与演示数据（加载时执行，顺序敏感） ========================= */

  if(!getSpu('PHK_3CAR')){
    spuData.unshift({id:'PHK_3CAR',title:'厨房地毯 防滑吸水长条地垫 50×120cm（示例：按目标品类规则不触发检测）',region:'德国 / 欧规',score:'94.1',purchase:'32.5000',prices:'DE Amazon：29.99',profit:'DE：8.3%',img:2,status:'none',group:'',candidates:[]});
  }
  duplicateDetectionData['PHK_3CAR']={
    eligibility_status:'EXCLUDED',
    skip_reason_code:'TARGET_CATEGORY_EXCLUDED',
    skip_reason:'目标商品命中地毯类目排除规则（本原型新增的 ERP 触发前置规则示例）',
    taskState:'not-applicable',task_status:null,result_status:'',
    target_spu:'PHK_3CAR',target_sku:'PHK_3CAR01',target_title:'厨房地毯 防滑吸水长条地垫 50×120cm',
    taskId:'',status:'',error_message:''
  };
  // Put an existing running task on the first page so the list demonstrates this state immediately.
  const runningIndex=spuData.findIndex(x=>x.id==='PHK_3ERU');
  if(runningIndex>0){const runningItem=spuData.splice(runningIndex,1)[0];spuData.unshift(runningItem);}
  if(duplicateDetectionData['PHK_3ERU']){const runningItem=getSpu('PHK_3ERU');duplicateDetectionData['PHK_3ERU'].target_spu='PHK_3ERU';duplicateDetectionData['PHK_3ERU'].target_sku=duplicateDetectionData['PHK_3ERU'].target_sku||detailSkuCode(runningItem);duplicateDetectionData['PHK_3ERU'].target_title=duplicateDetectionData['PHK_3ERU'].target_title||runningItem.title;}
  // An excluded SPU never entered the Skill flow, so no representative SKU was selected.
  const excluded=duplicateDetectionData['PHK_3CAR'];
  if(excluded){
    excluded.target_sku='';
    excluded.target_category='家居、家装 > 地毯';
    excluded.skip_reason='该 SPU 所属品类为「地毯」，不属于当前重复品检测适用范围，因此系统未发起检测任务。';
  }
  if(duplicateDetectionData['PHK_3ERU']) duplicateDetectionData['PHK_3ERU'].target_sku='';
  const allSpuRows = [...spuData];
  const displayIds = [
    'PHK_3ERU', // 检测中
    'PHK_3CAR', // 无需检测
    'PHK_3ES4', // 存在重复（含相同/同款/疑似各一条候选）
    'PHK_3ECA', // 发现同款
    'PHK_3ERY', // 疑似重复
    'PHK_3ERV', // 未发现重复
    'PHK_3ERT', // 未检测
    'PHK_3EPQ'  // 检测失败
  ];
  const displayRows = displayIds.map(id => allSpuRows.find(row => row.id === id)).filter(Boolean);
  // One sample candidate per result type; keep counters consistent with the displayed examples.
  const mixed = duplicateDetectionData['PHK_3ES4'];
  if(mixed){
    mixed.non_duplicate_count = 1;
    mixed.candidate_count = 4;
  }
  const suspected = duplicateDetectionData['PHK_3ERY'];
  if(suspected){
    const items = JSON.parse(suspected.duplicate_items_json || '[]');
    suspected.duplicate_items_json = JSON.stringify(items.filter(x => x.duplicate_type === '疑似重复').slice(0, 1));
    suspected.suspected_count = 1;
    suspected.non_duplicate_count = 1;
    suspected.candidate_count = 2;
    suspected.summary = '发现 1 个疑似重复候选，标题或外形存在单项相似，尚不能判定为相同产品或同款产品。';
  }
  const clear = duplicateDetectionData['PHK_3ERV'];
  if(clear){
    clear.non_duplicate_count = 1;
    clear.candidate_count = 1;
    clear.summary = '本次未发现相同、同款或疑似重复产品。';
  }

  currentPage = 1;
  pageSize = 10;
  const pageSizeSelect = document.getElementById('pageSizeSelect');
  if(pageSizeSelect) pageSizeSelect.value = '10';

  // Demo data follows the recommended Skill output constraint: one concise evidence sentence.
  const conciseReasons={
    'PHK_3ES4':[
      '标题主体、外形主体一致；供应商编码及采购价整数部分一致。',
      '标题主体、外形主体一致；关键规格存在差异，未达到相同产品判定标准。',
      '图片召回命中，但候选图主体被遮挡，外形主体无法确认。'
    ],
    'PHK_3ERY':[
      '标题主体一致，但外形主体不一致。'
    ]
  };
  Object.entries(conciseReasons).forEach(([spu,reasons])=>{
    const d=duplicateDetectionData[spu];
    if(!d)return;
    let rows=[];try{rows=JSON.parse(d.duplicate_items_json||'[]')}catch(e){rows=[]}
    rows.forEach((x,i)=>{if(reasons[i])x.reason=reasons[i]});
    d.duplicate_items_json=JSON.stringify(rows);
  });

  // Keep generated demo candidates concise as well, matching the intended Skill contract.
  const originalMakeDemoDuplicateRecord=makeDemoDuplicateRecord;
  makeDemoDuplicateRecord=function(spu,a,b,c,d){
    const record=originalMakeDemoDuplicateRecord(spu,a,b,c,d);
    let rows=[];try{rows=JSON.parse(record.duplicate_items_json||'[]')}catch(e){rows=[]}
    rows.forEach(x=>{
      if(x.duplicate_type==='相同产品')x.reason='标题主体、外形主体一致；关键规格或供应商/采购价条件满足相同产品标准。';
      else if(x.duplicate_type==='同款产品')x.reason='标题主体、外形主体一致；关键规格存在差异，未达到相同产品判定标准。';
      else x.reason=x.image_judgement==='外形主体无法确认'?'标题主体相似，但图片信息不足，外形主体无法确认。':'标题或外形仅有一项相似，需进一步核实。';
    });
    record.duplicate_items_json=JSON.stringify(rows);
    return record;
  };
  // Backfill all existing demo result JSON so every candidate dialog uses the same field.
  Object.values(duplicateDetectionData).forEach(d=>{
    if(!d || !d.duplicate_items_json) return;
    let rows=[];
    try{rows=JSON.parse(d.duplicate_items_json||'[]');}catch(e){rows=[];}
    if(!Array.isArray(rows)) return;
    addBriefFields(rows);
    d.duplicate_items_json=JSON.stringify(rows);
  });

  // Add three extra candidates to the main mixed-result example. These are display-only rows:
  // they are deliberately not inserted into spuData and do not have product-detail navigation.
  const main=duplicateDetectionData['PHK_3ES4'];
  if(main){
    let rows=[];
    try{rows=JSON.parse(main.duplicate_items_json||'[]');}catch(e){rows=[];}
    const demoRows=[
      {
        duplicate_type:'相同产品',similar_spu:'PHK_3DMO01',similar_sku:'PHK_3DMO01QX5Q',
        similar_title:'新品 DL 9600BTU 静音移动空调 220-240V/50Hz WIFI 英规 ABS',
        similar_category:'家居、厨具、家装 > 制冷设备 > 移动空调',similar_image:'',demo_img_index:1,demo_only:true,
        recall_source:'标题+图片',title_judgement:'标题主体一致',image_judgement:'外形主体一致',
        reason_brief:'标题主体一致，外形主体一致，尺寸/重量/材质/功能基本一致',
        image_summary:'示例图片显示产品主体结构一致。',reason:'标题主体及外形主体一致，关键规格基本一致。',difference:'',suggestion:'建议核实后按相同产品规则处理。'
      },
      {
        duplicate_type:'同款产品',similar_spu:'PHK_3DMO02',similar_sku:'PHK_3DMO02QX5Q',
        similar_title:'新品 DL 9600BTU 静音移动空调 带制热 220-240V/50Hz 欧规 ABS',
        similar_category:'家居、厨具、家装 > 制冷设备 > 移动空调',similar_image:'',demo_img_index:2,demo_only:true,
        recall_source:'标题+图片',title_judgement:'标题主体一致',image_judgement:'外形主体一致',
        reason_brief:'标题主体一致，外形主体一致，供应商一致，采购价存在差异',
        image_summary:'示例图片显示产品主体结构一致。',reason:'标题主体及外形主体一致，供应商信息一致，采购价存在差异。',difference:'采购价存在差异。',suggestion:'建议人工确认是否合并保留，不直接删除。'
      },
      {
        duplicate_type:'疑似重复',similar_spu:'PHK_3DMO03',similar_sku:'PHK_3DMO03QX5Q',
        similar_title:'新品 DL 12000BTU 商用移动空调 高风量 220-240V/50Hz 欧规 ABS',
        similar_category:'家居、厨具、家装 > 制冷设备 > 移动空调',similar_image:'',demo_img_index:3,demo_only:true,
        recall_source:'图片',title_judgement:'标题主体不一致',image_judgement:'外形主体一致',
        reason_brief:'标题主体不一致，外形主体一致',
        image_summary:'示例图片显示产品外形主体相似。',reason:'标题主体不一致，但图片外形主体相似，需人工复核。',difference:'标题主体存在差异。',suggestion:'建议人工复核后再判断。'
      }
    ];
    demoRows.forEach(x=>{
      if(!rows.some(r=>r.similar_spu===x.similar_spu)) rows.push(x);
    });
    main.duplicate_items_json=JSON.stringify(rows);
    main.same_product_count=2;
    main.same_style_count=2;
    main.suspected_count=2;
    main.non_duplicate_count=1;
    main.candidate_count=7;
    main.summary='检测发现 2 个相同产品、2 个同款产品和 2 个疑似重复候选，另有 1 个非重复候选。';
  }
  const flowNote=document.querySelector('.duplicate-flow-note');
  if(flowNote){
    flowNote.textContent='重复品检测（拟接入）：商品创建完成后自动触发检测，Webhook 回传结果。后台区分任务状态与检测结论；检测结果悬浮查看候选数量，点击查看详情；「无需检测」悬浮查看未触发原因，不提供详情弹窗。所有交互均为模拟。';
  }

/* ---- 主示例候选补全字段级详细判断依据 ---- */
  const detailedReasons={
    'PHK_3DMO01':'标题主体一致（同为户外单人旋转蛋椅、钢架编藤，粗藤与细藤及 DLEC28 与 DLEC30 型号为规格差异）；外形主体一致（蛋形封闭拱顶椅壳、内置同心环加强、黑色金属四腿外撇支架、支腿与椅壳交接处藤条缠绕、无脚凳、米白坐垫+靠垫+两侧护垫四件套，实际读图比对一致）；供应商编码一致（SUP24081569417），采购价整数部分一致（495 vs 495），尺寸 97.5×78×34.5 对比 94×78×35、重量 27880 对比 27650（均在±5%内）、材质一致。',
    'PHK_3DMO02':'标题主体一致（同为钢架编藤户外单人蛋椅，站立式为底座功能差异）；外形主体一致（蛋形椅壳、黑色金属四腿外扩支架+横向连接环、无脚凳、米白四件套坐垫，实际读图比对一致）；供应商编码一致但采购价整数部分不一致（451 vs 495），重量超5%容差。',
    'PHK_3DMO03':'标题主体不一致（目标商品与候选商品的产品规格/功能描述存在差异）；外形主体一致（图片中的主体轮廓、支撑结构及主要部件相似，仍需人工核实是否为同一产品系列）；因标题与外形判断不一致，归为疑似重复，建议人工复核。'
  };
const mainDetail=duplicateDetectionData['PHK_3ES4'];
if(mainDetail){
  let rows=[];try{rows=JSON.parse(mainDetail.duplicate_items_json||'[]')}catch(e){}
  rows.forEach(x=>{if(detailedReasons[x.similar_spu])x.reason=detailedReasons[x.similar_spu]});
  mainDetail.duplicate_items_json=JSON.stringify(rows);
}

/* ========================= 三、函数定义（每个函数只保留一份最终实现） ========================= */

// 捕获其它模块的原始实现，供包装调用。
const baseRenderStats = renderStats;

/* ---- 检测状态模型：任务状态 / 业务结论双维度 ---- */
function detectionState(id){
 const d=duplicateDetectionData[id];
 if(d&&(d.eligibility_status==='EXCLUDED'||d.taskState==='not-applicable'))return 'not-applicable';
 const taskStatus=inferTaskStatus(d);
 if(taskStatus==='NOT_STARTED')return 'not-checked';
 if(taskStatus==='PROCESSING')return 'running';
 if(taskStatus==='FAILED')return 'failed';
 return resultKey(d)||'failed';
}
duplicateDetectionState=detectionState;
function inferTaskStatus(d){
 if(!d)return 'NOT_STARTED';
 if(d.eligibility_status==='EXCLUDED'||d.taskState==='not-applicable')return 'NOT_APPLICABLE';
 const known=['NOT_STARTED','PROCESSING','SUCCESS','FAILED'];
 if(known.includes(d.task_status))return d.task_status;
 const task=d.taskState||'';
 if(task==='not-checked'||(task==='pending'&&!d.taskId))return 'NOT_STARTED';
 if(['failed','timeout'].includes(task)||['无产品信息','查询失败'].includes(d.status))return 'FAILED';
 if(['queued','running','processing','submitted','created','pending'].includes(task))return 'PROCESSING';
 if(task==='completed'&&d.status==='已完成')return 'SUCCESS';
 return 'FAILED';
}
function inferResultStatus(d,taskStatus){
 if(taskStatus!=='SUCCESS')return '';
 if(Number(d?.same_product_count||0)>0)return 'DUPLICATE';
 if(Number(d?.same_style_count||0)>0)return 'SAME_STYLE';
 if(Number(d?.suspected_count||0)>0)return 'SUSPECTED';
 return 'NO_DUPLICATE';
}
function resultKey(d){
 const result=inferResultStatus(d,inferTaskStatus(d));
 return ({DUPLICATE:'duplicate',SAME_STYLE:'style',SUSPECTED:'suspected',NO_DUPLICATE:'clear'})[result]||null;
}

/* ---- 状态展示元数据 ---- */
  detectionResultMeta=function(state){
    const map={
      duplicate:['存在重复','badge-severity-duplicate'],
      style:['发现同款','badge-severity-style'],
      suspected:['疑似重复','badge-severity-suspected'],
      clear:['未发现重复','badge-success']
    };
    return map[state]||['',''];
  };
  detectionStatusMeta=function(state){
    return {
      'not-checked':['未检测','badge-info','立即检测'],
      'not-applicable':['无需检测','badge-muted',null],
      'running':['检测中','badge-primary',null],
      'failed':['检测失败','badge-process-failed','重新检测'],
      'duplicate':['存在重复','badge-severity-duplicate','重新检测'],
      'style':['发现同款','badge-severity-style','重新检测'],
      'suspected':['疑似重复','badge-severity-suspected','重新检测'],
      'clear':['未发现重复','badge-success','重新检测']
    }[state]||['检测失败','badge-process-failed','重新检测'];
  };

/* ---- 时间展示 ---- */
function dateText(value){
 if(!value)return '';
 if(typeof value==='number'){
  const d=new Date(value);if(Number.isNaN(d.getTime()))return String(value);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
 }
 return String(value).replace('T',' ').replace(/\.\d+Z?$/,'').replace(/Z$/,'').slice(0,16);
}
function nowText(){
 const d=new Date();
 return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}
function timeForModal(d,state){
 if(!d)return '';
 const value=state==='running'
  ? (d.started_at||d.submitted_at||d.created_at||d.detected_at)
  : (d.completed_at||d.failed_at||d.detected_at||d.updated_at||d.started_at||d.created_at);
 return dateText(value)||'时间待记录';
}

/* ---- 列表检测单元格 ---- */
  function excludedTooltip(id){
    const d=duplicateDetectionData[id]||{};
    const category=String(d.target_category||'');
    const reason=String(d.skip_reason||'');
    if(category.includes('地毯')||reason.includes('地毯')){
      return '该 SPU 属于地毯品类，不参与重复品检测';
    }
    return '该 SPU 命中检测排除规则，不参与重复品检测';
  }
  function resultCountTooltip(id){
    const d=duplicateDetectionData[id]||{};
    const parts=[
      ['相同','same_product_count'],
      ['同款','same_style_count'],
      ['疑似','suspected_count']
    ].map(([label,key])=>{
      const count=Number(d[key]||0);
      return count>0?`${label} ${count}`:'';
    }).filter(Boolean);
    return parts.join(' · ');
  }
  duplicateDetectionCell=function(item){
    const state=detectionState(item.id);
    let statusMarkup='';
    let stateLabel='';

    if(state==='running'){
      stateLabel='检测中';
      statusMarkup='<span class="dup-loading-state"><span class="dup-spinner" aria-hidden="true"></span>检测中</span>';
    }else if(['duplicate','style','suspected','clear'].includes(state)){
      const [label,klass]=detectionResultMeta(state);
      stateLabel=label;
      statusMarkup=`<span class="badge detection-badge ${klass}">${label}</span>`;
    }else{
      const [label,klass]=detectionStatusMeta(state);
      stateLabel=label;
      statusMarkup=`<span class="badge detection-badge ${klass}">${label}</span>`;
    }

    const safeId=escapeHtml(item.id);
    const safeState=escapeHtml(stateLabel);

    // Excluded SPUs are informational only: hover for the reason, with no click or modal.
    if(state==='not-applicable'){
      const tip=escapeHtml(excludedTooltip(item.id));
      return `<div class="detection-cell detection-cell-tooltipable" title="${tip}" aria-label="无需检测：${tip}">${statusMarkup}</div>`;
    }

    // Only positive candidate categories are listed; clear results keep the list uncluttered.
    const countTip=['duplicate','style','suspected'].includes(state)?resultCountTooltip(item.id):'';
    const title=escapeHtml(countTip||'点击查看检测详情');
    return `<div class="detection-cell detection-cell-clickable" role="button" tabindex="0"
      aria-label="查看 ${safeId} 的重复品检测详情，当前状态：${safeState}"
      title="${title}"
      onclick="openDuplicateDetection('${safeId}')"
      onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openDuplicateDetection('${safeId}')}">
      ${statusMarkup}
    </div>`;
  };

/* ---- 统计与列表渲染 ---- */
renderStats=function(total){
  baseRenderStats(total);
    const states=spuData.map(x=>detectionState(x.id));
    const count=state=>states.filter(x=>x===state).length;
    const values={
      detectionPendingCount:count('not-checked'),
      detectionRunningCount:count('running'),
      detectionDuplicateCount:count('duplicate'),
      detectionStyleCount:count('style'),
      detectionSuspectedCount:count('suspected'),
      detectionClearCount:count('clear'),
      detectionFailedCount:count('failed'),
      detectionExcludedCount:count('not-applicable')
    };
    Object.entries(values).forEach(([id,value])=>{const node=document.getElementById(id);if(node)node.textContent=value;});
};
renderTable=function(){
  const currentRows=[...spuData];
  spuData.splice(0,spuData.length,...displayRows);
  try{
 const q=(document.getElementById('searchInput').value||'').toLowerCase().trim();
 const f=document.getElementById('statusFilter').value;
 const df=document.getElementById('detectionFilter')?.value||'all';
 const chosen=spuData.filter(x=>{
  const base=(x.id+' '+x.title+' '+x.region).toLowerCase().includes(q)&&(f==='all'||x.status===f);
  return base&&(df==='all'||detectionState(x.id)===df);
 });
 const pages=Math.max(1,Math.ceil(chosen.length/pageSize));currentPage=Math.min(Math.max(1,currentPage),pages);
 const rows=chosen.slice((currentPage-1)*pageSize,currentPage*pageSize);
 document.getElementById('spuTbody').innerHTML=rows.length?rows.map(x=>`<tr>
   <td><button class="btn-text" onclick="navigateToProduct('${x.id}')">详情</button></td>
   <td><img class="product-thumb" src="${thumbs[x.img]}" alt="产品主图示意"></td>
   <td><a class="spu-link" href="javascript:void(0)" onclick="navigateToProduct('${x.id}')">${x.id}</a></td>
   <td><div class="title-text" title="${escapeHtml(x.title)}">${escapeHtml(x.title)}</div><div class="small-note" style="text-align:left;margin-top:3px">适用范围：${escapeHtml(x.region)}</div></td>
   <td><span class="pass">● 产品审核通过</span></td>
   <td>${duplicateDetectionCell(x)}</td>
   <td><div class="state-cell"><span class="badge ${badgeClass(x.status)}">${statusText(x.status)}</span>${x.group?`<span class="small-note">${Math.max(0,(groupInfo[x.group]?.members||[]).length-1)} 个关联版本 · ${x.group}</span>`:x.status==='candidate'?`<span class="small-note">${x.candidates.length} 条待确认建议</span>`:'<span class="small-note">—</span>'}</div></td>
   <td><div class="op-stack">${rowOperation(x)}</div></td>
   <td><span class="score">◎ ${x.score}</span></td><td>${x.purchase}</td><td>${x.prices}</td><td class="profit">${x.profit}</td><td class="profit">${x.profit}</td>
  </tr>`).join(''):'<tr><td colspan="13"><div class="empty">没有找到符合条件的 SPU</div></td></tr>';
 document.getElementById('prevPage').disabled=currentPage<=1;
 document.getElementById('nextPage').disabled=currentPage>=pages;
 document.getElementById('currentPageBtn').textContent=currentPage+' / '+pages;
 renderStats(chosen.length);
   if(activeProductSpu)syncProductDetection(activeProductSpu);
  }finally{
   spuData.splice(0,spuData.length,...currentRows);
  }
};

/* ---- 弹窗：报告 / 异常 / 手动检测 / Webhook ---- */
function detectionModalFooter(id,mode){
 const buttons=[];
 if(mode==='running'){
  if(String(duplicateDetectionData[id]?.taskId||'').startsWith('UI-DEMO-')){
   buttons.push(`<button class="btn-small" onclick="simulateWebhook('${id}','success')">模拟 Webhook 成功</button>`);
   buttons.push(`<button class="btn-small" onclick="simulateWebhook('${id}','failed')">模拟 Webhook 失败</button>`);
  }
 }else{
  buttons.push(`<button class="btn-primary btn-small" onclick="requestManualDetection('${id}')">${mode==='not-checked'?'立即检测':'重新检测'}</button>`);
 }

buttons.unshift('<button class="btn-small" onclick="closeModal()">关闭</button>');
 return `<div class="modal-actions">${buttons.join('')}</div>`;
}
  renderDetectionTarget=function(item,d){
    const state=detectionState(item.id);
    const completed=['duplicate','style','suspected','clear'].includes(state);
    const sku=escapeHtml(completed?(d?.target_sku||'-'):'-');
    const title=escapeHtml(d?.target_title||item.title);
    const img=thumbs[item.img]||'';
    const sectionTitle=state==='not-applicable'?'商品信息':'检测商品';
    return `<div class="dup-table-section-label dup-target-label">${sectionTitle}</div><div class="dup-table-wrap"><table class="dup-candidates-table dup-target-table">
      <colgroup><col style="width:14%"><col style="width:18%"><col style="width:10%"><col style="width:58%"></colgroup>
      <thead><tr><th>SPU</th><th>代表 SKU</th><th>主图</th><th>产品标题</th></tr></thead>
      <tbody><tr><td><span class="dup-spu-strong">${escapeHtml(item.id)}</span></td><td class="dup-sku-col">${sku}</td><td class="dup-photo-col"><img class="dup-candidate-row-img" src="${escapeHtml(img)}" alt="商品主图"></td><td class="dup-title-col">${title}</td></tr></tbody>
    </table></div>`;
  };
  completedReportHead=function(d,state){
    const [label,klass]=detectionResultMeta(state);
    return `<div class="dup-report-head"><span class="badge ${klass}">${label}</span><span class="small-note">检测时间：${escapeHtml(timeForModal(d,state))}</span></div>`;
  };
  function fullReasonMarkup(x){
    const full=String(x.reason||x.difference||x.reason_brief||'暂无详细判断依据');
    return `<span class="dup-reason-hover" tabindex="0" title="悬浮查看完整判断依据" data-full-reason="${escapeHtml(full)}">${escapeHtml(full)}</span>`;
  }
  function rulesReference(){
    const rules=[
      ['标题主体一致 + 外形主体一致 + 供应商编码一致 + 采购价整数部分一致','相同产品','same','供应商和采购价一致，基本可认为是同一产品。'],
      ['标题主体一致 + 外形主体一致 + 尺寸/重量/材质/功能基本一致','相同产品','same','关键规格字段基本一致，基本可认为是同一产品。'],
      ['标题主体一致 + 外形主体一致，但供应商/采购价、尺寸/重量/材质/功能均未达到相同产品判断标准','同款产品','style','标题和外形一致，但未满足相同产品条件，按同款产品处理。'],
      ['标题主体一致 + 外形主体不一致','疑似重复','suspected','标题主体一致，但外形不一致，需人工复核。'],
      ['标题主体一致 + 外形主体无法确认','疑似重复','suspected','标题主体一致，但图片不足以确认外形，需人工复核。'],
      ['标题主体不一致 + 外形主体一致','疑似重复','suspected','外形主体一致，但标题主体不一致，需人工复核。'],
      ['标题主体不一致 + 外形主体不一致','非重复','none','标题和外形均不同。'],
      ['标题主体不一致 + 外形主体无法确认','非重复','none','标题主体不一致，且图片无法提供有效相似依据。'],
      ['标题主体无法比较 + 外形主体一致','疑似重复','suspected','仅输入图片时，标题无法参与判断，最多判为疑似重复，需人工复核。'],
      ['标题主体无法比较 + 外形主体不一致','非重复','none','仅输入图片，且外形主体不一致。'],
      ['标题主体无法比较 + 外形主体无法确认','非重复','none','仅输入图片，且外形无法确认，无有效相似依据。']
    ];
    const body=rules.map(([condition,result,kind,note])=>`<tr><td>${condition}</td><td><span class="dup-rule-tag ${kind}">${result}</span></td><td>${note}</td></tr>`).join('');
    return `<details class="dup-rule-reference"><summary>重复品判断规则参考</summary><div class="dup-rule-content"><p class="dup-rule-intro">以下为系统判断口径，供业务人员理解检测结果和人工复核时参考；候选商品的具体判断依据以表格中的详细说明为准。</p><div class="dup-rule-table-wrap"><table class="dup-rule-table"><thead><tr><th>判断条件</th><th>判定结果</th><th>说明</th></tr></thead><tbody>${body}</tbody></table></div></div></details>`;
  }
  renderAllDuplicateCandidates=function(rows){
    const priority={'相同产品':0,'同款产品':1,'疑似重复':2};
    const klass={'相同产品':'duplicate','同款产品':'style','疑似重复':'suspected'};
    const body=[...rows].sort((a,b)=>(priority[a.duplicate_type]??5)-(priority[b.duplicate_type]??5)).map(x=>{
      const y=getSpu(x.similar_spu);
      const img=x.similar_image&&/^https?:\/\//.test(x.similar_image)?x.similar_image:thumbs[y?.img ?? x.demo_img_index ?? 0];
      const code=escapeHtml(x.similar_spu||'');
      const spuMarkup=x.demo_only?`<span class="dup-spu-static">${code||'-'}</span>`:`<a class="spu-link" href="javascript:void(0)" onclick="openDuplicateCandidate('${code}')">${code||'-'}</a>`;
      return `<tr>
        <td class="dup-result-first-col"><span class="dup-result-tag ${klass[x.duplicate_type]||''}">${escapeHtml(x.duplicate_type||'—')}</span></td>
        <td>${spuMarkup}</td>
        <td class="dup-sku-col">${escapeHtml(x.similar_sku||'-')}</td>
        <td class="dup-photo-col">${img?`<img class="dup-candidate-row-img" src="${escapeHtml(img)}" alt="候选商品图" onerror="this.style.display='none'">`:'—'}</td>
        <td class="dup-title-col">${escapeHtml(x.similar_title||'-')}</td>
        <td class="dup-reason-col">${fullReasonMarkup(x)}</td>
      </tr>`;
    }).join('');
    return `<div class="dup-table-section-label">检测候选商品</div><div class="dup-table-wrap dup-all-list"><table class="dup-candidates-table">
      <colgroup><col style="width:12%"><col style="width:13%"><col style="width:16%"><col style="width:9%"><col style="width:22%"><col style="width:28%"></colgroup>
      <thead><tr><th>检测结果</th><th>SPU</th><th>代表 SKU</th><th>主图</th><th>产品标题</th><th>判断依据</th></tr></thead>
      <tbody>${body}</tbody></table></div>`;
  };
renderDuplicateReportBody=function(){
    const item=getSpu(duplicateModalSpu);if(!item)return;
    const d=duplicateDetectionData[duplicateModalSpu];if(!d)return;
    let items=[];
    try{items=JSON.parse(d.duplicate_items_json||'[]');if(!Array.isArray(items))items=[]}catch(e){items=[]}
    const state=detectionState(item.id);
    const content=items.length
      ? renderAllDuplicateCandidates(items)
      : '<div class="dup-zero"><div class="dup-zero-icon">✓</div><h4>本次未发现重复产品</h4><p>本次检测未发现相同、同款或疑似重复产品。</p></div>';
    const head=completedReportHead(d,state);
    document.getElementById('modalBody').innerHTML=head+renderDetectionTarget(item,d)+content;
  const body=document.getElementById('modalBody');
  if(!body||body.querySelector('.dup-rule-reference'))return;
  // 规则参考只在检测完成的报告中出现，失败 / 检测中 / 零候选状态不追加。
  if(body.querySelector('.dup-candidates-table')) body.insertAdjacentHTML('beforeend',rulesReference());
};
openDuplicateDetection=function(id){
  if(detectionState(id)==='not-applicable')return;
    const item=getSpu(id);if(!item)return;
    const d=duplicateDetectionData[id]||null;
    const state=detectionState(id);
    if(state==='not-checked'){
      const body=`<div class="dup-report-head"><span class="badge badge-info">未检测</span></div>${renderDetectionTarget(item,d)}<div class="dup-report-summary">当前 SPU 尚未执行重复品检测，可在本详情弹窗点击「立即检测」。</div>`;
      showModal('重复品检测 · 未检测',body,detectionModalFooter(id,'not-checked'),false);return;
    }
    if(state==='running'){
      const time=timeForModal(d,state);
      const body=`<div class="dup-report-head"><span class="badge badge-primary"><span class="dup-spinner" aria-hidden="true" style="vertical-align:-2px;margin-right:4px"></span>检测中</span><span class="small-note">发起时间：${escapeHtml(time)}</span></div>${renderDetectionTarget(item,d)}<div class="dup-report-summary">检测任务正在执行，结果尚未返回；包含排队、Agent 执行及 ERP 回调保存过程。本次任务完成前不能重复提交。</div>`;
      showModal('重复品检测 · 任务详情',body,detectionModalFooter(id,'running'),false);return;
    }
    if(d && d.status==='无产品信息'){
      const time=timeForModal(d,state);
      const body=`<div class="dup-report-head"><span class="badge badge-process-failed">检测失败</span><span class="small-note">检测时间：${escapeHtml(time)}</span></div>${renderDetectionTarget(item,d)}<div class="dup-exception">无法获取该商品的产品信息，检测失败。</div>`;
      showModal('重复品检测 · 无产品信息',body,detectionModalFooter(id,'failed'),false);return;
    }
    if(state==='failed'){
      const time=timeForModal(d,state);
      const body=`<div class="dup-report-head"><span class="badge badge-process-failed">检测失败</span><span class="small-note">检测时间：${escapeHtml(time)}</span></div>${renderDetectionTarget(item,d)}<div class="dup-exception">本次检测未能正常完成，未生成有效检测结论。可以稍后重新检测。</div>`;
      showModal('重复品检测 · 检测失败',body,detectionModalFooter(id,'failed'),false);return;
    }
    duplicateModalSpu=id;duplicateModalTab='';
    showModal('重复品检测报告','<div class="empty">正在读取结果…</div>',detectionModalFooter(id,'completed'),true);
    renderDuplicateReportBody();
  };
function requestManualDetection(id){
  if(detectionState(id)==='not-applicable'){
    toast('该 SPU 命中检测排除规则，无需发起检测');
    openDuplicateDetection(id);return;
  }
 const item=getSpu(id);if(!item)return;
 const state=detectionState(id);
 if(state==='running') {toast('当前 SPU 已有检测中任务，无需重复提交');openDuplicateDetection(id);return;}
 const action=state==='not-checked'?'立即检测':'重新检测';
 const text=state==='not-checked'?'当前商品尚未检测。本次将为该 SPU 创建一条新的 AI 检测任务。':'本次将重新调用 AI Skill，并创建一条新检测任务；历史任务及原报告仍会保留。';
 const body=`<div class="dup-report-head"><span class="badge badge-info">${action}</span></div>${renderDetectionTarget(item,duplicateDetectionData[id])}<div class="manual-confirm"><strong>确认${action}？</strong><div>${text}</div><div class="dup-disclaimer">正式系统建议为有权限的开发开放该操作；同一 SPU 检测中时不重复创建任务。此原型不会真正调用 Agent。</div></div>`;
 const footer=`<button onclick="openDuplicateDetection('${id}')">取消</button><button class="btn-primary" onclick="confirmManualDetection('${id}')">确认${action}</button>`;
 showModal('重复品检测 · '+action,body,footer,false);
}
function confirmManualDetection(id){
 const item=getSpu(id);if(!item)return;
 if(detectionState(id)==='running'){toast('当前已有检测任务，请勿重复发起');openDuplicateDetection(id);return;}
 const previous=duplicateDetectionData[id];
 if(previous?.taskId){
  duplicateTaskHistory[id]??=[];
  if(!duplicateTaskHistory[id].some(x=>x.taskId===previous.taskId))duplicateTaskHistory[id].unshift(JSON.parse(JSON.stringify(previous)));
 }
 manualReturnTemplate[id]=previous&&previous.status==='已完成'?JSON.parse(JSON.stringify(previous)):makeDemoDuplicateRecord(id,0,0,0,2);
 const taskId='UI-DEMO-'+String(duplicateDemoSerial++).padStart(4,'0');
 duplicateDetectionData[id]={taskState:'running',taskId,status:'',is_duplicate:'',target_spu:id,target_sku:detailSkuCode(item),target_title:item.title,summary:'由用户手动发起的新检测任务，等待模拟回调。',trigger_type:previous?'MANUAL_RECHECK':'MANUAL_FIRST'};
 closeModal();renderTable();openDuplicateDetection(id);toast('模拟任务已创建：'+taskId);
 const d=duplicateDetectionData[id];
 if(d&&d.taskState==='running'){
  d.started_at=nowText();d.detected_at=d.started_at;d.task_status='PROCESSING';d.result_status='';
  renderTable();openDuplicateDetection(id);
 }
}
function simulateWebhook(id,kind){
 const d=duplicateDetectionData[id];if(!d||detectionState(id)!=='running'||!String(d.taskId||'').startsWith('UI-DEMO-'))return;
 const item=getSpu(id);const savedId=d.taskId;
 if(kind==='failed'){
  duplicateDetectionData[id]={...d,taskState:'failed',status:'查询失败',is_duplicate:'',error_message:'（模拟）AI 平台未返回有效结果，人工触发的任务执行失败。'};
 }else{
  const template=manualReturnTemplate[id]||makeDemoDuplicateRecord(id,0,0,0,2);
  duplicateDetectionData[id]={...JSON.parse(JSON.stringify(template)),taskState:'completed',taskId:savedId,status:'已完成',target_spu:id,target_sku:detailSkuCode(item),target_title:item.title,trigger_type:'MANUAL',summary:template.summary||'（模拟）检测完成。'};
 }
 duplicateTaskHistory[id]??=[];
 duplicateTaskHistory[id].unshift(JSON.parse(JSON.stringify(duplicateDetectionData[id])));
 closeModal();renderTable();openDuplicateDetection(id);toast('模拟 Webhook 已返回，任务已更新');
  const d2=duplicateDetectionData[id];if(!d2)return;
  const time=nowText();
  d2.detected_at=time;
  if(d2.taskState==='completed'&&d2.status==='已完成'){
    d2.completed_at=time;d2.task_status='SUCCESS';d2.result_status=inferResultStatus(d2,'SUCCESS');
  }else if(d2.taskState==='failed'||d2.status==='查询失败'||d2.status==='无产品信息'){
    d2.failed_at=time;d2.task_status='FAILED';d2.result_status='';
  }
  renderTable();openDuplicateDetection(id);
}
function openDuplicateCandidate(spu){
 const x=getSpu(spu);if(x){closeModal();navigateToProduct(spu)}
 else toast('候选 SPU 不在当前项目模拟列表中：'+spu);
}

/* ---- 产品详情页检测条 ---- */
syncProductDetection=function(id){
  const state=detectionState(id);
  const badge=document.getElementById('productDupState');
  const action=document.getElementById('productDupAction');
  if(!badge||!action)return;
  const meta=detectionStatusMeta(state);
  if(state==='running') badge.innerHTML='<span class="dup-spinner" aria-hidden="true" style="vertical-align:-2px;margin-right:5px"></span>检测中';
  else badge.textContent=meta[0];
  badge.className='badge '+meta[1];
  if(state==='not-applicable'){
    action.hidden=true;
    const info=badge.closest('.dup-product-strip-info');
    if(info){
      let note=info.querySelector('.dup-not-applicable-note');
      if(!note){note=document.createElement('span');note.className='small-note dup-not-applicable-note';note.textContent='该商品命中排除规则';info.appendChild(note);}
    }
  }else{
    action.hidden=false;
    action.textContent=state==='not-checked'?'立即检测':'重新检测';
    action.disabled=state==='running';
    action.title=state==='running'?'当前 SPU 有检测任务进行中':'';
  }
  // 命中排除规则的商品：隐藏「查看详情」，并在状态徽标上悬浮展示未触发原因。
  const strip=document.querySelector('.dup-product-strip');
  if(!strip)return;
  const excluded=state==='not-applicable';
  const detailButton=strip.querySelector('.dup-product-strip-actions button:first-child');
  if(detailButton) detailButton.hidden=excluded;
  if(excluded) badge.title=excludedTooltip(id);
  else badge.removeAttribute('title');
};
const baseRenderProductDetail=renderProductDetail;
renderProductDetail=function(id){baseRenderProductDetail(id);syncProductDetection(id)};

/* ---- 候选字段补齐 ---- */
  function addBriefFields(rows){
    rows.forEach(x=>{
      if(!x.title_judgement){
        const raw=String(x.reason||'');
        x.title_judgement=raw.includes('标题主体不一致')?'标题主体不一致':raw.includes('标题主体相似')?'标题主体相似':'标题主体一致';
      }
      if(!x.image_judgement) x.image_judgement='外形主体无法确认';
      if(!x.reason_brief){
        const parts=[x.title_judgement,x.image_judgement];
        if(x.duplicate_type==='相同产品') parts.push('供应商/采购价一致');
        else if(x.duplicate_type==='同款产品') parts.push('尺寸/重量/材质/功能存在差异');
        x.reason_brief=parts.join('，');
      }
    });
  }

/* ========================= 四、初始化（加载完成时执行一次） ========================= */
renderTable();
if(activeProductSpu) syncProductDetection(activeProductSpu);
