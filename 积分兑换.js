auto.waitFor();
var {
  unlockIfNeed,
  requestScreenCaptureAuto,
  ocrUntilFound,
  clickRect,
  getDisplaySize
} = require('./utils.js');
let [width, height] = getDisplaySize();
unlockIfNeed();
requestScreenCaptureAuto();
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

ocrUntilFound(res => res.text.includes('活动中心'), 20, 1000);
// 点击“福利中心”
let giftCenter = ocrUntilFound(res => {
  if (!res.text.includes('活动中心'))
    return null;
  return res.find(e => e.text.includes('前') && e.bounds != null && e.bounds.bottom > height * 0.4);
}, 20, 1000);

clickRect(giftCenter);
clickRect(ocrUntilFound(res=>res.find(e=>e.text.includes('分商')), 10, 700));
const firstSelector = className("android.view.View").textContains("超特惠");
const confirmSelector = className("android.view.View").textEndsWith("100 积分兑换").depth(13);
firstSelector.waitFor();

let remainPoint = ocrUntilFound(res => {
  let t = res.text.match(/季[积枳]+分[：:\s]*(\d+)/);
  if (!t)
    return null;
  return parseInt(t[1]);
}, 10, 1000);
let firstButton = null;
log(`赛季积分：${remainPoint}`);
if (remainPoint >= 100) {
  for (let i = 0; i < 100; ++i) {
    firstButton = firstSelector.findOne().parent().child(2);
    if (firstButton.text() != '抢光了')
      break;
    swipe(width / 2, height / 2, width / 2, height * 0.8, 500);
    sleep(random(2000, 3000));
  }
  if (firstButton.text() == '抢光了')
    exit();
  var threadClose = threads.start(() => {
    const closeSelector = text("关闭").depth(12);
    while (true) {
      closeSelector.waitFor();
      remainPoint -= 100;
      closeSelector.click();
      while (closeSelector.exists())
        sleep(300);
    }
  });
  while (remainPoint >= 100) {
    firstButton = firstSelector.findOne().parent().child(2);
    if (firstButton.text() == '抢光了') {
      log('抢光了');
      break;
    }
    firstButton.click();
    confirmSelector.click();
    while (confirmSelector.exists())
      sleep(300);
  }
  threadClose.interrupt();
}
for (let i = 0; i < 4; ++i) {
  back();
  sleep(500);
}
