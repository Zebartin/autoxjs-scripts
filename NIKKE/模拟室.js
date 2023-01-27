var { width, height } = device;
var {
  ocrUntilFound,
  clickRect
} = require('./utils.js');
if (typeof module === 'undefined') {
  let {
    unlockIfNeed,
    requestScreenCaptureAuto
  } = require('./utils.js');
  auto.waitFor();
  unlockIfNeed();
  requestScreenCaptureAuto();
  模拟室(50);
  exit();
}
else {
  module.exports = {
    模拟室: 模拟室
  };
}

function 模拟室(maxPass) {
  let status = {
    loaded: getBuffLoaded(),
    newBuffLevelIsSSR: true,
    getNewBuff: false,
    earlyStop: false,
    skipMode: false
  };
  for (let buffLevel of Object.values(status.loaded))
    if (buffLevel != 'SSR') {
      status.newBuffLevelIsSSR = false;
      break;
    }
  for (let pass = 0; pass < maxPass; ++pass) {
    if (Object.keys(status.loaded).length >= 8)
      break;
    status.getNewBuff = false;
    status.earlyStop = false;
    status.skipMode = !status.newBuffLevelIsSSR;
    log(`第${pass + 1}轮模拟室：skipMode = ${status.skipMode}`);
    log('已有BUFF：', Object.keys(status.loaded));
    clickRect(ocrUntilFound(res => res.find(e => e.text.startsWith('开始')), 10, 300));
    clickRect(ocrUntilFound(res => res.find(e => e.text == '4'), 20, 300));
    clickRect(ocrUntilFound(res => res.find(e => e.text.includes('开始')), 10, 300));
    for (let i = 0; i < 7; ++i) {
      selectOption(status);
      if (status.earlyStop)
        break;
    }
    // 一轮模拟结束
    if (status.earlyStop) {
      clickRect(ocrUntilFound(res => res.find(e => e.text.endsWith('结束')), 20, 300));
      clickRect(ocrUntilFound(res => res.find(e => e.text.endsWith('确认')), 10, 300));
    } else {
      clickRect(ocrUntilFound(res => res.find(e =>
        e.text.endsWith('结束') &&
        e.bounds != null &&
        e.bounds.bottom > height / 2
      ), 20, 300));
      sleep(600);
      clickRect(ocrUntilFound(res => res.find(e => e.text.endsWith('确认')), 10, 300));
      ocrUntilFound(res => res.text.includes('选择'), 10, 1000);
      sleep(600);
      let buff = getBuffs(1);
      let [chosenTarget, confirmBtn] = ocrUntilFound(res => {
        let t1 = buff.length > 0 ? buff[0] : null;
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
      if (!status.getNewBuff) {
        sleep(600);
        buff = getBuffs(2);
        clickRect(buff[1]);
        sleep(600);
        clickRect(ocrUntilFound(res => res.find(e => e.text.includes('确认')), 10, 300));
      }
    }
  }
}

function getBuffLoaded() {
  let ret = {};
  clickRect(ocrUntilFound(res => res.find(e => e.text.startsWith('BUFF')), 10, 1000));
  sleep(1000);
  swipe(width / 2, height / 2, width / 2, height * 0.8, 200);
  while (true) {
    sleep(1000);
    let buffs = getBuffs(0);
    if (buffs.length == 0)
      break;
    let i;
    for (i = buffs.length - 1; i >= 0; --i) {
      if (buffs[i].name in ret)
        break;
      ret[buffs[i].name] = buffs[i].level;
    }
    if (i >= 0)
      break;
    if (buffs.length < 2)
      break;
    const centerX = buffs[0].bounds.centerX();
    const centerY = buffs[buffs.length - 1].bounds.centerY();
    const distance = buffs[1].bounds.top - buffs[0].bounds.top;
    swipe(
      centerX, centerY,
      centerX, centerY - distance * buffs.length,
      2000 * buffs.length
    );
  }
  back();
  return ret;
}

function selectOption(status) {
  const options = getOptions();
  let bestOption = null;
  // NORMAL > 强化 > 归队 > HARD > 指挥能力测试
  const optionTypePriority = {
    normal: 0,
    specUp: 1,
    ICU: 2,
    hard: 3,
    abilitiesTest: 4
  };
  if (status.skipMode) {
    bestOption = options.reduce((prev, curr) => {
      return optionTypePriority[prev.type] < optionTypePriority[curr.type] ? prev : curr;
    });
  } else {
    let buffPriority = {};
    let buffScore = 1;
    for (let [buffType, buffList] of Object.entries(getAllBuff())) {
      for (let buffName of Object.keys(buffList))
        if (!status.loaded[buffName]) {
          buffPriority[buffType] = buffScore++;
          break;
        }
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
  // 目标是新buff，但没有刷出来，提前终止
  if (option.type == 'specUp' && !status.skipMode && !status.getNewBuff) {
    status.earlyStop = true;
    return;
  }
  clickRect(option);
  sleep(1000);
  if (option.type == 'ICU') {
    let [firstOption, confirmBtn] = ocrUntilFound(res => {
      let t1 = res.find(e => e.text.includes('所有'));
      let t2 = res.find(e => e.text.includes('确认'));
      if (!t1 || !t2)
        return null;
      return [t1, t2];
    }, 10, 300)
    clickRect(firstOption);
    sleep(1000);
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
        if (t3 != null && !t3.text.includes('SSR'))
          t3 = null;
      }
      return [t1, t2, t3];
    }, 20, 1000);
    if (ssrOption != null) {
      status.newBuffLevelIsSSR = true;
      clickRect(ssrOption);
      sleep(600);
      clickRect(confirmBtn);
      sleep(600);
      if (ssrOption.text.includes('所有'))
        clickRect(ocrUntilFound(res => res.find(e => e.text.match(/(確認|确认)/) != null), 10, 1000));
      else {
        clickRect(getBuffs(1)[0]);
        clickRect(ocrUntilFound(res => res.find(e => e.text.endsWith('确认')), 10, 500));
        clickRect(ocrUntilFound(res => res.find(e => e.text.match(/(確認|确认)/) != null), 10, 1000));
      }
    } else {
      // 没有刷到SSR提升选项，提前结束
      if (status.skipMode && status.getNewBuff == false)
        status.earlyStop = true;
      clickRect(cancelBtn);
      clickRect(ocrUntilFound(res => res.find(e => e.text.endsWith('确认')), 10, 500));
      clickRect(ocrUntilFound(res => res.find(e => e.text.match(/(確認|确认)/) != null), 10, 1000));
    }
    return;
  }
  ocrUntilFound(res => res.text.includes('战斗'), 20, 1000);
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
    const buffOptions = getBuffs(3);
    let buffPriority = {};
    let buffScore = 1;
    for (let [buffName, buff] of Object.entries(getAllBuff(buffType))) {
      if (!status.loaded[buffName]) {
        buffPriority[`${buffName}#${buff.forSomebody}`] = buffScore++;
      }
    }
    bestBuff = buffOptions.reduce((prev, curr) => {
      let s1 = buffPriority[`${prev.name}#${prev.forSomebody}`];
      let s2 = buffPriority[`${curr.name}#${curr.forSomebody}`];
      if (!s1)
        s1 = buffScore;
      if (!s2)
        s2 = buffScore;
      if (prev.level == 'SSR' && curr.level != 'SSR')
        return s1 != buffScore ? prev : curr;
      if (curr.level == 'SSR')
        return s2 != buffScore ? curr : prev;
      return s1 < s2 ? prev : curr;
    });
    if (!buffPriority[`${bestBuff.name}#${bestBuff.forSomebody}`])
      bestBuff = null;
    log(`备选${buffType}型增益：`, buffOptions);
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
    status.getNewBuff = true;
    status.skipMode = true;
    status.newBuffLevelIsSSR = bestBuff.level == 'SSR';
    status.loaded[bestBuff.name] = bestBuff.level;
  }
  sleep(1000);
}

