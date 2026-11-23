export function round2(v) {
  return Math.round((v + Number.EPSILON) * 100) / 100;
}

export function fmtMoney(val, { decimals = 2, prefix = '', signed = false, privacy = false } = {}) {
  if (val === null || val === undefined || Number.isNaN(val)) return '—';
  if (privacy) return prefix ? `${prefix}••••` : '••••';
  const abs = Math.abs(val);
  const str = abs.toLocaleString('zh-CN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const sign = val < 0 ? '-' : signed && val > 0 ? '+' : '';
  return `${sign}${prefix}${str}`;
}

export function fmtCompact(val, privacy = false) {
  if (val === null || val === undefined || Number.isNaN(val)) return '—';
  if (privacy) return '••••';
  return Math.round(val).toLocaleString('zh-CN');
}

export function fmtPct(ratio, { decimals = 1, signed = false } = {}) {
  if (ratio === null || ratio === undefined || !Number.isFinite(ratio)) return '—';
  const pct = ratio * 100;
  const sign = signed && pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(decimals)}%`;
}

export function moneyHtml(val, privacy = false, prefix = '¥') {
  if (val === null || val === undefined || Number.isNaN(val)) return '—';
  if (privacy) return `<span class="prefix">${prefix}</span>••••••`;
  const [i, d] = Math.abs(val).toFixed(2).split('.');
  const sign = val < 0 ? '-' : '';
  return `<span class="prefix">${prefix}</span>${sign}${Number(i).toLocaleString('zh-CN')}<span class="dec">.${d}</span>`;
}

export function deltaBadgeHtml(ratio, label = '') {
  if (ratio === null || ratio === undefined || !Number.isFinite(ratio)) {
    return `<span class="badge badge-neutral">—</span>`;
  }
  const pos = ratio >= 0;
  return `<span class="badge ${pos ? 'badge-up' : 'badge-down'}">${pos ? '↑' : '↓'} ${fmtPct(ratio, { signed: true })}${label ? ` ${label}` : ''}</span>`;
}

export function computeMonth(record, categories) {
  let regularTotal = 0, onetimeTotal = 0, cashTotal = 0, fundTotal = 0, regularCashTotal = 0;
  let hasData = false;
  for (const cat of categories) {
    const raw = record.values?.[cat.id];
    if (raw !== null && raw !== undefined && raw !== '' && !Number.isNaN(Number(raw))) {
      const v = Number(raw);
      if (v !== 0) hasData = true;
      if (cat.group === 'regular') {
        regularTotal += v;
        if (cat.bucket === 'cash') regularCashTotal += v;
      } else {
        onetimeTotal += v;
      }
      if (cat.bucket === 'fund') fundTotal += v;
      else cashTotal += v;
    }
  }
  regularTotal = round2(regularTotal);
  onetimeTotal = round2(onetimeTotal);
  const total = round2(regularTotal + onetimeTotal);
  cashTotal = round2(cashTotal);
  fundTotal = round2(fundTotal);
  regularCashTotal = round2(regularCashTotal);
  const label = record.isHistorical
    ? `${record.year}年 ${record.label || '历史'}`
    : `${record.year}.${record.month < 10 ? `0${record.month}` : record.month}`;
  return { record, regularTotal, onetimeTotal, total, cashTotal, fundTotal, regularCashTotal, hasData, label };
}

export function computeAnalytics(data) {
  const categories = [...data.categories].sort((a, b) => a.order - b.order);
  const regularCategories = categories.filter((c) => c.group === 'regular');
  const onetimeCategories = categories.filter((c) => c.group === 'onetime');

  const yearsSet = new Set();
  for (let y = data.settings.startYear; y <= data.settings.endYear; y++) yearsSet.add(y);
  for (const r of data.records) {
    if (!r.isHistorical && r.year >= data.settings.startYear) yearsSet.add(r.year);
  }
  const years = Array.from(yearsSet).sort((a, b) => a - b);

  const historicalRecords = data.records.filter((r) => r.isHistorical).map((r) => computeMonth(r, categories));
  const mainRecords = data.records
    .filter((r) => !r.isHistorical && r.year >= data.settings.startYear)
    .sort((a, b) => (a.year !== b.year ? a.year - b.year : a.month - b.month));

  const computedMonths = mainRecords.map((r) => computeMonth(r, categories));
  const recordedMonths = computedMonths.filter((m) => m.hasData);

  const yearMap = {};
  for (const year of years) {
    const months = computedMonths.filter((m) => m.record.year === year);
    const recorded = months.filter((m) => m.hasData);
    const itemTotals = {};
    for (const cat of categories) itemTotals[cat.id] = 0;

    let regularTotal = 0, onetimeTotal = 0, total = 0, cashTotal = 0, fundTotal = 0, regularCashTotal = 0;
    for (const m of recorded) {
      regularTotal += m.regularTotal;
      onetimeTotal += m.onetimeTotal;
      total += m.total;
      cashTotal += m.cashTotal;
      fundTotal += m.fundTotal;
      regularCashTotal += m.regularCashTotal;
      for (const cat of categories) {
        const v = m.record.values?.[cat.id];
        if (v !== null && v !== undefined && !Number.isNaN(Number(v))) itemTotals[cat.id] += Number(v);
      }
    }
    for (const cat of categories) itemTotals[cat.id] = round2(itemTotals[cat.id]);
    regularTotal = round2(regularTotal);
    onetimeTotal = round2(onetimeTotal);
    total = round2(total);
    cashTotal = round2(cashTotal);
    fundTotal = round2(fundTotal);
    regularCashTotal = round2(regularCashTotal);

    const n = recorded.length;
    const monthlyAvg = n > 0 ? total / n : null;
    const regularMonthlyAvg = n > 0 ? regularTotal / n : null;
    const cashMonthlyAvg = n > 0 ? cashTotal / n : null;
    const regularCashMonthlyAvg = n > 0 ? regularCashTotal / n : null;
    const cashRatio = total > 0 ? cashTotal / total : null;

    const rem = 12 - n;
    const projectedTotal = n > 0 && rem > 0 ? round2(total + rem * regularMonthlyAvg) : n === 12 ? total : null;
    const projectedCash = n > 0 && rem > 0 ? round2(cashTotal + rem * regularCashMonthlyAvg) : n === 12 ? cashTotal : null;

    const itemSum = round2(Object.values(itemTotals).reduce((a, b) => a + b, 0));
    yearMap[year] = {
      year, recordedMonths: n, months, itemTotals, regularTotal, onetimeTotal, total, cashTotal, fundTotal, regularCashTotal,
      cashRatio, monthlyAvg, regularMonthlyAvg, cashMonthlyAvg, regularCashMonthlyAvg,
      samePeriodMonths: [], samePeriodTotal: null, prevSamePeriodTotal: null, samePeriodDiff: null, samePeriodYoY: null,
      samePeriodItemDiffs: [],
      fullYearYoY: null, monthlyAvgYoY: null, cashMonthlyAvgYoY: null,
      projectedTotal, projectedCash,
      sumMatchesMonthly: Math.abs(itemSum - total) < 0.02,
      cashPlusFundMatchesTotal: Math.abs(round2(cashTotal + fundTotal) - total) < 0.02,
    };
  }

  for (const year of years) {
    const curr = yearMap[year];
    const prev = yearMap[year - 1];
    if (!prev || curr.recordedMonths === 0 || prev.recordedMonths === 0) continue;
    const prevMap = new Map(prev.months.filter((m) => m.hasData).map((m) => [m.record.month, m]));
    const currMap = new Map(curr.months.filter((m) => m.hasData).map((m) => [m.record.month, m]));
    let cSame = 0, pSame = 0;
    const common = [];
    for (const m of curr.months) {
      if (m.hasData && prevMap.has(m.record.month)) {
        common.push(m.record.month);
        cSame += m.total;
        pSame += prevMap.get(m.record.month).total;
      }
    }
    cSame = round2(cSame);
    pSame = round2(pSame);
    curr.samePeriodMonths = common;
    if (common.length > 0 && pSame > 0) {
      curr.samePeriodTotal = cSame;
      curr.prevSamePeriodTotal = pSame;
      curr.samePeriodDiff = round2(cSame - pSame);
      curr.samePeriodYoY = (cSame - pSame) / pSame;

      const itemDiffs = [];
      for (const cat of categories) {
        let cs = 0;
        let ps = 0;
        for (const mNum of common) {
          const cm = currMap.get(mNum);
          const pm = prevMap.get(mNum);
          const cv = cm?.record.values?.[cat.id];
          const pv = pm?.record.values?.[cat.id];
          if (cv !== null && cv !== undefined && cv !== '' && !Number.isNaN(Number(cv))) cs += Number(cv);
          if (pv !== null && pv !== undefined && pv !== '' && !Number.isNaN(Number(pv))) ps += Number(pv);
        }
        cs = round2(cs);
        ps = round2(ps);
        if (cs !== 0 || ps !== 0) {
          const diff = round2(cs - ps);
          const yoy = ps > 0 ? diff / ps : null;
          itemDiffs.push({
            id: cat.id,
            name: cat.name,
            group: cat.group,
            bucket: cat.bucket,
            color: cat.color,
            currSame: cs,
            prevSame: ps,
            diff,
            yoy,
          });
        }
      }
      itemDiffs.sort((a, b) => b.diff - a.diff);
      curr.samePeriodItemDiffs = itemDiffs;
    }
    if (prev.total > 0) curr.fullYearYoY = (curr.total - prev.total) / prev.total;
    if (curr.monthlyAvg != null && prev.monthlyAvg > 0) curr.monthlyAvgYoY = (curr.monthlyAvg - prev.monthlyAvg) / prev.monthlyAvg;
    if (curr.cashMonthlyAvg != null && prev.cashMonthlyAvg > 0) curr.cashMonthlyAvgYoY = (curr.cashMonthlyAvg - prev.cashMonthlyAvg) / prev.cashMonthlyAvg;
  }

  const totalRecordedCount = recordedMonths.length;
  const cumulativeTotal = round2(recordedMonths.reduce((s, m) => s + m.total, 0));
  const cumulativeRegular = round2(recordedMonths.reduce((s, m) => s + m.regularTotal, 0));
  const cumulativeOnetime = round2(recordedMonths.reduce((s, m) => s + m.onetimeTotal, 0));
  const cumulativeCash = round2(recordedMonths.reduce((s, m) => s + m.cashTotal, 0));
  const cumulativeFund = round2(recordedMonths.reduce((s, m) => s + m.fundTotal, 0));
  const cumulativeRegularCash = round2(recordedMonths.reduce((s, m) => s + m.regularCashTotal, 0));
  const cumulativeFundInterest = round2(recordedMonths.reduce((s, m) => s + Number(m.record.values?.fund_interest || 0), 0));

  const cumulativeItemTotals = {};
  for (const cat of categories) {
    cumulativeItemTotals[cat.id] = round2(years.reduce((s, y) => s + (yearMap[y]?.itemTotals[cat.id] || 0), 0));
  }

  const overallMonthlyAvg = totalRecordedCount > 0 ? cumulativeTotal / totalRecordedCount : null;
  const overallRegularAvg = totalRecordedCount > 0 ? cumulativeRegular / totalRecordedCount : null;
  const overallCashAvg = totalRecordedCount > 0 ? cumulativeCash / totalRecordedCount : null;
  const overallRegularCashAvg = totalRecordedCount > 0 ? cumulativeRegularCash / totalRecordedCount : null;
  const onetimeRatio = cumulativeTotal > 0 ? cumulativeOnetime / cumulativeTotal : null;
  const cashRatio = cumulativeTotal > 0 ? cumulativeCash / cumulativeTotal : null;
  const fundRatio = cumulativeTotal > 0 ? cumulativeFund / cumulativeTotal : null;

  const firstRecordedMonth = recordedMonths[0] || null;
  const latestRecordedMonth = recordedMonths[recordedMonths.length - 1] || null;
  const latestYear = latestRecordedMonth ? latestRecordedMonth.record.year : years[0];

  let maxMonth = null, minMonth = null;
  for (const m of recordedMonths) {
    if (!maxMonth || m.total > maxMonth.total) maxMonth = m;
    if (!minMonth || m.total < minMonth.total) minMonth = m;
  }

  let recent24Months = computedMonths.slice(0, 24);
  if (latestRecordedMonth) {
    const idx = computedMonths.findIndex((m) => m.record.id === latestRecordedMonth.record.id);
    if (idx >= 0) {
      const endIdx = Math.max(23, idx);
      const startIdx = Math.max(0, endIdx - 23);
      recent24Months = computedMonths.slice(startIdx, Math.min(computedMonths.length, startIdx + 24));
    }
  }

  const notedMonths = recordedMonths.filter((m) => m.record.note && m.record.note.trim().length > 0);

  // Running cumulative wealth series
  let rTotal = 0, rCash = 0, rFund = 0, rRegular = 0, rOnetime = 0;
  const runningCumulativeSeries = recordedMonths.map((m) => {
    rTotal = round2(rTotal + m.total);
    rCash = round2(rCash + m.cashTotal);
    rFund = round2(rFund + m.fundTotal);
    rRegular = round2(rRegular + m.regularTotal);
    rOnetime = round2(rOnetime + m.onetimeTotal);
    return {
      label: m.label,
      year: m.record.year,
      month: m.record.month,
      cumTotal: rTotal,
      cumCash: rCash,
      cumFund: rFund,
      cumRegular: rRegular,
      cumOnetime: rOnetime,
      total: m.total,
      regularTotal: m.regularTotal,
      onetimeTotal: m.onetimeTotal,
      note: m.record.note || '',
    };
  });

  // Regular baseline stats
  let regMin = null, regMax = null, regAvg = null, regLatest3Avg = null;
  if (recordedMonths.length > 0) {
    const regVals = recordedMonths.map((m) => m.regularTotal);
    regMin = Math.min(...regVals);
    regMax = Math.max(...regVals);
    regAvg = round2(regVals.reduce((s, v) => s + v, 0) / regVals.length);
    const tail3 = regVals.slice(-3);
    regLatest3Avg = round2(tail3.reduce((s, v) => s + v, 0) / tail3.length);
  }
  const regularBaselineStats = { min: regMin, max: regMax, avg: regAvg, latest3Avg: regLatest3Avg };

  const insights = [];
  if (totalRecordedCount > 0 && firstRecordedMonth && latestRecordedMonth) {
    const f = firstRecordedMonth.record, l = latestRecordedMonth.record;
    insights.push(`已记录 ${totalRecordedCount} 个月（${f.year}年${f.month}月 至 ${l.year}年${l.month}月），累计收入 ${fmtCompact(cumulativeTotal)} 元，平均每月约 ${fmtCompact(overallMonthlyAvg)} 元。`);
    const ly = yearMap[latestYear];
    if (ly && ly.samePeriodDiff !== null && ly.samePeriodYoY !== null) {
      const dir = ly.samePeriodDiff >= 0 ? '多' : '少';
      const note = ly.recordedMonths < 12 ? `（${latestYear}年仅记录 ${ly.recordedMonths} 个月，采用同期对比更公平）` : '';
      insights.push(`${latestYear}年前 ${ly.recordedMonths} 个月累计 ${fmtCompact(ly.total)} 元，比 ${latestYear - 1} 年同期${dir} ${fmtCompact(Math.abs(ly.samePeriodDiff))} 元（${fmtPct(ly.samePeriodYoY, { signed: true })}）${note}。`);
    }
    insights.push(`去掉一次性款项后，平时每月约 ${fmtCompact(overallRegularAvg)} 元；一次性款项合计 ${fmtCompact(cumulativeOnetime)} 元（占 ${fmtPct(onetimeRatio)}）。`);
    insights.push(`按到手口径：累计实际到手现金 ${fmtCompact(cumulativeCash)} 元（月均 ${fmtCompact(overallCashAvg)} 元，平时约 ${fmtCompact(overallRegularCashAvg)} 元）；公积金累计入账 ${fmtCompact(cumulativeFund)} 元（占 ${fmtPct(fundRatio)}）。`);
    if (maxMonth && minMonth) {
      insights.push(`单月最高：${maxMonth.record.year}年${maxMonth.record.month}月（${fmtCompact(maxMonth.total)} 元）；单月最低：${minMonth.record.year}年${minMonth.record.month}月（${fmtCompact(minMonth.total)} 元）。`);
    }
  }

  return {
    years, categories, regularCategories, onetimeCategories, historicalRecords, computedMonths, recordedMonths, yearMap,
    totalRecordedCount, cumulativeTotal, cumulativeRegular, cumulativeOnetime, cumulativeCash, cumulativeFund, cumulativeFundInterest,
    cumulativeItemTotals, overallMonthlyAvg, overallRegularAvg, overallCashAvg, overallRegularCashAvg, onetimeRatio, cashRatio, fundRatio,
    latestYear, latestRecordedMonth, firstRecordedMonth, maxMonth, minMonth, recent24Months, notedMonths, insights,
    runningCumulativeSeries, regularBaselineStats,
  };
}
