/* data/mock-data.js — 原型模拟数据（图片、SPU、关联组、相似品、重复检测结果）。
   全部为演示数据；后续接入真实接口时，以本文件的数据结构作为契约替换数据来源。 */
const thumbs = ["data:image/png;base64,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","data:image/png;base64,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","data:image/png;base64,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","data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEYAAABSCAYAAADpaaIJAAAMEklEQVR4nO1czZITyRH+Mqta0szAwAAR3H2wfVi/gB2+rh9gD34873OtDyaCWIMN9oaBGU3/VKUPVVldXd0tqSUGNgglDJJa1fXzdf5nDiQigjONiL/2Bn6tdAZmhs7AzNAZmBmy4UXiz7dCBDUpRHTUDGeOmaEIzLfELUB+nmO9EZum+YzujABIDFyy8hdxm4ZrKjhLxCromM+9VxFI3AR9Jf9xCowlAD2cjhEJAOHrCuqxovTwyjcCNP3Vr1e32cV3KBuKQEQm2VIij5DKOlHiGvEexAQihncOxphex2VTUfbBix9uIfuHMC0W+d7m9rmLJoHJn2Q5oX4SitsigkSQAICYQUKT9xMRHAHeexAJmNUoFkCW6xaMJcXYOSoBWa58F9BAgdHwOlHY7pyAiAi89xABjGEwM7quC1yTgxvBTgeaAGEfMApC+XookYiIiB8cZ0r2y4lLDT93qHKO0ko47+J3PDrqPlGYX4uAOe47kA7mmKnNifTikG9y10Z0jHKIMQaQCV9qRgQOPeSxoYDSIlGSqCBVt+i1dFjoeSiZ6jgojW2aBs45iAiur69xX9e9CKYAZygqVVWl6yVNA7BfIe+jvcAIZCjPEq9FsfDeo3MdxAuICYZNsCKShidg2rbFT3//Ca/+8QrEjL98/z3arkNVVRDv03nKzSdgRJX+FO3nUn1/CDgDYCR71VuJeHZZL8H0NncNmrbFZrMBVwwmhhcfOYzAzPA+mNybpzfg3zDYMEQElbVgIkgc45xD13UgIlRVhWq1CuDZ6KR7AfGU+zV/2NN1TDKbhywHQMKinXPwzkG8T4dzzsGLBDUY9Y8Xj5ubG9w8ewYC0LkucEG0Vl4ETJTAJCaI93DewxoDZo5P/3j/5FCywLTFWbKgjzpDdcdqtYIxJhzW+zQfg4dsDRVVgNmAARATmAlMnES1aRtUVRXAeiAgSprUMUs0v24eANquhUjQCUQEYgZjLOOgXmuNvkNwEjnuwYtH27bB37EWlEUxDwnS8pAgJxUR74OT5sPB6roO4kC9Zzzlc+SfElAQkAe8CJzz6FwLJo6W6mHByGk2JFiygeT1EoGYkkgpaEAIAwQAM0G8QCAJSBDBOxdjIoIxBtZaWGthjMWqqmDYjNYMtz6gjgmLyDRbzyycwKOoPEUg4mHJ4uLiAm3Xom3aDDCGeB8cQo7z294nstb2HOgcQARjGNZYkFos72ANA6AH55yofIdO5yFPQ0Hx+tQlcICnYEXU5qvCpGiSnXPpMxsGswEBcM5l84YNuc7BO4+qqtB5DxDBmirt8QvomOnQr1x8FHUL4KLPQdHEAkDT1EmUxMfXzONLZjcC55O59mmMbosQUhbeORhr8SVMNbBQ+eYKtIx58tAg1zEKjpIAvd4Rn4BTP6aMlyibb+002P1CorSERimBLKzX6975TO8M9ZZEp08AsCd48qN4K82d3UdE0ZtWSfvKHJNxdaIy2i1/2q7rD1uYaCKCj/GXAkdEkBwSlTqNneLqwVwvPeJxtJ9j9EnSdGpIile9R0EpMwmig2kYmfe3DnmmT2OGN4PSzAPS4cnwMiGU5X71Na8IUD6MsiedWbwkftESjcQpS11o+PClSg5DYBbwKQEpDtKEdn73QCFnIlN+r+/L9ctcDjKxDFgOt54Mmg47EcDB7CUspbWZcgCBYF3ut9tgrkvOwvDguUecwIqnSVxW7oUEoF4sB3nyCIJzgjxDKxiCP7XvXXR0XclnHLC92+LDxw/BasQ/3o/NuHg/O9/UIcYIlTchpUWVgYgBERelc2zWD7Vki4FJXnG2iLUWq2oF17lY6QkGecBVkUN2zVtWCmifv0IASGKlgSBw6BP7x3GK0l5gplBPfkXkAGstnj59mlKeZd5kao5Dab5M0h+UmSAItSqBgxc3+H4pKMCpaQeEQ99tt3h2cwOgrxr2QPThxiFOWZ9kzxy5mbGqq5gJHz78D1Vl0HVtyAeBwUxD67eAjgZGSydt16Z0JhEl9z+JDvkQ7+wJTMfXc2U7zdhBjwh++eW/+PHHv6Fu7mEt4/nz5/jhh7/i0dWTUJ7J9vzZqgSz1GeWYOPiKTvHvZiFzL6koHH3nEWYP/F1TjqSjcHbf71BXW/BhmJC3Y3EeQnX7A8JZlBWLrDWpiBPTS9TSC9o6ZVAkeVDJB3unzhpbrViBlAHix/XoXNdJyJo2xbSRk6NUfyxdLKOAZYpt9y73VmNyAeoxcIQS4rxgnjBzc2zWFkAHj2+BvNpgcPpwOyQ2RAXFRyXO4nIw6Bd88hMOBAcncvLS/zpj38GSMAMbDYbVNVq0TFKOjkZXraSpdgnfBiNn5vnWApLGPz2d7/HZrMGE9A0zUDpHkMnAVPm/XLnD8V1rU+HAZmuWLDWeOLw451gs76A6zp4CjWqU2PwB281m9Q/0Tc5GJQYfZfjvYScc3AqLe63Der7FsZUC2afpmmOyfIfk/Pv1JqH0RKfIjWUZZYofgQ4pD7r+h63t5/AhmEri9VqfdzGIiVgcvPX987NbDTzCZh4FCLk2byyvpT308xR2YwUCgQ5x6izGBw8kEfX1WBDqCoDIjk503eQjilzvKV45L6Ebrj8/pR4KZ8n12q6prWMx48fYbUKpRVrq5PWASaAGXVclt9P6AxrbZGryRRxkQ9W8uL7XO4BgE0Bq+0lTdNge79F13ZgYyACrNebvXPuogRMOlhKRPcAJZEoQNPPVVWlyHrfwdI8MVQIdSOZfRB6bz/H6EsACCVcG8A61bkD8t8lQOE/ZclbzW70TNEHilpeFS+pGWiv2KivFj08OiDDHQ4cyrM6POgvD2ttWDsFsKcnhmObUpZX7fcbL2WZuP5cgEiKqJkZbduCo1M1JTp56kjvT3SodcodR10DHKP63tKdEiMpTStfkVQu0S6Fsk4kIrFGLWkMCiU9OW82h45LY2cA8iKY8mPzB6jmnLQscSLNWqXSzAIhZ6vXtQjfNA22223fQKgbjd0NQK9o86bFcI4iHxtfU4sacy8y2b5Kc67v+1a0YK41oi/vOUTZz/PcRAyUaswRIH2t6xq3d7fpUHrIPhURRclLjIA5ebOhlBuT6NKXcHO/JfQCh5IviIapiwiI86GpsWlbOOcHljEBv8BdGHJM7ibo+yTWw6cjIil7x8z48PEj1qs1Li8vU/eCBpQmNha6CCqSFeoVdR705U9XuZOI4LoOkrpBzWDc9m6LpmkAIlxcXMya62UZvAiCms5waWhG8+9CZTHIsgC4vLrE7d0d3v/nPV6al0Gs4mFVT2ljERP3Fs5LrGMHt15B5tjY2HVd7P8lXF9fxx68ntP0kF1MlEWUBuJ/LNnRoTEMD8JambYngGKXwppWaNoGBODxo0f4+Z8/49WrV3j58iW6rsNqvUYVs3g+PnmP0GxYNzXu72s0dY2u68K1ukbTtmjbFtvtNvTyAfjDd99hs16jbRpUsQVN9yUiWFUVrq+vA1dllvKzZPByMMoQII95SCg4fw4gG4CrfY2rqytcP77Gmzdv8Pr1a3y6ve3lP3KDdl9SzAsThe5M5RJC0CfVqkJVhZa1y4sLvHjxAk+ePIGtbLJczrkY4/bOn4osEY9KOEuCVgDht09yL2Oq8JVPDvQxii7WdQ5NE578v9+9w/t37/H27Rt8ur2FMQab9Rrr9QZEIbtmrEVVVfH6OjUiEjPWqxVW63Xq17u8ugIB2FxcwDuX+n2dc4PDq7MpIrFxGjDGDva9GBiJViEeP/yVXp/0yAxv7sW6N99d18E5j7qu0bZNMqPWViACrO2dwN5JQ//0NQlOIXJnw/BeYKI1C2BkyfHysOr8xYzP0YU+BSY/9WHJ7ah8M+7KX3Nz3ocJwAjdfMZBTKTAqRjEAhoOEw8iM5hzKQ1a5pex3PiJTJl0fa8pA5kBZpD7KtYXiso/K7zl1YZ98x1DmR+T/Q5S9u/uX7ErPNe93uUcLHMHGcZuRDS4/3THf56i8j2O5gBYagHm5o7vRgkqjD5NTXB4rmeKdsZKh0z8UODkxf3J73fffXJH2jiDt4CBDi/QH09T3PIl6CRR+pbp/P/HzNAZmBk6AzNDZ2Bm6AzMDJ2BmaEzMDN0BmaGzsDM0BmYGToDM0NnYGbo/5WGOFQyVlxkAAAAAElFTkSuQmCC","data:image/png;base64,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","data:image/png;base64,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"];
const spuData = [
 {id:'PHK_3ES4', title:'新品 DL 9600BTU 静音移动空调 带制热款 WIFI+A++ 220-240V/50Hz 带前数显 TAC-09CHPB/DM7(A+)(JY) WIFI 制冷制热 英规 ABS', region:'英国 / 英规', score:'93.25', purchase:'1360.7965', prices:'UK Amazon - MSF：399.99<br>Amazon - FBM：399.99', profit:'UK Amazon - MSF：8.8%<br>Amazon - FBM：5.1%', img:0, status:'linked', group:'GRP-001', candidates:[]},
 {id:'PHK_3ERY', title:'新品 DL 9600BTU 静音移动空调 带制热 WIFI 220-240V/50Hz 带前数显 TAC-09CHPB/DM7(A+)(JY) 制冷制热 欧规 ABS', region:'德国 / 欧规', score:'97.5', purchase:'1354.6018', prices:'DE Amazon - MSF：429.99<br>Amazon - FBM：429.99', profit:'DE Amazon - MSF：5.4%<br>Amazon - FBM：0.6%', img:1, status:'linked', group:'GRP-001', candidates:[]},
 {id:'PHK_3ERV', title:'新品 DL 9600BTU 静音移动空调 带制热 A++ 220-240V/50Hz 带前数显 TAC-09CHPB/DM7(A+)(JY) 制冷制热 英规 ABS', region:'英国 / 英规', score:'100', purchase:'1330.2655', prices:'UK Amazon - MSF：399.99<br>Amazon - FBM：399.99', profit:'UK Amazon - MSF：9.9%<br>Amazon - FBM：6.2%', img:2, status:'linked', group:'GRP-002', candidates:[]},
 {id:'PHK_3ERU', title:'新品 DL 9600BTU 静音移动空调带制热 220-240V/50Hz 带前数显 TAC-09CHPB/DM7(A+)(JY) 制冷冷暖 A++ 欧规 ABS', region:'德国 / 欧规', score:'100', purchase:'1324.0708', prices:'DE Amazon - MSF：429.99<br>Amazon - FBM：429.99', profit:'DE Amazon - MSF：6.6%<br>Amazon - FBM：1.8%', img:3, status:'linked', group:'GRP-002', candidates:[]},
 {id:'PHK_3ERT', title:'新品 DL 9600BTU 静音移动空调 智能款带WIFI 220-240V/50Hz 带前数显 TAC-09CPB/DM7(A+)(JY) WIFI 单制冷 欧规 ABS', region:'欧洲 / 欧规', score:'92.5', purchase:'1307.2566-1313.4513', prices:'UK Amazon - MSF：399.99<br>DE Amazon - MSF：429.99', profit:'UK MSF：10.5%<br>DE MSF：7.2%', img:4, status:'candidate', group:'', candidates:['PHK_3EPQ']},
 {id:'PHK_3EPQ', title:'新品 DL 9600BTU 静音移动空调 220-240V/50Hz 带前数显 TAC-09CPB/DM7(A+)(JY) 单制冷 欧规 ABS', region:'欧洲 / 欧规', score:'100', purchase:'1276.7257-1282.9204', prices:'UK Amazon - MSF：399.99<br>DE Amazon - MSF：429.99', profit:'UK MSF：11.6%<br>DE MSF：8.5%', img:5, status:'candidate', group:'', candidates:['PHK_3ERT','PHK_3EDE','PHK_3EFR','PHK_3EUK']}
];
// 扩充模拟数据，方便测试手动创建关联组、候选核验和不同区域 SKU 展示；均非真实业务记录。
spuData.push(
 {id:'PHK_3EUS', title:'新品 DL 9600BTU 静音移动空调 115V/60Hz 带前数显 单制冷 美规 ABS', region:'美国 / 美规', score:'96.5', purchase:'1288.3000', prices:'US Amazon - MSF：389.99<br>Amazon - FBM：389.99', profit:'US MSF：9.4%<br>US FBM：4.8%', img:0, status:'none', group:'', candidates:[]},
 {id:'PHK_3ECA', title:'新品 DL 9600BTU 静音移动空调 115V/60Hz 带前数显 单制冷 美规 ABS', region:'加拿大 / 美规', score:'95.2', purchase:'1292.1000', prices:'CA Amazon - MSF：419.99<br>Amazon - FBM：419.99', profit:'CA MSF：8.9%<br>CA FBM：4.2%', img:1, status:'none', group:'', candidates:[]},
 {id:'PHK_3EMX', title:'新品 DL 9600BTU 静音移动空调 127V/60Hz 带前数显 单制冷 美规 ABS', region:'墨西哥 / 美规', score:'91.8', purchase:'1299.8000', prices:'MX Amazon - MSF：7499.00', profit:'MX MSF：7.8%', img:2, status:'none', group:'', candidates:[]},
 {id:'PHK_3EDE', title:'新品 DL 9600BTU 静音移动空调 220-240V/50Hz 带前数显 TAC-09CPB 单制冷 欧规 ABS', region:'德国 / 欧规', score:'94.5', purchase:'1280.5000', prices:'DE Amazon - MSF：429.99<br>Amazon - FBM：429.99', profit:'DE MSF：8.1%<br>DE FBM：3.9%', img:3, status:'candidate', group:'', candidates:['PHK_3EPQ','PHK_3ERT']},
 {id:'PHK_3EFR', title:'新品 DL 9600BTU 静音移动空调 220-240V/50Hz 带前数显 TAC-09CPB 单制冷 欧规 ABS', region:'法国 / 欧规', score:'93.8', purchase:'1281.7000', prices:'FR Amazon - MSF：419.99', profit:'FR MSF：8.4%', img:4, status:'candidate', group:'', candidates:['PHK_3EPQ']},
 {id:'PHK_3EIT', title:'新品 DL 9600BTU 静音移动空调 220-240V/50Hz 带前数显 单制冷 欧规 ABS', region:'意大利 / 欧规', score:'92.8', purchase:'1284.0000', prices:'IT Amazon - MSF：419.99', profit:'IT MSF：7.9%', img:5, status:'none', group:'', candidates:[]},
 {id:'PHK_3EPL', title:'新品 DL 9600BTU 静音移动空调 220-240V/50Hz 带前数显 单制冷 欧规 ABS', region:'波兰 / 欧规', score:'90.8', purchase:'1286.6000', prices:'PL Amazon - MSF：1899.00', profit:'PL MSF：7.2%', img:0, status:'none', group:'', candidates:[]},
 {id:'PHK_3EUK', title:'新品 DL 9600BTU 静音移动空调 220-240V/50Hz 带前数显 TAC-09CPB/DM7 单制冷 英规 ABS', region:'英国 / 英规', score:'94.1', purchase:'1285.2000', prices:'UK Amazon - MSF：399.99', profit:'UK MSF：8.0%', img:1, status:'candidate', group:'', candidates:['PHK_3EPQ']},
 {id:'PHK_3EJP', title:'新品 DL 9600BTU 静音移动空调 100V/50-60Hz 带前数显 单制冷 日规 ABS', region:'日本 / 日规', score:'91.2', purchase:'1301.2000', prices:'JP Amazon - MSF：49800', profit:'JP MSF：6.8%', img:2, status:'none', group:'', candidates:[]},
 {id:'PHK_3EKR', title:'新品 DL 9600BTU 静音移动空调 220V/60Hz 带前数显 单制冷 韩规 ABS', region:'韩国 / 韩规', score:'90.5', purchase:'1304.1000', prices:'KR Amazon - MSF：549000', profit:'KR MSF：6.5%', img:3, status:'none', group:'', candidates:[]},
 {id:'PHK_3EAU', title:'新品 DL 9600BTU 静音移动空调 220-240V/50Hz 带前数显 单制冷 澳规 ABS', region:'澳洲 / 澳规', score:'92.1', purchase:'1298.6000', prices:'AU Amazon - MSF：599.00', profit:'AU MSF：7.7%', img:4, status:'none', group:'', candidates:[]},
 {id:'PHK_3EW1', title:'新品 DL 9600BTU 智能静音移动空调 WIFI 220-240V/50Hz 单制冷 欧规 ABS', region:'欧洲 / 欧规', score:'95.6', purchase:'1310.2000', prices:'DE Amazon - MSF：449.99', profit:'DE MSF：9.0%', img:5, status:'none', group:'', candidates:[]},
 {id:'PHK_3EH1', title:'新品 DL 9600BTU 静音移动空调 制冷制热 220-240V/50Hz 英规 ABS', region:'英国 / 英规', score:'94.9', purchase:'1338.4000', prices:'UK Amazon - MSF：429.99', profit:'UK MSF：8.6%', img:0, status:'none', group:'', candidates:[]},
 {id:'PHK_3E90', title:'新品 DL 9000BTU 紧凑型移动空调 220-240V/50Hz 单制冷 欧规 ABS', region:'欧洲 / 欧规', score:'88.5', purchase:'1198.7000', prices:'DE Amazon - MSF：349.99', profit:'DE MSF：5.2%', img:1, status:'none', group:'', candidates:[]},
 {id:'PHK_3EPC', title:'新品 DL 12000BTU 商用移动空调 高风量 220-240V/50Hz 欧规 ABS', region:'欧洲 / 欧规', score:'89.8', purchase:'1488.9000', prices:'DE Amazon - MSF：529.99', profit:'DE MSF：4.8%', img:2, status:'none', group:'', candidates:[]}
);
const groupInfo = {
 'GRP-001': {name:'移动空调 · 制热 WiFi 区域款组', note:'模拟示例：同一核心产品因销售地区和电气制式不同拆分为多个 SPU。', created:'2026-10-23', members:['PHK_3ES4','PHK_3ERY']},
 'GRP-002': {name:'移动空调 · 制热区域款组', note:'模拟示例：同一产品的不同区域版本。', created:'2026-10-23', members:['PHK_3ERV','PHK_3ERU']}
};
const similarSpuRelations = {
 'PHK_3ES4': [
  {spu:'PHK_39WM3GRH', img:0, title:'10L(2.66AL)触摸式冰冷空调扇 带遥控 英规240V,50/60Hz 45W 白色 FK2406Y 塑胶'},
  {spu:'PHK_39WMNJGG', img:1, title:'10L(2.66AL)触摸式冰冷空调扇 带遥控 英规240V,50/60Hz 45W 白色 FK2402Y 塑胶'},
  {spu:'PHK_39WMK3LQ', img:2, title:'10L(2.66AL)触摸式冰冷空调扇 带遥控 英规240V,50/60Hz 45W 白色 FK2401Y 塑胶'}
 ],
 'PHK_3ERY': [
  {spu:'PHK_39WM3GRH', img:0, title:'10L(2.66AL)触摸式冰冷空调扇 带遥控 欧规240V,50/60Hz 45W 白色 FK2406Y 塑胶'},
  {spu:'PHK_39WMNJGG', img:1, title:'10L(2.66AL)触摸式冰冷空调扇 带遥控 欧规240V,50/60Hz 45W 白色 FK2402Y 塑胶'}
 ],
 'PHK_3EPQ': [
  {spu:'PHK_39WM3GRH', img:0, title:'10L(2.66AL)触摸式冰冷空调扇 带遥控 欧规240V,50/60Hz 45W 白色 FK2406Y 塑胶'},
  {spu:'PHK_39WMK3LQ', img:2, title:'10L(2.66AL)触摸式冰冷空调扇 带遥控 欧规240V,50/60Hz 45W 白色 FK2401Y 塑胶'}
 ]
};

