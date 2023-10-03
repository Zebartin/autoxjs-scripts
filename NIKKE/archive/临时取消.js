const 取消退出 = true;

let NIKKEstorage = storages.create("NIKKEconfig");
const oldTask = NIKKEstorage.get('todoTask', '[]');
const oldTarget = NIKKEstorage.get('rookieArenaTarget', 1);
const oldExit = NIKKEstorage.get('exitGame', false);
log(`原有设置：${oldTask}, 新人竞技场选择第${oldTarget}个对手`)
NIKKEstorage.put('todoTask', JSON.stringify(['基地收菜', '好友', '竞技场']));
NIKKEstorage.put('rookieArenaTarget', 0);
if (取消退出)
    NIKKEstorage.put('exitGame', false);
let e = engines.execScriptFile('./NIKKE日常.js');
sleep(2 * 60 * 1000);
try {
    while (e.getEngine().isDestroyed() == false)
        sleep(2000);
} finally {
    NIKKEstorage.put('todoTask', oldTask);
    NIKKEstorage.put('rookieArenaTarget', oldTarget);
    if (取消退出)
        NIKKEstorage.put('exitGame', oldExit);
    log('设置已恢复');
}