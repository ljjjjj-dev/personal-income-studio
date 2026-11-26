import { DEFAULT_CATEGORIES, createSeedData, makeMonthId } from './seed.js';

const LS_KEY = 'personal_income_studio_v1';

export function migrateStore(json) {
  if (!json || (json.version || 1) >= 6) {
    return { data: json, migrated: false };
  }
  const colorById = new Map(DEFAULT_CATEGORIES.map((c) => [c.id, c.color]));
  const categories = Array.isArray(json.categories)
    ? json.categories.map((cat) =>
        cat.builtIn && colorById.has(cat.id)
          ? { ...cat, color: colorById.get(cat.id) }
          : cat
      )
    : DEFAULT_CATEGORIES;
  return {
    data: {
      ...json,
      version: 6,
      categories,
    },
    migrated: true,
  };
}

export async function loadStoreData() {
  try {
    const res = await fetch('/api/data', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json && Array.isArray(json.categories) && Array.isArray(json.records)) {
        const { data, migrated } = migrateStore(json);
        try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch {}
        if (migrated) await saveStoreData(data);
        return { data, source: 'file' };
      }
    }
  } catch {}

  try {
    const cached = localStorage.getItem(LS_KEY);
    if (cached) {
      const json = JSON.parse(cached);
      if (json && Array.isArray(json.categories) && Array.isArray(json.records)) {
        const { data } = migrateStore(json);
        saveStoreData(data);
        return { data, source: 'local' };
      }
    }
  } catch {}

  const seed = createSeedData();
  await saveStoreData(seed);
  return { data: seed, source: 'seed' };
}

export async function saveStoreData(data) {
  const payload = { ...data, updatedAt: new Date().toISOString() };
  try { localStorage.setItem(LS_KEY, JSON.stringify(payload)); } catch {}
  try {
    const res = await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) return { ok: true, mode: 'file' };
  } catch {}
  return { ok: true, mode: 'local' };
}

function xmlEsc(v) {
  return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildWorksheetXml(name, rows) {
  const rowsXml = rows
    .map((row) => {
      const cells = row
        .map((cell) => {
          if (cell === null || cell === undefined || cell === '') return '<Cell><Data ss:Type="String"></Data></Cell>';
          if (typeof cell === 'number' && Number.isFinite(cell)) return `<Cell><Data ss:Type="Number">${cell}</Data></Cell>`;
          return `<Cell><Data ss:Type="String">${xmlEsc(cell)}</Data></Cell>`;
        })
        .join('');
      return `<Row>${cells}</Row>`;
    })
    .join('');
  return `<Worksheet ss:Name="${xmlEsc(name)}"><Table>${rowsXml}</Table></Worksheet>`;
}

// Exports a native multi-sheet Excel workbook (.xls SpreadsheetML) that opens cleanly in Excel & Apple Numbers
export function exportToExcel(data, analytics) {
  const regCats = analytics.regularCategories;
  const oneCats = analytics.onetimeCategories;

  const ledgerRows = [
    ['年份', '月份', ...regCats.map((c) => c.name), '常规小计', ...oneCats.map((c) => c.name), '一次性小计', '月度合计', '实际到手现金', '公积金入账', '状态', '备注'],
  ];
  for (const m of [...analytics.historicalRecords, ...analytics.computedMonths]) {
    ledgerRows.push([
      m.record.year,
      m.record.isHistorical ? m.record.label || '历史' : m.record.month,
      ...regCats.map((c) => m.record.values?.[c.id] ?? ''),
      m.hasData ? m.regularTotal : '',
      ...oneCats.map((c) => m.record.values?.[c.id] ?? ''),
      m.hasData ? m.onetimeTotal : '',
      m.hasData ? m.total : '',
      m.hasData ? m.cashTotal : '',
      m.hasData ? m.fundTotal : '',
      m.record.isHistorical ? '历史记录' : m.hasData ? '已录入' : '待录入',
      m.record.note || '',
    ]);
  }

  const years = analytics.years;
  const annualRows = [['项目', ...years.map((y) => `${y}年`), '累计']];
  for (const cat of analytics.categories) {
    annualRows.push([cat.name, ...years.map((y) => analytics.yearMap[y]?.itemTotals[cat.id] ?? 0), analytics.cumulativeItemTotals[cat.id] ?? 0]);
  }
  annualRows.push(['年度合计', ...years.map((y) => analytics.yearMap[y]?.total ?? 0), analytics.cumulativeTotal]);
  annualRows.push(['实际到手现金', ...years.map((y) => analytics.yearMap[y]?.cashTotal ?? 0), analytics.cumulativeCash]);
  annualRows.push(['公积金入账', ...years.map((y) => analytics.yearMap[y]?.fundTotal ?? 0), analytics.cumulativeFund]);

  const monthlyRows = [['月份', ...years.map((y) => `${y}年`)]];
  for (let m = 1; m <= 12; m++) {
    monthlyRows.push([
      `${m}月`,
      ...years.map((y) => {
        const f = analytics.yearMap[y]?.months.find((x) => x.record.month === m);
        return f && f.hasData ? f.total : '';
      }),
    ]);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  ${buildWorksheetXml('录入工资明细', ledgerRows)}
  ${buildWorksheetXml('年度对比', annualRows)}
  ${buildWorksheetXml('月度对比', monthlyRows)}
</Workbook>`;

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8' });
  downloadBlob(blob, `个人收入分析_${new Date().toISOString().slice(0, 10)}.xls`);
}

export function exportToCsv(analytics) {
  const cats = analytics.categories;
  const header = ['年份', '月份', ...cats.map((c) => c.name), '月度合计', '实际到手现金', '公积金入账', '备注'];
  const lines = [header.join(',')];
  for (const m of analytics.computedMonths) {
    const row = [
      m.record.year,
      m.record.month,
      ...cats.map((c) => m.record.values?.[c.id] ?? ''),
      m.hasData ? m.total : '',
      m.hasData ? m.cashTotal : '',
      m.hasData ? m.fundTotal : '',
      `"${String(m.record.note || '').replace(/"/g, '""')}"`,
    ];
    lines.push(row.join(','));
  }
  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  downloadBlob(blob, `个人收入明细_${new Date().toISOString().slice(0, 10)}.csv`);
}

