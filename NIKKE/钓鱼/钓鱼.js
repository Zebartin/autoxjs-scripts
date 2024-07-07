// 模拟器：720x1280
// 在活动页面位置处开始脚本
// 开始前需要保证“钓鱼图鉴”出现在活动页面右上角，如果没有可以去岛屿探险里看一眼再出来
// 卡顿时表现很差
// 视情况酌情调整以下数字

// 窗口宽度：预判窗口，宽度越大表示提前考虑得越多
// 感觉点快了就调小，点慢了可以调大一点
const 窗口宽度 = 150;
// 甩杆延迟：识别到甩杆图标后，延迟X毫秒再点击
const 甩杆延迟 = 900;

// const 提前结束 = 4600;

importPackage(org.opencv.core);
importPackage(org.opencv.imgproc);
requestScreenCaptureAuto();

// mnt/shared/Pictures/xxx/
const 图鉴 = {
    text: '图鉴',
    point: [630, 400],
    image: images.read('./images/图鉴.png')
};
const 图鉴内页 = {
    text: '图鉴内页',
    point: [35, 950],
    image: images.read('./images/图鉴内页.png')
};
const 立即前往 = {
    text: '立即前往',
    region: [150, 500],
    image: images.read('./images/立即前往.png')
};
const 钓鱼入口 = {
    text: '钓鱼入口',
    region: [0, 400, 720, 370],
    image: images.read('./images/钓鱼入口.png')
};
const 开始钓鱼1 = {
    text: '开始钓鱼1',
    point: [280, 1050],
    image: images.read('./images/开始钓鱼1.png')
};
const 开始钓鱼2 = {
    text: '开始钓鱼2',
    point: [290, 1040],
    image: images.read('./images/开始钓鱼2.png')
};
const 甩杆 = {
    text: '甩杆',
    point: [540, 1080],
    image: images.read('./images/甩杆.png')
};
const 剩余时间 = {
    text: '剩余时间',
    point: [310, 80],
    image: images.read('./images/剩余时间.png')
};
const 确认 = {
    text: '确认',
    region: [250, 760],
    image: images.read('./images/确认.png')
};
const 结束 = {
    text: '结束',
    point: [465, 780],
    image: images.read('./images/结束.png')
};
const 暂停 = {
    text: '暂停',
    point: [600, 70],
    image: images.read('./images/暂停.png')
};
const 左 = {
    text: '左',
    region: [0, 0],
    image: images.read('./images/左.png')
};
const 右 = {
    text: '右',
    region: [0, 0],
    image: images.read('./images/右.png')
};
const 上 = {
    text: '上',
    region: [0, 0],
    image: images.read('./images/上.png')
};
const 下 = {
    text: '下',
    region: [0, 0],
    image: images.read('./images/下.png')
};

let image, screenMat;

image = captureScreen();
if (image.width != 720 || image.height != 1280) {
    console.error('模拟器分辨率不是720x1280');
    if (images.stopScreenCapturer) {
        images.stopScreenCapturer();
    }
    exit();
}
// init opencv
let t = images.grayscale(image);
t.recycle();

for (let b of [左, 右, 上, 下]) {
    let channels = new java.util.ArrayList();
    Core.split(b.image.getMat(), channels);
    b.image.recycle();
    channels[0].release();
    channels[2].release();
    b.image = channels[1];
}

