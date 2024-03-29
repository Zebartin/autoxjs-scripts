var {
  启动NIKKE, 等待NIKKE加载, 退出NIKKE,
  mostSimilar, 返回首页, 关闭限时礼包,
  detectNikkes, NikkeToday, checkAuto
} = require('./NIKKEutils.js');
var { 模拟室 } = require('./模拟室.js');
var {
  scaleBack, ocrUntilFound, clickRect, findImageByFeature,
  requestScreenCaptureAuto, getDisplaySize,
  findContoursRect, rgbToGray, imageColorCount
} = require('./utils.js');
let width, height;
let advise = null;
let NIKKEstorage = storages.create("NIKKEconfig");
if (typeof module === 'undefined') {
  auto.waitFor();
  checkConfig();
  启动NIKKE();
  // 保证申请截屏权限时，屏幕是游戏画面
  sleep(1000);
  if (NIKKEstorage.get('alreadyInGame', false) == false) {
    for (let i = 0; i < 3; ++i) {
      toast('脚本等待中...');
      sleep(5000);
    }
  }
  requestScreenCaptureAuto();
  日常();
  exit();
}
else {
  module.exports = {
    日常: 日常
  };
}
function 日常() {
  [width, height] = getDisplaySize();
  const todoTask = JSON.parse(NIKKEstorage.get('todoTask', null));
  const taskFunc = {
    商店: 商店,
    基地收菜: () => 基地收菜(todoTask.includes('每日任务') && !dailyMissionCompleted()),
    好友: 好友,
    竞技场: 竞技场,
    爬塔: 爬塔,
    咨询: 咨询,
    模拟室: () => 模拟室(true),
    每日任务: 每日任务
  };
  let alreadyRetry = 0;
  const maxRetry = NIKKEstorage.get('maxRetry', 1);
  let retryFunc = (func) => {
    for (; alreadyRetry <= maxRetry; ++alreadyRetry) {
      try {
        等待NIKKE加载();
        func();
        return true;
      } catch (error) {
        if (!error.message.includes('InterruptedException')) {
          toast(error.message);
          console.error(error.message);
          console.error(error.stack);
          // 保存出错截图
          let filename = files.path(`./images/nikkerror/${Date.now()}.jpg`);
          images.save(captureScreen(), filename);
          log(`出错截图已保存到${filename}`);
          log(`当前脚本版本：${NIKKEstorage.get('tagName', '无记录')}`)
          if (alreadyRetry != maxRetry) {
            toastLog(`脚本出错，即将重试(${alreadyRetry + 1}/${maxRetry})`);
            sleep(3000);
            退出NIKKE();
            启动NIKKE();
          }
        } else
          return false;
      }
    }
  };
  for (let task of todoTask)
    if (!retryFunc(taskFunc[task]))
      break;
  if (NIKKEstorage.get('exitGame', false))
    退出NIKKE();
  else
    console.show();
  if (images.stopScreenCapturer) {
    images.stopScreenCapturer();
  }
  toastLog('NIKKE脚本结束运行');
}

function checkConfig() {
  const todoTask = JSON.parse(NIKKEstorage.get('todoTask', null));
  if (todoTask == null) {
    toastLog('未进行配置，请运行NIKKE设置.js并保存设置');
    exit();
  }
  const simulationRoom = JSON.parse(NIKKEstorage.get('simulationRoom', null));
  if (simulationRoom == null) {
    toast('配置存在问题，请重新运行NIKKE设置.js并保存设置');
    console.error('todoTask != null, simulationRoom == null');
    exit();
  }
}

function 废铁商店() {
  const GOODS = {
    "珠宝": /珠宝/,
    "成长套组": /成长套组/,
    "好感券-通用": /[通逼]/,
    "好感券-极乐净土": /极/,
    "好感券-米西利斯": /米/,
    "好感券-泰特拉": /特/,
    "好感券-朝圣者": /(朝|补给|交换)/,
    "好感券-反常": /反/,
    "芯尘盒": /尘盒$/,
    "信用点盒": /点盒$/,
    "战斗数据辑盒": /辑盒$/,
    "信用点": /点$/
  };
  const PATTERN = new RegExp(`(${Object.values(GOODS).map(x => x.source).join('|')})`);
  const LAST_GOOD = GOODS['信用点'];
  const userSetting = NIKKEstorage.get('recyclingShopList', ['珠宝', '芯尘盒']);
  const userPattern = new RegExp(`(${userSetting.map(x => GOODS[x].source).join('|')})`);
  if (userSetting.length == 0)
    return;
  const checkInterval = NIKKEstorage.get('recyclingShopInterval', 3);
  const lastChecked = NIKKEstorage.get('recyclingShopLastChecked', null);
  let diffMillSec = new Date(NikkeToday()) - new Date(lastChecked);
  let diffDay = Math.round(diffMillSec / 1000 / 60 / 60 / 24);
  log(`距离上次检查废铁商店${diffDay}天`);
  if (!isNaN(diffDay) && diffDay < checkInterval)
    return;
  const recyclingShopImage = images.read("./images/recyclingShop.jpg");
  let recyclingShop = null;
  for (let i = 0; i < 10; ++i) {
    recyclingShop = findImageByFeature(captureScreen(), recyclingShopImage, {
      threshold: 0.7,
      region: [0, height * 0.3, width / 2, height * 0.6]
    });
    if (recyclingShop != null)
      break;
    sleep(300);
  }
  if (recyclingShop === null) {
    console.error('无法找到废铁商店图标，放弃');
    return;
  }
  // 减少可点击范围，避免点到悬浮窗
  recyclingShop.bounds.left += recyclingShop.bounds.width() * 0.7;
  recyclingShop.text = '废铁商店图标';
  recyclingShopImage.recycle();
  clickRect(recyclingShop);
  const upperBound = ocrUntilFound(res => {
    let t = res.find(e => e.text.match(/(废铁|[破玻][碎码])/) != null);
    if (t == null) {
      clickRect(recyclingShop, 1, 0);
      return null;
    }
    return res.find(e => e.text.match(/(距离|更新|还有)/) != null);
  }, 20, 600).bounds.bottom;
  for (let i = 0; i < 10; ++i) {
    let goods = ocrUntilFound(res => {
      let ret = res.filter(e =>
        PATTERN.test(e.text) && e.level == 3 && e.bounds.bottom > upperBound
      ).toArray();
      if (ret.length == 0)
        return null;
      ret.sort((a, b) => {
        let t = a.bounds.bottom - b.bounds.bottom;
        if (Math.abs(t) < 10)
          return a.bounds.left - b.bounds.left;
        return t;
      });
      return ret;
    }, 20, 600);
    let firstGood = goods[0], lastGood = goods[goods.length - 1];
    let wantedGoods = goods.filter(e => userPattern.test(e.text));
    console.info(`当前页面商品：${goods.map(e => e.text).join(', ')}`);
    for (let good of wantedGoods)
      buyGood(good, true);
    if (LAST_GOOD.test(lastGood.text))
      break;
    let middleLine = (lastGood.bounds.top + firstGood.bounds.top) / 2;
    gestures(
      [0, 500, [width / 2, lastGood.bounds.top], [width / 2, upperBound]],
      [600, 200, [firstGood.bounds.left, middleLine], [lastGood.bounds.right, middleLine]]
    );
  }
  NIKKEstorage.put('recyclingShopLastChecked', NikkeToday());
}
function cashShop() {
  if (!NIKKEstorage.get('checkCashShopFree', false))
    return;
  let handlePopUp = (res) => {
    if (res.text.match(/操控|关闭$|意见/) == null)
      return false;
    let close = res.find(e => e.text.endsWith('关闭'));
    if (close == null)
      return false;
    clickRect(close, 1, 0);
    return true;
  }
  clickRect(ocrUntilFound(res => res.find(e => e.text.includes('付')), 30, 1000));
  let upperBound = ocrUntilFound((res, img) => {
    if (handlePopUp(res))
      return null;
    let cashShopBtn = res.find(e =>
      e.text.includes('付') && e.bounds != null &&
      e.bounds.right < img.width / 2 && e.bounds.bottom >= img.height * 0.5
    );
    if (cashShopBtn != null) {
      clickRect(cashShopBtn, 1, 0);
      return null;
    }
    let ubs = res.filter(e => e.text.match(/([仅在指定的销售期间]{3,}|[从同时出现的礼包中]{3,})/) != null).toArray();
    if (ubs.length == 0) {
      return null;
    }
    return ubs.reduce((prev, curr) =>
      prev.bounds.top < curr.bounds.top ? prev : curr
    ).bounds.bottom;
  }, 20, 1000);
  if (upperBound === null) {
    console.error('无法进入付费商店');
    return;
  }
  let cashShopImg = images.read('./images/cashShop.jpg');
  let target = null;
  for (let i = 0; i < 3; ++i) {
    let img = captureScreen();
    target = findImageByFeature(img, cashShopImg, {
      region: [0, upperBound, img.width, cashShopImg.height * 5]
    });
    if (target == null) {
      sleep(1000);
      continue;
    }
    target.text = '礼包图标';
    let clicked = false;
    for (let j = 0; j < 3; ++j) {
      clickRect(target, 1, 0);
      sleep(1000);
      let targetColor = captureScreen().pixel(target.bounds.right, target.bounds.centerY());
      if (rgbToGray(targetColor) >= 100) {
        clicked = true;
        break;
      }
    }
    if (clicked)
      break;
  }
  cashShopImg.recycle();
  if (target === null) {
    console.error('无法找到礼包图标，放弃');
    返回首页();
    return;
  }
  let [daily, weekly, monthly] = ocrUntilFound((res, img, scale) => {
    if (handlePopUp(res))
      return null;
    let d = res.find(e => e.text.endsWith('日'));
    let w = res.find(e => e.text.endsWith('周'));
    let m = res.find(e => e.text.endsWith('月'));
    if (!d || !w || !m) {
      if (d != null) {
        scaleBack(d, scale);
        swipe(
          d.bounds.right, d.bounds.centerY(),
          0, d.bounds.centerY(), 500
        );
      }
      return null;
    }
    return [d, w, m];
  }, 30, 700, { maxScale: 2 });
  for (let btn of [daily, weekly, monthly]) {
    let name = btn.text.substr(-1);
    clickRect(btn, 1, 200);
    let [free, color] = ocrUntilFound((res, img) => {
      if (handlePopUp(res))
        return null;
      let t = res.find(e => e.text.includes(name + '免'));
      if (!t) {
        clickRect(btn, 1, 0);
        return null;
      }
      return [t, img.pixel(t.bounds.left, t.bounds.bottom + 5)];
    }, 20, 700);
    if (rgbToGray(color) < 50)
      log(`每${name}免费礼包已领取`);
    else {
      clickRect(free, 1, 0);
      let clickOut = ocrUntilFound(res => res.find(
        e => e.text.includes('点击')
      ), 10, 800, { maxScale: 4 });
      if (clickOut != null)
        clickRect(clickOut);
    }
  }
  返回首页();
}
function backToRefresh() {
  ocrUntilFound(res => {
    if (res.text.match(/(距离|更新|还有)/) === null) {
      back();
      sleep(600);
      return false;
    }
    return true;
  }, 20, 600);
}
function buyGood(good, doMax) {
  let c = captureScreen().pixel(good.bounds.right + 5, good.bounds.bottom);
  if (good.text != '免费商品' && rgbToGray(c) < 100) {
    log(`${good.text}已售`);
    return;
  }
  log(`购买${good.text}`);
  clickRect(good, 0.5);
  let [costGem] = ocrUntilFound(res => {
    let t = res.find(e => e.text == '购买');
    if (!t) {
      clickRect(good, 0.5, 0);
      return null;
    }
    let gem = res.find(e =>
      e.text.match(/(珠宝|招募|优先|扣除)/) != null &&
      e.bounds != null && e.bounds.bottom < t.bounds.top
    );
    return [gem != null];
  }, 15, 600) || [null];
  if (costGem === null) {
    log('无法进入购买页面');
    return;
  }
  if (costGem && good.text != '免费商品' && !good.text.includes('珠宝')) {
    log('消耗珠宝，放弃购买');
    backToRefresh();
    return;
  }
  let affordable = true;
  let confirmCount = 0;
  ocrUntilFound((res, img, scale) => {
    if (res.find(e => e.text.match(/不足.?$/) != null)) {
      affordable = false;
      return true;
    }
    if (res.text.match(/(距离|更新|还有)/) != null) {
      confirmCount++;
      if (confirmCount >= 3)
        return true;
    }
    let reward = res.find(e => e.text.match(/(REW|点击|奖励)/) != null);
    if (reward != null)
      click(width / 2, height * 0.8);
    let buyBtn = res.find(e => e.text.endsWith('购买'));
    if (buyBtn != null) {
      if (doMax) {
        let maxBtn = res.find(e => e.text.match(/M.X/i) != null);
        if (maxBtn == null)
          return null;
        // 可能识别到左侧的加号
        maxBtn.bounds.left += maxBtn.bounds.width() / 2;
        let cropped = images.clip(
          img, maxBtn.bounds.left, maxBtn.bounds.top,
          maxBtn.bounds.width(), maxBtn.bounds.height()
        );
        let count = imageColorCount(cropped, '#6b6b6b', 221);
        let ratio = count / (maxBtn.bounds.width() * maxBtn.bounds.height());
        cropped.recycle();
        if (ratio < 0.15) {
          scaleBack(maxBtn, scale);
          clickRect(maxBtn, 0.6, 0);
          sleep(400);
          return null;
        }
      }
      scaleBack(buyBtn, scale);
      clickRect(buyBtn, 1, 0);
      confirmCount = 0;
    }
    return null;
  }, 20, 600, { gray: true, maxScale: 4 });
  if (!affordable) {
    log('资金不足');
    backToRefresh();
  }
}

