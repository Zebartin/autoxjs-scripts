import logging
import sys
import time
import random

from playwright.sync_api import sync_playwright

logger = logging.getLogger('NIKKE-PASS-CHECKIN')
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s')


def main():
    if len(sys.argv) != 3:
        return
    EMAIL_ADDRESS = sys.argv[1]
    PASSWORD = sys.argv[2]

    random_duration = random.randint(0, 3600*3)
    logger.info(f'随机等待 {random_duration} 秒')
    time.sleep(random_duration)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        try:
            page = browser.new_page()
            page.goto(
                "https://pass.levelinfinite.com/rewards?lang=zh&points=%2Fpoints%2F")
            page.get_by_role("button", name="接受所有可选 cookies").click()
            # login
            logger.info('开始登录')
            page.get_by_text('登录以获得').locator('..').click()
            page.get_by_text("密码登录", exact=True).click()
            page.get_by_placeholder('邮箱地址').fill(EMAIL_ADDRESS)
            page.get_by_placeholder('密码').fill(PASSWORD)
            page.get_by_role("button").filter(
                has_text="登录", has_not_text="邮箱").click()
            page.get_by_role("button").filter(has_text="完成").click()
            logger.info('等待登录完成……')
            page.get_by_text('登录以获得').wait_for(state='hidden')
            logger.info('登录完成')
            # 签到
            while 1:
                confirm = page.get_by_role('span').filter(has_text='确认')
                if confirm.count() == 1:
                    logger.info('点击确认')
                    confirm.click()
                    continue
                first_quest = page.locator("#app-rewards .quests > div").first
                imgs = first_quest.locator('img')
                if imgs.first.get_attribute('class').split()[-1] == 'opacity-100':
                    logger.info('已签到')
                    break
                else:
                    logger.info('点击签到')
                    first_quest.click()
        finally:
            browser.close()


if __name__ == "__main__":
    main()
