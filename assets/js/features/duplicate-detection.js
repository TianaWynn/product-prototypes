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
    'PHK_3EPC', // 存在重复（45 个候选的大数据量示例）
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
    suspected.summary = '发现 1 个疑似重复项，标题或外形存在单项相似，尚不能判定为相同产品或同款产品。';
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

  /* ---- 判断依据：按维度拆成短标签（不再拼成一整段长句） ----
     原来五个维度用「；」连成一段话，一列放不下、也看不出到底差在哪。
     现在每个维度一个短标签：对上的用淡灰短词，没对上的用橙色并直接带差异值；
     完整说明（含型号、价格、比例）放进悬浮，逐行展示。
     结论句不再重复写进依据 —— 表格「检测结果」列已经给了。 */
  function titleFacts(title){
    const t=String(title||'');
    const btu=(t.match(/(\d{4,5})\s*BTU/i)||[])[1]||'';
    const volt=(t.match(/(\d{2,3}(?:\s*-\s*\d{2,3})?\s*V\s*\/?\s*\d{2,3}(?:\s*-\s*\d{2,3})?\s*Hz)/i)||[])[1]||'';
    const model=(t.match(/TAC-[A-Za-z0-9\/()+.\-]+/i)||[])[0]||'';
    const std=(t.match(/(英规|欧规|美规|日规|韩规|澳规)/)||[])[1]||'';
    const material=(t.match(/(ABS|PP|PC|不锈钢|铝合金|塑胶|金属|木质|藤编|布艺)/)||[])[1]||'';
    // 功能词先归一化（「带制热」「制冷制热」都记作「制热」），避免同一能力重复列出。
    const featDefs=[['带制热','制热'],['制冷制热','制热'],['单制冷','单制冷'],['WIFI','WIFI'],['A++','A++'],['带前数显','前数显'],['静音','静音'],['智能','智能'],['商用','商用'],['高风量','高风量']];
    const feats=[...new Set(featDefs.filter(([k])=>t.includes(k)).map(([,v])=>v))];
    return {btu,volt,model,std,material,feats};
  }
  function priceNum(v){const m=String(v==null?'':v).match(/\d+(?:\.\d+)?/);return m?Number(m[0]):NaN;}
  function diffPct(a,b){if(!isFinite(a)||!isFinite(b))return NaN;const base=Math.max(Math.abs(a),Math.abs(b));return base?Math.abs(a-b)/base*100:NaN;}
  /* 判断依据按「维度」拆行，最多 4 行：
       1 标题主体 / 2 外形主体 / 3 供应商+采购价（仅相同、同款）/ 4 尺寸重量材质功能（仅相同、同款）
     疑似重复在 skill 里只判到「标题 + 外形」两层，不判采购价与关键规格，所以只有 2 行。
     每行在页面上单行展示，超长打省略号，悬浮看全文。 */
  function buildReasonLines(target,cand,type){
    const t1=String(target?.title||''),t2=String(cand?.title||cand?.similar_title||'');
    const a=titleFacts(t1),b=titleFacts(t2);
    const pa=priceNum(target?.purchase),pb=priceNum(cand?.purchase);
    const psa=priceText(target?.purchase),psb=priceText(cand?.purchase);
    const regA=String(target?.region||''),regB=String(cand?.region||'');
    const sameVolt=!!a.volt&&!!b.volt&&a.volt.replace(/\s/g,'')===b.volt.replace(/\s/g,'');
    const sameModel=!!a.model&&!!b.model&&a.model.toUpperCase()===b.model.toUpperCase();
    const catA=titleCat(t1),catB=titleCat(t2);
    const sameCat=!!catA&&!!catB&&catA===catB;
    const supA=supplierCode(t1),supB=supplierCode(t2);
    const intA=isFinite(pa)?Math.floor(pa):NaN,intB=isFinite(pb)?Math.floor(pb):NaN;
    const sameSup=supA===supB;
    const onlyA=a.feats.filter(f=>!b.feats.includes(f));
    const onlyB=b.feats.filter(f=>!a.feats.includes(f));
    const lines=[];

    // 1) 标题主体
    if(sameCat){
      const sameBtu=!!a.btu&&a.btu===b.btu;
      const core=(sameBtu?a.btu+'BTU':'')+catA;
      const d=[];
      if(a.btu&&b.btu&&!sameBtu)d.push('制冷量'+a.btu+'BTU与'+b.btu+'BTU不同');
      if(a.model&&b.model&&!sameModel)d.push('型号'+a.model+'与'+b.model+'差异');
      if(a.volt&&b.volt&&!sameVolt)d.push('电压'+a.volt+'与'+b.volt+'不同');
      if(onlyA.length||onlyB.length){
        const seg=[];
        if(onlyA.length)seg.push('缺少'+onlyA.join('/'));
        if(onlyB.length)seg.push('独有'+onlyB.join('/'));
        d.push('功能描述'+seg.join('、'));
      }
      lines.push('标题主体一致：均为'+core+(d.length?'，'+d.join('，')+'，核心未变':'，标题描述一致')+'。');
    }else{
      lines.push('标题主体不一致：目标为'+(catA||'—')+'，候选为'+(catB||'—')+'，核心产品对象不同。');
    }

    // 2) 外形主体
    const imgJudge=String(cand?.image_judgement||'');
    const imgWhy=String(cand?.image_summary||'').trim();
    if(/无法确认/.test(imgJudge)){
      lines.push('外形主体无法确认：'+(imgWhy||'候选主图主体被遮挡或清晰度不足，无法读图比对')+'。');
    }else if(/不一致/.test(imgJudge)){
      lines.push('外形主体不一致：'+(imgWhy||'目标图与候选图的产品主体结构、部件组成不同')+'。');
    }else{
      lines.push('外形主体一致：实读图片可见'+outlineText(catA)+'一致。');
    }

    // 疑似重复只判到这一步，skill 不判断采购价与关键规格
    if(type==='疑似重复')return lines.join('\n');

    // 3) 相同产品：命中条件组A（供应商/采购价）或条件组B（关键规格）
    if(type==='相同产品'){
      lines.push(sameSup
        ? '供应商编码均为'+supA+'，采购价整数部分均为'+intA+'，符合相同产品判断依据。'
        : '供应商编码'+supA+'与'+supB+'不同，但尺寸、重量、材质、功能基本一致，符合相同产品判断依据。');
      return lines.join('\n');
    }

    // 3) 同款产品：条件组A未命中
    const segA=['供应商编码'+supA+' vs '+supB];
    segA.push('采购价'+psa+' vs '+psb+(isFinite(intA)&&isFinite(intB)?'（整数部分'+intA+' vs '+intB+'）':''));
    lines.push(segA.join('，')+'，未满足供应商/采购价一致条件。');

    // 4) 同款产品：条件组B的具体差异
    const d=[];
    if(a.material&&b.material&&a.material!==b.material)d.push('材质'+a.material+' vs '+b.material);
    if(onlyA.length)d.push('缺少'+onlyA.join('/')+'功能');
    if(onlyB.length)d.push('独有'+onlyB.join('/')+'功能');
    if(a.volt&&b.volt&&!sameVolt)d.push('电压'+a.volt+' vs '+b.volt);
    if(regA!==regB)d.push('区域'+stdShort(regA)+' vs '+stdShort(regB));
    lines.push('尺寸、重量、材质、功能存在差异：'+(d.length?d.join('，'):'关键规格未达到相同产品标准')+'，未达相同产品标准。');
    return lines.join('\n');
  }
  // 外形比对时用来描述的部件口径
  function outlineText(cat){
    if(cat==='移动空调')return '立式机身、顶部出风口、前数显面板和底座轮组布局';
    if(cat==='空调扇'||cat==='冷风扇')return '机身轮廓、出风口和脚轮布局';
    return '产品主体结构、主要部件组成与安装连接方式';
  }
  // 供应商编码：演示数据没有该字段，按型号系列稳定派生，保证同一 SPU 每次一致。
  function supplierCode(title){
    const m=String(title||'').match(/([A-Z]{2,4})-(\d{2})/i);
    const key=m?(m[1]+'-'+m[2]).toUpperCase():String(title||'').slice(0,12);
    let h=0;
    for(let i=0;i<key.length;i++)h=(h*31+key.charCodeAt(i))>>>0;
    return 'SUP'+(24080000000+(h%9999999));
  }
  // 品类词：判断「是不是同一款型」用，比 BTU 更能代表标题主体。
  function titleCat(t){
    const list=['移动空调','空调扇','冷风扇','除湿机','电风扇','取暖器','加湿器'];
    return list.find(k=>String(t||'').includes(k))||'';
  }
  // 区域串里取制式（英国 / 英规 → 英规），标签才放得下。
  function stdShort(v){
    const m=String(v||'').match(/(美规|欧规|英规|日规|韩规|澳规)/);
    return m?m[1]:String(v||'—');
  }
  // 采购价在数据里是四位小数，展示时统一两位，悬浮里不出现 1360.7965 这种原始值。
  function priceText(v){
    const s=String(v==null?'':v).trim();
    if(!s)return '—';
    const m=s.match(/^([\d.]+)\s*[-~]\s*([\d.]+)$/);
    if(m)return Number(m[1]).toFixed(2)+'~'+Number(m[2]).toFixed(2);
    const n=Number(s);
    return isFinite(n)?n.toFixed(2):s;
  }
  function applyDetailedReasons(spuId,record){
    if(!record||!record.duplicate_items_json)return record;
    let rows=[];try{rows=JSON.parse(record.duplicate_items_json||'[]')}catch(e){return record}
    if(!Array.isArray(rows)||!rows.length)return record;
    const target=getSpu(spuId);
    rows.forEach(x=>{
      // 标题以明细里返回的 similar_title 为准（表格展示的就是它），其余字段从 SPU 补。
      const spu=getSpu(x.similar_spu)||{};
      const cand={
        title:x.similar_title||spu.title,
        purchase:spu.purchase||x.purchase,
        region:spu.region||x.region,
        image_judgement:x.image_judgement,
        image_summary:x.image_summary
      };
      x.reason=buildReasonLines(target,cand,x.duplicate_type);
      delete x.reason_items;
    });
    record.duplicate_items_json=JSON.stringify(rows);
    return record;
  }
  // 生成新演示结果时也走同一套详细依据。
  const originalMakeDemoDuplicateRecord=makeDemoDuplicateRecord;
  makeDemoDuplicateRecord=function(spu,a,b,c,d){
    return applyDetailedReasons(spu,originalMakeDemoDuplicateRecord(spu,a,b,c,d));
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
        region:'英国 / 英规',purchase:'1360.7965',
        similar_category:'家居、厨具、家装 > 制冷设备 > 移动空调',similar_image:'',demo_img_index:1,demo_only:true,
        recall_source:'标题+图片',title_judgement:'标题主体一致',image_judgement:'外形主体一致',
        reason_brief:'标题主体一致，外形主体一致，尺寸/重量/材质/功能基本一致',
        image_summary:'示例图片显示产品主体结构一致。',reason:'标题主体及外形主体一致，关键规格基本一致。',difference:'',suggestion:'建议核实后按相同产品规则处理。'
      },
      {
        duplicate_type:'同款产品',similar_spu:'PHK_3DMO02',similar_sku:'PHK_3DMO02QX5Q',
        similar_title:'新品 DL 9600BTU 静音移动空调 带制热 220-240V/50Hz 欧规 ABS',
        region:'德国 / 欧规',purchase:'1245.3000',
        similar_category:'家居、厨具、家装 > 制冷设备 > 移动空调',similar_image:'',demo_img_index:2,demo_only:true,
        recall_source:'标题+图片',title_judgement:'标题主体一致',image_judgement:'外形主体一致',
        reason_brief:'标题主体一致，外形主体一致，供应商一致，采购价存在差异',
        image_summary:'示例图片显示产品主体结构一致。',reason:'标题主体及外形主体一致，供应商信息一致，采购价存在差异。',difference:'采购价存在差异。',suggestion:'建议人工确认是否合并保留，不直接删除。'
      },
      {
        duplicate_type:'疑似重复',similar_spu:'PHK_3DMO03',similar_sku:'PHK_3DMO03QX5Q',
        similar_title:'新品 DL 12000BTU 商用移动空调 高风量 220-240V/50Hz 欧规 ABS',
        region:'欧洲 / 欧规',purchase:'1488.9000',
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
    main.summary='检测发现 2 个相同产品、2 个同款产品和 2 个疑似重复项，另有 1 个非重复项。';
  }
  /* ---- 大数据量示例：单个 SPU 检出 45 个候选（模拟数据，用于验证弹窗在候选较多时的展示） ---- */
  const bulkTarget = allSpuRows.find(x => x.id === 'PHK_3EPC');
  if(bulkTarget){
    const btuPool=['9600','9600','12000','12000','9000','12000','9600','12000'];
    const stdPool=['欧规','英规','美规','日规','澳规','韩规'];
    const regionPool=['德国 / 欧规','英国 / 英规','法国 / 欧规','意大利 / 欧规','美国 / 美规','日本 / 日规','澳洲 / 澳规','韩国 / 韩规'];
    const featPool=['单制冷','带制热','WIFI','A++','带前数显','商用','高风量','智能'];
    const pricePool=[1488.9,1420.5,1365.8,1512.3,1288.4,1476.2,1398.7,1530.6];
    const modelPool=['TAC-12CHPB/DM7','TAC-09CPB','TAC-12CPB/DM8','TAC-09CHPB/DM7(A+)'];
    const rows=[];
    for(let i=1;i<=45;i++){
      const type=i<=3?'相同产品':i<=11?'同款产品':i<=25?'疑似重复':'非重复';
      const btu=btuPool[(i-1)%btuPool.length];
      const std=stdPool[(i-1)%stdPool.length];
      const region=regionPool[(i-1)%regionPool.length];
      const feats=[featPool[(i-1)%featPool.length],featPool[i%featPool.length]].filter((v,k,a)=>a.indexOf(v)===k);
      const title='新品 DL '+btu+'BTU '+(['静音','商用','智能','高风量'][i%4])+'移动空调 '+feats.join(' ')+' 220-240V/50Hz 带前数显 '+modelPool[i%modelPool.length]+' '+std+' ABS';
      rows.push({
        duplicate_type:type,
        similar_spu:'PHK_D9'+String(i).padStart(3,'0'),
        similar_sku:'PHK_D9'+String(i).padStart(3,'0')+'QX5Q',
        similar_title:title,
        similar_category:'家居、厨具、家装 > 制冷设备 > 移动空调',
        similar_image:'',
        demo_img_index:i%6,
        demo_only:true,
        recall_source:i%2?'标题':'标题+图片',
        title_judgement:type==='疑似重复'?'标题主体相似':type==='非重复'?'标题主体不一致':'标题主体一致',
        image_judgement:(type==='疑似重复'&&i%3===0)?'外形主体无法确认':'外形主体一致',
        purchase:pricePool[(i-1)%pricePool.length],
        region:region,
        suggestion:type==='相同产品'?'建议删除重复产品':type==='同款产品'?'建议人工确认是否合并保留':type==='疑似重复'?'建议人工复核后再判断':'无需处理'
      });
    }
    duplicateDetectionData['PHK_3EPC']={
      taskState:'completed',taskId:'DUP-20261110-045',status:'已完成',is_duplicate:'是',
      target_spu:'PHK_3EPC',target_sku:'PHK_3EPCQX5Q',
      target_title:bulkTarget.title,target_category:'家居、厨具、家装 > 制冷设备 > 移动空调',target_image:null,
      same_product_count:3,same_style_count:8,suspected_count:14,non_duplicate_count:20,candidate_count:45,
      duplicate_items_json:JSON.stringify(rows),
      summary:'本次共 45 条比对记录：3 个相同产品、8 个同款产品、14 个疑似重复，另有 20 个非重复。'
    };
  }
  const flowNote=document.querySelector('.duplicate-flow-note');
  if(flowNote){
    flowNote.textContent='重复品检测（拟接入）：商品创建完成后自动触发检测，Webhook 回传结果。后台区分任务状态与检测结论；检测结果悬浮查看重复数量，点击查看详情；「无需检测」悬浮查看未触发原因，不提供详情弹窗。所有交互均为模拟。';
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
/* 检测时间挂在弹窗标题「重复品检测报告」后面，不占正文空间。 */
function dupHeaderExtra(d,state){
 if(!d||state==='not-checked')return '';
 const when=timeForModal(d,state);
 if(!when)return '';
 const label=state==='running'?'发起时间':'检测时间';
 return `${label} ${escapeHtml(when)}`;
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
  /* 重复构成摘要：标签小字、数字放大加重，形成主次；详情为绿色文字链接，不加边框。 */
  function dupMixMarkup(item){
    const d=duplicateDetectionData[item.id]||{};
    const parts=[
      ['相同',Number(d.same_product_count||0)],
      ['同款',Number(d.same_style_count||0)],
      ['疑似',Number(d.suspected_count||0)]
    ].filter(([,n])=>n>0);
    if(!parts.length)return '';
    return parts.map(([label,n])=>`<span class="dup-mix-item">${label}<b>${n}</b></span>`).join('<span class="dup-mix-dot">·</span>');
  }
  duplicateDetectionCell=function(item){
    const state=detectionState(item.id);
    const safeId=escapeHtml(item.id);
    const detailBtn=`<button class="dup-link" onclick="openDuplicateDetection('${safeId}')">详情</button>`;

    // 未检测：状态在上，操作在下；点一下直接建任务，不弹窗。
    if(state==='not-checked'){
      return `<div class="detection-cell detection-cell-stack">
        <span class="dup-state-muted">未检测</span>
        <button class="dup-link" onclick="quickDetect('${safeId}')">立即检测</button>
      </div>`;
    }

    // 无需检测：横杠占位，悬浮看未触发原因（自定义黑底浮层，不用原生 title），不提供弹窗。
    if(state==='not-applicable'){
      const tip=excludedTooltip(item.id);
      return `<div class="detection-cell detection-cell-center detection-cell-tooltipable dup-tip-hover" data-tip="${escapeHtml(tip)}" aria-label="无需检测：${escapeHtml(tip)}"><span class="dup-dash">—</span></div>`;
    }

    // 未发现重复：结论无依据可看，不开弹窗；只给一个行内「重新检测」动作。
    // 检测时间与比对条数仍放在悬浮提示里，避免为了看一条空结论多开一层弹窗。
    if(state==='clear'){
      const d=duplicateDetectionData[item.id]||{};
      const when=timeForModal(d,state);
      // 结论本身已说明结果，悬浮只补检测时间；「非重复 N 条」属于过程数据，不在这里展开。
      const tip=['未发现重复',when?`检测时间 ${when}`:''].filter(Boolean).join(' · ');
      return `<div class="detection-cell detection-cell-stack dup-tip-hover" data-tip="${escapeHtml(tip)}">
        <span class="dup-state-text is-conclusion">未发现重复</span>
        <button class="dup-link" onclick="quickDetect('${safeId}')">重新检测</button>
      </div>`;
    }

    // 检测中：只读等待态，不提供弹窗；悬浮看发起时间。
    if(state==='running'){
      const d=duplicateDetectionData[item.id]||{};
      const when=timeForModal(d,state);
      const tip=when?`检测任务执行中 · ${when} 发起`:'检测任务执行中';
      return `<div class="detection-cell detection-cell-center dup-tip-hover" data-tip="${escapeHtml(tip)}"><span class="dup-state-text"><span class="dup-spinner dup-spinner-muted" aria-hidden="true"></span>检测中</span></div>`;
    }

    // 检测失败：失败原因是一句话信息，放悬浮即可；动作直接给「重新检测」，不为一句原因多开一层弹窗。
    if(state==='failed'){
      const d=duplicateDetectionData[item.id]||{};
      const reason=String(d.error_message||d.summary||'本次检测未能正常完成，未生成有效检测结论。').trim().replace(/[。；;]+$/,'');
      const when=timeForModal(d,state);
      const tip=[reason,when?`检测时间 ${when}`:''].filter(Boolean).join(' · ');
      return `<div class="detection-cell detection-cell-stack dup-tip-hover" data-tip="${escapeHtml(tip)}">
        <span class="dup-state-text">检测失败</span>
        <button class="dup-link" onclick="quickDetect('${safeId}')">重新检测</button>
      </div>`;
    }

    // 存在重复 / 发现同款 / 疑似重复：构成写全 + 详情链接。
    return `<div class="detection-cell detection-cell-stack">
      <span class="dup-mix">${dupMixMarkup(item)}</span>
      ${detailBtn}
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
 const q=(document.getElementById('searchInput')?.value||'').toLowerCase().trim();
 const f=document.getElementById('statusFilter')?.value||'all';
 const df=document.getElementById('detectionFilter')?.value||'all';
 const chosen=spuData.filter(x=>{
  const base=(x.id+' '+x.title+' '+x.region).toLowerCase().includes(q)&&(f==='all'||x.status===f);
  return base&&(df==='all'||detectionState(x.id)===df);
 });
 const pages=Math.max(1,Math.ceil(chosen.length/pageSize));currentPage=Math.min(Math.max(1,currentPage),pages);
 const rows=chosen.slice((currentPage-1)*pageSize,currentPage*pageSize);
 document.getElementById('spuTbody').innerHTML=rows.length?rows.map(x=>`<tr>
   <td></td>
   <td><img class="product-thumb" src="${thumbs[x.img]}" alt="产品主图示意"></td>
   <td><a class="spu-link" href="javascript:void(0)" onclick="navigateToProduct('${x.id}')">${x.id}</a></td>
   <td><div class="title-text" title="${escapeHtml(x.title)}">${escapeHtml(x.title)}</div><div class="small-note" style="text-align:left;margin-top:3px">适用范围：${escapeHtml(x.region)}</div></td>
   <td><span class="pass">产品审核通过</span></td>
   <td>${duplicateDetectionCell(x)}</td>
   <td><div class="state-cell"><span class="badge ${badgeClass(x.status)}">${statusText(x.status)}</span>${x.group?`<span class="small-note">${Math.max(0,(groupInfo[x.group]?.members||[]).length-1)} 个关联版本 · ${x.group}</span>`:x.status==='candidate'?`<span class="small-note">${x.candidates.length} 条待确认建议</span>`:'<span class="small-note">—</span>'}</div></td>
   <td><div class="op-stack">${rowOperation(x)}</div></td>
   <td><span class="score">◎ ${x.score}</span></td><td>${x.purchase}</td><td class="price-cell">${x.prices}</td><td class="profit">${profitCell(x.profit,0)}</td><td class="profit">${profitCell(x.profit,1)}</td><td class="profit">${profitCell(x.profit,2)}</td>
   ${spuBizCells(x)}
  </tr>`).join(''):'<tr><td colspan="25"><div class="empty">没有找到符合条件的 SPU</div></td></tr>';
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

// 右上角 × 已可关闭，底部不再重复放「关闭」按钮。
 // 判定规则改为报告弹窗内的 tab（见 switchDupTab），不再从 footer 打开第二层浮层。
 return `<div class="modal-actions">${buttons.join('')}</div>`;
}
  renderDetectionTarget=function(item,d){
    const state=detectionState(item.id);
    const completed=['duplicate','style','suspected','clear'].includes(state);
    const sku=escapeHtml(completed?(d?.target_sku||'-'):'-');
    const title=escapeHtml(d?.target_title||item.title);
    const img=thumbs[item.img]||'';
    const sectionTitle=state==='not-applicable'?'商品信息':'目标产品';
    return `<div class="dup-table-section-label dup-target-label">${sectionTitle}</div><div class="dup-table-wrap"><table class="dup-candidates-table dup-target-table">
      <colgroup><col style="width:14%"><col style="width:18%"><col style="width:10%"><col style="width:58%"></colgroup>
      <thead><tr><th>SPU</th><th>代表 SKU</th><th>主图</th><th>产品标题</th></tr></thead>
      <tbody><tr><td><span class="dup-spu-strong">${escapeHtml(item.id)}</span></td><td class="dup-sku-col">${sku}</td><td class="dup-photo-col">${img?`<img class="dup-candidate-row-img dup-zoomable" src="${escapeHtml(img)}" alt="商品主图" title="点击放大" onclick="openDupImageSingle(this.src)">`:'—'}</td><td class="dup-title-col">${title}</td></tr></tbody>
    </table></div>`;
  };
  // 系统不再输出「存在重复 / 发现同款」这类总结论；检测时间已并入「目标产品」标题行，这里不再单独占一行。
  completedReportHead=function(){return '';};
  function fullReasonMarkup(x){
    const full=String(x.reason||x.difference||x.reason_brief||'暂无详细判断依据');
    // 按维度拆行，最多 4 行；每行单行展示，超长打省略号，悬浮看完整内容。
    const lines=full.split(/\r?\n/).filter(l=>l.trim()).slice(0,4);
    const inner=lines.map(l=>`<span class="dup-reason-line">${escapeHtml(l)}</span>`).join('');
    return `<div class="dup-reason-hover" tabindex="0" data-full-reason="${escapeHtml(full)}">${inner}</div>`;
  }
  /* 判定规则：先给判定结果，再按结果分块列出具体判断条件（口径与 Skill 一致）。 */
  function rulesReference(){
    const groups=[
      ['相同产品','same',[
        ['标题主体一致 + 外形主体一致 + 供应商编码一致 + 采购价整数部分一致','供应商和采购价一致，基本可认为是同一产品'],
        ['标题主体一致 + 外形主体一致 + 尺寸 / 重量 / 材质 / 功能基本一致','关键规格字段基本一致，基本可认为是同一产品']
      ]],
      ['同款产品','style',[
        ['标题主体一致 + 外形主体一致，但供应商 / 采购价、尺寸 / 重量 / 材质 / 功能均未达到相同产品判断标准','标题和外形一致，但未满足相同产品条件，按同款产品处理']
      ]],
      ['疑似重复','suspected',[
        ['标题主体一致 + 外形主体不一致','标题主体一致，但外形不一致，需人工复核'],
        ['标题主体一致 + 外形主体无法确认','标题主体一致，但图片不足以确认外形，需人工复核'],
        ['标题主体不一致 + 外形主体一致','外形主体一致，但标题主体不一致，需人工复核'],
        ['标题主体无法比较 + 外形主体一致','仅输入图片时，标题无法参与判断，最多判为疑似重复，需人工复核']
      ]],
      ['非重复','none',[
        ['标题主体不一致 + 外形主体不一致','标题和外形均不同'],
        ['标题主体不一致 + 外形主体无法确认','标题主体不一致，且图片无法提供有效相似依据'],
        ['标题主体无法比较 + 外形主体不一致','仅输入图片，且外形主体不一致'],
        ['标题主体无法比较 + 外形主体无法确认','仅输入图片，且外形无法确认，无有效相似依据']
      ]]
    ];
    // 单张大表：判定结果列用 rowspan 合并，一类只出现一次。
    const rows=groups.map(([result,kind,rules])=>rules.map(([condition,note],i)=>`<tr>${
      i===0?`<td class="dup-rule-result-cell" rowspan="${rules.length}"><span class="dup-rule-tag ${kind}">${result}</span></td>`:''
    }<td>${condition}</td><td>${note}</td></tr>`).join('')).join('');
    return `<div class="dup-rule-note">以下为系统检测判定口径，具体结果以本次检测报告为准。</div><div class="dup-rule-table-wrap"><table class="dup-rule-table"><thead><tr><th>判定结果</th><th>判断条件</th><th>说明</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }
  /* 报告弹窗内切换「检测结果 / 判定规则」，规则不再单独开一层浮层，避免弹窗套弹窗。 */
  window.switchDupTab=function(name){
    const result=document.getElementById('dupTabResult');
    const rule=document.getElementById('dupTabRule');
    if(!result||!rule)return;
    const isRule=name==='rule';
    result.style.display=isRule?'none':'';
    rule.style.display=isRule?'':'none';
    document.querySelectorAll('.dup-modal-tab').forEach(function(btn){
      btn.classList.toggle('active',(btn.getAttribute('data-dup-tab')==='rule')===isRule);
    });
    const body=document.getElementById('modalBody');
    if(body)body.scrollTop=0;
  };

  /* ---- 主图放大预览：只展示图片本身，不显示标题等文字信息 ---- */
  function dupImageSrc(row){
    const y=row?getSpu(row.similar_spu):null;
    return row&&row.similar_image&&/^https?:\/\//.test(row.similar_image)?row.similar_image:thumbs[y?.img ?? row?.demo_img_index ?? 0];
  }
  let dupViewerSrcs=[], dupViewerIdx=0;
  function dupEnsureViewer(){
    let v=document.getElementById('dupImgViewer');
    if(!v){
      v=document.createElement('div');v.id='dupImgViewer';v.className='dup-img-viewer';
      v.addEventListener('click',function(e){if(e.target===v)closeDupImage()});
      document.body.appendChild(v);
    }
    return v;
  }
  function dupRenderViewer(){
    const src=dupViewerSrcs[dupViewerIdx];
    if(!src){closeDupImage();return;}
    const v=dupEnsureViewer();
    const multi=dupViewerSrcs.length>1;
    v.innerHTML=`<div class="dup-img-viewer-inner">
      <button class="dup-img-close" onclick="closeDupImage()" aria-label="关闭">×</button>
      ${multi?'<button class="dup-img-nav prev" onclick="dupImageStep(-1)" aria-label="上一张">‹</button>':''}
      <img src="${escapeHtml(src)}" alt="商品大图">
      ${multi?'<button class="dup-img-nav next" onclick="dupImageStep(1)" aria-label="下一张">›</button>':''}
    </div>`;
    v.classList.add('show');
  }
  openDupImage=function(idx){
    const row=dupViewerRows[idx];if(!row)return;
    const src=dupImageSrc(row);if(!src)return;
    dupViewerSrcs=dupViewerRows.map(dupImageSrc).filter(Boolean);
    dupViewerIdx=Math.max(0,dupViewerSrcs.indexOf(src));
    dupRenderViewer();
  };
  // 单图预览（检测商品主图等）：不提供左右切换。
  openDupImageSingle=function(src){
    if(!src)return;
    dupViewerSrcs=[src];dupViewerIdx=0;dupRenderViewer();
  };
  closeDupImage=function(){const v=document.getElementById('dupImgViewer');if(v){v.classList.remove('show');v.innerHTML='';}};
  dupImageStep=function(delta){
    const n=dupViewerSrcs.length;if(n<2)return;
    dupViewerIdx=((dupViewerIdx+delta)%n+n)%n;
    dupRenderViewer();
  };
  document.addEventListener('keydown',function(e){
    const v=document.getElementById('dupImgViewer');
    if(!v||!v.classList.contains('show'))return;
    if(e.key==='Escape')closeDupImage();
    else if(e.key==='ArrowLeft')dupImageStep(-1);
    else if(e.key==='ArrowRight')dupImageStep(1);
  });
  let dupFilter='all', dupPage=1;
  const DUP_PAGE_SIZE=8;
  let dupViewerRows=[];
  setDupFilter=function(kind){dupFilter=kind;dupPage=1;renderDuplicateReportBody();};
  dupChangePage=function(delta){dupPage+=delta;renderDuplicateReportBody();};
  renderAllDuplicateCandidates=function(rows){
    // 非重复结果只在标题处计数，不列入比对明细表格。
    const all=rows||[];
    const listed=all.filter(x=>x.duplicate_type!=='非重复');
    const priority={'相同产品':0,'同款产品':1,'疑似重复':2};
    const klass={'相同产品':'duplicate','同款产品':'style','疑似重复':'suspected'};
    const sorted=[...listed].sort((a,b)=>(priority[a.duplicate_type]??5)-(priority[b.duplicate_type]??5));
    const counts={all:sorted.length,duplicate:0,style:0,suspected:0};
    sorted.forEach(x=>{const k=klass[x.duplicate_type]||'none';if(k in counts)counts[k]++;});
    const filtered=dupFilter==='all'?sorted:sorted.filter(x=>(klass[x.duplicate_type]||'none')===dupFilter);
    dupViewerRows=filtered;
    const totalPages=Math.max(1,Math.ceil(filtered.length/DUP_PAGE_SIZE));
    dupPage=Math.min(Math.max(1,dupPage),totalPages);
    const startIdx=(dupPage-1)*DUP_PAGE_SIZE;
    const pageRows=filtered.slice(startIdx,startIdx+DUP_PAGE_SIZE);
    const body=pageRows.map((x,i)=>{
      const y=getSpu(x.similar_spu);
      const img=x.similar_image&&/^https?:\/\//.test(x.similar_image)?x.similar_image:thumbs[y?.img ?? x.demo_img_index ?? 0];
      const code=escapeHtml(x.similar_spu||'');
      const vi=startIdx+i;
      return `<tr>
        <td class="dup-result-first-col"><span class="dup-result-tag ${klass[x.duplicate_type]||'none'}">${escapeHtml(x.duplicate_type||'—')}</span></td>
        <td><span class="dup-spu-static">${code||'-'}</span></td>
        <td class="dup-sku-col">${x.similar_sku?`<a class="spu-link dup-sku-link" href="javascript:void(0)" onclick="openDuplicateCandidate('${code}')">${escapeHtml(x.similar_sku)}</a>`:'-'}</td>
        <td class="dup-photo-col">${img?`<img class="dup-candidate-row-img dup-zoomable" src="${escapeHtml(img)}" alt="商品图" title="点击放大" onclick="openDupImage(${vi})" onerror="this.style.display='none'">`:'—'}</td>
        <td class="dup-title-col">${escapeHtml(x.similar_title||'-')}</td>
        <td class="dup-reason-col">${fullReasonMarkup(x)}</td>
      </tr>`;
    }).join('');
    const chips=[
      ['all','全部',counts.all],
      ['duplicate','相同产品',counts.duplicate],
      ['style','同款产品',counts.style],
      ['suspected','疑似重复',counts.suspected]
    ].filter(([k,label,n])=>k==='all'||n>0)
     .map(([k,label,n])=>`<button class="dup-filter-chip ${dupFilter===k?'active':''}" onclick="setDupFilter('${k}')">${label} <b>${n}</b></button>`).join('');
    const pager=filtered.length>DUP_PAGE_SIZE?`<div class="dup-pager"><span>共 ${filtered.length} 条 · 第 ${dupPage} / ${totalPages} 页</span><div class="dup-pager-btns"><button class="btn-small" onclick="dupChangePage(-1)" ${dupPage<=1?'disabled':''}>上一页</button><button class="btn-small" onclick="dupChangePage(1)" ${dupPage>=totalPages?'disabled':''}>下一页</button></div></div>`:'';
    return `<div class="dup-table-section-label">检测明细</div>
      <div class="dup-filter-bar">${chips}</div>
      <div class="dup-table-wrap dup-all-list"><table class="dup-candidates-table">
      <colgroup><col style="width:9%"><col style="width:11%"><col style="width:13%"><col style="width:8%"><col style="width:20%"><col style="width:39%"></colgroup>
      <thead><tr><th>检测结果</th><th>SPU</th><th>代表 SKU</th><th>主图</th><th>产品标题</th><th>判断依据</th></tr></thead>
      <tbody>${body||'<tr><td colspan="6"><div class="dup-empty">该分类下没有检测记录</div></td></tr>'}</tbody></table></div>${pager}`;
  };
renderDuplicateReportBody=function(){
    const item=getSpu(duplicateModalSpu);if(!item)return;
    const d=duplicateDetectionData[duplicateModalSpu];if(!d)return;
    let items=[];
    try{items=JSON.parse(d.duplicate_items_json||'[]');if(!Array.isArray(items))items=[]}catch(e){items=[]}
    const state=detectionState(item.id);
    const listed=items.filter(x=>x.duplicate_type!=='非重复');
    const content=listed.length
      ? renderAllDuplicateCandidates(items)
      : '<div class="dup-zero"><div class="dup-zero-icon">✓</div><h4>本次未发现重复产品</h4><p>本次检测未发现相同、同款或疑似重复产品。</p></div>';
    const head=completedReportHead(d,state);
    setModalHeaderExtra(dupHeaderExtra(d,state));
    // 检测报告内容宽（判断依据列要放 4 行文字），单独加宽这个弹窗。
    document.getElementById('modal').classList.add('modal-dup');
    const tabs=`<div class="dup-modal-tabs">
      <button class="dup-modal-tab active" data-dup-tab="result" onclick="switchDupTab('result')">检测结果</button>
      <button class="dup-modal-tab" data-dup-tab="rule" onclick="switchDupTab('rule')">判定规则</button>
    </div>`;
    document.getElementById('modalBody').innerHTML=tabs
      +`<div id="dupTabResult">${head+renderDetectionTarget(item,d)+content}</div>`
      +`<div id="dupTabRule" style="display:none">${rulesReference()}</div>`;
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
      const body=`<div class="dup-report-head"><span class="badge badge-primary"><span class="dup-spinner" aria-hidden="true" style="vertical-align:-2px;margin-right:4px"></span>检测中</span></div>${renderDetectionTarget(item,d)}<div class="dup-report-summary">检测任务正在执行，结果尚未返回；包含排队、Agent 执行及 ERP 回调保存过程。本次任务完成前不能重复提交。</div>`;
      showModal('重复品检测 · 任务详情',body,detectionModalFooter(id,'running'),false,dupHeaderExtra(d,state));return;
    }
    if(d && d.status==='无产品信息'){
      const body=`<div class="dup-report-head"><span class="badge badge-process-failed">检测失败</span></div>${renderDetectionTarget(item,d)}<div class="dup-exception">无法获取该商品的产品信息，检测失败。</div>`;
      showModal('重复品检测 · 无产品信息',body,detectionModalFooter(id,'failed'),false,dupHeaderExtra(d,state));return;
    }
    if(state==='failed'){
      const body=`<div class="dup-report-head"><span class="badge badge-process-failed">检测失败</span></div>${renderDetectionTarget(item,d)}<div class="dup-exception">本次检测未能正常完成，未生成有效检测结论。可以稍后重新检测。</div>`;
      showModal('重复品检测 · 检测失败',body,detectionModalFooter(id,'failed'),false,dupHeaderExtra(d,state));return;
    }
    duplicateModalSpu=id;duplicateModalTab='';dupFilter='all';dupPage=1;
    // 标题右侧的检测时间由 renderDuplicateReportBody 统一写（重测完成后要跟着刷新）。
    showModal('重复品检测报告','<div class="empty">正在读取结果…</div>',detectionModalFooter(id,'completed'),true);
    renderDuplicateReportBody();
  };
/* 列表内快捷检测：不弹确认框，直接创建任务并在 2.6 秒后模拟回调完成。 */
function quickDetect(id){
 const item=getSpu(id);if(!item)return;
 if(detectionState(id)==='running'){toast('当前 SPU 已有检测中任务');return;}
 const previous=duplicateDetectionData[id];
 if(previous?.taskId){
  duplicateTaskHistory[id]??=[];
  if(!duplicateTaskHistory[id].some(x=>x.taskId===previous.taskId))duplicateTaskHistory[id].unshift(JSON.parse(JSON.stringify(previous)));
 }
 manualReturnTemplate[id]=previous?.status==='已完成'?JSON.parse(JSON.stringify(previous)):makeDemoDuplicateRecord(id,1,1,1,1);
 const taskId='UI-DEMO-'+String(duplicateDemoSerial++).padStart(4,'0');
 duplicateDetectionData[id]={taskState:'running',taskId,status:'',is_duplicate:'',target_spu:id,target_sku:detailSkuCode(item),target_title:item.title,summary:'由列表快捷发起的新检测任务，等待模拟回调。',trigger_type:previous?'MANUAL_RECHECK':'MANUAL_FIRST'};
 renderTable();
 toast('已发起检测（模拟）：'+taskId);
 setTimeout(function(){
  const d=duplicateDetectionData[id];
  if(!d||d.taskState!=='running'||d.taskId!==taskId)return;
  const tpl=manualReturnTemplate[id];
  const completedAt=nowText();
  duplicateDetectionData[id]=Object.assign({},JSON.parse(JSON.stringify(tpl)),{taskState:'completed',taskId:taskId,status:'已完成',target_spu:id,target_sku:detailSkuCode(item),target_title:item.title,trigger_type:previous?'MANUAL_RECHECK':'MANUAL_FIRST',summary:tpl.summary,detected_at:completedAt,completed_at:completedAt,task_status:'SUCCESS'});
  duplicateDetectionData[id].result_status=inferResultStatus(duplicateDetectionData[id],'SUCCESS');
  duplicateTaskHistory[id]??=[];
  duplicateTaskHistory[id].unshift(JSON.parse(JSON.stringify(duplicateDetectionData[id])));
  renderTable();
  toast('检测完成（模拟）：'+taskId);
 },2600);
}
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
 else toast('该 SPU 不在当前项目模拟列表中：'+spu);
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

/* ---- 判断依据悬浮提示：独立浮层挂在 body 上，不会被表格滚动容器裁剪，也不挡滚动条 ---- */
(function(){
  let tip=null,current=null;
  function ensure(){if(!tip){tip=document.createElement('div');tip.className='dup-reason-tip';document.body.appendChild(tip);}return tip;}
  function hide(){if(tip)tip.style.display='none';current=null;}
  function show(el){
    const text=el.getAttribute('data-full-reason')||el.getAttribute('data-tip')||'';
    if(!text)return;
    const t=ensure();
    t.textContent=text;t.style.display='block';t.classList.remove('below');
    t.style.left='0px';t.style.top='0px';
    const r=el.getBoundingClientRect();
    const tw=t.offsetWidth,th=t.offsetHeight;
    const left=Math.min(Math.max(8,r.left),Math.max(8,window.innerWidth-tw-8));
    // 默认向上展示，指向触发文字；上方放不下才翻到下方。
    let top=r.top-th-10;
    let below=false;
    if(top<8){top=r.bottom+10;below=true;}
    t.style.left=left+'px';t.style.top=top+'px';
    if(below)t.classList.add('below');
    const arrow=Math.min(Math.max(14,r.left+r.width/2-left),Math.max(14,tw-14));
    t.style.setProperty('--tip-arrow',arrow+'px');
  }
  const HOVER_SEL='.dup-reason-hover,.dup-tip-hover';
  document.addEventListener('mouseover',function(e){
    const el=e.target&&e.target.closest?e.target.closest(HOVER_SEL):null;
    if(el===current)return;
    current=el;
    if(el)show(el);else hide();
  });
  document.addEventListener('focusin',function(e){
    const el=e.target&&e.target.closest?e.target.closest(HOVER_SEL):null;
    if(el){current=el;show(el);}
  });
  document.addEventListener('focusout',hide);
  // 点击时先收起浮层，避免它压在随后打开的弹窗上方。
  document.addEventListener('mousedown',hide);
  window.addEventListener('scroll',hide,true);
  window.addEventListener('resize',hide);
})();

/* ---- 统一把已有检测结果的判断依据换成具体依据 ---- */
Object.entries(duplicateDetectionData).forEach(([spu,d])=>applyDetailedReasons(spu,d));

/* ========================= 四、初始化（加载完成时执行一次） ========================= */
renderTable();
if(activeProductSpu) syncProductDetection(activeProductSpu);
