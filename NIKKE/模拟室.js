var {
  ocrUntilFound,
  clickRect,
  getRandomArea,
  findImageByFeature,
  getDisplaySize,
  appear,
  appearThenClick,
  screenshot,
  ocrInfo
} = require('./utils.js');
var {
  启动NIKKE, 等待NIKKE加载, 退出NIKKE,
  返回首页, mostSimilar, detectNikkes,
  checkAuto
} = require('./NIKKEutils.js');
let width, height;
let curPass = 0;
if (typeof module === 'undefined') {
  let {
    unlockIfNeed,
    requestScreenCaptureAuto
  } = require('./utils.js');
  auto.waitFor();
  unlockIfNeed();
  requestScreenCaptureAuto();

  const maxRetry = storages.create("NIKKEconfig").get('maxRetry', 1);
  for (let alreadyRetry = 0; alreadyRetry <= maxRetry; ++alreadyRetry) {
    try {
      if (alreadyRetry == 0)
        模拟室(false);
      else {
        等待NIKKE加载();
        模拟室(true);
      }
      break;
    } catch (error) {
      if (!error.message.includes('InterruptedException')) {
        toast(error.message);
        console.error(error.message);
        console.error(error.stack);
        if (alreadyRetry != maxRetry) {
          toastLog(`脚本出错，即将重试(${alreadyRetry + 1}/${maxRetry})`);
          sleep(3000);
          退出NIKKE();
          启动NIKKE();
        }
      } else
        break;
    }
  }
  if (images.stopScreenCapturer) {
    images.stopScreenCapturer();
  }
  exit();
}
else {
  module.exports = {
    模拟室: 模拟室
  };
}
/*
 * fromIndex: 当前画面是否是游戏首页
 * maxPass: 最多执行多少轮次
 * maxSsrNumber: 最多要刷多少个SSR
 * preferredBuff: 只考虑这些buff
 */
function 模拟室(fromIndex) {
  const NIKKEstorage = storages.create("NIKKEconfig");
  const simulationRoom = JSON.parse(NIKKEstorage.get('simulationRoom', null));
  if (simulationRoom == null) {
    toast('未配置模拟室选项，请运行NIKKE设置.js并保存设置');
    exit();
  }
  [width, height] = getDisplaySize();
  let { maxPass, maxSsrNumber, preferredBuff, tryDiffArea, team } = simulationRoom;
  tryDiffArea = tryDiffArea || 0;
  team = team || [];
  maxSsrNumber = Math.min(maxSsrNumber, preferredBuff.length, Object.keys(getAllBuff()).length);
  let tryDiff = (Math.floor(tryDiffArea / 3) + 3).toString();
  let tryArea = tryDiffArea % 3;
  if (fromIndex) {
    ocrUntilFound((res, img) => {
      if (res.text.includes('开始') || res.text.includes('结'))
        return true;
      let arkBtn = res.find(e =>
        e.text.includes('方舟') && e.bounds != null &&
        e.bounds.bottom > img.height / 2
      );
      if (arkBtn != null) {
        clickRect(arkBtn, 1, 0);
        return null;
      }
      let simBtn = res.find(e =>
        e.text.includes('模拟室') && e.bounds != null &&
        e.bounds.bottom > img.height * 0.4
      );
      if (simBtn != null) {
        clickRect(simBtn, 1, 0);
        return null;
      }
    }, 50, 1000);
  }
  quitPrevSim();
  // 检查今日模拟室是否已完成
  if (fromIndex && clickIntoDiffArea(tryDiff, tryArea, true)) {
    toastLog('完成模拟室任务');
    返回首页();
    return;
  }
  let status = {
    loaded: getBuffLoaded(),
    preferredBuff: preferredBuff,
    team: team,
    layer: 0,
    bestBuffToKeep: null,  // 最后保留的buff，必须正确初始化
    newBuffs: {},          // 主要作用是防止选到重复buff，导致需要进行更换
    earlyStop: false,
    mode: '刷buff'
  };
  for (; curPass < maxPass; ++curPass) {
    status.earlyStop = false;
    status.bestBuffToKeep = {
      name: null,
      level: null
    };
    status.newBuffs = {};
    status.mode = '刷buff';
    log('已有BUFF：', Object.keys(status.loaded));
    if (Object.keys(status.loaded).length >= maxSsrNumber) {
      for (let buff of Object.values(status.loaded))
        if (buff.level != 'SSR') {
          status.mode = '刷SSR';
          break;
        }
      if (status.mode == '刷buff')
        break;
    }
    toastLog(`第${curPass + 1}轮模拟室：${status.mode}模式`);
    oneSimulation(status);
  }
  if (tryDiffArea != 0) {
    status.tryDiff = tryDiff;
    status.tryArea = tryArea;
    let diffAreaName = `${status.tryDiff}${String.fromCharCode('A'.charCodeAt(0) + status.tryArea)}`;
    status.bestBuffToKeep = {
      name: null,
      level: null
    };
    status.newBuffs = {};
    status.mode = '尽力而为';
    toastLog(`尝试${diffAreaName}`);
    log('已有BUFF：', Object.keys(status.loaded));
    let maxRetry = team.length > 0 ? 15 : 3;
    for (let retry = 0; retry < maxRetry; ++retry) {
      status.earlyStop = false;
      status.team = team;
      oneSimulation(status);
      if (status.earlyStop)
        log(`尝试${diffAreaName}失败(${retry + 1}/${maxRetry})`);
      else {
        log(`尝试${diffAreaName}成功(${retry + 1}/${maxRetry})`);
        break;
      }
    }
  }
  toastLog('完成模拟室任务');
  if (fromIndex)
    返回首页();
}

