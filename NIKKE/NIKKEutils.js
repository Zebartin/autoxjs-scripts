var {
  ocrUntilFound, clickRect, unlockIfNeed,
  requestScreenCaptureAuto, getDisplaySize,
  killApp, findImageByFeature, findContoursRect,
  rgbToGray, getRandomArea, swipeRandom, ocrInfo,
  screenshot, appear, appearThenClick
} = require('./utils.js');
var firstCheckAuto = true;
var homeBtn = null;
if (typeof module === 'undefined') {
  auto.waitFor();
  unlockIfNeed();
  requestScreenCaptureAuto();
  刷刷刷();
  if (confirm('已完成活动刷关，\n是否继续日常收菜？')) {
    返回首页();
    engines.execScriptFile('./NIKKE日常.js', {
      delay: 1000
    });
  }
  exit();
}
else {
  module.exports = {
    saveError: saveError,
    启动NIKKE: 启动NIKKE,
    等待NIKKE加载: 等待NIKKE加载,
    退出NIKKE: 退出NIKKE,
    reportEvent: reportEvent,
    返回首页: 返回首页,
    mostSimilar: mostSimilar,
    detectNikkes: detectNikkes,
    NikkeToday: NikkeToday,
    关闭限时礼包: 关闭限时礼包,
    checkAuto: checkAuto,
  };
}
function saveError(error) {
  const errorPath = files.path(`./nikkerror/${Date.now()}/`);
  const errorStrs = [
    `当前脚本版本：${NIKKEstorage.get('tagName', '无记录')}`,
    error.message,
    error.stack
  ];
  files.ensureDir(errorPath);
  if (ocrInfo.img) {
    images.save(ocrInfo.img, files.join(errorPath, 'error.png'));
  }
  if (ocrInfo.result) {
    errorStrs.push('');
    const res = ocrInfo.result.toArray(3);
    for (let i = 0; i < res.length; ++i) {
      errorStrs.push(`${res[i].bounds}\t"${res[i].text}"`);
    }
  }
  files.write(files.join(errorPath, 'log.txt'), errorStrs.join('\n'));
  console.error(`出错日志已保存到${errorPath}`);
  console.error('上报问题时请务必附上上述出错日志目录中的内容');
}
function 启动NIKKE() {
  let NIKKEstorage = storages.create("NIKKEconfig");
  let errorPath = files.path('./nikkerror/');
  files.ensureDir(errorPath);
  // 保证错误截图不要过多
  let maxErr = 10;
  let errorDirs = files.listDir(errorPath);
  if (errorDirs.length >= maxErr) {
    errorDirs.sort((a, b) => parseInt(b.split('.')[0]) - parseInt(a.split('.')[0]));
    for (let f of errorDirs.slice(maxErr)) {
      log(`删除过期错误日志：${f}`);
      let fp = files.join(errorPath, f);
      if (files.isFile(fp)) {
        files.remove(fp);
      } else if (files.isDir(fp)) {
        files.removeDir(files.join(errorPath, f));
      }
    }
  }
  if (NIKKEstorage.get('mute', false)) {
    try {
      device.setMusicVolume(0);
    } catch (error) {
      if (error.message.includes('系统设置权限'))
        toastLog('需要为AutoX.js打开修改系统设置权限');
      else
        toastLog(error);
    }
  }
  const launchMethod = NIKKEstorage.get('launchMethod', 'NIKKE');
  if (launchMethod != 'Manually') {
    unlockIfNeed();
    home();
    sleep(500);
  }
  // 自行启动v2rayNG科学上网
  if (launchMethod == 'NIKKE' && NIKKEstorage.get('v2rayNG', false) && app.launchApp("v2rayNG")) {
    let i;
    const maxRetry = 10;
    for (i = 0; i < maxRetry; ++i) {
      let t = id('tv_test_state').findOne(2000);
      if (t != null)
        break;
      app.launchApp("v2rayNG");
      sleep(1000);
    }
    if (i == maxRetry) {
      throw new Error('无法打开v2rayNG');
    }
    log('已打开v2rayNG');
    // 关闭连接，否则会影响真连接测试
    if (id('tv_test_state').findOne().text() != '未连接')
      id('fab').click();
    for (i = 0; i < maxRetry; ++i) {
      desc('更多选项').click();
      text('测试全部配置真连接').waitFor();
      click('测试全部配置真连接');
      textMatches(/^\d+ms$/).findOne(4000);
      desc('更多选项').click();
      text('按测试结果排序').waitFor();
      click('按测试结果排序');
      let firstCard = id("info_container").findOne(500);
      if (firstCard != null) {
        let firstDelay = firstCard.findOne(textEndsWith('ms'));
        if (firstDelay != null && firstDelay.text() != '-1ms') {
          firstCard.click();
          break;
        }
      }
      desc('更多选项').click();
      text('更新订阅').waitFor();
      click('更新订阅');
      sleep(3000);
    }
    if (i == maxRetry) {
      console.error('启动v2rayNG服务失败');
      exit();
    }
    id('fab').click();
  }
  if (launchMethod == 'NIKKE') {
    if (NIKKEstorage.get('startGooglePlayFirst', false)) {
      app.launchApp('Google Play 商店');
      sleep(50);
    }
    if(app.launchApp("NIKKE")) {
      // waitForActivity('com.shiftup.nk.MainActivity');
      log("打开NIKKE");
    } else {
      throw new Error('无法启动NIKKE，请确保Autox.js拥有“读取已安装应用列表”权限');
    }
  } else if (launchMethod == 'OurPlay') {
    startFromOurPlay();
  } else if (launchMethod == 'Manually') {
    toastLog('已勾选“游戏已启动”选项\n请确保游戏此时正处于前台画面');
  } else {
    throw new Error(`未知启动方式${launchMethod}`);
  }
}
function backToAnnouncement() {
  // 返回公告页面
  ocrUntilFound(res => {
    const announcementBtn = res.find(e =>
      e.text.match(/(系[统統]|活动)公告/) != null
    );
    if (announcementBtn) {
      return true;
    }
    back();
    sleep(1600);
  }, 10, 800);
}
function checkInLIP() {
  let NIKKEstorage = storages.create("NIKKEconfig");
  if (NIKKEstorage.get('doCheckInLIP', true) != true) {
    return;
  }
  const today = NikkeToday();
  const lastChecked = NIKKEstorage.get('checkInLIP', null);
  if (today == lastChecked) {
    log('今日LIP已签到');
    return;
  }
  // 领取超值好礼/签到领珠宝 -> tap to enter
  const enterLIP = ocrUntilFound((res, img) => {
    const tapToEnter = res.find(e =>
      e.text.match(/tap\s*t.\s*enter/i) != null
    );
    if (tapToEnter) {
      return tapToEnter;
    }
    const announcementBtn = res.find(e =>
      e.text.match(/(系[统統]|活动)公告/) != null
    );
    if (!announcementBtn) {
      return false;
    }
    /* 记录往期文本
     * - LIPASS四月好礼
     */
    const entrance = res.find(e =>
      e.text.match(/([领取超值好礼签到领珠宝送]{3,}|[领取LPAS]{3,}.{0,2}月[奖励好礼福利]{1,})/) != null &&
      e.bounds != null &&
      e.bounds.top > announcementBtn.bounds.bottom
    );
    if (entrance) {
      clickRect(entrance, 1, 0);
      return false;
    }
    let swipeArea = new android.graphics.Rect(
      img.width * 0.2, announcementBtn.bounds.bottom, img.width * 0.8,
      announcementBtn.bounds.bottom + random(img.height * 0.3, img.height * 0.4)
    );
    swipeRandom(swipeArea, 'up');
    swipeRandom(swipeArea, 'right', 200);
  }, 10, 700);
  if (!enterLIP) {
    log('没有找到Level Infinite Pass入口');
    backToAnnouncement();
    return;
  }
  // tap to enter -> 奖励页面
  ocrUntilFound(res => {
    const tapToEnter = res.find(e =>
      e.text.match(/tap\s*t.\s*enter/i) != null
    );
    if (tapToEnter) {
      clickRect(tapToEnter, 1, 0);
      return false;
    }
    return true;
  }, 10, 1000);
  sleep(3000);
  // 反复点“每日签到/确认”
  const checked = ocrUntilFound(res => {
    const confirm = textMatches(/(确认|確認)/).findOnce();
    if (confirm) {
      clickRect({
        bounds: confirm.bounds(),
        text: confirm.text()
      }, 1, 0);
      return false;
    }
    if (res.text.match(/([请請]明日|明日再)/) != null) {
      return true;
    }
    const checkIn = textMatches(/每日[签簽]到/).findOnce();
    if (!checkIn) {
      sleep(2200);
      return false;
    }
    clickRect({
      bounds: checkIn.bounds(),
      text: checkIn.text()
    }, 1, 0);
  }, 30, 800);
  if (checked) {
    log('LIP签到成功');
    NIKKEstorage.put('checkInLIP', today);
  }
  else {
    log('LIP签到失败');
  }
  backToAnnouncement();
}
function tryLogin() {
  const NIKKEstorage = storages.create("NIKKEconfig");
  const { email, password } = NIKKEstorage.get('account', {});
  const launchMethod = NIKKEstorage.get('launchMethod', null);
  if (!email || !password) {
    console.error('未配置游戏账号密码，无法登录游戏');
    return false;
  }
  if (launchMethod != 'NIKKE') {
    console.error('不是通过游戏本体启动，无法输入账号密码');
    return false;
  }
  const 忘记密码 = {
    text: "忘记密码",
    regex: /[忘记]/
  };
  const 邮箱地址输入框 = {
    text: "邮箱地址输入框",
    regex: /邮?箱?[地址]+/
  };
  const 密码输入框 = {
    text: "密码输入框",
    regex: /[密码]/,
    filter: (bounds, img) =>
      bounds &&
      bounds.top < 忘记密码.bounds.top &&
      bounds.bottom > 邮箱地址输入框.bounds.bottom
  };
  const 邮箱登录 = {
    text: "邮箱登录",
    regex: /[邮箱]+[登录]+/,
  };
  const 密码登录 = {
    text: "密码登录",
    regex: /[密码]+[登录]+/,
  };
  const 确认登录 = {
    text: "确认登录",
    regex: /^[^邮箱密码第三方]{0,1}[登录]+/,
    filter: (bounds, img) =>
      bounds &&
      bounds.top > 忘记密码.bounds.top &&
      bounds.bottom < 邮箱登录.bounds.bottom
  };
  let i;
  for (i = 0; i < 20; ++i) {
    if (i != 0) {
      sleep(500);
      screenshot();
    }
    if (appearThenClick(密码登录)) {
      continue;
    }
    if (
      appear(邮箱登录) && appear(忘记密码) &&
      appear(邮箱地址输入框) &&
      appear(密码输入框) && appear(确认登录)
    ) {
      break;
    }
  }
  if (i == 20) {
    throw new Error('未找到邮箱登录按钮，无法登录游戏');
  }
  const operations = [{
    entryButton: 邮箱地址输入框,
    text: email
  }, {
    entryButton: 密码输入框,
    text: password
  }];
  const 输入框 = {
    selector: packageNameContains('nikke').className('EditText')
  };
  const 输入确定 = {
    selector: packageNameContains('nikke').className('Button'),
    regex: /[确定]+/
  };
  for (let oper of operations) {
    for (i = 0; i < 30; ++i) {
      if (i != 0) {
        sleep(500);
        screenshot();
      }
      if (appear(输入确定)) {
        if (appear(输入框)) {
          输入框.button.setText(oper.text);
          sleep(100);
          输入确定.button.click();
          break;
        } else {
          const dis = 输入确定.bounds.width() / 2;
          const mayBeEdit = {
            bounds: android.graphics.Rect(
              ocrInfo.img.width - dis,
              输入确定.bounds.top,
              ocrInfo.img.width + dis,
              输入确定.bounds.bottom,
            )
          };
          clickRect(mayBeEdit, 1, 0);
          continue;
        }
      }
      if (appearThenClick(oper.entryButton)) {
        continue;
      }
    }
    if (i == 30) {
      throw new Error('未能输入账号密码，无法登录游戏');
    }
  }
  const 进入游戏 = {
    regex: /(登出|T.UCH|C.NT.NUE|[12]\/2)/
  }
  for (i = 0; i < 10; ++i) {
    if (i != 0) {
      sleep(2000);
      screenshot();
    }
    if (appear(进入游戏)) {
      break;
    }
    if (appearThenClick(确认登录, 5000)) {
      continue;
    }
  }
  if (i == 10) {
    throw new Error('进入游戏超时');
  }
  return true;
}
function 等待NIKKE加载() {
  let [width, height] = getDisplaySize();
  let manuallyEnter = true;
  const continueBtn = getRandomArea(captureScreen(), [0.2, 0.2, 0.8, 0.8]);
  continueBtn.text = 'TOUCH TO CONTINUE';
  if (ocrUntilFound(res => {
    if (res.text.match(/(密|验证)码/) != null) {
      if (!tryLogin()) {
        toastLog('未登录游戏，停止运行脚本');
        home();
        exit();
      }
    }
    else if (res.text.includes('不再显')) {
      let target = res.find(e => e.text.match(/.{0,4}不再显/) != null);
      clickRect(target, 1, 0);
      sleep(500);
      click(width / 2, height * 0.85);
    }
    else if (res.text.match(/[確确][認认]/) != null) {
      let target = res.find(e => e.text.match(/[確确][認认]$/) != null);
      if (target != null)
        clickRect(target, 1, 0);
    }
    else if (res.text.includes('返回')) {
      let target = res.find(e =>
        e.text.endsWith('返回') && e.bounds != null &&
        e.bounds.top > height * 0.8 &&
        e.bounds.right < width * 0.5
      );
      if (target != null)
        clickRect(target, 1, 0);
    }
    else if (res.text.includes('正在下载')) {
      sleep(20000);
    }
    else if (res.text.match(/(登出|T.UCH|C.NT.NUE)/) != null) {
      clickRect(continueBtn, 1, 0);
      manuallyEnter = false;
      sleep(3000);
    }
    else if (res.text.match(/(大厅|员招|物品栏)/) != null) {
      if (res.text.match(/(系[统統]|活动)公告/) != null)
        manuallyEnter = false;
      if (manuallyEnter == false)
        return true;
      if (res.text.match(/(基地|商店)/) != null)
        return true;
      let hallBtn = res.find(e => e.text == '大厅');
      if (hallBtn != null)
        clickRect(hallBtn, 1, 0);
    }
    // 月卡检查要放在这里之后
    else if (res.text.match(/(REWARD|点击|每日|补给)/) != null)
      click(width / 2, height * 0.8);
    toast('等待加载……');
    return false;
  }, 60, 5000) == null)
    throw new Error('游戏似乎一直在加载');
  if (manuallyEnter)
    return;
  sleep(1000);
  // 等待游戏内公告出现，并处理月卡
  if (ocrUntilFound(res => {
    let dontShow = res.find(e => e.text.match(/.{0,4}今日不再/) != null);
    if (dontShow != null) {
      clickRect(dontShow, 1, 0);
      sleep(300);
      back();
      return false;
    }
    if (res.text.match(/(系[统統]|活动)公告/) != null)
      return true;
    if (res.text.match(/(REWARD|点击|奖励)/) != null)
      click(width / 2, height * 0.8);
    return false;
  }, 5, 1200) == null) {
    console.error('没有出现游戏公告');
  }
  else {
    checkInLIP();
    sleep(1000);
    back();
    toastLog('关闭公告');
  }
  等待每日签到();
  关闭限时礼包();
}

