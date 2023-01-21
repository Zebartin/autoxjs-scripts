auto.waitFor();
var {
  unlockIfNeed,
  requestScreenCaptureAuto,
  ocrUntilFound,
  clickRect
} = require('./utils.js');
var { width, height } = device;
// 解锁、申请权限
unlockIfNeed();
requestScreenCaptureAuto();
// 启动应用，等待首页加载
app.launchApp('哔哩哔哩漫画');

// 找到“我的”按钮
var myBtn = ocrUntilFound(res => res.find(e =>
  e.text == '我的' && e.bounds.top > height * 0.8
), 20, 3000);
sleep(2000);
back();
// if (ocrUntilFound(res => res.text.match(/(立即..|点击..|我知道了)/), 4, 300) != null)
//   back();
clickRect(myBtn);
// 点击“福利中心”
ocrUntilFound(res => res.text.includes('活动中心'), 20, 1000);
clickRect(ocrUntilFound(res => res.find(e => e.text.includes('福利')), 20, 1000));
// 等待加载，随机找一个漫画
text('阅读漫画赚赛季积分').waitFor(); // 可能会弹出签到板
className("android.view.View").depth(12)
  .indexInParent(random(14, 16))
  .click();
// 等待加载，点击屏幕中央消去头尾的导航栏
ocrUntilFound(res => {
  if (res.text.match(/弹(慕|幕)/) != null) {
    click(width / 2, height / 2);
    sleep(1000);
    return true;
  } else if (res.text.includes("重试")) {
    clickRect(res.find(e => e.text == '重试'));
  } else if (res.text.match(/该话.有.容/) != null) {
    clickRect(res.find(e => e.text == '返回'));
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
  sleep(500);
  clickRect(ocrUntilFound(res => res.find(e => e.text.includes('福利')), 20, 1000));
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