function 商店() {
  let buyFree = () => {
    let freeGood = ocrUntilFound(res => res.find(e => e.text.match(/(100%|s[oq0]l[od0] [oq0]ut)/i) != null), 10, 300);
    let hasFree = (freeGood != null && freeGood.text.includes('100%'));
    if (hasFree) {
      freeGood.text = '免费商品';
      buyGood(freeGood);
    } else
      toastLog('免费商品已售');
    let otherItemNames = [];
    if (NIKKEstorage.get('buyCoreDust', false))
      otherItemNames.push('芯尘盒');
    if (NIKKEstorage.get('buyBondItem', false)) {
      otherItemNames.push('券');
      otherItemNames.push('米.*卡$');
    }
    if (otherItemNames.length > 0) {
      let pattern = null;
      if (otherItemNames.length == 1)
        pattern = otherItemNames[0]
      else
        pattern = '(' + otherItemNames.join('|') + ')';
      pattern = new RegExp(pattern);
      let otherItems = ocrUntilFound(res => {
        let ret = res.toArray(3).toArray().filter(e => e.text.match(pattern) != null);
        if (ret.length == 0)
          return null;
        return ret;
      }, 4, 300) || [];
      for (let item of otherItems) {
        buyGood(item);
      }
    }
  };
  let lastFreshed = NIKKEstorage.get('lastShopFreshed', null);
  if (lastFreshed === null) {
    NIKKEstorage.put('lastShopFreshed', NikkeToday());
    lastFreshed = NikkeToday();
  }
  ocrUntilFound((res, img) => {
    let shopBtn = res.find(e =>
      e.text == '商店' && e.bounds != null &&
      e.bounds.top >= img.height / 2
    );
    if (shopBtn != null) {
      clickRect(shopBtn, 1, 0);
      sleep(1000);
      return null;
    }
    return res.text.match(/(普[通逼]|100%|s[oq0]l[od0] [oq0]ut)/i) != null;
  }, 30, 800);
  buyFree();
  if (lastFreshed != NikkeToday()) {
    clickRect(ocrUntilFound(res => res.find(e => e.text.match(/(距离|更新|还有)/) != null), 10, 300));
    toastLog('刷新商店');
    clickRect(ocrUntilFound(res => res.find(e => e.text == '确认'), 10, 300));
    NIKKEstorage.put('lastShopFreshed', NikkeToday());
    // 等待刷新完成
    ocrUntilFound(res => res.text.match(/s[oq0]l[od0] [oq0]ut/i) == null, 20, 500);
    buyFree();
  } else
    log('今日已刷新过普通商店');
  const buyCodeManual = NIKKEstorage.get('buyCodeManual', 3);
  if (buyCodeManual != 0) {
    const arenaShopImage = images.read("./images/arenaShop.jpg");
    let arenaShop = null;
    for (let i = 0; i < 10; ++i) {
      arenaShop = findImageByFeature(captureScreen(), arenaShopImage, {
        threshold: 0.7,
        region: [0, height * 0.3, width / 2, height * 0.6]
      });
      if (arenaShop != null)
        break;
      sleep(300);
    }
    // 减少可点击范围，避免点到悬浮窗
    arenaShop.bounds.left += arenaShop.bounds.width() * 0.7;
    arenaShop.text = '竞技场商店图标';
    arenaShopImage.recycle();
    clickRect(arenaShop);
    let manuals = [];
    ocrUntilFound(res => {
      let shopName = res.find(e => e.text.match(/[竟竞]技场/) != null);
      if (!shopName) {
        clickRect(arenaShop, 0.8, 1);
        return false;
      }
      let upper = res.find(e => e.text.match(/(距离|更新|还有)/) != null);
      let goods = res.toArray(3).toArray().filter(e =>
        e.text.match(/(代码手册|选择|宝箱|([A-Z]\.?){2,})/) != null &&
        e.text.match(/(s[oq0]l[od0]|[oq0]ut)/i) == null &&
        e.bounds != null && e.bounds.top >= upper.bounds.bottom
      );
      if (goods.length > manuals.length)
        manuals = goods.slice();
      if (goods.length < 4)
        return false;
      return true;
    }, 20, 800);
    manuals.sort((a, b) => {
      let t = a.bounds.bottom - b.bounds.bottom;
      if (Math.abs(t) < 30)
        return a.bounds.left - b.bounds.left;
      return t;
    });
    if (manuals.length < 4)
      console.warn(`竞技场商店商品识别结果不足4个：${manuals}`);
    for (let i = 0; i < buyCodeManual && i < manuals.length; ++i) {
      buyGood(manuals[i]);
    }
  }
  废铁商店();
  返回首页();
  cashShop();
}