function 退出NIKKE() {
  home();
  const NIKKEstorage = storages.create("NIKKEconfig");
  const launchMethod = NIKKEstorage.get('launchMethod', 'NIKKE');
  if (launchMethod == 'NIKKE') {
    killApp('NIKKE');
    if (storages.create("NIKKEconfig").get('v2rayNG', false) && app.launchApp("v2rayNG")) {
      for (let i = 0; i < 5; ++i) {
        let st = id('tv_test_state').findOne(2000);
        if (st != null) {
          if (st.text() != '未连接')
            id('fab').click();
          break;
        }
        app.launchApp("v2rayNG");
      }
      killApp('v2rayNG');
    }
  } else if (launchMethod == 'OurPlay') {
    quitOurPlay();
  } else if (launchMethod == 'Manually') {
    toastLog('已设置手动启动游戏，\n无法确定如何关闭');
    NIKKEstorage.put('exitGame', false)
  } else {
    throw new Error(`未知启动方式${launchMethod}`);
  }
}

function getUserId() {
  const NIKKEstorage = storages.create("NIKKEconfig");
  let userId = NIKKEstorage.get('userId', null);
  if (userId == null) {
    importClass(java.util.UUID);
    userId = UUID.randomUUID().toString();
    NIKKEstorage.put('userId', userId);
  }
  console.log('userId: ', userId);
  return userId;
}
function reportEvent(eventName, props) {
  eventName = eventName || 'pageview';
  props = props || {};
  log(`上报事件：${eventName}, ${JSON.stringify(props)}`);
  props['sdkInt'] = device.sdkInt;
  props['release'] = device.release;
  props['userId'] = getUserId();
  const [w, h] = getDisplaySize();
  props['screen_width'] = w;
  props['screen_height'] = h;
  const u = 'https://plausible.blindfirefly.top/api/event';
  try {
    const r = http.postJson(u, {
      domain: 'nikke-scripts',
      name: eventName,
      url: 'app://nikke-scripts',
      props: props
    }, {
      headers: {
        'User-Agent': props['userId'],
        'X-Forwarded-For': '127.0.0.1', // 可能涉及到代理，不统计IP
      }
    });
    log(`上报事件${eventName}：${r.body.string()}`);
  } catch (e) {
    console.error(`上报事件${eventName}失败：${e.message}`);
  }
}

