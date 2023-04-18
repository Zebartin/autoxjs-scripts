auto.waitFor();
var {
  unlockIfNeed,
  requestScreenCaptureAuto,
  ocrUntilFound,
  clickRect,
  getDisplaySize
} = require('./utils.js');
let [width, height] = getDisplaySize();

// 解锁、申请权限
unlockIfNeed();
sleep(1000);
home();
sleep(1000);
requestScreenCaptureAuto();
// 启动应用，等待首页加载
app.launchApp('哔哩哔哩漫画');

// 找到“我的”按钮
let myBtn = ocrUntilFound(res => {
  let t = res.filter(e => e.text == '我的').toArray();
  if (t.length == 0)
    return null;
  if (t.length == 1)
    return t[0];
  t.sort((a, b) => a.bounds.top - b.bounds.top);
  return t[t.length - 1];
}, 20, 3000);
sleep(2000);
back();
clickRect(myBtn);
// 点击“福利中心”
let giftCenter = ocrUntilFound(res => {
  if (!res.text.includes('活动中心'))
    return null;
  return res.find(e => e.text.includes('福利'));
}, 20, 1000);
// 先进一次消除签到板
clickRect(giftCenter);
sleep(2000);
back();
sleep(1000);
clickRect(giftCenter);
// 等待加载，随机找一个漫画
text('阅读漫画赚赛季积分').waitFor(); // 可能会弹出签到板
className("android.view.View").depth(12)
  .indexInParent(random(14, 16))
  .click();
// 等待加载，点击屏幕中央消去头尾的导航栏
ocrUntilFound(res => {
  if (res.text.match(/弹[慕幕]见/) != null) {
    click(width / 2, height / 2);
    sleep(1000);
    return true;
  } else if (res.text.includes("重试")) {
    clickRect(res.find(e => e.text == '重试'));
  } else if (res.text.match(/(该话.有.容|不支持|视频|免费|购买)/) != null) {
    back();
    className("android.view.View").depth(12)
      .indexInParent(random(14, 16))
      .click();
  }
  return false;
}, 50, 1000);

var timeEnough = false;
var threadRead = threads.start(() => {
  log("看漫画开始");
  while (!timeEnough) {
    click(width * 0.2, height * 0.8);
    sleep(random(6000, 9000));
    click(width * 0.8, height * 0.2);
    sleep(random(6000, 9000));
  }
  log("看漫画结束");
  // 连按退出程序
  while (true) {
    back();
    sleep(500);
    if (text('阅读漫画赚赛季积分').exists())
      break;
  }
  back();
  sleep(1000);
  clickRect(giftCenter);
  text('阅读漫画赚赛季积分').waitFor();
  sleep(5000);
  for (let i = 0; i < 3; ++i) {
    back();
    sleep(500);
  }
})
// 30分钟后终止threadRead
threads.start(() => {
  setTimeout(() => {
    timeEnough = true;
  }, 30 * 60 * 1000 + 1000);
});
threadRead.join();
exit();