function collectDefense(outpostBtn, wipeOut) {
  let levelUp = false;
  clickRect(outpostBtn, 1, 0);
  let wipeOutBtn = ocrUntilFound(res => {
    let t = res.find(e => e.text.endsWith('灭'));
    if (t == null) {
      clickRect(outpostBtn, 1, 0);
      return null;
    }
    return t;
  }, 30, 1000);
  if (wipeOut && wipeOutBtn != null) {
    clickRect(wipeOutBtn, 1, 0);
    toastLog('尝试一举歼灭');
    clickRect(ocrUntilFound(res => {
      if (!res.text.includes('今日'))
        return null;
      return res.find(e => e.text.startsWith('进行'));
    }, 30, 1000), 1, 0);
    ocrUntilFound(res => {
      if (res.text.match(/(优先|珠宝|确认)/) != null)
        back();
      else if (res.text.includes('点击'))
        clickRect(res.find(e => e.text.includes('点击')), 1, 100);
      else
        return false;
      return true;
    }, 10, 1000);
    ocrUntilFound(res => res.text.includes('今日'), 30, 1000);
    back();
  }
  clickRect(ocrUntilFound(res => res.find(e => e.text.includes('奖励')), 30, 1000), 1, 300);
  clickRect(ocrUntilFound(res => res.find(e => e.text.match(/(点击|获得|奖励)/) != null), 10, 3000, { maxScale: 4 }), 1, 300);
  ocrUntilFound(res => {
    if (res.text.match(/(返回|中心|公告)/) != null)
      return true;
    let t = res.find(e => e.text.match(/(点击|获得|奖励)/) != null);
    if (t != null) {
      clickRect(t, 1, 0);
      toastLog('升级了');
      levelUp = true;
    }
    return false;
  }, 20, 600);
  return levelUp;
}

function dispatch(bulletin) {
  clickRect(bulletin, 0.3);
  // 等待派遣内容加载
  let target = ocrUntilFound(res => {
    let ret = res.text.match(/(时间|完成|目前)/);
    if (ret == null) {
      clickRect(bulletin, 0.3, 0);
      sleep(500);
    }
    return ret;
  }, 20, 500);
  // 已经没有派遣内容
  if (target[0] == '目前')
    toastLog('今日派遣已完成');
  else {
    let [send, receive] = ocrUntilFound(res => {
      let t1 = res.find(e => e.text.match(/全[都部]派/) != null);
      let t2 = res.find(e => e.text.match(/全[都部][领領邻]/) != null);
      if (!t1 || !t2)
        return null;
      return [t1, t2];
    }, 30, 1000);
    if (colors.red(captureScreen().pixel(receive.bounds.right, receive.bounds.top)) < 100) {
      toastLog('全部领取');
      clickRect(receive);
      clickRect(ocrUntilFound(res => res.find(e => e.text.includes('点击')), 20, 1000), 1, 300);
      ocrUntilFound(res => res.text.match(/(时间|目前)/), 20, 500);
    }
    if (colors.red(captureScreen().pixel(send.bounds.right, send.bounds.top)) > 240) {
      clickRect(send);
      sleep(1000);
      target = ocrUntilFound(res => {
        let cancel = res.find(e => e.text.match(/取[消清]/) != null);
        if (!cancel)
          return null;
        let ret = res.find(e =>
          e.text.includes('派') && e.bounds != null &&
          e.bounds.bottom > cancel.bounds.top
        )
        return ret;
      }, 30, 600, { maxScale: 8, gray: true });
      clickRect(target);
      ocrUntilFound(res => res.text.includes('全'), 30, 1000);
    }
  }
  clickRect(bulletin, 1, 0);
  ocrUntilFound(res => {
    if (res.text.match(/(全|目录)/) == null)
      return true;
    clickRect(bulletin, 1, 0);
    return false;
  }, 30, 1000);
}

function 基地收菜(doDailyMission) {
  let [bulletin, outpostBtn] = ocrUntilFound((res, img) => {
    let enter = res.find(e =>
      e.text.endsWith('基地') && e.bounds != null &&
      e.bounds.bottom > img.height / 2
    );
    if (enter != null) {
      clickRect(enter, 1, 0);
      sleep(1000);
      return null;
    }
    let headquarter = res.find(e => e.text.endsWith('中心'));
    let ret = res.find(e => e.text.match(/^派.*[公告栏]+$/) != null);
    let outpost = res.find(e => e.text.match(/(DEFENSE|LV[\.\d]+|\d{1,3}%)/) != null)
    if (!headquarter || !ret || !outpost)
      return null;
    // 将识别区域扩宽到整个公告栏图标
    ret.bounds.top = headquarter.bounds.bottom;
    return [ret, outpost];
  }, 30, 800);
  let levelUp = collectDefense(outpostBtn, true);
  dispatch(bulletin);
  if (doDailyMission)
    levelUp = collectDefense(outpostBtn, false) || levelUp;
  返回首页(levelUp);
}
function 好友() {
  // 一个好友都没有的话会出问题
  let [sendBtn, someFriend] = ocrUntilFound((res, img) => {
    let enterBtn = res.find(e =>
      e.text.includes('好友') && e.bounds != null &&
      e.bounds.left > img.width / 2
    );
    if (enterBtn != null) {
      clickRect(enterBtn, 0, 5, 0);
      return null;
    }
    let send = res.find(e => e.text.endsWith('赠送') && e.text.match(/[每日发上限]/) == null);
    let upper = res.find(e => e.text.includes('可以'));
    if (!send || !upper)
      return null;
    let f = res.find(e =>
      e.text.match(/(分钟|小时|天|登入$)/) != null &&
      e.bounds != null && e.bounds.top > upper.bounds.bottom &&
      e.bounds.bottom < send.bounds.top
    );
    if (!f)
      return null;
    return [send, f];
  }, 30, 1000);
  // 等待列表加载
  ocrUntilFound(res => {
    if (res.text.match(/(日期|代表|进度)/) != null) {
      sleep(500);
      return true;
    }
    clickRect(someFriend, 1, 0);
    return false;
  }, 30, 500);
  back();
  ocrUntilFound(res => res.text.match(/(可以|目录|搜寻|赠送)/) != null, 20, 1500);
  let btnColor = colors.toString(captureScreen().pixel(sendBtn.bounds.left, sendBtn.bounds.top));
  log(`赠送按钮颜色：${btnColor}`)
  if (colors.isSimilar('#1aaff7', btnColor, 75)) {
    clickRect(sendBtn);
    toastLog('点击赠送');
    clickRect(ocrUntilFound(res => res.find(e => e.text.includes('确认')), 30, 1000), 1, 300);
    sleep(1000);
  } else
    toastLog('赠送按钮不可点击');
  back();
}
function 爬塔() {
  ocrUntilFound((res, img) => {
    let arkBtn = res.find(e =>
      e.text.includes('方舟') && e.bounds != null &&
      e.bounds.bottom > img.height / 2
    );
    if (arkBtn != null && !res.text.includes('返回')) {
      clickRect(arkBtn, 1, 0);
      sleep(800);
      return null;
    }
    let towerBtn = res.find(e =>
      e.text.includes('无限之塔') && e.bounds != null &&
      e.bounds.top < img.height / 2 && e.bounds.right > img.width / 2
    );
    if (towerBtn != null && res.text.match(/(方舟|技场|迷失)/) != null) {
      clickRect(towerBtn, 1, 0);
      sleep(800);
      return null;
    }
    if (res.text.includes('开启') && res.text.match(/(目前|每日|T.WER)/))
      return true;
  }, 30, 800);
  let manufacturerTowers = ocrUntilFound(res => {
    let ret = res.toArray(3).toArray().filter(e => e.text.match(/(目前|每日)/));
    if (ret.length < 4)
      return null;
    return ret.filter(e => !e.text.includes('目前'));
  }, 30, 800, { maxScale: 3 });
  for (let i = 0; i < manufacturerTowers.length; ++i) {
    let tower = manufacturerTowers[i];
    clickRect(tower);
    let successFlag = false;
    let [curTower, cnt] = ocrUntilFound(res => {
      let tower = res.find(e =>
        e.text.endsWith('之塔') && e.bounds.top > height / 2
      );
      let times = res.text.match(/[余关]次[^\d]+(\d)\/3/);
      if (!tower || !times)
        return null;
      return [tower.text, parseInt(times[1])];
    }, 20, 1000);
    toastLog(`${curTower}（${cnt}/3）`);
    if (cnt == 0) {
      back();
      ocrUntilFound(res => res.text.includes('开启'), 30, 1000);
      continue;
    }
    sleep(1000);
    click(width / 2, height / 2 - 100);
    toast('点击屏幕中央');
    clickRect(ocrUntilFound(res => res.find(e => e.text.includes('入战')), 30, 1000), 1, 300);
    toast('进入战斗');
    for (let j = 0; j < cnt; ++j) {
      checkAuto();
      sleep(20 * 1000);
      ocrUntilFound(res => {
        if (res.text.includes('AUT')) {
          sleep(4000);
          return false;
        }
        if (res.text.includes('REWARD') || res.text.includes('FAIL'))
          return true;
      }, 30, 2000);
      sleep(1000);
      let endCombat = ocrUntilFound(res => res.find(
        e => e.text.match(/(下[^步方法]{2}|返回)/) != null
      ), 30, 500, { maxScale: 8 });
      if (endCombat.text.includes('返回')) {
        clickRect(endCombat, 1, 300);
        toastLog('作战失败');
        break;
      }
      if (colors.blue(captureScreen().pixel(endCombat.bounds.left, endCombat.bounds.top)) < 200) {
        clickRect(ocrUntilFound(res => res.find(e => e.text.includes('点击')), 10, 600), 1, 300);
        toastLog('每日次数已用完');
        break;
      }
      clickRect(endCombat);
      toastLog('下一关卡');
      successFlag = true;
    }
    sleep(5000);
    ocrUntilFound(res => res.text.includes('之塔'), 20, 3000);
    // 等待可能出现的限时礼包
    if (successFlag)
      关闭限时礼包();
    if (i != manufacturerTowers.length - 1) {
      back();
      ocrUntilFound(res => res.text.includes('开启'), 30, 1000);
    }
  }
  返回首页();
}

