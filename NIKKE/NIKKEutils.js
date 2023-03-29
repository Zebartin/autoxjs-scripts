var {
  ocrUntilFound, clickRect, unlockIfNeed,
  requestScreenCaptureAuto, getDisplaySize,
  killApp, findImageByFeature, findContoursRect
} = require('./utils.js');
if (typeof module === 'undefined') {
  auto.waitFor();
  unlockIfNeed();
  requestScreenCaptureAuto();
  刷刷刷();
  if (confirm('已完成活动刷关，\n是否继续日常收菜？')) {
    返回首页();
    engines.execScriptFile('./NIKKE日常.js', {
      delay: 1000
    });
  }
  exit();
}
else {
  module.exports = {
    启动NIKKE: 启动NIKKE,
    等待NIKKE加载: 等待NIKKE加载,
    退出NIKKE: 退出NIKKE,
    返回首页: 返回首页,
    mostSimilar: mostSimilar,
    detectNikkes: detectNikkes,
    NikkeToday: NikkeToday,
    关闭限时礼包: 关闭限时礼包
  };
}
function 启动NIKKE() {
  unlockIfNeed();
  home();
  // 保证错误截图不要过多
  let maxErr = 20;
  let errorPath = files.path('./images/nikkerror/');
  files.ensureDir(errorPath);
  let errorImages = files.listDir(errorPath);
  if (errorImages.length >= maxErr) {
    errorImages.sort((a, b) => parseInt(b.split('.')[0]) - parseInt(a.split('.')[0]));
    for (let f of errorImages.slice(maxErr))
      files.remove(files.join(errorPath, f));
  }
  let NIKKEstorage = storages.create("NIKKEconfig");
  if (NIKKEstorage.get('mute', false)) {
    try {
      device.setMusicVolume(0);
    } catch (error) {
      if (error.message.includes('系统设置权限'))
        toastLog('需要为AutoX.js打开修改系统设置权限');
      else
        toastLog(error);
    }
  }
  // 自行启动v2rayNG科学上网
  if (NIKKEstorage.get('v2rayNG', false) && app.launchApp("v2rayNG")) {
    // 关闭连接，否则会影响真连接测试
    if (id('tv_test_state').findOne().text() != '未连接')
      id('fab').click();
    let i;
    const maxRetry = 10;
    for (i = 0; i < maxRetry; ++i) {
      desc('更多选项').click();
      text('测试全部配置真连接').waitFor();
      click('测试全部配置真连接');
      sleep(1000);
      textEndsWith('ms').waitFor();
      desc('更多选项').click();
      text('按测试结果排序').waitFor();
      click('按测试结果排序');
      let firstCard = id("info_container").findOne();
      let firstDelay = firstCard.findOne(textEndsWith('ms'));
      if (firstDelay != null && firstDelay.text() != '-1ms') {
        firstCard.click();
        break;
      }
      sleep(3000);
    }
    if (i == maxRetry) {
      console.error('启动v2rayNG服务失败');
      exit();
    }
    id('fab').click();
  }

  app.launchApp("NIKKE");
  log("打开NIKKE");
  // waitForActivity('com.shiftup.nk.MainActivity');
}

function 等待NIKKE加载() {
  if (ocrUntilFound(res => res.text.match(/(大厅|方舟|物品栏)/), 3, 300) != null)
    return;
  let [width, height] = getDisplaySize();
  let manuallyEnter = false;
  if (ocrUntilFound(res => {
    toast('等待加载……');
    if (res.text.includes('今日不再')) {
      var target = res.find(e => e.text.match(/.{0,4}今日不再/) != null);
      clickRect(target);
      sleep(500);
      click(width / 2, height * 0.9);
    }
    else if (res.text.includes('SIGN IN')) {
      toastLog('未登录游戏，停止运行脚本');
      exit();
    }
    else if (res.text.includes('正在下载')) {
      sleep(20000);
    }
    else if (res.text.match(/[確确][認认]/) != null) {
      clickRect(res.find(e => e.text.match(/[確确][認认]/) != null));
    }
    else if (res.text.match(/(登出|T.UCH|C.NT.NUE)/) != null)
      return true;
    else if (res.text.match(/(大厅|方舟|物品栏)/) != null) {
      manuallyEnter = true;
      return true;
    }
    return false;
  }, 60, 5000) == null)
    throw new Error('游戏似乎一直在加载');
  if (manuallyEnter)
    return;
  click(width / 2, height / 2);
  sleep(1000);
  // 等待游戏内公告出现，并处理月卡
  if (ocrUntilFound(res => {
    if (res.text.includes('公告'))
      return true;
    if (res.text.match(/(REWARD|30天|点击|奖励)/) != null)
      click(width / 2, height * 0.8);
    return false;
  }, 20, 4000) == null)
    throw new Error('没有出现游戏公告');
  sleep(1000);
  back();
  toastLog('关闭公告');
  等待每日签到();
  关闭限时礼包();
}

