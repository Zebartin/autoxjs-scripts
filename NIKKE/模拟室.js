var {
  ocrUntilFound,
  clickRect,
  imgToBounds,
  getDisplaySize
} = require('./utils.js');
var {
  启动NIKKE, 等待NIKKE加载,
  退出NIKKE, 返回首页, mostSimilar
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
      }
    }
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
    clickRect(ocrUntilFound(res => res.find(e => e.text.includes('方舟')), 30, 1000));
    clickRect(ocrUntilFound(res => res.find(e => e.text.includes('模拟室')), 30, 1000));
    sleep(2000);
  }
  quitPrevSim();
  // 检查今日模拟室是否已完成
  if (clickIntoDiffArea(tryDiff, tryArea, true)) {
    toastLog('完成模拟室任务');
    if (fromIndex)
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
    let maxRetry = team.length > 0 ? 15 : 1;
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
    clickIntoDiffArea('3', null, false);
  clickRect(ocrUntilFound(res => res.find(e => e.text.includes('开始')), 10, 300));
  for (status.layer = 0; status.layer < 7; ++status.layer) {
    selectOption(status);
    if (status.earlyStop)
      break;
  }
  // 一轮模拟结束
  if (status.earlyStop) {
    clickRect(ocrUntilFound(res => res.find(e => e.text.endsWith('结束')), 20, 300));
    clickRect(ocrUntilFound(res => res.find(e => e.text.endsWith('确认')), 10, 300));
  } else {
    log(`bestBuffToKeep = ${status.bestBuffToKeep.name}(${status.bestBuffToKeep.level})`);
    clickRect(ocrUntilFound(res => res.find(e =>
      e.text.endsWith('结束') &&
      e.bounds != null &&
      e.bounds.bottom > height / 2
    ), 20, 1000));
    sleep(600);
    clickRect(ocrUntilFound(res => res.find(e => e.text.endsWith('确认')), 10, 300));
    ocrUntilFound(res => res.text.includes('选择'), 10, 1000);
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
        t1 = res.find(e => e.text.includes('不选择'));
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

function quitPrevSim() {
  sleep(5000);
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
  }, 10, 500);
  log(`模拟室当前页面：${pageState}`);
  if (pageState == 'beginSim')
    return;
  if (pageState == 'combat')
    click(width / 2, height / 2);
  else if (pageState != 'selectOption') {
    clickRect(ocrUntilFound(res => res.find(e => e.text.match(/(不选择$|体力)/) != null), 10, 500));
    clickRect(ocrUntilFound(res => res.find(e => e.text.endsWith('确认')), 10, 500));
    if (pageState == 'ICU')
      ocrUntilFound(res => res.text.match(/[已己巳]/) != null, 10, 1000);
    else if (pageState == 'selectBuffEPIC')
      ocrUntilFound(res => res.text.includes('RESET'), 10, 1000);
    if (!pageState.startsWith('selectBuff'))
      clickRect(ocrUntilFound(res => res.find(e => e.text.match(/(確認|确认)/) != null), 10, 1000));
  }
  let quitBtn = ocrUntilFound(res => res.find(e => e.text.match(/结.$/) != null), 20, 1000);
  clickRect(quitBtn);
  let [keepBuff, confirmBtn] = ocrUntilFound(res => {
    let btn = res.find(e => e.text.endsWith('确认'));
    if (!btn) {
      clickRect(quitBtn);
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
    clickRect(ocrUntilFound(res => res.find(e => e.text.includes('不选择')), 10, 500));
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

function clickIntoDiffArea(diff, area, checkFinished) {
  clickRect(ocrUntilFound(res => res.find(e => e.text.startsWith('开始')), 10, 300));
  clickRect(ocrUntilFound(res => res.find(e => e.text == diff), 20, 300));
  if (area == null)
    return false;
  let [areaChoice, startBtn] = ocrUntilFound(res => {
    let upper = res.find(e => e.text == '地区');
    let start = res.find(e => e.text.includes('开始'));
    if (!upper || !start)
      return null;
    let numbers = res.filter(e =>
      e.bounds != null && e.bounds.top > upper.bounds.bottom &&
      e.bounds.bottom < start.bounds.top &&
      e.text.match(/[\d\s+,]{4,10}/) != null && e.level == 3
    ).toArray();
    if (numbers.length != 3)
      return null;
    numbers.sort((a, b) => a.bounds.left - b.bounds.left);
    return [numbers[area], start];
  }, 20, 500);
  clickRect(areaChoice);
  if (checkFinished == true) {
    let finishedText = ocrUntilFound(res => res.find(e =>
      e.bounds != null && e.bounds.top >= areaChoice.bounds.bottom &&
      e.bounds.bottom <= startBtn.bounds.top &&
      e.text.match(/[该地区已通关。重置后可获得奖励]/) != null
    ), 3, 300);
    back();
    ocrUntilFound(res => res.text.includes('开始'), 30, 1000);
    return finishedText != null;
  }
  return false;
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
      /不选/,
      /体力/,
      /第[一二三]个/
    ];
    let optionLoadedCnt = 0;
    let [choice, keywordType] = ocrUntilFound(res => {
      if (res.text.includes('确认'))
        optionLoadedCnt++;
      if (optionLoadedCnt < 2)
        return null;
      let img = images.copy(captureScreen());
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
      img.recycle();
      return null;
    }, 30, 500);
    clickRect(choice);
    clickRect(ocrUntilFound(res => {
      if (keywordType == 0 && res.text.match(/[什么都没有发生3分之2]{3}/) == null) {
        clickRect(choice);
        return null;
      }
      return res.find(e => e.text.includes('确认'));
    }, 30, 1000));
    let roomCnt = 0;
    ocrUntilFound(res => {
      if (keywordType == 0 && res.text.includes('不选'))
        return null;
      if (res.text.match(/ON[\s\S]*ROOM[\s\S]*RESET/) != null)
        return roomCnt++ >= 3;
      if (res.text.includes('不选')) {
        let t = res.find(e => e.text.match(/不选.$/) != null);
        if (t != null)
          clickRect(t);
      }
      if (res.text.includes('确认'))
        clickRect(res.find(e => e.text.includes('确认')));
      sleep(1000);
      return false;
    }, 30, 500);
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
      let t1 = res.find(e => e.text.endsWith('不选择'));
      let t2 = res.find(e => e.text == '确认');
      let t3 = null;
      if (!t1 || !t2)
        return null;
      if (!res.text.includes('条件')) {
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
    if (res.text.includes('入战'))
      return true;
    clickRect(option);
    return null;
  }, 3, 2000);
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
    sleep(20 * 1000);
    let result = ocrUntilFound(res => {
      if (!res.text.includes('STATUS'))
        return null;
      if (res.text.includes('点击'))
        return 'success';
      if (res.text.includes('FAIL'))
        return 'fail';
      return null;
    }, 60, 2000);
    if (result == 'success') {
      sleep(1000);
      click(width / 2, height / 2);
    }
    else {
      clickRect(ocrUntilFound(res => res.find(e => e.text.includes('返回')), 20, 500));
      ocrUntilFound(res => res.text.includes('入战'), 30, 1000);
      sleep(500);
      click(width / 2, height / 2);
      status.earlyStop = true;
      return;
    }
  }
  if (option.effect.match(/[模拟通关]+/) != null)
    return;
  ocrUntilFound(res => res.text.includes('选择'), 30, 1000);
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
    let t1 = res.find(e => e.text.endsWith('不选择'));
    let t2 = res.find(e => e.text.endsWith('确认'));
    if (!t1 || !t2)
      return null;
    return [t1, t2];
  }, 20, 300);
  if (bestBuff == null) {
    clickRect(cancelBtn);
    sleep(600);
    clickRect(ocrUntilFound(res => res.find(e => e.text.includes('确认')), 10, 300));
  } else {
    clickRect(bestBuff);
    sleep(600);
    clickRect(confirmBtn);
    status.newBuffs[bestBuff.name] = {
      name: bestBuff.name,
      level: bestBuff.level
    };
    if (status.mode == '刷buff')
      status.bestBuffToKeep = {
        name: bestBuff.name,
        level: bestBuff.level
      };
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
    normal: /N[DO]RMAL/,
    hard: /HAR[DO]/,
    abilitiesTest: /[測测]试$/,
    ICU: /归队$/,
    specUp: /^强化/
  };
  const pattern = new RegExp(`(${Object.values(optionReg).map(x => x.source).join('|')})`);
  return ocrUntilFound(res => {
    let t = res.filter(e => e.level == 3 && pattern.test(e.text)).toArray();
    if (t.length < expectedOptionNumber)
      return null;
    const verticalSplits = t.map(x => x.bounds.left).concat([width]);
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
  return ocrUntilFound(res => {
    const r = res.filter(e => e.text.match(/^([5S]{0,2}R|EP..)$/i) != null && e.level == 3).toArray();
    const l = res.filter(e => e.text.match(/[連達连][結练绪结]等[級级]/) != null && e.level == 3).toArray();
    r.sort((a, b) => a.bounds.top - b.bounds.top);
    l.sort((a, b) => a.bounds.top - b.bounds.top);
    if (r.length < expectedCount || l.length < expectedCount)
      return null;
    const horizontalSplits = r.map(x => x.bounds.bottom).concat([height]);
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
  }, 20, 1000);
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
      reg: /快[連適德逮遠速]+充电器?/
    }
  };
}

