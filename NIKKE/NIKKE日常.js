var {
  启动NIKKE, 等待NIKKE加载, 退出NIKKE,
  mostSimilar, 返回首页, 关闭限时礼包,
  detectNikkes, NikkeToday, checkAuto
} = require('./NIKKEutils.js');
var { 模拟室 } = require('./模拟室.js');
var {
  ocrUntilFound, clickRect, findImageByFeature,
  requestScreenCaptureAuto, getDisplaySize,
  findContoursRect, rgbToGray
} = require('./utils.js');
let width, height;
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
        return func();
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
          return;
      }
    }
  };
  for (let task of todoTask)
    retryFunc(taskFunc[task]);
  if (NIKKEstorage.get('exitGame', false))
    退出NIKKE();
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

function cashShop() {
  if (!NIKKEstorage.get('checkCashShopFree', false))
    return;
  clickRect(ocrUntilFound(res => res.find(e => e.text.includes('付')), 30, 1000));
  let upperBound = ocrUntilFound(res => {
    let ubs = res.filter(e => e.text.match(/([仅在指定的销售期间]{3,}|[从同时出现的礼包中]{3,})/) != null).toArray();
    if (ubs.length == 0)
      return null;
    return ubs.reduce((prev, curr) =>
      prev.bounds.top < curr.bounds.top ? prev : curr
    ).bounds.bottom;
  }, 20, 1000);
  let cashShopImg = images.read('./images/cashShop.jpg');
  for (let i = 0; i < 10; ++i) {
    let img = captureScreen();
    let target = findImageByFeature(img, cashShopImg, {
      region: [0, upperBound, img.width, cashShopImg.height * 5]
    });
    if (target == null) {
      sleep(1000);
      continue;
    }
    target.text = '礼包图标';
    let targetColor = img.pixel(target.bounds.left, target.bounds.centerY());
    if (rgbToGray(targetColor) >= 70) {
      sleep(1000);
      continue;
    }
    clickRect(target);
    let d = ocrUntilFound(res => {
      let t = res.find(e => e.text.endsWith('日'));
      if (t == null)
        clickRect(target, 1, 0);
      return t;
    }, 10, 600);
    if (d != null) {
      swipe(d.bounds.right, d.bounds.centerY(), 0, d.bounds.centerY(), 500);
      break;
    }
  }
  cashShopImg.recycle();
  let [daily, weekly, monthly] = ocrUntilFound(res => {
    let d = res.find(e => e.text.endsWith('日'));
    let w = res.find(e => e.text.endsWith('周'));
    let m = res.find(e => e.text.endsWith('月'));
    if (!d || !w || !m)
      return null;
    return [d, w, m];
  }, 30, 700);
  for (let btn of [daily, weekly, monthly]) {
    let name = btn.text.substr(-1);
    clickRect(btn);
    let [free, color] = ocrUntilFound((res, img) => {
      let t = res.find(e => e.text.includes(name + '免'));
      if (!t)
        return null;
      return [t, img.pixel(t.bounds.left, t.bounds.bottom + 5)];
    }, 20, 700);
    if (rgbToGray(color) < 50)
      log(`每${name}免费礼包已领取`);
    else {
      log(`领取每${name}免费礼包`);
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

function 商店() {
  let buyGood = (good) => {
    let c = captureScreen().pixel(good.bounds.right + 5, good.bounds.bottom);
    if (good.text != '免费商品' && colors.isSimilar(c, colors.DKGRAY, 30)) {
      log(`${good.text}已售`);
      return;
    }
    toastLog(`购买${good.text}`);
    clickRect(good, 0.5);
    let [buyBtn, costGem] = ocrUntilFound(res => {
      let t = res.find(e => e.text == '购买');
      if (!t)
        return null;
      return [t, res.text.match(/(珠宝|招募|优先|扣除)/) != null];
    }, 30, 1000);
    if (costGem && good.text != '免费商品') {
      log('消耗珠宝，放弃购买');
      back();
      return;
    }
    clickRect(buyBtn);
    let affordable = true;
    ocrUntilFound(res => {
      if (res.find(e => e.text.match(/不足.?$/) != null)) {
        affordable = false;
        return true;
      }
      if (res.text.match(/(距离|更新|还有)/) != null)
        return true;
      let reward = res.find(e => e.text.match(/(REW|点击|奖励)/) != null);
      if (reward != null)
        click(width / 2, height * 0.8);
      let buyBtn = res.find(e => e.text == '购买');
      if (buyBtn != null)
        clickRect(buyBtn, 1, 0);
      return null;
    }, 20, 1000, { gray: true, maxScale: 4 });
    if (!affordable) {
      log('资金不足');
      back();
    }
  };
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
        ocrUntilFound(res => res.text.match(/(距离|更新|还有)/) != null, 20, 600);
      }
    }
    return hasFree;
  };
  clickRect(ocrUntilFound(res => res.find(e => e.text == '商店'), 30, 1000));
  toastLog('进入商店');
  ocrUntilFound(res => res.text.match(/(普[通逼]|100%|s[oq0]l[od0] [oq0]ut)/i) != null, 50, 1000);
  if (buyFree()) {
    clickRect(ocrUntilFound(res => res.find(e => e.text.match(/(距离|更新|还有)/) != null), 10, 300));
    toastLog('刷新商店');
    clickRect(ocrUntilFound(res => res.find(e => e.text == '确认'), 10, 300));
    // 等待刷新完成
    ocrUntilFound(res => res.text.match(/s[oq0]l[od0] [oq0]ut/i) == null, 20, 500);
    buyFree();
  }
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
    ocrUntilFound(res => {
      if (res.text.match(/[竟竞]技场/) != null)
        return true;
      clickRect(arenaShop, 0.8, 1);
      return false;
    }, 10, 1000);
    let manuals = ocrUntilFound(res => {
      let goods = res.filter(e =>
        e.level == 3 &&
        e.text.includes('代码手册')
      ).toArray();
      let ret = [], ms = null;
      for (let g of goods) {
        if (g.text.startsWith('代')) {
          // 选择宝箱可能会连着右侧的商品一起识别
          // 因此直接截断一半宽度
          g.bounds.right -= g.bounds.width() / 2;
          ms = g;
        }
        else {
          let t = g.text.split(/代码手册/);
          let cnt = t.length - 1;
          let w = g.bounds.width() / cnt;
          for (let i = 0; i < cnt; ++i) {
            let newBounds = new android.graphics.Rect();
            newBounds.left = Math.round(g.bounds.left + w * i);
            newBounds.right = Math.round(newBounds.left + w);
            newBounds.top = g.bounds.top;
            newBounds.bottom = g.bounds.bottom;
            ret.push({
              text: t[i] + '代码手册',
              bounds: newBounds
            });
          }
        }
      }
      if (ms != null)
        ret.push(ms);
      if (ret.length < 4)
        return null;
      return ret;
    }, 30, 1000);
    for (let i = 0; i < buyCodeManual; ++i) {
      buyGood(manuals[i]);
      ocrUntilFound(res => res.text.includes('技场'), 30, 500);
    }
  }
  返回首页();
  cashShop();
}

