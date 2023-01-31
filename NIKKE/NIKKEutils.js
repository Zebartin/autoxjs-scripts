var { ocrUntilFound, clickRect } = require('./utils.js');
var { width, height } = device;
if (typeof module === 'undefined') {
  var {
    unlockIfNeed,
    requestScreenCaptureAuto
  } = require('./utils.js');
  auto.waitFor();
  unlockIfNeed();
  requestScreenCaptureAuto();
  刷刷刷();
  exit();
}
else {
  module.exports = {
    启动NIKKE: 启动NIKKE,
    退出NIKKE: 退出NIKKE,
    返回首页: 返回首页
  };
}
function 启动NIKKE() {
  device.setMusicVolume(0);
  if (ocrUntilFound(res => res.text.match(/(大厅|基地|物品|方舟)/), 1, 100) != null)
    return;
  if (app.launchApp("v2rayNG")) {
    if (id('tv_test_state').findOne().text() != '未连接')
      id('fab').click();
    id('fab').click();
    sleep(500);
    id('layout_test').click();
    let i;
    const maxRetry = 7;
    for (i = 0; i < maxRetry; ++i) {
      sleep(1000);
      if (id('tv_test_state').findOne().text().includes('延时'))
        break;
    }
    if (i == maxRetry) {
      console.error('启动v2rayNG服务失败');
      exit();
    }
  }

  app.launchApp("NIKKE");
  log("打开NIKKE");
  sleep(20 * 1000);
  ocrUntilFound(res => {
    if (res.text.includes('今日不再')) {
      var target = res.find(e => e.text.match(/.{0,4}今日不再/) != null);
      clickRect(target);
      sleep(500);
      click(width / 2, height * 0.8);
      sleep(40 * 1000);
    }
    else if (res.text.includes('正在下载')) {
      sleep(10000);
      return false;
    }
    else if (res.text.match(/(確認|确认)/) != null) {
      clickRect(res.find(e => e.text.match(/(確認|确认)$/) != null));
      return false;
    }
    else if (res.text.includes('登出'))
      return true;
    return false;
  }, 30, 5000);
  click(width / 2, height / 2);
  sleep(1000);
  // 等待游戏内公告出现
  ocrUntilFound(res => res.text.includes('公告'), 30, 5000);
  sleep(1000);
  back();
  // 检查是否有daily login
  if (ocrUntilFound(res => res.find(e =>
    e.text.match(/D\s*A\s*I\s*L\s*Y/i) != null &&
    e.bounds != null && e.bounds.left >= width / 2
  ), 5, 1000) != null)
    back();
}

function 退出NIKKE() {
  home();
  关闭应用('NIKKE');
  if (app.launchApp("v2rayNG")) {
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
  clickRect(ocrUntilFound(res => res.find(
    e => e.text.endsWith('战斗')
  ), 20, 3000));
  log('进入战斗');
  sleep(2000);
  if (ocrUntilFound(res => res.text.includes('AUT'), 10, 1000) != null) {
    while (true) {
      sleep(20 * 1000);
      ocrUntilFound(res => res.text.includes('REWARD'), 30, 3000);
      var target = ocrUntilFound(res => res.find(
        e => e.text.endsWith('重新开始')
      ), 20, 1000);
      if (colors.blue(captureScreen().pixel(target.bounds.left, target.bounds.top)) < 230)
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