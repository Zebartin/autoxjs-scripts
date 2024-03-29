auto.waitFor();
var { unlockIfNeed, getDisplaySize } = require('./utils.js');
const [width, height] = getDisplaySize();

unlockIfNeed();
// 饿了么签到();
米游社签到();

function 饿了么签到() {
  app.launchApp("饿了么");
  const threadClose = threads.start(() => {
    const adClose = className('ImageView').depth(7).drawingOrder(2);
    const negativeClose = id('negative_btn');
    const close = id('close_btn');
    const openNotify = textMatches(/(立即开启|放弃)/);
    const closeQueue = [adClose, negativeClose, close, openNotify];
    while (true) {
      for (let i of closeQueue) {
        let t = i.findOne(1000);
        if (t != null) {
          log('关闭弹窗');
          if (t.clickable() && t.text() != '放弃')
            t.click();
          else
            back();
        }
      }
    }
  });
  log("打开饿了么");
  sleep(random(3000, 7000));
  const myBtn = id('home_bottom_tab_4_text').findOne();
  click(myBtn.bounds().centerX(), myBtn.bounds().centerY());
  log("进入我的");
  sleep(random(3000, 7000));

  const memberPage = textStartsWith("成长值").findOne();
  click(memberPage.bounds().centerX(), memberPage.bounds().centerY());
  log("查看详情");
  sleep(random(3000, 7000));

  text('赚吃货豆').click();
  log("赚吃货豆");
  sleep(random(3000, 7000));
  // 签到
  const checkIn = textMatches(/(立即签到|今日已签到.*)/).findOne();
  if (checkIn.text() === '立即签到') {
    checkIn.click();
    log("点击签到");
    sleep(random(3000, 7000));
    if (text('开心收下').exists()) {
      text('开心收下').click();
      sleep(random(3000, 7000));
    }
  }
  log('饿了么已签到');
  threadClose.interrupt();
  // 连按返回退出程序
  for (let i = 0; i < 4; ++i) {
    back();
    sleep(500);
  }
}

function 米游社签到() {
  app.launchApp("米游社");
  log("打开米游社");
  const threadClose = threads.start(() => {
    const btn = textMatches(/(我知道了|下次再说)/);
    btn.waitFor();
    btn.click();
  });
  for (let name of ['原神', '崩坏：星穹铁道']) {
    text(name).findOne().parent().click();
    sleep(random(1000, 2000));
    for (let i = 0; i < 10; ++i) {
      text('签到福利').filter(w => w.bounds().right > w.bounds().left).findOne().parent().parent().click();
      textMatches(/.*(天空岛|星穹列车)$/).waitFor();
      sleep(random(1000, 2000));
      let day = textMatches(/^.+第\d+天$/).findOne(2000);
      if (day != null) {
        textMatches(/.*第\d+天$/).click();
        break;
      }
      back();
      sleep(random(300, 1000));
    }
    back();
  }
  log("米游社已签到");
  threadClose.interrupt();
  // 连按返回退出程序
  for (let i = 0; i < 3; ++i) {
    back();
    sleep(500);
  }
}