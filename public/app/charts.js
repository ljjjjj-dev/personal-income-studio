import { fmtCompact, fmtMoney, fmtPct } from './analytics.js';
import { CASH_GREEN, FUND_TEAL, ONETIME_GROUP_COLOR, PRIMARY_BLUE } from './seed.js';

const POS_TEXT = '#1E7E5A';
const NEG_TEXT = '#C43E3D';
const AXIS_TEXT = '#5D6B7E';

let seqId = 0;
function nextId(prefix) {
  seqId = (seqId + 1) % 100000;
  return `${prefix}_${seqId}`;
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// =========================================================================
// Crisp Architectural Rectangular Bar Geometry (Zero Gradients, Neat Micro-Chamfer)
// =========================================================================
function crispTopRect(x, y, w, h, r = 2.5) {
  if (w <= 0 || h <= 0) return '';
  const rt = Math.max(0, Math.min(r, w / 2, h));
  if (rt < 0.5) return `M${x},${y} H${x + w} V${y + h} H${x} Z`;
  return `M${x},${y + h} V${y + rt} A${rt},${rt} 0 0 1 ${x + rt},${y} H${x + w - rt} A${rt},${rt} 0 0 1 ${x + w},${y + rt} V${y + h} Z`;
}

function crispBottomRect(x, y, w, h, r = 2.5) {
  if (w <= 0 || h <= 0) return '';
  const rb = Math.max(0, Math.min(r, w / 2, h));
  if (rb < 0.5) return `M${x},${y} H${x + w} V${y + h} H${x} Z`;
  return `M${x},${y} H${x + w} V${y + h - rb} A${rb},${rb} 0 0 1 ${x + w - rb},${y + h} H${x + rb} A${rb},${rb} 0 0 1 ${x},${y + h - rb} Z`;
}

function crispRightRect(x, y, w, h, r = 3) {
  if (w <= 0 || h <= 0) return '';
  const rr = Math.max(0, Math.min(r, h / 2, w));
  if (rr < 0.5) return `M${x},${y} H${x + w} V${y + h} H${x} Z`;
  return `M${x},${y} H${x + w - rr} A${rr},${rr} 0 0 1 ${x + w},${y + rr} V${y + h - rr} A${rr},${rr} 0 0 1 ${x + w - rr},${y + h} H${x} Z`;
}

function crispLeftRect(x, y, w, h, r = 3) {
  if (w <= 0 || h <= 0) return '';
  const rl = Math.max(0, Math.min(r, h / 2, w));
  if (rl < 0.5) return `M${x},${y} H${x + w} V${y + h} H${x} Z`;
  return `M${x + w},${y} V${y + h} H${x + rl} A${rl},${rl} 0 0 1 ${x},${y + h - rl} V${y + rl} A${rl},${rl} 0 0 1 ${x + rl},${y} Z`;
}

function buildSmoothPath(pts) {
  if (!pts.length) return '';
  if (pts.length === 1) return `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const tension = 0.16;
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    let cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    let cp2y = p2.y - (p3.y - p1.y) * tension;
    const minY = Math.min(p1.y, p2.y);
    const maxY = Math.max(p1.y, p2.y);
    cp1y = Math.max(minY - 6, Math.min(maxY + 6, cp1y));
    cp2y = Math.max(minY - 6, Math.min(maxY + 6, cp2y));
    d += ` C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d;
}

function formatAxisWan(v, privacy) {
  if (privacy) return '••';
  if (v === 0) return '0';
  if (Math.abs(v) >= 10000) {
    const w = v / 10000;
    return Number.isInteger(w) ? `${w}万` : `${w.toFixed(1)}万`;
  }
  return `${Math.round(v / 1000)}k`;
}

// 1. Circular Goal Ring (Liquid Glass Tactile Ring)
export function renderGoalRingSvg(pct, projectedPct) {
  const size = 72;
  const cx = 36;
  const cy = 36;
  const r = 28;
  const stroke = 6;
  const circ = 2 * Math.PI * r;
  const actualClamped = Math.max(0, Math.min(100, pct || 0));
  const projClamped = Math.max(actualClamped, Math.min(100, projectedPct || 0));
  const actualLen = (actualClamped / 100) * circ;
  const projLen = (projClamped / 100) * circ;
  const fid = nextId('ringGlass');

  return `<svg viewBox="0 0 ${size} ${size}" width="72" height="72" style="display:block;overflow:visible">
    <defs>
      <filter id="${fid}" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="${PRIMARY_BLUE}" flood-opacity="0.22"/>
      </filter>
    </defs>
    <circle cx="${cx}" cy="${cy}" r="${r - stroke / 2 - 1}" fill="var(--card)" fill-opacity="0.72" />
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="currentColor" stroke-opacity="0.07" stroke-width="${stroke}"/>
    ${projLen > actualLen ? `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${FUND_TEAL}" stroke-opacity="0.28" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${projLen.toFixed(2)} ${circ.toFixed(2)}" transform="rotate(-90 ${cx} ${cy})"/>` : ''}
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${PRIMARY_BLUE}" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${actualLen.toFixed(2)} ${circ.toFixed(2)}" transform="rotate(-90 ${cx} ${cy})" filter="url(#${fid})"/>
  </svg>`;
}

// 2. 24-Month Stacked Trend Bar Chart (Crisp Rectangular Bars, Fresh Solid Palette, Full-Width Canvas)
export function renderStackedTrendSvg(months, mode, privacy, avgRef = null) {
  const W = 1040, H = 264, padL = 48, padR = 16, padT = 20, padB = 34;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const baseLineY = padT + plotH;

  const vals = months.map((m) => (m.hasData ? m.total : 0));
  const rawMax = Math.max(...vals, avgRef || 0, 15000);
  const maxY = Math.ceil(rawMax / 5000) * 5000;
  const steps = 4;

  const colW = plotW / Math.max(months.length, 1);
  const barW = Math.max(14, Math.min(24, colW * 0.54));
  const barR = 2.5;

  let grid = '';
  for (let i = 0; i <= steps; i++) {
    const v = (maxY / steps) * i;
    const y = baseLineY - (v / maxY) * plotH;
    if (i === 0) {
      grid += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="currentColor" stroke-opacity="0.14" stroke-width="1" />`;
    } else {
      grid += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="currentColor" stroke-opacity="0.06" stroke-dasharray="2 3" />`;
    }
    grid += `<text x="${padL - 10}" y="${y + 4}" text-anchor="end" font-size="11" fill="${AXIS_TEXT}" class="tabular">${formatAxisWan(v, privacy)}</text>`;
  }

  let defs = '';
  let bars = '';
  months.forEach((m, idx) => {
    const cx = padL + idx * colW + colW / 2;
    const x = cx - barW / 2;
    const baseVal = mode === 'regular_onetime' ? (m.hasData ? m.regularTotal : 0) : (m.hasData ? m.cashTotal : 0);
    const topVal = mode === 'regular_onetime' ? (m.hasData ? m.onetimeTotal : 0) : (m.hasData ? m.fundTotal : 0);
    const baseColor = mode === 'regular_onetime' ? PRIMARY_BLUE : CASH_GREEN;
    const topColor = mode === 'regular_onetime' ? ONETIME_GROUP_COLOR : FUND_TEAL;

    const baseH = (baseVal / maxY) * plotH;
    const topH = (topVal / maxY) * plotH;
    const totalH = baseH + topH;
    const baseY = baseLineY - baseH;
    const topY = baseLineY - totalH;

    const tt = m.hasData
      ? `<div class="tt-head"><span>${esc(m.label)}</span><span style="color:${PRIMARY_BLUE}">${fmtMoney(m.total, { prefix: '¥', privacy })}</span></div>
         <div class="tt-row"><span>平时常规</span><strong>${fmtMoney(m.regularTotal, { prefix: '¥', privacy })}</strong></div>
         <div class="tt-row"><span>一次性款项</span><strong style="color:${NEG_TEXT}">${fmtMoney(m.onetimeTotal, { prefix: '¥', privacy })}</strong></div>
         <div class="tt-row"><span>实际到手</span><strong style="color:${POS_TEXT}">${fmtMoney(m.cashTotal, { prefix: '¥', privacy })}</strong></div>
         <div class="tt-row"><span>公积金入账</span><strong style="color:${FUND_TEAL}">${fmtMoney(m.fundTotal, { prefix: '¥', privacy })}</strong></div>
         ${m.record.note ? `<div class="tt-note">备注：${esc(m.record.note)}</div>` : ''}`
      : `<div class="tt-head"><span>${esc(m.label)}</span></div><div style="color:${AXIS_TEXT}">尚未录入</div>`;

    bars += `<g class="svg-hit" data-tip="${esc(tt)}">`;
    bars += `<rect class="bar-hit-bg" x="${cx - colW / 2 + 2}" y="${padT}" width="${Math.max(1, colW - 4)}" height="${plotH}" rx="4" />`;
    if (m.hasData && totalH > 0) {
      const clipId = nextId('barClip');
      const outerPath = crispTopRect(x, topY, barW, totalH, barR);
      defs += `<clipPath id="${clipId}"><path d="${outerPath}" /></clipPath>`;
      bars += `<g clip-path="url(#${clipId})">`;
      if (baseH > 0) bars += `<rect x="${x}" y="${baseY}" width="${barW}" height="${baseH}" fill="${baseColor}" fill-opacity="0.90" />`;
      if (topH > 0) bars += `<rect x="${x}" y="${topY}" width="${barW}" height="${topH}" fill="${topColor}" fill-opacity="0.92" />`;
      if (baseH > 0 && topH >= 1.5) {
        bars += `<line x1="${x}" y1="${baseY}" x2="${x + barW}" y2="${baseY}" stroke="var(--card)" stroke-width="1.5" style="pointer-events:none" />`;
      }
      // Subtle Liquid Glass top specular highlight & left frosted edge
      bars += `<line x1="${x + 1}" y1="${topY + 1}" x2="${x + barW - 1}" y2="${topY + 1}" stroke="#FFFFFF" stroke-opacity="0.52" stroke-width="1.2" style="pointer-events:none" />`;
      bars += `<line x1="${x + 0.8}" y1="${topY + 1}" x2="${x + 0.8}" y2="${baseLineY}" stroke="#FFFFFF" stroke-opacity="0.22" stroke-width="1" style="pointer-events:none" />`;
      bars += `</g>`;
    } else {
      bars += `<rect x="${x}" y="${baseLineY - 2}" width="${barW}" height="2" rx="1" fill="currentColor" fill-opacity="0.08" />`;
    }
    if (idx % 2 === 0) {
      bars += `<text x="${cx}" y="${H - 10}" text-anchor="middle" font-size="11" fill="${AXIS_TEXT}" class="tabular">${m.label.slice(2)}</text>`;
    }
    bars += `</g>`;
  });

  // Avg Reference Line
  let refOverlay = '';
  if (avgRef && avgRef > 0 && avgRef <= maxY) {
    const ry = baseLineY - (avgRef / maxY) * plotH;
    const tagText = `月均 ¥${fmtCompact(avgRef, privacy)}`;
    const tagW = privacy ? 66 : 96;
    refOverlay = `
      <line x1="${padL}" y1="${ry}" x2="${W - padR}" y2="${ry}" stroke="${AXIS_TEXT}" stroke-opacity="0.45" stroke-width="1.1" stroke-dasharray="4 4" />
      <rect x="${padL + 6}" y="${ry - 22}" width="${tagW}" height="19" rx="5" fill="var(--card)" stroke="var(--border-strong)" stroke-width="0.8" />
      <text x="${padL + 6 + tagW / 2}" y="${ry - 9.5}" text-anchor="middle" font-size="10.5" font-weight="500" fill="var(--text-secondary)" class="tabular">${tagText}</text>
    `;
  }

  return `<svg viewBox="0 0 ${W} ${H}" style="display:block;width:100%;height:auto;overflow:visible"><defs>${defs}</defs>${grid}${bars}${refOverlay}</svg>`;
}

// 3. Running Cumulative Wealth & Fund Curve
export function renderCumulativeWealthSvg(series, privacy) {
  if (!series || series.length === 0) {
    return `<div style="padding:48px 0;text-align:center;color:var(--text-tertiary);font-size:13px">暂无累计轨迹数据</div>`;
  }
  const gid = nextId('cumArea');
  const W = 1040, H = 264, padL = 56, padR = 16, padT = 20, padB = 34;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const rawMax = Math.max(...series.map((s) => s.cumTotal), 50000);
  const stepUnit = rawMax > 250000 ? 100000 : 50000;
  const maxY = Math.ceil(rawMax / stepUnit) * stepUnit;

  let grid = '';
  for (let i = 0; i <= 4; i++) {
    const v = (maxY / 4) * i;
    const y = padT + plotH - (v / maxY) * plotH;
    grid += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="currentColor" stroke-opacity="${i === 0 ? 0.14 : 0.06}" ${i === 0 ? '' : 'stroke-dasharray="2 3"'} />`;
    grid += `<text x="${padL - 10}" y="${y + 4}" text-anchor="end" font-size="11" fill="${AXIS_TEXT}" class="tabular">${formatAxisWan(v, privacy)}</text>`;
  }

  const n = series.length;
  const xAt = (idx) => (n === 1 ? padL + plotW / 2 : padL + (idx / (n - 1)) * plotW);
  const yAt = (v) => padT + plotH - (v / maxY) * plotH;

  const ptsTotal = series.map((s, i) => ({ x: xAt(i), y: yAt(s.cumTotal) }));
  const ptsCash = series.map((s, i) => ({ x: xAt(i), y: yAt(s.cumCash) }));
  const ptsFund = series.map((s, i) => ({ x: xAt(i), y: yAt(s.cumFund) }));

  const pathTotal = buildSmoothPath(ptsTotal);
  const pathCash = buildSmoothPath(ptsCash);
  const pathFund = buildSmoothPath(ptsFund);

  const areaTotal = `${pathTotal} L${ptsTotal[n - 1].x.toFixed(1)},${(padT + plotH).toFixed(1)} L${ptsTotal[0].x.toFixed(1)},${(padT + plotH).toFixed(1)} Z`;

  const stride = Math.max(2, Math.ceil(n / 10));
  let xLabels = '';
  series.forEach((s, i) => {
    if (i % stride === 0 || (i === n - 1 && n - 1 - Math.floor((n - 1) / stride) * stride >= 2)) {
      xLabels += `<text x="${xAt(i)}" y="${H - 10}" text-anchor="middle" font-size="11" fill="${AXIS_TEXT}" class="tabular">${s.label.slice(2)}</text>`;
    }
  });

  const hitW = n > 1 ? plotW / (n - 1) : plotW;
  let hits = '';
  series.forEach((s, i) => {
    const cx = xAt(i);
    const tt = `<div class="tt-head"><span>截至 ${esc(s.label)}</span><span style="color:${PRIMARY_BLUE}">${fmtMoney(s.cumTotal, { prefix: '¥', privacy })}</span></div>
      <div class="tt-row"><span>累计实际到手</span><strong style="color:${POS_TEXT}">${fmtMoney(s.cumCash, { prefix: '¥', privacy })}</strong></div>
      <div class="tt-row"><span>累计公积金</span><strong style="color:${FUND_TEAL}">${fmtMoney(s.cumFund, { prefix: '¥', privacy })}</strong></div>
      <div class="tt-row"><span>当月收入</span><strong>${fmtMoney(s.total, { prefix: '¥', privacy })}</strong></div>
      ${s.note ? `<div class="tt-note">${esc(s.note)}</div>` : ''}`;
    hits += `<g class="svg-hit" data-tip="${esc(tt)}">
      <rect x="${cx - hitW / 2}" y="${padT}" width="${hitW}" height="${plotH}" fill="transparent" />
      <circle cx="${ptsTotal[i].x}" cy="${ptsTotal[i].y}" r="${i === n - 1 ? 4.2 : 2.6}" fill="${PRIMARY_BLUE}" stroke="var(--card)" stroke-width="1.5" />
      <circle cx="${ptsCash[i].x}" cy="${ptsCash[i].y}" r="${i === n - 1 ? 3.8 : 2.3}" fill="${CASH_GREEN}" stroke="var(--card)" stroke-width="1.3" />
      <circle cx="${ptsFund[i].x}" cy="${ptsFund[i].y}" r="${i === n - 1 ? 3.8 : 2.3}" fill="${FUND_TEAL}" stroke="var(--card)" stroke-width="1.3" />
    </g>`;
  });

  return `<svg viewBox="0 0 ${W} ${H}" style="display:block;width:100%;height:auto;overflow:visible">
    <defs>
      <linearGradient id="${gid}" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${PRIMARY_BLUE}" stop-opacity="0.11"/>
        <stop offset="100%" stop-color="${PRIMARY_BLUE}" stop-opacity="0.01"/>
      </linearGradient>
    </defs>
    ${grid}
    <path d="${areaTotal}" fill="url(#${gid})" />
    <path d="${pathTotal}" fill="none" stroke="${PRIMARY_BLUE}" stroke-width="2.3" stroke-linecap="round" />
    <path d="${pathCash}" fill="none" stroke="${CASH_GREEN}" stroke-width="2" stroke-linecap="round" />
    <path d="${pathFund}" fill="none" stroke="${FUND_TEAL}" stroke-width="2" stroke-linecap="round" />
    ${xLabels}
    ${hits}
  </svg>`;
}

// 4. Multi-Year Monthly Line Comparison
export function renderMultiYearLineSvg(analytics, caliber, regularityMode, privacy) {
  const gid = nextId('yrArea');
  const W = 600, H = 240, padL = 46, padR = 16, padT = 16, padB = 30;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const activeYears = analytics.years.filter((y) => (analytics.yearMap[y]?.recordedMonths || 0) > 0);
  const colors = ['#B0BAC9', PRIMARY_BLUE, CASH_GREEN, FUND_TEAL, '#8086E8', '#F6B26B'];

  let maxV = 10000;
  const series = activeYears.map((y, idx) => {
    const pts = [];
    for (let m = 1; m <= 12; m++) {
      const found = analytics.yearMap[y]?.months.find((x) => x.record.month === m);
      if (found && found.hasData) {
        let v = found.total;
        if (regularityMode === 'regular') {
          v = caliber === 'cash' ? found.regularCashTotal : caliber === 'fund' ? Number(found.record.values?.fund || 0) : found.regularTotal;
        } else {
          v = caliber === 'cash' ? found.cashTotal : caliber === 'fund' ? found.fundTotal : found.total;
        }
        if (v > maxV) maxV = v;
        pts.push({ m, v, note: found.record.note });
      }
    }
    const color = y === analytics.latestYear ? PRIMARY_BLUE : colors[idx % colors.length];
    return { year: y, color, pts };
  });

  const maxY = Math.ceil(maxV / 5000) * 5000;
  let grid = '';
  for (let i = 0; i <= 4; i++) {
    const v = (maxY / 4) * i;
    const y = padT + plotH - (v / maxY) * plotH;
    grid += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="currentColor" stroke-opacity="${i === 0 ? 0.14 : 0.06}" ${i === 0 ? '' : 'stroke-dasharray="2 3"'} />`;
    grid += `<text x="${padL - 8}" y="${y + 4}" text-anchor="end" font-size="10.5" fill="${AXIS_TEXT}" class="tabular">${formatAxisWan(v, privacy)}</text>`;
  }
  for (let m = 1; m <= 12; m++) {
    const x = padL + ((m - 1) / 11) * plotW;
    grid += `<text x="${x}" y="${H - 8}" text-anchor="middle" font-size="10.5" fill="${AXIS_TEXT}">${m}月</text>`;
  }

  let lines = '';
  series.forEach((s) => {
    if (s.pts.length === 0) return;
    const coords = s.pts.map((p) => ({
      x: padL + ((p.m - 1) / 11) * plotW,
      y: padT + plotH - (p.v / maxY) * plotH,
      ...p,
    }));
    const d = buildSmoothPath(coords);
    const isLatest = s.year === analytics.latestYear;
    if (isLatest && coords.length > 1) {
      const area = `${d} L${coords[coords.length - 1].x.toFixed(1)},${(padT + plotH).toFixed(1)} L${coords[0].x.toFixed(1)},${(padT + plotH).toFixed(1)} Z`;
      lines += `<path d="${area}" fill="url(#${gid})" />`;
    }
    lines += `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="${isLatest ? 2.4 : 1.7}" stroke-opacity="${isLatest ? 1 : 0.78}" stroke-linecap="round" />`;
    coords.forEach((p) => {
      const tt = `<div class="tt-head"><span>${s.year}年${p.m}月</span><span style="color:${s.color}">${fmtMoney(p.v, { prefix: '¥', privacy })}</span></div>${p.note ? `<div class="tt-note">${esc(p.note)}</div>` : ''}`;
      lines += `<circle class="svg-hit" data-tip="${esc(tt)}" cx="${p.x}" cy="${p.y}" r="${isLatest ? 3.8 : 3}" fill="${isLatest ? 'var(--card)' : s.color}" stroke="${isLatest ? s.color : 'var(--card)'}" stroke-width="${isLatest ? 2 : 1.4}" />`;
    });
  });

  const legend = series
    .map((s) => `<span class="legend-item"><span class="legend-line" style="background:${s.color}"></span>${s.year}年</span>`)
    .join('');

  return `<div class="legend-row" style="justify-content:flex-end;margin-bottom:8px">${legend}</div>
    <svg viewBox="0 0 ${W} ${H}" style="display:block;width:100%;height:auto;overflow:visible">
      <defs>
        <linearGradient id="${gid}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="${PRIMARY_BLUE}" stop-opacity="0.11"/>
          <stop offset="100%" stop-color="${PRIMARY_BLUE}" stop-opacity="0.005"/>
        </linearGradient>
      </defs>
      ${grid}${lines}
    </svg>`;
}

// 5. Regular Monthly Income Baseline & Step-Up Chart
export function renderRegularBaselineSvg(recordedMonths, baselineStats, privacy) {
  if (!recordedMonths || recordedMonths.length === 0) {
    return `<div style="padding:48px 0;text-align:center;color:var(--text-tertiary);font-size:13px">暂无录入数据</div>`;
  }
  const gid = nextId('baseGrad');
  const W = 600, H = 248, padL = 48, padR = 16, padT = 18, padB = 30;
  const plotW = W - padL - padR, plotH = H - padT - padB;

  const vals = recordedMonths.map((m) => m.regularTotal);
  const rawMax = Math.max(...vals, 15000);
  const rawMin = Math.min(...vals, 10000);
  const minY = Math.max(0, Math.floor((rawMin - 1500) / 2000) * 2000);
  const maxY = Math.ceil((rawMax + 1500) / 2000) * 2000;
  const spanY = Math.max(2000, maxY - minY);

  let grid = '';
  for (let i = 0; i <= 4; i++) {
    const v = minY + (spanY / 4) * i;
    const y = padT + plotH - ((v - minY) / spanY) * plotH;
    grid += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="currentColor" stroke-opacity="${i === 0 ? 0.14 : 0.06}" ${i === 0 ? '' : 'stroke-dasharray="2 3"'} />`;
    grid += `<text x="${padL - 8}" y="${y + 4}" text-anchor="end" font-size="10.5" fill="${AXIS_TEXT}" class="tabular">${formatAxisWan(v, privacy)}</text>`;
  }

  const n = recordedMonths.length;
  const xAt = (i) => (n === 1 ? padL + plotW / 2 : padL + (i / (n - 1)) * plotW);
  const yAt = (v) => padT + plotH - ((v - minY) / spanY) * plotH;

  const yBandTop = yAt(baselineStats.max || rawMax);
  const yBandBot = yAt(baselineStats.min || rawMin);
  const band = `<rect x="${padL}" y="${yBandTop}" width="${plotW}" height="${Math.max(0, yBandBot - yBandTop)}" fill="${FUND_TEAL}" fill-opacity="0.06" rx="3" />`;

  let avgLine = '';
  if (baselineStats.avg) {
    const ay = yAt(baselineStats.avg);
    avgLine = `<line x1="${padL}" y1="${ay}" x2="${W - padR}" y2="${ay}" stroke="${FUND_TEAL}" stroke-opacity="0.55" stroke-width="1.2" stroke-dasharray="4 4" />`;
  }

  const coords = recordedMonths.map((m, i) => ({
    x: xAt(i),
    y: yAt(m.regularTotal),
    m,
  }));
  const d = buildSmoothPath(coords);
  const area = `${d} L${coords[n - 1].x.toFixed(1)},${(padT + plotH).toFixed(1)} L${coords[0].x.toFixed(1)},${(padT + plotH).toFixed(1)} Z`;

  const stride = Math.max(2, Math.ceil(n / 7));
  let xLabels = '';
  recordedMonths.forEach((m, i) => {
    if (i % stride === 0 || (i === n - 1 && n - 1 - Math.floor((n - 1) / stride) * stride >= 2)) {
      xLabels += `<text x="${xAt(i)}" y="${H - 8}" text-anchor="middle" font-size="10.5" fill="${AXIS_TEXT}" class="tabular">${m.label.slice(2)}</text>`;
    }
  });

  let dots = '';
  coords.forEach(({ x, y, m }) => {
    const tt = `<div class="tt-head"><span>${esc(m.label)}</span><span style="color:${FUND_TEAL}">${fmtMoney(m.regularTotal, { prefix: '¥', privacy })}</span></div>
      <div class="tt-row"><span>含一次性总计</span><strong>${fmtMoney(m.total, { prefix: '¥', privacy })}</strong></div>
      ${m.record.note ? `<div class="tt-note">${esc(m.record.note)}</div>` : ''}`;
    dots += `<circle class="svg-hit" data-tip="${esc(tt)}" cx="${x}" cy="${y}" r="3.4" fill="var(--card)" stroke="${FUND_TEAL}" stroke-width="2" />`;
  });

  return `<svg viewBox="0 0 ${W} ${H}" style="display:block;width:100%;height:auto;overflow:visible">
    <defs>
      <linearGradient id="${gid}" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${FUND_TEAL}" stop-opacity="0.14"/>
        <stop offset="100%" stop-color="${FUND_TEAL}" stop-opacity="0.01"/>
      </linearGradient>
    </defs>
    ${grid}${band}${avgLine}
    <path d="${area}" fill="url(#${gid})" />
    <path d="${d}" fill="none" stroke="${FUND_TEAL}" stroke-width="2.2" stroke-linecap="round" />
    ${xLabels}${dots}
  </svg>`;
}

// 6. Monthly Diverging YoY Delta Bar Chart (Crisp Rectangular Bars, Fresh Mint / Coral)
export function renderDeltaBarSvg(rows, privacy) {
  const W = 580, H = 248, padL = 48, padR = 14, padT = 18, padB = 28;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const diffs = rows.map((r) => r.diff || 0);
  const maxAbs = Math.max(...diffs.map((d) => Math.abs(d)), 3000);
  const ceilMax = Math.ceil(maxAbs / 2000) * 2000;
  const zeroY = padT + plotH / 2;
  const colW = plotW / 12;
  const barW = Math.min(22, colW * 0.52);

  let svg = `<line x1="${padL}" y1="${zeroY}" x2="${W - padR}" y2="${zeroY}" stroke="currentColor" stroke-opacity="0.18" stroke-width="1" />`;
  [-ceilMax, -ceilMax / 2, ceilMax / 2, ceilMax].forEach((v) => {
    const y = zeroY - (v / ceilMax) * (plotH / 2);
    svg += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="currentColor" stroke-opacity="0.06" stroke-dasharray="2 3" />`;
    svg += `<text x="${padL - 8}" y="${y + 4}" text-anchor="end" font-size="10.5" fill="${AXIS_TEXT}" class="tabular">${privacy ? '••' : `${v > 0 ? '+' : ''}${Math.round(v / 1000)}k`}</text>`;
  });

  rows.forEach((r, idx) => {
    const cx = padL + idx * colW + colW / 2;
    const x = cx - barW / 2;
    if (r.diff !== null) {
      const h = Math.max(2, Math.abs(r.diff / ceilMax) * (plotH / 2));
      const isPos = r.diff >= 0;
      const color = isPos ? CASH_GREEN : ONETIME_GROUP_COLOR;
      const textColor = isPos ? POS_TEXT : NEG_TEXT;
      const dPath = isPos
        ? crispTopRect(x, zeroY - h, barW, h, 2.5)
        : crispBottomRect(x, zeroY, barW, h, 2.5);
      const tt = `<div class="tt-head"><span>${r.label}</span><span style="color:${textColor}">${fmtMoney(r.diff, { prefix: '¥', signed: true, privacy })}</span></div>
        <div class="tt-row"><span>本年</span><strong>${fmtMoney(r.currVal, { prefix: '¥', privacy })}</strong></div>
        <div class="tt-row"><span>上年</span><strong>${fmtMoney(r.prevVal, { prefix: '¥', privacy })}</strong></div>
        <div class="tt-row"><span>同比</span><strong>${fmtPct(r.yoy, { signed: true })}</strong></div>`;
      svg += `<g class="svg-hit" data-tip="${esc(tt)}">
        <rect class="bar-hit-bg" x="${cx - colW / 2 + 2}" y="${padT}" width="${Math.max(1, colW - 4)}" height="${plotH}" rx="4" />
        ${dPath ? `<path d="${dPath}" fill="${color}" />` : ''}
      </g>`;
    }
    svg += `<text x="${cx}" y="${H - 8}" text-anchor="middle" font-size="10.5" fill="${AXIS_TEXT}">${r.month}月</text>`;
  });

  return `<svg viewBox="0 0 ${W} ${H}" style="display:block;width:100%;height:auto;overflow:visible">${svg}</svg>`;
}