function 返回首页(checkSale, beforeHook) {
  const homeImage = images.read('./images/home.jpg');
  let i = 0;
  let hallBtn = ocrUntilFound((res, img) => {
    if (beforeHook && !beforeHook(res, img))
      return null;
    let t = res.find(e => e.text == '大厅');
    if (t != null)
      return t;
    let clickHome = false;
    if (homeBtn === null) {
      homeBtn = findImageByFeature(img, homeImage, {
        threshold: 0.6,
        region: [0, img.height * 0.8, img.width / 2, img.height * 0.2]
      });
      if (homeBtn === null || homeBtn.bounds.left < 0 ||
        homeBtn.bounds.right > img.width ||
        homeBtn.bounds.top < 0 ||
        homeBtn.bounds.bottom > img.height
      ) {
        back();
        sleep(500);
        return null;
      }
      homeBtn.text = '首页图标';
      clickHome = true;
    } else if (i % 5 == 0) {
      clickHome = true;
    } else {
      let oc = homeImage.pixel(0, 0);
      let cc = img.pixel(homeBtn.bounds.left, homeBtn.bounds.top);
      if (colors.isSimilar(oc, cc, 75))
        clickHome = true;
    }
    if (clickHome)
      clickRect(homeBtn, 0.8, 0);
    sleep(Math.max(500, 2000 - 500 * i));
    i++;
    return null;
  }, 25, 1000);
  homeImage && homeImage.recycle();
  // hallBtn should not be null
  if (checkSale)
    关闭限时礼包();
  clickRect(hallBtn, 1, 200);
  log('返回首页');
}

