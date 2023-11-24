/*
自动处理：
- 进入战斗
- 跳过剧情
- 战斗成功/失败
*/
let {
  requestScreenCaptureAuto,
  clickRect
} = require('./utils.js');
requestScreenCaptureAuto();
sleep(1000);
半自动();
function 半自动() {
  let randomArea = { bounds: null };
  let combatCnt = 0;
  while (true) {
    let img = captureScreen();
    let res = gmlkit.ocr(img, 'zh');
    if (randomArea.bounds === null) {
      randomArea.bounds = new android.graphics.Rect();
      randomArea.bounds.left = img.width * 0.1;
      randomArea.bounds.right = img.width * 0.9;
      randomArea.bounds.top = img.height * 0.4;
      randomArea.bounds.bottom = img.height * 0.6;
    }
    let backBtn = res.find(e =>
      e.text.includes('返回') && e.bounds != null &&
      e.bounds.bottom > img.height * 0.7 && e.bounds.right <= img.width / 2
    );
    if (backBtn) {
      if (res.text.match(/FA.LED/) != null) {
        log('Combat Failed');
        clickRect(backBtn, 1, 0);
      }
      sleep(2000);
      continue;
    }
    let enterCombat = res.find(e =>
      e.text.includes('入战') && e.bounds != null &&
      e.bounds.bottom > img.height * 0.7 && e.bounds.left >= img.width / 2
    );
    if (enterCombat) {
      clickRect(enterCombat, 1, 0);
      combatCnt = 0;
      sleep(2000);
      continue;
    }
    let autoBtn = res.find(e => e.text.includes('AUT'));
    if (autoBtn && autoBtn.bounds.right < img.width / 2) {
      if (combatCnt == 0)
        log('In Combat');
      sleep(7000);
      combatCnt = (combatCnt + 1) % 5;
      continue;
    }
    if (autoBtn) {
      let skipBtn = res.find(e =>
        e.text.match(/[LAUTOG]/) == null && e.text.match(/SK.P/) != null
      );
      if (skipBtn != null) {
        clickRect(skipBtn, 0.1, 0);
        sleep(1000);
        continue;
      }
      else {
        clickRect(randomArea, 1, 0);
        sleep(1000);
        continue;
      }
    }
    let reward = res.find(e => e.text.match(/REWARD/) != null);
    if (reward) {
      log('Combat Win');
      clickRect(randomArea, 1, 0);
      sleep(2000);
      continue;
    }
    sleep(500);
  }
}