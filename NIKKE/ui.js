"ui";

ui.layout(
  <vertical>
    <appbar>
      <toolbar id="toolbar" title="示例" />
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
          <Switch text="静音运行（需要修改系统设置权限）" id="mute" textSize="16sp" margin="10 2"/>
          <Switch text="已启动游戏且位于首页或正在加载" id="alreadyInGame" textSize="16sp" margin="10 2"/>
          <Switch text="打开本界面时自动检查更新" id="checkUpdateAuto" textSize="16sp" margin="10 2"/>
          <Switch text="游戏中会出现限时礼包" id="checkSale" textSize="16sp" margin="10 2"/>
          <Switch text="运行结束后退出游戏" id="exitGame" textSize="16sp" margin="10 2"/>
          <Switch text="总是检查签到奖励" id="alwaysCheckDailyLogin" textSize="16sp" margin="10 2"/>
          <Switch text="v2rayNG魔法" id="v2rayNG" textSize="16sp" margin="10 2"/>
          <horizontal margin="10 2" gravity="center_vertical|left" weightSum="10" h="0" layout_weight="1">
            <text id="checkDailyLoginText" textSize="16sp" textColor="#222222" w="0" layout_weight="6">不等待每日签到出现</text>
            <seekbar id="checkDailyLogin" w="0" layout_weight="4" />
          </horizontal>
          <horizontal margin="10 2" gravity="center_vertical|left" weightSum="10" h="0" layout_weight="1">
            <text id="maxRetryText" textSize="16sp" textColor="#222222" w="0" layout_weight="6">脚本出错时不重试</text>
            <seekbar id="maxRetry" w="0" layout_weight="4" />
          </horizontal>
        </vertical>
        <horizontal margin="6 15">
          <button id="update" text="更新脚本" layout_weight="1" />
          <button id="save" text="保存设置" layout_weight="1" />
        </horizontal>
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
              <seekbar id="rookieArenaTarget" w="0" layout_weight="6" />
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
              <seekbar id="buyCodeManual" w="0" layout_weight="6" />
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
              <seekbar id="maxPass" w="0" layout_weight="6" />
            </horizontal>
            <horizontal margin="0 4">
              <text id="maxSsrText" textColor="#222222" textSize="16sp" w="0" layout_weight="4">不刷buff</text>
              <seekbar id="maxSsrNumber" w="0" layout_weight="6" />
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
              <seekbar id="equipEnhanceSlot" w="0" layout_weight="5" />
            </horizontal>
          </vertical>
        </vertical>
      </vertical>
    </viewpager >
  </vertical >
);
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