function 等待每日签到() {
  let NIKKEstorage = storages.create("NIKKEconfig");
  let checkDailyLogin = +NIKKEstorage.get('checkDailyLogin', 1);
  if (checkDailyLogin == 0)
    return;
  // 检查是否有每天签到
  let today = NikkeToday();
  let lastChecked = NIKKEstorage.get('dailyLogin', null);
  let alwaysCheck = NIKKEstorage.get('alwaysCheckDailyLogin', false);
  if (!alwaysCheck && today == lastChecked) {
    log('今日已登录，不检查签到奖励');
    return;
  }
  NIKKEstorage.put('dailyLogin', today);
  for (let i = 0; i < checkDailyLogin; ++i) {
    log(`等待第${i + 1}个每日签到`);
    let checkRes = ocrUntilFound(res => {
      toast('正在等待每日签到出现，请勿操作');
      let check = res.text.match(/\d+(小时|天|分钟)/);
      let receive = res.filter(e =>
        e.text.match(/[领領]取/) != null &&
        e.bounds != null
      ).toArray();
      if (receive.length > 0)
        receive = receive.reduce((prev, curr) =>
          prev.bounds.top > curr.bounds.top ? prev : curr
        );
      else
        receive = null;
      if (!check)
        return null;
      return [check, receive];
    }, 4, 3000);
    if (checkRes == null) {
      log('没有出现签到奖励');
      continue;
    }
    let receiveBtn = checkRes[1];
    if (receiveBtn == null)
      toastLog('没有找到“领取”字样');
    else {
      if (receiveBtn.text.match(/[已巳己]/) != null)
        toastLog('登录奖励已被领取');
      else {
        toastLog('领取登录奖励');
        clickRect(receiveBtn);
        let clickBtn = ocrUntilFound(res => res.find(e => e.text.includes('点击')), 8, 1000, { maxScale: 4 });
        if (clickBtn != null) {
          clickRect(clickBtn);
          sleep(1000);
        }
      }
    }
    back();
    toastLog('关闭签到奖励');
  }
}

