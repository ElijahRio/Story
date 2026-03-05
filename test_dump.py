import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto("http://localhost:5173")

        # Click the "Dump" button
        await page.click("button:has-text('Dump')")

        # Wait a bit for the action to complete or fail
        await page.wait_for_timeout(3000)

        await page.screenshot(path="after_dump.png")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
