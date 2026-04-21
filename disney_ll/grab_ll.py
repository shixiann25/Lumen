"""
Disney World Lightning Lane Multi Pass 自动抢票脚本
使用 Playwright 浏览器自动化，在开放时间精准点击预订。

运行方式：
    pip install playwright pytz
    playwright install chromium
    python grab_ll.py --date 2026-05-01
"""

import argparse
import asyncio
import logging
import sys
import time
from datetime import datetime, timedelta, timezone

import pytz

from config import (
    ADVANCE_DAYS,
    DISNEY_EMAIL,
    DISNEY_PASSWORD,
    LL_OPEN_HOUR_ET,
    LL_OPEN_MINUTE_ET,
    MAX_RETRIES,
    PARKS,
    PARTY_MEMBERS,
    PRIORITY_ATTRACTIONS,
    RETRY_INTERVAL,
    VISIT_DATES,
    WARMUP_SECONDS,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

ET = pytz.timezone("America/New_York")
PT = pytz.timezone("America/Los_Angeles")

BASE_URL = "https://disneyworld.disney.go.com"
LL_URL = f"{BASE_URL}/plan/my-disney-experience/lightning-lane/"


def compute_grab_time(visit_date_str: str) -> datetime:
    """计算抢票时间（ET），转换为 UTC。"""
    visit_date = datetime.strptime(visit_date_str, "%Y-%m-%d").date()
    grab_date = visit_date - timedelta(days=ADVANCE_DAYS)
    grab_et = ET.localize(
        datetime(
            grab_date.year,
            grab_date.month,
            grab_date.day,
            LL_OPEN_HOUR_ET,
            LL_OPEN_MINUTE_ET,
            0,
        )
    )
    return grab_et.astimezone(timezone.utc)


def wait_until(target_utc: datetime, warmup: int = WARMUP_SECONDS):
    """阻塞到目标时间前 warmup 秒，然后精准等待。"""
    now = datetime.now(timezone.utc)
    pre_target = target_utc - timedelta(seconds=warmup)
    if now < pre_target:
        sleep_sec = (pre_target - now).total_seconds()
        target_pt = target_utc.astimezone(PT)
        log.info(
            "抢票时间（加州）: %s  — 先睡 %.0f 秒",
            target_pt.strftime("%Y-%m-%d %H:%M:%S %Z"),
            sleep_sec,
        )
        time.sleep(sleep_sec)

    # 精准等待剩余时间
    log.info("进入倒计时阶段...")
    while True:
        remaining = (target_utc - datetime.now(timezone.utc)).total_seconds()
        if remaining <= 0:
            break
        if remaining > 5:
            time.sleep(1)
        else:
            time.sleep(0.05)
    log.info("时间到！开始抢票")


async def login(page):
    """登录 My Disney Experience。"""
    log.info("打开登录页...")
    await page.goto(f"{BASE_URL}/login/", wait_until="networkidle")

    # 输入邮箱
    await page.fill('input[name="loginValue"]', DISNEY_EMAIL)
    await page.click('button[type="submit"]')
    await page.wait_for_timeout(1500)

    # 输入密码
    await page.fill('input[name="password"]', DISNEY_PASSWORD)
    await page.click('button[type="submit"]')

    # 等待跳转到主页
    await page.wait_for_url(f"{BASE_URL}/**", timeout=15000)
    log.info("登录成功")


async def select_party(page):
    """选择出行成员（如果配置了指定成员）。"""
    if not PARTY_MEMBERS:
        log.info("使用全部成员（未指定 PARTY_MEMBERS）")
        return

    log.info("选择成员: %s", PARTY_MEMBERS)
    # Disney 页面上成员列表的 selector 可能因版本变化
    member_labels = await page.query_selector_all('[data-testid="party-member-label"]')
    for label in member_labels:
        name = await label.inner_text()
        if any(m.lower() in name.lower() for m in PARTY_MEMBERS):
            checkbox = await label.query_selector('input[type="checkbox"]')
            if checkbox and not await checkbox.is_checked():
                await checkbox.click()


async def grab_for_date(page, visit_date: str, park: str):
    """对某一天执行抢票流程。"""
    log.info("=== 开始抢 %s / %s ===", visit_date, park)

    for attraction in PRIORITY_ATTRACTIONS:
        log.info("目标项目: %s", attraction)
        success = False

        for attempt in range(1, MAX_RETRIES + 1):
            try:
                # 进入 LL 预订页
                await page.goto(LL_URL, wait_until="domcontentloaded", timeout=15000)
                await page.wait_for_timeout(1000)

                # 选乐园（如果页面有乐园选择器）
                park_btn = page.locator(f'text="{park}"').first
                if await park_btn.is_visible():
                    await park_btn.click()
                    await page.wait_for_timeout(800)

                # 找项目卡片
                card = page.locator(f'text="{attraction}"').first
                if not await card.is_visible(timeout=3000):
                    log.debug("第 %d 次：未找到 %s，重试...", attempt, attraction)
                    await asyncio.sleep(RETRY_INTERVAL)
                    continue

                await card.click()
                await page.wait_for_timeout(1000)

                # 选成员
                await select_party(page)

                # 选时间段（选第一个可用）
                time_btn = page.locator('[data-testid="time-slot-button"]:not([disabled])').first
                if not await time_btn.is_visible(timeout=3000):
                    log.debug("第 %d 次：暂无时间段，重试...", attempt)
                    await asyncio.sleep(RETRY_INTERVAL)
                    continue

                slot_text = await time_btn.inner_text()
                log.info("发现时间段: %s，点击预订...", slot_text.strip())
                await time_btn.click()
                await page.wait_for_timeout(800)

                # 确认预订
                confirm_btn = page.locator(
                    'button:has-text("Confirm"), button:has-text("Reserve"), button:has-text("Book")'
                ).first
                if await confirm_btn.is_visible(timeout=3000):
                    await confirm_btn.click()
                    await page.wait_for_timeout(2000)

                # 验证成功（URL 跳转到确认页，或出现成功提示）
                if "confirmation" in page.url or "success" in page.url:
                    log.info("✅ 成功预订: %s  时间: %s", attraction, slot_text.strip())
                    success = True
                    break
                else:
                    # 检查页面是否有成功文案
                    if await page.locator('text="Lightning Lane reserved"').is_visible(timeout=2000):
                        log.info("✅ 成功预订: %s  时间: %s", attraction, slot_text.strip())
                        success = True
                        break

                log.debug("第 %d 次：未确认成功，继续重试", attempt)
                await asyncio.sleep(RETRY_INTERVAL)

            except Exception as exc:
                log.warning("第 %d 次异常: %s", attempt, exc)
                await asyncio.sleep(RETRY_INTERVAL)

        if not success:
            log.warning("❌ 未能预订 %s（重试 %d 次后放弃）", attraction, MAX_RETRIES)
        else:
            # 抢到一个后稍等再继续抢下一个
            await asyncio.sleep(3)


async def main(target_date: str):
    from playwright.async_api import async_playwright

    park = PARKS.get(target_date)
    if not park:
        log.error("未在 config.py PARKS 中配置日期 %s", target_date)
        sys.exit(1)

    grab_utc = compute_grab_time(target_date)
    wait_until(grab_utc)

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(
            headless=False,  # 设为 True 则无界面运行；先用 False 方便调试
            slow_mo=200,
        )
        ctx = await browser.new_context(
            locale="en-US",
            timezone_id="America/New_York",
            viewport={"width": 1280, "height": 900},
        )
        page = await ctx.new_page()

        try:
            await login(page)
            await grab_for_date(page, target_date, park)
        finally:
            await browser.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Disney LL 抢票脚本")
    parser.add_argument(
        "--date",
        required=True,
        help="游玩日期 YYYY-MM-DD，例如 2026-05-01",
    )
    args = parser.parse_args()

    if args.date not in VISIT_DATES:
        log.error("日期 %s 不在 VISIT_DATES 中，请先在 config.py 添加", args.date)
        sys.exit(1)

    asyncio.run(main(args.date))