function 新人竞技场(rookieTarget) {
  if (rookieTarget == 0)
    return;
  clickRect(ocrUntilFound(res => res.find(e => e.text.match(/R[OD][OD]K.E/) != null), 30, 1000));
  toastLog('进入新人竞技场');
  const targetFight = ocrUntilFound((res, img) => {
    if (res.text.match(/(入战|群组|更新|目录)/) == null) {
      let rookie = res.find(e => e.text.match(/R[OD][OD]K.E/) != null);
      if (rookie)
        clickRect(rookie, 1, 0);
      return null;
    }
    let t = res.filter(e =>
      e.text.endsWith('战斗') && e.level == 1 &&
      e.bounds != null && e.bounds.left > img.width / 2
    ).toArray();
    if (t.length != 3)
      return null;
    t.sort((a, b) => a.bounds.top - b.bounds.top);
    return t[rookieTarget - 1];
  }, 10, 700);
  if (targetFight == null) {
    log('无法进入新人竞技场');
    return;
  }
  while (true) {
    let hasFree = ocrUntilFound((res, img) => {
      if (!res.text.match(/R[OD][OD]K.E/))
        return null;
      let t = res.find(e =>
        e.text.includes('免') && e.bounds != null &&
        e.bounds.left >= img.width / 2
      );
      return t == null ? 'notFree' : 'free';
    }, 30, 1000);
    if (hasFree != 'free')
      break;
    clickRect(targetFight);
    clickRect(ocrUntilFound((res, img) => {
      if (!res.text.includes('变更') || res.text.includes('目录'))
        return false;
      return res.find(e =>
        e.text.endsWith('战斗') && e.bounds != null &&
        e.bounds.centerX() > img.width / 2
      );
    }, 30, 1000));
    toastLog('进入战斗');
    ocrUntilFound(res => res.text.includes('RANK'), 20, 3000);
    toastLog('结算界面');
    ocrUntilFound((res, img) => {
      if (res.text.includes('返回'))
        return true;
      click(img.width * 0.5, img.height * 0.2);
      return false;
    }, 30, 1000)
  }
  back();
}

function 特殊竞技场() {
  if (NIKKEstorage.get('specialArenaClaim', true) != true) {
    log('已设置不领取特殊竞技场奖励');
    return;
  }
  clickRect(ocrUntilFound(res => res.find(e => e.text.includes('SPECIAL')), 30, 1000));
  toastLog('进入特殊竞技场');
  // 如果识别出了百分号，直接点百分号
  // 没有就点上方中央“特殊竞技场”下方位置，可能能点到
  let specialRewardBtn = ocrUntilFound(res => {
    let atk = res.find(e => e.text.match(/(ATK|DEF)/) != null);
    if (!atk) {
      let enterSpecial = res.find(e => e.text.includes('SPECIAL'));
      if (enterSpecial != null)
        clickRect(enterSpecial, 1, 0);
      let teamUpPage = res.find(e => e.text.match(/[攻击防御自动下一步]{2,}/) != null);
      if (teamUpPage != null) {
        log('误入编队界面，返回');
        back();
        sleep(600);
        return null;
      }
      return null;
    }
    let ret = res.find(e =>
      e.text.includes('%') && e.bounds != null &&
      e.bounds.bottom < atk.bounds.top &&
      e.bounds.left > atk.bounds.centerX()
    );
    if (ret == null) {
      let touch = res.find(e =>
        e.text.match(/^T.UCH/) != null && e.bounds != null &&
        e.bounds.bottom < atk.bounds.top &&
        e.bounds.left > atk.bounds.centerX()
      );
      ret = res.find(e =>
        e.text.startsWith('特殊') && e.bounds != null &&
        e.bounds.bottom < atk.bounds.top &&
        e.bounds.left > atk.bounds.centerX()
      );
      if (!ret || !touch)
        return null;
      // 下移识别框
      ret.bounds.top = touch.bounds.top;
      ret.bounds.bottom = touch.bounds.bottom;
    }
    return ret;
  }, 10, 1000);
  if (specialRewardBtn != null) {
    if (specialRewardBtn.text == '0%') {
      log('奖励进度0%，跳过');
      return;
    }
    clickRect(specialRewardBtn);
    log('领取竞技场奖励');
    ocrUntilFound((res, img) => {
      if (!res.text.includes('取'))
        return null;
      let confirm = res.find(e =>
        e.text.match(/[领領邻]取/) != null && e.bounds != null &&
        e.bounds.top > img.height * 0.6 &&
        e.bounds.right > img.width * 0.5
      );
      if (confirm != null) {
        clickRect(confirm, 1, 0);
        return null;
      }
      let clickReward = res.find(e =>
        e.text.includes('点击') && e.bounds != null &&
        e.bounds.bottom > img.height * 0.4
      );
      if (clickReward != null) {
        clickRect(clickReward, 1, 0);
        return true;
      }
      return null;
    }, 20, 600);
  }
}

function 竞技场() {
  clickRect(ocrUntilFound((res, img) => res.find(e =>
    e.text.includes('方舟') && e.bounds != null &&
    e.bounds.bottom > img.height / 2
  ), 30, 1000));
  clickRect(ocrUntilFound(res => res.find(e => e.text.includes('技场')), 30, 1000));
  新人竞技场(NIKKEstorage.get('rookieArenaTarget', 1));
  特殊竞技场();
  返回首页();
}

function 下载咨询文本() {
  if (advise != null)
    return;
  if (NIKKEstorage.get('fetchLatestNikkeJson', true))
    try {
      log('正在下载最新咨询文本');
      let respStr = http.get('https://github.blindfirefly.top/https://raw.githubusercontent.com/Zebartin/autoxjs-scripts/dev/NIKKE/nikke.json').body.string();
      files.write('./nikke.json', respStr);
      advise = JSON.parse(respStr);
      log('下载完成');
    } catch (error) {
      log(`获取最新咨询文本失败：${error.message}`);
    }
  if (advise == null)
    advise = JSON.parse(files.read('./nikke.json'));
}

