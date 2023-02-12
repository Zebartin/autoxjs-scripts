var {
  启动NIKKE, 等待NIKKE加载,
  退出NIKKE, 返回首页
} = require('./NIKKEutils.js');
var { 模拟室 } = require('./模拟室.js');
var {
  ocrUntilFound,
  clickRect,
  requestScreenCaptureAuto,
  getDisplaySize
} = require('./utils.js');
let width, height;
let NIKKEstorage = storages.create("NIKKEconfig");
if (typeof module === 'undefined') {
  auto.waitFor();
  checkConfig();
  启动NIKKE();
  // 保证申请截屏权限时，屏幕是游戏画面
  sleep(5000);
  if (NIKKEstorage.get('alreadyInGame', false) == false)
    sleep(15000);
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
    基地收菜: 基地收菜,
    好友: 好友,
    竞技场: 竞技场,
    爬塔: 爬塔,
    咨询: 咨询,
    模拟室: () => 模拟室(true)
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
          if (alreadyRetry != maxRetry) {
            toastLog(`脚本出错，即将重试(${alreadyRetry + 1}/${maxRetry})`);
            sleep(3000);
            退出NIKKE();
            启动NIKKE();
          }
        }
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

function 商店() {
  let buyGood = (good) => {
    toastLog(`购买${good.text}`);
    clickRect(good);
    clickRect(ocrUntilFound(res => res.find(e => e.text == '购买'), 30, 1000));
    clickRect(ocrUntilFound(res => res.find(e => e.text.includes('点击')), 20, 1000));
  };
  let buyFree = () => {
    let freeGood = ocrUntilFound(res => res.find(e => e.text.match(/(100%|s[oq0]l[od0] [oq0]ut)/i) != null), 10, 300);
    if (freeGood != null && freeGood.text.includes('100%')) {
      freeGood.text = '免费商品';
      buyGood(freeGood);
      return true;
    } else
      toastLog('免费商品已售');
    return false;
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
    let arenaShop = ocrUntilFound(res => res.find(e => e.text == 'R'), 30, 1000);
    clickRect(arenaShop);
    ocrUntilFound(res => {
      if (res.text.match(/[竟竞]技场/) != null)
        return true;
      clickRect(arenaShop);
      return false;
    }, 10, 1000);
    let [manual, manualSelection, soldOut] = ocrUntilFound(res => {
      let goods = res.filter(e =>
        e.level == 3 &&
        e.text.includes('代码手册')
      ).toArray();
      let m = [], ms = null;
      for (let g of goods) {
        if (g.text.startsWith('代'))
          ms = g;
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
            m.push({
              text: t[i] + '代码手册',
              bounds: newBounds
            });
          }
        }
      }
      if (m.length < 3 || ms == null)
        return null;
      let goodsSold = res.filter(e =>
        e.level == 1 && e.bounds != null &&
        e.text.match(/s[oq0]l[od0] [oq0]ut/i) != null
      ).toArray();
      return [m, ms, goodsSold];
    }, 30, 1000);
    // 一一检查每个item是否有sold out标志
    for (let i = 0; i < Math.min(3, buyCodeManual); ++i) {
      let thisSold = soldOut.find(e =>
        e.bounds.bottom < manualSelection.bounds.top &&
        e.bounds.right > manual[i].bounds.left &&
        e.bounds.left < manual[i].bounds.right
      );
      if (thisSold == null)
        buyGood(manual[i]);
      else
        log(`${manual[i].text}已售`)
    }
    if (buyCodeManual == 4) {
      let selectionSold = soldOut.find(e =>
        e.bounds.bottom > manualSelection.bounds.bottom
      );
      if (selectionSold == null)
        buyGood(manualSelection);
      else
        log(`${manualSelection.text}已售`)
    }
  }
  返回首页();
}
function 基地收菜() {
  clickRect(ocrUntilFound(res => res.find(e => e.text.includes('基地')), 30, 1000));
  toastLog('进入基地');
  sleep(2000);
  let target = ocrUntilFound(res => {
    let headquarter = res.find(e => e.text.endsWith('中心'));
    let ret = res.find(e => e.text.endsWith('公告栏'));
    if (!headquarter || !ret)
      return null;
    // 将识别区域扩宽到整个公告栏图标
    ret.bounds.top = headquarter.bounds.bottom;
    return ret;
  }, 30, 1000);
  clickRect(target);
  toastLog('进入公告栏');
  // 等待派遣内容加载
  target = ocrUntilFound(res => res.text.match(/(时间|完成|目前)/), 20, 500);
  // 已经没有派遣内容
  if (target[0] == '目前')
    toastLog('今日派遣已完成');
  else {
    let [send, receive] = ocrUntilFound(res => {
      let t1 = res.find(e => e.text.includes('全部派'));
      let t2 = res.find(e => e.text.match(/全部[领領邻]/) != null);
      if (!t1 || !t2)
        return null;
      return [t1, t2];
    }, 30, 1000);
    if (colors.red(images.pixel(captureScreen(), send.bounds.right, send.bounds.top)) > 240) {
      clickRect(send);
      toastLog('全部派遣');
      sleep(2000);
      target = ocrUntilFound(res => {
        let x = res.filter(e => e.text.match(/派.$/) != null);
        if (x.length > 3)
          return x;
        return null;
      }, 30, 400);
      clickRect(target[target.length - 1]);
      toastLog('点击派遣');
      ocrUntilFound(res => res.text.includes('全部'), 30, 1000);
      sleep(600);
    }
    if (colors.red(images.pixel(captureScreen(), receive.bounds.right, receive.bounds.top)) < 100) {
      toastLog('全部领取');
      clickRect(receive);
      clickRect(ocrUntilFound(res => res.find(e => e.text.includes('点击')), 10, 3000));
      ocrUntilFound(res => res.text.includes('全部'), 30, 1000);
      sleep(600);
    }
  }
  back();
  sleep(3000);      // 返回时可能会卡顿，保险起见等一会儿
  clickRect(ocrUntilFound(res => res.find(e => e.text.includes('DEFENSE')), 30, 1000));
  clickRect(ocrUntilFound(res => res.find(e => e.text.endsWith('歼灭')), 30, 1000));
  toastLog('尝试一举歼灭');
  ocrUntilFound(res => res.text.includes('今日'), 30, 1000);
  clickRect(ocrUntilFound(res => res.find(e => e.text.startsWith('进行')), 30, 1000));
  ocrUntilFound(res => {
    if (res.text.match('(优先|珠宝|确认)') != null)
      back();
    else if (res.text.includes('点击'))
      clickRect(res.find(e => e.text.includes('点击')));
    else
      return false;
    return true;
  }, 10, 1000);
  ocrUntilFound(res => res.text.includes('今日'), 30, 1000);
  back();
  clickRect(ocrUntilFound(res => res.find(e => e.text.includes('奖励')), 30, 1000));
  toastLog('点击获得奖励');
  clickRect(ocrUntilFound(res => res.find(e => e.text.includes('点击')), 10, 3000));
  sleep(1000);
  target = ocrUntilFound(res => res.find(e => e.text.includes('点击')), 5, 300);
  if (target != null) {
    clickRect(target);
    toastLog('升级了');
  }
  sleep(1000);
  返回首页();
}
function 好友() {
  clickRect(ocrUntilFound(res => res.find(e => e.text.includes('好友')), 30, 1000));
  toastLog('点击好友');
  // 等待列表加载
  ocrUntilFound(res =>
    res.text.match(/(分钟|小时|天)/) != null ||
    res.find(e => e.text.endsWith('登入')) != null, 30, 1000);
  let target = ocrUntilFound(res => res.find(e => e.text.endsWith('赠送')), 30, 1000);
  if (colors.red(captureScreen().pixel(target.bounds.left, target.bounds.top)) < 100) {
    clickRect(target);
    toastLog('点击赠送');
    clickRect(ocrUntilFound(res => res.find(e => e.text.includes('确认')), 30, 1000));
    sleep(1000);
  }
  back();
}
function 爬塔() {
  clickRect(ocrUntilFound(res => res.find(e => e.text.includes('方舟')), 30, 1000));
  clickRect(ocrUntilFound(res => res.find(e => e.text.includes('无限之塔')), 30, 1000));
  toastLog('进入无限之塔');
  clickRect(ocrUntilFound(res => res.find(e => e.text.includes('正常开启')), 30, 1000));
  for (let i = 0; i < 7; ++i) {
    let successFlag = false;
    let curTower = getIntoNextTower();
    if (curTower.match(/[无限]/)) {
      toastLog('没有下一个塔了');
      break;
    }
    let cnt = ocrUntilFound(res => {
      let t = res.text.match(/[余关]次[^\d]+(\d)\/3/);
      if (t != null)
        return parseInt(t[1]);
    }, 30, 300);
    log(`通关次数 ${cnt}/3`);
    if (cnt == 0)
      continue;
    sleep(5000);
    click(width / 2, height / 2 - 100);
    toast('点击屏幕中央');
    sleep(1000);
    clickRect(ocrUntilFound(res => res.find(e => e.text.includes('进入战斗')), 30, 1000));
    toast('进入战斗');
    for (let j = 0; j < cnt; ++j) {
      sleep(9000);
      if (ocrUntilFound(res => res.text.includes('AUTO'), 10, 3000) == null)
        break;
      sleep(40 * 1000);
      ocrUntilFound(res => {
        if (res.text.includes('AUTO'))
          return false;
        if (res.text.includes('REWARD') || res.text.includes('FAIL'))
          return true;
      }, 30, 5000);
      sleep(1000);
      let endCombat = ocrUntilFound(res => res.find(
        e => e.text.match(/(下[^步方法]{2}|返回)/) != null
      ), 100, 100);
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
    if (successFlag) {
      toastLog('等待限时礼包出现…');
      let closeSale = ocrUntilFound(res => {
        if (res.text.match(/(小时|分钟|免|点击)/) == null)
          return null;
        return res.find(e => e.text.includes('点击'));
      }, 5, 1000);
      if (closeSale == null)
        toastLog('没有出现限时礼包');
      else {
        toastLog('关闭礼包页面');
        clickRect(closeSale);
        clickRect(ocrUntilFound(res => res.find(e => e.text.includes('确认')), 20, 1000));
        ocrUntilFound(res => !res.text.includes('点击'), 20, 1500);
      }
    }
  }
  返回首页();
}
function getIntoNextTower() {
  let towerName = ocrUntilFound(res => res.find(
    e => e.text.endsWith('之塔') && e.bounds.top > height / 2
  ), 20, 1000);
  sleep(1000);
  click(width - 50, towerName.bounds.centerY());
  sleep(2000);
  let curTowerName = ocrUntilFound(res => res.find(
    e => e.text.endsWith('之塔') && e.bounds.top > height / 2
  ), 20, 1000).text;
  toastLog(`进入${curTowerName}`);
  return curTowerName;
}

function 竞技场() {
  clickRect(ocrUntilFound(res => res.find(e => e.text.includes('方舟')), 30, 1000));
  clickRect(ocrUntilFound(res => res.find(e => e.text.includes('技场')), 30, 1000));
  clickRect(ocrUntilFound(res => res.find(e => e.text.includes('新人')), 30, 1000));
  toastLog('进入新人竞技场');
  const targetFight = ocrUntilFound(res => {
    let t = res.filter(e =>
      e.text.endsWith('战斗') && e.level == 1 &&
      e.bounds != null && e.bounds.left > width / 2
    ).toArray();
    if (t.length != 3)
      return null;
    t.sort((a, b) => a.bounds.top - b.bounds.top);
    return t[NIKKEstorage.get('rookieArenaTarget', 1) - 1];
  }, 30, 1000);
  while (true) {
    let hasFree = ocrUntilFound(res => {
      if (!res.text.includes('战斗'))
        return null;
      let t = res.find(e =>
        e.text.includes('免') && e.bounds != null &&
        e.bounds.left >= width / 2
      );
      return t == null ? 'notFree' : 'free';
    }, 30, 1000);
    if (hasFree != 'free')
      break;
    clickRect(targetFight);
    ocrUntilFound(res =>
      res.text.includes('变更') ||
      !res.text.includes('目录'),
      30, 1000);
    clickRect(ocrUntilFound(res => res.find(e => e.text.endsWith('战斗')), 30, 1000));
    toastLog('进入战斗');
    sleep(5000);
    ocrUntilFound(res => res.text.includes('RANK'), 20, 3000);
    toastLog('结算界面');
    sleep(1000);
    click(width / 2, height * 0.2);
  }
  back();
  clickRect(ocrUntilFound(res => res.find(e => e.text.includes('SPECIAL')), 30, 1000));
  toastLog('进入特殊竞技场');
  ocrUntilFound(res => res.text.includes('战斗'), 30, 1000);
  // 如果识别出了百分号，直接点百分号
  // 没有就点上方中央“特殊竞技场”下方位置，可能能点到
  ocrUntilFound(res => {
    let atk = res.find(e => e.text.includes('ATK'));
    if (!atk)
      return null;
    let percentSign = res.find(e =>
      e.text.includes('%') && e.bounds != null &&
      e.bounds.bottom < atk.bounds.top &&
      e.bounds.left > atk.bounds.right
    );
    if (percentSign != null) {
      if (percentSign.text != '0%') {
        clickRect(percentSign);
        toastLog('领取竞技场奖励');
        clickRect(ocrUntilFound(res => res.find(e => e.text.includes('点击')), 30, 1000));
      }
    }
    else {
      let title = res.find(e =>
        e.text.startsWith('特殊') && e.bounds != null &&
        e.bounds.left > atk.bounds.right
      );
      if (title == null)
        return null;
      click(title.bounds.centerX(), title.bounds.bottom + 10);
      toastLog('领取竞技场奖励');
      clickRect(ocrUntilFound(res => res.find(e => e.text.includes('点击')), 30, 1000));
    }
    return true;
  }, 30, 1000);
  返回首页();
}
function 咨询() {
  const advise = JSON.parse(files.read('./nikke.json'));
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
        swipe(
          width / 2, cases[cases.length - 1].bounds.top,
          width / 2, attrs[0].bounds.bottom, 777 * cases.length
        );
        sleep(1000);
      }
    }
    clickRect(attrs[adviseTarget]);
    if (单次咨询(advise))
      cnt++;
    else
      swipe(
        width / 2, attrs[adviseTarget + 1].bounds.top,
        width / 2, attrs[0].bounds.top, 5000 * adviseTarget + 5000
      );
  }
  toastLog('完成咨询');
  返回首页();
}
function 单次咨询(advise) {
  const maxRetry = 3;
  let nameRetry = 0;
  let [adviseBtn, name, hasMax] = ocrUntilFound(res => {
    if (!res.text.includes('查看花'))
      return null;
    let btn = res.find(e =>
      e.text.includes('咨询') && e.bounds != null &&
      e.bounds.top > height / 2 && e.bounds.left > width / 2
    );
    let upper = res.find(e => e.text.includes('查看花') && e.bounds != null);
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
        log(`已达最大尝试次数${maxRetry}`);
        log('可能原因：暂不支持新版本妮姬的咨询');
        toastLog('妮姬名字识别失败，直接退出，不重启游戏');
        exit();
      } else
        log(`妮姬名字识别相似度过低，重试(${nameRetry}/${maxRetry})`);
      return null;
    }
    return [btn, nameResult.result, value.text.includes('MAX')];
  }, 30, 2000);
  log(`咨询对象：${name}`);
  if (hasMax) {
    log('已达好感度上限');
    back();
    ocrUntilFound(res => res.text.includes('可以'), 30, 3000);
    return false;
  }
  if (colors.blue(captureScreen().pixel(adviseBtn.bounds.right, adviseBtn.bounds.top)) < 200) {
    log('咨询按钮不可点击');
    back();
    ocrUntilFound(res => res.text.includes('可以'), 30, 3000);
    return false;
  }
  for (let i = 1; i <= maxRetry; ++i) {
    clickRect(adviseBtn);
    clickRect(ocrUntilFound(res => res.find(
      e => e.text.includes('确认')
    ), 30, 1000));
    let pageStat = ocrUntilFound(res => {
      if (res.text.match(/(查看花|RANK|次数|确认|取消)/) != null)
        return 'outside';
      if (res.text.match(/(AUTO|LOG|CANCEL)/) != null)
        return 'inside';
      return null;
    }, 10, 2000);
    if (pageStat == 'outside') {
      log('已达好感度上限');
      back();
      sleep(1000);
      back();
      ocrUntilFound(res => res.text.includes('可以'), 10, 3000);
      return false;
    }
    // 连点直到出现选项
    let adviseImage = images.read('./images/counsel.jpg');
    let result = null;
    for (let j = 0; j < 15; ++j) {
      result = images.matchTemplate(captureScreen(), adviseImage, {
        threshold: 0.7,
        max: 2,
        region: [0, height / 2, width / 2, height / 2]
      });
      if (result.matches.length == 2)
        break;
      click(width / 2, height / 2);
      sleep(1000);
    }
    let optionTop = result.topmost().point.y;
    let optionBottom = result.bottommost().point.y;
    let options = ocrUntilFound(res => {
      let t = res.filter(
        e => e.level == 1 && e.bounds.top >= optionTop
      );
      let t1 = null, t2 = null;
      for (let i of t) {
        if (i.bounds.top < optionBottom)
          t1 = i;
        else
          t2 = i;
      }
      if (t1 == null && t2 == null)
        return null;
      t1 = t1 == null ? "" : t1.text;
      t2 = t2 == null ? "" : t2.text;
      return [t1, t2];
    }, 10, 300);
    let whichOne = null, similarOne = -1;
    for (let i = 0; i < 2; ++i) {
      let t = mostSimilar(options[i], advise[name]);
      log(`选项${i + 1}："${options[i]}"`);
      log(`匹配："${t.result}"，相似度${t.similarity.toFixed(2)}`);
      if (t.similarity > similarOne) {
        similarOne = t.similarity;
        whichOne = i;
      }
    }
    if (similarOne < 0.75 && i < maxRetry) {
      toastLog(`相似度过低，放弃本次咨询(尝试次数${i}/${maxRetry})`);
      clickRect(ocrUntilFound(res => res.find(e =>
        e.text.match(/[UTOG]/) == null && e.text.includes('NCE')
      ), 30, 1000));
      ocrUntilFound(res => res.text.includes('查看花'), 20, 2000);
      continue;
    }
    if (i == maxRetry)
      log(`已达最大尝试次数${maxRetry}，无视低相似度`);
    log(`咨询选择："${options[whichOne]}"`);
    if (whichOne == 0)
      click(width / 2, adviseImage.getHeight() / 2 + optionTop);
    else
      click(width / 2, adviseImage.getHeight() / 2 + optionBottom);
    adviseImage.recycle();
    ocrUntilFound(res => {
      if (res.text.includes('咨询'))
        return true;
      let skipBtn = res.find(e =>
        e.text.match(/[LAUTOG]/) == null && e.text.match(/SK.P/) != null
      );
      if (skipBtn == null)
        click(width / 2, height / 2);
      else {
        clickRect(skipBtn);
        return true;
      }
    }, 30, 1000);
    break;
  }
  sleep(1000);
  back();
  if (ocrUntilFound(res => {
    if (res.text.includes('可以'))
      return true;
    back();
    return false;
  }, 5, 3000) == false) {
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
  return true;
}
function mostSimilar(target, candidates) {
  let res = null, maxSim = -1;
  for (let candidate of candidates) {
    if (target == candidate) {
      res = candidate;
      maxSim = 1;
      break;
    }
    let s = similarity(target, candidate);
    if (s > maxSim) {
      maxSim = s;
      res = candidate;
    }
  }
  return {
    result: res,
    similarity: maxSim
  };
}
// 编辑距离
function similarity(s1, s2) {
  let n = s1.length, m = s2.length;
  if (n * m == 0)
    return n == m ? 1 : 0;
  let dp = [];
  for (let i = 0; i <= n; ++i)
    dp.push([i]);
  for (let j = 1; j <= m; ++j)
    dp[0].push(j);
  for (let i = 1; i <= n; ++i) {
    for (let j = 1; j <= m; ++j) {
      let left = dp[i - 1][j] + 1;
      let down = dp[i][j - 1] + 1;
      let leftDown = dp[i - 1][j - 1];
      if (s1[i - 1] != s2[j - 1])
        leftDown += 1;
      dp[i][j] = Math.min(left, down, leftDown);
    }
  }
  return 1.0 - dp[n][m] / Math.max(m, n);
}