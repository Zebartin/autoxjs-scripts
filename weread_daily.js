var {
    requestScreenCaptureAuto,
    findContoursRect, killSameScripts
} = require('./utils.js');
killSameScripts();
let llmStorage = storages.create("llm");
let MODEL = "gemini-2.5-flash";
let TIMEOUTS = 7;
var solving = false;
const URL = llmStorage.get('url');
const KEY = llmStorage.get('key');
requestScreenCaptureAuto();

sleep(1000)
// 操作按钮
let clickButtonWindow = floaty.rawWindow(
    <vertical bg="#88000000" padding="10dp" gravity="center">
        <horizontal gravity="center">
            <button id="captureAndOcr" text="查答案" margin="5dp" />
            <button id="closeBtn" text="退出" margin="5dp" />
        </horizontal>
        <text id="text" textColor="#eb3434" textSize="16sp" w="*" gravity="center" marginTop="10dp">
            答案显示在这里
        </text>
    </vertical>
);
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
    let thresh = 50;
    let start = new Date()
    //结果转数组：层级：3
    let ocrResult = gmlkit.ocr(img, "zh");
    log('截图OCR耗时' + (new Date() - start) + 'ms')
    for (let x of ocrResult.toArray(3)) {
        log(x.text);
        log(x.bounds);
    }
    MODEL = "gemini-2.5-flash";
    const top = ocrResult.find(e => e.text.match(/(第\d+.*?共\d+.{1,3}$|[最后一題题]{2,}|[附加题题]{2,})/) != null);
    let bottom = ocrResult.find(e => e.text.match(/[这這题題有問问！!]{3,}/) != null);
    if (!top) {
        toastLog("识别失败");
        return;
    }
    if (!bottom) {
        bottom = { bounds: { top: img.getHeight() } };
        thresh = 75;
        TIMEOUTS = 10;
        MODEL = "gemini-2.5-flash-lite"; // 更快
    }
    const contours = findContoursRect(img, {
        thresh: thresh,
        type: "BINARY",
        region: [0, top.bounds.bottom, img.getWidth(), bottom.bounds.top - top.bounds.bottom],
        rectFilter: rect =>
            rect.left < img.getWidth() / 2 &&
            rect.right > img.getWidth() / 2 &&
            rect.width() > img.getWidth() * 0.6 &&
            rect.height() < img.getHeight() * 0.3
    });
    const question = ocrResult.filter(x =>
        x.level == 1 &&
        x.bounds != null &&
        x.bounds.top >= top.bounds.bottom &&
        x.bounds.bottom <= contours[0].top
    ).toArray()
        .sort((a, b) => a.bounds.top - b.bounds.top)
        .map(x => x.text).join('').trim();
    const options = contours.map(c => ocrResult.filter(x =>
        x.level == 1 &&
        x.bounds != null &&
        x.bounds.left >= c.left &&
        x.bounds.right <= c.right &&
        x.bounds.top >= c.top &&
        x.bounds.bottom <= c.bottom
    ).toArray()
        .sort((a, b) => a.bounds.top - b.bounds.top)
        .map(x => x.text).join(''));
    log(question);
    log(options);
    const threadSolve = threads.start(() => {
        try {
            solve(question, options);
        } catch (error) {
            console.error(`调用API失败：${error.message}`);
            toastLog('调用API失败');
        }
    });
    for (let i = 0; i < TIMEOUTS; ++i) {
        sleep(1000);
        if (!solving) {
            return;
        }
    }
    if (solving) {
        threadSolve.interrupt();
        solving = false;
        ui.run(function () {
            clickButtonWindow.text.setText('调用API超时');
        })
        displayWindow();
    }
}

function postJson(url, json, timeouts, options) {
    options.method = "POST";
    options.contentType = "application/json";
    const customClient = http.client().newBuilder()
        .connectTimeout(timeouts, java.util.concurrent.TimeUnit.SECONDS)
        .readTimeout(timeouts, java.util.concurrent.TimeUnit.SECONDS)
        .writeTimeout(timeouts, java.util.concurrent.TimeUnit.SECONDS)
        .build();
    options.body = JSON.stringify(json);
    const call = customClient.newCall(http.buildRequest(url, options));
    return JSON.parse(call.execute().body().string());
}

function solve(question, options) {
    solving = true;
    const content = `问题：${question}\n选项：${options.map((opt, index) => String.fromCharCode(65 + index) + '、' + opt).join('\n')}`;
    log(content);
    // log("请求中……");
    const start = new Date();
    const r = postJson(URL, {
        "model": MODEL,
        "messages": [
            {
                "role": "system",
                "content": "你是一位擅长百科问答题的专家，请根据用户提供的问题和选项，给出最合适的答案。用户提供的内容可能有错字或漏字，你能够自行判断。只给出答案选项对应的字母，再给出20字以内的简短理由，中间不需要换行。"
            },
            {
                "role": "user",
                "content": content
            }
        ],
    }, TIMEOUTS, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + KEY
        },
    });
    solving = false;
    const answer = r['choices'][0]['message']['content'];
    log(answer);
    ui.run(function () {
        clickButtonWindow.text.setText(answer);
    })
    displayWindow();
    // log('请求API耗时：' + (new Date() - start) + 'ms')
}
function displayWindow() {
    ui.run(function () {
        clickButtonWindow.setPosition(device.width / 2 - ~~(clickButtonWindow.getWidth() / 2), device.height * 0.75)
    })
}
ui.run(displayWindow);

// 点击识别
clickButtonWindow.captureAndOcr.click(function () {
    result = []
    ui.run(function () {
        clickButtonWindow.setPosition(device.width, device.height)
    })
    setTimeout(() => {
        threads.start(() => {
            captureAndOcr()
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
    if (images.stopScreenCapturer) {
        images.stopScreenCapturer();
    }
})
