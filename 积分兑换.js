auto.waitFor();
var {
  unlockIfNeed,
  requestScreenCaptureAuto,
  ocrUntilFound,
  clickRect
} = require('./utils.js');
var { width, height } = device;
unlockIfNeed();
requestScreenCaptureAuto();
app.launchApp('哔哩哔哩漫画');
// 找到“我的”按钮
var myBtn = ocrUntilFound(res => res.find(e =>
  e.text == '我的' && e.bounds.top > height * 0.8
), 20, 3000);
sleep(2000);
back();
clickRect(myBtn);
// 点击“福利中心”
ocrUntilFound(res => res.text.includes('活动中心'), 20, 1000);
clickRect(ocrUntilFound(res => res.find(e => e.text.includes('分商')), 20, 1000));

const firstSelector = className("android.view.View").text("积分兑换");
const confirmSelector = className("android.view.View").textEndsWith("100 积分兑换").depth(13);
firstSelector.waitFor();

let cnt = 0;
let ocrResult = gmlkit.ocr(images.captureScreen(), 'zh');
let firstButton = null;
let remainPoint = ocrResult.text.match(/季[积枳]+分[：:\s]*(\d+)/);
remainPoint = parseInt(remainPoint[1]);
log(`赛季积分：${remainPoint}`);
while(true) {
  firstButton = firstSelector.findOne().parent().child(2);
  if (firstButton.text()!='抢光了')
    break;
  swipe(width/2, height/2, width/2, height*0.8,500);
  sleep(random(1000, 3000));
}
var threadClose = threads.start(()=>{
  const closeSelector = text("关闭").depth(12);
  while(true){
    closeSelector.waitFor();
    remainPoint -= 100;
    log('抢到了');
    closeSelector.click();
    while(closeSelector.exists())
      sleep(300);
  }
});
while (remainPoint >= 100){
  firstButton = firstSelector.findOne().parent().child(2);
  if (firstButton.text()=='抢光了'){
    log('抢光了');
    break;
  }
  firstButton.click();
  confirmSelector.click();
  while(confirmSelector.exists())
    sleep(300);
  log(`第${++cnt}次`);
}
threadClose.interrupt();