threads.start(leftright);
threads.start(updown);
try {
    main();
} catch (error) {
    if (!error.message.includes('InterruptedException'))
        log(error);
} finally {
    threads.shutDownAll();
    for (let button of [
        图鉴, 图鉴内页, 立即前往,
        钓鱼入口, 开始钓鱼1, 开始钓鱼2,
        甩杆, 剩余时间, 确认, 结束, 暂停
    ]) {
        button.image.recycle();
    }
    for (let button of [左, 右, 上, 下]) {
        button.image.release();
    }
    if (images.stopScreenCapturer) {
        images.stopScreenCapturer();
    }
    log('done');
    exit();
}
function main() {
    while (true) {
        sleep(30);
        image = images.captureScreen();
        screenMat && screenMat.release();
        screenMat = null;
        if (match(image, 结束, 500)) {
            clickRect(结束, 1, 0);
            continue;
        }
        if (match(image, 甩杆)) {
            clickRect(甩杆, 1, 甩杆延迟);
            sleep(1000);
            continue;
        }
        if (match(image, 确认)) {
            clickRect(确认, 1, 0);
            continue;
        }
        if (match(image, 剩余时间, 0)) {
            // if (match(image, 暂停, 0)) {
            //     if (mayFail(image)) {
            //         clickRect(暂停, 1, 0);
            //         sleep(500);
            //         continue;
            //     }
            // }
            let cropped = images.clip(image, 660 - 窗口宽度, 300, 窗口宽度, 90);
            let channels = new java.util.ArrayList();
            Core.split(cropped.getMat(), channels);
            cropped.recycle();
            screenMat = channels[1];
            continue;
        }
        if (match(image, 钓鱼入口, 1000, 0, 0.6)) {
            clickRect(钓鱼入口, 0.5, 0);
            sleep(1000);
            continue;
        }
        if (match(image, 开始钓鱼1, 1000, 0, 0.6)) {
            clickRect(开始钓鱼1, 1, 0);
            continue;
        }
        if (match(image, 开始钓鱼2)) {
            clickRect(开始钓鱼2, 1, 0);
            continue;
        }
        if (match(image, 图鉴, 3000) && findNext()) {
            continue;
        }
    }
}
function leftright() {
    const leftBtn = {
        text: '左',
        bounds: new android.graphics.Rect(140, 1030, 220, 1110)
    };
    const rightBtn = {
        text: '右',
        bounds: new android.graphics.Rect(500, 1030, 580, 1110)
    };
    while (true) {
        sleep(10);
        if (matchTemplateJava(screenMat, 左.image, 0.6)) {
            clickRect(leftBtn, 1, 0);
            continue;
        }
        if (matchTemplateJava(screenMat, 右.image, 0.6)) {
            clickRect(rightBtn, 1, 0);
            continue;
        }
    }
}
function updown() {
    const upBtn = {
        text: '上',
        bounds: new android.graphics.Rect(320, 930, 400, 1010)
    };
    const downBtn = {
        text: '下',
        bounds: new android.graphics.Rect(320, 1130, 400, 1210)
    };
    while (true) {
        sleep(10);
        if (matchTemplateJava(screenMat, 上.image, 0.6)) {
            clickRect(upBtn, 1, 0);
            continue;
        }
        if (matchTemplateJava(screenMat, 下.image, 0.6)) {
            clickRect(downBtn, 1, 0);
            continue;
        }
    }
}
function mayFail(img) {
    let cropped = images.clip(img, 570, 175, 90, 70);
    let count = imageColorCount(cropped, '#414230', 170);
    log(count);
    if (count < 提前结束) {
        images.save(img, `/mnt/shared/Pictures/debug/${Date.now()}.png`)
        images.save(cropped, `/mnt/shared/Pictures/debug/${Date.now()}c.png`)
    }
    cropped.recycle();
    return count < 提前结束;
}
function findNext() {
    const 图鉴随机区域 = {
        text: '图鉴随机区域',
        bounds: new android.graphics.Rect(190, 390, 610, 930),
    };
    let i = 0;
    for (i = 0; i < 300; ++i) {
        sleep(30);
        image = images.captureScreen();
        if (match(image, 图鉴内页)) {
            break;
        }
        if (match(image, 图鉴, 1000)) {
            clickRect(图鉴, 1, 0);
            continue;
        }
    }
    if (i == 300)
        return false;
    for (i = 0; i < 20; ++i) {
        if (i != 0)
            sleep(1000);
        image = images.captureScreen();
        if (match(image, 立即前往, 1000, 0, 0.6)) {
            clickRect(立即前往, 1, 0);
            sleep(2000);
            continue;
        }
        if (match(image, 图鉴内页, 1000)) {
            clickRect(图鉴随机区域, 1, 0);
            continue;
        }
        if (match(image, 钓鱼入口, 500, 0, 0.6)) {
            钓鱼入口.lastMatched = 0;
            return true;
        }
    }
    if (i >= 20)
        return false;
}
function match(img, button, interval, offset, threshold) {
    if (interval === undefined) {
        interval = 1000;
    }
    if (button.lastMatched && Date.now() - button.lastMatched < interval) {
        return false;
    }
    let region = button.region;
    if (!region) {
        offset = offset || 20;
        region = button.point.slice();
        region.push(button.image.width + 2 * offset);
        region.push(button.image.height + 2 * offset);
        region[2] = Math.min(region[2], img.width - region[0]);
        region[3] = Math.min(region[3], img.height - region[1]);
    }
    const result = images.findImage(img, button.image, {
        region: region,
        threshold: threshold || 0.9
    });
    // log(`${button.text}: ${result}`);
    if (result != null) {
        button.lastMatched = Date.now();
        button.bounds = imgToBounds(button.image, result).bounds;
        return true;
    }
    return false;
}

