var { 启动NIKKE, 退出NIKKE, 返回首页 } = require('./NIKKEutils.js');
var { 模拟室 } = require('./模拟室.js');
var {
  ocrUntilFound,
  clickRect,
  getDisplaySize
} = require('./utils.js');
let width, height;
let NIKKEstorage = storages.create("NIKKEconfig");
// 自行设定想打的对手名单，OCR精度不足，名字越简单越好
var arenaTargets = ['.*', '.*'];
if (typeof module === 'undefined') {
  auto.waitFor();
  checkConfig();
  try {
    启动NIKKE();
    日常();
  } catch (error) {
    log(error);
    log(error.stack);
  } finally {
    if (NIKKEstorage.get('exitGame', true))
      退出NIKKE();
  }
  exit();
}
else {
  module.exports = {
    日常: 日常
  };
}
function 日常() {
  [width, height] = getDisplaySize();
  const todoTask = JSON.parse(NIKKEstorage.get('todoTask', null));
  const simulationRoom = JSON.parse(NIKKEstorage.get('simulationRoom', null));
  const taskFunc = {
    商店: 商店,
    基地收菜: 基地收菜,
    好友: 好友,
    竞技场: 竞技场,
    爬塔: 爬塔,
    咨询: 咨询,
    模拟室: () => 模拟室(true, simulationRoom.maxPass,
                         simulationRoom.maxSsrNumber, 
                         simulationRoom.preferredBuff
                        )
  }
  for (let task of todoTask)
    taskFunc[task]();
}

function checkConfig() {
  const todoTask = JSON.parse(NIKKEstorage.get('todoTask', null));
  if (todoTask == null) {
    toastLog('未进行配置，请运行NIKKE设置.js并保存设置');
    exit();
  }
  const simulationRoom = JSON.parse(NIKKEstorage.get('simulationRoom', null));
  if (simulationRoom == null) {
    toast('配置存在问题，请重新运行NIKKE设置.js并保存设置');
    console.error('todoTask != null, simulationRoom == null');
    exit();
  }
}

