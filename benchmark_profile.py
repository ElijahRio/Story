import asyncio
from playwright.async_api import async_playwright
import time
import json
import uuid
import random

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        entities = []
        for i in range(2000):
            entities.append({
                "id": str(uuid.uuid4()),
                "name": f"Entity Name {i}",
                "type": "character" if i % 2 == 0 else "location",
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

        await page.goto('http://localhost:5173')

        await page.evaluate(f"""
            const data = {json.dumps(all_data)};
            localStorage.setItem('facility_registry_data', JSON.stringify(data));
        """)

        await page.goto('http://localhost:5173')

        page.on("console", lambda msg: print(f"Console: {msg.text}"))

        await page.wait_for_selector('text=Timeline')

        start_time = time.time()
        await page.evaluate("""
            const btns = document.querySelectorAll('button');
            for (let b of btns) {
                if (b.textContent.includes('Timeline')) {
                    b.click();
                    break;
                }
            }
        """)

        try:
            await page.wait_for_selector('text=Chronological Flow', timeout=10000)
            await page.wait_for_selector('text=Event 0', timeout=5000)
        except Exception as e:
            print("Timeout waiting for render:", e)

        end_time = time.time()
        print(f"Total time block: {end_time - start_time:.4f} seconds")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