// 7. Donut Composition Chart (Liquid Glass Tactile Ring)
export function renderDonutSvg(items, total, centerLabel, privacy) {
  const size = 216, cx = 108, cy = 108, r = 78, strokeW = 19;
  const circ = 2 * Math.PI * r;
  const fid = nextId('donutGlass');
  const sheenId = nextId('donutSheen');
  let offset = 0;
  let arcs = '';
  items.forEach((item) => {
    const frac = total > 0 ? item.value / total : 0;
    const len = Math.max(0, frac * circ - 2.5);
    const tt = `<div class="tt-head"><span>${esc(item.name)}</span><span style="color:${item.color}">${fmtPct(frac)}</span></div>
      <div class="tt-row"><span>金额</span><strong>${fmtMoney(item.value, { prefix: '¥', privacy })}</strong></div>`;
    arcs += `<circle class="svg-hit" data-tip="${esc(tt)}" cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${item.color}" stroke-opacity="0.92" stroke-width="${strokeW}" stroke-dasharray="${len.toFixed(2)} ${(circ - len).toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}" transform="rotate(-90 ${cx} ${cy})" />`;
    offset += frac * circ;
  });

  return `<div style="position:relative;width:216px;height:216px;margin:0 auto">
    <svg viewBox="0 0 ${size} ${size}" width="216" height="216" style="overflow:visible">
      <defs>
        <filter id="${fid}" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#4A90E2" flood-opacity="0.12"/>
        </filter>
        <linearGradient id="${sheenId}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.58"/>
          <stop offset="50%" stop-color="#FFFFFF" stop-opacity="0.06"/>
          <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.22"/>
        </linearGradient>
      </defs>
      <g filter="url(#${fid})">${arcs}</g>
      <circle cx="${cx}" cy="${cy}" r="${r + strokeW / 2 - 1.5}" fill="none" stroke="url(#${sheenId})" stroke-width="1.5" style="pointer-events:none" />
      <circle cx="${cx}" cy="${cy}" r="${r - strokeW / 2 - 4}" fill="var(--card-subtle)" fill-opacity="0.72" stroke="var(--border)" stroke-width="1" style="pointer-events:none" />
    </svg>
    <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;text-align:center">
      <div style="font-size:11px;color:var(--text-tertiary)">${esc(centerLabel)}</div>
      <div style="font-size:17px;font-weight:600;margin-top:2px" class="tabular">${fmtMoney(total, { decimals: 0, prefix: '¥', privacy })}</div>
    </div>
  </div>`;
}

