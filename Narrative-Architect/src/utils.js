export const safeString = (val) => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) return val.join(', ');
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
};

export const sanitizeEntity = (entity) => {
  if (!entity) return entity;
  const sanitized = { ...entity };
  for (const key in sanitized) {
    if (Object.prototype.hasOwnProperty.call(sanitized, key)) {
      if (key !== 'id' && key !== 'type') {
        sanitized[key] = safeString(sanitized[key]);
      }
    }
  }
  return sanitized;
};

export function calculateCosineSimilarity(vecA, vecB) {
  let dotProduct = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function parseDateString(dateStr) {
  if (!dateStr) return null;
  const str = safeString(dateStr);
  const parts = str.match(/^(\d{1,4})[-/.](\d{1,2})[-/.](\d{1,4})$/);
  if (parts) {
    const d1 = parseInt(parts[1], 10);
    const d2 = parseInt(parts[2], 10);
    const d3 = parseInt(parts[3], 10);

    let date;
    if (parts[3].length === 4) {
      // Assume DD-MM-YYYY
      // Use UTC to avoid timezone issues for simple date parsing
      date = new Date(Date.UTC(d3, d2 - 1, d1));
      if (date.getUTCFullYear() !== d3 || date.getUTCMonth() !== d2 - 1 || date.getUTCDate() !== d1) {
        return null;
      }
      return date;
    } else if (parts[1].length === 4) {
      // Assume YYYY-MM-DD
      date = new Date(Date.UTC(d1, d2 - 1, d3));
      if (date.getUTCFullYear() !== d1 || date.getUTCMonth() !== d2 - 1 || date.getUTCDate() !== d3) {
        return null;
      }
      return date;
    }
  }
  const fb = new Date(str);
  return isNaN(fb.getTime()) ? null : fb;
}

export function getAge(birthStr, eventStr) {
  const b = parseDateString(birthStr);
  const e = parseDateString(eventStr);
  if (!b || !e) return null;

  // Use UTC methods to match the new parseDateString behavior
  let age = e.getUTCFullYear() - b.getUTCFullYear();
  const m = e.getUTCMonth() - b.getUTCMonth();
  if (m < 0 || (m === 0 && e.getUTCDate() < b.getUTCDate())) {
    age--;
  }
  return age;
}
