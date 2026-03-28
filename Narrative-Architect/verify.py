import time
from playwright.sync_api import sync_playwright

def verify():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context()
        page = context.new_page()
        page.goto('http://localhost:5173')

        # Click Metro View
        page.locator('button', has_text='Metro Timeline View').click()
        time.sleep(1)
        page.screenshot(path='metro_empty_state_1.png')

        # Add an entity to the metro timeline to trigger the second empty state
        page.locator('select').select_option(label='Dolly (Asteria) (asset)')
        page.locator('button', has_text='Add Line').click()
        time.sleep(1)
        page.screenshot(path='metro_empty_state_2.png')

        # Click Master Timeline View
        page.locator('button', has_text='Master Timeline View').click()
        time.sleep(1)

        # Wait for events to load in Master Timeline
        page.wait_for_selector('div[role="button"]:has-text("Judas Eye V1 Catastrophe")')

        # Purge the first event
        page.locator('div[role="button"]:has-text("Judas Eye V1 Catastrophe")').click()
        time.sleep(1)
        page.locator('button[aria-label="Purge record"]').click()
        time.sleep(1)
        page.locator('button[aria-label="Confirm purge record"]').click()
        time.sleep(1)

        # Navigate back to Master Timeline View to see the second event
        page.locator('button', has_text='Master Timeline View').click()
        time.sleep(1)

        # Purge the second event
        page.locator('div[role="button"]:has-text("Integration of Compound S12")').click()
        time.sleep(1)
        page.locator('button[aria-label="Purge record"]').click()
        time.sleep(1)
        page.locator('button[aria-label="Confirm purge record"]').click()
        time.sleep(1)

        # Go back to Master Timeline View to see empty state
        page.locator('button', has_text='Master Timeline View').click()
        time.sleep(1)

        page.screenshot(path='master_empty_state.png')

        browser.close()

if __name__ == '__main__':
    verify()