// 8. Cross-Year 100% Stacked Composition Shift (Crisp Rectangular Bars, Zero Interior Text)
export function renderCrossYearStackSvg(analytics, privacy) {
  const activeYears = analytics.years.filter((y) => (analytics.yearMap[y]?.recordedMonths || 0) > 0);
  if (activeYears.length === 0) return '';
  const W = 420, H = 250, padL = 42, padR = 16, padT = 16, padB = 34;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const baseLineY = padT + plotH;

  let grid = '';
  [0, 25, 50, 75, 100].forEach((pct) => {
    const y = baseLineY - (pct / 100) * plotH;
    if (pct === 0) {
      grid += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="currentColor" stroke-opacity="0.14" stroke-width="1" />`;
    } else {
      grid += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="currentColor" stroke-opacity="0.06" stroke-dasharray="2 3" />`;
    }
    grid += `<text x="${padL - 8}" y="${y + 4}" text-anchor="end" font-size="10.5" fill="${AXIS_TEXT}" class="tabular">${pct}%</text>`;
  });

  const colW = plotW / activeYears.length;
  const barW = Math.min(52, colW * 0.42);
  let defs = '';
  let bars = '';

  activeYears.forEach((y, idx) => {
    const s = analytics.yearMap[y];
    const cx = padL + idx * colW + colW / 2;
    const x = cx - barW / 2;
    const clipId = nextId('stackClip');
    const clipPath = crispTopRect(x, padT, barW, plotH, 3);
    defs += `<clipPath id="${clipId}"><path d="${clipPath}" /></clipPath>`;

    const segments = [];
    for (const cat of analytics.regularCategories) {
      const val = s.itemTotals[cat.id] || 0;
      if (val > 0) segments.push({ name: cat.name, val, color: cat.color });
    }
    if (s.onetimeTotal > 0) {
      segments.push({ name: '一次性款项', val: s.onetimeTotal, color: ONETIME_GROUP_COLOR });
    }

    let curY = baseLineY;
    let stackHtml = '';
    segments.forEach((seg, si) => {
      const frac = s.total > 0 ? seg.val / s.total : 0;
      const h = frac * plotH;
      curY -= h;
      const tt = `<div class="tt-head"><span>${y}年 · ${esc(seg.name)}</span><span style="color:${seg.color}">${fmtPct(frac)}</span></div>
        <div class="tt-row"><span>金额</span><strong>${fmtMoney(seg.val, { prefix: '¥', privacy })}</strong></div>`;
      stackHtml += `<rect class="svg-hit" data-tip="${esc(tt)}" x="${x}" y="${curY}" width="${barW}" height="${Math.max(1, h)}" fill="${seg.color}" />`;
      if (si > 0) {
        stackHtml += `<line x1="${x}" y1="${curY + h}" x2="${x + barW}" y2="${curY + h}" stroke="var(--card)" stroke-width="1.5" style="pointer-events:none" />`;
      }
    });

    bars += `<g clip-path="url(#${clipId})">${stackHtml}</g>`;
    bars += `<text x="${cx}" y="${H - 10}" text-anchor="middle" font-size="12" font-weight="500" fill="${AXIS_TEXT}">${y}年</text>`;
  });

  return `<svg viewBox="0 0 ${W} ${H}" style="display:block;width:100%;height:auto;overflow:visible">
    <defs>${defs}</defs>
    ${grid}${bars}
  </svg>`;
}