function 商店() {
  clickRect(ocrUntilFound(res => res.find(e => e.text == '商店'), 10, 3000));
  log('进入商店');
  ocrUntilFound(res => res.text.includes('普通'), 20, 3000);
  var freeGood = ocrUntilFound(res => res.find(e => e.text.includes('100%')), 10, 300);
  if (freeGood != null) {
    clickRect(freeGood);
    clickRect(ocrUntilFound(res => res.find(e => e.text == '购买'), 10, 3000));
    clickRect(ocrUntilFound(res => res.find(e => e.text.includes('点击')), 10, 2000));
  }
  返回首页();
}
function 基地收菜() {
  clickRect(ocrUntilFound(res => res.find(e => e.text.includes('基地')), 10, 3000));
  log('进入基地');
  var target = ocrUntilFound(res => res.find(e => e.text.endsWith('公告栏')), 10, 3000);
  sleep(2000);
  click(target.bounds.centerX(), target.bounds.centerY() - 100);
  log('进入公告栏');
  sleep(1000);
  target = ocrUntilFound(res => res.find(e => e.text.includes('全部派')), 10, 3000);
  if (colors.red(captureScreen().pixel(target.bounds.right, target.bounds.top)) > 240) {
    clickRect(target);
    log('点击全部派遣');
    sleep(2000);
    target = ocrUntilFound(res => {
      var x = res.filter(e => e.text.match(/派.$/) != null);
      if (x.length > 3)
        return x;
      return null;
    }, 30, 400);
    clickRect(target[target.length - 1]);
    log('点击派遣');
    ocrUntilFound(res => res.find(e => e.text.includes('全部')), 10, 3000);
    sleep(1000);
  }
  else {
    target = ocrUntilFound(res => res.find(e => e.text.match('全部(领|領)') != null), 10, 3000);
    if (colors.red(captureScreen().pixel(target.bounds.right, target.bounds.top)) < 100) {
      clickRect(target);
      clickRect(ocrUntilFound(res => res.find(e => e.text.includes('点击')), 10, 3000));
      sleep(1000);
    }
  }
  back();
  clickRect(ocrUntilFound(res => res.find(e => e.text.includes('DEFENSE')), 20, 3000));
  log('OUTPOST DEFENSE');
  clickRect(ocrUntilFound(res => res.find(e => e.text.endsWith('歼灭')), 10, 3000));
  ocrUntilFound(res => res.text.includes('今日'), 10, 3000);
  clickRect(ocrUntilFound(res => res.find(e => e.text.startsWith('进行')), 10, 3000));
  target = ocrUntilFound(res => res.text.match(/(优先|点击)/), 10, 1000);
  if (target[0] == '优先')
    back();
  else if (target[0] == '点击')
    click(width / 2, height * 0.8);
  ocrUntilFound(res => res.text.includes('今日'), 10, 3000);
  back();
  clickRect(ocrUntilFound(res => res.find(e => e.text.includes('奖励')), 10, 3000));
  log('点击获得奖励');
  clickRect(ocrUntilFound(res => res.find(e => e.text.includes('点击')), 10, 3000));
  log('点击领取奖励');
  sleep(1000);
  target = ocrUntilFound(res => res.find(e => e.text.includes('点击')), 5, 300);
  if (target != null) {
    clickRect(target);
    log('升级了');
  }
  sleep(1000);
  返回首页();
}
function 好友() {
  clickRect(ocrUntilFound(res => res.find(e => e.text.includes('好友')), 10, 3000));
  log('点击好友');
  sleep(2000);
  var target = ocrUntilFound(res => res.find(e => e.text.endsWith('赠送')), 10, 3000);
  if (colors.red(captureScreen().pixel(target.bounds.left, target.bounds.top)) < 100) {
    clickRect(target);
    log('点击赠送');
    clickRect(ocrUntilFound(res => res.find(e => e.text.includes('确认')), 10, 3000));
    sleep(1000);
  }
  back();
}
function 爬塔() {
  clickRect(ocrUntilFound(res => res.find(e => e.text.includes('方舟')), 10, 3000));
  clickRect(ocrUntilFound(res => res.find(e => e.text.includes('无限之塔')), 10, 3000));
  clickRect(ocrUntilFound(res => res.find(e => e.text.includes('正常开启')), 10, 3000));
  for (let i = 0; i < 7; ++i) {
    var curTower = getIntoNextTower();
    if (curTower.match(/(无|限)/)) {
      log('没有下一个塔了');
      break;
    }
    var cnt = ocrUntilFound(res => {
      var t = res.text.match(/[余关]次[^\d]+(\d)\/3/);
      if (t != null)
        return parseInt(t[1]);
    }, 30, 300);
    log(`通关次数 ${cnt}/3`);
    if (cnt == 0)
      continue;
    sleep(5000);
    click(width / 2, height / 2 - 100);
    sleep(1000);
    clickRect(ocrUntilFound(res => res.find(e => e.text.includes('进入战斗')), 10, 3000));
    for (let j = 0; j < cnt; ++j) {
      sleep(9000);
      var target = ocrUntilFound(res => res.text.includes('AUTO'), 10, 3000);
      if (target == null)
        break;
      sleep(40 * 1000);
      ocrUntilFound(res => {
        if (res.text.includes('AUTO'))
          return false;
        if (res.text.includes('REWARD') || res.text.includes('FAIL'))
          return true;
      }, 30, 5000);
      sleep(1000);
      target = ocrUntilFound(res => res.find(
        e => e.text.match(/(下[^步方法]{2}|返回)/) != null
      ), 100, 100);
      if (target.text.includes('返回')) {
        clickRect(target);
        log('作战失败');
        break;
      }
      if (colors.blue(captureScreen().pixel(target.bounds.left, target.bounds.top)) < 200) {
        sleep(1000);
        click(width / 2, height / 2);
        break;
      }
      sleep(1000);
      clickRect(target);
    }
    sleep(5000);
  }
  返回首页();
}
function getIntoNextTower() {
  var target = ocrUntilFound(res => res.find(
    e => e.text.endsWith('之塔') && e.bounds.top > height / 2
  ), 20, 1000);
  sleep(1000);
  click(width - 50, target.bounds.centerY());
  sleep(2000);
  var curTower = ocrUntilFound(res => res.find(
    e => e.text.endsWith('之塔') && e.bounds.top > height / 2
  ), 20, 1000).text;
  log(`进入${curTower}`);
  return curTower;
}