function 关闭限时礼包() {
  if (storages.create("NIKKEconfig").get('checkSale', false) == false)
    return;
  toastLog('等待限时礼包出现…');
  sleep(2000);
  let closeSale = ocrUntilFound(res => {
    if (res.text.match(/(小时|分钟|免|点击)/) == null)
      return null;
    return res.find(e => e.text.includes('点击'));
  }, 3, 2000);
  if (closeSale == null)
    toastLog('没有出现限时礼包');
  else {
    toastLog('关闭礼包页面');
    clickRect(closeSale);
    clickRect(ocrUntilFound(res => res.find(e => e.text.includes('确认')), 20, 1000));
    ocrUntilFound(res => !res.text.includes('点击'), 20, 1000);
  }
}

// 根据刷新时间来确定
// 比如03-22凌晨1点，视为03-21而非03-22
function NikkeToday() {
  let today = new Date();
  today.setTime(today.getTime() + 4 * 60 * 60 * 1000);
  let month = today.getUTCMonth() + 1;
  let day = today.getUTCDate();
  month = month < 10 ? '0' + month : month;
  day = day < 10 ? '0' + day : day;
  return today.getUTCFullYear() + '-' + month + '-' + day;
}

function 刷刷刷() {
  let [width, height] = getDisplaySize();
  clickRect(ocrUntilFound(res => res.find(
    e => e.text.includes('入战')
  ), 20, 3000));
  log('进入战斗');
  sleep(2000);
  if (ocrUntilFound(res => res.text.includes('AUT'), 20, 3000) != null) {
    while (true) {
      ocrUntilFound((res, img) => {
        if (!res.text.includes('AUT')) {
          sleep(1000);
          return null;
        }
        let autoBtn = res.find(e => e.text.includes('AUT'));
        if (autoBtn.bounds.right < img.width / 2)
          return true;
        let skipBtn = res.find(e =>
          e.text.match(/[LAUTOG]/) == null && e.text.match(/SK.P/) != null
        );
        if (skipBtn != null) {
          clickRect(skipBtn, 0.1);
          sleep(1000);
        }
        else
          click(width / 2, height / 2);
        return null;
      }, 50, 1000);
      checkAuto();
      let clickNext = ocrUntilFound(res => {
        if (!res.text.includes('REWARD')) {
          sleep(2000);
          return null;
        }
        return res.find(e => e.text.includes('步'));
      }, 50, 1000);
      let img = captureScreen();
      let hasBlue = images.findColor(img, '#00a1ff', {
        region: [
          0, clickNext.bounds.bottom,
          clickNext.bounds.right, img.height - clickNext.bounds.bottom
        ],
        threshold: 20
      });
      if (hasBlue == null)
        break;
      let target = null;
      let upperBound = clickNext.bounds.bottom;
      let leftBound = img.width / 2;
      for (let i = 0; i < 10; ++i) {
        img = captureScreen();
        let clipped = images.clip(img, leftBound, upperBound, img.width - leftBound, img.height - upperBound);
        let res = gmlkit.ocr(clipped, 'zh');
        let nextCombat = res.find(e => e.text.match(/^[^重新开始]{0,3}下[^步方法]{2}/) != null);
        if (nextCombat != null) {
          target = nextCombat;
          clipped && clipped.recycle();
          break;
        }
        let restart = res.find(e =>
          e.text.match(/[重新开始]{3,4}[^下一关卡]{0,3}$/) != null
        );
        if (restart != null) {
          target = restart;
          clipped && clipped.recycle();
          break;
        }
        sleep(1000);
      }
      if (target == null) {
        toastLog('找不到下一关卡按钮，脚本退出');
        exit();
      }
      target.bounds.left += leftBound;
      target.bounds.right += leftBound;
      target.bounds.top += upperBound;
      target.bounds.bottom += upperBound;
      clickRect(target);
    }
    log('门票用完了');
    click(width / 3, height / 3);
    ocrUntilFound(res => {
      if (res.text.includes('返回'))
        return true;
      let skipBtn = res.find(e =>
        e.text.match(/[LAUTOG]/) == null && e.text.match(/SK.P/) != null
      );
      if (skipBtn != null) {
        clickRect(skipBtn, 0.1);
        sleep(2000);
      } else
        click(width / 2, height / 2);
      return null;
    }, 30, 1000);
  }
}

