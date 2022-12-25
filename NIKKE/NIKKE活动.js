var { 启动NIKKE, 退出NIKKE, 返回首页 } = require('./NIKKEutils.js');
var { 日常 } = require('./NIKKE日常.js');
var {
  unlockIfNeed,
  requestScreenCaptureAuto,
  ocrUntilFound,
  clickRect
} = require('./utils.js');
var { width, height } = device;
if (typeof module === 'undefined') {
  auto.waitFor();
  unlockIfNeed();
  requestScreenCaptureAuto();

  // 启动NIKKE();
  // 日常();

  进入活动();
  // 签到();
  刷story(8);
  玩小游戏();
  领取活动任务();
  玩小游戏();
  返回首页();
  // 退出NIKKE();
  exit();
} else {
  module.exports = {
    刷story: 刷story,
    玩小游戏: 玩小游戏
  };
}

function 进入活动() {
  const activityImage = images.read("./images/event.jpg");
  sleep(3000);
  var result = images.findImage(captureScreen(), activityImage, {
    threshold: 0.7,
    region: [width / 2, height * 0.6]
  });
  click(result.x, result.y);
  log('进入活动');
  activityImage.recycle();
  sleep(5000);
}

function 签到() {
  clickRect(ocrUntilFound(res => res.find(
    e => e.text.startsWith('签到') && e.bounds.top > height / 2
  ), 10, 3000));
  clickRect(ocrUntilFound(res => res.find(
    e => e.text.includes('取奖')
  ), 10, 3000));
  sleep(4000);
  click(width / 2, height * 0.8);
  sleep(500);
  back();
  ocrUntilFound(e => e.text.includes('小游戏'), 50, 5000);
}
function 刷story(eventId) {
  // 刷1-eventId，eventId可以取最后一关以外的数字
  clickRect(ocrUntilFound(res => res.find(
    e => e.text.startsWith('STORY') && e.bounds.left > width / 2 && e.bounds.top > height / 2
  ), 20, 3000));
  clickRect(ocrUntilFound(res => res.find(e => e.text.includes('ENTER')), 20, 3000));
  ocrUntilFound(res => res.find(e => e.text.includes('REPEAT')), 20, 3000);
  var target = ocrUntilFound(res => res.find(e => e.text.match(/hard/i) != null), 5, 300);
  // 困难已开放
  if (target != null) {
    clickRect(target);
    sleep(1000);
  }
  // 滑到最顶
  swipe(width / 2, height * 0.4, width / 2, height * 0.8, 500);
  sleep(1000);
  target = ocrUntilFound(res => res.filter(e => e.text.includes('EVENT') && e.level == 1), 5, 200);
  if (eventId >= target.length) {
    var dis = eventId - target.length + 1;
    swipe(width / 2, target[dis].bounds.top, width / 2, target[0].bounds.top, 1000 * dis);
    eventId -= dis;
  }
  clickRect(target[eventId - 1]);
  clickRect(ocrUntilFound(res => res.find(
    e => e.text.endsWith('战斗')
  ), 20, 3000));
  log('进入战斗');
  sleep(2000);
  if (ocrUntilFound(e => e.text.includes('REPEAT'), 5, 500) == null) {
    while (true) {
      sleep(40 * 1000);
      target = ocrUntilFound(res => res.find(
        e => e.text.endsWith('重新开始')
      ), 20, 5000);
      if (colors.blue(captureScreen().pixel(target.bounds.left, target.bounds.top)) < 230)
        break;
      clickRect(target);
    }
    log('门票用完了');
    click(width / 2, height / 2);
  }
  ocrUntilFound(e => e.text.includes('REPEAT'), 50, 5000);
  sleep(500);
  back();
  sleep(500);
  back();
  ocrUntilFound(e => e.text.includes('签到'), 50, 5000);
}
function 玩小游戏() {
  clickRect(ocrUntilFound(res => res.find(
    e => e.text == '小游戏' && e.bounds.top > height / 2
  ), 20, 3000));
  clickRect(ocrUntilFound(res => res.find(
    e => e.text.endsWith('开始游戏')
  ), 20, 3000));
  sleep(3000);
  if (ocrUntilFound(res => res.find(
    e => e.text.endsWith('开始游戏')
  ), 5, 500) == null) {
    var gameInfo = {
      left: null,
      right: null,
      badImage: null
    };
    gameInfo.badImage = images.read('./images/bad.jpg');
    for (let i = 0; i < 5; ++i) {
      单次小游戏(gameInfo);
      sleep(45 * 1000);
      clickRect(ocrUntilFound(res => res.find(
        e => e.text.endsWith('重新开始')
      ), 20, 3000));
      clickRect(ocrUntilFound(res => res.find(
        e => e.text.endsWith('确认')
      ), 20, 3000));
      if (ocrUntilFound(res => res.text.includes('不足'), 5, 500) != null) {
        clickRect(ocrUntilFound(res => res.find(
          e => e.text.endsWith('确认')
        ), 20, 3000));
        clickRect(ocrUntilFound(res => res.find(
          e => e.text.endsWith('返回')
        ), 20, 3000));
        break;
      }
    }
    gameInfo.badImage.recycle();
  } else {
    clickRect(ocrUntilFound(res => res.find(
      e => e.text.endsWith('确认')
    ), 20, 3000));
  }
  clickRect(ocrUntilFound(res => res.find(
    e => e.text.endsWith('返回')
  ), 20, 3000));
  ocrUntilFound(e => e.text.includes('签到'), 50, 5000);
}
function 单次小游戏(gameInfo) {
  if (gameInfo.left == null) {
    const leftImage = images.read('./images/left.jpg');
    const rightImage = images.read('./images/right.jpg');
    var left = null, right = null;
    while (true) {
      screen = captureScreen();
      left = images.findImage(screen, leftImage, {
        threshold: 0.9,
        region: [0, height * 0.5]
      });
      right = images.findImage(screen, rightImage, {
        threshold: 0.9,
        region: [0, height * 0.5]
      });
      screen.recycle();
      if (left != null && right != null)
        break;
      sleep(500);
    }
    leftImage.recycle();
    rightImage.recycle();
    gameInfo.left = left;
    gameInfo.right = right;
  }
  while (colors.red(captureScreen().pixel(gameInfo.left.x, gameInfo.left.y)) < 230)
    sleep(1000);
  sleep(2000);
  var result = null;
  for (let i = 0; i < 20; ++i) {
    result = images.findImage(captureScreen(), gameInfo.badImage, {
      threshold: 0.7,
      region: [0, height / 2, width, gameInfo.left.y - height / 2]
    });
    if (result != null)
      click(gameInfo.right.x, gameInfo.right.y);
    else
      click(gameInfo.left.x, gameInfo.left.y);
    sleep(300);
  }
  for (let i = 0; i < 130; ++i) {
    press(gameInfo.left.x, gameInfo.left.y, 1);
    press(gameInfo.right.x, gameInfo.right.y, 1);
  }
}
function 领取活动任务() {
  clickRect(ocrUntilFound(res => res.find(
    e => e.text == '任务'
  ), 20, 3000));
  clickRect(ocrUntilFound(res => res.find(
    e => e.text.includes('每日')
  ), 20, 3000));
  sleep(1000);
  clickRect(ocrUntilFound(res => res.find(
    e => e.text.includes('全部')
  ), 20, 3000));
  sleep(2000);
  clickRect(ocrUntilFound(res => res.find(
    e => e.text.includes('全部')
  ), 20, 3000));
  clickRect(ocrUntilFound(res => res.find(
    e => e.text.includes('点击')
  ), 20, 3000));
  sleep(1000);
  back();
}