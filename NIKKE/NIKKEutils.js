module.exports = {
  启动NIKKE: 启动NIKKE,
  退出NIKKE: 退出NIKKE,
  返回首页: 返回首页
};
var { ocrUntilFound, clickRect } = require('./utils.js');
function 启动NIKKE() {
  const { width, height } = device;
  device.setMusicVolume(0);
  app.launchApp("v2rayNG");
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
  if (i == maxRetry)
    exit();

  app.launchApp("NIKKE");
  log("打开NIKKE");
  if (ocrUntilFound(res => res.text.match(/(大厅|基地|物品|方舟)/), 5, 400) != null)
    return;
  sleep(20 * 1000);
  ocrUntilFound(res => {
    if (res.text.includes('今日不再')) {
      var target = res.find(e => e.text.match(/.{0,4}今日不再/) != null);
      clickRect(target);
      sleep(500);
      click(width / 2, height * 0.8);
      sleep(40 * 1000);
    }
    else if (res.text.includes('正在下载')){
      sleep(10000);
      return false;
    }
    else if (res.text.match(/(確認|确认)/) != null) {
      clickRect(res.find(e=>e.text.match(/(確認|确认)$/) != null));
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
  click(width / 2, height * 0.9);
  // 检查是否有daily login
  if (ocrUntilFound(res => res.text.match(/D\s*A\s*I\s*L\s*Y/i), 10, 1000) != null)
    back();
}

function 退出NIKKE() {
  sleep(3000);
  back();
  clickRect(ocrUntilFound(res => {
    var t = res.find(e => e.text == '确认');
    if (t == null)
      back();
    return t;
  }, 20, 1000));

  app.launchApp("v2rayNG");
  if (id('tv_test_state').findOne().text() != '未连接')
    id('fab').click();
  home();
  sleep(1000);
  swipe(device.width / 2, device.height - 10, device.width / 2, device.height * 0.7, 1500);
  sleep(2000);
  var x = packageName('com.huawei.android.launcher').id('clearbox').findOne();
  click(x.bounds().centerX(), x.bounds().centerY());
}


function 返回首页() {
  const homeImage = images.read('./images/home.jpg');
  var result = null;
  for (let i = 0; i < 10; ++i) {
    result = images.findImage(captureScreen(), homeImage, {
      threshold: 0.7,
      region: [50, height * 0.8]
    });
    if (result != null)
      break;
    sleep(300);
  }
  homeImage.recycle();
  sleep(1000);
  while(true){
    click(result.x, result.y);
    sleep(2000);
    if (ocrUntilFound(res => res.text.match(/(大厅|基地|物品|方舟)/), 5, 400) != null)
      break;
  }
  log('返回首页');
}