function mostSimilar(target, candidates) {
  let res = null, maxSim = -1;
  for (let candidate of candidates) {
    if (target == candidate) {
      res = candidate;
      maxSim = 1;
      break;
    }
    let s = similarity(target, candidate);
    if (s > maxSim) {
      maxSim = s;
      res = candidate;
    }
  }
  return {
    result: res,
    similarity: maxSim
  };
}
// 编辑距离
function similarity(s1, s2) {
  let n = s1.length, m = s2.length;
  if (n * m == 0)
    return n == m ? 1 : 0;
  let dp = [];
  for (let i = 0; i <= n; ++i)
    dp.push([i]);
  for (let j = 1; j <= m; ++j)
    dp[0].push(j);
  for (let i = 1; i <= n; ++i) {
    for (let j = 1; j <= m; ++j) {
      let left = dp[i - 1][j] + 1;
      let down = dp[i][j - 1] + 1;
      let leftDown = dp[i - 1][j - 1];
      if (s1[i - 1] != s2[j - 1])
        leftDown += 1;
      dp[i][j] = Math.min(left, down, leftDown);
    }
  }
  return 1.0 - dp[n][m] / Math.max(m, n);
}


function detectNikkes(originalImg, options) {
  let nikkeContours = findContoursRect(originalImg, {
    thresh: options.thresh || 200,
    region: options.region,
    rectFilter: rect => {
      if (rect.width() * 5 < originalImg.width)
        return false;
      if (rect.width() * 2.5 < rect.height())
        return false;
      if (rect.width() * 1.5 > rect.height())
        return false;
      return true;
    }
  });
  let nikkes = [];
  let specialNameReg = /[森杨D]/;
  for (let con of nikkeContours) {
    let w = Math.floor(con.width() / 4);
    let h = Math.floor(con.height() / 5);
    let clipImg = images.clip(originalImg, con.left + w, con.top + h * 4, w * 3, h);
    // images.save(clipImg, `./images/nikkerror/${con.left}_${con.top}.jpg`);
    for (let k = 3; k <= 16; ++k) {
      let ocr;
      if (k == 3)
        ocr = gmlkit.ocr(clipImg, 'zh');
      else {
        let scaleimg = images.scale(clipImg, k, k, 'CUBIC');
        ocr = gmlkit.ocr(scaleimg, 'zh');
        scaleimg.recycle();
      }
      if (ocr == null)
        continue;
      ocr = ocr.toArray(3).toArray();
      if (ocr.length == 0)
        continue;
      let rightBottom = ocr.reduce((a, b) => {
        let t = a.bounds.bottom - b.bounds.bottom;
        if (Math.abs(t) < 10)
          return a.bounds.right > b.bounds.right ? a : b;
        return t > 0 ? a : b;
      });
      let name = rightBottom.text.replace(/([一\s\-·,]|[：:]$|^[G])/g, '');
      if (name.length < 2 && !specialNameReg.test(name))
        continue;
      nikkes.push({
        name: name,
        bounds: con,
        scale: k == 3 ? 1 : k,
        confidence: rightBottom.confidence
      })
      break;
    }
    clipImg.recycle();
  }
  console.info(`当前页面：${nikkes.map(x => x.name).join('、')}`);
  return nikkes;
}

