if (typeof module === 'undefined') {
  requestScreenCaptureAuto();
  getOcrRes();
}
else {
  module.exports = {
    ocrUntilFound: ocrUntilFound,
    clickRect: clickRect,
    unlockIfNeed: unlockIfNeed,
    requestScreenCaptureAuto: requestScreenCaptureAuto,
    getOcrRes: getOcrRes
  };
}


function getOcrRes() {
  sleep(5000);
  ocrUntilFound(res => {
    for (let i of res.children) {
      log(i.text);
      log(i.bounds);
    }
    return true;
  }, 1, 1);
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
function clickRect(rect) {
  sleep(1000);
  click(rect.bounds.centerX(), rect.bounds.centerY());
}
/**
 * 解锁屏幕
 */
function unlockIfNeed() {
  if (!device.isScreenOn()) {
    device.wakeUp();
    sleep(1000);
    const { width, height } = device;
    swipe(width / 2, height * 0.8, width / 2, 0, 500);
  }
  if (!isLocked()) {
    log("没有锁屏无需解锁");
    return;
  }
  enterPwd('手机锁屏密码');

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
      packageName('com.android.systemui').text('允许').waitFor();
      text('允许').click();
    });
  }
  //申请截屏权限
  if (!requestScreenCapture()) {
    log("请求截图失败");
    exit();
  }
}