// 重复品检测示例数据：字段结构对应 Skill 的结构化 JSON；taskState 为 ERP 异步任务状态，属于系统集成层字段。
const duplicateDetectionData = {
 'PHK_3ES4': {
  taskState:'completed', taskId:'DUP-20261031-001', status:'已完成', is_duplicate:'是',
  target_sku:'PHK_3ES4QX5Q', target_spu:'PHK_3ES4',
  target_title:'新品 DL 9600BTU 静音移动空调 带制热款 WIFI+A++ 220-240V/50Hz 带前数显 英规 ABS',
  target_category:'家居、厨具、家装 > 制冷设备 > 移动空调',
  target_image:null,
  same_product_count:1, same_style_count:1, suspected_count:1, non_duplicate_count:2, candidate_count:5,
  summary:'检测发现 1 个相同产品、1 个同款产品和 1 个疑似重复候选。建议优先处理相同产品；同款产品需人工确认，不直接删除。',
  duplicate_items_json: JSON.stringify([
   {duplicate_type:'相同产品',similar_spu:'PHK_3EDE',similar_sku:'PHK_3EDE8K2A',similar_title:'新品 DL 9600BTU 静音移动空调 220-240V/50Hz 带前数显 TAC-09CPB 单制冷 欧规 ABS',similar_category:'家居、厨具、家装 > 制冷设备 > 移动空调',similar_image:null,recall_source:'标题+图片',image_judgement:'外形主体一致',image_summary:'两张主图均为立式移动空调，机身轮廓、出风口布局和底部滚轮结构一致。',reason:'标题主体与外形主体一致；示例数据中供应商编码一致，采购价整数部分一致。',difference:'',suggestion:'建议删除重复产品，保留已有产品。'},
   {duplicate_type:'同款产品',similar_spu:'PHK_3EPC',similar_sku:'PHK_3EPC3L7M',similar_title:'新品 DL 12000BTU 商用移动空调 高风量 220-240V/50Hz 欧规 ABS',similar_category:'家居、厨具、家装 > 制冷设备 > 移动空调',similar_image:null,recall_source:'标题+图片',image_judgement:'外形主体一致',image_summary:'两张主图的产品主体结构和立式机身形态一致，局部结构存在差异。',reason:'标题主体与外形主体一致，但关键规格未达到相同产品判断标准。',difference:'制冷量及功能配置存在差异。',suggestion:'建议人工确认是否合并保留，不直接删除。'},
   {duplicate_type:'疑似重复',similar_spu:'PHK_3E90',similar_sku:'PHK_3E90F6D1',similar_title:'新品 DL 9000BTU 紧凑型移动空调 220-240V/50Hz 单制冷 欧规 ABS',similar_category:'家居、厨具、家装 > 制冷设备 > 移动空调',similar_image:null,recall_source:'图片',image_judgement:'外形主体无法确认',image_summary:'候选图主体被遮挡，无法有效确认内部结构及连接方式。',reason:'图片召回命中，但外形主体无法确认，需人工复核。',difference:'外形信息不足，暂不能确认是否同款。',suggestion:'建议人工复核后再判断。'}
  ])
 },
 'PHK_3ERY': {
  taskState:'completed', taskId:'DUP-20261031-002', status:'已完成', is_duplicate:'疑似',
  target_sku:'PHK_3ERY4R9N', target_spu:'PHK_3ERY',
  target_title:'新品 DL 9600BTU 静音移动空调 带制热 WIFI 220-240V/50Hz 欧规 ABS',
  target_category:'家居、厨具、家装 > 制冷设备 > 移动空调', target_image:null,
  same_product_count:0, same_style_count:0, suspected_count:2, non_duplicate_count:1, candidate_count:3,
  summary:'发现 2 个疑似重复候选，标题或外形存在单项相似，尚不能判定为相同产品或同款产品。',
  duplicate_items_json: JSON.stringify([
   {duplicate_type:'疑似重复',similar_spu:'PHK_3EDE',similar_sku:'PHK_3EDE8K2A',similar_title:'新品 DL 9600BTU 静音移动空调 220-240V/50Hz 带前数显 TAC-09CPB 单制冷 欧规 ABS',similar_category:'家居、厨具、家装 > 制冷设备 > 移动空调',similar_image:null,recall_source:'标题+图片',image_judgement:'外形主体不一致',image_summary:'两张图的机身轮廓接近，但出风结构和底部部件布局存在差异。',reason:'标题主体一致，但外形主体不一致。',difference:'出风结构和底部部件布局存在差异。',suggestion:'建议人工复核后再判断。'},
   {duplicate_type:'疑似重复',similar_spu:'PHK_3EPC',similar_sku:'PHK_3EPC3L7M',similar_title:'新品 DL 12000BTU 商用移动空调 高风量 220-240V/50Hz 欧规 ABS',similar_category:'家居、厨具、家装 > 制冷设备 > 移动空调',similar_image:null,recall_source:'图片',image_judgement:'外形主体一致',image_summary:'两张图的立式机身与底部滚轮结构相似。',reason:'外形主体一致，但标题主体不一致。',difference:'标题中的产品规格与功能描述不同。',suggestion:'建议人工复核后再判断。'}
  ])
 },
 'PHK_3ERV': {
  taskState:'completed', taskId:'DUP-20261031-003', status:'已完成', is_duplicate:'否',
  target_sku:'PHK_3ERV6H3D', target_spu:'PHK_3ERV',
  target_title:'新品 DL 9600BTU 静音移动空调 带制热 A++ 220-240V/50Hz 英规 ABS',
  target_category:'家居、厨具、家装 > 制冷设备 > 移动空调', target_image:null,
  same_product_count:0, same_style_count:0, suspected_count:0, non_duplicate_count:4, candidate_count:4,
  summary:'本次参与判断的 4 个候选均未满足相同产品、同款产品或疑似重复条件，未发现重复开品。',
  duplicate_items_json:'[]'
 },
 'PHK_3ERU': {
  taskState:'running', taskId:'DUP-20261031-004', status:'', is_duplicate:'',
  summary:'任务已提交 Agent，等待检测结果通过 Webhook 回传。'
 },
 'PHK_3ERT': {
  taskState:'pending', taskId:'', status:'', is_duplicate:'',
  summary:'商品信息已创建，等待系统触发重复品检测任务。'
 },
 'PHK_3EPQ': {
  taskState:'completed', taskId:'DUP-20261031-006', status:'无产品信息', is_duplicate:'',
  target_sku:'', target_spu:'PHK_3EPQ', target_title:'', target_category:'', target_image:null,
  same_product_count:0, same_style_count:0, suspected_count:0, non_duplicate_count:0, candidate_count:0,
  summary:'未获取到有效的目标商品信息，本次未执行重复判断。',
  duplicate_items_json:'[]',
  error_message:''
 }
};