function 咨询() {
  clickRect(ocrUntilFound(res => res.find(e => e.text == '妮姬'), 40, 1000));
  clickRect(ocrUntilFound(res => res.find(e => e.text == '咨询'), 40, 1000));
  toastLog('开始咨询');
  let adviseCnt = ocrUntilFound(res => {
    let allPos = res.find(e => e.text == 'ALL');
    if (!allPos)
      return null;
    let cntPos = res.find(e =>
      e.text.includes('/') && e.bounds != null &&
      e.bounds.bottom > allPos.bounds.bottom
    );
    if (!cntPos)
      return null;
    let t = cntPos.text.match(/([oO\d]{1,2})\/\d/);
    if (!t)
      return null;
    let ret = t[1].replace(/o/i, '0');
    return parseInt(ret);
  }, 50, 1000);
  let cnt = 0;
  log(`咨询次数：${adviseCnt}`);
  let adviseLimit = NIKKEstorage.get('adviseLimit', 0);
  if (adviseLimit > 0 && adviseCnt > adviseLimit) {
    adviseCnt = adviseLimit;
    log(`咨询次数限制：${adviseLimit}`);
  }
  while (cnt < adviseCnt) {
    let adviseTarget = null;
    let cases, attrs;
    while (adviseTarget == null) {
      [cases, attrs] = ocrUntilFound(res => {
        let x1 = res.filter(e => e.text.startsWith('CASE') && e.level == 1).toArray();
        let x2 = res.filter(e => e.text.includes('Attr') && e.level == 1).toArray();
        x1.sort((a, b) => a.bounds.top - b.bounds.top);
        x2.sort((a, b) => a.bounds.top - b.bounds.top);
        return [x1, x2];
      }, 20, 1000);
      // 不遍历最后一个RANK，以应对特殊情况：
      // 屏幕最后一个RANK对应的CASE CLOSED正好不在当前页
      for (let i = 0; i + 1 < attrs.length; ++i) {
        let curCase = cases.find(e =>
          e.bounds.bottom > attrs[i].bounds.top &&
          e.bounds.top < attrs[i + 1].bounds.bottom
        );
        if (curCase == null) {
          adviseTarget = i;
          break;
        }
      }
      if (adviseTarget == null) {
        toastLog('整页都咨询过了');
        let lastAttr = attrs[attrs.length - 1].bounds.top;
        swipe(
          width / 2, cases[cases.length - 1].bounds.top,
          width / 2, attrs[0].bounds.bottom, 1000
        );
        swipe(100, lastAttr, width / 2, lastAttr, 500);
        sleep(1000);
      }
    }
    // 减少可点击范围，避免点到悬浮窗
    attrs[adviseTarget].bounds.left += attrs[adviseTarget].bounds.width() * 0.7;
    clickRect(attrs[adviseTarget]);
    if (ocrUntilFound(res => {
      if (res.text.includes('看花'))
        return true;
      clickRect(attrs[adviseTarget], 0, 0);
      return null;
    }, 20, 1000) != true)
      throw new Error('无法进入单人咨询页面');
    let res = 单次咨询();
    if (res == 'ok')
      cnt++;
    else if (res == 'failed') {
      let lastAttr = attrs[attrs.length - 1].bounds.top;
      swipe(
        width / 2, attrs[adviseTarget + 1].bounds.top,
        width / 2, attrs[0].bounds.top, 1000
      );
      swipe(100, lastAttr, width / 2, lastAttr, 500);
    }
  }
  toastLog('完成咨询');
  返回首页();
}

function 咨询页面识别(btnText, maxRetry) {
  下载咨询文本();
  btnText = btnText || '咨询$';
  maxRetry = maxRetry || 5;
  let [btn, upper, lower, hasMax] = ocrUntilFound((res, img) => {
    let btn = res.find(e =>
      e.text.match(btnText) != null && e.level == 3 &&
      e.bounds != null && e.bounds.top > img.height / 2
    );
    let upper = res.find(e => e.text.includes('看花') && e.bounds != null);
    let lower = res.find(e => e.text.includes('下') && e.bounds != null);
    if (!btn || !upper || !lower)
      return null;
    let value = res.find(e =>
      e.bounds != null && e.bounds.top > upper.bounds.top &&
      e.bounds.bottom < lower.bounds.top && e.bounds.right > upper.bounds.left
    );
    if (!value)
      return null;
    return [btn, upper, lower, value.text.match(/[Mm].[Xx]/) != null];
  }, 20, 1000, { maxScale: 4, gray: true });
  let name = '';
  let img = images.clip(
    captureScreen(), 0, upper.bounds.top,
    upper.bounds.left, lower.bounds.top - upper.bounds.top
  );
  let gray = images.grayscale(img);
  img && img.recycle();
  img = gray;
  for (let scale = 1; scale <= maxRetry; ++scale) {
    let newImg = img;
    if (scale > 1)
      newImg = images.scale(img, scale, scale, 'CUBIC');
    let nameText = gmlkit.ocr(newImg, 'zh').text.replace(/[i,\s]+$/, '');
    if (scale > 1)
      newImg && newImg.recycle();
    if (nameText.length == 0)
      continue;
    if (nameText.match(/^雷[费骨賽費登]$/) != null)
      nameText = '基里';
    let result = mostSimilar(nameText, Object.keys(advise));
    if (result.similarity >= 0.5) {
      name = result.result;
      break;
    }
    log(`妮姬名OCR结果：${nameText}，匹配：${result.result}，相似度${result.similarity.toFixed(2)}`);
    if (scale < maxRetry)
      log(`妮姬名字识别相似度过低，重试(${scale}/${maxRetry})`);
    else {
      log(`已达最大尝试次数。可能原因：\n1.不支持反常\n2.不支持新版本妮姬`);
      toast('妮姬名字识别失败');
    }
  }
  img && img.recycle();
  return [btn, name, hasMax];
}

function 返回咨询首页() {
  back();
  if (ocrUntilFound(res => {
    if (res.text.includes('可以'))
      return true;
    back();
    return false;
  }, 10, 3000) == null) {
    ocrUntilFound(res => {
      if (res.text.includes('大厅'))
        return true;
      back();
      return false;
    }, 20, 1000);
    clickRect(ocrUntilFound(res => res.find(e => e.text == '大厅'), 30, 1000));
    clickRect(ocrUntilFound(res => res.find(e => e.text == '妮姬'), 30, 1000));
    clickRect(ocrUntilFound(res => res.find(e => e.text == '咨询'), 30, 1000));
  }
  toast('回到咨询首页');
}

function 单次咨询() {
  let failFunc = (ret) => {
    返回咨询首页();
    return ret || 'failed';
  };
  const maxRetry = 5;
  let [adviseBtn, name, hasMax] = 咨询页面识别('咨询$', maxRetry);
  if (adviseBtn == null) {
    toastLog('咨询页面解析失败');
    return failFunc('retry');
  }
  if (name == '') {
    return failFunc();
  }
  log(`咨询对象：${name}`);
  if (hasMax) {
    log('已达好感度上限');
    return failFunc();
  }
  if (colors.blue(captureScreen().pixel(adviseBtn.bounds.right, adviseBtn.bounds.top)) < 200) {
    log('咨询按钮不可点击');
    return failFunc();
  }
  for (let i = 1; i <= maxRetry; ++i) {
    clickRect(adviseBtn);
    clickRect(ocrUntilFound(res => res.find(
      e => e.text.includes('确认')
    ), 30, 1000));
    let pageStat = ocrUntilFound(res => {
      if (res.text.includes('取消') && res.text.includes('确认'))
        return 'outside';
      if (res.text.match(/(AUTO|LOG|CANCEL)/) != null)
        return 'inside';
      return null;
    }, 10, 2000);
    if (pageStat == 'outside') {
      log('已达好感度上限');
      back();
      sleep(1000);
      return failFunc();
    }
    // 连点直到出现选项
    let result = null;
    for (let j = 0; j < 30; ++j) {
      img = captureScreen();
      thresh = random(35, 55);
      rectFilter = (rect) => rect.width() > width * 0.7 && rect.left < width * 0.5 && rect.right > width * 0.5 && rect.height() < 200
      result = findContoursRect(img, {
        thresh: thresh,
        type: "BINARY",
        // debug: true,
        region: [0, height / 2],
        rectFilter: rectFilter
      })
      if (result.length == 2)
        break;
      resultSingle = findContoursRect(img, {
        thresh: thresh,
        type: "BINARY_INV",
        // debug: true,
        region: [0, height / 2],
        rectFilter: rectFilter
      })
      if (resultSingle.length == 1) {
        log('识别到单选选项，点击消除');
        clickRect({ bounds: resultSingle[0] }, 0.8, 0);
      } else
        click(width / 2, height / 2);
      sleep(1000);
    }
    let options = ocrUntilFound(res => {
      let ret = [];
      for (let optionRect of result) {
        let t = res.toArray(3).toArray().filter(e =>
          e.bounds.top >= optionRect.top &&
          e.bounds.bottom <= optionRect.bottom
        );
        if (t.length != 0)
          ret.push(t.map(x => x.text).join(''))
        else
          ret.push('')
      }
      if (ret.every(x => x == ""))
        return null;
      return ret;
    }, 10, 300) || ["", ""];
    let whichOne = null, similarOne = -1;
    for (let k = 0; k < 2; ++k) {
      options[k] = options[k].replace(/[,，:：\.。…\?\!？！、「」～~☆【】♪\s-\—]/g, '');
      let t = mostSimilar(options[k], advise[name]);
      log(`选项${k + 1}："${options[k]}"`);
      log(`匹配："${t.result}"，相似度${t.similarity.toFixed(2)}`);
      if (t.similarity > similarOne) {
        similarOne = t.similarity;
        whichOne = k;
      }
    }
    let thresh = options[whichOne].length < 3 ? 1 : 0.75;
    if (similarOne < thresh && i < maxRetry) {
      toastLog(`相似度过低，放弃本次咨询(尝试次数${i}/${maxRetry})`);
      clickRect(ocrUntilFound(res => res.find(e =>
        e.text.match(/[UTOG]/) == null && e.text.includes('NCE')
      ), 30, 1000));
      ocrUntilFound(res => res.text.includes('看花'), 20, 2000);
      continue;
    }
    if (similarOne < thresh && i == maxRetry) {
      log(`已达最大尝试次数${maxRetry}，无视低相似度`);
      if (options[1 - whichOne] == "") {
        log('优先选择空选项（可能是省略号之类）');
        whichOne = 1 - whichOne;
      }
    }
    log(`咨询选择："${options[whichOne]}"`);
    clickRect({ bounds: result[whichOne] }, 0.8, 0);
    ocrUntilFound(res => {
      if (res.find(e => e.text.endsWith('咨询')))
        return true;
      let skipBtn = res.find(e =>
        e.text.match(/[LAUTOG]/) == null && e.text.match(/SK.P/) != null
      );
      if (skipBtn == null)
        click(width / 2, height / 2);
      else
        clickRect(skipBtn, 0.1);
    }, 30, 1000);
    break;
  }
  ocrUntilFound(res => res.text.includes('咨询'), 20, 3000);
  sleep(1000);
  返回咨询首页();
  return 'ok';
}