function oneSimulation(status) {
  if ('tryDiff' in status)
    clickIntoDiffArea(status.tryDiff, status.tryArea, false);
  else
    clickIntoDiffArea('3', 0, false);
  if (tryQuickSimulation(status)) {
    return;
  }
  for (status.layer = 0; status.layer < 7; ++status.layer) {
    selectOption(status);
    if (status.earlyStop)
      break;
  }
  // 一轮模拟结束
  if (status.earlyStop) {
    clickRect(ocrUntilFound(res => res.find(e => e.text.match(/结[束東]$/) != null), 20, 300));
    clickRect(ocrUntilFound(res => res.find(e => e.text.endsWith('确认')), 10, 300));
  } else {
    log(`bestBuffToKeep = ${status.bestBuffToKeep.name}(${status.bestBuffToKeep.level})`);
    clickRect(ocrUntilFound((res, img) => res.find(e =>
      e.text.match(/结[束東]$/) != null &&
      e.bounds != null &&
      e.bounds.bottom > img.height / 2
    ), 20, 1000));
    sleep(600);
    clickRect(ocrUntilFound(res => res.find(e => e.text.endsWith('确认')), 10, 300));
    ocrUntilFound(res => res.text.match(/[迷选迭港遗]择/) != null, 10, 1000);
    sleep(600);
    let buff = null;
    if (!status.bestBuffToKeep.name) {
      if (status.mode != '尽力而为') {
        buff = getBuffs(1);
        buff = buff.length > 0 ? buff[0] : null;
      }
    }
    else
      buff = scanBuffs(status.bestBuffToKeep.name);
    let [chosenTarget, confirmBtn] = ocrUntilFound(res => {
      let t1 = buff;
      if (t1 == null)
        t1 = res.find(e => e.text.match(/不[^管]{0,2}[迷选迭港遗]择/) != null);
      let t2 = res.find(e => e.text.includes('确认'));
      if (!t1 || !t2)
        return null;
      return [t1, t2];
    }, 10, 300);
    clickRect(chosenTarget);
    sleep(600);
    clickRect(confirmBtn);
    // 表示选择了某个增益
    if ('name' in chosenTarget) {
      log('保留增益：', chosenTarget);
      // 替换buff
      if (chosenTarget.name in status.loaded) {
        sleep(600);
        clickRect(getBuffs(2)[1]);
        sleep(600);
        clickRect(ocrUntilFound(res => res.find(e => e.text.includes('确认')), 10, 300));
      }
      status.loaded[chosenTarget.name] = chosenTarget;
    } else {
      // 按照目前策略不可能什么增益都没有就打BOSS战结束模拟，仅作为保险
      clickRect(ocrUntilFound(res => res.find(e => e.text.includes('确认')), 10, 300));
    }
  }
  ocrUntilFound(res => res.text.includes('开始'), 30, 1000);
}
function tryQuickSimulation(status) {
  const 模拟结束 = {
    text: "模拟结束",
    regex: /结[束東]$/,
  };
  const 确认 = {
    text: "确认",
    regex: /确认$/,
  };
  const 开始模拟 = {
    text: "开始模拟",
    regex: /开始/,
  };
  const 快速模拟 = {
    text: "快速模拟",
    regex: /快[連德逮遠速]/,
  };
  let quick = false;
  for (let i = 0; i < 50; ++i) {
    sleep(300);
    screenshot();
    if (appear(模拟结束)) {
      break;
    }
    if (appearThenClick(确认)) {
      sleep(3000);
      continue;
    }
    if (appear(快速模拟)) {
      const c = ocrInfo.img.pixel(快速模拟.bounds.right, 快速模拟.bounds.centerY())
      if (colors.red(c) > 200) {
        clickRect(快速模拟, 1, 0);
        quick = true;
        sleep(1000);
        continue;
      }
    }
    if (appearThenClick(开始模拟)) {
      sleep(3000);
      continue;
    }
  }
  if (!quick) {
    return quick;
  }
  // 开始快速模拟
  const 取消 = {
    text: "取消",
    regex: /取/
  };
  const 跳过 = {
    text: "跳过增益效果选择",
    regex: /跳过/
  };
  const 不选择 = {
    text: "不选择",
    regex: /不[^管]{0,2}[迷选迭港遗]/
  };
  const 进入战斗 = {
    text: "进入战斗",
    regex: /入战.{1,3}$/,
    filter: (bounds, img) =>
      bounds &&
      bounds.bottom > img.height * 0.8 &&
      bounds.left > img.width * 0.5
  };
  const autoBtn = {
    regex: /AUT/
  };
  for (let i = 0; i < 50; ++i) {
    if (i != 0) {
      sleep(300);
      screenshot();
    }
    if (appear(autoBtn)) {
      checkAuto(1);
      break;
    }
    if (appear(进入战斗)) {
      teamUp(status);
      clickRect(进入战斗, 1, 0);
      continue;
    }
    if (appear(取消) && appearThenClick(确认)) {
      continue;
    }
    if (appearThenClick(跳过)) {
      sleep(1000);
      continue;
    }
    if (appearThenClick(不选择)) {
      continue;
    }
  }
  sleep(5 * 1000);
  const 返回 = {
    text: '返回',
    regex: /返回/,
    filter: (bounds, img) =>
      bounds &&
      bounds.bottom > img.height * 0.7 &&
      bounds.right <= img.width / 2
  };
  const 作战失败 = {
    text: '作战失败',
    regex: /FA.LED/
  };
  const 作战成功 = {
    regex: /(点击|任意处)/
  };
  const randomArea = getRandomArea(ocrInfo.img, [0.2, 0.4, 0.7, 0.6]);
  let failed = false;
  for (let i = 0; i < 50; ++i) {
    if (i != 0) {
      sleep(1000);
      screenshot();
    }
    if (appear(作战成功)) {
      break;
    }
    if (appear(作战失败)) {
      failed = true;
      break;
    }
    if (appear(autoBtn)) {
      sleep(1000);
      continue;
    }
  }
  if (failed) {
    status.earlyStop = true;
    for (let i = 0; i < 50; ++i) {
      if (i != 0) {
        sleep(400);
        screenshot();
      }
      if (appear(开始模拟)) {
        break;
      }
      if (appearThenClick(确认)) {
        continue;
      }
      if (appearThenClick(模拟结束)) {
        continue;
      }
      if (appear(作战失败) && appearThenClick(返回)) {
        continue;
      }
    }
  } else {
    const 结束模拟 = {
      text: "结束模拟",
      regex: /结[束東]/,
      filter: (bounds, img) =>
        bounds &&
        bounds.bottom > img.height / 2
    };
    for (let i = 0; i < 50; ++i) {
      if (i != 0) {
        sleep(400);
        screenshot();
      }
      if (appear(开始模拟)) {
        break;
      }
      if (appear(作战成功)) {
        clickRect(randomArea, 1, 0);
        continue;
      }
      if (appearThenClick(确认)) {
        continue;
      }
      if (appearThenClick(结束模拟)) {
        continue;
      }
    }
  }
  return true;
}

