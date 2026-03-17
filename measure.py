import asyncio
from playwright.async_api import async_playwright
import time
import json
import uuid

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        entities = []
        for i in range(2000):
            entities.append({
                "id": f"e-{i}",
                "name": f"Entity {i}",
                "type": "asset" if i % 2 == 0 else "personnel",
                "description": "Some description",
                "systemic_inputs": "input",
                "systemic_outputs": "output"
            })

        for i in range(500):
            events = []
            events.append({
                "id": f"evt-{i}",
                "name": f"Event {i}",
                "type": "event",
                "sequence_number": str(i),
                "timestamp": f"2023-01-01",
                "involved_records": f"Entity {i}, Entity {i+1}"
            })
            entities.extend(events)

        await page.goto('http://localhost:5173')
        await page.evaluate(f"""
            const data = {json.dumps(entities)};
            localStorage.setItem('facility_registry_data', JSON.stringify(data));
        """)
        await page.goto('http://localhost:5173')

        await page.wait_for_selector('text=Global Search View')

        await page.evaluate("""
            const btns = document.querySelectorAll('button');
            for (let b of btns) {
                if (b.textContent.includes('Ancillus')) {
                    b.click();
                    break;
                }
            }
        """)

        await page.wait_for_selector('input[aria-label="Entity Name"]')

        start_time = time.time()
        for i in range(50):
            await page.fill('input[aria-label="Entity Name"]', f'Ancillus modified {i}')

        end_time = time.time()
        print(f"Time for 50 keystrokes: {end_time - start_time:.4f} seconds")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