function 解放() {
  let dailyMission = NIKKEstorage.get('dailyMission', {});
  if (dailyMission.liberate === false)
    return {};
  const TASK_LIST = [
    {
      name: '送礼',
      regStr: /[送迷迭][礼扎札][^\d]*([123])次$/,
    },
    {
      name: '装备强化',
      regStr: /升[級级]+([123])次$/,
    },
    {
      name: '招募',
      regStr: /招募([123])次$/,
    },
    {
      name: '每日任务',
      regStr: /日任\D*(\d+)/,
    }
  ];
  const PATTERN = new RegExp(TASK_LIST.map(({ regStr }) => regStr.source).join('|'));
  let inPage = ocrUntilFound((res, img) => {
    if (res.text.includes('返回'))
      return true;
    let liberateBtn = res.find(e => e.text == '解放');
    if (liberateBtn != null) {
      clickRect(liberateBtn, 1, 0);
      sleep(2000);
      return null;
    }
    let nikkeBtn = res.find(e =>
      e.text == '妮姬' && e.bounds != null &&
      e.bounds.top >= img.height * 0.7
    );
    if (nikkeBtn != null)
      clickRect(nikkeBtn, 1, 0);
    return null;
  }, 40, 700);
  if (inPage != true) {
    console.error('无法进入解放页面，放弃');
    return {};
  }
  log('已进入解放页面');
  sleep(2000);  // 等待动画
  let tasks = {};
  let taskChecked = false;
  let confirmCount = 0;
  let taskHook = (res, img) => {
    let skipBtn = res.find(e =>
      e.text.match(/SK.P/) != null && e.bounds != null &&
      e.bounds.left >= img.width * 0.5 &&
      e.bounds.bottom < img.height * 0.3
    );
    if (skipBtn != null) {
      clickRect(skipBtn, 1, 0);
      sleep(1000);
      return false;
    }
    let confirmBtn = res.find(e =>
      e.text.match(/[確确][認认]$/) != null && e.bounds != null &&
      e.bounds.bottom > img.height * 0.5
    );
    if (confirmBtn != null) {
      clickRect(confirmBtn, 1, 0);
      sleep(1000);
      return false;
    }
    let timeBound = res.find(e => e.text.match(/更新.*小时.{0,4}分钟/) != null);
    if (timeBound == null && res.text.includes('返回') && !res.text.includes('AUT')) {
      let chineseStrs = res.toArray(3).toArray().filter(e =>
        e.text.match(/[\u4e00-\u9fa5]+/) != null
      );
      if (chineseStrs.length < 5) {
        confirmCount++;
      }
      if (confirmCount >= 3) {
        log('当前似乎没有指定解放对象');
        tasks = {};
        taskChecked = true;
        return true;
      }
      sleep(1000);
    }
    if (taskChecked)
      return true;
    if (res.text.includes('AUT') || timeBound == null) {
      let a = 0.75, b = 0.9;
      let x = random() * (b - a) + a;
      click(width / 2, height * x);
      sleep(1000);
      return false;
    }
    let taskBtns = res.toArray(3).toArray().filter(e =>
      e.bounds != null &&
      e.bounds.left >= timeBound.bounds.left &&
      e.bounds.top > timeBound.bounds.bottom &&
      e.bounds.bottom < timeBound.bounds.bottom + 400
    );
    let completeBtns = taskBtns.filter(e => e.text.match(/[成戍戌]$/) != null);
    let otherBtns = taskBtns.filter(e => e.text.match(/(^直|[往住]$|CLE)/) != null);
    for (let btn of completeBtns)
      clickRect(btn, 1, 200);
    if (completeBtns.length != 0)
      return false;
    if (completeBtns.length + otherBtns.length != 3) {
      console.info(`总数不为3，识别有误：\n${taskBtns.map(x => x.text).join('\n')}`);
      sleep(random(500, 2000));
      return false;
    }
    taskBtns = taskBtns.filter(e => e.text.match(/(^直|[往住]$|^[\d\w/-]+$)/) == null);
    if (taskBtns.length != 0)
      console.info(`解放任务文本内容：\n${taskBtns.map(x => x.text).join('\n')}`);
    let ret = {};
    let tbs = taskBtns.filter(e => e.text.match(PATTERN) != null);
    for (let e of tbs) {
      for (let task of TASK_LIST) {
        let cnt = e.text.match(task.regStr);
        if (cnt == null)
          continue;
        ret[task.name] = parseInt(cnt[1]);
        break;
      }
    }
    tasks = ret;
    taskChecked = true;
    return true;
  }
  返回首页(false, taskHook);
  return tasks;
}

function 社交点数招募(repeatCnt) {
  if (NikkeToday() == NIKKEstorage.get('dailyMissionRecruit', null))
    return;
  repeatCnt = repeatCnt || 1;
  let dailyMission = NIKKEstorage.get('dailyMission', {});
  if (dailyMission.socialPointRecruit != true)
    return;
  log(`社交点数招募：${repeatCnt}次`);
  clickRect(ocrUntilFound(res => res.find(e =>
    e.text.includes('员招') && e.text.match(/[物品栏]/) == null
  ), 40, 1000));
  ocrUntilFound(res => res.text.match(/(招募\d+|机率)/) != null, 50, 500);
  let socialPage = ocrUntilFound(res => {
    if (res.text.match(/[杜社]交点数/))
      return true;
    swipe(width * 0.3, height / 2, width * 0.7, height / 2, 500);
    return false;
  }, 20, 1000);
  if (socialPage != true) {
    toastLog('没能找到社交点数招募页面，放弃招募');
    return;
  }
  for (let i = 0; i < repeatCnt; ++i) {
    let [skipBtn] = ocrUntilFound((res, img, scale) => {
      let doRecruit = res.find(e =>
        e.bounds != null && (
          (e.text.includes('1名') && e.bounds.right <= img.width / 2) ||
          (e.text.includes('再招') && e.bounds.right >= img.width / 2)
        )
      );
      if (doRecruit != null) {
        scaleBack(doRecruit, scale);
        clickRect(doRecruit, 1, 0);
        sleep(8000);
        return null;
      }
      let confirmInsufficient = res.find(e => e.text.match(/(确认|不足)/) != null);
      if (confirmInsufficient != null)
        return [null];
      let skipBtn = res.find(e => e.text.match(/SK.P/) != null);
      if (skipBtn != null)
        return [skipBtn];
    }, 30, 500, { maxScale: 4 });
    if (skipBtn === null) {
      log('友情点不足，无法招募');
      back();
      clickRect(ocrUntilFound(res => res.find(e => e.text == '大厅'), 30, 1000));
      return;
    }
    NIKKEstorage.put('dailyMissionRecruit', NikkeToday());
    ocrUntilFound(res => {
      if (res.text.includes('再') && res.text.includes('确认'))
        return true;
      clickRect(skipBtn, 1, 0);
    }, 50, 1000);
    click(width / 2, height / 2);
    let nikkeName = ocrUntilFound(res => {
      if (!res.text.includes('返回'))
        return false;
      let upper = res.find(e => e.text.endsWith('资讯'));
      let lower = res.find(e => e.text.endsWith('介绍'));
      if (!upper || !lower) {
        click(width / 2, height / 2);
        return null;
      }
      let ret = res.filter(e =>
        e.bounds != null && e.level == 3 &&
        e.bounds.right < upper.bounds.left &&
        e.bounds.bottom > upper.bounds.top &&
        e.bounds.bottom < lower.bounds.top
      ).toArray();
      if (ret.length == 0)
        return null;
      return ret.map(x => x.text).join('，');
    }, 20, 1000);
    log(`招募结果：${nikkeName}`);
    ocrUntilFound(res => {
      if (res.text.includes('再') && res.text.includes('确认'))
        return true;
      back();
    }, 20, 1000);
  }
  clickRect(ocrUntilFound(res => {
    let t = res.find(e => e.text == '确认');
    if (!t)
      back();
    return t;
  }, 30, 1000));
  ocrUntilFound(res => {
    if (res.text.match(/(方舟|商店|基地)/) != null)
      return true;
    let hall = res.find(e => e.text == '大厅');
    if (hall != null) {
      clickRect(hall, 0.5, 0);
      return null;
    }
  }, 30, 1000);
}

