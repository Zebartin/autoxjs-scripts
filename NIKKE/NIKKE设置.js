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
              <text text="购买商店免费物品" textColor="#999999" textSize="14sp" />
            </vertical>
          </horizontal>
        </card>
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
      </vertical>
      <vertical id='simulationRoom' visibility='gone'>
        <text textSize="16sp" margin="8">模拟室选项</text>
        <horizontal margin="10 2">
          <text id="maxPassText" textSize="14sp">重复1轮后停止：</text>
          <seekbar id="maxPass" w="*" />
        </horizontal>
        <horizontal margin="10 2">
          <text id="maxSsrText" textSize="14sp">刷到1个SSR后停止：</text>
          <seekbar id="maxSsrNumber" w="*" />
        </horizontal>
        <text margin="10 2" textSize="14sp">勾选偏好增益效果：</text>
        <vertical>
          <card w="*" h="auto" margin="10 2" cardCornerRadius="2dp"
            cardElevation="1dp">
            <horizontal gravity="center_vertical">
              <checkbox id="引流转换器" marginLeft="4" marginRight="6" />
              <vertical padding="18 8" h="auto" w="0" layout_weight="1">
                <text text="引流转换器" textColor="#222222" textSize="16sp" />
                <text text="攻击命中时恢复体力" textColor="#999999" textSize="14sp" />
              </vertical>
            </horizontal>
          </card>
          <card w="*" h="auto" margin="10 2" cardCornerRadius="2dp"
            cardElevation="1dp">
            <horizontal gravity="center_vertical">
              <checkbox id="高品质粉末" marginLeft="4" marginRight="6" />
              <vertical padding="18 8" h="auto" w="0" layout_weight="1">
                <text text="高品质粉末" textColor="#222222" textSize="16sp" />
                <text text="提高攻击力（不限对象）" textColor="#999999" textSize="14sp" />
              </vertical>
            </horizontal>
          </card>
          <card w="*" h="auto" margin="10 2" cardCornerRadius="2dp"
            cardElevation="1dp">
            <horizontal gravity="center_vertical">
              <checkbox id="冲击引流器" marginLeft="4" marginRight="6" />
              <vertical padding="18 8" h="auto" w="0" layout_weight="1">
                <text text="冲击引流器" textColor="#222222" textSize="16sp" />
                <text text="提高暴击伤害（不限对象）" textColor="#999999" textSize="14sp" />
              </vertical>
            </horizontal>
          </card>
          <card w="*" h="auto" margin="10 2" cardCornerRadius="2dp"
            cardElevation="1dp">
            <horizontal gravity="center_vertical">
              <checkbox id="控制引导器" marginLeft="4" marginRight="6" />
              <vertical padding="18 8" h="auto" w="0" layout_weight="1">
                <text text="控制引导器" textColor="#222222" textSize="16sp" />
                <text text="提高暴击率（不限对象）" textColor="#999999" textSize="14sp" />
              </vertical>
            </horizontal>
          </card>
          <card w="*" h="auto" margin="10 2" cardCornerRadius="2dp"
            cardElevation="1dp">
            <horizontal gravity="center_vertical">
              <checkbox id="聚焦瞄准镜" marginLeft="4" marginRight="6" />
              <vertical padding="18 8" h="auto" w="0" layout_weight="1">
                <text text="聚焦瞄准镜" textColor="#222222" textSize="16sp" />
                <text text="提高命中率" textColor="#999999" textSize="14sp" />
              </vertical>
            </horizontal>
          </card>
          <card w="*" h="auto" margin="10 2" cardCornerRadius="2dp"
            cardElevation="1dp">
            <horizontal gravity="center_vertical">
              <checkbox id="隐形粉" marginLeft="4" marginRight="6" />
              <vertical padding="18 8" h="auto" w="0" layout_weight="1">
                <text text="隐形粉" textColor="#222222" textSize="16sp" />
                <text text="提高全蓄力攻击伤害" textColor="#999999" textSize="14sp" />
              </vertical>
            </horizontal>
          </card>
          <card w="*" h="auto" margin="10 2" cardCornerRadius="2dp"
            cardElevation="1dp">
            <horizontal gravity="center_vertical">
              <checkbox id="快速充电器" marginLeft="4" marginRight="6" />
              <vertical padding="18 8" h="auto" w="0" layout_weight="1">
                <text text="快速充电器" textColor="#222222" textSize="16sp" />
                <text text="减少蓄力时间" textColor="#999999" textSize="14sp" />
              </vertical>
            </horizontal>
          </card>
        </vertical>
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
// NIKKEstorage.clear();
// exit();
let todoTask = JSON.parse(NIKKEstorage.get('todoTask', null));
if (todoTask == null)
  todoTask = todoTaskDefault;
let simulationRoom = JSON.parse(NIKKEstorage.get('simulationRoom', null));
if (simulationRoom == null)
  simulationRoom = simulationRoomDefault;

ui.findView('模拟室').on('check', function (checked) {
  if (!checked)
    ui.simulationRoom.attr('visibility', 'gone');
  else
    ui.simulationRoom.attr('visibility', 'visible');
});


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

ui.save.on("click", function () {
  todoTask = [];
  for (let task of [
    "商店", "基地收菜", "好友", "竞技场",
    "爬塔", "咨询", "模拟室"
  ])
    if (ui.findView(task).isChecked())
      todoTask.push(task);
  NIKKEstorage.put('todoTask', JSON.stringify(todoTask));

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
  toastLog('设置已保存');
});
