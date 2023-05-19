"ui";

ui.layout(
  <vertical>
    <appbar>
      <toolbar id="toolbar" title="NIKKE Scripts 设置" />
      <tabs id="tabs" layout_width="match_parent" tabMode="scrollable" />
    </appbar>
    <viewpager id="viewpager">
      <vertical>
        <vertical margin="8">
          <text textSize="14sp" margin="0 0 0 4">打开想要进行的任务</text>
          <horizontal>
            <Switch text="基地收菜" id="基地收菜" textSize="16sp" margin="8 4" w="0" layout_weight="1" />
            <Switch text="好友" id="好友" textSize="16sp" margin="8 4" w="0" layout_weight="1" />
          </horizontal>
          <horizontal>
            <Switch text="竞技场" id="竞技场" textSize="16sp" margin="8 4" w="0" layout_weight="1" />
            <Switch text="商店" id="商店" textSize="16sp" margin="8 4" w="0" layout_weight="1" />
          </horizontal>
          <horizontal>
            <Switch text="爬塔" id="爬塔" textSize="16sp" margin="8 4" w="0" layout_weight="1" />
            <Switch text="咨询" id="咨询" textSize="16sp" margin="8 4" w="0" layout_weight="1" />
          </horizontal>
          <horizontal>
            <Switch text="模拟室" id="模拟室" textSize="16sp" margin="8 4" w="0" layout_weight="1" />
            <Switch text="每日任务" id="每日任务" textSize="16sp" margin="8 4" w="0" layout_weight="1" />
          </horizontal>
        </vertical>
        <vertical margin="8 50 0 0">
          <text textSize="14sp" margin="0 0 0 4">通用设置</text>
          <Switch text="静音运行（需要修改系统设置权限）" id="mute" textSize="16sp" margin="10 2" />
          <Switch text="已启动游戏且位于首页或正在加载" id="alreadyInGame" textSize="16sp" margin="10 2" />
          <Switch text="打开本界面时自动检查更新" id="checkUpdateAuto" textSize="16sp" margin="10 2" />
          <Switch text="游戏中会出现限时礼包" id="checkSale" textSize="16sp" margin="10 2" />
          <Switch text="运行结束后退出游戏" id="exitGame" textSize="16sp" margin="10 2" />
          <Switch text="总是检查签到奖励" id="alwaysCheckDailyLogin" textSize="16sp" margin="10 2" />
          <Switch text="v2rayNG魔法" id="v2rayNG" textSize="16sp" margin="10 2" />
          <horizontal margin="10 2" gravity="center_vertical|left" weightSum="10" h="0" layout_weight="1">
            <text id="checkDailyLoginText" textSize="16sp" textColor="#222222" w="0" layout_weight="6">不等待每日签到出现</text>
            <seekbar id="checkDailyLogin" w="0" layout_weight="4" layout_gravity="center" />
          </horizontal>
          <horizontal margin="10 2" gravity="center_vertical|left" weightSum="10" h="0" layout_weight="1">
            <text id="maxRetryText" textSize="16sp" textColor="#222222" w="0" layout_weight="6">脚本出错时不重试</text>
            <seekbar id="maxRetry" w="0" layout_weight="4" layout_gravity="center" />
          </horizontal>
        </vertical>
        <horizontal margin="6 15">
          <button id="update" text="更新脚本" layout_weight="1" />
          <button id="save" text="保存设置" layout_weight="1" />
        </horizontal>
        <text id="updateText" text="" textColor="#999999" textSize="12sp" gravity="center" visibility="gone" />
      </vertical>
      <vertical>
        <vertical margin="16 8">
          <vertical margin="0 0 0 20">
            <Switch id="基地收菜TAB" text="未启用" textSize="16sp" />
            <text text="派遣、免费一举歼灭、收取奖励" textColor="#999999" textSize="14sp" />
          </vertical>
          <vertical margin="0 20">
            <Switch id="好友TAB" text="未启用" textSize="16sp" />
            <text text="收发友情点" textColor="#999999" textSize="14sp" />
          </vertical>
          <vertical margin="0 20">
            <Switch id="竞技场TAB" text="未启用" textSize="16sp" />
            <text text="刷完新人竞技场免费次数，领取特殊竞技场奖励" textColor="#999999" textSize="14sp" />
            <vertical id="arena" margin="0 20">
              <horizontal>
                <text id="rookieArenaTargetText" textColor="#222222" textSize="16sp" w="0" layout_weight="4" >不打新人竞技场</text>
                <seekbar id="rookieArenaTarget" w="0" layout_weight="6" layout_gravity="center" />
              </horizontal>
            </vertical>
          </vertical>
        </vertical>
      </vertical>
      <vertical>
        <vertical margin="16 8">
          <Switch id="商店TAB" text="未启用" textSize="16sp" />
          <text text="购买商店免费物品和代码手册" textColor="#999999" textSize="14sp" />
          <vertical id="shopping" margin="0 20">
            <Switch id="checkCashShopFree" margin="0 4" textColor="#222222" text="领取付费商店免费礼包" textSize="16sp" />
            <Switch id="buyCoreDust" margin="0 4" textColor="#222222" text="使用信用点购买芯尘盒" textSize="16sp" />
            <horizontal margin="0 4">
              <text id="buyCodeManualText" textSize="16sp" textColor="#222222" w="0" layout_weight="4" >不购买代码手册</text>
              <seekbar id="buyCodeManual" w="0" layout_weight="6" layout_gravity="center" />
            </horizontal>
          </vertical>
        </vertical>
      </vertical>
      <vertical>
        <vertical margin="16 8">
          <vertical margin="0 0 0 20">
            <Switch id="爬塔TAB" text="未启用" textSize="16sp" />
            <text text="尝试各个企业塔，失败则跳过" textColor="#999999" textSize="14sp" />
          </vertical>
          <vertical margin="0 20">
            <Switch id="咨询TAB" text="未启用" textSize="16sp" />
            <text text="完成日常咨询，建议事先设置好特别关注" textColor="#999999" textSize="14sp" />
          </vertical>
        </vertical>
      </vertical>
      <vertical>
        <vertical margin="16 8">
          <Switch id="模拟室TAB" text="未启用" textSize="16sp" />
          <text text="刷取buff，然后尝试高难直到成功通关" textColor="#999999" textSize="14sp" />
          <vertical id='simulationRoom' margin="0 20">
            <vertical margin="0 4">
              <text textSize="16sp" textColor="#222222">出战队伍</text>
              <text textSize="12sp">格式：一，二，三，四，五（按照顺序）</text>
              <text textSize="12sp">须确保队伍练度足够通关</text>
              <text textSize="12sp">留空表示不自动编队，此时只会尝试一次高难</text>
              <input textSize="14sp" id="simTeam" />
            </vertical>
            <horizontal margin="0 4">
              <text id="maxPassText" textColor="#222222" textSize="16sp" w="0" layout_weight="4">不刷buff</text>
              <seekbar id="maxPass" w="0" layout_weight="6" layout_gravity="center" />
            </horizontal>
            <horizontal margin="0 4">
              <text id="maxSsrText" textColor="#222222" textSize="16sp" w="0" layout_weight="4">不刷buff</text>
              <seekbar id="maxSsrNumber" w="0" layout_weight="6" layout_gravity="center" />
            </horizontal>
            <horizontal margin="0 4">
              <text id="tryDiffAreaText" textColor="#222222" textSize="16sp" w="0" layout_weight="4">刷完buff后不尝试更高难度</text>
              <seekbar id="tryDiffArea" w="0" layout_weight="6" layout_gravity="center" />
            </horizontal>
            <text textColor="#222222" margin="0 4" textSize="16sp">刷buff时只考虑以下增益效果：</text>
            <vertical>
              <horizontal gravity="bottom">
                <checkbox id="引流转换器" marginRight="6" />
                <text text="引流转换器" textColor="#222222" textSize="14sp" layout_weight="3" w="0" />
                <text text="攻击命中时恢复体力" textColor="#999999" textSize="12sp" layout_weight="7" w="0" />
              </horizontal>
              <horizontal gravity="bottom">
                <checkbox id="高品质粉末" marginRight="6" />
                <text text="高品质粉末" textColor="#222222" textSize="14sp" layout_weight="3" w="0" />
                <text text="提高攻击力（不限对象）" textColor="#999999" textSize="12sp" layout_weight="7" w="0" />
              </horizontal>
              <horizontal gravity="bottom">
                <checkbox id="冲击引流器" marginRight="6" />
                <text text="冲击引流器" textColor="#222222" textSize="14sp" layout_weight="3" w="0" />
                <text text="提高暴击伤害（不限对象）" textColor="#999999" textSize="12sp" layout_weight="7" w="0" />
              </horizontal>
              <horizontal gravity="bottom">
                <checkbox id="控制引导器" marginRight="6" />
                <text text="控制引导器" textColor="#222222" textSize="14sp" layout_weight="3" w="0" />
                <text text="提高暴击率（不限对象）" textColor="#999999" textSize="12sp" layout_weight="7" w="0" />
              </horizontal>
              <horizontal gravity="bottom">
                <checkbox id="聚焦瞄准镜" marginRight="6" />
                <text text="聚焦瞄准镜" textColor="#222222" textSize="14sp" layout_weight="3" w="0" />
                <text text="提高命中率" textColor="#999999" textSize="12sp" layout_weight="7" w="0" />
              </horizontal>
              <horizontal gravity="bottom">
                <checkbox id="隐形粉" marginRight="6" />
                <text text="隐形粉" textColor="#222222" textSize="14sp" layout_weight="3" w="0" />
                <text text="提高全蓄力攻击伤害" textColor="#999999" textSize="12sp" layout_weight="7" w="0" />
              </horizontal>
              <horizontal gravity="bottom">
                <checkbox id="快速充电器" marginRight="6" />
                <text text="快速充电器" textColor="#222222" textSize="14sp" layout_weight="3" w="0" />
                <text text="减少蓄力时间" textColor="#999999" textSize="12sp" layout_weight="7" w="0" />
              </horizontal>
            </vertical>
          </vertical>
        </vertical>
      </vertical>
      <vertical>
        <vertical margin="16 8">
          <Switch id="每日任务TAB" text="未启用" textSize="16sp" />
          <text text="完成其他每日任务：强化装备、社交点数招募" textColor="#999999" textSize="14sp" />
          <vertical id="dailyMission" margin="0 20">
            <horizontal>
              <text textSize="16sp" textColor="#222222" w="0" layout_weight="5">强化装备指定妮姬：</text>
              <input textSize="16sp" id="equipEnhanceNikke" w="0" layout_weight="5" hint="妮姬名/正则表达式" />
            </horizontal>
            <horizontal>
              <text id="equipEnhanceSlotText" textColor="#222222" textSize="16sp" w="0" layout_weight="5">强化装备部位：头</text>
              <seekbar id="equipEnhanceSlot" w="0" layout_weight="5" layout_gravity="center" />
            </horizontal>
          </vertical>
        </vertical>
      </vertical>
    </viewpager >
  </vertical >
);

