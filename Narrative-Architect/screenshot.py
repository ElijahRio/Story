from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto('http://localhost:5173')

    # Wait for the app to load
    page.wait_for_selector('text=Facility Registry')

    # Delete some items by filtering out an empty filter category (e.g. Memory, since no memory items exist initially)
    page.click('text=Memory')

    # Wait for the empty state
    page.wait_for_selector('text=No memory records found')

    # Take screenshot
    page.screenshot(path='empty_state.png')

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