function quitPrevSim() {
  let pageState = ocrUntilFound(res => {
    if (res.text.includes('开始'))
      return 'beginSim';
    if (!res.text.includes('结')) {
      console.error('未知模拟室页面');
      log(res.text);
      return null;
    }
    let ret = null;
    let keywords = [
      '机会', '连结',
      '体力', '入战', 'RESET'
    ];
    let results = [
      'specUp', 'selectBuff',
      'ICU', 'combat', 'selectOption'
    ];
    for (let i = 0; i < keywords.length; ++i)
      if (res.text.includes(keywords[i])) {
        ret = results[i];
        break;
      }
    if (ret == 'selectBuff' && res.text.includes('EP'))
      ret = 'selectBuffEPIC';
    return ret;
  }, 10, 1000);
  if (pageState == null)
    throw new Error('未知模拟室页面');
  log(`模拟室当前页面：${pageState}`);
  if (pageState == 'beginSim')
    return;
  if (pageState == 'combat')
    clickRect(getRandomArea(captureScreen(), [0.2, 0.3, 0.8, 0.7]), 1, 0);
  else if (pageState != 'selectOption') {
    clickRect(ocrUntilFound(res => res.find(e => e.text.match(/(不[^管]{0,2}[迷选迭港遗]择$|体力)/) != null), 10, 500));
    clickRect(ocrUntilFound(res => res.find(e => e.text.endsWith('确认')), 10, 500));
    if (pageState == 'ICU')
      ocrUntilFound(res => res.text.match(/[已己巳]/) != null, 10, 1000);
    else if (pageState == 'selectBuffEPIC')
      ocrUntilFound(res => res.text.includes('RESET'), 10, 1000);
    if (!pageState.startsWith('selectBuff'))
      clickRect(ocrUntilFound(res => res.find(e => e.text.match(/(確認|确认)/) != null), 10, 1000));
  }
  let [keepBuff, confirmBtn] = ocrUntilFound((res, img) => {
    let btn = res.find(e => e.text.endsWith('确认'));
    if (!btn) {
      let quitBtn = res.find(e =>
        e.text.match(/结[^果]$/) != null && e.bounds != null &&
        e.bounds.bottom > img.height / 2
      );
      if (quitBtn === null)
        quitBtn = res.find(e =>
          e.text.match(/结[^果]$/) != null && e.bounds != null &&
          e.bounds.bottom < img.height / 2 && e.bounds.left > img.width / 2
        );
      clickRect(quitBtn, 1, 0);
      return null;
    }
    if (res.text.match(/(成功|可保)/) != null)
      return [true, btn];
    if (res.text.match(/(失败|无法)/) != null)
      return [false, btn];
    return null;
  }, 20, 1000);
  clickRect(confirmBtn);
  if (keepBuff) {
    clickRect(ocrUntilFound(res => res.find(e => e.text.match(/不[^管]{0,2}[迷选迭港遗]择/) != null), 10, 500));
    clickRect(ocrUntilFound(res => res.find(e => e.text.endsWith('确认')), 10, 500));
    clickRect(ocrUntilFound(res => res.find(e => e.text.endsWith('确认')), 10, 1000));
  }
  ocrUntilFound(res => res.text.includes('开始'), 10, 3000);
}

function getBuffLoaded() {
  let ret = {};
  clickRect(ocrUntilFound(res => res.find(e => e.text.startsWith('BUFF')), 10, 1000));
  sleep(1000);
  ret = scanBuffs(null);
  back();
  return ret;
}