// 原型补充案例。下列 taskState 为 ERP 的异步任务状态；mock_trace 是用于演示“没有候选”的扩展信息，当前 Skill 不返回。
const duplicateCases = [
 ['PHK_3EUS',2,0,0,2],
 ['PHK_3ECA',0,1,0,1],
 ['PHK_3EFR',1,0,2,1],
 ['PHK_3EIT',0,2,1,0],
 ['PHK_3EPL',1,1,0,2],
 ['PHK_3EW1',0,1,1,1],
 ['PHK_3EH1',0,0,1,2],
 ['PHK_3EPC',1,1,1,3]
];
// 复用项目已有的 SPU 数据作为可点击的候选产品展示，不涉及真实检测结果。
function makeDemoDuplicateRecord(spu,a,b,c,d){
 const item=spuData.find(x=>x.id===spu);
 const pool=spuData.filter(x=>x.id!==spu && (!item.group || x.group!==item.group) && !/^PHK_3(?:TB|FL)/.test(x.id));
 const selected=pool.slice(0,a+b+c);
 const types=[...Array(a).fill('相同产品'),...Array(b).fill('同款产品'),...Array(c).fill('疑似重复')];
 const details=selected.map((v,i)=>({
  duplicate_type:types[i],similar_spu:v.id,similar_sku:v.id+'QX5Q',similar_title:v.title,
  similar_category:'家居、厨具、家装 > 制冷设备 > 移动空调',similar_image:'',
  recall_source:i%2?'标题':'标题+图片',
  image_judgement:types[i]==='疑似重复'?'外形主体无法确认':'外形主体一致',
  image_summary:types[i]==='疑似重复'?'示例图片未提供可核验内容，本次外形无法确认。':'示意：产品主体结构及主要部件布局一致（模拟数据，非真实视觉判定）。',
  reason:types[i]==='相同产品'?'示意：标题及外形主体一致，供应商与采购价整数部分一致。':types[i]==='同款产品'?'示意：标题及外形主体一致，但采购和关键规格不足以判为相同产品。':'示意：标题主体相似，但图片不足以确认外形一致。',
  difference:types[i]==='同款产品'?'采购价或产品关键规格存在差异。':'',
  suggestion:types[i]==='相同产品'?'建议删除重复产品':types[i]==='同款产品'?'建议人工确认是否合并保留':'建议人工复核后再判断'
 }));
 const conclusion=a+b?'是':c?'疑似':'否';
 return {taskState:'completed',taskId:'DEMO-'+spu,status:'已完成',is_duplicate:conclusion,
 target_sku:item.id+'QX5Q',target_spu:item.id,target_title:item.title,target_category:'家居、厨具、家装 > 制冷设备 > 移动空调',target_image:'',
 same_product_count:a,same_style_count:b,suspected_count:c,non_duplicate_count:d,candidate_count:a+b+c+d,
 summary:a+b?`本次发现 ${a} 个相同产品、${b} 个同款产品，另有 ${c} 个疑似重复候选。`:c?`没有发现确定重复产品，但有 ${c} 个疑似候选需要人工复核。`:`共 ${d} 个候选进入最终判断，均为非重复。`,
 duplicate_items_json:JSON.stringify(details),error_message:''};
}
duplicateCases.forEach(([spu,a,b,c,d])=>duplicateDetectionData[spu]=makeDemoDuplicateRecord(spu,a,b,c,d));
function emptyDemoRecord(spu,emptyKind){
 const item=spuData.find(x=>x.id===spu);
 return {taskState:'completed',taskId:'DEMO-ZERO-'+spu,status:'已完成',is_duplicate:'否',target_sku:item.id+'QX5Q',target_spu:item.id,target_title:item.title,target_category:'家居、厨具、家装 > 制冷设备 > 移动空调',
 same_product_count:0,same_style_count:0,suspected_count:0,non_duplicate_count:0,candidate_count:0,duplicate_items_json:'[]',
 mock_trace:emptyKind,summary:'本次没有有效候选进入最终重复判断。'};
}
duplicateDetectionData['PHK_3EMX']=emptyDemoRecord('PHK_3EMX','none-recalled');
duplicateDetectionData['PHK_3EDE']=emptyDemoRecord('PHK_3EDE','all-filtered');
duplicateDetectionData['PHK_3EUK']={taskState:'queued',taskId:'DEMO-Q-01',status:'',is_duplicate:'',summary:'任务已入队，等待 Agent 执行'};
duplicateDetectionData['PHK_3EJP']={taskState:'processing',taskId:'DEMO-P-01',status:'',is_duplicate:'',summary:'Webhook 已返回，ERP 校验及落库中'};
duplicateDetectionData['PHK_3EKR']={taskState:'failed',taskId:'DEMO-F-01',status:'查询失败',is_duplicate:'',error_message:'调用商品销售接口失败，请检查接口返回及任务日志。'};
duplicateDetectionData['PHK_3EAU']={taskState:'timeout',taskId:'DEMO-T-01',status:'',is_duplicate:'',error_message:'任务执行超过约定时限，尚未收到有效回调。'};



