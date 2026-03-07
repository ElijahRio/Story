import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto("http://localhost:5173")

        # Select the first entity in the list to open the detail view
        await page.click("button:has-text('Ancillus')")

        await page.wait_for_timeout(1000)

        # Click the "Purge Record" button
        await page.click("button[title='Purge Record']")

        # Wait a bit for the UI state to update
        await page.wait_for_timeout(1000)

        await page.screenshot(path="purge_confirm_state.png")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())