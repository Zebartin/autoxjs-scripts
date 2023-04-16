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
    rgbToGray: rgbToGray,
    buildRegion: buildRegion,
    findContoursRect: findContoursRect,
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
  if (width == 0) {
    console.warn('AutoX.js获取到的设备尺寸为0，可能会影响正常运行，可以尝试重启设备');
    let metrics = context.getResources().getDisplayMetrics();
    width = metrics.widthPixels;
    height = metrics.heightPixels;
  }
  if (doNotForcePortrait)
    return [width, height]
  return [
    Math.min(width, height),
    Math.max(width, height)
  ];
}

/*
options:
- maxScale: 最大放大系数，默认1
- gray: 是否灰度化处理后再OCR，默认false
*/
function ocrUntilFound(found, retry, interval, options) {
  options = options || {};
  maxScale = options.maxScale || 1;
  gray = (options.gray === true);
  let scaleBack = function (x, scale) {
    if (!x.bounds)
      return;
    x.bounds.left /= scale;
    x.bounds.right /= scale;
    x.bounds.top /= scale;
    x.bounds.bottom /= scale;
  };
  for (let i = 0; i < retry; ++i) {
    sleep(interval);
    let scale = (i % maxScale) + 1;
    let img = captureScreen();
    if (gray) {
      let newImg = images.grayscale(img);
      img && img.recycle();
      img = newImg;
    }
    if (scale > 1) {
      log(`OCR：尝试放大${scale}倍`);
      let newImg = images.scale(img, scale, scale, 'CUBIC');
      img && img.recycle();
      img = newImg;
    }
    let res = found(gmlkit.ocr(img, "zh"), img);
    img && img.recycle();
    if (res || res === 0) {
      if (scale > 1) {
        if (Array.isArray(res)) {
          for (let j = 0; j < res.length; ++j)
            scaleBack(res[j], scale);
        } else
          scaleBack(res, scale);
      }
      return res;
    }
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

// 灰度公式：https://docs.opencv.org/3.4/de/d25/imgproc_color_conversions.html#color_convert_rgb_gray
function rgbToGray(color) {
  let ret = 0.299 * colors.red(color);
  ret += 0.587 * colors.green(color);
  ret += 0.114 * colors.blue(color);
  return ret;
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

function buildRegion(region, img) {
  region = region || [];
  let x = region[0] === undefined ? 0 : region[0];
  let y = region[1] === undefined ? 0 : region[1];
  let w = region[2] === undefined ? img.getWidth() - x : region[2];
  let h = region[3] === undefined ? (img.getHeight() - y) : region[3];
  if (x < 0 || y < 0 || x + w > img.width || y + h > img.height)
    throw new Error("out of region: region = [" + [x, y, w, h] + "], image.size = [" + [img.width, img.height] + "]");
  return [x, y, w, h];
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
      let [x, y, w, h] = buildRegion(options.region, grayImg2);
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
      if (t.length < 2)
        continue;
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
    try {
      Core.perspectiveTransform(pts, dst, homoMat);
    } catch (error) {
      log(error);
      beforeReturn();
      return null;
    }
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

function findContoursRect(img, options) {
  options = options || {};
  let thresh = options.thresh || 160;
  let [x, y, w, h] = buildRegion(options.region, img);
  let clipImg = images.clip(img, x, y, w, h);
  let grayImg = images.cvtColor(clipImg, "BGR2GRAY");
  let threImg = images.threshold(grayImg, thresh, 255, options.type || "BINARY_INV");
  let ret = [];
  with (JavaImporter(
    org.opencv.imgproc.Imgproc,
    com.stardust.autojs.core.opencv,
    org.opencv.core.Core,
    org.opencv.core.Point,
    org.opencv.core.MatOfPoint2f,
    org.opencv.core.Scalar,
    com.stardust.autojs.core.opencv.Mat
  )) {
    let threImgMat = threImg.getMat();
    let contours = java.lang.reflect.Array.newInstance(MatOfPoint, 0);
    contours = java.util.ArrayList(java.util.Arrays.asList(contours));
    Imgproc.findContours(threImgMat, contours, Mat(), Imgproc.RETR_EXTERNAL, Imgproc.CHAIN_APPROX_SIMPLE);
    for (let i = 0; i < contours.size(); ++i) {
      let contour2f = MatOfPoint2f(contours.get(i).toArray());
      let epsilon = Imgproc.arcLength(contour2f, true) * 0.01;
      let approxCurve = MatOfPoint2f();
      Imgproc.approxPolyDP(contour2f, approxCurve, epsilon, true);
      let pts = MatOfPoint(approxCurve.toArray());
      let rect = Imgproc.boundingRect(pts);
      let newRect = android.graphics.Rect(
        rect.x + x,
        rect.y + y,
        rect.x + rect.width + x,
        rect.y + rect.height + y
      );
      if (options.rectFilter && !options.rectFilter(newRect))
        continue;
      ret.push(newRect);
      if (options.debug)
        Imgproc.rectangle(threImgMat, Point(rect.x, rect.y), Point(rect.x + rect.width, rect.y + rect.height), Scalar(150), 3);
    }
    if (options.debug)
      images.save(images.matToImage(threImgMat), `./images/nikkerror/${thresh}_${new Date().toTimeString().split(' ')[0].replace(/:/g, '_')}.jpg`);
  }
  threImg.recycle();
  grayImg.recycle();
  clipImg.recycle();
  ret.sort((a, b) => {
    let t = a.top - b.top;
    if (Math.abs(t) < 20)
      return a.left - b.left;
    return t;
  });
  return ret;
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
