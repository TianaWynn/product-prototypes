/* core/state.js — 应用级可变状态（分页、弹窗、关联管理、检测弹窗、当前产品等）。
   仅含状态声明，不含业务数据与逻辑；业务数据见 data/mock-data.js。
   被各 features 共享，必须最先加载。 */
let currentModal = {type:'manager',spu:''};
let managerTab = 'overview';
let manualPicked = new Set();
let manualQuery = '';
let manualGroupName = '';
let managerManualPicked = new Set();
let managerManualQuery = '';
let managerGroupName = '';
let nextGroupNumber = 3;
let currentPage = 1;
let pageSize = 50;
let toastTimer;
/* 重复品检测报告弹窗状态 */
let duplicateModalTab = '';
let duplicateModalSpu = '';
/* 当前选中的产品 SPU（列表跳转 / 详情页 / 检测条共用） */
let activeProductSpu = 'PHK_3ES4';
