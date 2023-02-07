var {
  ocrUntilFound,
  clickRect,
  getDisplaySize
} = require('./utils.js');
var {
  启动NIKKE, 等待NIKKE加载,
  退出NIKKE, 返回首页
} = require('./NIKKEutils.js');
let width, height;
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
  let { maxPass, maxSsrNumber, preferredBuff } = simulationRoom;
  maxSsrNumber = Math.min(maxSsrNumber, preferredBuff.length, Object.keys(getAllBuff()).length);
  if (fromIndex) {
    clickRect(ocrUntilFound(res => res.find(e => e.text.includes('方舟')), 30, 1000));
    clickRect(ocrUntilFound(res => res.find(e => e.text.includes('模拟室')), 30, 1000));
    sleep(2000);
  }
  quitPrevSim();
  let status = {
    loaded: getBuffLoaded(),
    preferredBuff: preferredBuff,
    layer: 0,
    bestBuffToKeep: null,  // 最后保留的buff，必须正确初始化
    newBuffs: {},          // 主要作用是防止选到重复buff，导致需要进行更换
    earlyStop: false,
    skipMode: false
  };
  for (let pass = 0; pass < maxPass; ++pass) {
    status.earlyStop = false;
    status.bestBuffToKeep = {
      name: null,
      level: null
    };
    status.newBuffs = {};
    status.skipMode = false;
    log('已有BUFF：', Object.keys(status.loaded));
    if (Object.keys(status.loaded).length >= maxSsrNumber) {
      for (let buff of Object.values(status.loaded))
        if (buff.level != 'SSR') {
          status.skipMode = true;
          break;
        }
      if (!status.skipMode)
        break;
    }
    toastLog(`第${pass + 1}轮模拟室：skipMode = ${status.skipMode}`);
    clickRect(ocrUntilFound(res => res.find(e => e.text.startsWith('开始')), 10, 300));
    clickRect(ocrUntilFound(res => res.find(e => e.text == '3'), 20, 300));
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
      ), 20, 300));
      sleep(600);
      clickRect(ocrUntilFound(res => res.find(e => e.text.endsWith('确认')), 10, 300));
      ocrUntilFound(res => res.text.includes('选择'), 10, 1000);
      sleep(600);
      let buff = null;
      if (!status.bestBuffToKeep.name) {
        buff = getBuffs(1);
        buff = buff.length > 0 ? buff[0] : null;
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
  toastLog('完成模拟室任务');
  if (fromIndex)
    返回首页();
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
    let keywords = [
      '机会', 'EP', '不选择',
      '所有', '战斗', 'RESET'
    ];
    let results = [
      'specUp', 'selectEPIC', 'selectBuff',
      'ICU', 'combat', 'selectOption'
    ];
    for (let i = 0; i < keywords.length; ++i)
      if (res.text.includes(keywords[i]))
        return results[i];
    return null;
  }, 10, 500);
  log(`模拟室当前页面：${pageState}`)
  if (pageState == 'beginSim')
    return;
  if (pageState == 'combat')
    click(width / 2, height / 2);
  else if (pageState != 'selectOption') {
    clickRect(ocrUntilFound(res => res.find(e => e.text.match(/(不选择$|所有)/) != null), 10, 500));
    clickRect(ocrUntilFound(res => res.find(e => e.text.endsWith('确认')), 10, 500));
    if (pageState == 'ICU')
      ocrUntilFound(res => res.text.includes('体力已'), 5, 1000);
    else if (pageState == 'selectEPIC')
      ocrUntilFound(res => res.text.includes('RESET'), 5, 1000);
    if (pageState != 'selectBuff' && pageState != 'selectEPIC')
      clickRect(ocrUntilFound(res => res.find(e => e.text.match(/(確認|确认)/) != null), 10, 1000));
  }
  clickRect(ocrUntilFound(res => res.find(e => e.text.endsWith('结束')), 20, 500));
  let [keepBuff, confirmBtn] = ocrUntilFound(res => {
    let btn = res.find(e => e.text.endsWith('确认'));
    if (!btn)
      return null;
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
  swipe(width / 2, height / 2, width / 2, height * 0.8, 200);
  ret = scanBuffs(null);
  back();
  return ret;
}

function selectOption(status) {
  let optionNumber = status.layer == 6 ? 1 : 2;
  const options = getOptions(optionNumber);
  let bestOption = null;
  if (status.skipMode) {
    // 强化 > 归队 > NORMAL > HARD > 指挥能力测试
    let optionTypePriority = {
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
    // NORMAL > 强化 > 归队 > HARD > 指挥能力测试
    let optionTypePriority = {
      normal: 0,
      specUp: 1,
      ICU: 2,
      hard: 3,
      abilitiesTest: 4
    };
    let buffPriority = {};
    let buffScore = 1;
    for (let [buffName, buff] of Object.entries(getAllBuff())) {
      // 没必要考虑优先级低于bestBuffToKeep的buff类型
      // 比如已经刷到高品质粉末，就可以无视操作型增益了
      if (status.bestBuffToKeep.name == buffName)
        break;
      if (
        status.preferredBuff.includes(buffName) && !status.loaded[buffName] &&
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
  if (bestOption.type == 'abilitiesTest')
    return null;
  doWithOption(bestOption, status);
  return bestOption;
}

function doWithOption(option, status) {
  if (option.type == 'specUp' && !status.skipMode && !status.bestBuffToKeep.name) {
    status.earlyStop = true;
    for (let buff of Object.values(status.loaded))
      if (buff.level != 'SSR') {
        status.earlyStop = false;
        break;
      }
    if (status.earlyStop)
      return;
  }
  clickRect(option);
  sleep(1000);
  if (option.type == 'ICU') {
    sleep(1000);
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
        clickRect(ocrUntilFound(res => res.find(e => e.text.match(/(確認|确认)/) != null), 10, 1000));
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
      if (status.skipMode || !status.bestBuffToKeep.name)
        status.earlyStop = true;
      clickRect(cancelBtn);
      clickRect(ocrUntilFound(res => res.find(e => e.text.endsWith('确认')), 10, 500));
      clickRect(ocrUntilFound(res => res.find(e => e.text.match(/(確認|确认)/) != null), 10, 1000));
    }
    return;
  }
  while (ocrUntilFound(res => res.text.includes('战斗'), 3, 1000) == null)
    clickRect(option);
  if (option.type == 'normal') {
    clickRect(ocrUntilFound(res => res.find(e => e.text.includes('快速')), 10, 300));
  } else if (option.type == 'hard') {
    clickRect(ocrUntilFound(res => res.find(e => e.text.startsWith('进入')), 10, 300));
    sleep(20 * 1000);
    ocrUntilFound(res => res.text.includes('点击'), 60, 1500);
    sleep(1000);
    click(width / 2, height / 2);
  }
  ocrUntilFound(res => res.text.includes('选择'), 30, 1000);
  selectBuff(option.buffType, status);
}

function selectBuff(buffType, status) {
  let bestBuff = null;
  if (!status.skipMode) {
    const allBuff = getAllBuff();
    let buffOptions = getBuffs(3);
    log(`备选${buffType}型增益：`, buffOptions);
    // 过滤掉allBuff中不包括的buff
    // 过滤掉已有buff，包括本轮开始之前已有的和本轮开始后新增的
    buffOptions = buffOptions.filter(x =>
      status.preferredBuff.includes(x.name) &&
      x.forSomebody == allBuff[x.name].forSomebody &&
      !(x.name in status.loaded) &&
      !(x.name in status.newBuffs)
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
    status.bestBuffToKeep = {
      name: bestBuff.name,
      level: bestBuff.level
    };
    status.newBuffs[bestBuff.name] = {
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
    swipe(width / 2, height / 2, width / 2, height * 0.8, 200);
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
          e.text.match(/[获得型增益效果]/) != null
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
    const l = res.filter(e => e.text.match(/[連達连][結绪结]等[級级]/) != null && e.level == 3).toArray();
    r.sort((a, b) => a.bounds.top - b.bounds.top);
    l.sort((a, b) => a.bounds.top - b.bounds.top);
    if (r.length < expectedCount || l.length < expectedCount)
      return null;
    const count = Math.min(r.length, l.length);
    let ret = [];
    for (let i = 0; i < count; ++i) {
      let nameText = res.filter(e =>
        e.bounds != null && e.level == 3 &&
        e.bounds.left > r[i].bounds.right &&
        e.bounds.bottom > r[i].bounds.bottom &&
        e.bounds.left < l[i].bounds.right &&
        e.bounds.top < l[i].bounds.top
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
      newBounds.bottom = l[i].bounds.bottom;
      ret.push({
        level: r[i].text.replace(/[5s]/, 'S'),
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
      reg: /引流转[換换]+器/
    },
    高品质粉末: {
      forSomebody: false,
      buffType: '攻击',
      reg: /高品质粉[末未]+/
    },
    冲击引流器: {
      forSomebody: false,
      buffType: '攻击',
      reg: /冲[陆击]+引流器/
    },
    控制引导器: {
      forSomebody: false,
      buffType: '攻击',
      reg: /控制引导器/
    },
    聚焦瞄准镜: {
      forSomebody: true,
      buffType: '攻击',
      reg: /聚焦[喵瞄]+准[鏡镜]*/
    },
    隐形粉: {
      forSomebody: true,
      buffType: '操作',
      reg: /隐形粉/
    },
    快速充电器: {
      forSomebody: true,
      buffType: '操作',
      reg: /快[連德逮遠速]+充电器/
    }
  };
}
