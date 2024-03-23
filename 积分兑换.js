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
clickRect(ocrUntilFound(res => res.find(e => e.text.match(/(分[商高])/) != null), 10, 700));

let targetName = '【超特惠】';
let costPoint = 100;
let hourNow = new Date().getHours();
if (hourNow == 9 || hourNow == 10) {
  targetName = '【特惠】';
  costPoint = 300;
}
const firstSelector = className("android.widget.TextView").textContains(targetName);
const confirmSelector = className("android.widget.TextView").textEndsWith(`${costPoint} 积分兑换`).depth(14);
firstSelector.waitFor();
const matched = textStartsWith('赛季积分').findOne().text().match(/季[积枳]+分[：:\s]*(\d+)/);
const remainPoint = matched ? parseInt(matched[1]) : 0;
log(`赛季积分：${remainPoint}`);

let firstButton = null;
if (remainPoint >= costPoint) {
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
    const closeSelector = text("关闭").depth(13);
    while (true) {
      closeSelector.waitFor();
      remainPoint -= costPoint;
      closeSelector.click();
      while (closeSelector.exists())
        sleep(100);
    }
  });
  while (remainPoint >= costPoint) {
    firstButton = firstSelector.findOne().parent().child(2);
    if (firstButton.text() == '抢光了') {
      log('抢光了');
      break;
    }
    firstButton.click();
    confirmSelector.click();
    while (confirmSelector.exists())
      sleep(100);
  }
  threadClose.interrupt();
}
for (let i = 0; i < 4; ++i) {
  back();
  sleep(500);
}
if (images.stopScreenCapturer) {
  images.stopScreenCapturer();
}