export function exportToJson(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
  downloadBlob(blob, `income-data-${new Date().toISOString().slice(0, 10)}.json`);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function parseCsvLine(line) {
  const out = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') inQ = false;
      else cur += ch;
    } else {
      if (ch === '"') inQ = true;
      else if (ch === ',') { out.push(cur.trim()); cur = ''; }
      else cur += ch;
    }
  }
  out.push(cur.trim());
  return out;
}

export async function importFromFile(file, currentData) {
  const text = await file.text();
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ext === 'json') {
    const parsed = JSON.parse(text);
    if (!parsed || !Array.isArray(parsed.records) || !Array.isArray(parsed.categories)) {
      throw new Error('JSON 备份格式无效');
    }
    return { data: parsed, count: parsed.records.length };
  }

  // CSV import
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) throw new Error('文件内容为空');
  const headers = parseCsvLine(lines[0]);
  const yIdx = headers.findIndex((h) => h === '年份' || h.toLowerCase() === 'year');
  const mIdx = headers.findIndex((h) => h === '月份' || h.toLowerCase() === 'month');
  const nIdx = headers.findIndex((h) => h === '备注' || h.toLowerCase() === 'note');
  if (yIdx < 0 || mIdx < 0) throw new Error('CSV 缺少「年份」或「月份」列');

  const nameToId = new Map(currentData.categories.map((c) => [c.name.trim(), c.id]));
  const recMap = new Map(currentData.records.map((r) => [r.id, { ...r, values: { ...r.values } }]));
  let count = 0;
  let maxYear = currentData.settings.endYear;

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const year = Number(cols[yIdx]);
    const month = Number(cols[mIdx]);
    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) continue;
    if (year > maxYear) maxYear = year;
    const id = makeMonthId(year, month);
    const rec = recMap.get(id) || { id, year, month, values: {}, note: '' };
    const values = { ...rec.values };
    let touched = false;
    headers.forEach((h, idx) => {
      const catId = nameToId.get(h.trim());
      if (!catId) return;
      const raw = cols[idx];
      if (raw !== undefined && raw !== '') {
        const num = Number(raw.replace(/,/g, ''));
        if (!Number.isNaN(num)) { values[catId] = num; touched = true; }
      }
    });
    const note = nIdx >= 0 && cols[nIdx] ? cols[nIdx] : rec.note;
    if (touched || note !== rec.note) {
      recMap.set(id, { ...rec, values, note });
      count++;
    }
  }
  if (count === 0) throw new Error('未识别到可导入的月份数据');
  return {
    data: { ...currentData, records: Array.from(recMap.values()), settings: { ...currentData.settings, endYear: maxYear } },
    count,
  };
}