function checkAuto(sleepTime) {
  let NIKKEstorage = storages.create("NIKKEconfig");
  if (!NIKKEstorage.get('checkGameAuto', true)) {
    if (firstCheckAuto) {
      log('已设置不检查自动瞄准&爆裂');
      firstCheckAuto = false;
    }
    return;
  }
  // 把这一部分放在前面，为了检测已进入战斗
  sleep(sleepTime || 5000);
  let autoBtn = ocrUntilFound((res, img) => res.find(e =>
    e.text.includes('AUT') && e.bounds != null &&
    e.bounds.left <= img.width / 2
  ), 40, 1000);
  if (!firstCheckAuto) {
    log('本次运行已检查自动瞄准&爆裂，不再检查');
    return;
  }
  log('检查自动瞄准&爆裂…');
  if (autoBtn == null) {
    log('未检测到AUTO按钮');
    return;
  }
  let y = Math.max(autoBtn.bounds.top - autoBtn.bounds.height() * 2, 0);
  let w = autoBtn.bounds.right + autoBtn.bounds.width();
  let h = autoBtn.bounds.bottom + autoBtn.bounds.height() * 2 - y;
  let res = [], img = null;
  for (let i = 0; i < 20; ++i) {
    img = captureScreen();
    let c = img.pixel(autoBtn.bounds.left, autoBtn.bounds.top);
    let insideGray = Math.round(rgbToGray(c)), outsideGray = 0.0;
    for (let tx of [0, w])
      for (let ty of [0, h + y])
        outsideGray += rgbToGray(img.pixel(tx, ty));
    outsideGray = Math.round(outsideGray / 4);
    // 有可能无法通过这一步检查
    if (insideGray >= outsideGray)
      continue;
    let grayScale = 0.4;
    let grayDiff = Math.round(grayScale * 0.5 * (outsideGray - insideGray));
    insideGray += grayDiff;
    outsideGray -= grayDiff;
    res = findContoursRect(img, {
      thresh: random(insideGray, outsideGray),
      region: [0, y, w, h],
      rectFilter: rect =>
        rect.height() >= autoBtn.bounds.height() * 2 &&
        rect.top < autoBtn.bounds.top &&
        rect.bottom > autoBtn.bounds.bottom &&
        rect.centerX() < autoBtn.bounds.centerX(),
      // debug: true
    });
    if (
      res.length == 2 &&
      res[0].right < res[1].left &&
      Math.abs(res[0].top - res[1].top) < 10
    )
      break;
    sleep(500);
  }
  if (res.length != 2) {
    log('自动瞄准&爆裂检查失败');
    log(res);
    return;
  }
  let i = 0;
  for (let retry = 0; retry < 10 && i < 2; retry++) {
    let btn = res[i];
    let name = '自动' + (i == 0 ? '瞄准' : '爆裂');
    let region = [btn.left, btn.top, btn.width(), btn.height()];
    let redColor = images.findColor(img, '#d65100', {
      region: region,
      threshold: 80
    });
    let grayColor = images.findColor(img, '#7d8789', {
      region: region,
      threshold: 50
    });
    i += 1;
    if (redColor != null && grayColor == null)
      log(`${name}已打开`);
    else if (redColor == null && grayColor != null) {
      log(`${name}未打开，点击打开`);
      clickRect({ bounds: btn }, 0.8, 200);
    } else {
      log(`${name}状态不定，重试`);
      sleep(500);
      i -= 1;
      img = captureScreen();
      continue;
    }
  }
  if (i == 2)
    firstCheckAuto = false;
}