function getSelectedDiffArea(ocrRes) {
  const diffText = ocrRes.find(e => e.text.match(/^.{0,2}难度.{0,2}$/) != null);
  const areaText = ocrRes.find(e => e.text.match(/^.{0,2}地区.{0,2}$/) != null);
  const rewardText = ocrRes.find(e => e.text.match(/^.{0,2}奖励.{0,2}$/) != null);
  if (!diffText || !areaText || !rewardText) {
    console.error('没有找到难度、地区、奖励的文字');
    return null;
  }
  const startBtn = ocrRes.find(e =>
    e.text.includes('开始') && e.bounds != null &&
    e.bounds.top > rewardText.bounds.bottom
  );
  if (!startBtn)
    return null;
  const finished = ocrRes.find(e =>
    e.bounds != null && e.bounds.top >= rewardText.bounds.bottom &&
    e.bounds.bottom <= startBtn.bounds.top &&
    e.text.match(/[该地区已通关重置后可获得奖励]{3,}/) != null
  );
  let diffs = ocrRes.toArray(3).toArray().filter(e =>
    e.text.match(/^[12345]$/) != null && e.bounds != null &&
    e.bounds.bottom > diffText.bounds.bottom &&
    e.bounds.top < areaText.bounds.top
  );
  if (diffs.length != 5) {
    diffs = ocrRes.toArray(3).toArray().filter(e =>
      e.text.match(/(^[difculty\s]{5,}|^L[OCKED]{2,})/) != null && e.bounds != null &&
      e.bounds.bottom > diffText.bounds.bottom &&
      e.bounds.top < areaText.bounds.top
    );
    if (diffs.length != 5) {
      console.error('没有找到表示难度的5个选项');
      return null;
    }
  }
  const areas = ocrRes.toArray(3).toArray().filter(e =>
    e.text.match(/[\d\s+,\.]{4,10}/) != null && e.bounds != null &&
    e.bounds.bottom > areaText.bounds.bottom &&
    e.bounds.top < rewardText.bounds.top
  );
  if (areas.length != 3) {
    console.error('没有找到表示地区的3个选项');
    return null;
  }
  diffs.sort((a, b) => {
    let t = a.bounds.top - b.bounds.top;
    if (Math.abs(t) < 20)
      return a.bounds.left - b.bounds.left;
    return t;
  });
  areas.sort((a, b) => a.bounds.left - b.bounds.left);
  for (let i = 0; i < 5; ++i) {
    if (diffs[i].text != i + 1 + '') {
      diffs[i].text = i + 1 + '';
      // 可能识别成'difficulty 3'等
      diffs[i].bounds.right -= diffs[i].bounds.width() / 2;
    }
  }
  for (let i = 0; i < 3; ++i) {
    areas[i].text = 'ABC'[i];
  }
  ret = { diffs: diffs, areas: areas, finished: finished != null };
  const diffSelectedText = ocrRes.find(e =>
    e.text.match(/[SELCTD]{4,}/) != null && e.bounds != null &&
    e.bounds.bottom > diffText.bounds.bottom &&
    e.bounds.top < areaText.bounds.top
  );
  const areaSelectedText = ocrRes.find(e =>
    e.text.match(/[SELCTD]{4,}/) != null && e.bounds != null &&
    e.bounds.bottom > areaText.bounds.bottom &&
    e.bounds.top < rewardText.bounds.top
  );
  if (!diffSelectedText || !areaSelectedText) {
    console.error('没有找到SELECTED');
    return ret;
  }
  // ES5 没有findLast
  let diffSelected = null;
  for (let i = 4; i >= 0; --i) {
    let b = diffs[i].bounds;
    if (b.left < diffSelectedText.bounds.right + diffSelectedText.bounds.width() / 2 &&
      b.bottom < diffSelectedText.bounds.bottom) {
      diffSelected = diffs[i];
      break;
    }
  }
  const areaSelected = areas.find(x =>
    x.bounds.left > areaSelectedText.bounds.left
  );
  if (!diffSelected || !areaSelected) {
    console.error('没有找到选中的选项');
    return ret;
  }
  ret.diffSelected = diffSelected.text;
  ret.areaSelected = areaSelected.text;
  return ret;
}
/*
 * diff: '1', '2', '3', '4', '5'
 * area: 0, 1, 2
 */
function clickIntoDiffArea(diff, area, checkFinished) {
  // 开始 -> 选择
  const intoSelect = ocrUntilFound(res => {
    const checked = res.find(e => e.text.match(/^.{0,2}(地区|难度|奖励).{0,2}$/) != null);
    if (checked != null)
      return true;
    const begin = res.find(e => e.text.startsWith('开始'));
    if (begin != null)
      clickRect(begin, 1, 0);
    return false;
  }, 5, 500);
  if (!intoSelect) {
    throw new Error('无法开始模拟');
  }
  const [finished] = ocrUntilFound(res => {
    const selected = getSelectedDiffArea(res);
    if (!selected)
      return false;
    log(`当前选择：${selected.diffSelected}${selected.areaSelected}`);
    if (selected.diffSelected != diff) {
      clickRect(selected.diffs[parseInt(diff) - 1], 1, 0);
      if (area)
        clickRect(selected.areas[area], 1, 500);
      return false;
    }
    if (selected.areaSelected != 'ABC'[area]) {
      clickRect(selected.areas[area], 1, 0);
      return false;
    }
    return [selected.finished];
  }, 10, 700) || [false];
  if (checkFinished == true) {
    back();
    ocrUntilFound(res => res.text.includes('开始'), 30, 1000);
  }
  return finished;
}

function selectOption(status) {
  let optionNumber = status.layer == 6 ? 1 : 2;
  if ('tryDiff' in status && status.tryDiff != '3')
    optionNumber = Math.min(3, 7 - status.layer);
  const options = getOptions(optionNumber);
  let bestOption = null;
  let optionTypePriority = {};
  if (status.mode == '刷SSR') {
    // 强化 > 归队 > NORMAL > HARD > 指挥能力测试
    optionTypePriority = {
      specUp: 0,
      ICU: 1,
      normal: 2,
      hard: 3,
      abilitiesTest: 4
    };
    bestOption = options.reduce((prev, curr) => {
      return optionTypePriority[prev.type] < optionTypePriority[curr.type] ? prev : curr;
    });
  } else {
    if (status.mode == '刷buff')
      // NORMAL > 强化 > 归队 > HARD > 指挥能力测试
      optionTypePriority = {
        normal: 0,
        specUp: 1,
        ICU: 2,
        hard: 3,
        abilitiesTest: 4
      };
    else
      optionTypePriority = {
        ICU: 0,
        specUp: 1,
        normal: 2,
        abilitiesTest: 3,
        hard: 4
      };
    let buffPriority = {};
    let buffScore = 1;
    for (let [buffName, buff] of Object.entries(getAllBuff())) {
      if (status.mode == '刷buff') {
        // 没必要考虑优先级低于bestBuffToKeep的buff类型
        // 比如已经刷到高品质粉末，就可以无视操作型增益了
        if (status.bestBuffToKeep.name == buffName)
          break;
        if (
          status.preferredBuff.includes(buffName) && !status.loaded[buffName] &&
          !status.newBuffs[buffName] && !buffPriority[buff.buffType]
        )
          buffPriority[buff.buffType] = buffScore++;
      } else if (
        !status.loaded[buffName] &&
        !status.newBuffs[buffName] && !buffPriority[buff.buffType]
      )
        buffPriority[buff.buffType] = buffScore++;
    }
    // 已经刷够的buff类型优先级比other还低
    buffPriority['other'] = buffScore++;
    bestOption = options.reduce((prev, curr) => {
      if (prev.type == curr.type) {
        if (prev.type == 'normal' || prev.type == 'hard') {
          let s1 = buffPriority[prev.buffType];
          let s2 = buffPriority[curr.buffType];
          if (!s1)
            s1 = buffScore;
          if (!s2)
            s2 = buffScore;
          return s1 < s2 ? prev : curr;
        }
        return prev;
      }
      return optionTypePriority[prev.type] < optionTypePriority[curr.type] ? prev : curr;
    });
  }
  log('备选选项：', options);
  log('选择：', bestOption);
  doWithOption(bestOption, status);
  return;
}

