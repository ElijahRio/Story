import time
from playwright.sync_api import sync_playwright

def test_performance():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.on("console", lambda msg: print(f"Browser console: {msg.text}") if "regex-compile" in msg.text else None)

        # We need to set up localStorage before loading the page so it has ~2000 entities
        import json
        entities = []
        for i in range(2000):
            entities.append({
                "id": f"e-{i}",
                "type": "asset",
                "name": f"Asset {i}",
                "description": "Just an asset for testing performance.",
                "systemic_inputs": "None",
                "systemic_outputs": "None"
            })

        print("Starting Vite server...")
        import subprocess
        vite_process = subprocess.Popen(["pnpm", "dev"], cwd="Narrative-Architect", stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        time.sleep(3) # Wait for server to start

        try:
            print("Loading page...")
            page.goto("http://localhost:5173")

            # Inject data
            page.evaluate(f"localStorage.setItem('facility_registry_data', JSON.stringify({json.dumps(entities)}));")

            # Reload to pick up the injected data
            page.reload()
            time.sleep(2)

            # Click on the first asset to edit its name, which triggers a re-render
            print("Editing an entity name to trigger re-renders...")
            page.click("text=Asset 0")
            time.sleep(1)

            # Type into the name field to trigger re-renders
            input_locator = page.locator("input[type='text']").first
            input_locator.fill("Asset 0 Modified")
            time.sleep(2)

            print("Done capturing logs.")

        finally:
            vite_process.terminate()
            browser.close()

if __name__ == "__main__":
    test_performance()