function listEquip() {
  let [equip, leftBound, lowerBound] = ocrUntilFound(res => {
    let e = res.find(e => e.text == 'EQUIP');
    let le = res.find(e => e.text.match(/(装备|技能|魔方)/) != null);
    let lo = res.find(e => e.text.match(/(快捷|全部)/) != null);
    if (!e || !le || !lo)
      return null;
    return [e.bounds.bottom, le.bounds.right, lo.bounds.top];
  }, 30, 300);
  let ret = [];
  let equipHeight = lowerBound - equip;
  for (let i = 0; i < 10; ++i) {
    let img = captureScreen();
    ret = findContoursRect(img, {
      thresh: 170 - i * 7,
      region: [leftBound, equip, img.width - leftBound, equipHeight],
      rectFilter: rect => {
        if (rect.height() < equipHeight / 4 || rect.height() > equipHeight / 2)
          return false;
        if (rect.width() < equipHeight / 4 || rect.width() > equipHeight / 2)
          return false;
        return true;
      }
    });
    if (ret.length == 4)
      break;
  }
  return ret;
}

function 强化装备(repeatCnt) {
  if (NikkeToday() == NIKKEstorage.get('dailyMissionEquip', null))
    return;
  let dailyMission = NIKKEstorage.get('dailyMission', {});
  let targetEquip = dailyMission.equipEnhanceSlot || 0;
  let targetNikke = dailyMission.equipEnhanceNikke || '';
  if (targetNikke == '') {
    toastLog('未指定强化装备妮姬');
    return;
  }
  repeatCnt = repeatCnt || 1;
  log(`强化装备：${repeatCnt}次`);
  let targetNikkeReg = new RegExp(targetNikke);
  let target = null;
  let ubBtn = ocrUntilFound((res, img) => {
    let ret = res.find(e => e.text.match(/看同伴/) != null);
    if (ret != null)
      return ret;
    let nikkeBtn = res.find(e =>
      e.text == '妮姬' && e.bounds != null &&
      e.bounds.bottom > img.height * 0.7
    );
    if (nikkeBtn != null)
      clickRect(nikkeBtn, 0.8);
    return null;
  }, 20, 1500);
  let upperBound = ubBtn.bounds.bottom;
  // 找到指定妮姬
  for (let retry = 0; target == null && retry < 3; ++retry) {
    if (retry > 0) {
      ocrUntilFound(res => {
        if (res.text.match(/(方舟|商店|基地)/) != null)
          return true;
        let hall = res.find(e => e.text == '大厅');
        if (hall != null) {
          clickRect(hall, 0.5, 0);
          return false;
        }
      }, 30, 1500);
      ocrUntilFound((res, img) => {
        let ret = res.find(e => e.text.match(/看同伴/) != null);
        if (ret != null)
          return true;
        let nikkeBtn = res.find(e =>
          e.text == '妮姬' && e.bounds != null &&
          e.bounds.bottom > img.height * 0.7
        );
        if (nikkeBtn != null)
          clickRect(nikkeBtn, 0.8, 0);
        return false;
      }, 30, 1500);
    }
    let lastNikke = null;
    for (let page = 0; page < 10; ++page) {
      let nikkes = detectNikkes(captureScreen(), {
        region: [0, upperBound]
      });
      if (nikkes.length < 6) {
        sleep(700);
        continue;
      }
      if (nikkes[nikkes.length - 1].name == lastNikke)
        break;
      lastNikke = nikkes[nikkes.length - 1].name;
      let bottomY = nikkes[nikkes.length - 1].bounds.bottom;
      let t = mostSimilar(targetNikke, nikkes.map(x => x.name));
      if (t.similarity > 0.5) {
        target = nikkes.find(e => e.name == t.result);
        break;
      }
      t = nikkes.find(x => targetNikkeReg.test(x.name));
      if (t != null) {
        target = t;
        break;
      }
      gestures(
        [0, 500, [width / 2, bottomY], [width / 2, upperBound]],
        [600, 200, [100, bottomY], [width / 2, bottomY]]
      );
      sleep(500);
    }
  }
  if (target == null) {
    console.error(`没有找到名为“${targetNikke}”的妮姬`);
    clickRect(ocrUntilFound(res => res.find(e => e.text == '大厅'), 30, 1000));
    return;
  }
  target.text = target.name;
  clickRect(target, 0.5);
  ocrUntilFound(res => res.text.match(/(STATUS|体力|攻击|返回)/), 30, 1000);
  // 点击指定装备
  clickRect({
    bounds: listEquip()[targetEquip],
    text: '指定装备'
  }, 0.5);
  ocrUntilFound(res => res.find(e => e.text.match(/^(升级|穿戴|交换|改造)/) != null), 20, 1000);
  // 检查是否可以升级
  let enhanceBtn = ocrUntilFound(res => res.find(e => e.text.endsWith('升级')), 3, 1000);
  if (enhanceBtn == null) {
    toastLog('指定装备不可升级');
    back();
    返回首页();
    return;
  }
  // 检查升级材料
  clickRect(enhanceBtn);
  let [enhanceConfirm, equipUpperBound] = ocrUntilFound(res => {
    if (!res.text.includes('自动'))
      return null;
    let confirm = res.find(e => e.text.match(/^[^装备请选择]{0,3}升级$/) != null);
    let upper = res.find(e => e.text.match(/(择升|级别|等级)/) != null);
    if (!confirm || !upper)
      return null;
    return [confirm, upper.bounds.bottom];
  }, 30, 1000);
  let enhanceStuff = [];
  for (let i = 0; i < 10; ++i) {
    let img = captureScreen();
    enhanceStuff = findContoursRect(img, {
      thresh: 180 - i * 8,
      region: [0, equipUpperBound, img.width, enhanceConfirm.bounds.top - equipUpperBound],
      rectFilter: rect => {
        if (rect.width() < 100)
          return false;
        if (Math.abs(rect.width() - rect.height()) > 20)
          return false;
        return true;
      }
    });
    if (enhanceStuff.length != 0)
      break;
  }
  if (enhanceStuff.length == 0) {
    toastLog('没有强化材料');
  } else {
    for (let i = 0; i < repeatCnt; ++i) {
      clickRect({
        text: '第一个强化材料',
        bounds: enhanceStuff[0]
      }, 0.8, 500);
      clickRect(enhanceConfirm);
      sleep(1000);
      while (colors.blue(captureScreen().pixel(
        enhanceConfirm.bounds.left,
        enhanceConfirm.bounds.top
      )) > 220)
        sleep(300);
    }
  }
  NIKKEstorage.put('dailyMissionEquip', NikkeToday());
  back();
  返回首页();
}

function 送礼(repeatCnt) {
  repeatCnt = repeatCnt || 0;
  if (repeatCnt == 0)
    return;
  log(`送礼：${repeatCnt}次`);
  let attrs = ocrUntilFound((res, img) => {
    if (res.text.includes('返回')) {
      let ret = res.toArray(3).toArray().filter(e => e.text.includes('Attr'));
      if (ret.length == 0)
        return null;
      return ret;
    }
    let adviseBtn = res.find(e => e.text == '咨询');
    if (adviseBtn != null) {
      clickRect(adviseBtn, 1, 0);
      sleep(1000);
      return null;
    }
    let nikkeBtn = res.find(e =>
      e.text == '妮姬' && e.bounds != null &&
      e.bounds.top >= img.height * 0.7
    );
    if (nikkeBtn != null)
      clickRect(nikkeBtn, 1, 0);
    return null;
  }, 40, 700) || [];
  if (attrs.length == 0) {
    console.error('无法进入咨询页面，放弃');
    return;
  }
  let curRepeat = 0;
  // 每次循环从首页选择一个，尝试送礼
  for (let retry = 0; retry < 5 && curRepeat < repeatCnt; ++retry) {
    let randomIndex = Math.floor(Math.random() * attrs.length);
    let someNikke = attrs[randomIndex];
    attrs.splice(randomIndex, 1);
    // 减少可点击范围，避免点到悬浮窗
    someNikke.bounds.left += someNikke.bounds.width() * 0.7;
    ocrUntilFound(res => {
      if (res.text.includes('看花'))
        return true;
      clickRect(someNikke, 1, 0);
      return false;
    }, 10, 500);
    let [giftBtnOutside, name, hasMax] = 咨询页面识别('[送迷迭][礼扎札]');
    log(`送礼对象：${name}`);
    if (hasMax) {
      log('已达好感度上限');
      返回咨询首页();
      continue;
    }
    clickRect(giftBtnOutside, 1, 200);
    let [generalBtn, giftBtnInside] = ocrUntilFound((res, img) => {
      let generalBtn = res.find(e =>
        e.text.match(/[通逼]用/) != null
      );
      let giftBtn = res.find(e =>
        e.text.match(/[送迷迭][礼扎札]/) != null &&
        e.bounds != null && e.bounds.bottom >= img.height * 0.5 &&
        e.bounds.right > img.width * 0.5
      );
      if (!generalBtn || !giftBtn) {
        clickRect(giftBtnOutside, 1, 0);
        return null;
      }
      let btnColor = img.pixel(generalBtn.bounds.right + 3, generalBtn.bounds.top);
      if (!colors.isSimilar('#1aaff7', btnColor, 75)) {
        clickRect(generalBtn, 1, 0);
        return null;
      }
      return [generalBtn, giftBtn];
    }, 30, 800);
    let gifts = [];
    while (curRepeat < repeatCnt) {
      gifts = [];
      for (let i = 0; i < 10; ++i) {
        let img = captureScreen();
        let thresh = random(150, 200);
        gifts = findContoursRect(img, {
          thresh: thresh,
          region: [
            0, generalBtn.bounds.bottom, img.width,
            giftBtnInside.bounds.top - generalBtn.bounds.bottom
          ],
          // debug: true,
          rectFilter: rect => {
            if (rect.width() < 100)
              return false;
            if (Math.abs(rect.width() - rect.height()) > 20)
              return false;
            return true;
          }
        });
        if (gifts.length > 0 && gifts.length < 4)
          break;
        clickRect(generalBtn, 1, 200);  // 再点一次，以消去可能弹出的rank increase
        sleep(800);   // 等待动画
      }
      if (gifts.length == 0) {
        console.warn('没有好感券，放弃送礼');
        break;
      }
      let lastGift = {
        bounds: gifts[gifts.length - 1],
        text: '最后一个礼物'
      };
      let [upToMax] = ocrUntilFound((res, img) => {
        if (res.text.match(/(无法|上限|确认|取消)/) != null)
          return [true];
        if (colors.blue(img.pixel(
          giftBtnInside.bounds.right,
          giftBtnInside.bounds.top
        )) <= 220) {
          clickRect(lastGift, 0.8, 500);
          return null;
        }
        return [false];
      }, 10, 800) || [true];
      if (upToMax) {
        log('已达好感度上限');
        back();
        break;
      }
      clickRect(giftBtnInside);
      sleep(700);
      while (colors.blue(captureScreen().pixel(
        giftBtnInside.bounds.right,
        giftBtnInside.bounds.top
      )) > 220)
        sleep(500);
      curRepeat += 1;
      // 等待“好感度提升”消失
      if (curRepeat < repeatCnt)
        ocrUntilFound(res => !res.text.includes('升'), 10, 500);
    }
    if (gifts.length == 0)
      return;
    if (curRepeat < repeatCnt)
      返回咨询首页();
    else
      back();
  }
  返回首页();
}