function matchTemplateJava(image, templ, threshold) {
    if (image == null)
        return false;
    // log(image);
    // log(templ);
    threshold = threshold || 0.75;
    const cols = image.cols() - templ.cols() + 1;
    const rows = image.rows() - templ.rows() + 1;
    let result;
    try {
        result = new Mat(rows, cols, CvType.CV_32FC1);
        Imgproc.matchTemplate(image, templ, result, Imgproc.TM_CCOEFF_NORMED);
    } catch (error) {
        result && result.release();
        return false;
    }
    let mmr = Core.minMaxLoc(result);
    result && result.release();
    const maxVal = mmr.maxVal;
    // log(maxVal);
    if (maxVal < threshold)
        return false;
    return true;
}

function colorToRGB(color) {
    let r, g, b;
    if (Array.isArray(color)) {
        r = color[0];
        g = color[1];
        b = color[2];
    } else if (typeof color === 'string' || typeof color === 'number') {
        r = colors.red(color);
        g = colors.green(color);
        b = colors.blue(color);
    } else {
        throw new Error(`Invalid color: ${color}`);
    }
    return [r, g, b];
}
function imageColorCount(image, color, threshold) {
    importPackage(org.opencv.core);
    let mat = image.getMat();
    let diff = new Mat();
    let channels = new java.util.ArrayList();
    let maxDiff = new Mat();
    let mask = new Mat();
    let [r, g, b] = colorToRGB(color);
    Core.absdiff(mat, new Scalar(r, g, b), diff);
    Core.split(diff, channels);
    Core.max(channels[0], channels[1], maxDiff);
    Core.max(channels[2], maxDiff, maxDiff);
    Core.subtract(new Mat(new Size(maxDiff.cols(), maxDiff.rows()), CvType.CV_8UC1, new Scalar(255)), maxDiff, mask);

    Core.inRange(mask, new Scalar(threshold), new Scalar(255), mask);
    let inRangeCount = Core.countNonZero(mask);
    return inRangeCount;
}

function clickRect(rect, scale, delay) {
    // delay可能是0
    if (delay === undefined)
        delay = 1000;
    sleep(delay);
    let logText = '';
    if (rect.text)
        logText += `"${rect.text}" @ `;
    // 按一定比例将范围缩小在中央位置
    // 0 < scale <= 1, 越小表示越集中于中间
    scale = scale || 0.8;
    let x = Math.round((random() - 0.5) * rect.bounds.width() * scale + rect.bounds.centerX());
    let y = Math.round((random() - 0.5) * rect.bounds.height() * scale + rect.bounds.centerY());
    logText += `(${x}, ${y})`;
    log(`点击${logText}`);
    click(x, y);
}