// 9. Grouped Item Comparison Bar (Crisp Rectangular Bars, Fresh Sky Blue & Soft Mist)
export function renderItemCompareBarSvg(categories, currSummary, prevSummary, currYear, prevYear, privacy) {
  const items = categories
    .map((cat) => ({
      cat,
      cv: currSummary?.itemTotals[cat.id] || 0,
      pv: prevSummary?.itemTotals[cat.id] || 0,
    }))
    .filter((d) => d.cv > 0 || d.pv > 0)
    .sort((a, b) => b.cv - a.cv);

  if (items.length === 0) {
    return `<div style="padding:36px 0;text-align:center;color:var(--text-tertiary);font-size:13px">暂无分项对比数据</div>`;
  }

  const rowH = 42;
  const padL = 88, padR = 140, padT = 10, padB = 12;
  const W = 980;
  const H = padT + padB + items.length * rowH;
  const plotW = W - padL - padR;
  const maxV = Math.max(...items.flatMap((d) => [d.cv, d.pv]), 5000);

  let rowsHtml = `<line x1="${padL}" y1="${padT - 2}" x2="${padL}" y2="${H - padB + 2}" stroke="currentColor" stroke-opacity="0.14" stroke-width="1" />`;
  items.forEach((d, idx) => {
    const y0 = padT + idx * rowH;
    const wCurr = d.cv > 0 ? Math.max(4, (d.cv / maxV) * plotW) : 0;
    const wPrev = d.pv > 0 ? Math.max(4, (d.pv / maxV) * plotW) : 0;
    const diff = d.cv - d.pv;
    const yoy = d.pv > 0 ? diff / d.pv : null;

    const pCurr = crispRightRect(padL, y0 + 7, wCurr, 12, 2.5);
    const pPrev = crispRightRect(padL, y0 + 23, wPrev, 7, 2);
    const endX = padL + Math.max(wCurr, wPrev) + 12;

    const tt = `<div class="tt-head"><span>${esc(d.cat.name)}</span><span>${yoy !== null ? fmtPct(yoy, { signed: true }) : '新增'}</span></div>
      <div class="tt-row"><span>${currYear}年</span><strong style="color:${PRIMARY_BLUE}">${fmtMoney(d.cv, { prefix: '¥', privacy })}</strong></div>
      <div class="tt-row"><span>${prevYear}年</span><strong>${fmtMoney(d.pv, { prefix: '¥', privacy })}</strong></div>
      <div class="tt-row"><span>差额</span><strong style="color:${diff >= 0 ? POS_TEXT : NEG_TEXT}">${fmtMoney(diff, { prefix: '¥', signed: true, privacy })}</strong></div>`;

    rowsHtml += `<g class="svg-hit" data-tip="${esc(tt)}">
      <rect class="bar-hit-bg" x="0" y="${y0 + 1}" width="${W}" height="${rowH - 4}" rx="6" />
      <text x="${padL - 12}" y="${y0 + 23}" text-anchor="end" font-size="12.5" font-weight="500" fill="var(--text)">${esc(d.cat.name)}</text>
      ${pCurr ? `<path d="${pCurr}" fill="${PRIMARY_BLUE}" />` : ''}
      ${pPrev ? `<path d="${pPrev}" fill="#94A3B8" fill-opacity="0.30" />` : ''}
      <text x="${endX}" y="${y0 + 22}" text-anchor="start" font-size="11.5" font-weight="600" fill="var(--text)" class="tabular">
        ¥${fmtCompact(d.cv, privacy)}
        <tspan dx="6" font-weight="500" fill="${diff >= 0 ? POS_TEXT : NEG_TEXT}">${diff === 0 ? '' : fmtMoney(diff, { prefix: '¥', signed: true, decimals: 0, privacy })}</tspan>
      </text>
    </g>`;
  });

  return `<svg viewBox="0 0 ${W} ${H}" style="display:block;width:100%;height:auto;overflow:visible">${rowsHtml}</svg>`;
}