let globalNewTagName = null;
let versionChangelog = null;
function checkUpdate() {
  if (globalNewTagName != null)
    return globalNewTagName;
  try {
    const releaseAPI = 'https://api.github.com/repos/Zebartin/autoxjs-scripts/releases/latest'
    let resp = http.get(releaseAPI);
    if (resp.statusCode != 200) {
      log("请求Github API失败: " + resp.statusCode + " " + resp.statusMessage);
      return null;
    }
    let respJson = resp.body.json();
    globalNewTagName = respJson['tag_name'];
    versionChangelog = respJson['body'];
    return globalNewTagName;
  } catch (error) {
    console.error(error.message);
    console.error(error.stack);
    return null;
  }
}

const NIKKEstorage = storages.create("NIKKEconfig");
const todoTaskDefault = [
  "基地收菜", "好友", "竞技场", "商店",
  "爬塔", "咨询", "模拟室", "每日任务"
];
const simulationRoomDefault = {
  maxPass: 20,
  maxSsrNumber: 4,
  tryDiffArea: 0,
  preferredBuff: [
    "引流转换器", "高品质粉末",
    "冲击引流器", "控制引导器"
  ]
};
let todoTask = NIKKEstorage.get('todoTask', null);
if (todoTask == null)
  todoTask = todoTaskDefault;