const GAME_TITLE = {
  selector: id('game_title').textContains('妮姬')
};
const RUNNING_CHECK = {
  selector: id('tv_title').textContains('妮姬')
}
const GAME_SWITCH = {
  selector: id('btn_start_game')
};

function startFromOurPlay() {
  requestScreenCaptureAuto();
  const CLICK_TO_START = {
    selector: text('点击打开游戏')
  };
  let i = 0;
  app.launchApp('OurPlay');
  for (i = 0; i < 50; ++i) {
    sleep(1000);
    screenshot();
    if (appear(RUNNING_CHECK)) {
      break;
    }
    if (appearThenClick(GAME_TITLE)) {
      continue;
    }
    if (closeAds()) {
      continue;
    }
    if (currentPackage() != 'com.excean.gspace')
      app.launchApp('OurPlay');
  }
  if (i == 50) {
    throw new Error('无法打开OurPlay或没有在OurPlay中找到游戏');
  }
  for (let i = 0; i < 50; ++i) {
    if (i != 0) {
      sleep(500);
    }
    if (appear(RUNNING_CHECK, 0)) {
      if (appear(GAME_SWITCH, 2000)) {
        if (GAME_SWITCH.text) {
          log(GAME_SWITCH.text);
          if (GAME_SWITCH.text.startsWith('正在')) {
            continue;
          }
        }
      }
      if (appearThenClick(CLICK_TO_START, 5000)) {
        continue;
      }
    } else {
      break;
    }
  }
  log('进入游戏');
}
function quitOurPlay() {
  app.launchApp('OurPlay');
  for (let i = 0; i < 50; ++i) {
    sleep(1000);
    if (appear(GAME_TITLE)) {
      break;
    }
    if (appear(RUNNING_CHECK) && appearThenClick(GAME_SWITCH)) {
      continue;
    }
    if (currentPackage() != 'com.excean.gspace')
      app.launchApp('OurPlay');
  }
  killApp('OurPlay');
}

function closeAds() {
  const [width, height] = getDisplaySize();
  const SKIP_AD = {
    text: '跳过',
    selector: textMatches(/^.{0,3}跳过([\s\d]+)?$/),
    regex: /^.{0,3}跳过/
  };
  const COUPON = {
    text: '优惠券',
    selector: id('draw_coupon_now')
  }
  const CLOSE_AD_0 = {
    text: '关闭广告',
    selector: id('close_render_ad')
  };
  const CLOSE_AD_1 = {
    text: '关闭广告图标',
    selector: packageName('com.excean.gspace')
      .classNameContains('Image')
      .boundsInside(0, 0, width, height / 2)
      .filter((w) => {
        if (w.bounds().width() > 80 || w.bounds().height() > 80)
          return false;
        const isAd = x => x != null &&
          x.bounds().width() < width &&
          x.bounds().width() >= width * 0.5 &&
          x.bounds().height() >= Math.min(300, height * 0.5);
        let p = w.parent();
        for (let _ = 0; _ < 3; ++_) {
          if (isAd(p)) {
            return true;
          }
          if (!p) {
            break;
          }
          p = p.parent();
        }
        return false;
      })
  }
  if (appearThenClick(SKIP_AD)) {
    return true;
  }
  if (appear(COUPON)) {
    log(`出现${COUPON.text}，返回`);
    back();
    return true;
  }
  if (appearThenClick(CLOSE_AD_0)) {
    return true;
  }
  if (appearThenClick(CLOSE_AD_1)) {
    return true;
  }
  return false;
}