function missionPass() {
  let dailyMission = NIKKEstorage.get('dailyMission', {});
  if (dailyMission.missionPass === false)
    return;
  let [rewardBtn, taskBtn, claimBtn] = ocrUntilFound((res, img) => {
    let seasonBtn = res.find(e =>
      e.text.includes('SEASON') && e.bounds != null &&
      e.bounds.left >= img.width / 2 && e.bounds.bottom < img.height / 2
    );
    if (seasonBtn != null) {
      clickRect(seasonBtn, 1, 0);
      sleep(1000);
      return null;
    }
    let rb = res.find(e =>
      e.text.match(/^奖励$/) != null && e.bounds != null &&
      e.bounds.right <= img.width / 2 && e.bounds.bottom < img.height / 2
    );
    let tb = res.find(e =>
      e.text.match(/^任务$/) != null && e.bounds != null &&
      e.bounds.left >= img.width / 2 && e.bounds.bottom < img.height / 2
    );
    let cb = res.find(e =>
      e.text.match(/.{0,2}全[^\d]+取/) != null &&
      e.bounds != null && e.bounds.bottom > img.height / 2
    );
    if (rb && tb && cb)
      return [rb, tb, cb];
    return null;
  }, 20, 700) || [null, null, null];
  if (rewardBtn == null) {
    console.error('无法进入mission pass页面');
    return;
  }
  let taskDone = false;
  ocrUntilFound((res, img) => {
    let tasks = res.toArray(3).toArray().filter(e =>
      e.text.match(/\d+次/) != null && e.bounds != null &&
      e.bounds.left <= img.width / 2 && e.bounds.top > taskBtn.bounds.bottom
    );
    if (tasks.length < 3) {
      clickRect(taskBtn, 1, 0);
      return false;
    }
    let c = img.pixel(claimBtn.bounds.left - 5, claimBtn.bounds.top);
    if (colors.blue(c) < 180) {
      let ensureClaim = res.find(e =>
        e.text.match(/.{0,2}全[^\d]+取/) != null &&
        e.bounds != null && e.bounds.bottom > img.height / 2
      );
      if (ensureClaim != null)
        return true;
    }
    clickRect(claimBtn, 1, 0);
    taskDone = true;
    return false;
  }, 20, 700);
  if (!taskDone) {
    log('没有pass任务完成');
    back();
    return;
  }
  let rewardChecked = false;
  let claimClicked = 0;
  ocrUntilFound((res, img) => {
    let checked = res.find(e =>
      e.text.match(/[高级級]+/) != null && e.bounds != null &&
      e.bounds.left >= img.width / 2 && e.bounds.top > rewardBtn.bounds.bottom
    );
    if (!checked) {
      clickRect(rewardBtn, 1, 0);
      return false;
    }
    let c = img.pixel(claimBtn.bounds.left - 5, claimBtn.bounds.top);
    if (colors.blue(c) < 180 && (rewardChecked || claimClicked >= 3 || claimClicked == 0)) {
      let ensureClaim = res.find(e =>
        e.text.match(/.{0,2}全[^\d]+取/) != null &&
        e.bounds != null && e.bounds.bottom > img.height / 2
      );
      if (ensureClaim != null)
        return true;
    }
    if (!rewardChecked && res.find(e => e.text.match(/(REWARD|点击)/) != null))
      rewardChecked = true;
    clickRect(claimBtn, 1, 0);
    claimClicked++;
    return false;
  }, 20, 700);
  back();
  ocrUntilFound(res => {
    if (res.find(e => e.text == '商店') != null)
      return true;
    back();
    return false;
  }, 10, 1000);
}

function dailyMissionCompleted() {
  return NikkeToday() == NIKKEstorage.get('dailyMissionCompleted', null);
}

function 每日任务() {
  if (dailyMissionCompleted())
    return;
  let tasks = 解放();
  社交点数招募(tasks['招募']);
  强化装备(tasks['装备强化']);
  送礼(tasks['送礼']);
  let season = ocrUntilFound((res, img) => {
    let ret = res.find(e => e.text.includes('SEASON'));
    if (ret)
      return ret;
    let hallBtn = res.find(e => e.text == '大厅');
    if (hallBtn)
      clickRect(hallBtn, 1, 0);
    return null;
  }, 20, 800);
  let i;
  for (i = 0; i < 10; ++i) {
    let img = captureScreen();
    let point = images.findColor(img, '#119dea', {
      region: [img.width / 2, 0, season.bounds.left - img.width / 2, season.bounds.top],
      threshold: 75 - i * 4
    });
    if (point != null) {
      click(point.x, point.y);
      if (ocrUntilFound(res => res.text.includes('成就'), 5, 1000))
        break;
    }
  }
  if (i == 10) {
    log('没能找到每日任务图标');
    return;
  }
  clickRect(ocrUntilFound(res => {
    let ret = res.find(e => e.text.endsWith('每日任务'));
    if (ret != null)
      ret.bounds.left += ret.bounds.width() / 2;
    return ret;
  }, 30, 600));
  let getAllBtn = ocrUntilFound(res => {
    if (!res.text.includes('DA'))
      return null;
    return res.find(e => e.text.match(/.{0,2}全[^\d]+取/) != null);
  }, 15, 500);
  let confirmReceived = 3;
  ocrUntilFound((res, img) => {
    if (res.text.includes('全')) {
      let c = colors.toString(img.pixel(getAllBtn.bounds.left, getAllBtn.bounds.top));
      if (!colors.isSimilar('#1aaff7', c, 75)) {
        confirmReceived--;
        if (confirmReceived > 0)
          return false;
        let t = res.find(e =>
          e.text.endsWith('周任务') &&
          !e.text.includes('每日')
        );
        if (t != null) {
          clickRect(t, 1, 0);
          return true;
        }
      }
    }
    clickRect(getAllBtn, 1, 0);
    return false;
  }, 30, 600);
  confirmReceived = 3;
  ocrUntilFound((res, img) => {
    if (res.text.includes('全') && res.text.includes('WEEK')) {
      let c = colors.toString(img.pixel(getAllBtn.bounds.left, getAllBtn.bounds.top));
      if (!colors.isSimilar('#1aaff7', c, 75)) {
        confirmReceived--;
        if (confirmReceived > 0)
          return false;
        let t = res.find(e =>
          e.text.includes('成就') &&
          !e.text.includes('任务')
        );
        if (t != null) {
          clickRect(t, 1, 0);
          return true;
        }
      }
    }
    clickRect(getAllBtn, 1, 0);
    return false;
  }, 30, 600);
  confirmReceived = 3;
  ocrUntilFound((res, img) => {
    if (res.text.includes('全') && res.text.includes('CHA')) {
      let c = colors.toString(img.pixel(getAllBtn.bounds.left, getAllBtn.bounds.top));
      if (!colors.isSimilar('#1aaff7', c, 75)) {
        confirmReceived--;
        if (confirmReceived > 0)
          return false;
        return true;
      }
    }
    clickRect(getAllBtn, 1, 0);
    return false;
  }, 30, 600);
  back();
  missionPass();
  if (Object.keys(tasks).length != 0)
    解放();
  NIKKEstorage.put('dailyMissionCompleted', NikkeToday());
}
