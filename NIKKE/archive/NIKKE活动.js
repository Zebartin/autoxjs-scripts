var { 启动NIKKE, 退出NIKKE, 返回首页 } = require('./NIKKEutils.js');
var { 日常 } = require('./NIKKE日常.js');
var {
  unlockIfNeed,
  requestScreenCaptureAuto,
  ocrUntilFound,
  clickRect
} = require('./utils.js');
var { width, height } = device;

auto.waitFor();
unlockIfNeed();
requestScreenCaptureAuto();
try {
  启动NIKKE();
  日常();
  进入活动();
  刷关(9, 10);
} catch(error) {
  log(error);
  log(error.stack);
} finally {
  退出NIKKE();
}
exit();

function 进入活动() {
  clickRect(ocrUntilFound(res => res.find(e => e.text.startsWith('OUTSIDER')), 10, 3000));
  clickRect(ocrUntilFound(res => res.find(e => e.text.startsWith('HERE')), 10, 3000));
}

function 刷关(eventId, eventCntOnScreen) {
  // 刷1-eventId，eventId可以取最后一关以外的数字
  ocrUntilFound(res => res.find(e => e.text.includes('EVENT')), 20, 3000);
  var target = ocrUntilFound(res => res.find(e => e.text.match(/hard/i) != null), 5, 300);
  // 困难已开放
  if (target != null) {
    clickRect(target);
    sleep(1000);
  }
  // checkAccess(e => e.text.match(/^S[OQ]L/i) != null && e.level == 1);
  // 滑到最顶
  swipe(width / 2, height * 0.4, width / 2, height * 0.8, 500);
  sleep(1000);
  target = ocrUntilFound(res => {
    let ret = res.filter(e => e.text.includes('EVENT') && e.level == 1);
    if (ret.length == eventCntOnScreen)
      return ret;
    return null;
  }, 30, 200);
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
  if (ocrUntilFound(e => e.text.includes('EVENT'), 5, 500) == null) {
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
    ocrUntilFound(e => e.text.includes('EVENT'), 50, 5000);
    sleep(500);
  }
  back();
  ocrUntilFound(e => e.text.includes('HERE'), 50, 5000);
  返回首页();
}
function checkAccess(clearCond) {
  var ocrRes = ocrUntilFound(res => {
    if (res.text.includes('EVENT'))
      return res;
    return null;
  }, 10, 3000);
  var events = ocrRes.filter(e => e.text.includes('EVENT') && e.level == 1);
  var clears = ocrRes.filter(clearCond);
  if (events.length == clears.length) {
    swipe(width / 2, height * 0.8, width / 2, height * 0.4, 500);
    sleep(1000);
    ocrRes = ocrUntilFound(res => res, 1, 1);
    events = ocrRes.filter(e => e.text.includes('EVENT') && e.level == 1);
    clears = ocrRes.filter(clearCond);
  }
  log(`EVENT数量：${events.length}`);
  log(`已通关数量：${clears.length}`);
  if (events.length <= clears.length)
    return;
  clickRect(events[events.length - 1]);
  var enterCombatBtn = ocrUntilFound(res => res.find(
    e => e.text.endsWith('战斗')
  ), 5, 3000);
  if (enterCombatBtn == null)
    return;
  clickRect(enterCombatBtn);
  log('进入战斗');
  sleep(1000);
  if (ocrUntilFound(e => e.text.includes('EVENT'), 5, 500) != null)
    return;
  var skipBtn = null;
  var nextBtn = null;
  while (true) {
    for (let i = 0; i < 2; ++i){
      skipBtn = ocrUntilFound(res => res.find(e =>
        e.text.match(/[LAUTOG]/) == null && e.text.match(/SK.P/) != null
      ), 10, 1000);
      if (skipBtn != null){
        clickRect(skipBtn);
        sleep(1000);
      }
    }
    sleep(20 * 1000);
    ocrUntilFound(res => res.text.includes('REWARD'), 30, 5000);
    nextBtn = ocrUntilFound(res => res.find(
      e => e.text.match(/下[^步方法]{2}/) != null
    ), 100, 100);
    sleep(1000);
    if (colors.blue(captureScreen().pixel(nextBtn.bounds.left, nextBtn.bounds.top)) < 200){
      click(width / 2, height / 2);
      break;
    }
    clickRect(nextBtn);
  }
}