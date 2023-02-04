"ui";
ui.layout(
  <ScrollView>
    <vertical>
      <appbar>
        <toolbar title="选项配置" />
      </appbar>
      <text textSize="16sp" margin="8">勾选想要进行的任务</text>
      <vertical>
        <card w="*" h="auto" margin="10 5" cardCornerRadius="2dp"
          cardElevation="1dp">
          <horizontal gravity="center_vertical">
            <checkbox id="商店" marginLeft="4" marginRight="6" />
            <vertical padding="18 8" h="auto" w="0" layout_weight="1">
              <text text="商店" textColor="#222222" textSize="16sp" />
              <text text="购买商店免费物品和代码手册" textColor="#999999" textSize="14sp" />
            </vertical>
          </horizontal>
        </card>
        <vertical id="shopping" visibility="gone">
          <text textSize="16sp" margin="8">商店设置</text>
          <horizontal margin="10 2">
            <text id="buyCodeManualText" textSize="14sp" w="0" layout_weight="4" >不购买代码手册：</text>
            <seekbar id="buyCodeManual" w="0" layout_weight="6" />
          </horizontal>
        </vertical>
        <card w="*" h="auto" margin="10 5" cardCornerRadius="2dp"
          cardElevation="1dp">
          <horizontal gravity="center_vertical">
            <checkbox id="基地收菜" marginLeft="4" marginRight="6" />
            <vertical padding="18 8" h="auto" w="0" layout_weight="1">
              <text text="基地收菜" textColor="#222222" textSize="16sp" />
              <text text="派遣、免费一举歼灭、收取奖励" textColor="#999999" textSize="14sp" />
            </vertical>
          </horizontal>
        </card>
        <card w="*" h="auto" margin="10 5" cardCornerRadius="2dp"
          cardElevation="1dp">
          <horizontal gravity="center_vertical">
            <checkbox id="好友" marginLeft="4" marginRight="6" />
            <vertical padding="18 8" h="auto" w="0" layout_weight="1">
              <text text="好友" textColor="#222222" textSize="16sp" />
              <text text="收发友情点" textColor="#999999" textSize="14sp" />
            </vertical>
          </horizontal>
        </card>
        <card w="*" h="auto" margin="10 5" cardCornerRadius="2dp"
          cardElevation="1dp">
          <horizontal gravity="center_vertical">
            <checkbox id="竞技场" marginLeft="4" marginRight="6" />
            <vertical padding="18 8" h="auto" w="0" layout_weight="1">
              <text text="竞技场" textColor="#222222" textSize="16sp" />
              <text text="刷完新人竞技场免费次数" textColor="#999999" textSize="14sp" />
            </vertical>
          </horizontal>
        </card>
        <card w="*" h="auto" margin="10 5" cardCornerRadius="2dp"
          cardElevation="1dp">
          <horizontal gravity="center_vertical">
            <checkbox id="爬塔" marginLeft="4" marginRight="6" />
            <vertical padding="18 8" h="auto" w="0" layout_weight="1">
              <text text="爬塔" textColor="#222222" textSize="16sp" />
              <text text="尝试各个职业塔，失败则跳过" textColor="#999999" textSize="14sp" />
            </vertical>
          </horizontal>
        </card>
        <card w="*" h="auto" margin="10 5" cardCornerRadius="2dp"
          cardElevation="1dp">
          <horizontal gravity="center_vertical">
            <checkbox id="咨询" marginLeft="4" marginRight="6" />
            <vertical padding="18 8" h="auto" w="0" layout_weight="1">
              <text text="咨询" textColor="#222222" textSize="16sp" />
              <text text="完成日常咨询，建议事先设置好特别关注" textColor="#999999" textSize="14sp" />
            </vertical>
          </horizontal>
        </card>
        <card w="*" h="auto" margin="10 5" cardCornerRadius="2dp"
          cardElevation="1dp">
          <horizontal gravity="center_vertical">
            <checkbox id="模拟室" marginLeft="4" marginRight="6" />
            <vertical padding="18 8" h="auto" w="0" layout_weight="1">
              <text text="模拟室" textColor="#222222" textSize="16sp" />
              <text text="刷取模拟室增益效果" textColor="#999999" textSize="14sp" />
            </vertical>
          </horizontal>
        </card>
        <vertical id='simulationRoom' visibility='gone'>
          <text textSize="16sp" margin="8">模拟室设置</text>
          <horizontal margin="10 2">
            <text id="maxPassText" textSize="14sp" w="0" layout_weight="4">重复1轮后停止：</text>
            <seekbar id="maxPass" w="0" layout_weight="6" />
          </horizontal>
          <horizontal margin="10 2">
            <text id="maxSsrText" textSize="14sp" w="0" layout_weight="4">刷到1个SSR后停止：</text>
            <seekbar id="maxSsrNumber" w="0" layout_weight="6" />
          </horizontal>
          <text margin="10 2" textSize="14sp">只考虑以下增益效果：</text>
          <vertical>
            <card w="*" h="auto" margin="10 2" cardCornerRadius="2dp"
              cardElevation="1dp">
              <horizontal gravity="center_vertical">
                <checkbox id="引流转换器" marginLeft="4" marginRight="6" />
                <vertical padding="18 8" h="auto" w="0" layout_weight="1">
                  <text text="引流转换器" textColor="#222222" textSize="14sp" />
                  <text text="攻击命中时恢复体力" textColor="#999999" textSize="12sp" />
                </vertical>
              </horizontal>
            </card>
            <card w="*" h="auto" margin="10 2" cardCornerRadius="2dp"
              cardElevation="1dp">
              <horizontal gravity="center_vertical">
                <checkbox id="高品质粉末" marginLeft="4" marginRight="6" />
                <vertical padding="18 8" h="auto" w="0" layout_weight="1">
                  <text text="高品质粉末" textColor="#222222" textSize="14sp" />
                  <text text="提高攻击力（不限对象）" textColor="#999999" textSize="12sp" />
                </vertical>
              </horizontal>
            </card>
            <card w="*" h="auto" margin="10 2" cardCornerRadius="2dp"
              cardElevation="1dp">
              <horizontal gravity="center_vertical">
                <checkbox id="冲击引流器" marginLeft="4" marginRight="6" />
                <vertical padding="18 8" h="auto" w="0" layout_weight="1">
                  <text text="冲击引流器" textColor="#222222" textSize="14sp" />
                  <text text="提高暴击伤害（不限对象）" textColor="#999999" textSize="12sp" />
                </vertical>
              </horizontal>
            </card>
            <card w="*" h="auto" margin="10 2" cardCornerRadius="2dp"
              cardElevation="1dp">
              <horizontal gravity="center_vertical">
                <checkbox id="控制引导器" marginLeft="4" marginRight="6" />
                <vertical padding="18 8" h="auto" w="0" layout_weight="1">
                  <text text="控制引导器" textColor="#222222" textSize="14sp" />
                  <text text="提高暴击率（不限对象）" textColor="#999999" textSize="12sp" />
                </vertical>
              </horizontal>
            </card>
            <card w="*" h="auto" margin="10 2" cardCornerRadius="2dp"
              cardElevation="1dp">
              <horizontal gravity="center_vertical">
                <checkbox id="聚焦瞄准镜" marginLeft="4" marginRight="6" />
                <vertical padding="18 8" h="auto" w="0" layout_weight="1">
                  <text text="聚焦瞄准镜" textColor="#222222" textSize="14sp" />
                  <text text="提高命中率" textColor="#999999" textSize="12sp" />
                </vertical>
              </horizontal>
            </card>
            <card w="*" h="auto" margin="10 2" cardCornerRadius="2dp"
              cardElevation="1dp">
              <horizontal gravity="center_vertical">
                <checkbox id="隐形粉" marginLeft="4" marginRight="6" />
                <vertical padding="18 8" h="auto" w="0" layout_weight="1">
                  <text text="隐形粉" textColor="#222222" textSize="14sp" />
                  <text text="提高全蓄力攻击伤害" textColor="#999999" textSize="12sp" />
                </vertical>
              </horizontal>
            </card>
            <card w="*" h="auto" margin="10 2" cardCornerRadius="2dp"
              cardElevation="1dp">
              <horizontal gravity="center_vertical">
                <checkbox id="快速充电器" marginLeft="4" marginRight="6" />
                <vertical padding="18 8" h="auto" w="0" layout_weight="1">
                  <text text="快速充电器" textColor="#222222" textSize="14sp" />
                  <text text="减少蓄力时间" textColor="#999999" textSize="12sp" />
                </vertical>
              </horizontal>
            </card>
          </vertical>
        </vertical>
      </vertical>
      <text textSize="16sp" margin="8 50 8 8">其他设置</text>
      <vertical>
        <horizontal margin="10 2" gravity="center_vertical" weightSum="10" h="0" layout_weight="1">
          <text textSize="16sp" w="0" textColor="#222222" layout_weight="8">静音运行（需要修改系统设置权限）</text>
          <checkbox id="mute" w="0" layout_weight="2" />
        </horizontal>
        <horizontal margin="10 2" gravity="center_vertical" weightSum="10" h="0" layout_weight="1">
          <text textSize="16sp" w="0" textColor="#222222" layout_weight="8">运行结束后退出游戏</text>
          <checkbox id="exitGame" w="0" layout_weight="2" />
        </horizontal>
        <horizontal margin="10 2" gravity="center_vertical" weightSum="10" h="0" layout_weight="1">
          <text textSize="16sp" w="0" textColor="#222222" layout_weight="8">已启动游戏且位于首页位置</text>
          <checkbox id="alreadyInGame" w="0" layout_weight="2" />
        </horizontal>
        <horizontal margin="10 2" gravity="center_vertical" weightSum="10" h="0" layout_weight="1">
          <text textSize="16sp" w="0" textColor="#222222" layout_weight="8">v2rayNG魔法</text>
          <checkbox id="v2rayNG" w="0" layout_weight="2" />
        </horizontal>
        <horizontal margin="10 2" gravity="center_vertical|left" weightSum="10" h="0" layout_weight="1">
          <text id="maxRetryText" textSize="16sp" textColor="#222222" w="0" layout_weight="6">脚本出错时不重试</text>
          <seekbar id="maxRetry" w="0" layout_weight="4" />
        </horizontal>
      </vertical>
      <button id="save" text="保存设置" />
    </vertical>
  </ScrollView>
);

