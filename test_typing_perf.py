from playwright.sync_api import sync_playwright
import time

def run_benchmark():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:5173")
        page.wait_for_selector("text=Facility Registry")

        # Select an entity
        page.click("text=Ancillus")
        page.wait_for_selector("text=Birth / Assembly Date")

        # Inject performance observer
        page.evaluate("""
            window.perfData = { durations: [] };
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.duration > 10) {
                        window.perfData.durations.push(entry.duration);
                    }
                }
            });
            observer.observe({ entryTypes: ['longtask'] });
        """)

        start = time.time()
        # Type into description
        page.locator("textarea[placeholder='Define the core nature of this entity...']").type("Testing performance of typing into this field over and over.", delay=10)
        end = time.time()

        durations = page.evaluate("window.perfData.durations")
        print(f"Total time taken to type: {end - start}s")
        print(f"Long tasks: {durations}")

        browser.close()

run_benchmark()