// 10. Single-Category 24-Month Trend Explorer (Crisp Rectangular Bars for Onetime Items)
export function renderCategoryTrendSvg(recent24Months, category, privacy) {
  if (!category || !recent24Months.length) return '';
  const gid = nextId('catArea');
  const W = 1040, H = 230, padL = 52, padR = 16, padT = 20, padB = 32;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const baseLineY = padT + plotH;

  const points = recent24Months.map((m) => {
    const raw = m.record.values?.[category.id];
    const val = m.hasData && raw !== null && raw !== undefined && raw !== '' && !Number.isNaN(Number(raw)) ? Number(raw) : 0;
    return { m, val, hasMonth: m.hasData };
  });

  const nonZeroVals = points.filter((p) => p.val > 0).map((p) => p.val);
  const avg = nonZeroVals.length ? nonZeroVals.reduce((s, v) => s + v, 0) / nonZeroVals.length : 0;
  const rawMax = Math.max(...points.map((p) => p.val), 1000);
  const stepUnit = rawMax >= 10000 ? 5000 : rawMax >= 3000 ? 1000 : 500;
  const maxY = Math.ceil((rawMax * 1.12) / stepUnit) * stepUnit;

  let grid = '';
  for (let i = 0; i <= 3; i++) {
    const v = (maxY / 3) * i;
    const y = baseLineY - (v / maxY) * plotH;
    if (i === 0) {
      grid += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="currentColor" stroke-opacity="0.14" stroke-width="1" />`;
    } else {
      grid += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="currentColor" stroke-opacity="0.06" stroke-dasharray="2 3" />`;
    }
    grid += `<text x="${padL - 8}" y="${y + 4}" text-anchor="end" font-size="10.5" fill="${AXIS_TEXT}" class="tabular">${privacy ? '••' : v >= 10000 ? `${(v / 10000).toFixed(1)}万` : Math.round(v).toLocaleString('zh-CN')}</text>`;
  }

  const colW = plotW / points.length;
  const color = category.color || PRIMARY_BLUE;
  let defs = '';
  let body = '';

  if (category.group === 'onetime') {
    const barW = Math.max(14, Math.min(24, colW * 0.54));
    points.forEach((p, idx) => {
      const cx = padL + idx * colW + colW / 2;
      const x = cx - barW / 2;
      const h = (p.val / maxY) * plotH;
      const y = baseLineY - h;
      const bPath = p.val > 0 ? crispTopRect(x, y, barW, Math.max(3, h), 2.5) : '';
      const tt = `<div class="tt-head"><span>${esc(p.m.label)} · ${esc(category.name)}</span><span style="color:${color}">${fmtMoney(p.val, { prefix: '¥', privacy })}</span></div>
        ${p.m.record.note ? `<div class="tt-note">${esc(p.m.record.note)}</div>` : ''}`;
      body += `<g class="svg-hit" data-tip="${esc(tt)}">
        <rect class="bar-hit-bg" x="${cx - colW / 2 + 2}" y="${padT}" width="${Math.max(1, colW - 4)}" height="${plotH}" rx="4" />
        ${bPath ? `<path d="${bPath}" fill="${color}" />` : `<rect x="${x}" y="${baseLineY - 2}" width="${barW}" height="2" rx="1" fill="currentColor" fill-opacity="0.08" />`}
      </g>`;
      if (idx % 2 === 0) body += `<text x="${cx}" y="${H - 10}" text-anchor="middle" font-size="11" fill="${AXIS_TEXT}" class="tabular">${p.m.label.slice(2)}</text>`;
    });
  } else {
    const activeCoords = [];
    points.forEach((p, idx) => {
      const cx = padL + idx * colW + colW / 2;
      if (p.hasMonth) {
        activeCoords.push({
          x: cx,
          y: baseLineY - (p.val / maxY) * plotH,
          ...p,
        });
      }
      if (idx % 2 === 0) body += `<text x="${cx}" y="${H - 10}" text-anchor="middle" font-size="11" fill="${AXIS_TEXT}" class="tabular">${p.m.label.slice(2)}</text>`;
    });
    if (activeCoords.length > 0) {
      const d = buildSmoothPath(activeCoords);
      const area = `${d} L${activeCoords[activeCoords.length - 1].x.toFixed(1)},${baseLineY.toFixed(1)} L${activeCoords[0].x.toFixed(1)},${baseLineY.toFixed(1)} Z`;
      defs += `<linearGradient id="${gid}" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="${color}" stop-opacity="0.14"/><stop offset="100%" stop-color="${color}" stop-opacity="0.01"/></linearGradient>`;
      body += `<path d="${area}" fill="url(#${gid})" />`;
      body += `<path d="${d}" fill="none" stroke="${color}" stroke-width="2.3" stroke-linecap="round" />`;
      activeCoords.forEach((p) => {
        const share = p.m.total > 0 ? p.val / p.m.total : 0;
        const tt = `<div class="tt-head"><span>${esc(p.m.label)} · ${esc(category.name)}</span><span style="color:${color}">${fmtMoney(p.val, { prefix: '¥', privacy })}</span></div>
          <div class="tt-row"><span>占当月总收入</span><strong>${fmtPct(share)}</strong></div>
          ${p.m.record.note ? `<div class="tt-note">${esc(p.m.record.note)}</div>` : ''}`;
        body += `<circle class="svg-hit" data-tip="${esc(tt)}" cx="${p.x}" cy="${p.y}" r="3.6" fill="var(--card)" stroke="${color}" stroke-width="2" />`;
      });
    }
  }

  let avgLine = '';
  if (avg > 0 && avg <= maxY) {
    const ay = baseLineY - (avg / maxY) * plotH;
    avgLine = `<line x1="${padL}" y1="${ay}" x2="${W - padR}" y2="${ay}" stroke="${AXIS_TEXT}" stroke-opacity="0.45" stroke-width="1.1" stroke-dasharray="4 4" />`;
  }

  return `<svg viewBox="0 0 ${W} ${H}" style="display:block;width:100%;height:auto;overflow:visible">
    <defs>${defs}</defs>
    ${grid}${avgLine}${body}
  </svg>`;
}

