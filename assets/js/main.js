/* main.js — 启动引导（唯一入口逻辑）。
   注册顶层视图并启动路由。业务模块通过 index.html 中的 <script> 按依赖顺序加载。 */
(function () {
  var router = window.App && window.App.router;
  if (!router) { console.error('[main] router 未加载'); return; }

  router.register('project', document.getElementById('projectView'));
  router.register('product', document.getElementById('productView'));
  router.show('project');
})();
