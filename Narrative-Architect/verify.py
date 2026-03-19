from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(record_video_dir="/app/Narrative-Architect/video")
    page = context.new_page()

    print("Navigating to app...")
    page.goto("http://localhost:5173/")
    page.wait_for_timeout(2000)

    print("Selecting Dolly (Asteria)...")
    # Click on the Dolly (Asteria) sidebar item to open an entity that has detected links
    page.click("text=Dolly (Asteria)")
    page.wait_for_timeout(1000)

    print("Focusing the first Conveyor Belt link...")
    # The links are rendered inside the TextAreaField.
    # We want to focus the first detected link to show the focus ring.
    # Let's find the button with title starting with "Maps to"
    link_button = page.locator("button[title^='Maps to']").first
    link_button.focus()
    page.wait_for_timeout(1000)

    print("Taking screenshot...")
    page.screenshot(path="/app/Narrative-Architect/verification.png")
    page.wait_for_timeout(1000)

    context.close()
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
