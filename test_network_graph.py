from playwright.sync_api import sync_playwright
import time
import json

def test_app():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:5173/")
        page.wait_for_load_state("networkidle")

        print("Navigating to Network Graph View...")
        page.click("text=Network Graph View")
        time.sleep(1) # wait for render

        print("Taking screenshot...")
        page.screenshot(path="network_graph_verification.png")

        # Verify canvas exists
        canvas = page.locator("canvas")
        if canvas.count() > 0:
            print("Canvas element found.")
        else:
            print("ERROR: Canvas element not found.")

        browser.close()

test_app()