if (typeof todoTask == 'string')
  todoTask = JSON.parse(todoTask);
let simulationRoom = NIKKEstorage.get('simulationRoom', null);
if (simulationRoom == null)
  simulationRoom = simulationRoomDefault;
if (typeof simulationRoom == 'string')
  simulationRoom = JSON.parse(simulationRoom);
//设置滑动页面的标题
ui.viewpager.setTitles(["通用设置"].concat([
  "基地收菜 & 好友 & 竞技场", "商店",
  "爬塔 & 咨询", "模拟室", "每日任务"
]));
//让滑动页面和标签栏联动
ui.tabs.setupWithViewPager(ui.viewpager);

for (let i = 0; i < todoTaskDefault.length; ++i) {
  let task = todoTaskDefault[i];
  let tabSwitch = ui.findView(task + 'TAB');
  let homeSwitch = ui.findView(task);
  homeSwitch.on('check', function (checked) {
    if (tabSwitch.isChecked() != checked)
      tabSwitch.setChecked(checked);
  });
  tabSwitch.on('check', function (checked) {
    if (homeSwitch.isChecked() != checked)
      homeSwitch.setChecked(checked);
    tabSwitch.setText(checked ? '已启用' : '未启用');
  });
}
ui.buyCodeManual.setMin(0);
ui.buyCodeManual.setMax(4);
ui.buyCodeManual.setOnSeekBarChangeListener({
  onProgressChanged: function (seekbar, p, fromUser) {
    if (p == 0)
      ui.buyCodeManualText.setText('不购买代码手册');
    else if (p == 4)
      ui.buyCodeManualText.setText('购买所有代码手册和自选宝箱');
    else
      ui.buyCodeManualText.setText(`购买前${p}本代码手册`);
  }
});
ui.checkCashShopFree.setChecked(NIKKEstorage.get('checkCashShopFree', false));
ui.buyCoreDust.setChecked(NIKKEstorage.get('buyCoreDust', false));
ui.buyCodeManual.setProgress(NIKKEstorage.get('buyCodeManual', 3));