function doWithOption(option, status) {
  if (option.type == 'specUp' && status.mode == '刷buff' && !status.bestBuffToKeep.name) {
    status.earlyStop = true;
    for (let buff of Object.values(status.loaded))
      if (buff.level != 'SSR') {
        status.earlyStop = false;
        break;
      }
    if (status.earlyStop)
      return;
  }
  clickRect(option, 0.1);
  sleep(1000);
  if (option.type == 'abilitiesTest') {
    let keywords = [
      /不[^管]{0,2}[迷选迭港遗]/,
      /体力/,
      /第[一二三]个/
    ];
    let optionLoadedCnt = 0;
    let [choice, keywordType] = ocrUntilFound((res, img) => {
      if (res.text.includes('确认'))
        optionLoadedCnt++;
      if (optionLoadedCnt < 2)
        return null;
      for (let i = 0; i < keywords.length; ++i)
        if (keywords[i].test(res.text)) {
          let t = res.filter(e => keywords[i].test(e.text));
          if (i == 0)
            return [t[0], i];
          for (let j of t) {
            // 检查选项是否可选
            let c = images.pixel(img, j.bounds.left, j.bounds.top);
            if (colors.isSimilar(c, colors.WHITE, 20))
              return [j, i];
          }
        }
      return null;
    }, 30, 500);
    clickRect(choice);
    clickRect(ocrUntilFound(res => {
      if (keywordType == 0 && res.text.match(/[什么都没有发生3分之2]{3}/) == null) {
        clickRect(choice, 1, 0);
      }
      return res.find(e => e.text.includes('确认'));
    }, 30, 1000));
    let roomCnt = 0;
    let testDone = ocrUntilFound(res => {
      if (keywordType == 0 && res.text.match(/不[^管]{0,2}[迷选迭港遗]/) != null)
        return null;
      if (res.text.match(/ON[\s\S]*ROOM[\s\S]*RESET/) != null)
        return roomCnt++ >= 3;
      let t = res.find(e => e.text.match(/不[^管]{0,2}[迷选迭港遗].$/) != null);
      if (t != null)
        clickRect(t, 1, 0);
      if (res.text.includes('确认'))
        clickRect(res.find(e => e.text.includes('确认')), 1, t == null ? 0 : 200);
      sleep(1000);
      return false;
    }, 20, 500);
    // 点了太多次确认
    if (!testDone) {
      let cancelBtn = ocrUntilFound(res => {
        if (res.text.includes('确认') && res.text.includes('取'))
          return res.find(e => e.text.match(/取[消清]/) != null);
        return null;
      }, 2, 500);
      log('无法处理当前情况，提前结束');
      if (cancelBtn != null)
        clickRect(cancelBtn);
      else
        back();
      status.earlyStop = true;
    }
    return;
  }
  if (option.type == 'ICU') {
    sleep(2000);
    let [firstOption, confirmBtn] = ocrUntilFound(res => {
      let t1 = res.find(e => e.text.includes('所有'));
      let t2 = res.find(e => e.text.includes('确认'));
      if (!t1 || !t2)
        return null;
      return [t1, t2];
    }, 10, 600);
    clickRect(firstOption);
    sleep(600);
    clickRect(confirmBtn);
    sleep(1000);
    clickRect(ocrUntilFound(res => res.find(e => e.text.match(/(確認|确认)/) != null), 10, 2000));
    return;
  }
  if (option.type == 'specUp') {
    sleep(2000);
    const [cancelBtn, confirmBtn, ssrOption] = ocrUntilFound(res => {
      if (!res.text.includes('机会'))
        return null;
      let t1 = res.find(e => e.text.match(/不[^管]{0,2}[迷选迭港遗]择$/) != null);
      let t2 = res.find(e => e.text.includes('确认'));
      let t3 = null;
      if (!t1 || !t2)
        return null;
      if (res.text.match(/(条件|无法)/) == null) {
        let firstOption = res.find(e => e.text.endsWith('选项'));
        if (firstOption == null)
          return null;
        t3 = res.find(e =>
          e.bounds != null &&
          e.bounds.bottom > firstOption.bounds.bottom &&
          e.bounds.bottom < t1.bounds.top
        );
        if (!t3 || t3.text.match(/[增益效果级型强化]+/) == null)
          return null;
      }
      return [t1, t2, t3];
    }, 20, 1000);
    if (ssrOption != null)
      log('提升选项：', ssrOption.text);
    if (
      ssrOption != null && ssrOption.text.match(/[5s]{2}R/i) &&
      status.bestBuffToKeep.level != 'SSR'
    ) {
      clickRect(ssrOption);
      sleep(600);
      clickRect(confirmBtn);
      sleep(600);
      if (ssrOption.text.includes('所有'))
        clickRect(ocrUntilFound(res => {
          if (res.text.match(/[已巳己]提升/) == null)
            return null;
          return res.find(e => e.text.match(/(確認|确认)/) != null);
        }, 10, 1000));
      else {
        // 等一下
        ocrUntilFound(res => res.text.includes('览'), 30, 1000);
        if (!status.bestBuffToKeep.name)
          clickRect(getBuffs(1)[0]);
        else
          clickRect(scanBuffs(status.bestBuffToKeep.name));
        clickRect(ocrUntilFound(res => res.find(e => e.text.endsWith('确认')), 10, 500));
        clickRect(ocrUntilFound(res => res.find(e => e.text.match(/(確認|确认)/) != null), 10, 1000));
      }
    } else {
      // 没有刷到SSR提升选项，提前结束
      if (status.mode == '刷SSR' || !status.bestBuffToKeep.name)
        status.earlyStop = true;
      clickRect(cancelBtn);
      clickRect(ocrUntilFound(res => {
        if (res.text.match(/[什么取消发生]+/) == null)
          return null;
        return res.find(e => e.text.endsWith('确认'));
      }, 20, 500));
      clickRect(ocrUntilFound(res => {
        if (res.text.match(/[什么也没发生]+/) == null)
          return null;
        return res.find(e => e.text.match(/(確認|确认)/) != null);
      }, 20, 500));
    }
    return;
  }
  ocrUntilFound(res => {
    if (res.text.includes('射程')) {
      back();
      return null;
    }
    if (res.text.includes('入战'))
      return true;
    clickRect(option, 1, 0);
    return null;
  }, 10, 2000);
  teamUp(status);
  let quickFight = null;
  if (option.type == 'normal') {
    quickFight = ocrUntilFound(res => res.find(e => e.text.match(/快[連德逮遠速]/) != null), 30, 500);
    if (colors.red(images.pixel(captureScreen(), quickFight.bounds.left, quickFight.bounds.top)) < 200)
      quickFight = null;
  }
  if (quickFight != null) {
    clickRect(quickFight);
  } else {
    clickRect(ocrUntilFound(res => res.find(e => e.text.startsWith('进入')), 10, 300));
    checkAuto();
    sleep(10 * 1000);
    let result = ocrUntilFound(res => {
      if (!res.text.includes('STATUS'))
        return null;
      if (res.text.includes('点击'))
        return res.find(e => e.text.includes('点击'));
      if (res.text.includes('FAIL'))
        return res.find(e => e.text.includes('返回'));
      return null;
    }, 60, 2000);
    clickRect(result);
    if (result.text.includes('返回')) {
      ocrUntilFound(res => res.text.includes('入战'), 30, 1000);
      sleep(500);
      clickRect(getRandomArea(captureScreen(), [0.2, 0.3, 0.7, 0.6]), 1, 0);
      status.earlyStop = true;
      return;
    }
  }
  if (option.effect.match(/[模拟通关]+/) != null)
    return;
  ocrUntilFound(res => res.text.match(/[迷选迭港遗]择/) != null, 30, 1000);
  selectBuff(option.buffType, status);
}