const NIKKEstorage = storages.create("NIKKEconfig");
const todoTaskDefault = [
  "商店", "基地收菜", "好友", "竞技场",
  "爬塔", "咨询", "模拟室"
];
const simulationRoomDefault = {
  maxPass: 20,
  maxSsrNumber: 4,
  preferredBuff: [
    "引流转换器", "高品质粉末",
    "冲击引流器", "控制引导器"
  ]
};

let todoTask = JSON.parse(NIKKEstorage.get('todoTask', null));
if (todoTask == null)
  todoTask = todoTaskDefault;
let simulationRoom = JSON.parse(NIKKEstorage.get('simulationRoom', null));
if (simulationRoom == null)
  simulationRoom = simulationRoomDefault;

ui.findView('商店').on('check', function (checked) {
  ui.shopping.attr('visibility', checked ? 'visible' : 'gone');
});
ui.findView('模拟室').on('check', function (checked) {
  ui.simulationRoom.attr('visibility', checked ? 'visible' : 'gone');
});

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
ui.buyCodeManual.setProgress(NIKKEstorage.get('buyCodeManual', 3));

ui.maxPass.setMin(1);
ui.maxPass.setMax(50);
ui.maxPass.setOnSeekBarChangeListener({
  onProgressChanged: function (seekbar, p, fromUser) {
    ui.maxPassText.setText(`重复${p}轮后停止：`);
  }
});