ui.rookieArenaTarget.setMin(0);
ui.rookieArenaTarget.setMax(3);
ui.rookieArenaTarget.setOnSeekBarChangeListener({
  onProgressChanged: function (seekbar, p, fromUser) {
    if (p == 0)
      ui.rookieArenaTargetText.setText('不打新人竞技场');
    else
      ui.rookieArenaTargetText.setText(`新人竞技场选择第${p}位对手`);
  }
});
ui.rookieArenaTarget.setProgress(NIKKEstorage.get('rookieArenaTarget', 1));

ui.maxPass.setMin(0);
ui.maxPass.setMax(50);
ui.maxPass.setOnSeekBarChangeListener({
  onProgressChanged: function (seekbar, p, fromUser) {
    if (p == 0) {
      ui.maxPassText.setText('不刷buff');
      ui.maxSsrNumber.setProgress(0);
    } else {
      ui.maxPassText.setText(`重复${p}轮后停止`);
      if (ui.maxSsrNumber.getProgress() == 0)
        ui.maxSsrNumber.setProgress(1);
    }
  }
});

ui.maxSsrNumber.setMin(0);
ui.maxSsrNumber.setMax(7);
ui.maxSsrNumber.setOnSeekBarChangeListener({
  onProgressChanged: function (seekbar, p, fromUser) {
    if (p == 0) {
      ui.maxSsrText.setText('不刷buff');
      ui.maxPass.setProgress(0);
    } else {
      ui.maxSsrText.setText(`刷到${p}个SSR后停止`);
      if (ui.maxPass.getProgress() == 0)
        ui.maxPass.setProgress(1);
    }
  }
});

ui.tryDiffArea.setMin(0);
ui.tryDiffArea.setMax(8);
ui.tryDiffArea.setOnSeekBarChangeListener({
  onProgressChanged: function (seekbar, p, fromUser) {
    if (p == 0)
      ui.tryDiffAreaText.setText('刷完buff后不尝试更高难度');
    else {
      let diff = Math.floor(p / 3) + 3;
      let area = String.fromCharCode('A'.charCodeAt(0) + p % 3);
      ui.tryDiffAreaText.setText(`刷完buff后尝试${diff}${area}`);
    }
  }
});

