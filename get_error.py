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
        for i in range(10):
            entities.append({
                "id": str(uuid.uuid4()),
                "name": f"Entity Name {i}",
                "type": "character" if i % 2 == 0 else "location",
                "description": "Some description",
                "aliases": f"Alias {i}",
                "timestamp": "2023-01-01"
            })

        events = []
        for i in range(10):
            involved_records = [f"Entity Name {random.randint(0, 9)}" for _ in range(2)]
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

        page.on("pageerror", lambda err: print(f"Page Error: {err.message}"))

        await page.wait_for_selector('text=Timeline')
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
