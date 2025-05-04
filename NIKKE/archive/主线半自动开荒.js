/*
自动处理：
- 进入战斗
- 跳过剧情
- 战斗成功/失败
*/
let {
  requestScreenCaptureAuto,
  clickRect,
  appear,
  appearThenClick,
  screenshot,
  imageColorCount,
  ocrInfo
} = require('./utils.js');
requestScreenCaptureAuto();
sleep(1000);
半自动();

function saveError(error) {
  let NIKKEstorage = storages.create("NIKKEconfig");
  const errorPath = files.path(`./nikkerror/${Date.now()}/`);
  const errorStrs = [
    `当前脚本版本：${NIKKEstorage.get('tagName', '无记录')}`,
    error.message,
    error.stack
  ];
  files.ensureDir(errorPath);
  if (ocrInfo.img) {
    images.save(ocrInfo.img, files.join(errorPath, 'error.png'));
  }
  if (ocrInfo.result) {
    errorStrs.push('');
    const res = ocrInfo.result.toArray(3);
    for (let i = 0; i < res.length; ++i) {
      errorStrs.push(`${res[i].bounds}\t"${res[i].text}"`);
    }
  }
  files.write(files.join(errorPath, 'log.txt'), errorStrs.join('\n'));
  console.error(`出错日志已保存到${errorPath}`);
  console.error('上报问题时请务必附上上述出错日志目录中的内容');
}
function 半自动() {
  const confirm = {
    text: '确认',
    regex: /[確确][認认定]$/
  };
  const backBtn = {
    text: '返回',
    regex: /返回/,
    filter: (bounds, img) =>
      bounds &&
      bounds.bottom > img.height * 0.7 &&
      bounds.right <= img.width / 2
  };
  const failed = {
    text: '作战失败',
    regex: /FA.LED/
  };
  const enterCombat = {
    text: '进入战斗',
    regex: /入战/,
    filter: (bounds, img) =>
      bounds &&
      bounds.bottom > img.height * 0.7 &&
      bounds.left >= img.width / 2
  };
  const quickCombat = {
    text: '快速战斗',
    regex: /快.战/,
    filter: (bounds, img) =>
      bounds &&
      bounds.bottom > img.height * 0.7 &&
      bounds.left >= img.width / 2
  };
  const autoBtn = {
    regex: /AUT/
  };
  const skipBtn = {
    text: 'SKIP',
    regex: /^[^LAUTOG]*SK.P[^LAUTOG]*$/
  }
  const reward = {
    regex: /(REWARD|下.步|任意处)/
  };
  let randomArea = { bounds: null };
  while (true) {
    screenshot();
    let img = ocrInfo.img;
    if (randomArea.bounds === null) {
      randomArea.bounds = new android.graphics.Rect();
      randomArea.bounds.left = img.width * 0.1;
      randomArea.bounds.right = img.width * 0.9;
      randomArea.bounds.top = img.height * 0.1;
      randomArea.bounds.bottom = img.height * 0.4;
    }
    if (appearThenClick(confirm)) {
      continue;
    }
    if (appear(backBtn)) {
      if (appear(failed)) {
        log('战斗失败');
        clickRect(backBtn, 1, 0);
      }
      sleep(2000);
      continue;
    }
    if (appear(quickCombat)) {
      let qbColor = ocrInfo.img.pixel(quickCombat.bounds.right + 3, quickCombat.bounds.centerY());
      if (colors.red(qbColor) > 120) {
        clickRect(quickCombat, 1, 0);
        sleep(1000);
        continue;
      }
    }
    if (appearThenClick(enterCombat)) {
      sleep(2000);
      continue;
    }
    if (appear(autoBtn)) {
      if (autoBtn.bounds.right < img.width / 2) {
        log('战斗中');
        sleep(7000);
        continue;
      }
      if (appearThenClick(skipBtn)) {
        sleep(1000);
        continue;
      }
      clickRect(randomArea, 1, 0);
      sleep(1000);
      continue;
    }
    if (appear(reward)) {
      log('战斗胜利');
      sleep(300);
      screenshot(undefined, false);
      img = ocrInfo.img;
      let startX = img.width / 2;
      let startY = Math.max(img.height * 0.8, img.height - 300);
      let blueColors = images.findAllPointsForColor(img, '#00a1ff', {
        region: [startX, startY],
        threshold: 40
      });
      if (blueColors && blueColors.length) {
        let topleft = blueColors.reduce((a, b) => {
          if (a.x == b.x) {
            return a.y < b.y ? a : b;
          }
          return a.x < b.x ? a : b;
        });
        let bottomright = blueColors.reduce((a, b) => {
          if (a.x == b.x) {
            return a.y > b.y ? a : b;
          }
          return a.x > b.x ? a : b;
        });
        let nextCombat = {
          text: '下一关卡',
          bounds: new android.graphics.Rect(
            topleft.x, topleft.y,
            bottomright.x, bottomright.y
          )
        };
        // 太小，是门票框
        if (nextCombat.bounds.width() < 200) {
          clickRect(randomArea, 1, 0);
        } else {
          clickRect(nextCombat, 0.8, 0);
        }
        sleep(2000);
        continue;
      };
      clickRect(randomArea, 1, 0);
      sleep(2000);
      continue;
    }
    sleep(500);
  }
}