// 11. Annual Total Income & Full-Year Projection (Crisp Rectangular Bars, Fresh Sky Blue)
export function renderAnnualTotalProjectionSvg(analytics, privacy) {
  const activeYears = analytics.years.filter((y) => (analytics.yearMap[y]?.recordedMonths || 0) > 0);
  if (!activeYears.length) return '';
  const W = 540, H = 232, padL = 50, padR = 16, padT = 26, padB = 30;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const baseLineY = padT + plotH;
  const maxVal = Math.max(...activeYears.map((y) => Math.max(analytics.yearMap[y].total, analytics.yearMap[y].projectedTotal || 0)), 50000);
  const maxY = Math.ceil(maxVal / 50000) * 50000;

  let grid = '';
  for (let i = 0; i <= 3; i++) {
    const v = (maxY / 3) * i;
    const y = baseLineY - (v / maxY) * plotH;
    if (i === 0) {
      grid += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="currentColor" stroke-opacity="0.14" stroke-width="1" />`;
    } else {
      grid += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="currentColor" stroke-opacity="0.06" stroke-dasharray="2 3" />`;
    }
    grid += `<text x="${padL - 8}" y="${y + 4}" text-anchor="end" font-size="10.5" fill="${AXIS_TEXT}" class="tabular">${formatAxisWan(v, privacy)}</text>`;
  }

  const colW = plotW / activeYears.length;
  const barW = Math.min(48, colW * 0.40);
  let bars = '';
  activeYears.forEach((y, idx) => {
    const s = analytics.yearMap[y];
    const cx = padL + idx * colW + colW / 2;
    const x = cx - barW / 2;
    const actH = (s.total / maxY) * plotH;
    const actY = baseLineY - actH;
    const isInc = s.recordedMonths < 12 && s.projectedTotal && s.projectedTotal > s.total;
    const projH = isInc ? (s.projectedTotal / maxY) * plotH : actH;
    const projY = baseLineY - projH;

    const actPath = crispTopRect(x, actY, barW, actH, 3);
    const projPath = isInc ? crispTopRect(x, projY, barW, projH, 3) : '';

    const tt = `<div class="tt-head"><span>${y}年 (${s.recordedMonths}/12个月)</span><span style="color:${PRIMARY_BLUE}">${fmtMoney(s.total, { prefix: '¥', privacy })}</span></div>
      ${isInc ? `<div class="tt-row"><span>推算全年</span><strong style="color:${FUND_TEAL}">${fmtMoney(s.projectedTotal, { prefix: '¥', privacy })}</strong></div>` : ''}
      <div class="tt-row"><span>月均收入</span><strong>${fmtMoney(s.monthlyAvg, { prefix: '¥', privacy })}</strong></div>`;

    bars += `<g class="svg-hit" data-tip="${esc(tt)}">`;
    if (projPath) {
      bars += `<path d="${projPath}" fill="${PRIMARY_BLUE}" fill-opacity="0.09" stroke="${PRIMARY_BLUE}" stroke-opacity="0.42" stroke-width="1.2" stroke-dasharray="4 3" />`;
    }
    if (actPath) bars += `<path d="${actPath}" fill="${PRIMARY_BLUE}" />`;
    bars += `<text x="${cx}" y="${(isInc ? projY : actY) - 8}" text-anchor="middle" font-size="11" font-weight="600" fill="var(--text-secondary)" class="tabular">${privacy ? '••' : isInc ? `预计 ${(s.projectedTotal / 10000).toFixed(1)}万` : `${(s.total / 10000).toFixed(2)}万`}</text>`;
    bars += `<text x="${cx}" y="${H - 8}" text-anchor="middle" font-size="12" fill="${AXIS_TEXT}">${y}年</text></g>`;
  });

  return `<svg viewBox="0 0 ${W} ${H}" style="display:block;width:100%;height:auto;overflow:visible">${grid}${bars}</svg>`;
}

