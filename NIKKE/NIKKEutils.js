var {
  ocrUntilFound,
  clickRect,
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
    返回首页: 返回首页
  };
}
function 启动NIKKE() {
  unlockIfNeed();
  home();
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
  // 检查是否有每天签到
  let today = new Date().toLocaleDateString();
  let lastChecked = NIKKEstorage.get('dailyLogin', null);
  if (today == lastChecked) {
    log('今日已登录，不检查登录奖励');
    return;
  }
  NIKKEstorage.put('dailyLogin', today);
  if (ocrUntilFound(res => res.text.match(/\d+(小时|天|分钟)/), 4, 5000) == null)
    log('没有出现登录奖励');
  else {
    sleep(1000);
    let dailyLogin = ocrUntilFound(res => res.filter(e =>
      e.text.match(/[领領]取/) != null
    ).toArray(), 1, 500);
    if (dailyLogin.length == 0)
      toastLog('没有登录奖励');
    else {
      dailyLogin = dailyLogin.reduce((prev, curr) =>
        prev.bounds.top > curr.bounds.top ? prev : curr
      );
      if (dailyLogin.text.match(/[已巳己]/) == null) {
        toastLog('领取登录奖励');
        clickRect(dailyLogin);
        clickRect(ocrUntilFound(res => res.find(e => e.text.includes('点击')), 20, 1000));
        sleep(1000);
      } else {
        toastLog('登录奖励已被领取');
      }
      back();
    }
  }
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
  homeImage.recycle();
  sleep(1000);
  while (true) {
    click(result.x, result.y);
    sleep(4000);
    if (ocrUntilFound(res => res.text.match(/(大厅|基地|物品|方舟)/), 5, 400) != null)
      break;
  }
  log('返回首页');
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
      sleep(5000);
      for (let i = 0; i < 2; ++i) {
        skipBtn = ocrUntilFound(res => res.find(e =>
          e.text.match(/[LAUTOG]/) == null && e.text.match(/SK.P/) != null
        ), 3, 1000);
        if (skipBtn != null) {
          clickRect(skipBtn);
          sleep(1000);
        } else
          break;
      }
      ocrUntilFound(res => res.text.includes('REWARD'), 30, 6000);
      let target = ocrUntilFound(res => {
        let restart = res.find(e => e.text.endsWith('重新开始'));
        let nextCombat = res.find(e => e.text.match(/下[^步方法]{2}/) != null);
        if (restart != null && restart.bounds.left >= width / 2)
          return restart;
        return nextCombat;
      }, 20, 1000);
      sleep(1000);
      if (colors.blue(captureScreen().pixel(target.bounds.left, target.bounds.top)) < 200)
        break;
      clickRect(target);
    }
    log('门票用完了');
    click(width / 2, height / 2);
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