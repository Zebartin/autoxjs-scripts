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
            # print(page.context.cookies())
            # 签到
            check_count = 0
            while 1:
                confirm = page.locator('div').get_by_text('确认', exact=True)
                if confirm.count() == 1:
                    logger.info('点击确认')
                    check_count = 0
                    confirm.click()
                else:
                    first_quest = page.locator("#app-points > div > div > div > div:nth-child(2) > div.mt-\[var\(--dc-28\)\] > div > div:nth-child(1)").first
                    imgs = first_quest.locator('img')
                    opacity_class = imgs.first.get_attribute('class').split()[-1]
                    if opacity_class == 'opacity-100':
                        check_count += 1
                        if check_count == 3:
                            logger.info('已签到')
                            break
                    elif opacity_class == 'opacity-0':
                        logger.info('点击签到')
                        first_quest.click(force=True)
                time.sleep(random.randint(1, 3))
        finally:
            browser.close()


if __name__ == "__main__":
    main()