/* 数据访问：按 id 取 SPU 记录 */
function getSpu(id){return spuData.find(x=>x.id===id)}

/* 利润列展示：公司 / 备货人 / 分销人三个视角，从同一份基础利润率派生，统一显示为区间。 */
function profitCell(text,index){
  const base=String(text||'');
  const offsets=[0,-0.4,-1.1];
  const off=offsets[index]||0;
  return base.replace(/([\d.]+)%/g,function(m,v){
    const n=parseFloat(v);
    if(isNaN(n))return m;
    const lo=Math.max(0,n+off);
    const hi=Math.max(0,n+1.2);
    return lo.toFixed(1)+'% ~ '+hi.toFixed(1)+'%';
  });
}

/* 表格后段业务列（模拟数据）：SKU/SPU立项运营、SKU数量、BOM单、关联样品质检、
   说明书、商品报价单、创建时间、关联项目时间、创建开发人、当前开发人。
   顺序与正式系统页面一致；数据为演示用，按 SPU 稳定派生，保证两种列表渲染路径结果相同。 */
const bizSamples = [
  ['',       '',       1, 0, '未上传', '未上传', 0, '2026-11-12', '09:23:09', '09:23:21', '王丽君', '叶志斌'],
  ['',       '',       1, 0, '未上传', '未上传', 0, '2026-11-12', '09:05:41', '09:05:51', '王丽君', '叶志斌'],
  ['孙悦02', '孙悦02', 3, 1, '未上传', '未上传', 1, '2026-08-20', '10:19:29', '10:19:31', '叶志斌', '叶志斌'],
  ['于瑞楠', '于瑞楠', 3, 1, '下载',   '已驳回', 1, '2026-05-11', '16:31:25', '16:31:26', '叶志斌', '叶志斌'],
  ['黎嘉慧', '黎嘉慧', 3, 1, '未上传', '未上传', 1, '2025-11-12', '14:18:57', '14:18:59', '叶志斌', '叶志斌'],
  ['王丽君', '王丽君', 4, 1, '下载',   '已驳回', 1, '2026-07-17', '21:33:51', '21:33:55', '孔曼娜', '叶志斌'],
  ['周婧怡', '周婧怡', 2, 1, '未上传', '未上传', 1, '2026-06-03', '15:42:10', '15:42:16', '叶志斌', '孔曼娜'],
  ['陈嘉豪', '陈嘉豪', 5, 1, '下载',   '已驳回', 1, '2026-04-28', '11:07:33', '11:07:41', '叶志斌', '叶志斌'],
  ['李媛萌', '李媛萌', 3, 0, '未上传', '未上传', 0, '2026-03-15', '09:51:02', '09:51:08', '王丽君', '孔曼娜']
];
const bizRowOrder = ['PHK_3ERU','PHK_3CAR','PHK_3ES4','PHK_3EPC','PHK_3ECA','PHK_3ERY','PHK_3ERV','PHK_3ERT','PHK_3EPQ'];

