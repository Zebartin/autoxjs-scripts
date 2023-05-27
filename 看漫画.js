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
  return res.find(e => e.text.includes('前') && e.bounds != null && e.bounds.bottom > height * 0.4);
}, 20, 1000);
// 先进一次消除签到板
clickRect(giftCenter);
text('去阅读').waitFor();
sleep(1000);
let order = [0, 1, 2, 3, 4];
shuffle(order);
for (let index of order) {
  let allBooks = text('去阅读').find().map(x => x.parent());
  let book = allBooks[index];
  log(book.child(1).text())
  if (book.findOne(textContains('已获得')) != null) {
    log('已读');
    continue;
  }
  book.child(3).click();
  readBook();
}
for (let i = 0; i < 4; i++) {
  back();
  sleep(500);
}
exit();

function shuffle(array) {
  let currentIndex = array.length, temporaryValue, randomIndex;

  while (currentIndex !== 0) {
    // 选择一个剩余元素（currentIndex减小）
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // 将选中的元素与当前元素交换
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function readBook() {
  // 等待加载，点击屏幕中央消去头尾的导航栏
  ocrUntilFound(res => {
    if (res.text.match(/[送条]弹[慕幕募]/) != null) {
      click(width / 2, height / 2);
      sleep(1000);
      return true;
    } else if (res.text.includes("重试")) {
      clickRect(res.find(e => e.text == '重试'));
      // } else if (res.text.match(/(该话.有.容|不支持|视频|免费|购买)/) != null) {
      //   back();
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
    // 连按退出
    while (true) {
      back();
      if (text('去阅读').findOne(2000) != null)
        break;
    }
  });
  // 5分钟后终止threadRead
  threads.start(() => {
    setTimeout(() => {
      timeEnough = true;
    }, 5 * 60 * 1000 + 1000);
  });
  threadRead.join();
}