// 编队相关函数
function teamUp(status) {
  if (status.team.length == 0)
    return;
  // 找空位
  const emptyImage = images.read("./images/simEmpty.jpg");
  let teamEmpty = images.findImage(captureScreen(), emptyImage, {
    threshold: 0.7,
    region: [0, height * 0.6]
  });
  teamEmpty = imgToBounds(emptyImage, teamEmpty);
  emptyImage.recycle();
  if (teamEmpty == null) {
    log('模拟室队伍没有空位，不需要编队');
    status.team = [];
    return;
  }
  log(`开始模拟室编队：${status.team}`);
  clickRect(teamEmpty);
  let [upperBound, lowerBound, allBtn, saveBtn] = ocrUntilFound(res => {
    let upper = res.find(e => e.text.match(/[可以变更编队]{3}/) != null);
    let lower = res.find(e => e.text.includes('返回'));
    let allBtn = res.find(e => e.text == 'ALL');
    let save = res.find(e => e.text.includes('储存'));
    if (!upper || !lower || !allBtn || !save) {
      sleep(500);
      return null;
    }
    return [upper.bounds.bottom, lower.bounds.top, allBtn, save];
  }, 30, 600);
  const refreshImage = images.read("./images/simRefresh.jpg");
  let refreshBtn = images.findImage(captureScreen(), refreshImage, {
    threshold: 0.7,
    region: [0, height * 0.6]
  });
  refreshBtn = imgToBounds(refreshImage, refreshBtn);
  refreshImage.recycle();
  sleep(1000);
  let teamClone = status.team.slice();
  // 1. 刷新清空队伍
  clickRect(refreshBtn);
  // 2. 识别每页妮姬，选中目标
  for (let retry = 0; teamClone.length > 0 && retry < 3; ++retry) {
    for (let i = 0; i < 7; ++i)
      swipe(width / 2, (upperBound + lowerBound) / 2, width / 2, lowerBound, 300);
    sleep(1000);
    let lastNikke = null;
    for (let page = 0; page < 10; ++page) {
      let img = images.clip(captureScreen(), 0, upperBound, width, lowerBound - upperBound);
      let bottomY = 0;
      let lastPage = false;
      let nikkes = detectNikkes(img, 0, upperBound);
      console.info(nikkes);
      for (let n of nikkes) {
        if (n.name == lastNikke)
          lastPage = true;
        bottomY = Math.max(bottomY, n.bounds.bottom);
        let t = mostSimilar(n.name, teamClone);
        console.info(t);
        if (t.similarity >= 0.5) {
          clickRect(n, 0.01);
          teamClone.splice(teamClone.findIndex(x => x == t.result), 1);
        }
        if (teamClone.length == 0)
          break;
      }
      img.recycle();
      if (teamClone.length == 0 || lastPage)
        break;
      lastNikke = nikkes[nikkes.length - 1].name;
      swipe(width / 2, bottomY, width / 2, upperBound, 1000);
      swipe(100, bottomY, width / 2, bottomY, 500);
      sleep(500);
    }
  }
  if (teamClone.length > 0) {
    log(`没有找到以下妮姬：${teamClone}，放弃组队`);
    throw new Error('模拟室自动编队失败');
  }
  // 3. 点击ALL，刷新顺序，使选中对象排到最上
  clickRect(allBtn);
  sleep(1000);
  // 4. 拉到最上
  for (let i = 0; i < 7; ++i)
    swipe(width / 2, (upperBound + lowerBound) / 2, width / 2, lowerBound, 300);
  sleep(1000);
  // 5. 刷新清空选择
  clickRect(refreshBtn);
  // 6. 按队伍顺序逐一选择
  let img = images.clip(captureScreen(), 0, upperBound, width, lowerBound - upperBound);
  let nikkes = detectNikkes(img, 0, upperBound).slice(0, 5);
  img.recycle();
  nikkes = Object.fromEntries(nikkes.map(x => [x.name, x]));
  for (let i of status.team) {
    let t = mostSimilar(i, Object.keys(nikkes));
    clickRect(nikkes[t.result], 0.01);
  }
  clickRect(saveBtn);
  status.team = [];
  ocrUntilFound(res => res.text.includes('入战'), 30, 1000);
}
function detectNikkes(originalImg, baseX, baseY) {
  let splitX = [];
  let splitY = [];
  let gbImg = images.gaussianBlur(originalImg, [3, 3], 0, 0);
  let grayImg = images.cvtColor(gbImg, "BGR2GRAY");
  gbImg.recycle();
  with (JavaImporter(com.stardust.autojs.core.opencv.Mat, org.opencv.imgproc)) {
    let edges = new Mat();
    let cannyColor = new Mat();
    let lines = new Mat();
    const lowThresh = 45;
    Imgproc.Canny(grayImg.getMat(), edges, lowThresh, lowThresh * 3, 3);
    Imgproc.cvtColor(edges, cannyColor, Imgproc.COLOR_GRAY2BGR);
    Imgproc.HoughLines(edges, lines, 1, Math.PI / 2, 400);
    grayImg.recycle();
    cannyColor.release();
    edges.release();
    for (let i = 0; i < lines.rows(); ++i) {
      let [rho, theta] = lines.get(i, 0);
      let a = Math.cos(theta);
      let b = Math.sin(theta);
      let x0 = Math.round(a * rho);
      let y0 = Math.round(b * rho);
      if (Math.round(a) == 0) {
        let j = splitY.findIndex(y => Math.abs(y - y0) < 100);
        if (j != -1)
          splitY[j] = Math.max(splitY[j], y0);
        else
          splitY.push(y0);
      }
      else if (Math.round(b) == 0) {
        let j = splitX.findIndex(x => Math.abs(x - x0) < 100)
        if (j != -1)
          splitX[j] = Math.max(splitX[j], x0);
        else
          splitX.push(x0);
      }
    }
    lines.release();
    splitX.push(0);
    splitX.push(originalImg.getWidth());
    splitY.push(0);
    splitY.push(originalImg.getHeight());
    splitX.sort((a, b) => a - b);
    splitY.sort((a, b) => a - b);
  }
  let nikkes = [];
  let specialNameReg = /[森杨]/;
  for (let j = 0; j < splitY.length - 1; ++j)
    for (let i = 0; i < splitX.length - 1; ++i) {
      let w = Math.floor((splitX[i + 1] - splitX[i]) / 4);
      let h = Math.floor((splitY[j + 1] - splitY[j]) / 4);
      if (w < 30 || h < 80)
        continue;
      let clipimg = images.clip(originalImg, splitX[i] + w, splitY[j] + h * 3, w * 3, h);
      for (let k = 3; k <= 16; ++k) {
        let ocr;
        if (k == 3)
          ocr = gmlkit.ocr(clipimg, 'zh');
        else {
          let scaleimg = images.scale(clipimg, k, k, 'CUBIC');
          ocr = gmlkit.ocr(scaleimg, 'zh');
          scaleimg.recycle();
        }
        let name = ocr.text.replace(/[一\s\-·,]/g, '');
        if (name.length < 2 && !specialNameReg.test(name))
          continue;
        let bounds = new android.graphics.Rect();
        bounds.left = splitX[i] + w + baseX;
        bounds.right = splitX[i + 1] + baseX;
        bounds.top = splitY[j] + h * 3 + baseY;
        bounds.bottom = splitY[j + 1] + baseY;
        nikkes.push({
          name: name,
          bounds: bounds,
          scale: k == 3 ? 1 : k,
          confidence: ocr.filter(e => e.text.match(new RegExp(`[${name}]{${Math.min(2, name.length)}}`)) != null && e.confidence != -1).toArray().map(x => x.confidence)[0]
        })
        break;
      }
      clipimg.recycle();
    }
  return nikkes;
}