function collectDefense(outpostBtn, wipeOut) {
  let levelUp = false;
  clickRect(outpostBtn);
  let wipeOutBtn = ocrUntilFound(res => {
    let t = res.find(e => e.text.endsWith('灭'));
    if (t == null) {
      clickRect(outpostBtn, 1, 0);
      return null;
    }
    return t;
  }, 30, 1000);
  if (wipeOut && wipeOutBtn != null) {
    clickRect(wipeOutBtn);
    toastLog('尝试一举歼灭');
    clickRect(ocrUntilFound(res => {
      if (!res.text.includes('今日'))
        return null;
      return res.find(e => e.text.startsWith('进行'));
    }, 30, 1000));
    ocrUntilFound(res => {
      if (res.text.match(/(优先|珠宝|确认)/) != null)
        back();
      else if (res.text.includes('点击'))
        clickRect(res.find(e => e.text.includes('点击')));
      else
        return false;
      return true;
    }, 10, 1000);
    ocrUntilFound(res => res.text.includes('今日'), 30, 1000);
    back();
  }
  clickRect(ocrUntilFound(res => res.find(e => e.text.includes('奖励')), 30, 1000));
  toastLog('点击获得奖励');
  clickRect(ocrUntilFound(res => res.find(e => e.text.match(/(点击|获得|奖励)/) != null), 10, 3000, { maxScale: 4 }));
  ocrUntilFound(res => {
    if (res.text.match(/(返回|中心|公告)/) != null)
      return true;
    let t = res.find(e => e.text.match(/(点击|获得|奖励)/) != null);
    if (t != null) {
      clickRect(t);
      toastLog('升级了');
      levelUp = true;
    }
    return false;
  }, 20, 600);
  return levelUp;
}

