import time
import json
import uuid
import random
from playwright.sync_api import sync_playwright

def test():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        entities = []
        for i in range(2000):
            entities.append({
                "id": str(uuid.uuid4()),
                "name": f"Entity Name {i}",
                "type": "asset" if i % 2 == 0 else "personnel",
                "description": "Some description",
                "aliases": f"Alias {i}",
                "timestamp": "2023-01-01"
            })

        events = []
        for i in range(500):
            involved_records = [f"Entity Name {random.randint(0, 1999)}" for _ in range(5)]
            events.append({
                "id": str(uuid.uuid4()),
                "name": f"Event {i}",
                "type": "event",
                "sequence_number": str(i),
                "timestamp": f"2023-01-{i%28+1:02d}",
                "involved_records": ",".join(involved_records)
            })

        all_data = entities + events

        page.goto('http://localhost:5173')

        page.evaluate(f"""
            const data = {json.dumps(all_data)};
            localStorage.setItem('facility_registry_data', JSON.stringify(data));
        """)

        page.goto('http://localhost:5173')

        start_time = time.time()
        page.wait_for_selector('text=Timeline')
        page.evaluate("""
            const btns = document.querySelectorAll('button');
            for (let b of btns) {
                if (b.textContent.includes('Timeline')) {
                    b.click();
                    break;
                }
            }
        """)

        try:
            page.wait_for_selector('text=Chronological Flow', timeout=10000)
        except Exception as e:
            pass

        end_time = time.time()
        print(f"Time to render timeline view: {end_time - start_time:.4f} seconds")

        browser.close()

if __name__ == "__main__":
    test()