function selectBuff(buffType, status) {
  let bestBuff = null;
  if (status.mode != '刷SSR') {
    const allBuff = getAllBuff();
    let buffOptions = getBuffs(3);
    log(`备选${buffType}型增益：`, buffOptions);
    // 过滤掉allBuff中不包括的buff
    // 过滤掉已有buff，包括本轮开始之前已有的和本轮开始后新增的
    buffOptions = buffOptions.filter(x =>
      x.name in allBuff &&
      x.forSomebody == allBuff[x.name].forSomebody &&
      !(x.name in status.loaded) &&
      !(x.name in status.newBuffs)
    );
    if (status.mode == '刷buff')
      buffOptions = buffOptions.filter(x =>
        status.preferredBuff.includes(x.name)
      );
    if (buffOptions.length != 0) {
      let buffPriority = {};
      let buffScore = 1;
      for (let buffName of Object.keys(allBuff)) {
        buffPriority[buffName] = buffScore++;
      }
      buffPriority[null] = buffScore;
      bestBuff = buffOptions.reduce((prev, curr) => {
        let s1 = buffPriority[prev.name] + (curr.level == 'SSR' ? buffScore : 0);
        let s2 = buffPriority[curr.name] + (prev.level == 'SSR' ? buffScore : 0);
        return s1 < s2 ? prev : curr;
      }, status.bestBuffToKeep);
      if (bestBuff.name == status.bestBuffToKeep.name)
        bestBuff = null;
    }
    log('选择：', bestBuff);
  }
  const [cancelBtn, confirmBtn] = ocrUntilFound(res => {
    let t1 = res.find(e => e.text.match(/不[^管]{0,2}[迷选迭港遗]择$/) != null);
    let t2 = res.find(e => e.text.endsWith('确认'));
    if (!t1 || !t2)
      return null;
    return [t1, t2];
  }, 20, 300);
  const doCancel = () => {
    clickRect(cancelBtn);
    sleep(600);
    clickRect(ocrUntilFound(res => res.find(e => e.text.includes('确认')), 10, 300));
  };
  if (bestBuff == null) {
    doCancel();
  } else {
    clickRect(bestBuff);
    sleep(600);
    clickRect(confirmBtn);
    let [ok] = ocrUntilFound(res => {
      if (res.text.includes('RESET'))
        return [true];
      else if (res.text.match(/(相同|替换|取)/) != null)
        return [false];
      return null;
    }, 10, 300);
    if (ok === true) {
      status.newBuffs[bestBuff.name] = {
        name: bestBuff.name,
        level: bestBuff.level
      };
      if (status.mode == '刷buff')
        status.bestBuffToKeep = {
          name: bestBuff.name,
          level: bestBuff.level
        };
    } else {
      clickRect(ocrUntilFound(res => res.find(e => e.text.includes('取')), 10, 300));
      sleep(600);
      doCancel();
      if (!(bestBuff.name in status.newBuffs)) {
        status.loaded[bestBuff.name] = bestBuff;
        status.loaded[bestBuff.name].level = 'SSR';
      }
    }
  }
  sleep(1000);
}