function 退出NIKKE() {
  home();
  killApp('NIKKE');
  if (storages.create("NIKKEconfig").get('v2rayNG', false) && app.launchApp("v2rayNG")) {
    if (id('tv_test_state').findOne().text() != '未连接')
      id('fab').click();
    killApp('v2rayNG');
  }
}


function 返回首页() {
  const homeImage = images.read('./images/home.jpg');
  let [width, height] = getDisplaySize();
  var result = null;
  for (let i = 0; i < 10; ++i) {
    result = findImageByFeature(captureScreen(), homeImage, {
      threshold: 0.6,
      region: [0, height * 0.8, width / 2, height * 0.2]
    });
    if (result != null)
      break;
    sleep(300);
  }
  result.text = '首页图标';
  homeImage.recycle();
  sleep(1000);
  for (let i = 0; i < 10; ++i) {
    clickRect(result, 0.8, 0);
    sleep(4000);
    let hallBtn = ocrUntilFound(res => {
      if (res.text.match(/(大厅|基地|物品|方舟)/) == null)
        return null;
      return res.find(e => e.text == '大厅');
    }, 3, 400)
    if (hallBtn != null) {
      clickRect(hallBtn);
      break;
    }
  }
  log('返回首页');
}

function 等待每日签到() {
  let NIKKEstorage = storages.create("NIKKEconfig");
  if (NIKKEstorage.get('checkDailyLogin', true) == false)
    return;
  // 检查是否有每天签到
  let today = NikkeToday();
  let lastChecked = NIKKEstorage.get('dailyLogin', null);
  if (today == lastChecked) {
    log('今日已登录，不检查签到奖励');
  } else {
    NIKKEstorage.put('dailyLogin', today);
    if (ocrUntilFound(res => {
      toast('正在等待每日签到出现，请勿操作');
      return res.text.match(/\d+(小时|天|分钟)/);
    }, 4, 5000) == null)
      log('没有出现签到奖励');
    else {
      back();   // 每次的登录奖励ui都不一样，不处理直接返回
      toastLog('关闭签到奖励');
    }
  }
}

function 关闭限时礼包() {
  if (storages.create("NIKKEconfig").get('checkSale', false) == false)
    return;
  toastLog('等待限时礼包出现…');
  sleep(2000);
  let closeSale = ocrUntilFound(res => {
    if (res.text.match(/(小时|分钟|免|点击)/) == null)
      return null;
    return res.find(e => e.text.includes('点击'));
  }, 3, 2000);
  if (closeSale == null) {
    toastLog('没有出现限时礼包');
    sleep(2000);
  }
  else {
    toastLog('关闭礼包页面');
    clickRect(closeSale);
    clickRect(ocrUntilFound(res => res.find(e => e.text.includes('确认')), 20, 1000));
    ocrUntilFound(res => !res.text.includes('点击'), 20, 1500);
  }
}

// 根据刷新时间来确定
// 比如03-22凌晨1点，视为03-21而非03-22
function NikkeToday() {
  let today = new Date();
  today.setTime(today.getTime() + 4 * 60 * 60 * 1000);
  return today.getUTCMonth() + '-' + today.getUTCDate();
}

