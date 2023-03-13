const 手机锁屏密码 = '';
if (typeof module === 'undefined') {
  getOcrRes();
}
else {
  module.exports = {
    ocrUntilFound: ocrUntilFound,
    clickRect: clickRect,
    imgToBounds: imgToBounds,
    unlockIfNeed: unlockIfNeed,
    requestScreenCaptureAuto: requestScreenCaptureAuto,
    getOcrRes: getOcrRes,
    getDisplaySize: getDisplaySize,
    killApp: killApp,
    findImageByFeature: findImageByFeature
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
  toast('识别完成，可以退出查看日志');
}

function getDisplaySize(doNotForcePortrait) {
  let { width, height } = device;
  if (doNotForcePortrait)
    return [width, height]
  return [
    Math.min(width, height),
    Math.max(width, height)
  ];
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

function clickRect(rect, scale, delay) {
  if (delay === undefined)
    delay = 1000;
  sleep(delay);
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

// 参考：https://docs.opencv.org/3.4/d1/de0/tutorial_py_feature_homography.html
// trainImg：大图
// queryImg：小图
function findImageByFeature(trainImg, queryImg, options) {
  options = options || {};
  // 先尝试一次模板匹配
  let ret = images.findImage(trainImg, queryImg, options);
  if (ret != null)
    return imgToBounds(queryImg, ret);
  log('模板匹配失败，开始进行特征匹配');
  let grayImg1 = images.grayscale(queryImg);
  let grayImg2 = images.grayscale(trainImg);
  let clipImg = null;
  let beforeReturn = function () {
    grayImg1 && grayImg1.recycle();
    grayImg2 && grayImg2.recycle();
    clipImg && clipImg.recycle();
    log('特征匹配完成');
  };
  with (JavaImporter(
    org.opencv.core.Point,
    org.opencv.core.Scalar,
    org.opencv.core.Core,
    org.opencv.core.CvType,
    org.opencv.core.MatOfKeyPoint,
    org.opencv.core.MatOfDMatch,
    org.opencv.core.MatOfPoint2f,
    org.opencv.features2d.SIFT,
    org.opencv.features2d.BFMatcher,
    org.opencv.calib3d.Calib3d,
    com.stardust.autojs.core.opencv
  )) {
    const minMatchCount = options.minMatchCount || 4; // 至少为4
    let img1 = grayImg1.getMat(), img2 = grayImg2.getMat();
    if (options.region) {
      let x = options.region[0] === undefined ? 0 : options.region[0];
      let y = options.region[1] === undefined ? 0 : options.region[1];
      let w = options.region[2] === undefined ? grayImg2.width - x : options.region[2];
      let h = options.region[3] === undefined ? grayImg2.height - y : options.region[3];
      if (x < 0 || y < 0 || x + w > grayImg2.width || y + h > grayImg2.height) {
        throw new Error("out of region: region = [" + [x, y, w, h] + "], image.size = [" + [grayImg2.width, grayImg2.height] + "]");
      }
      clipImg = images.clip(grayImg2, x, y, w, h);
      img2 = clipImg.getMat();
    }
    // 1、SIFT算法提取特征
    let sift = SIFT.create();
    let kp1 = MatOfKeyPoint();
    let des1 = Mat();
    let kp2 = MatOfKeyPoint();
    let des2 = Mat();
    sift.detectAndCompute(img1, Mat(), kp1, des1);
    sift.detectAndCompute(img2, Mat(), kp2, des2);
    // 2、穷举找k近邻匹配
    let bf = BFMatcher();
    let matches = java.lang.reflect.Array.newInstance(MatOfDMatch, 0);
    matches = java.util.ArrayList(java.util.Arrays.asList(matches));
    bf.knnMatch(des1, des2, matches, 2);
    // 3、对匹配结果进行筛选，ratio test
    let srcPtsList = java.util.ArrayList(MatOfPoint2f().toList());
    let dstPtsList = java.util.ArrayList(MatOfPoint2f().toList());
    for (let m of matches) {
      let t = m.toArray();
      if (t[0].distance < 0.75 * t[1].distance) {
        srcPtsList.add(kp1.toArray()[t[0].queryIdx].pt);
        dstPtsList.add(kp2.toArray()[t[0].trainIdx].pt);
      }
    }
    if (srcPtsList.size() < minMatchCount) {
      log('特征匹配点数过少');
      beforeReturn();
      return null;
    }
    let srcPts = MatOfPoint2f();
    let dstPts = MatOfPoint2f();
    srcPts.fromList(srcPtsList);
    dstPts.fromList(dstPtsList);
    // 4、计算单应性矩阵
    let homoMat = Calib3d.findHomography(srcPts, dstPts, Calib3d.RANSAC, 5.0);
    // 5、根据homoMat计算透视变换
    let pts = Mat(4, 1, CvType.CV_32FC2);
    let dst = Mat(4, 1, CvType.CV_32FC2);
    let doubleArr = java.lang.reflect.Array.newInstance(java.lang.Double.TYPE, 2);
    doubleArr[0] = 0;
    doubleArr[1] = 0;
    pts.put(0, 0, doubleArr);
    doubleArr[1] = img1.height() - 1;
    pts.put(1, 0, doubleArr);
    doubleArr[0] = img1.width() - 1;
    pts.put(2, 0, doubleArr);
    doubleArr[1] = 0;
    pts.put(3, 0, doubleArr);
    Core.perspectiveTransform(pts, dst, homoMat);
    // 6、从dst中获得投影点，并转化为Rect
    let ptsArr = [];
    for (let i = 0; i < dst.rows(); ++i) {
      let [x, y] = dst.get(i, 0);
      ptsArr.push(Point(x, y))
    }
    let bounds = android.graphics.Rect();
    pts = [MatOfPoint()];
    pts[0].fromArray(ptsArr);
    ptsArr.sort((a, b) => a.x - b.x);
    bounds.left = Math.round((ptsArr[0].x + ptsArr[1].x) / 2);
    bounds.right = Math.round((ptsArr[2].x + ptsArr[3].x) / 2);
    ptsArr.sort((a, b) => a.y - b.y);
    bounds.top = Math.round((ptsArr[0].y + ptsArr[1].y) / 2);
    bounds.bottom = Math.round((ptsArr[2].y + ptsArr[3].y) / 2);
    if (storages.create("NIKKEconfig").get('debug', false)) {
      with (JavaImporter(org.opencv.imgproc.Imgproc)) {
        Imgproc.polylines(img2, pts, true, Scalar(0), 3, Imgproc.LINE_AA);
        ptsArr[0] = Point(bounds.left, bounds.top);
        ptsArr[1] = Point(bounds.left, bounds.bottom);
        ptsArr[2] = Point(bounds.right, bounds.bottom);
        ptsArr[3] = Point(bounds.right, bounds.top);
        pts[0].fromArray(ptsArr);
        Imgproc.polylines(img2, pts, true, Scalar(255), 3, Imgproc.LINE_AA);
        let filename = files.path(`./images/nikkerror/${Date.now()}.jpg`);
        images.save(images.matToImage(img2), filename);
        log(`特征匹配截图已保存到${filename}`);
      }
    }
    if (options.region) {
      bounds.left += options.region[0];
      bounds.right += options.region[0];
      bounds.top += options.region[1];
      bounds.bottom += options.region[1];
    }
    beforeReturn();
    return { bounds: bounds };
  }
}

function killApp(packageName) {
  var name = getPackageName(packageName);
  if (!name) {
    if (getAppName(packageName)) {
      name = packageName;
    } else {
      return false;
    }
  }
  app.openAppSetting(name);
  while (text(app.getAppName(name)).findOne(2000) == null) {
    back();
    app.openAppSetting(name);
  }
  let is_sure = textMatches(/[强行停止结束]{2,}/).findOne();
  if (is_sure.enabled()) {
    is_sure.click();
    sleep(1000);
    textMatches(/(确定|[强行停止结束]{2,})/).click();
    log(app.getAppName(name) + "应用已被关闭");
    sleep(1000);
    back();
  } else {
    log(app.getAppName(name) + "应用不能被正常关闭或不在后台运行");
    back();
  }
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
  enterPwd(手机锁屏密码 || storages.create('general').get('lockCode', ''));

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
      let t = packageName('com.android.systemui').textMatches(/(允许|立即开始)/).findOne(10000);
      if (t != null)
        t.click();
      else
        log('没有“允许”或“立即开始”按钮出现');
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