// 12. Annual Actual Cash vs Housing Fund Stacked Bar (Crisp Rectangular Bars, Mint & Aqua)
export function renderAnnualCashFundSvg(analytics, privacy) {
  const activeYears = analytics.years.filter((y) => (analytics.yearMap[y]?.recordedMonths || 0) > 0);
  if (!activeYears.length) return '';
  const W = 540, H = 232, padL = 50, padR = 16, padT = 26, padB = 30;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const baseLineY = padT + plotH;
  const maxVal = Math.max(...activeYears.map((y) => analytics.yearMap[y].total), 50000);
  const maxY = Math.ceil(maxVal / 50000) * 50000;

  let grid = '';
  for (let i = 0; i <= 3; i++) {
    const v = (maxY / 3) * i;
    const y = baseLineY - (v / maxY) * plotH;
    if (i === 0) {
      grid += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="currentColor" stroke-opacity="0.14" stroke-width="1" />`;
    } else {
      grid += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="currentColor" stroke-opacity="0.06" stroke-dasharray="2 3" />`;
    }
    grid += `<text x="${padL - 8}" y="${y + 4}" text-anchor="end" font-size="10.5" fill="${AXIS_TEXT}" class="tabular">${formatAxisWan(v, privacy)}</text>`;
  }

  const colW = plotW / activeYears.length;
  const barW = Math.min(48, colW * 0.40);
  let defs = '';
  let bars = '';
  activeYears.forEach((y, idx) => {
    const s = analytics.yearMap[y];
    const cx = padL + idx * colW + colW / 2;
    const x = cx - barW / 2;
    const cashH = (s.cashTotal / maxY) * plotH;
    const fundH = (s.fundTotal / maxY) * plotH;
    const totalH = cashH + fundH;
    const cashY = baseLineY - cashH;
    const fundY = baseLineY - totalH;
    const clipId = nextId('cfClip');
    const outerPath = crispTopRect(x, fundY, barW, totalH, 3);
    defs += `<clipPath id="${clipId}"><path d="${outerPath}" /></clipPath>`;

    const tt = `<div class="tt-head"><span>${y}年 (${s.recordedMonths}个月)</span><span>${fmtMoney(s.total, { prefix: '¥', privacy })}</span></div>
      <div class="tt-row"><span>实际到手现金</span><strong style="color:${POS_TEXT}">${fmtMoney(s.cashTotal, { prefix: '¥', privacy })} (${fmtPct(s.cashRatio)})</strong></div>
      <div class="tt-row"><span>公积金入账</span><strong style="color:${FUND_TEAL}">${fmtMoney(s.fundTotal, { prefix: '¥', privacy })}</strong></div>`;
    bars += `<g class="svg-hit" data-tip="${esc(tt)}">
      <g clip-path="url(#${clipId})">
        <rect x="${x}" y="${cashY}" width="${barW}" height="${cashH}" fill="${CASH_GREEN}" />
        <rect x="${x}" y="${fundY}" width="${barW}" height="${fundH}" fill="${FUND_TEAL}" />
        ${cashH > 2 && fundH >= 1.5 ? `<line x1="${x}" y1="${cashY}" x2="${x + barW}" y2="${cashY}" stroke="var(--card)" stroke-width="1.5" style="pointer-events:none" />` : ''}
      </g>
      <text x="${cx}" y="${fundY - 8}" text-anchor="middle" font-size="11" font-weight="500" fill="var(--text-secondary)" class="tabular">${fmtPct(s.cashRatio)} 现金</text>
      <text x="${cx}" y="${H - 8}" text-anchor="middle" font-size="12" fill="${AXIS_TEXT}">${y}年</text>
    </g>`;
  });

  return `<svg viewBox="0 0 ${W} ${H}" style="display:block;width:100%;height:auto;overflow:visible"><defs>${defs}</defs>${grid}${bars}</svg>`;
}

// 13. Fair Same-Period YoY Attribution (Crisp Rectangular Bars, Fresh Mint / Coral)
export function renderYoYAttributionSvg(yearSummary, prevYear, privacy) {
  const items = yearSummary?.samePeriodItemDiffs || [];
  if (!items.length) {
    return `<div style="padding:36px 0;text-align:center;color:var(--text-tertiary);font-size:13px">暂无可归因的同期对比数据</div>`;
  }
  const rowH = 36;
  const padL = 96, padR = 96, padT = 12, padB = 12;
  const W = 980;
  const H = padT + padB + items.length * rowH;
  const plotW = W - padL - padR;
  const zeroX = padL + plotW / 2;
  const maxAbs = Math.max(...items.map((d) => Math.abs(d.diff)), 1000);

  let svg = `<line x1="${zeroX}" y1="${padT - 4}" x2="${zeroX}" y2="${H - padB + 4}" stroke="currentColor" stroke-opacity="0.16" stroke-width="1" />`;
  items.forEach((d, idx) => {
    const y = padT + idx * rowH;
    const isPos = d.diff >= 0;
    const bw = Math.max(3, (Math.abs(d.diff) / maxAbs) * (plotW / 2 - 12));
    const bx = isPos ? zeroX : zeroX - bw;
    const color = isPos ? CASH_GREEN : ONETIME_GROUP_COLOR;
    const textColor = isPos ? POS_TEXT : NEG_TEXT;
    const labelX = isPos ? zeroX + bw + 8 : zeroX - bw - 8;
    const anchor = isPos ? 'start' : 'end';
    const barPath = isPos
      ? crispRightRect(zeroX, y + 9, bw, 14, 2.5)
      : crispLeftRect(bx, y + 9, bw, 14, 2.5);

    const tt = `<div class="tt-head"><span>${esc(d.name)} · 同期对比</span><span style="color:${textColor}">${fmtMoney(d.diff, { prefix: '¥', signed: true, privacy })}</span></div>
      <div class="tt-row"><span>${yearSummary.year}同期</span><strong>${fmtMoney(d.currSame, { prefix: '¥', privacy })}</strong></div>
      <div class="tt-row"><span>${prevYear}同期</span><strong>${fmtMoney(d.prevSame, { prefix: '¥', privacy })}</strong></div>
      <div class="tt-row"><span>同比幅度</span><strong>${d.yoy !== null ? fmtPct(d.yoy, { signed: true }) : '新增项'}</strong></div>`;

    svg += `<g class="svg-hit" data-tip="${esc(tt)}">
      <rect class="bar-hit-bg" x="0" y="${y + 1}" width="${W}" height="${rowH - 3}" rx="6" />
      <text x="${padL - 12}" y="${y + 21}" text-anchor="end" font-size="12.5" font-weight="500" fill="var(--text)">${esc(d.name)}</text>
      ${barPath ? `<path d="${barPath}" fill="${color}" />` : ''}
      <text x="${labelX}" y="${y + 20}" text-anchor="${anchor}" font-size="11.5" font-weight="600" fill="${textColor}" class="tabular">
        ${fmtMoney(d.diff, { prefix: '¥', signed: true, decimals: 0, privacy })}
      </text>
    </g>`;
  });

  return `<svg viewBox="0 0 ${W} ${H}" style="display:block;width:100%;height:auto;overflow:visible">${svg}</svg>`;
}

