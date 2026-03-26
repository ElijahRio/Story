import os
from playwright.sync_api import sync_playwright

def verify_feature(page):
    page.goto("http://localhost:5173")
    page.wait_for_timeout(500)

    # Wait for the app to load
    page.wait_for_selector('text=Facility Registry')

    # Click on a filter that is likely to be empty
    page.click('text=Memory')

    # Wait for the empty state
    page.wait_for_selector('text=No memory records found')
    page.wait_for_timeout(1000)

    # Take screenshot
    page.screenshot(path="/home/jules/verification/verification.png")
    page.wait_for_timeout(500)

if __name__ == "__main__":
    os.makedirs("/home/jules/verification/video", exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(record_video_dir="/home/jules/verification/video")
        page = context.new_page()
        try:
            verify_feature(page)
        finally:
            context.close()
            browser.close()