function scanBuffs(wantedBuffName) {
  let wantedBuff = null;
  while (wantedBuff == null) {
    let allBuff = {};
    // 滑到最顶
    swipe(width / 2, height / 2, width / 2, height * 0.9, 800);
    swipe(width / 2, height / 2, width / 2, height * 0.9, 800);
    while (true) {
      sleep(1000);
      let buffs = getBuffs(0);
      if (buffs.length == 0)
        break;
      let i;
      for (i = buffs.length - 1; i >= 0; --i) {
        if (buffs[i].name in allBuff)
          break;
        if (buffs[i].name == wantedBuffName) {
          wantedBuff = buffs[i];
          break;
        }
        allBuff[buffs[i].name] = buffs[i];
      }
      if (i >= 0 || buffs.length < 2)
        break;
      const centerX = buffs[0].bounds.centerX();
      // 如果不是在模拟室首页调用getBuffLoaded，这里可能会出错
      // 因为该页面有另外一个位置满足endPoint
      const endPoint = ocrUntilFound(res => res.find(e => e.text.startsWith('拥有')), 10, 300);
      swipe(
        centerX, buffs[buffs.length - 1].bounds.bottom,
        centerX, endPoint.bounds.bottom,
        1000 * buffs.length
      );
    }
    if (!wantedBuffName)
      return allBuff;
  }
  return wantedBuff;
}

function getOptions(expectedOptionNumber) {
  const optionReg = {
    normal: /N[DO]R[NMI]{1,2}AL/,
    hard: /HAR[TDO]/,
    abilitiesTest: /[測测]试$/,
    ICU: /归队$/,
    specUp: /^强化/
  };
  const pattern = new RegExp(`(${Object.values(optionReg).map(x => x.source).join('|')})`);
  return ocrUntilFound((res, img) => {
    let t = res.filter(e => e.level == 3 && pattern.test(e.text)).toArray();
    if (t.length < expectedOptionNumber)
      return null;
    const verticalSplits = t.map(x => x.bounds.left).concat([img.width]);
    let ret = [];
    for (let i = 0; i < t.length; ++i) {
      let oneOption = { bounds: t[i].bounds };
      for (let [optionType, reg] of Object.entries(optionReg))
        if (reg.test(t[i].text)) {
          oneOption.type = optionType;
          break;
        }
      if (oneOption.type == 'hard' || oneOption.type == 'normal') {
        let effect = res.find(e =>
          e.bounds != null && e.level == 3 &&
          e.bounds.top > t[i].bounds.bottom &&
          e.bounds.left >= verticalSplits[i] &&
          e.bounds.right <= verticalSplits[i + 1] &&
          e.text.match(/[获得型增益效果模拟通关]/) != null
        );
        if (effect == null)
          return null;
        let buffType = 'other';
        const typeList = {
          '生存': /生存/,
          '攻击': /[攻政玫]击/,
          '操作': /操作/
        }
        for (let [name, reg] of Object.entries(typeList))
          if (reg.test(effect.text)) {
            buffType = name;
            break;
          }
        oneOption.buffType = buffType;
        oneOption.effect = effect.text;
      }
      ret.push(oneOption);
    }
    return ret;
  }, 20, 1000);
}

// 预计在当前画面能识别到至少expectedCount个增益效果
function getBuffs(expectedCount) {
  return ocrUntilFound((res, img) => {
    const r = res.filter(e => e.text.match(/^([5S]{0,2}R|.{0,2}EP..)$/i) != null && e.level == 3).toArray();
    const l = res.filter(e => e.text.match(/[連達连][結练绪结]等[級级]/) != null && e.level == 3).toArray();
    r.sort((a, b) => a.bounds.top - b.bounds.top);
    l.sort((a, b) => a.bounds.top - b.bounds.top);
    if (r.length < expectedCount || l.length < expectedCount)
      return null;
    const horizontalSplits = r.map(x => x.bounds.bottom).concat([img.height]);
    let ret = [];
    for (let i = 0; i < r.length; ++i) {
      let level = l.find(e =>
        e.bounds != null &&
        e.bounds.top >= horizontalSplits[i] &&
        e.bounds.bottom <= horizontalSplits[i + 1]
      );
      if (!level)
        continue;
      let nameText = res.filter(e =>
        e.bounds != null && e.level == 3 &&
        e.bounds.left > r[i].bounds.right &&
        e.bounds.bottom > r[i].bounds.bottom &&
        e.bounds.left < level.bounds.right &&
        e.bounds.top < level.bounds.top
      );
      if (nameText.length < 2)
        return null;
      let forSomebody = res.find(e =>
        e.bounds != null && e.level == 1 &&
        e.bounds.bottom > r[i].bounds.top &&
        e.bounds.bottom < nameText[0].bounds.bottom &&
        e.text.match(/[适透]用/) != null
      );
      let newBounds = nameText[0].bounds;
      newBounds.top = r[i].bounds.top;
      newBounds.bottom = level.bounds.bottom;
      ret.push({
        level: r[i].text.replace(/[5s]/g, 'S'),
        name: correctBuffName(nameText[0].text),
        forSomebody: forSomebody != null,
        bounds: newBounds
      });
    }
    return ret;
  }, 20, 1000, { maxScale: 4 });
}

function correctBuffName(buffName) {
  for (let [name, buff] of Object.entries(getAllBuff()))
    if (buff.reg.test(buffName))
      return name;
  log(`无法纠正BUFF名：${buffName}`);
  return buffName;
}

function getAllBuff() {
  return {
    引流转换器: {
      forSomebody: false,
      buffType: '生存',
      reg: /引流转[換换]+器?/
    },
    高品质粉末: {
      forSomebody: false,
      buffType: '攻击',
      reg: /高[品串][康质]粉[末未]*/
    },
    冲击引流器: {
      forSomebody: false,
      buffType: '攻击',
      reg: /冲[陆击]+引流器/
    },
    控制引导器: {
      forSomebody: false,
      buffType: '攻击',
      reg: /控制引导器?/
    },
    聚焦瞄准镜: {
      forSomebody: true,
      buffType: '攻击',
      reg: /聚焦[喵啦脂瞄]+准[鏡镜]*/
    },
    隐形粉: {
      forSomebody: true,
      buffType: '操作',
      reg: /隐形粉/
    },
    快速充电器: {
      forSomebody: true,
      buffType: '操作',
      reg: /快[連適德達逮遠速]+充电器?/
    }
  };
}