function requestScreenCaptureAuto(ensureImg) {
    let testImg;
    try {
        testImg = captureScreen();
        if (!ensureImg || ensureImg(testImg))
            return;
        log(`截图异常，截图大小：${testImg.width}x${testImg.height}`);
        if (!images.stopScreenCapturer) {
            exit();
        }
        images.stopScreenCapturer();
    } catch (e) {
        const errorStr = e.toString();
        if (!errorStr.includes('No screen capture permission') &&
            !errorStr.includes('ScreenCapturer is not available')) {
            throw e;
        }
    }
    let hasPermission = false;
    const [w, h] = getDisplaySize();
    let confirmRequest = () => {
        //安卓版本高于Android 9
        if (hasPermission || device.sdkInt <= 28) {
            return;
        }
        const ele = textMatches(/(.*录.[或\/]投.*|允许|立即开始|确定|统一)/).findOne(10 * 1000);
        if (ele === null) {
            console.error("未能发现截图权限弹窗");
        }
        let target = null;
        for (let i = 0; i < 10; ++i) {
            sleep(200);
            let t = null;
            const cancel = textMatches(/(取消|禁止)/).find();
            const confirm = textMatches(/(允许|确定|立即开始)/).find();
            if (!confirm.empty() && confirm.get(0).text()) {
                log('找到确定按钮');
                t = confirm.get(0).bounds();
            } else if (!cancel.empty()) {
                log('找到取消按钮');
                const cancelBounds = cancel.get(0).bounds();
                t = new android.graphics.Rect(
                    w - cancelBounds.right,
                    cancelBounds.top,
                    w - cancelBounds.left,
                    cancelBounds.bottom
                );
            }
            if (t)
                log(t);
            if (t && t.top < t.bottom && (h == 0 || t.top <= h + 200)) {
                target = { bounds: t };
                break;
            }
        }
        if (target === null) {
            console.error('处理截图权限弹窗失败');
            return;
        }
        for (let i = 0; i < 10; ++i) {
            if (hasPermission)
                return;
            clickRect(target, 0.5, 0);
            sleep(1000);
        }
    };
    //等待截屏权限申请并同意
    threads.start(confirmRequest);
    // 检查屏幕方向
    let orientation = context.getResources().getConfiguration().orientation;
    let isLandscape = (orientation == android.content.res.Configuration.ORIENTATION_LANDSCAPE);
    let isTablet = (device.width > device.height);    // 平板横边 > 竖边
    log(`申请截屏权限：${isLandscape ? '横' : '竖'}屏，设备类型：${isTablet ? '平板' : '手机'}`);
    if (!requestScreenCapture((isLandscape ^ isTablet) == 1)) {
        toastLog("请求截图失败");
        exit();
    }
    if (!ensureImg) {
        hasPermission = true;
        return;
    }
    testImg = captureScreen();
    if (ensureImg(testImg)) {
        hasPermission = true;
        return;
    }
    log(`截图权限申请异常，截图大小：${testImg.width}x${testImg.height}`);
    if (!images.stopScreenCapturer) {
        exit();
    }
    log('重新申请截图权限');
    images.stopScreenCapturer();
    threads.start(confirmRequest);
    if (!requestScreenCapture((isLandscape ^ isTablet) == 0)) {
        toastLog("请求截图失败");
        exit();
    }
    hasPermission = true;
}

function getDisplaySize(doNotForcePortrait) {
    try {
        const img = captureScreen();
        return [img.width, img.height];
    } catch (e) {
        const errorStr = e.toString();
        if (!errorStr.includes('No screen capture permission') &&
            !errorStr.includes('ScreenCapturer is not available')) {
            throw e;
        }
    }
    let { width, height } = device;
    if (width == 0) {
        // console.warn('AutoX.js获取到的设备尺寸为0，可能会影响正常运行，可以尝试重启设备');
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