// 14. Mini Sparkline for Hero KPI cells
export function renderMiniSparklineSvg(values, color = PRIMARY_BLUE) {
  const vals = (values || []).filter((v) => typeof v === 'number' && Number.isFinite(v));
  if (vals.length < 2) return '';
  const W = 128, H = 22, pad = 2.5;
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = Math.max(max - min, 1);
  const gid = nextId('spark');
  const pts = vals.map((v, i) => ({
    x: pad + (i / (vals.length - 1)) * (W - pad * 2),
    y: H - pad - ((v - min) / span) * (H - pad * 2),
  }));
  const d = buildSmoothPath(pts);
  const area = `${d} L${pts[pts.length - 1].x.toFixed(1)},${H} L${pts[0].x.toFixed(1)},${H} Z`;
  const last = pts[pts.length - 1];
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" style="display:block;overflow:visible">
    <defs>
      <linearGradient id="${gid}" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${color}" stop-opacity="0.22"/>
        <stop offset="100%" stop-color="${color}" stop-opacity="0.01"/>
      </linearGradient>
    </defs>
    <path d="${area}" fill="url(#${gid})" />
    <path d="${d}" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round" />
    <circle cx="${last.x.toFixed(1)}" cy="${last.y.toFixed(1)}" r="2.4" fill="var(--card)" stroke="${color}" stroke-width="1.5" />
  </svg>`;
}

// 15. Visual Pulse Micro-Charts (Replaces text-heavy insights with Liquid Glass visual meters)
export function renderVisualPulseHtml(analytics, privacy) {
  const ls = analytics.yearMap[analytics.latestYear];
  const prevY = analytics.latestYear - 1;
  const cashPct = Math.round((analytics.cashRatio || 0) * 1000) / 10;
  const fundPct = Math.max(0, Math.round((100 - cashPct) * 10) / 10);
  const regPct = Math.round(((1 - (analytics.onetimeRatio || 0)) * 1000)) / 10;
  const onePct = Math.max(0, Math.round((100 - regPct) * 10) / 10);

  // Same-period comparison bars
  const currSame = ls?.total || 0;
  const prevSame = ls?.prevSamePeriodTotal || 0;
  const sameMax = Math.max(currSame, prevSame, 1);
  const currW = Math.round((currSame / sameMax) * 100);
  const prevW = Math.round((prevSame / sameMax) * 100);
  const diff = ls?.samePeriodDiff;
  const yoy = ls?.samePeriodYoY;

  // Monthly range meter (Min / Regular Avg / Max)
  const totals = analytics.recordedMonths.map((m) => m.total);
  const minVal = totals.length ? Math.min(...totals) : 0;
  const maxVal = totals.length ? Math.max(...totals) : 1;
  const regAvg = analytics.overallRegularAvg || 0;
  const span = Math.max(maxVal - minVal, 1);
  const avgPos = Math.max(8, Math.min(92, ((regAvg - minVal) / span) * 100));

  return `
    <div class="pulse-stack">
      ${prevSame > 0 ? `
        <div class="pulse-block">
          <div class="pulse-head">
            <span class="pulse-title">${analytics.latestYear} vs ${prevY} 同期（前 ${ls.recordedMonths} 个月）</span>
            <span class="badge ${diff >= 0 ? 'badge-up' : 'badge-down'}">${diff >= 0 ? '↑' : '↓'} ${fmtPct(yoy, { signed: true })}</span>
          </div>
          <div class="pulse-compare-rows">
            <div class="pulse-bar-row">
              <span class="pulse-bar-lbl">${analytics.latestYear}</span>
              <div class="glass-track"><div class="glass-fill" style="width:${currW}%;background:${PRIMARY_BLUE}"></div></div>
              <span class="pulse-bar-val tabular">¥${fmtCompact(currSame, privacy)}</span>
            </div>
            <div class="pulse-bar-row">
              <span class="pulse-bar-lbl">${prevY}</span>
              <div class="glass-track"><div class="glass-fill" style="width:${prevW}%;background:#B8C4D4"></div></div>
              <span class="pulse-bar-val tabular" style="color:var(--text-tertiary)">¥${fmtCompact(prevSame, privacy)}</span>
            </div>
          </div>
        </div>
      ` : ''}

      <div class="pulse-block">
        <div class="pulse-head">
          <span class="pulse-title">到手现金 vs 公积金</span>
          <span class="pulse-meta tabular"><strong>${cashPct.toFixed(1)}%</strong> / ${fundPct.toFixed(1)}%</span>
        </div>
        <div class="glass-split-track">
          <div class="glass-split-seg" style="width:${cashPct}%;background:${CASH_GREEN}"></div>
          <div class="glass-split-seg" style="width:${fundPct}%;background:${FUND_TEAL}"></div>
        </div>
        <div class="pulse-foot tabular">
          <span><i class="swatch-dot" style="background:${CASH_GREEN}"></i>现金 ¥${fmtCompact(analytics.cumulativeCash, privacy)}</span>
          <span><i class="swatch-dot" style="background:${FUND_TEAL}"></i>公积金 ¥${fmtCompact(analytics.cumulativeFund, privacy)}</span>
        </div>
      </div>

      <div class="pulse-block">
        <div class="pulse-head">
          <span class="pulse-title">平时常规 vs 一次性款项</span>
          <span class="pulse-meta tabular"><strong>${regPct.toFixed(1)}%</strong> / ${onePct.toFixed(1)}%</span>
        </div>
        <div class="glass-split-track">
          <div class="glass-split-seg" style="width:${regPct}%;background:${PRIMARY_BLUE}"></div>
          <div class="glass-split-seg" style="width:${onePct}%;background:${ONETIME_GROUP_COLOR}"></div>
        </div>
        <div class="pulse-foot tabular">
          <span><i class="swatch-dot" style="background:${PRIMARY_BLUE}"></i>常规月均 ¥${fmtCompact(regAvg, privacy)}</span>
          <span><i class="swatch-dot" style="background:${ONETIME_GROUP_COLOR}"></i>一次性 ¥${fmtCompact(analytics.cumulativeOnetime, privacy)}</span>
        </div>
      </div>

      <div class="pulse-block">
        <div class="pulse-head">
          <span class="pulse-title">单月收入区间标尺</span>
          <span class="pulse-meta tabular">月均 ¥${fmtCompact(analytics.overallMonthlyAvg, privacy)}</span>
        </div>
        <div class="range-meter">
          <div class="range-track">
            <div class="range-fill" style="left:0;width:${avgPos.toFixed(1)}%"></div>
            <div class="range-pin" style="left:${avgPos.toFixed(1)}%" title="平时月均"></div>
          </div>
          <div class="range-labels tabular">
            <span>低谷 ¥${fmtCompact(minVal, privacy)}</span>
            <span style="color:var(--blue);font-weight:600">常规均 ¥${fmtCompact(regAvg, privacy)}</span>
            <span>峰值 ¥${fmtCompact(maxVal, privacy)}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function bindChartTooltips(rootEl) {
  const tip = document.getElementById('chart-tooltip');
  if (!tip) return;
  const hits = rootEl.querySelectorAll('.svg-hit');
  hits.forEach((el) => {
    el.addEventListener('mouseenter', (e) => {
      const html = el.getAttribute('data-tip');
      if (!html) return;
      tip.innerHTML = html;
      tip.style.display = 'block';
      positionTip(tip, e);
    });
    el.addEventListener('mousemove', (e) => positionTip(tip, e));
    el.addEventListener('mouseleave', () => {
      tip.style.display = 'none';
    });
  });
}

function positionTip(tip, e) {
  const margin = 14;
  let x = e.clientX + margin;
  let y = e.clientY + margin;
  const rect = tip.getBoundingClientRect();
  if (x + rect.width > window.innerWidth - 10) x = e.clientX - rect.width - margin;
  if (y + rect.height > window.innerHeight - 10) y = e.clientY - rect.height - margin;
  tip.style.left = `${Math.max(8, x)}px`;
  tip.style.top = `${Math.max(8, y)}px`;
}
