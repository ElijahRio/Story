import re

class MockRegexCache:
    def __init__(self, entities):
        self.entities = entities

class AppState:
    def __init__(self):
        self.entityLinkDictionary = [
            {"id": str(i), "name": f"Entity {i}", "matchFullName": re.compile(f"\\bentity {i}\\b", re.I), "matchBaseName": None, "matchStrippedName": None}
            for i in range(2000)
        ]
        self.globalNamesHash = "hash1"
        self.detectedLinksCacheRef = {"hash": "hash1", "cache": {}}

    def getDetectedLinks_old(self, text, currentId):
        safeText = str(text) if text else ""
        if not safeText: return []

        if self.detectedLinksCacheRef["hash"] != self.globalNamesHash:
            self.detectedLinksCacheRef["cache"].clear()
            self.detectedLinksCacheRef["hash"] = self.globalNamesHash

        cachedEntry = self.detectedLinksCacheRef["cache"].get(currentId)
        if cachedEntry and cachedEntry["text"] == safeText:
            return cachedEntry["result"]

        lowerText = safeText.lower()

        result = []
        for e in self.entityLinkDictionary:
            if e["id"] == currentId: continue
            if e["matchFullName"].search(lowerText):
                result.append(e)

        self.detectedLinksCacheRef["cache"][currentId] = {"text": safeText, "result": result}
        return result

    def getDetectedLinks_new(self, text, currentId, field="default"):
        safeText = str(text) if text else ""
        if not safeText: return []

        if self.detectedLinksCacheRef["hash"] != self.globalNamesHash:
            self.detectedLinksCacheRef["cache"].clear()
            self.detectedLinksCacheRef["hash"] = self.globalNamesHash

        entityCache = self.detectedLinksCacheRef["cache"].setdefault(currentId, {})
        cachedEntry = entityCache.get(field)

        if cachedEntry and cachedEntry["text"] == safeText:
            return cachedEntry["result"]

        lowerText = safeText.lower()

        result = []
        for e in self.entityLinkDictionary:
            if e["id"] == currentId: continue
            if e["matchFullName"].search(lowerText):
                result.append(e)

        entityCache[field] = {"text": safeText, "result": result}
        return result

import time

app = AppState()
currentId = "1"
texts = ["This is description for entity 2", "This is inputs for entity 3", "This is outputs for entity 4"]

# Old
app.detectedLinksCacheRef["cache"].clear()
start = time.time()
for _ in range(100):  # 100 renders
    for t in texts:
        app.getDetectedLinks_old(t, currentId)
print("Old time:", time.time() - start)

# New
app.detectedLinksCacheRef["cache"].clear()
start = time.time()
for _ in range(100):  # 100 renders
    for i, t in enumerate(texts):
        app.getDetectedLinks_new(t, currentId, f"field_{i}")
print("New time:", time.time() - start)