function bizFileLink(text){
  const icon = text === '下载'
    ? '<svg class="biz-file-icon" viewBox="0 0 12 14" aria-hidden="true"><path d="M1.2.8h6.4l3.2 3.2v9.2H1.2z"/><path d="M7.6.8v3.2h3.2M3.2 7.4h5M3.2 9.4h5"/></svg>'
    : '';
  return `<a class="biz-file-link" href="javascript:void(0)" onclick="toast('演示原型：附件下载未接入')">${text}${icon}</a>`;
}

function spuBizCells(spu){
  let i = bizRowOrder.indexOf(spu && spu.id);
  if (i < 0) {
    let h = 7; const s = (spu && spu.id) || '';
    for (let k = 0; k < s.length; k++) h = (h * 33 + s.charCodeAt(k)) >>> 0;
    i = h % bizSamples.length;
  }
  const d = bizSamples[i % bizSamples.length];
  const manualTag = `<span class="biz-state-tag"><span class="biz-state-dot">i</span>${d[5]}</span>`;
  const time = t => `<span class="biz-time">${d[7]}<br>${t}</span>`;
  return [
    `<td class="biz-cell">${d[0]}</td>`,
    `<td class="biz-cell">${d[1]}</td>`,
    `<td class="biz-cell">${d[2]}</td>`,
    `<td class="biz-cell">${d[3] ? bizFileLink('下载') : '<span class="biz-na">无</span>'}</td>`,
    `<td class="biz-cell"><span class="biz-na">-</span></td>`,
    `<td class="biz-cell"><div class="biz-manual-inner">${bizFileLink(d[4])}${manualTag}</div></td>`,
    `<td class="biz-cell">${d[6] ? bizFileLink('下载') : '<span class="biz-na">无</span>'}</td>`,
    `<td class="biz-cell">${time(d[8])}</td>`,
    `<td class="biz-cell">${time(d[9])}</td>`,
    `<td class="biz-cell">${d[10]}</td>`,
    `<td class="biz-cell">${d[11]}</td>`
  ].join('');
}
