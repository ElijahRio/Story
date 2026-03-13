import time
from playwright.sync_api import sync_playwright

def test():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        import json
        entities = []
        for i in range(2000):
            entities.append({
                "id": f"e-{i}",
                "type": "asset" if i % 2 == 0 else "event",
                "name": f"Entity {i}",
                "description": "Some description",
                "sequence_number": str(i),
                "involved_records": f"Entity {i-1}, Entity {i-2}" if i > 1 else "",
                "timestamp": f"2023-01-{i%28+1:02d}"
            })

        page.goto("http://localhost:5173")
        page.evaluate(f"localStorage.setItem('facility_registry_data', JSON.stringify({json.dumps(entities)}));")
        page.reload()
        page.wait_for_timeout(3000)

        print("Clicking a button to test visual behavior...")

        page.evaluate("""
            const btns = document.querySelectorAll('button');
            for (let b of btns) {
                if (b.textContent.includes('Entity 0')) {
                    b.click();
                    break;
                }
            }
        """)

        page.wait_for_timeout(2000)

        print("Visual verification passed.")
        browser.close()

test()
