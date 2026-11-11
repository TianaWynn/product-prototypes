/* core/router.js — 轻量视图路由器：注册 / 切换顶层视图。
   新增页面时：① index.html 增加视图容器；② main.js 中 register；③ 用 App.router.show('名称') 跳转。
   不改变 URL（与原型的切换行为一致），只统一管理 display 显隐，避免散落的 style.display 逻辑。 */
(function () {
  var views = {};    // name -> { el, display }
  var order = [];
  var currentName = '';

  function register(name, el, opts) {
    if (!el) return;
    views[name] = { el: el, display: (opts && opts.display) || 'block' };
    if (order.indexOf(name) === -1) order.push(name);
    if (!currentName) currentName = name;
  }

  function show(name) {
    if (!views[name]) return;
    order.forEach(function (k) {
      var v = views[k];
      if (v && v.el) v.el.style.display = (k === name) ? v.display : 'none';
    });
    currentName = name;
  }

  window.App = window.App || {};
  window.App.router = {
    register: register,
    show: show,
    current: function () { return currentName; }
  };
})();