// 编队相关函数
function teamUp(status) {
  log('自动编队功能暂时失效');
  return;
  if (status.team.length == 0)
    return;
  // 找空位
  let img;
  const emptyImage = images.read("./images/simEmpty.jpg");
  let [emptyUpperBound, emptyLowerBound] = ocrUntilFound((res, img) => {
    let u = res.find(e =>
      e.text.includes('室') && e.bounds != null &&
      e.bounds.bottom > img.height / 2
    );
    let l = res.find(e => e.text.match(/([内]容|入战)/) != null);
    if (!u || !l)
      return null;
    return [u.bounds.bottom, l.bounds.top];
  }, 30, 700);
  img = captureScreen();
  let teamEmpty = findImageByFeature(img, emptyImage, {
    threshold: 0.7,
    minMatchCount: 15,
    region: [0, emptyUpperBound, img.width, emptyLowerBound - emptyUpperBound]
  });
  emptyImage.recycle();
  if (teamEmpty == null) {
    log('模拟室队伍没有空位，不需要编队');
    status.team = [];
    return;
  }
  log(`开始模拟室编队：${status.team.join('、')}`);
  clickRect(teamEmpty);
  // 没有all啦
  let [upperBound, lowerBound, allBtn, saveBtn] = ocrUntilFound(res => {
    let upper = res.find(e => e.text.match(/[可以变更编队]{3}/) != null);
    let allBtn = res.find(e => e.text == 'ALL');
    let save = res.find(e => e.text.includes('储存'));
    if (!upper || !allBtn || !save) {
      sleep(500);
      return null;
    }
    return [upper.bounds.bottom, save.bounds.top, allBtn, save];
  }, 30, 600);
  // 缩小ALL按钮范围
  allBtn.bounds.left += allBtn.bounds.width() * 0.8;
  const refreshImage = images.read("./images/simRefresh.jpg");
  let refreshBtn = findImageByFeature(captureScreen(), refreshImage, {
    threshold: 0.7,
    region: [0, height * 0.6]
  });
  refreshImage.recycle();
  sleep(1000);
  let teamClone = status.team.slice();
  // 1. 刷新清空队伍
  clickRect(refreshBtn);
  // 2. 识别每页妮姬，选中目标
  for (let retry = 0; teamClone.length > 0 && retry < 3; ++retry) {
    if (retry != 0)
      for (let i = 0; i < 7; ++i)
        swipe(width / 2, (upperBound + lowerBound) / 2, width / 2, lowerBound, 300);
    sleep(1000);
    let lastNikke = null;
    for (let page = 0; page < 10; ++page) {
      let bottomY = 0;
      let lastPage = false;
      img = captureScreen();
      let nikkes = detectNikkes(img, {
        region: [0, upperBound, img.width, lowerBound - upperBound]
      });
      for (let n of nikkes) {
        if (n.name == lastNikke)
          lastPage = true;
        bottomY = Math.max(bottomY, n.bounds.bottom);
        let t = mostSimilar(n.name, teamClone);
        if (t.similarity > 0.5) {
          clickRect(n, 0.5);
          teamClone.splice(teamClone.findIndex(x => x == t.result), 1);
        }
        if (teamClone.length == 0)
          break;
      }
      if (teamClone.length == 0 || lastPage)
        break;
      lastNikke = nikkes[nikkes.length - 1].name;
      swipe(width / 2, bottomY, width / 2, upperBound, 1000);
      swipe(100, bottomY, width / 2, bottomY, 500);
      sleep(500);
    }
    // 打乱排版，以期识别结果有变化
    // 3. 点击ALL，刷新顺序，使选中对象排到最上
    clickRect(allBtn);
  }
  if (teamClone.length > 0) {
    log(`没有找到以下妮姬：${teamClone}，放弃组队`);
    throw new Error('模拟室自动编队失败');
  }
  sleep(1000);
  // 4. 拉到最上
  for (let i = 0; i < 7; ++i)
    swipe(width / 2, (upperBound + lowerBound) / 2, width / 2, lowerBound, 300);
  sleep(1000);
  // 5. 刷新清空选择
  clickRect(refreshBtn);
  // 6. 按队伍顺序逐一选择
  let teamIndex = 0;
  while (teamIndex < status.team.length) {
    for (let i = 0; i < 3; ++i)
      swipe(width / 2, (upperBound + lowerBound) / 2, width / 2, lowerBound, 300);
    sleep(500);
    for (let page = 0; page < 2 && teamIndex < status.team.length; ++page) {
      img = captureScreen();
      let nikkes = detectNikkes(img, {
        region: [0, upperBound, img.width, lowerBound - upperBound]
      });
      let bottomY = nikkes.map(x => x.bounds.bottom).reduce((a, b) => a > b ? a : b);
      nikkes = Object.fromEntries(nikkes.map(x => [x.name, x]));
      while (teamIndex < status.team.length) {
        let t = mostSimilar(status.team[teamIndex], Object.keys(nikkes));
        if (t.similarity >= 0.5) {
          clickRect(nikkes[t.result], 0.5);
          teamIndex++;
        } else
          break;
      }
      if (page == 1 || teamIndex == status.team.length)
        continue;
      swipe(width / 2, bottomY, width / 2, upperBound, 1000);
      swipe(100, bottomY, width / 2, bottomY, 500);
      sleep(500);
    }
  }
  clickRect(saveBtn);
  status.team = [];
  ocrUntilFound(res => res.text.includes('入战'), 30, 1000);
}