function 竞技场() {
  clickRect(ocrUntilFound(res => res.find(e => e.text.includes('方舟')), 10, 3000));
  var arena = ocrUntilFound(res => res.find(e => e.text.includes('技场')), 10, 3000);
  var target = ocrUntilFound(res => res.find(e => e.text.startsWith('SPECIAL')), 10, 500);
  if (target != null) {
    clickRect(target);
    clickRect(ocrUntilFound(res => res.find(e => e.text.includes('点击')), 10, 3000));
  }
  clickRect(arena);
  clickRect(ocrUntilFound(res => res.find(e => e.text.includes('新人')), 10, 3000));
  const regexp = new RegExp(`(${arenaTargets.join('|')})`);
  const refresh = ocrUntilFound(res => res.find(e => e.text.includes('目录')), 10, 3000);
  const firstFight = ocrUntilFound(res => {
    var t = res.filter(e => e.text.endsWith('战斗') && e.level == 1);
    if (t.length == 3)
      return t[0];
  }, 10, 3000);
  while (true) {
    var t = ocrUntilFound(res => {
      if (res.text.includes('战斗'))
        return res.text;
      return null;
    }, 20, 3000);
    if (t.includes('免') == false)
      break;
    while (ocrUntilFound(res => res.text.match(regexp), 1, 0) == null) {
      clickRect(refresh);
      sleep(1000);
    }
    clickRect(firstFight);
    sleep(3000);
    clickRect(ocrUntilFound(res => res.find(e => e.text.endsWith('战斗')), 20, 3000));
    sleep(5000);
    ocrUntilFound(res => res.text.includes('RANK'), 20, 3000);
    sleep(1000);
    click(width / 2, height * 0.2);
  }
  返回首页();
}
function 咨询() {
  const counsel = JSON.parse(files.read('./nikke.json'));
  clickRect(ocrUntilFound(res => res.find(e => e.text == '妮姬'), 20, 3000));
  clickRect(ocrUntilFound(res => res.find(e => e.text == '咨询'), 20, 3000));
  var counselCnt = ocrUntilFound(res => {
    var t = res.text.match(/([oO\d])\/[789]/);
    if (t != null) {
      if (t[1] == 'o' || t[1] == 'O')
        return 0;
      return parseInt(t[1]);
    }
    return null;
  }, 20, 3000);
  log(`咨询次数：${counselCnt}`);
  for (let i = 0; i < counselCnt; ++i) {
    let cases = [], ranks = [];
    while (true) {
      [cases, ranks] = ocrUntilFound(res => {
        var x1 = res.filter(e => e.text.startsWith('CASE') && e.level == 1);
        var x2 = res.filter(e => e.text.includes('RANK') && e.level == 1);
        return [x1, x2];
      }, 20, 1000);
      if (cases.length != ranks.length)
        break;
      log('整页都咨询过了');
      swipe(width / 2, ranks[ranks.length - 1].bounds.top, width / 2, ranks[0].bounds.top, 5000);
      sleep(1000);
    }
    let ci = 0, ri = 0;
    if (cases.length > 0 && cases[0].bounds.bottom < ranks[0].bounds.top)
      ci++;
    for (ri = 0; ri < ranks.length - 1; ++ri) {
      if (ci < cases.length && cases[ci].bounds.bottom > ranks[ri].bounds.top && cases[ci].bounds.top < ranks[ri + 1].bounds.bottom)
        ci++;
      else
        break;
    }
    clickRect(ranks[ri]);
    单次咨询(counsel);
    back();
    ocrUntilFound(res => res.text.includes('可以'), 30, 3000);
  }
  返回首页();
}
function 单次咨询(counsel) {
  var screenOCR = ocrUntilFound(res => {
    if (res.text.includes('查看花'))
      return res;
    return false;
  }, 20, 3000);
  var target = screenOCR.find(
    e => e.text.includes('咨询') && e.bounds != null && e.bounds.top > height / 2 && e.bounds.left > width / 2
  );
  if (colors.blue(captureScreen().pixel(target.bounds.right, target.bounds.top)) < 200) {
    log('已完成今日咨询');
    sleep(1000);
    return;
  }
  var upperBound = screenOCR.find(e => e.text.includes('查看花') && e.bounds != null).bounds.top;
  var lowerBound = screenOCR.find(e => e.text.includes('下') && e.bounds != null).bounds.top;
  var nameOCR = screenOCR.find(e =>
    e.bounds != null && e.bounds.top > upperBound && e.bounds.bottom < lowerBound && e.bounds.right < width / 2
  ).text;
  var name = mostSimilar(nameOCR, Object.keys(counsel)).result;
  log(`咨询对象：${name}`);
  clickRect(target);
  clickRect(ocrUntilFound(res => res.find(
    e => e.text.includes('确认')
  ), 20, 3000));
  sleep(2000);
  // 连点直到出现选项
  var counselImage = images.read('./images/counsel.jpg');
  var result = null;
  while (true) {
    result = images.matchTemplate(captureScreen(), counselImage, {
      threshold: 0.7,
      max: 2,
      region: [0, height / 2, width / 2, height / 2]
    });
    if (result.matches.length == 2)
      break;
    click(width / 2, height / 2);
    sleep(1000);
  }
  var optionTop = result.topmost().point.y;
  var optionBottom = result.bottommost().point.y;
  var options = ocrUntilFound(res => {
    var t = res.filter(
      e => e.level == 1 && e.bounds.top >= optionTop
    );
    var t1 = null, t2 = null;
    for (let i of t) {
      if (i.bounds.top < optionBottom)
        t1 = i;
      else
        t2 = i;
    }
    if (t1 == null && t2 == null)
      return null;
    t1 = t1 == null ? "" : t1.text;
    t2 = t2 == null ? "" : t2.text;
    return [t1, t2];
  }, 10, 300);
  let whichOne = null, similarOne = -1;
  for (let i = 0; i < 2; ++i) {
    var t = mostSimilar(options[i], counsel[name]);
    log(`选项${i + 1}：${options[i]}`);
    log(`匹配：${t.result}，相似度${t.similarity}`);
    if (t.similarity > similarOne) {
      similarOne = t.similarity;
      whichOne = i;
    }
  }
  log(`咨询选择："${options[whichOne]}"`);
  if (whichOne == 0)
    click(width / 2, counselImage.getHeight() / 2 + optionTop);
  else
    click(width / 2, counselImage.getHeight() / 2 + optionBottom);
  counselImage.recycle();
  while (true) {
    target = ocrUntilFound(res => {
      if (res.text.includes('咨询'))
        return 'over';
      return res.find(e =>
        e.text.match(/[LAUTOG]/) == null && e.text.match(/SK.P/) != null
      );
    }, 3, 400);
    if (target != null) {
      if (target != 'over')
        clickRect(target);
      break;
    }
    click(width / 2, height / 2);
    sleep(500);
  }
  sleep(1000);
  ocrUntilFound(res => res.text.includes('咨询'), 20, 3000);
  var target = ocrUntilFound(res => res.find(
    e => e.text == '确认'
  ), 5, 300);
  if (target != null) {
    log('RANK INCREASE');
    clickRect(target);
  }
  ocrUntilFound(res => res.text.includes('查看花'), 10, 3000);
}
function mostSimilar(target, candidates) {
  var res = null, maxSim = -1;
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