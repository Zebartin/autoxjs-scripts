// 模拟器：720x1280
// 在活动页面位置处开始脚本
// 开始前需要保证“钓鱼图鉴”出现在活动页面右上角，如果没有可以去岛屿探险里看一眼再出来
// 卡顿时表现差
// 视情况酌情调整以下数字

// 窗口宽度：预判窗口，宽度越大表示提前考虑得越多
// 感觉点快了就调小，点慢了可以调大一点
// 祈愿渔竿钓大鱼参考（祈愿、超祈愿、真超、极真）：126（容易超时）、118、110、100
const 窗口宽度 = 100;
// 甩杆延迟：识别到甩杆图标后，延迟X毫秒再点击，为0时根据目标鱼种自动检测
const 甩杆延迟 = 0;
// 全王冠，1 / 0，对应 开启 / 关闭
const 全王冠 = 1;

importPackage(org.opencv.core);
importPackage(org.opencv.imgproc);
requestScreenCaptureAuto();

// /mnt/shared/Pictures/xxx/
const 活动入口 = {
    text: '活动入口',
    point: [567, 1040],
    image: images.read('./images/活动入口.png')
};
const 图鉴 = {
    text: '图鉴',
    region: [630, 300, 80, 200],
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
const 浮标 = {
    text: '浮标',
    region: [580, 225, 70, 810],
    image: images.read('./images/浮标.png')
};
const 血量50 = {
    text: '血量50',
    point: [360, 220],
    image: images.read('./images/50.png')
};
const 血量60 = {
    text: '血量60',
    point: 血量50.point,
    image: images.read('./images/60.png')
};
const 血量70 = {
    text: '血量70',
    point: 血量50.point,
    image: images.read('./images/70.png')
};
const 血量80 = {
    text: '血量80',
    point: 血量50.point,
    image: images.read('./images/80.png')
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
const 小型_CLICK = {
    text: '小型',
    point: [160, 150],
    image: images.read('./images/小型_CLICK.png')
};
const 小型_CHECK = {
    text: '小型_CHECK',
    point: [160, 120],
    image: images.read('./images/小型_CHECK.png')
};
const 中型_CLICK = {
    text: '中型',
    point: [330, 150],
    image: images.read('./images/中型_CLICK.png')
};
const 中型_CHECK = {
    text: '中型_CHECK',
    point: [330, 120],
    image: images.read('./images/中型_CHECK.png')
};
const 大型_CLICK = {
    text: '大型',
    point: [505, 145],
    image: images.read('./images/大型_CLICK.png')
};
const 大型_CHECK = {
    text: '大型_CHECK',
    point: [505, 124],
    image: images.read('./images/大型_CHECK.png')
};
const 无王冠小鱼 = {
    text: '无王冠小鱼',
    region: [150, 380, 510, 520],
    image: images.read('./images/无王冠小鱼.png')
};
const 无王冠中鱼 = {
    text: '无王冠中鱼',
    region: 无王冠小鱼.region,
    image: images.read('./images/无王冠中鱼.png')
};
const 无王冠大鱼 = {
    text: '无王冠大鱼',
    region: 无王冠小鱼.region,
    image: images.read('./images/无王冠大鱼.png')
};

const leftBtn = {
    text: '左',
    bounds: new android.graphics.Rect(140, 1030, 220, 1110)
};
const rightBtn = {
    text: '右',
    bounds: new android.graphics.Rect(500, 1030, 580, 1110)
};
const upBtn = {
    text: '上',
    bounds: new android.graphics.Rect(320, 930, 400, 1010)
};
const downBtn = {
    text: '下',
    bounds: new android.graphics.Rect(320, 1130, 400, 1210)
};
let image, screenMat;
let largestDone = [true, true, true];

image = captureScreen();
if (image.width != 720 || image.height != 1280) {
    toast('模拟器分辨率不是720x1280或者不是竖屏');
    console.error('模拟器分辨率不是720x1280或者不是竖屏');
    if (images.stopScreenCapturer) {
        images.stopScreenCapturer();
    }
    exit();
}
toast('⚠️注意：\n1. 须在活动页面启动\n2. 须保证“钓鱼图鉴”在右上角');

if (全王冠) {
    largestDone = [false, false, false];
    for (let x of [无王冠小鱼, 无王冠中鱼, 无王冠大鱼]) {
        let t = images.grayscale(x.image);
        x.image.recycle();
        x.image = t;
    }
} else {
    // init opencv
    let t = images.grayscale(图鉴.image);
    t && t.recycle();
}
for (let b of [左, 右, 上, 下]) {
    let channels = new java.util.ArrayList();
    Core.split(b.image.getMat(), channels);
    b.image.recycle();
    channels[0].release();
    channels[2].release();
    b.image = channels[1];
}

// threads.start(leftright);
// threads.start(updown);
try {
    main();
} catch (error) {
    if (!error.message.includes('InterruptedException'))
        log(error);
} finally {
    // threads.shutDownAll();
    for (let button of [
        活动入口, 图鉴, 图鉴内页, 立即前往,
        钓鱼入口, 开始钓鱼1, 开始钓鱼2, 甩杆,
        浮标, 血量50, 血量60, 血量70, 血量80,
        剩余时间, 确认, 结束, 暂停,
        大型_CHECK, 大型_CLICK, 无王冠大鱼,
        中型_CHECK, 中型_CLICK, 无王冠中鱼,
        小型_CHECK, 小型_CLICK, 无王冠小鱼
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
        // sleep(30);
        image = images.captureScreen();
        screenMat && screenMat.release();
        screenMat = null;
        if (match(image, 甩杆) && castRod()) {
            continue;
        }
        if (match(image, 结束, 1500)) {
            clickRect(结束, 1, 0);
            continue;
        }
        if (match(image, 确认)) {
            clickRect(确认, 1, 0);
            continue;
        }
        if (match(image, 剩余时间, 0)) {
            let cropped = images.clip(image, 630 - 窗口宽度, 315, 窗口宽度, 50);
            let channels = new java.util.ArrayList();
            Core.split(cropped.getMat(), channels);
            cropped.recycle();
            screenMat = channels[1];
            if (matchTemplateJava(screenMat, 左.image, 0.6)) {
                clickRect(leftBtn, 1, 0);
                continue;
            }
            if (matchTemplateJava(screenMat, 右.image, 0.6)) {
                clickRect(rightBtn, 1, 0);
                continue;
            }
            if (matchTemplateJava(screenMat, 上.image, 0.6)) {
                clickRect(upBtn, 1, 0);
                continue;
            }
            if (matchTemplateJava(screenMat, 下.image, 0.6)) {
                clickRect(downBtn, 1, 0);
                continue;
            }
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
        if (match(image, 开始钓鱼2, 2000)) {
            clickRect(开始钓鱼2, 1, 0);
            continue;
        }
        if (match(image, 图鉴, 3000) && findNext()) {
            continue;
        }
        if (match(image, 活动入口, 10000, 20, 0.6)) {
            clickRect(活动入口);
            sleep(10000);
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
        // sleep(10);
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
        // sleep(10);
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
function castRod() {
    const BLUE = '#00AEFF';
    const PURPLE = '#D651FF';
    const GOLD = '#FFC731';
    const targetColors = [GOLD, PURPLE, BLUE];
    const resultBtns = [
        [血量80, [0]],
        [血量70, [0, 1]],
        [血量60, [2]],
        [血量50, [2]],
    ]
    let i;
    let target = null, result = null;
    let castBingo = false;
    if (甩杆延迟 === 0) {
        for (i = 0; i < 3; ++i) {
            if (!largestDone[i]) {
                target = i;
                break;
            }
        }
        if (target === null)
            target = 0;
    }
    for (i = 0; i < 1000; ++i) {
        // sleep(10);
        image = images.captureScreen();
        if (match(image, 浮标, 0, 20, 0.6)) {
            if (target === null) {
                clickRect(甩杆, 1, 甩杆延迟);
                continue;
            }
            let c = image.pixel(浮标.bounds.left - 20, 浮标.bounds.bottom);
            // log(`color: ${colors.toString(c)}`);
            if (colors.isSimilar(c, targetColors[target])) {
                castBingo = true;
                clickRect(甩杆, 1, 0);
                continue;
            } else {
                castBingo = false;
            }
        }
        for (let [btn, l] of resultBtns) {
            if (match(image, btn)) {
                result = l;
                if (l.length === 1)
                    castBingo = true;
                log(`甩杆结果：${btn.text}`);
                break;
            }
        }
        if (result != null)
            break;
    }
    if (i >= 1000) {
        return false;
    }
    if (target === null || (castBingo && result.includes(target))) {
        return true;
    }
    if (!castBingo) {
        toastLog('甩杆晚了，重试');
    } else if (!result.includes(target)) {
        toastLog('血量不符合预期，重试');
    }
    for (i = 0; i < 50; ++i) {
        sleep(200);
        image = images.captureScreen();
        if (match(image, 结束)) {
            结束.lastMatched = 0;
            return false;
        }
        if (match(image, 暂停, 600)) {
            clickRect(暂停, 1, 0);
            continue;
        }
    }
    return false;
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
    const btns = [
        [大型_CHECK, 大型_CLICK, 无王冠大鱼],
        [中型_CHECK, 中型_CLICK, 无王冠中鱼],
        [小型_CHECK, 小型_CLICK, 无王冠小鱼]
    ];
    let someFish = null;
    for (let i = 0; i < 3; ++i) {
        if (largestDone[i])
            continue;
        let [checkBtn, clickBtn, matchBtn] = btns[i];
        while (true) {
            sleep(100);
            image = images.captureScreen();
            if (match(image, checkBtn))
                break;
            if (match(image, clickBtn, 1000)) {
                clickRect(clickBtn, 1, 0);
                continue;
            }
        }
        sleep(1000); // 偷懒sleep等加载
        image = images.captureScreen();
        let gimg = images.grayscale(image);
        let result = images.matchTemplate(gimg, matchBtn.image, {
            region: matchBtn.region,
            max: 25
        });
        toastLog(`${matchBtn.text}数量：${result.points.length}`);
        if (result.points.length > 0) {
            let index = random(0, result.points.length - 1);
            matchBtn.bounds = imgToBounds(matchBtn.image, result.points[index]).bounds;
            someFish = matchBtn;
        }
        gimg && gimg.recycle();
        if (someFish != null)
            break;
        largestDone[i] = true;
    }
    if (someFish === null) {
        if (全王冠)
            toastLog('wtf已全图鉴王冠？');
        someFish = 图鉴随机区域;
    } else {
        someFish.bounds.left -= 50;
        someFish.bounds.right -= 50;
        someFish.bounds.top += 20;
        someFish.bounds.bottom += 20;
    }
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
            clickRect(someFish, 1, 0);
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
    click(x, y);
    log(`点击${logText}`);
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