ui.simTeam.setText((() => {
  let team = simulationRoom.team || ['长发公主', '桑迪', '神罚', '红莲', '丽塔'];
  return team.join('，');
})());
ui.maxPass.setProgress(simulationRoom.maxPass);
ui.maxSsrNumber.setProgress(simulationRoom.maxSsrNumber);
ui.tryDiffArea.setProgress(simulationRoom.tryDiffArea || 0);

ui.equipEnhanceSlot.setMin(0);
ui.equipEnhanceSlot.setMax(3);
ui.equipEnhanceSlot.setOnSeekBarChangeListener({
  onProgressChanged: function (seekbar, p, fromUser) {
    ui.equipEnhanceSlotText.setText(`强化装备部位：${'头身手腿'[p]}`);
  }
});
let dailyMission = NIKKEstorage.get('dailyMission', {});
ui.equipEnhanceNikke.setText(dailyMission.equipEnhanceNikke || '');
ui.equipEnhanceSlot.setProgress(dailyMission.equipEnhanceSlot || 0);

for (let task of todoTask)
  ui.findView(task).setChecked(true);
for (let buffName of simulationRoom.preferredBuff)
  ui.findView(buffName).setChecked(true);

ui.checkDailyLogin.setOnSeekBarChangeListener({
  onProgressChanged: function (seekbar, p, fromUser) {
    if (p == 0)
      ui.checkDailyLoginText.setText('不等待每日签到出现');
    else
      ui.checkDailyLoginText.setText(`检查${p}次每日签到`);
  }
});
ui.checkDailyLogin.setMin(0);
ui.checkDailyLogin.setMax(2);
// 兼容老版本，+号将boolean转为整数值
ui.checkDailyLogin.setProgress(+NIKKEstorage.get('checkDailyLogin', 1));
ui.maxRetry.setOnSeekBarChangeListener({
  onProgressChanged: function (seekbar, p, fromUser) {
    let s = '脚本出错时';
    if (p == 0)
      ui.maxRetryText.setText(s + '不重试');
    else
      ui.maxRetryText.setText(s + `重试${p}次`);
  }
});
ui.maxRetry.setMin(0);
ui.maxRetry.setMax(5);
ui.maxRetry.setProgress(NIKKEstorage.get('maxRetry', 1));
for (let generalOption of [
  'mute', 'alreadyInGame', 'checkUpdateAuto',
  'checkSale', 'exitGame', 'alwaysCheckDailyLogin', 'v2rayNG'
])
  ui.findView(generalOption).setChecked(NIKKEstorage.get(generalOption, false));

// 检查更新
if (NIKKEstorage.get('checkUpdateAuto', false)) {
  toastLog('自动检查更新中……');
  let updateResult = threads.disposable();
  threads.start(() => {
    updateResult.setAndNotify(checkUpdate());
  });

  const newTagName = updateResult.blockedGet();
  const curTagName = NIKKEstorage.get('tagName', '无记录');
  if (newTagName == null) {
    ui.updateText.setText('自动检查更新失败，请查看日志');
  }
  else if (newTagName == curTagName) {
    ui.updateText.setText(`已是最新版本：${curTagName}`);
  }
  else {
    ui.updateText.setText(`新版本：${newTagName}，当前版本：${curTagName}`);
    ui.updateText.setTextColor(colors.RED);
  }
  ui.updateText.attr('visibility', 'visible');
  log('自动检查更新完成');
}