function getOptions() {
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
    if (t.length == 0)
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
          '攻击': /[攻玫]击/,
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
    const r = res.filter(e => e.text.match(/^(S{0,2}R|EP..)$/) != null && e.level == 3);
    const l = res.filter(e => e.text.match(/[連達连][結绪结]等[級级]/) != null && e.level == 3);
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
      ret.push({
        level: r[i].text,
        name: correctBuffName(nameText[0].text),
        forSomebody: forSomebody != null,
        bounds: nameText[0].bounds
      });
    }
    return ret;
  }, 20, 1000);
}

function correctBuffName(buffName) {
  const allBuff = getAllBuff('other');
  for (let [name, buff] of Object.entries(allBuff))
    if (buff.reg.test(buffName))
      return name;
  log(`无法纠正BUFF名：${buffName}`);
  return buffName;
}

function getAllBuff(buffType) {
  const ret = {
    生存: {
      重启载体: {
        forSomebody: true,
        reg: /重启[載载]+体/
      },
      引流转换器: {
        forSomebody: false,
        reg: /引流转[換换]+器/
      }
    },
    攻击: {
      高品质粉末: {
        forSomebody: false,
        reg: /高品质粉[末未]+/
      },
      聚焦瞄准镜: {
        forSomebody: true,
        reg: /聚焦[喵瞄]+准[鏡镜]*/
      },
      冲击引流器: {
        forSomebody: false,
        reg: /冲[陆击]+引流器/
      },
      控制引导器: {
        forSomebody: false,
        reg: /控制引导器/
      }
    },
    操作: {
      隐形粉: {
        forSomebody: true,
        reg: /隐形粉/
      },
      快速充电器: {
        forSomebody: true,
        reg: /快[連德遠速]+充电器/
      }
    }
  };
  if (buffType == undefined)
    return ret;
  if (!ret[buffType]) {
    let flatRet = {};
    for (let i of Object.values(ret))
      for (let [k, v] of Object.entries(i))
        flatRet[k] = v;
    return flatRet;
  }
  return ret[buffType];
}