function 刷刷刷() {
  let [width, height] = getDisplaySize();
  clickRect(ocrUntilFound(res => res.find(
    e => e.text.endsWith('战斗')
  ), 20, 3000));
  log('进入战斗');
  sleep(2000);
  if (ocrUntilFound(res => res.text.includes('AUT'), 20, 1000) != null) {
    while (true) {
      ocrUntilFound(res => {
        if (!res.text.includes('AUT')) {
          sleep(1000);
          return null;
        }
        let autoBtn = res.find(e => e.text.includes('AUT'));
        if (autoBtn.bounds.right < width / 2)
          return true;
        let skipBtn = res.find(e =>
          e.text.match(/[LAUTOG]/) == null && e.text.match(/SK.P/) != null
        );
        if (skipBtn != null) {
          clickRect(skipBtn, 0.1);
          sleep(1000);
        }
        else
          click(width / 2, height / 2);
        return null;
      }, 50, 1000);
      let clickNext = ocrUntilFound(res => {
        if (!res.text.includes('REWARD')) {
          sleep(2000);
          return null;
        }
        return res.find(e => e.text.includes('步'));
      }, 50, 1000);
      let img = captureScreen();
      let hasBlue = images.findColor(img, '#00a1ff', {
        region: [
          0, clickNext.bounds.bottom,
          clickNext.bounds.right, img.height - clickNext.bounds.bottom
        ],
        threshold: 20
      });
      if (hasBlue == null)
        break;
      let target = ocrUntilFound(res => {
        let nextCombat = res.find(e => e.text.match(/下[^步方法]{2}/) != null);
        if (nextCombat != null)
          return nextCombat;
        let restart = res.find(e => e.text.includes('重新开始'));
        if (restart != null && restart.bounds.left >= width / 2)
          return restart;
        return null;
      }, 30, 500);
      clickRect(target);
    }
    log('门票用完了');
    click(width / 2, height / 2);
    ocrUntilFound(res => {
      if (res.text.includes('返回'))
        return true;
      let skipBtn = res.find(e =>
        e.text.match(/[LAUTOG]/) == null && e.text.match(/SK.P/) != null
      );
      if (skipBtn != null) {
        clickRect(skipBtn, 0.1);
        sleep(2000);
      } else
        click(width / 2, height / 2);
      return null;
    }, 30, 1000);
  }
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


function detectNikkes(originalImg, options) {
  let nikkeContours = findContoursRect(originalImg, {
    thresh: options.thresh || 200,
    region: options.region
  }).filter(rect => {
    if (rect.width() < 100)
      return false;
    if (rect.width() * 2.5 < rect.height())
      return false;
    if (rect.width() * 1.5 > rect.height())
      return false;
    return true;
  });
  let nikkes = [];
  let specialNameReg = /[森杨]/;
  for (let con of nikkeContours) {
    let w = Math.floor(con.width() / 4);
    let h = Math.floor(con.height() / 5);
    let clipImg = images.clip(originalImg, con.left + w, con.top + h * 4, w * 3, h);
    // images.save(clipimg, `./images/nikkerror/${con.left}_${con.top}.jpg`);
    for (let k = 3; k <= 16; ++k) {
      let ocr;
      if (k == 3)
        ocr = gmlkit.ocr(clipImg, 'zh');
      else {
        let scaleimg = images.scale(clipImg, k, k, 'CUBIC');
        ocr = gmlkit.ocr(scaleimg, 'zh');
        scaleimg.recycle();
      }
      ocr = ocr.toArray(3).toArray();
      if (ocr.length == 0)
        continue;
      let rightBottom = ocr.reduce((a, b) => {
        let t = a.bounds.bottom - b.bounds.bottom;
        if (Math.abs(t) < 10)
          return a.bounds.right > b.bounds.right ? a : b;
        return t > 0 ? a : b;
      });
      let name = rightBottom.text.replace(/[一\s\-·,]/g, '');
      if (name.length < 2 && !specialNameReg.test(name))
        continue;
      nikkes.push({
        name: name,
        bounds: con,
        scale: k == 3 ? 1 : k,
        confidence: rightBottom.confidence
      })
      break;
    }
    clipImg.recycle();
  }
  return nikkes;
}
