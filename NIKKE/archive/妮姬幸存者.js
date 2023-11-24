/*
推荐白雪开局，技能树点满，刷出能量场后原地挂机
- 如果想一直往上走就改第6行，把4改成1
- 开不了技能修改第7行，把10改大一点，比如50
*/
let directionCnt = 4;
let thresh = 10;
let {
  getDisplaySize,
  requestScreenCaptureAuto,
  clickRect
} = require('./utils.js');
requestScreenCaptureAuto();
sleep(1000);

let startClicked = false;
let startTime = null;
let totalTime = 0;
let fullCnt = 0, totalCnt = 0;
let lastBurst = 0;
let randomArea = { bounds: null };
let canMove = false, isMoving = false, invincible = false;
let threadMove = threads.start(() => {
  let [w, h] = getDisplaySize();
  let ox = w / 2, oy = h * 0.2;
  let step = Math.max(w, h) * 0.3;
  let dx = [0, 1, 0, -1];
  let dy = [-1, 0, 1, 0];
  let i = 0;
  while (true) {
    if (!canMove || invincible) {
      sleep(1000);
      continue;
    }
    let ex = dx[i] * step + ox, ey = dy[i] * step + oy;
    ex = Math.min(w, Math.max(0, ex));
    ey = Math.min(h, Math.max(0, ey));
    isMoving = true;
    swipe(ox, oy, ex, ey, random(3000, 5000));
    isMoving = false;
    i = (i + 1) % directionCnt;
    sleep(100);
  }
})
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
  if (startClicked && startTime == null && res.text.includes('LEVEL')) {
    startTime = new Date();
    canMove = true;
    invincible = false;
  }
  let selectBtn = res.find(e =>
    e.text == 'SELECT' && e.bounds != null &&
    e.bounds.top > img.height / 2 && e.bounds.right >= img.width / 2
  )
  if (selectBtn) {
    selectBtn = res.toArray(3).toArray().filter(e =>
      e.text == 'SELECT' && e.bounds != null &&
      e.bounds.top > img.height / 2 && e.bounds.right >= img.width / 2
    );
    selectBtn = selectBtn.reduce((a, b) => {
      return a.bounds.top > b.bounds.top ? a : b
    });
    clickRect(selectBtn, 1, 0);
    startClicked = false;
    sleep(1000);
    continue;
  }
  let startBtn = res.find(e =>
    e.text.match(/(START|读取|继续)/) != null && e.bounds != null &&
    e.bounds.top > img.height / 2
  )
  if (startBtn) {
    clickRect(startBtn, 1, 0);
    sleep(1000);
    startTime = null;
    startClicked = true;
    continue;
  }
  let confirmBtn = res.find(e =>
    e.text == '确认' && e.bounds != null &&
    e.bounds.top > img.height / 2
  )
  if (confirmBtn) {
    clickRect(confirmBtn, 1, 0);
    if (startTime != null) {
      totalCnt++;
      let diffTime = new Date() - startTime;
      if (diffTime >= 180 * 1000) {
        fullCnt++;
        diffTime = 180 * 1000;
      }
      totalTime += diffTime;
      log(`坚持了${(diffTime / 1000).toFixed(2)}秒，累计${(totalTime / 1000 / 60).toFixed(2)}分钟，3分钟成功率${(fullCnt / totalCnt * 100).toFixed(2)}%（${fullCnt}/${totalCnt}）`);
      startTime = null;
      startClicked = false;
      canMove = false;
    }
    sleep(1000);
    continue;
  }
  if (res.text.includes('Lv')) {
    let oldCanMove = canMove;
    canMove = false;
    log(res.toArray(3).toArray().filter(e => e.text.includes('Lv')).map(x => x.text).join(', '));
    let priority = [
      /([量暈]场|[接按]近|近距离)/,
      /(飞镖|利刃)/,
      /(反射|紧急|即时|复[合台]|信号[增増]强)/,
      /([增増]强|移动)/,
      /(地雷|矮人)/,
    ]
    let goodBuff = null;
    if (!invincible)
      for (let p of priority) {
        goodBuff = res.find(e => e.text.match(p) != null);
        if (goodBuff != null)
          break;
      }
    if (goodBuff != null) {
      clickRect(goodBuff, 1, 0);
      if (goodBuff.text.match(priority[0]) != null)
        invincible = true;
    }
    else
      clickRect(randomArea, 1, 0);
    canMove = oldCanMove;
    sleep(1000);
    continue;
  }
  if (!invincible && startTime != null && new Date() - lastBurst >= 3000) {
    let oldCanMove = canMove;
    canMove = false;
    img = captureScreen();
    let burst = images.findColor(img, '#B41D4A', {
      region: [
        img.width * 0.7, img.height * 0.4,
        img.width * 0.3, img.height * 0.3
      ],
      threshold: thresh
    });
    if (burst) {
      while (isMoving)
        sleep(500);
      if (colors.isSimilar('#B41D4A', captureScreen().pixel(burst.x, burst.y), thresh)) {
        lastBurst = new Date();
        click(burst.x, burst.y);
      }
    }
    canMove = oldCanMove;
  }
  sleep(1000);
}