ui.save.on("click", function () {
  let team = ui.simTeam.text().split(/[,\s，]/g).filter(x => x.length > 0);
  if (team.length != 0 && team.length != 5) {
    toast('模拟室编队格式有误，无法保存');
    return;
  }
  if (ui.findView('每日任务').isChecked() && ui.equipEnhanceNikke.text().trim() == '') {
    toast('强化装备指定妮姬不可留空，无法保存');
    return;
  }
  let todoTask = [];
  for (let task of [
    "基地收菜", "好友", "竞技场", "商店",
    "爬塔", "咨询", "模拟室", "每日任务"
  ])
    if (ui.findView(task).isChecked())
      todoTask.push(task);
  NIKKEstorage.put('todoTask', JSON.stringify(todoTask));

  NIKKEstorage.put('checkCashShopFree', ui.checkCashShopFree.isChecked());
  NIKKEstorage.put('buyCoreDust', ui.buyCoreDust.isChecked());
  NIKKEstorage.put('buyCodeManual', ui.buyCodeManual.getProgress());
  NIKKEstorage.put('rookieArenaTarget', ui.rookieArenaTarget.getProgress());

  let simulationRoom = {};
  simulationRoom.team = team;
  simulationRoom.maxPass = ui.maxPass.getProgress();
  simulationRoom.maxSsrNumber = ui.maxSsrNumber.getProgress();
  simulationRoom.tryDiffArea = ui.tryDiffArea.getProgress();
  simulationRoom.preferredBuff = [];
  for (let buffName of [
    "引流转换器", "高品质粉末", "冲击引流器",
    "控制引导器", "聚焦瞄准镜", "隐形粉", "快速充电器"
  ])
    if (ui.findView(buffName).isChecked())
      simulationRoom.preferredBuff.push(buffName);
  NIKKEstorage.put('simulationRoom', JSON.stringify(simulationRoom));

  let dailyMission = {};
  dailyMission.equipEnhanceNikke = ui.equipEnhanceNikke.text().trim();
  dailyMission.equipEnhanceSlot = ui.equipEnhanceSlot.getProgress();
  NIKKEstorage.put('dailyMission', dailyMission);

  for (let generalOption of [
    'mute', 'alreadyInGame', 'checkUpdateAuto',
    'checkSale', 'exitGame', 'alwaysCheckDailyLogin', 'v2rayNG'
  ])
    NIKKEstorage.put(generalOption, ui.findView(generalOption).isChecked());
  NIKKEstorage.put('checkDailyLogin', ui.checkDailyLogin.getProgress());
  NIKKEstorage.put('maxRetry', ui.maxRetry.getProgress());

  ui.finish();
  toastLog('设置已保存');
});

ui.update.on("click", function () {
  threads.start(() => {
    const beforeReturn = () => {
      log('控制台即将退出');
      sleep(3000);
      console.hide();
    };
    console.show();
    log('开始更新');
    const curTagName = NIKKEstorage.get('tagName', '');
    const newTagName = checkUpdate();
    if (newTagName == null) {
      log('更新失败，请检查网络');
      beforeReturn();
      return;
    }
    else if (newTagName == curTagName) {
      log("已是最新版本：" + curTagName);
      let forceUpdate = confirm(
        "已是最新版本",
        "是否强制更新？强制更新将重新下载脚本文件，可用于补充/替换意外删除/修改的内容"
      );
      if (forceUpdate == false) {
        beforeReturn();
        return;
      }
    }
    log(`检测到新版本：${newTagName}，下载中……`);
    log("如果耗时过长请关闭本窗口并检查网络");
    // AutoX.js的解压不能替换原文件，只能先放到tmp目录下
    let fileName = `NIKKE-scripts-${newTagName}.7z`;
    let filePath = files.path(`./tmp/${fileName}`);
    let fileResp = http.get(`https://github.blindbuffalo.xyz/https://github.com/Zebartin/autoxjs-scripts/releases/download/${newTagName}/${fileName}`);
    if (fileResp.statusCode != 200) {
      log(`下载${fileName}失败: ` + fileResp.statusCode + " " + fileResp.statusMessage);
      beforeReturn();
      return;
    }
    files.ensureDir(filePath);
    files.writeBytes(filePath, fileResp.body.bytes());
    log(`下载成功：${fileName}，解压中……`);
    zips.X(filePath, files.path('./tmp'));
    files.remove(filePath);
    let fileList = [];
    function walkDir(dir) {
      for (let f of files.listDir(dir)) {
        let absolutePath = `${dir}/${f}`;
        if (files.isFile(absolutePath))
          fileList.push(absolutePath);
        else
          walkDir(absolutePath);
      }
    }
    walkDir('./tmp');
    for (let f of fileList) {
      let dest = files.path(`./${f.slice(6)}`);
      files.ensureDir(dest);
      files.copy(f, dest);
    }
    files.removeDir('./tmp');
    NIKKEstorage.put('tagName', newTagName);
    toastLog('更新结束');
    log('更新内容：');
    console.info(versionChangelog);
    beforeReturn();
    ui.finish();
  });
});
