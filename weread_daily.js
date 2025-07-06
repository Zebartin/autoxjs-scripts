var {
    requestScreenCaptureAuto,
    findContoursRect, killSameScripts
} = require('./utils.js');
killSameScripts();
const URL = "";
const KEY = "";
requestScreenCaptureAuto();

sleep(1000)
let img = null;
/**
 * 截图并识别OCR文本信息
 */
function captureAndOcr() {
    img && img.recycle()
    img = captureScreen()
    if (!img) {
        toastLog('截图失败')
    }
    let start = new Date()
    //结果转数组：层级：3
    let ocrResult = gmlkit.ocr(img, "zh");
    log('截图OCR耗时' + (new Date() - start) + 'ms')
    for (let x of ocrResult.toArray(3)) {
        log(x.text);
        log(x.bounds);
    }
    const top = ocrResult.find(e => e.text.match(/(第\d+.*?共\d+.{1,3}$|[最后一題题]{2,})/) != null);
    const bottom = ocrResult.find(e => e.text.match(/[这這题題有問问！!]{3,}/) != null);
    if (!top || !bottom) {
        toastLog("识别失败");
        return;
    }
    const contours = findContoursRect(img, {
        thresh: 50,
        type: "BINARY",
        region: [0, top.bounds.bottom, img.getWidth(), bottom.bounds.top - top.bounds.bottom],
        rectFilter: rect =>
            rect.left < img.getWidth() / 2 &&
            rect.right > img.getWidth() / 2 &&
            rect.width() > img.getWidth() * 0.6
    });
    const question = ocrResult.filter(x =>
        x.level == 1 &&
        x.bounds != null &&
        x.bounds.top >= top.bounds.bottom &&
        x.bounds.bottom <= contours[0].top
    ).toArray().map(x => x.text).join('')
    const options = contours.map(c => ocrResult.filter(x =>
        x.level == 1 &&
        x.bounds != null &&
        x.bounds.left >= c.left &&
        x.bounds.right <= c.right &&
        x.bounds.top >= c.top &&
        x.bounds.bottom <= c.bottom
    ).toArray().map(x => x.text).join(''));
    log(question);
    log(options);
    try {
        solve(question, options);
    } catch (error) {
        console.error(`调用API失败：${error.message}`);
        toastLog('调用API失败');
    }
}

function solve(question, options) {
    const content = `问题：${question}\n选项：${options.map((opt, index) => String.fromCharCode(65 + index) + '、' + opt).join('\n')}`;
    log(content);
    // log("请求中……");
    const start = new Date();
    const r = http.postJson(URL, {
        "model": "gemini-2.5-flash",
        "messages": [
            {
                "role": "system",
                "content": "你是一位擅长百科问答题的专家，请根据用户提供的问题和选项，给出最合适的答案。用户提供的内容可能有错字或漏字，你能够自行判断。先给出选项对应的字母，再给出50字以内的简短理由，中间不需要换行。"
            },
            {
                "role": "user",
                "content": content
            }
        ],
    }, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + KEY
        },
    });
    toastLog(r.body.json()['choices'][0]['message']['content']);
    // log('请求API耗时：' + (new Date() - start) + 'ms')
}
// 操作按钮
let clickButtonWindow = floaty.rawWindow(
    <vertical>
        <button id="captureAndOcr" text="查答案" />
        <button id="closeBtn" text="退出" />
    </vertical>
);
ui.run(function () {
    clickButtonWindow.setPosition(device.width / 2 - ~~(clickButtonWindow.getWidth() / 2), device.height * 0.65)
})

// 点击识别
clickButtonWindow.captureAndOcr.click(function () {
    result = []
    ui.run(function () {
        clickButtonWindow.setPosition(device.width, device.height)
    })
    setTimeout(() => {
        threads.start(() => {
            captureAndOcr()
            ui.run(function () {
                clickButtonWindow.setPosition(device.width / 2 - ~~(clickButtonWindow.getWidth() / 2), device.height * 0.65)
            })
        })
    }, 500)
})

// 点击关闭
clickButtonWindow.closeBtn.click(function () {
    exit()
})

setInterval(() => { }, 10000)
events.on('exit', () => {
    // 回收图片
    img && img.recycle()
})