ui.maxSsrNumber.setMin(1);
ui.maxSsrNumber.setMax(7);
ui.maxSsrNumber.setOnSeekBarChangeListener({
  onProgressChanged: function (seekbar, p, fromUser) {
    ui.maxSsrText.setText(`刷到${p}个SSR后停止：`);
  }
});

ui.maxPass.setProgress(simulationRoom.maxPass);
ui.maxSsrNumber.setProgress(simulationRoom.maxSsrNumber);
for (let task of todoTask)
  ui.findView(task).setChecked(true);
for (let buffName of simulationRoom.preferredBuff)
  ui.findView(buffName).setChecked(true);

for (let generalOption of ['mute', 'exitGame', 'alreadyInGame', 'v2rayNG'])
  ui.findView(generalOption).setChecked(NIKKEstorage.get(generalOption, false));
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

ui.save.on("click", function () {
  todoTask = [];
  for (let task of [
    "商店", "基地收菜", "好友", "竞技场",
    "爬塔", "咨询", "模拟室"
  ])
    if (ui.findView(task).isChecked())
      todoTask.push(task);
  NIKKEstorage.put('todoTask', JSON.stringify(todoTask));

  NIKKEstorage.put('buyCodeManual', ui.buyCodeManual.getProgress());

  simulationRoom = {};
  simulationRoom.maxPass = ui.maxPass.getProgress();
  simulationRoom.maxSsrNumber = ui.maxSsrNumber.getProgress();
  simulationRoom.preferredBuff = [];
  for (let buffName of [
    "引流转换器", "高品质粉末", "冲击引流器",
    "控制引导器", "聚焦瞄准镜", "隐形粉", "快速充电器"
  ])
    if (ui.findView(buffName).isChecked())
      simulationRoom.preferredBuff.push(buffName);
  NIKKEstorage.put('simulationRoom', JSON.stringify(simulationRoom));

  for (let generalOption of ['mute', 'exitGame', 'alreadyInGame', 'v2rayNG'])
    NIKKEstorage.put(generalOption, ui.findView(generalOption).isChecked());
  NIKKEstorage.put('maxRetry', ui.maxRetry.getProgress());

  ui.finish();
  toastLog('设置已保存');
});
