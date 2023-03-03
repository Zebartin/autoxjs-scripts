const 手机锁屏密码 = '手机锁屏密码';
if (typeof module === 'undefined') {
  getOcrRes();
  toast('识别完成，可以退出查看日志');
}
else {
  module.exports = {
    ocrUntilFound: ocrUntilFound,
    clickRect: clickRect,
    imgToBounds: imgToBounds,
    unlockIfNeed: unlockIfNeed,
    requestScreenCaptureAuto: requestScreenCaptureAuto,
    getOcrRes: getOcrRes,
    getDisplaySize: getDisplaySize
  };
}


function getOcrRes() {
  requestScreenCaptureAuto();
  sleep(3000);
  ocrUntilFound(res => {
    for (let i of res.children) {
      log(i.text);
      log(i.bounds);
    }
    return true;
  }, 1, 1);
}

function getDisplaySize() {
  let metrics = context.getResources().getDisplayMetrics();
  return [metrics.widthPixels, metrics.heightPixels];
}

function ocrUntilFound(found, retry, interval) {
  var res;
  for (let i = 0; i < retry; ++i) {
    sleep(interval);
    // log('OCR中');
    res = found(gmlkit.ocr(captureScreen(), "zh"))
    if (res || res === 0)
      return res;
  }
  console.trace("OCR失败");
  return null;
}

function clickRect(rect, scale) {
  sleep(1000);
  if (rect.text)
    log(`点击"${rect.text}"`);
  // 按一定比例将范围缩小在中央位置
  // 0 < scale <= 1, 越小表示越集中于中间
  scale = scale || 0.8;
  let x = Math.round((random() - 0.5) * rect.bounds.width() * scale + rect.bounds.centerX());
  let y = Math.round((random() - 0.5) * rect.bounds.height() * scale + rect.bounds.centerY());
  click(x, y);
}

function imgToBounds(img, point) {
  if (!img || !point)
    return null;
  let ret = new android.graphics.Rect();
  ret.left = point.x;
  ret.top = point.y;
  ret.right = point.x + img.getWidth();
  ret.bottom = point.y + img.getHeight();
  return { bounds: ret };
}

/**
 * 解锁屏幕
 */
function unlockIfNeed() {
  if (!device.isScreenOn()) {
    device.wakeUp();
    sleep(1000);
    let [width, height] = getDisplaySize();
    swipe(width / 2, height * 0.8, width / 2, 0, 500);
  }
  if (!isLocked()) {
    log("没有锁屏无需解锁");
    return;
  }
  enterPwd(手机锁屏密码);

  log("解锁完毕");
}
/**
 * 手机是否锁屏
 */
function isLocked() {
  var km = context.getSystemService(android.content.Context.KEYGUARD_SERVICE);
  return km.isKeyguardLocked() && km.isKeyguardSecure();
}
function enterPwd(pwd) {
  //点击
  if (text(0).clickable(true).exists()) {
    for (var i = 0; i < pwd.length; i++) {
      a = pwd.charAt(i)
      sleep(200);
      text(a).clickable(true).findOne().click()
    }
  } else {
    for (var i = 0; i < pwd.length; i++) {
      a = pwd.charAt(i)
      sleep(200);
      desc(a).clickable(true).findOne().click()
    }
  }
}

function requestScreenCaptureAuto() {
  //安卓版本高于Android 9
  if (device.sdkInt > 28) {
    //等待截屏权限申请并同意
    threads.start(function () {
      packageName('com.android.systemui').textMatches(/(允许|立即开始)/).findOne(10000).click();
    });
  }
  // 检查屏幕方向
  let orientation = context.getResources().getConfiguration().orientation;
  let isLandscape = (orientation == android.content.res.Configuration.ORIENTATION_LANDSCAPE);
  let isTablet = (device.width > device.height);    // 平板横边 > 竖边
  log(`申请截屏权限：${isLandscape ? '横' : '竖'}屏，设备类型：${isTablet ? '平板' : '手机'}`);
  if (!requestScreenCapture((isLandscape ^ isTablet) == 1)) {
    log("请求截图失败");
    exit();
  }
}