function dispatch(bulletin) {
  clickRect(bulletin, 0.3);
  toastLog('进入公告栏');
  // 等待派遣内容加载
  let target = ocrUntilFound(res => res.text.match(/(时间|完成|目前)/), 20, 500);
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
    if (colors.red(images.pixel(captureScreen(), receive.bounds.right, receive.bounds.top)) < 100) {
      toastLog('全部领取');
      clickRect(receive);
      clickRect(ocrUntilFound(res => res.find(e => e.text.includes('点击')), 10, 3000));
      ocrUntilFound(res => res.text.match(/(时间|目前)/), 20, 500);
    }
    if (colors.red(images.pixel(captureScreen(), send.bounds.right, send.bounds.top)) > 240) {
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
    if (res.text.includes('中心'))
      return true;
    clickRect(bulletin, 1, 0);
    return false;
  }, 30, 1000);
}

function 基地收菜(doDailyMission) {
  clickRect(ocrUntilFound(res => res.find(e => e.text.includes('基地')), 30, 1000));
  toastLog('进入基地');
  let [bulletin, outpostBtn] = ocrUntilFound((res, img) => {
    let headquarter = res.find(e => e.text.endsWith('中心'));
    let ret = res.find(e => e.text.match(/^派.*[公告栏]+$/) != null);
    let outpost = res.find(e => e.text.match(/(DEFENSE|LV[\.\d]+|\d{1,3}%)/) != null)
    if (!headquarter || !ret || !outpost) {
      // 可能没进基地，重进一下
      let enter = res.find(e =>
        e.text.endsWith('基地') && e.bounds != null &&
        e.bounds.bottom > img.height / 2
      );
      if (enter != null) {
        clickRect(enter, 1, 100);
        sleep(1000);
      }
      return null;
    }
    // 将识别区域扩宽到整个公告栏图标
    ret.bounds.top = headquarter.bounds.bottom;
    return [ret, outpost];
  }, 50, 1000);
  let levelUp = collectDefense(outpostBtn, true);
  dispatch(bulletin);
  if (doDailyMission)
    levelUp = collectDefense(outpostBtn, false) || levelUp;
  返回首页(levelUp);
}
function 好友() {
  clickRect(ocrUntilFound(res => res.find(e => e.text.includes('好友')), 30, 1000), 0.1);
  toastLog('点击好友');
  // 等待列表加载
  // 一个好友都没有的话会出问题
  let [sendBtn, someFriend] = ocrUntilFound(res => {
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
  clickRect(someFriend);
  ocrUntilFound(res => {
    if (res.text.match(/(日期|代表|进度)/) != null)
      return true;
    clickRect(someFriend, 1, 0);
    return false;
  }, 30, 500);
  sleep(500);
  back();
  ocrUntilFound(res => res.text.match(/(可以|目录|搜寻|赠送)/) != null, 20, 1500);
  let btnColor = colors.toString(images.pixel(captureScreen(), sendBtn.bounds.left, sendBtn.bounds.top));
  log(`赠送按钮颜色：${btnColor}`)
  if (colors.isSimilar('#1aaff7', btnColor, 75)) {
    clickRect(sendBtn);
    toastLog('点击赠送');
    clickRect(ocrUntilFound(res => res.find(e => e.text.includes('确认')), 30, 1000));
    sleep(1000);
  } else
    toastLog('赠送按钮不可点击');
  back();
}
function 爬塔() {
  clickRect(ocrUntilFound((res, img) => res.find(e =>
    e.text.includes('方舟') && e.bounds != null &&
    e.bounds.bottom > img.height / 2
  ), 30, 1000));
  clickRect(ocrUntilFound(res => res.find(e => e.text.includes('无限之塔')), 30, 1000));
  ocrUntilFound(res => res.text.includes('开启'), 30, 500);
  toastLog('进入无限之塔');
  let manufacturerTowers = ocrUntilFound(res => {
    let ret = res.toArray(3).toArray().filter(e => e.text.match(/(目前|每日)/));
    if (ret.length < 4)
      return null;
    return ret;
  }, 30, 1000, { maxScale: 3 });
  for (let tower of manufacturerTowers) {
    if (tower.text.includes('目前'))
      continue;
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
    sleep(1000);
    clickRect(ocrUntilFound(res => res.find(e => e.text.includes('入战')), 30, 1000));
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
        clickRect(endCombat);
        toastLog('作战失败');
        break;
      }
      if (colors.blue(captureScreen().pixel(endCombat.bounds.left, endCombat.bounds.top)) < 200) {
        sleep(1000);
        click(width / 2, height / 2);
        toastLog('每日次数已用完');
        break;
      }
      sleep(1000);
      clickRect(endCombat);
      toastLog('下一关卡');
      successFlag = true;
    }
    sleep(5000);
    ocrUntilFound(res => res.text.includes('之塔'), 20, 3000);
    // 等待可能出现的限时礼包
    if (successFlag)
      关闭限时礼包();
    back();
    ocrUntilFound(res => res.text.includes('开启'), 30, 1000);
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
    clickRect(ocrUntilFound(res => {
      if (!res.text.includes('变更') || res.text.includes('目录'))
        return false;
      return res.find(e => e.text.endsWith('战斗'));
    }, 30, 1000));
    toastLog('进入战斗');
    sleep(5000);
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
    let atk = res.find(e => e.text.includes('ATK'));
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
      e.bounds.left > atk.bounds.right
    );
    if (ret == null) {
      let touch = res.find(e =>
        e.text.match(/^T.UCH/) != null && e.bounds != null &&
        e.bounds.bottom < atk.bounds.top &&
        e.bounds.left > atk.bounds.right
      );
      ret = res.find(e =>
        e.text.startsWith('特殊') && e.bounds != null &&
        e.bounds.bottom < atk.bounds.top &&
        e.bounds.left > atk.bounds.right
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
function 咨询() {
  let advise = null;
  if (NIKKEstorage.get('fetchLatestNikkeJson', true))
    try {
      advise = http.get('https://github.blindfirefly.top/https://raw.githubusercontent.com/Zebartin/autoxjs-scripts/dev/NIKKE/nikke.json').body.json();
    } catch (error) {
      log(`获取最新咨询文本失败：${error.message}`);
    }
  if (advise == null)
    advise = JSON.parse(files.read('./nikke.json'));
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
    let res = 单次咨询(advise);
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
function 单次咨询(advise) {
  let failFunc = (ret) => {
    back();
    ocrUntilFound(res => res.text.includes('可以'), 30, 3000);
    return ret || 'failed';
  };
  const maxRetry = 5;
  let nameRetry = 0;
  let [adviseBtn, name, hasMax] = ocrUntilFound((res, img) => {
    let btn = res.find(e =>
      e.text.includes('咨询') && e.bounds != null &&
      e.bounds.top > img.height / 2 && e.bounds.left > img.width / 2
    );
    let upper = res.find(e => e.text.includes('看花') && e.bounds != null);
    let lower = res.find(e => e.text.includes('下') && e.bounds != null);
    if (!btn || !upper || !lower)
      return null;
    let nameArea = res.find(e =>
      e.bounds != null && e.bounds.top > upper.bounds.top &&
      e.bounds.bottom < lower.bounds.top && e.bounds.right < upper.bounds.left
    );
    let value = res.find(e =>
      e.bounds != null && e.bounds.top > upper.bounds.top &&
      e.bounds.bottom < lower.bounds.top && e.bounds.right > upper.bounds.left
    );
    if (!nameArea || !value)
      return null;
    let nameResult = mostSimilar(nameArea.text, Object.keys(advise));
    if (nameResult.similarity < 0.5) {
      log(`妮姬名OCR结果：${nameArea.text}，匹配：${nameResult.result}，相似度${nameResult.similarity.toFixed(2)}`);
      nameRetry++;
      if (nameRetry >= maxRetry) {
        return [btn, '', false];
      } else
        log(`妮姬名字识别相似度过低，重试(${nameRetry}/${maxRetry})`);
      return null;
    }
    return [btn, nameResult.result, value.text.includes('MAX')];
  }, 30, 1000, { maxScale: 8 }) || [null, null, null];
  if (adviseBtn == null) {
    toastLog('咨询页面解析失败');
    return failFunc('retry');
  }
  if (nameRetry == maxRetry) {
    log(`已达最大尝试次数${maxRetry}。可能原因：暂不支持新版本妮姬的咨询`);
    toast('妮姬名字识别失败');
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
        let t = res.find(e =>
          e.level == 1 && e.bounds.top >= optionRect.top &&
          e.bounds.bottom <= optionRect.bottom
        );
        ret.push(t ? t.text : "");
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
  return 'ok';
}

function 社交点数招募() {
  if (NikkeToday() == NIKKEstorage.get('dailyMissionRecruit', null))
    return;
  let dailyMission = NIKKEstorage.get('dailyMission', {});
  if (dailyMission.socialPointRecruit != true)
    return;
  clickRect(ocrUntilFound(res => res.find(e =>
    e.text.includes('员招') && e.text.match(/[物品栏]/) == null
  ), 40, 1000));
  ocrUntilFound(res => res.text.match(/(招募\d+|机率)/) != null, 50, 500);
  let socialPage = ocrUntilFound(res => {
    if (res.text.match(/[杜社]交点数/))
      return true;
    swipe(width * 0.3, height / 2, width * 0.7, height / 2, 500);
    return false;
  }, 30, 1000);
  if (socialPage != true) {
    toastLog('没能找到社交点数招募页面，放弃招募');
    return;
  }
  clickRect(ocrUntilFound((res, img) => res.find(e =>
    e.text.includes('1名') && e.bounds != null && e.bounds.right <= img.width / 2
  ), 20, 300, { maxScale: 4 }));
  NIKKEstorage.put('dailyMissionRecruit', NikkeToday());
  sleep(2000);
  ocrUntilFound(res => {
    let skipBtn = res.find(e => e.text.match(/SK.P/) != null);
    if (skipBtn) {
      clickRect(skipBtn, 1, 0);
      return null;
    }
    return res.find(e => e.text == '确认');
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
  back();
  clickRect(ocrUntilFound(res => {
    let t = res.find(e => e.text == '确认');
    if (!t)
      back();
    return t;
  }, 30, 1000));
  ocrUntilFound(res => res.text.includes('大厅'), 30, 1000);
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

function 强化装备() {
  if (NikkeToday() == NIKKEstorage.get('dailyMissionEquip', null))
    return;
  let dailyMission = NIKKEstorage.get('dailyMission', {});
  let targetEquip = dailyMission.equipEnhanceSlot || 0;
  let targetNikke = dailyMission.equipEnhanceNikke || '';
  if (targetNikke == '') {
    toastLog('未指定强化装备妮姬');
    return;
  }
  let targetNikkeReg = new RegExp(targetNikke);
  let target = null;
  clickRect(ocrUntilFound(res => res.find(e => e.text == '妮姬'), 40, 1000));
  let upperBound = ocrUntilFound(res => {
    let upper = res.find(e => e.text == 'ALL');
    if (!upper)
      return null;
    return upper.bounds.bottom;
  }, 30, 600);
  // 找到指定妮姬
  for (let retry = 0; target == null && retry < 3; ++retry) {
    if (retry > 0)
      for (let i = 0; i < 7; ++i)
        swipe(width / 2, (upperBound + height) / 2, width / 2, height, 300);
    sleep(1000);
    let lastNikke = null;
    for (let page = 0; page < 10; ++page) {
      let nikkes = detectNikkes(captureScreen(), {
        region: [0, upperBound]
      });
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
      swipe(width / 2, bottomY, width / 2, upperBound, 1000);
      swipe(100, bottomY, width / 2, bottomY, 500);
      sleep(500);
    }
  }
  if (target == null) {
    console.error(`没有找到名为“${targetNikke}”的妮姬`);
    clickRect(ocrUntilFound(res => res.find(e => e.text == '大厅'), 30, 1000));
    return;
  }
  clickRect(target, 0.5);
  ocrUntilFound(res => res.text.match(/(STATUS|体力|攻击|返回)/), 30, 1000);
  // 点击指定装备
  clickRect({ bounds: listEquip()[targetEquip] }, 0.5);
  log('点击指定装备');
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
    clickRect({ bounds: enhanceStuff[0] });
    log('点击第一个强化材料');
    clickRect(enhanceConfirm);
    sleep(1000);
    while (colors.blue(captureScreen().pixel(
      enhanceConfirm.bounds.left,
      enhanceConfirm.bounds.top
    )) > 220)
      sleep(300);
  }
  NIKKEstorage.put('dailyMissionEquip', NikkeToday());
  back();
  返回首页();
}

function dailyMissionCompleted() {
  return NikkeToday() == NIKKEstorage.get('dailyMissionCompleted', null);
}

function 每日任务() {
  if (dailyMissionCompleted())
    return;
  社交点数招募();
  强化装备();
  let season = ocrUntilFound(res => res.find(e => e.text.includes('SEASON')), 30, 500);
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
    return res.find(e => e.text.match(/.{0,2}全/) != null);
  }, 30, 500);
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
  NIKKEstorage.put('dailyMissionCompleted', NikkeToday());
}
