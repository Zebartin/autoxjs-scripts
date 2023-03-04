var {
  ocrUntilFound,
  clickRect,
  imgToBounds,
  unlockIfNeed,
  requestScreenCaptureAuto,
  getDisplaySize
} = require('./utils.js');
if (typeof module === 'undefined') {
  auto.waitFor();
  unlockIfNeed();
  requestScreenCaptureAuto();
  刷刷刷();
  exit();
}
else {
  module.exports = {
    启动NIKKE: 启动NIKKE,
    等待NIKKE加载: 等待NIKKE加载,
    退出NIKKE: 退出NIKKE,
    返回首页: 返回首页,
    mostSimilar: mostSimilar,
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
  waitForActivity('com.shiftup.nk.MainActivity');
}

function 等待NIKKE加载() {
  let NIKKEstorage = storages.create("NIKKEconfig");
  if (ocrUntilFound(res => res.text.match(/(大厅|方舟|物品栏)/), 3, 300) != null)
    return;
  let [width, height] = getDisplaySize();
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
      return false;
    }
    else if (res.text.match(/[確确][認认]/) != null) {
      clickRect(res.find(e => e.text.match(/[確确][認认]/) != null));
      return false;
    }
    else if (res.text.includes('登出'))
      return true;
    return false;
  }, 60, 5000) == null)
    throw new Error('游戏似乎一直在加载');
  click(width / 2, height / 2);
  sleep(1000);
  // 等待游戏内公告出现
  if (ocrUntilFound(res => res.text.includes('公告'), 30, 5000) == null)
    throw new Error('没有出现游戏公告');
  sleep(1000);
  back();
  toastLog('关闭公告');
  // 检查是否有每天签到
  let today = new Date().toLocaleDateString();
  let lastChecked = NIKKEstorage.get('dailyLogin', null);
  if (today == lastChecked) {
    log('今日已登录，不检查签到奖励');
  } else {
    NIKKEstorage.put('dailyLogin', today);
    if (ocrUntilFound(res => res.text.match(/\d+(小时|天|分钟)/), 4, 5000) == null)
      log('没有出现签到奖励');
    else {
      back();   // 每次的登录奖励ui都不一样，不处理直接返回
      toastLog('关闭签到奖励');
    }
  }
  关闭限时礼包();
}

function 退出NIKKE() {
  home();
  关闭应用('NIKKE');
  if (storages.create("NIKKEconfig").get('v2rayNG', false) && app.launchApp("v2rayNG")) {
    if (id('tv_test_state').findOne().text() != '未连接')
      id('fab').click();
    关闭应用('v2rayNG');
  }
}


function 返回首页() {
  const homeImage = images.read('./images/home.jpg');
  var result = null;
  for (let i = 0; i < 10; ++i) {
    result = images.findImage(captureScreen(), homeImage, {
      threshold: 0.6,
      region: [50, height * 0.8]
    });
    if (result != null)
      break;
    sleep(300);
  }
  result = imgToBounds(homeImage, result);
  homeImage.recycle();
  sleep(1000);
  for (let i = 0; i < 10; ++i) {
    clickRect(result);
    sleep(4000);
    if (ocrUntilFound(res => res.text.match(/(大厅|基地|物品|方舟)/), 3, 400) != null)
      break;
  }
  log('返回首页');
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
  if (closeSale == null)
    toastLog('没有出现限时礼包');
  else {
    toastLog('关闭礼包页面');
    clickRect(closeSale);
    clickRect(ocrUntilFound(res => res.find(e => e.text.includes('确认')), 20, 1000));
    ocrUntilFound(res => !res.text.includes('点击'), 20, 1500);
  }
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
          sleep(5000);
          return null;
        }
        return res.find(e => e.text.includes('点击'));
      }, 30, 1000);
      let hasBlue = images.findColor(captureScreen(), '#00a1ff', {
        region: [
          0, clickNext.bounds.bottom, 
          clickNext.bounds.right, height - clickNext.bounds.bottom
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

function 关闭应用(packageName) {
  var name = getPackageName(packageName);
  if (!name) {
    if (getAppName(packageName)) {
      name = packageName;
    } else {
      return false;
    }
  }
  app.openAppSetting(name);
  while (text(app.getAppName(name)).findOne(2000) == null) {
    back();
    app.openAppSetting(name);
  }
  let is_sure = textMatches(/[强行停止结束]{2,}/).findOne();
  if (is_sure.enabled()) {
    is_sure.click();
    sleep(1000);
    textMatches(/(确定|[强行停止结束]{2,})/).click();
    log(app.getAppName(name) + "应用已被关闭");
    sleep(1000);
    back();
  } else {
    log(app.getAppName(name) + "应用不能被正常关闭或不在后台运行");
    back();
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