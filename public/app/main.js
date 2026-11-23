import { APPLE_PALETTE, ONETIME_GROUP_COLOR, createSeedData, makeMonthId } from './seed.js';
import { computeAnalytics, deltaBadgeHtml, fmtCompact, fmtMoney, fmtPct, moneyHtml, round2 } from './analytics.js';
import {
  bindChartTooltips,
  renderAnnualCashFundSvg,
  renderAnnualTotalProjectionSvg,
  renderCategoryTrendSvg,
  renderCrossYearStackSvg,
  renderCumulativeWealthSvg,
  renderDeltaBarSvg,
  renderDonutSvg,
  renderGoalRingSvg,
  renderItemCompareBarSvg,
  renderMultiYearLineSvg,
  renderRegularBaselineSvg,
  renderStackedTrendSvg,
  renderYoYAttributionSvg,
} from './charts.js';
import { exportToCsv, exportToExcel, exportToJson, importFromFile, loadStoreData, saveStoreData } from './io.js';

const ICONS = {
  overview: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="2"/><rect x="14" y="3" width="7" height="5" rx="2"/><rect x="14" y="12" width="7" height="9" rx="2"/><rect x="3" y="16" width="7" height="5" rx="2"/></svg>`,
  monthly: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>`,
  structure: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>`,
  annual: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>`,
  ledger: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2.5"/><path d="M3 9h18M3 15h18M9 3v18"/></svg>`,
  eye: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`,
  eyeOff: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>`,
  sliders: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>`,
  file: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M8 13h8M8 17h8"/></svg>`,
  moon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
  sun: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>`,
};

const NAV = [
  { id: 'overview', label: '总览看板' },
  { id: 'monthly', label: '月度对比' },
  { id: 'structure', label: '收入结构' },
  { id: 'annual', label: '年度对比' },
  { id: 'ledger', label: '工资明细' },
];

const state = {
  store: createSeedData(),
  saveMode: 'saved',
  tab: 'overview',
  caliber: 'total', // total | cash | fund
  heroScope: 'cumulative', // cumulative | year
  trendStudioTab: 'stacked_regular', // stacked_regular | stacked_cash | cumulative
  overviewLineMode: 'all', // all | regular
  monthlyMode: 'all', // all | regular
  monthlyCompareYear: 2026,
  monthlyDetailTab: 'yoy_table', // yoy_table | notes
  structureYear: 2026,
  selectedCategoryId: 'salary',
  annualAttribYear: 2026,
  annualTableTab: 'items', // items | indicators | cash_fund
  ledgerYear: 2026, // number or 'all'
  ledgerViewMode: 'full', // full | summary
  ledgerSearch: '',
  privacy: false,
  dark: false,
  editingGoal: false,
  editingRecordId: null,
  draftValues: {},
  draftNote: '',
  showCatModal: false,
  newCatColor: APPLE_PALETTE[0],
  showDataMenu: false,
  toast: null,
};

let toastTimer = null;
function showToast(msg) {
  state.toast = msg;
  render();
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    state.toast = null;
    render();
  }, 2600);
}

async function persist(nextStore, msg) {
  state.store = nextStore;
  state.saveMode = 'saving';
  render();
  const res = await saveStoreData(nextStore);
  state.saveMode = res.mode === 'file' ? 'saved' : 'local';
  if (msg) showToast(msg);
  else render();
}

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function maskInsightLine(line, privacy) {
  if (!privacy) return line;
  return line.replace(/\d{1,3}(?:,\d{3})+(?:\.\d+)?(?=\s*元)/g, '••••');
}

function openMonthEditor(recordId, analytics) {
  const all = [...analytics.historicalRecords, ...analytics.computedMonths];
  const target = all.find((m) => m.record.id === recordId);
  if (!target) return;
  state.editingRecordId = recordId;
  const vMap = {};
  for (const cat of analytics.categories) {
    const v = target.record.values?.[cat.id];
    vMap[cat.id] = v !== null && v !== undefined ? String(v) : '';
  }
  state.draftValues = vMap;
  state.draftNote = target.record.note || '';
  render();
}

// =========================================================================
// VIEW 1: 总览看板 (Overview) — 4 Calm Blocks
// =========================================================================
function renderOverview(analytics) {
  const p = state.privacy;
  const ly = analytics.latestYear;
  const ls = analytics.yearMap[ly];
  const goal = state.store.goals?.[ly] || {};
  const calLabel = state.caliber === 'cash' ? '实际到手现金' : state.caliber === 'fund' ? '公积金入账' : '账面总收入';

  const cumVal = state.caliber === 'cash' ? analytics.cumulativeCash : state.caliber === 'fund' ? analytics.cumulativeFund : analytics.cumulativeTotal;
  const lyVal = state.caliber === 'cash' ? ls?.cashTotal || 0 : state.caliber === 'fund' ? ls?.fundTotal || 0 : ls?.total || 0;
  const avgVal = state.caliber === 'cash' ? analytics.overallCashAvg : state.caliber === 'fund' ? (analytics.totalRecordedCount > 0 ? analytics.cumulativeFund / analytics.totalRecordedCount : null) : analytics.overallMonthlyAvg;
  const regularAvgVal = state.caliber === 'cash' ? analytics.overallRegularCashAvg : state.caliber === 'fund' ? avgVal : analytics.overallRegularAvg;

  const heroValue = state.heroScope === 'year' ? lyVal : cumVal;
  const heroDesc =
    state.heroScope === 'year'
      ? `${ly}年已录入 ${ls?.recordedMonths || 0} 个月${ls?.samePeriodDiff != null ? ` · 比上年同期${ls.samePeriodDiff >= 0 ? '多' : '少'} ¥${fmtCompact(Math.abs(ls.samePeriodDiff), p)}` : ''}`
      : `共 ${analytics.totalRecordedCount} 个月（${analytics.firstRecordedMonth?.label || ''} 至 ${analytics.latestRecordedMonth?.label || ''}）· 占总收入 ${state.caliber === 'cash' ? fmtPct(analytics.cashRatio) : state.caliber === 'fund' ? fmtPct(analytics.fundRatio) : '100.0%'}`;

  const lyProj = state.caliber === 'cash' ? ls?.projectedCash || lyVal : ls?.projectedTotal || lyVal;
  const targetAmt = state.caliber === 'cash' ? goal.cashTarget || 0 : goal.totalTarget || 0;
  const progPct = targetAmt > 0 ? Math.min(100, (lyVal / targetAmt) * 100) : Math.min(100, ((ls?.recordedMonths || 0) / 12) * 100);
  const projPct = targetAmt > 0 ? Math.min(100, (lyProj / targetAmt) * 100) : 0;

  const avgRef =
    state.trendStudioTab === 'stacked_cash'
      ? analytics.overallMonthlyAvg
      : state.caliber === 'cash'
      ? analytics.overallCashAvg
      : analytics.overallMonthlyAvg;

  return `
    <!-- Block 1: Unified Hero Canvas -->
    <section class="card hero-card">
      <div class="hero-top">
        <div style="flex:1;min-width:260px">
          <div class="hero-eyebrow">
            <span>${state.heroScope === 'year' ? `${ly}年${calLabel}` : `累计${calLabel}`}</span>
            <div class="segmented segmented-sm">
              <button class="${state.heroScope === 'cumulative' ? 'active' : ''}" data-hscope="cumulative">全部累计</button>
              <button class="${state.heroScope === 'year' ? 'active' : ''}" data-hscope="year">${ly} 本年</button>
            </div>
          </div>
          <div class="hero-figure">${moneyHtml(heroValue, p)}</div>
          <div class="hero-subline">
            ${deltaBadgeHtml(ls?.samePeriodYoY, `${ly}同期`)}
            <span>${esc(heroDesc)}</span>
          </div>
        </div>

        <!-- Goal & Forecast Ring Panel -->
        <div class="goal-panel">
          ${state.editingGoal ? `
            <div style="width:100%;display:flex;flex-direction:column;gap:8px">
              <div style="display:flex;justify-content:space-between;align-items:center">
                <span style="font-size:12.5px;font-weight:600">${ly} 年度目标设定</span>
                <div style="display:flex;gap:6px">
                  <button class="icon-btn" data-action="cancel-goal" style="padding:3px 8px;font-size:12px">取消</button>
                  <button class="icon-btn primary" data-action="save-goal" style="padding:3px 10px;font-size:12px">保存</button>
                </div>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
                <div>
                  <div style="font-size:11px;color:var(--text-tertiary);margin-bottom:2px">总收入目标</div>
                  <input id="goal-total-input" type="number" class="apple-input tabular" style="width:100%;padding:5px 8px;font-size:12.5px" value="${goal.totalTarget ?? ''}" placeholder="185000" />
                </div>
                <div>
                  <div style="font-size:11px;color:var(--text-tertiary);margin-bottom:2px">实际到手目标</div>
                  <input id="goal-cash-input" type="number" class="apple-input tabular" style="width:100%;padding:5px 8px;font-size:12.5px" value="${goal.cashTarget ?? ''}" placeholder="150000" />
                </div>
              </div>
            </div>
          ` : `
            <div class="goal-ring-wrap">
              ${renderGoalRingSvg(progPct, projPct)}
              <div class="goal-ring-text">${progPct.toFixed(1)}%</div>
            </div>
            <div style="flex:1;min-width:0">
              <div style="display:flex;justify-content:space-between;align-items:center;gap:6px">
                <span style="font-size:12.5px;font-weight:600">${ly} 年度进度</span>
                <button class="icon-btn" data-action="edit-goal" style="padding:2px 7px;font-size:11.5px;color:var(--blue)">设定目标</button>
              </div>
              <div style="font-size:12px;color:var(--text-secondary);margin-top:3px" class="tabular">
                ${targetAmt > 0 ? `目标 ¥${fmtCompact(targetAmt, p)}` : `已过 ${ls?.recordedMonths || 0}/12 个月`}
              </div>
              <div style="font-size:12px;color:var(--text-tertiary);margin-top:2px" class="tabular">
                预计全年 <strong style="color:var(--blue)">¥${fmtCompact(lyProj, p)}</strong>
              </div>
            </div>
          `}
        </div>
      </div>

      <!-- Hairline 4-Cell Sub-Metrics Strip -->
      <div class="metrics-strip">
        <div class="metric-cell">
          <div class="metric-label">${state.heroScope === 'year' ? `全部累计（${analytics.totalRecordedCount}个月）` : `${ly}年累计（${ls?.recordedMonths || 0}个月）`}</div>
          <div class="metric-value">${moneyHtml(state.heroScope === 'year' ? cumVal : lyVal, p)}</div>
          <div class="metric-note">${state.heroScope === 'year' ? `占累计 ${calLabel}` : `比上年同期${ls?.samePeriodDiff >= 0 ? '多' : '少'} ¥${fmtCompact(Math.abs(ls?.samePeriodDiff || 0), p)}`}</div>
        </div>
        <div class="metric-cell">
          <div class="metric-label">月均${calLabel}</div>
          <div class="metric-value">${moneyHtml(avgVal, p)}</div>
          <div class="metric-note">平时月均 ¥${fmtCompact(regularAvgVal, p)}（不含一次性）</div>
        </div>
        <div class="metric-cell">
          <div class="metric-label">累计实际到手现金</div>
          <div class="metric-value">${moneyHtml(analytics.cumulativeCash, p)}</div>
          <div class="metric-note">占总收入 ${fmtPct(analytics.cashRatio)} · 月均 ¥${fmtCompact(analytics.overallCashAvg, p)}</div>
        </div>
        <div class="metric-cell">
          <div class="metric-label">累计公积金入账</div>
          <div class="metric-value">${moneyHtml(analytics.cumulativeFund, p)}</div>
          <div class="metric-note">占总收入 ${fmtPct(analytics.fundRatio)} · 含结息 ¥${fmtCompact(analytics.cumulativeFundInterest, p)}</div>
        </div>
      </div>
    </section>

    <!-- Block 2: Interactive Trend Studio -->
    <section class="card">
      <div class="card-header">
        <div>
          <div class="card-title">${state.trendStudioTab === 'cumulative' ? '累计收入与公积金滚存轨迹' : '近 24 个月逐月收入趋势'}</div>
          <div class="card-sub">${state.trendStudioTab === 'cumulative' ? '逐月复盘总收入、实际到手现金与公积金的长期积累曲线' : '悬停柱体查看当月明细与备注 · 虚线为历史月均参考线'}</div>
        </div>
        <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">
          ${state.trendStudioTab === 'cumulative' ? `
            <div class="legend-row">
              <span class="legend-item"><span class="legend-line" style="background:#007AFF"></span>累计总收入</span>
              <span class="legend-item"><span class="legend-line" style="background:#34C759"></span>累计到手现金</span>
              <span class="legend-item"><span class="legend-line" style="background:#00C7BE"></span>累计公积金</span>
            </div>
          ` : state.trendStudioTab === 'stacked_cash' ? `
            <div class="legend-row">
              <span class="legend-item"><span class="legend-swatch" style="background:#34C759"></span>实际到手</span>
              <span class="legend-item"><span class="legend-swatch" style="background:#00C7BE"></span>公积金</span>
            </div>
          ` : `
            <div class="legend-row">
              <span class="legend-item"><span class="legend-swatch" style="background:#007AFF"></span>平时常规</span>
              <span class="legend-item"><span class="legend-swatch" style="background:${ONETIME_GROUP_COLOR}"></span>一次性款项</span>
            </div>
          `}
          <div class="segmented">
            <button class="${state.trendStudioTab === 'stacked_regular' ? 'active' : ''}" data-tstudio="stacked_regular">逐月趋势</button>
            <button class="${state.trendStudioTab === 'stacked_cash' ? 'active' : ''}" data-tstudio="stacked_cash">现金 vs 公积金</button>
            <button class="${state.trendStudioTab === 'cumulative' ? 'active' : ''}" data-tstudio="cumulative">累计财富滚存</button>
          </div>
        </div>
      </div>
      ${state.trendStudioTab === 'cumulative'
        ? renderCumulativeWealthSvg(analytics.runningCumulativeSeries, p)
        : renderStackedTrendSvg(
            analytics.recent24Months,
            state.trendStudioTab === 'stacked_cash' ? 'cash_fund' : 'regular_onetime',
            p,
            avgRef
          )}
    </section>

    <!-- Block 3: Multi-Year Curve (7 cols) + Editorial Insights (5 cols) -->
    <section class="grid-12">
      <div class="card col-7">
        <div class="card-header" style="margin-bottom:8px">
          <div>
            <div class="card-title">各年月度走势对照（${calLabel}）</div>
            <div class="card-sub">同月份跨年比对，观察发放节奏与增速变化</div>
          </div>
          <div class="segmented segmented-sm">
            <button class="${state.overviewLineMode === 'all' ? 'active' : ''}" data-oline="all">含一次性</button>
            <button class="${state.overviewLineMode === 'regular' ? 'active' : ''}" data-oline="regular">平时常规</button>
          </div>
        </div>
        ${renderMultiYearLineSvg(analytics, state.caliber, state.overviewLineMode, p)}
      </div>

      <div class="card col-5">
        <div class="card-header" style="margin-bottom:12px">
          <div>
            <div class="card-title">一句话读懂你的收入</div>
            <div class="card-sub">随明细更新实时重算</div>
          </div>
        </div>
        <div class="editorial-list">
          ${analytics.insights.map((line, i) => `
            <div class="editorial-row">
              <span class="editorial-index">${i + 1}</span>
              <span>${esc(maskInsightLine(line, p))}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <!-- Block 4: Unified Extremes & One-Time Strip -->
    <section class="card card-compact">
      <div class="metrics-strip-3">
        <div class="metric-cell">
          <div class="metric-label">单月最高收入</div>
          <div class="metric-value">${moneyHtml(analytics.maxMonth?.total, p)}</div>
          <div class="metric-note">${analytics.maxMonth ? `${analytics.maxMonth.record.year}年${analytics.maxMonth.record.month}月${analytics.maxMonth.record.note ? ` · ${analytics.maxMonth.record.note}` : ''}` : '—'}</div>
        </div>
        <div class="metric-cell">
          <div class="metric-label">单月最低收入</div>
          <div class="metric-value">${moneyHtml(analytics.minMonth?.total, p)}</div>
          <div class="metric-note">${analytics.minMonth ? `${analytics.minMonth.record.year}年${analytics.minMonth.record.month}月` : '—'}</div>
        </div>
        <div class="metric-cell">
          <div class="metric-label">一次性款项累计（占 ${fmtPct(analytics.onetimeRatio)}）</div>
          <div class="metric-value">${moneyHtml(analytics.cumulativeOnetime, p)}</div>
          <div class="metric-note">含考核奖、一次性奖、应休未休、调表增资及结息</div>
        </div>
      </div>
    </section>
  `;
}

// =========================================================================
// VIEW 2: 月度对比 (Monthly)
// =========================================================================
function renderMonthly(analytics) {
  const p = state.privacy;
  const mode = state.monthlyMode;
  const vals = analytics.recordedMonths.map((m) => (mode === 'all' ? m.total : m.regularTotal));
  const minV = vals.length ? Math.min(...vals) : 0;
  const maxV = vals.length ? Math.max(...vals) : 1;

  const heatBg = (v) => {
    const r = maxV > minV ? (v - minV) / (maxV - minV) : 0.5;
    return `rgba(0, 122, 255, ${(0.07 + r * 0.36).toFixed(3)})`;
  };

  const comparableYears = analytics.years.filter((y) => (analytics.yearMap[y]?.recordedMonths || 0) > 0 && (analytics.yearMap[y - 1]?.recordedMonths || 0) > 0);
  const selY = comparableYears.includes(state.monthlyCompareYear) ? state.monthlyCompareYear : (comparableYears[comparableYears.length - 1] || analytics.latestYear);
  const prevY = selY - 1;
  const currS = analytics.yearMap[selY];
  const prevS = analytics.yearMap[prevY];

  const yoyRows = Array.from({ length: 12 }, (_, idx) => {
    const m = idx + 1;
    const cm = currS?.months.find((x) => x.record.month === m);
    const pm = prevS?.months.find((x) => x.record.month === m);
    const currVal = cm?.hasData ? (mode === 'all' ? cm.total : cm.regularTotal) : null;
    const prevVal = pm?.hasData ? (mode === 'all' ? pm.total : pm.regularTotal) : null;
    const diff = currVal != null && prevVal != null ? round2(currVal - prevVal) : null;
    const yoy = diff != null && prevVal > 0 ? diff / prevVal : null;
    return { month: m, label: `${m}月`, currVal, prevVal, diff, yoy };
  });

  let sameCurr = 0, samePrev = 0, sameCount = 0;
  for (const r of yoyRows) {
    if (r.currVal != null && r.prevVal != null) { sameCurr += r.currVal; samePrev += r.prevVal; sameCount++; }
  }
  const sameDiff = round2(sameCurr - samePrev);
  const sameYoY = samePrev > 0 ? sameDiff / samePrev : null;
  const bs = analytics.regularBaselineStats;

  return `
    <!-- Card 1: 12xN Heatmap Matrix -->
    <section class="card">
      <div class="card-header">
        <div>
          <div class="card-title">月度收入热力矩阵（12个月 × 多年份）</div>
          <div class="card-sub">蓝点代表含备注说明 · 点击任意月份格子即可直达编辑</div>
        </div>
        <div class="segmented">
          <button class="${mode === 'all' ? 'active' : ''}" data-mmode="all">含一次性款项</button>
          <button class="${mode === 'regular' ? 'active' : ''}" data-mmode="regular">平时常规收入</button>
        </div>
      </div>
      <div class="table-wrap">
        <table class="heatmap-table">
          <thead>
            <tr>
              <th style="width:58px">月份</th>
              ${analytics.years.map((y) => `<th style="min-width:94px;color:var(--text);font-weight:600">${y}年</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${Array.from({ length: 12 }, (_, idx) => {
              const m = idx + 1;
              return `<tr>
                <td style="font-weight:500;color:var(--text-secondary)">${m}月</td>
                ${analytics.years.map((y) => {
                  const f = analytics.yearMap[y]?.months.find((x) => x.record.month === m);
                  const v = f?.hasData ? (mode === 'all' ? f.total : f.regularTotal) : null;
                  return `<td>
                    <button class="heat-cell ${v == null ? 'heat-empty' : ''}" style="${v != null ? `background:${heatBg(v)}` : ''}" data-jump="${f?.record.id || ''}" title="${esc(f?.record.note || `${y}年${m}月`)}">
                      ${f?.record.note ? `<span class="heat-note-dot"></span>` : ''}
                      ${v != null ? fmtMoney(v, { privacy: p }) : '—'}
                    </button>
                  </td>`;
                }).join('')}
              </tr>`;
            }).join('')}
            <tr>
              <td style="font-weight:600;padding-top:10px">年度合计</td>
              ${analytics.years.map((y) => {
                const s = analytics.yearMap[y];
                const v = mode === 'all' ? s?.total : s?.regularTotal;
                return `<td style="font-weight:600;padding-top:10px">${s?.recordedMonths ? fmtMoney(v, { privacy: p }) : '—'}</td>`;
              }).join('')}
            </tr>
            <tr>
              <td style="color:var(--text-tertiary)">月均水平</td>
              ${analytics.years.map((y) => {
                const s = analytics.yearMap[y];
                const v = mode === 'all' ? s?.monthlyAvg : s?.regularMonthlyAvg;
                return `<td style="color:var(--text-secondary)">${v != null ? fmtMoney(v, { privacy: p }) : '—'}</td>`;
              }).join('')}
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Card 2: Diverging Delta Chart (6 cols) + Regular Baseline Stability (6 cols) -->
    <section class="grid-12">
      <div class="card col-6">
        <div class="card-header">
          <div>
            <div class="card-title">${selY}年 vs ${prevY}年 · 逐月增减</div>
            <div class="card-sub">同期 ${sameCount} 个月可比：差额 ${fmtMoney(sameDiff, { prefix: '¥', signed: true, privacy: p })}</div>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            ${deltaBadgeHtml(sameYoY, '同期')}
            ${comparableYears.length > 0 ? `
              <select class="apple-select" id="monthly-year-select" style="padding:5px 10px;font-size:12.5px">
                ${comparableYears.map((y) => `<option value="${y}" ${y === selY ? 'selected' : ''}>${y} 年</option>`).join('')}
              </select>
            ` : ''}
          </div>
        </div>
        ${renderDeltaBarSvg(yoyRows, p)}
      </div>

      <div class="card col-6">
        <div class="card-header">
          <div>
            <div class="card-title">平时常规收入基线走势</div>
            <div class="card-sub">剥离一次性奖金后的日常底盘 · 近3月均 ¥${fmtCompact(bs.latest3Avg, p)}</div>
          </div>
          <div class="legend-row" style="font-size:11.5px">
            <span>区间 ¥${fmtCompact(bs.min, p)}–¥${fmtCompact(bs.max, p)}</span>
          </div>
        </div>
        ${renderRegularBaselineSvg(analytics.recordedMonths, bs, p)}
      </div>
    </section>

    <!-- Card 3: Tabbed Detail Card (YoY Table | Focus Notes) -->
    <section class="card">
      <div class="card-header">
        <div>
          <div class="card-title">${state.monthlyDetailTab === 'notes' ? `重点月份说明（${analytics.notedMonths.length}条）` : `${selY}年 vs ${prevY}年 · 逐月同期明细表`}</div>
          <div class="card-sub">${state.monthlyDetailTab === 'notes' ? '自动同步工资明细中所有备注，点击跳转编辑' : `「同期合计」仅统计双方均已录入的 ${sameCount} 个月，确保对比公平`}</div>
        </div>
        <div class="segmented">
          <button class="${state.monthlyDetailTab === 'yoy_table' ? 'active' : ''}" data-mdetail="yoy_table">逐月同期明细表</button>
          <button class="${state.monthlyDetailTab === 'notes' ? 'active' : ''}" data-mdetail="notes">重点月份说明（${analytics.notedMonths.length}条）</button>
        </div>
      </div>

      ${state.monthlyDetailTab === 'yoy_table' ? `
        <div class="table-wrap">
          <table>
            <thead><tr><th>月份</th><th>${selY}年</th><th>${prevY}年</th><th>增减（元）</th><th>同比</th></tr></thead>
            <tbody>
              ${yoyRows.map((r) => `<tr class="tr-hover">
                <td style="color:var(--text-secondary)">${r.label}</td>
                <td style="font-weight:500">${r.currVal != null ? fmtMoney(r.currVal, { privacy: p }) : '—'}</td>
                <td style="color:var(--text-tertiary)">${r.prevVal != null ? fmtMoney(r.prevVal, { privacy: p }) : '—'}</td>
                <td style="font-weight:500;color:${r.diff == null ? 'var(--text-muted)' : r.diff >= 0 ? 'var(--green)' : 'var(--red)'}">${r.diff != null ? fmtMoney(r.diff, { signed: true, privacy: p }) : '—'}</td>
                <td style="color:var(--text-secondary)">${r.yoy != null ? fmtPct(r.yoy, { signed: true }) : '—'}</td>
              </tr>`).join('')}
              <tr class="tr-highlight">
                <td style="color:var(--blue)">同期合计（1–${sameCount}月）</td>
                <td>${fmtMoney(sameCurr, { privacy: p })}</td>
                <td style="color:var(--text-secondary)">${fmtMoney(samePrev, { privacy: p })}</td>
                <td style="color:${sameDiff >= 0 ? 'var(--green)' : 'var(--red)'}">${fmtMoney(sameDiff, { signed: true, privacy: p })}</td>
                <td style="color:var(--blue)">${fmtPct(sameYoY, { signed: true })}</td>
              </tr>
            </tbody>
          </table>
        </div>
      ` : `
        <div class="editorial-list">
          ${analytics.notedMonths.map((m) => `
            <button data-jump="${m.record.id}" class="editorial-row tr-hover" style="width:100%;text-align:left;padding:12px 10px;border-radius:10px;justify-content:space-between;align-items:center">
              <div style="display:flex;gap:12px;align-items:baseline;min-width:0">
                <strong style="font-size:13px;color:var(--text);flex-shrink:0">${m.record.year}年${m.record.month}月</strong>
                <span style="font-size:13px;color:var(--text-secondary)">${esc(m.record.note)}</span>
              </div>
              <span class="tabular" style="font-size:13px;font-weight:600;color:var(--blue);flex-shrink:0">¥${fmtCompact(m.total, p)}</span>
            </button>
          `).join('')}
        </div>
      `}
    </section>
  `;
}

// =========================================================================
// VIEW 3: 收入结构 (Structure)
// =========================================================================
function renderStructure(analytics) {
  const p = state.privacy;
  const activeYears = analytics.years.filter((y) => (analytics.yearMap[y]?.recordedMonths || 0) > 0);
  const selY = activeYears.includes(state.structureYear) ? state.structureYear : analytics.latestYear;
  const prevY = selY - 1;
  const currS = analytics.yearMap[selY];
  const prevS = analytics.yearMap[prevY];

  const comp = [];
  if (currS) {
    for (const cat of analytics.regularCategories) {
      const v = currS.itemTotals[cat.id] || 0;
      if (v > 0) comp.push({ name: cat.name, value: v, color: cat.color, pct: currS.total > 0 ? v / currS.total : 0 });
    }
    if (currS.onetimeTotal > 0) {
      comp.push({ name: '一次性款项', value: currS.onetimeTotal, color: ONETIME_GROUP_COLOR, pct: currS.total > 0 ? currS.onetimeTotal / currS.total : 0 });
    }
    comp.sort((a, b) => b.value - a.value);
  }

  // Single-category 24m explorer stats
  const selCat = analytics.categories.find((c) => c.id === state.selectedCategoryId) || analytics.categories[0];
  const catVals24 = analytics.recent24Months
    .filter((m) => m.hasData)
    .map((m) => {
      const raw = m.record.values?.[selCat.id];
      return raw !== null && raw !== undefined && raw !== '' && !Number.isNaN(Number(raw)) ? Number(raw) : 0;
    });
  const catSum24 = round2(catVals24.reduce((s, v) => s + v, 0));
  const nonZero24 = catVals24.filter((v) => v > 0);
  const catAvg24 = nonZero24.length ? round2(catSum24 / nonZero24.length) : 0;
  const catMax24 = catVals24.length ? Math.max(...catVals24) : 0;

  return `
    <!-- Header Bar -->
    <section class="card card-compact" style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:12px">
      <div>
        <div class="card-title">收入结构 · 钱从哪里来</div>
        <div class="card-sub">${selY}年已录入 ${currS?.recordedMonths || 0} 个月${prevS?.recordedMonths ? ` · 对比 ${prevY}年（${prevS.recordedMonths}个月）` : ''}</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <span style="font-size:12.5px;color:var(--text-tertiary)">查看年份</span>
        <select class="apple-select" id="structure-year-select">
          ${activeYears.map((y) => `<option value="${y}" ${y === selY ? 'selected' : ''}>${y} 年</option>`).join('')}
        </select>
      </div>
    </section>

    <!-- Row 1: Donut (7 cols) + Cross-Year 100% Stack (5 cols) -->
    <section class="grid-12">
      <div class="card col-7">
        <div class="card-header">
          <div>
            <div class="card-title">${selY}年各类收入占比</div>
            <div class="card-sub">按金额从高到低排列</div>
          </div>
        </div>
        <div class="donut-split">
          <div>${renderDonutSvg(comp, currS?.total || 0, `${selY}年合计`, p)}</div>
          <div style="display:flex;flex-direction:column;gap:10px;min-width:0">
            ${comp.map((c) => `
              <div>
                <div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:4px;gap:8px;white-space:nowrap">
                  <span style="display:flex;align-items:center;gap:7px;font-weight:500"><span style="width:8px;height:8px;border-radius:99px;background:${c.color};flex-shrink:0"></span>${esc(c.name)}</span>
                  <span class="tabular" style="color:var(--text-tertiary)">${fmtMoney(c.value, { prefix: '¥', privacy: p })} · <strong style="color:var(--text)">${fmtPct(c.pct)}</strong></span>
                </div>
                <div style="height:5px;border-radius:99px;background:var(--seg-bg);overflow:hidden">
                  <div style="height:100%;width:${(c.pct * 100).toFixed(1)}%;background:${c.color};border-radius:99px"></div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="card col-5">
        <div class="card-header" style="margin-bottom:10px">
          <div>
            <div class="card-title">跨年构成演变（100%）</div>
            <div class="card-sub">悬停色块查看各年度结构比例变化</div>
          </div>
        </div>
        ${renderCrossYearStackSvg(analytics, p)}
      </div>
    </section>

    <!-- Row 2: Restored Excel Grouped Item Comparison Bar -->
    <section class="card">
      <div class="card-header">
        <div>
          <div class="card-title">${selY}年 vs ${prevY}年 · 各项收入对比</div>
          <div class="card-sub">按 ${selY}年金额由高到低横向对照，直观识别主要增量与减量科目</div>
        </div>
        <div class="legend-row">
          <span class="legend-item"><span class="legend-swatch" style="background:#007AFF"></span>${selY}年</span>
          <span class="legend-item"><span class="legend-swatch" style="background:rgba(142,142,147,0.28)"></span>${prevY}年</span>
        </div>
      </div>
      ${renderItemCompareBarSvg(analytics.categories, currS, prevS, selY, prevY, p)}
    </section>

    <!-- Row 3: Apple Health Style Single-Category 24-Month Trend Explorer -->
    <section class="card">
      <div class="card-header" style="margin-bottom:14px">
        <div>
          <div class="card-title">单项收入 24 个月走势追踪</div>
          <div class="card-sub">点击下方科目胶囊切换查看独立波动与台阶变化</div>
        </div>
        <div style="display:flex;gap:18px;font-size:12px;color:var(--text-tertiary)" class="tabular">
          <span>近24月累计 <strong style="color:var(--text)">¥${fmtCompact(catSum24, p)}</strong></span>
          <span>有记录月均 <strong style="color:var(--text)">¥${fmtCompact(catAvg24, p)}</strong></span>
          <span>单月最高 <strong style="color:var(--text)">¥${fmtCompact(catMax24, p)}</strong></span>
        </div>
      </div>
      <div class="chip-row">
        ${analytics.categories.map((cat) => `<button class="chip ${cat.id === selCat.id ? 'active' : ''}" data-cat-chip="${cat.id}">${esc(cat.name)}</button>`).join('')}
      </div>
      ${renderCategoryTrendSvg(analytics.recent24Months, selCat, p)}
    </section>

    <!-- Row 4: Item-by-Item Breakdown Table -->
    <section class="card">
      <div class="card-header">
        <div>
          <div class="card-title">${selY}年 vs ${prevY}年 · 分项明细对比表</div>
          ${prevS && currS && currS.recordedMonths !== prevS.recordedMonths ? `<div class="card-sub" style="color:var(--amber)">提示：${selY}年已录入 ${currS.recordedMonths} 个月，${prevY}年已录入 ${prevS.recordedMonths} 个月，月数不同时请重点关注底部「月均收入」</div>` : ''}
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>收入科目</th><th style="text-align:left">归类</th><th>${selY}年</th><th>${prevY}年</th><th>增减</th><th>同比</th><th>占本年</th></tr></thead>
          <tbody>
            ${analytics.categories.map((cat) => {
              const cv = currS?.itemTotals[cat.id] || 0;
              const pv = prevS?.itemTotals[cat.id] || 0;
              const diff = round2(cv - pv);
              const yoy = pv > 0 ? diff / pv : null;
              const pct = currS?.total > 0 ? cv / currS.total : 0;
              return `<tr class="tr-hover">
                <td style="font-weight:500"><span class="kpi-dot" style="background:${cat.color}"></span>${esc(cat.name)}</td>
                <td style="text-align:left;color:var(--text-tertiary);font-size:11.5px">${cat.group === 'regular' ? '常规' : '一次性'} · ${cat.bucket === 'fund' ? '公积金' : '现金'}</td>
                <td style="font-weight:500">${fmtMoney(cv, { privacy: p })}</td>
                <td style="color:var(--text-tertiary)">${fmtMoney(pv, { privacy: p })}</td>
                <td style="color:${diff > 0 ? 'var(--green)' : diff < 0 ? 'var(--red)' : 'var(--text-muted)'}">${diff === 0 ? '—' : fmtMoney(diff, { signed: true, privacy: p })}</td>
                <td>${deltaBadgeHtml(yoy)}</td>
                <td style="color:var(--text-secondary)">${fmtPct(pct)}</td>
              </tr>`;
            }).join('')}
            <tr class="tr-highlight">
              <td colspan="2" style="color:var(--blue)">月均收入（含公积金 · 公平对比）</td>
              <td style="color:var(--blue)">${fmtMoney(currS?.monthlyAvg, { privacy: p })}</td>
              <td style="color:var(--text-secondary)">${fmtMoney(prevS?.monthlyAvg, { privacy: p })}</td>
              <td>${currS?.monthlyAvg != null && prevS?.monthlyAvg != null ? fmtMoney(currS.monthlyAvg - prevS.monthlyAvg, { signed: true, privacy: p }) : '—'}</td>
              <td>${deltaBadgeHtml(currS?.monthlyAvgYoY)}</td>
              <td>—</td>
            </tr>
            <tr class="tr-subtotal">
              <td colspan="2" style="color:var(--green)">月均实际到手现金</td>
              <td style="color:var(--green)">${fmtMoney(currS?.cashMonthlyAvg, { privacy: p })}</td>
              <td style="color:var(--text-secondary)">${fmtMoney(prevS?.cashMonthlyAvg, { privacy: p })}</td>
              <td>${currS?.cashMonthlyAvg != null && prevS?.cashMonthlyAvg != null ? fmtMoney(currS.cashMonthlyAvg - prevS.cashMonthlyAvg, { signed: true, privacy: p }) : '—'}</td>
              <td>${deltaBadgeHtml(currS?.cashMonthlyAvgYoY)}</td>
              <td>—</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `;
}

// =========================================================================
// VIEW 4: 年度对比 (Annual)
// =========================================================================
function renderAnnual(analytics) {
  const p = state.privacy;
  const years = analytics.years;
  const balanced = years.every((y) => analytics.yearMap[y]?.sumMatchesMonthly && analytics.yearMap[y]?.cashPlusFundMatchesTotal);

  const comparableYears = years.filter((y) => (analytics.yearMap[y]?.samePeriodItemDiffs?.length || 0) > 0);
  const attribY = comparableYears.includes(state.annualAttribYear) ? state.annualAttribYear : (comparableYears[comparableYears.length - 1] || analytics.latestYear);
  const attribSummary = analytics.yearMap[attribY];
  const attribMonthsCount = attribSummary?.samePeriodMonths?.length || 0;

  return `
    <!-- Header & Audit Pill -->
    <section class="card card-compact" style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:12px">
      <div>
        <div class="card-title">年度对比 · ${years[0]}—${years[years.length - 1]}</div>
        <div class="card-sub">历年汇总、全年预测、同期同比归因分析与到手口径核对</div>
      </div>
      <span class="badge ${balanced ? 'badge-up' : 'badge-down'}" style="padding:5px 12px;font-size:12px">
        ${balanced ? '✓ 自动校验通过：账目平衡' : '⚠ 检测到汇总差异'}
      </span>
    </section>

    <!-- Row 1: Annual Projection (6 cols) + Cash vs Fund (6 cols) -->
    <section class="grid-12">
      <div class="card col-6">
        <div class="card-header">
          <div>
            <div class="card-title">年度总收入与全年预测</div>
            <div class="card-sub">实心为已录入累计，虚线框为按平时月均推算全年</div>
          </div>
        </div>
        ${renderAnnualTotalProjectionSvg(analytics, p)}
      </div>

      <div class="card col-6">
        <div class="card-header">
          <div>
            <div class="card-title">每年实际到手现金 vs 公积金入账</div>
            <div class="card-sub">清晰对比可支配现金流与公积金累计占比</div>
          </div>
          <div class="legend-row">
            <span class="legend-item"><span class="legend-swatch" style="background:#34C759"></span>现金</span>
            <span class="legend-item"><span class="legend-swatch" style="background:#00C7BE"></span>公积金</span>
          </div>
        </div>
        ${renderAnnualCashFundSvg(analytics, p)}
      </div>
    </section>

    <!-- Row 2: CFO Fair Same-Period YoY Attribution -->
    <section class="card">
      <div class="card-header">
        <div>
          <div class="card-title">${attribY}年 vs ${attribY - 1}年 · 同期同比增减归因分析（1–${attribMonthsCount}月）</div>
          <div class="card-sub">精确拆解公平同期净变化 ${fmtMoney(attribSummary?.samePeriodDiff, { prefix: '¥', signed: true, privacy: p })} 的每一项来源贡献</div>
        </div>
        <div style="display:flex;align-items:center;gap:10px">
          ${deltaBadgeHtml(attribSummary?.samePeriodYoY, '同期净变化')}
          ${comparableYears.length > 1 ? `
            <select class="apple-select" id="annual-attrib-year" style="padding:5px 10px;font-size:12.5px">
              ${comparableYears.map((y) => `<option value="${y}" ${y === attribY ? 'selected' : ''}>${y} vs ${y - 1}</option>`).join('')}
            </select>
          ` : ''}
        </div>
      </div>
      ${renderYoYAttributionSvg(attribSummary, attribY - 1, p)}
    </section>

    <!-- Row 3: Unified 3-Way Tabbed Annual Data Table -->
    <section class="card">
      <div class="card-header">
        <div>
          <div class="card-title">年度明细报表</div>
          <div class="card-sub">完整保留原表三张核心年度核对表</div>
        </div>
        <div class="segmented">
          <button class="${state.annualTableTab === 'items' ? 'active' : ''}" data-atab="items">① 各项收入汇总</button>
          <button class="${state.annualTableTab === 'indicators' ? 'active' : ''}" data-atab="indicators">② 关键指标与同期同比</button>
          <button class="${state.annualTableTab === 'cash_fund' ? 'active' : ''}" data-atab="cash_fund">③ 实际到手 vs 公积金</button>
        </div>
      </div>

      ${state.annualTableTab === 'items' ? `
        <div class="table-wrap table-compact">
          <table>
            <thead><tr><th>项目</th>${years.map((y) => `<th>${y}年</th>`).join('')}<th style="color:var(--blue)">累计</th><th>占比</th></tr></thead>
            <tbody>
              <tr class="tr-group"><td colspan="${years.length + 3}">常规月度项目</td></tr>
              ${analytics.regularCategories.map((cat) => {
                const cum = analytics.cumulativeItemTotals[cat.id] || 0;
                return `<tr class="tr-hover">
                  <td style="font-weight:500"><span class="kpi-dot" style="background:${cat.color}"></span>${esc(cat.name)}</td>
                  ${years.map((y) => { const v = analytics.yearMap[y]?.itemTotals[cat.id] || 0; return `<td style="${v === 0 ? 'color:var(--text-muted)' : ''}">${v === 0 ? '—' : fmtMoney(v, { privacy: p })}</td>`; }).join('')}
                  <td style="font-weight:600">${fmtMoney(cum, { privacy: p })}</td>
                  <td style="color:var(--text-tertiary)">${fmtPct(analytics.cumulativeTotal > 0 ? cum / analytics.cumulativeTotal : 0)}</td>
                </tr>`;
              }).join('')}
              <tr class="tr-subtotal">
                <td>常规小计</td>
                ${years.map((y) => `<td>${analytics.yearMap[y]?.regularTotal ? fmtMoney(analytics.yearMap[y].regularTotal, { privacy: p }) : '—'}</td>`).join('')}
                <td style="color:var(--blue)">${fmtMoney(analytics.cumulativeRegular, { privacy: p })}</td>
                <td>${fmtPct(analytics.cumulativeTotal > 0 ? analytics.cumulativeRegular / analytics.cumulativeTotal : 0)}</td>
              </tr>
              <tr class="tr-group"><td colspan="${years.length + 3}">一次性款项（发放当月计入）</td></tr>
              ${analytics.onetimeCategories.map((cat) => {
                const cum = analytics.cumulativeItemTotals[cat.id] || 0;
                return `<tr class="tr-hover">
                  <td style="font-weight:500"><span class="kpi-dot" style="background:${cat.color}"></span>${esc(cat.name)}</td>
                  ${years.map((y) => { const v = analytics.yearMap[y]?.itemTotals[cat.id] || 0; return `<td style="${v === 0 ? 'color:var(--text-muted)' : ''}">${v === 0 ? '—' : fmtMoney(v, { privacy: p })}</td>`; }).join('')}
                  <td style="font-weight:600">${fmtMoney(cum, { privacy: p })}</td>
                  <td style="color:var(--text-tertiary)">${fmtPct(analytics.cumulativeTotal > 0 ? cum / analytics.cumulativeTotal : 0)}</td>
                </tr>`;
              }).join('')}
              <tr class="tr-subtotal">
                <td>一次性小计</td>
                ${years.map((y) => `<td>${analytics.yearMap[y]?.onetimeTotal ? fmtMoney(analytics.yearMap[y].onetimeTotal, { privacy: p }) : '—'}</td>`).join('')}
                <td style="color:var(--amber)">${fmtMoney(analytics.cumulativeOnetime, { privacy: p })}</td>
                <td>${fmtPct(analytics.onetimeRatio)}</td>
              </tr>
              <tr class="tr-highlight">
                <td style="color:var(--blue)">年度合计</td>
                ${years.map((y) => `<td>${analytics.yearMap[y]?.total ? fmtMoney(analytics.yearMap[y].total, { privacy: p }) : '—'}</td>`).join('')}
                <td style="color:var(--blue)">${fmtMoney(analytics.cumulativeTotal, { privacy: p })}</td>
                <td style="color:var(--blue)">100.0%</td>
              </tr>
            </tbody>
          </table>
        </div>
      ` : state.annualTableTab === 'indicators' ? `
        <div class="table-wrap table-compact">
          <table>
            <thead><tr><th>关键指标</th>${years.map((y) => `<th>${y}年</th>`).join('')}<th style="color:var(--blue)">累计 / 总均</th></tr></thead>
            <tbody>
              <tr><td style="color:var(--text-secondary)">已录入月数</td>${years.map((y) => `<td>${analytics.yearMap[y]?.recordedMonths || 0} 个月</td>`).join('')}<td style="font-weight:600">${analytics.totalRecordedCount} 个月</td></tr>
              <tr><td style="font-weight:500">月均收入（年度合计 ÷ 月数）</td>${years.map((y) => `<td style="font-weight:600">${fmtMoney(analytics.yearMap[y]?.monthlyAvg, { privacy: p })}</td>`).join('')}<td style="font-weight:600;color:var(--blue)">${fmtMoney(analytics.overallMonthlyAvg, { privacy: p })}</td></tr>
              <tr><td style="color:var(--text-secondary)">常规月均收入（不含一次性）</td>${years.map((y) => `<td>${fmtMoney(analytics.yearMap[y]?.regularMonthlyAvg, { privacy: p })}</td>`).join('')}<td>${fmtMoney(analytics.overallRegularAvg, { privacy: p })}</td></tr>
              <tr><td style="color:var(--text-secondary)">上年同期合计</td>${years.map((y) => `<td>${fmtMoney(analytics.yearMap[y]?.prevSamePeriodTotal, { privacy: p })}</td>`).join('')}<td>—</td></tr>
              <tr><td style="font-weight:500">同期增减（元）</td>${years.map((y) => { const d = analytics.yearMap[y]?.samePeriodDiff; return `<td style="font-weight:600;color:${d == null ? 'var(--text-muted)' : d >= 0 ? 'var(--green)' : 'var(--red)'}">${d == null ? '—' : fmtMoney(d, { signed: true, privacy: p })}</td>`; }).join('')}<td>—</td></tr>
              <tr><td style="font-weight:500">同期同比（最公平对比）</td>${years.map((y) => `<td>${deltaBadgeHtml(analytics.yearMap[y]?.samePeriodYoY)}</td>`).join('')}<td>—</td></tr>
              <tr><td style="color:var(--text-secondary)">全年合计同比（不足12月仅供参考）</td>${years.map((y) => `<td>${deltaBadgeHtml(analytics.yearMap[y]?.fullYearYoY)}</td>`).join('')}<td>—</td></tr>
              <tr><td style="color:var(--blue);font-weight:500">预计全年总收入（推算）</td>${years.map((y) => `<td style="color:var(--blue);font-weight:500">${fmtMoney(analytics.yearMap[y]?.projectedTotal, { privacy: p })}</td>`).join('')}<td>—</td></tr>
            </tbody>
          </table>
        </div>
      ` : `
        <div class="table-wrap table-compact">
          <table>
            <thead><tr><th>口径</th>${years.map((y) => `<th>${y}年</th>`).join('')}<th style="color:var(--blue)">累计</th><th>占比</th></tr></thead>
            <tbody>
              <tr><td style="color:var(--green);font-weight:500">实际到手现金（不含公积金及结息）</td>${years.map((y) => `<td style="font-weight:600">${analytics.yearMap[y]?.cashTotal ? fmtMoney(analytics.yearMap[y].cashTotal, { privacy: p }) : '—'}</td>`).join('')}<td style="font-weight:600;color:var(--green)">${fmtMoney(analytics.cumulativeCash, { privacy: p })}</td><td>${fmtPct(analytics.cashRatio)}</td></tr>
              <tr><td style="color:var(--teal);font-weight:500">公积金入账合计（月度＋结息）</td>${years.map((y) => `<td style="font-weight:600">${analytics.yearMap[y]?.fundTotal ? fmtMoney(analytics.yearMap[y].fundTotal, { privacy: p }) : '—'}</td>`).join('')}<td style="font-weight:600;color:var(--teal)">${fmtMoney(analytics.cumulativeFund, { privacy: p })}</td><td>${fmtPct(analytics.fundRatio)}</td></tr>
              <tr><td style="color:var(--text-secondary)">实际到手占比（%）</td>${years.map((y) => `<td>${fmtPct(analytics.yearMap[y]?.cashRatio)}</td>`).join('')}<td style="font-weight:600">${fmtPct(analytics.cashRatio)}</td><td>—</td></tr>
              <tr><td style="font-weight:500">月均实际到手（含一次性现金）</td>${years.map((y) => `<td>${fmtMoney(analytics.yearMap[y]?.cashMonthlyAvg, { privacy: p })}</td>`).join('')}<td style="font-weight:600">${fmtMoney(analytics.overallCashAvg, { privacy: p })}</td><td>—</td></tr>
              <tr><td style="color:var(--text-secondary)">平时月均到手（不含一次性、不含公积金）</td>${years.map((y) => `<td>${fmtMoney(analytics.yearMap[y]?.regularCashMonthlyAvg, { privacy: p })}</td>`).join('')}<td>${fmtMoney(analytics.overallRegularCashAvg, { privacy: p })}</td><td>—</td></tr>
              <tr><td style="color:var(--text-secondary)">月均实际到手同比</td>${years.map((y) => `<td>${deltaBadgeHtml(analytics.yearMap[y]?.cashMonthlyAvgYoY)}</td>`).join('')}<td>—</td><td>—</td></tr>
            </tbody>
          </table>
        </div>
      `}
    </section>
  `;
}

// =========================================================================
// VIEW 5: 工资明细 (Ledger)
// =========================================================================
function renderLedger(analytics) {
  const p = state.privacy;
  const all = [...analytics.historicalRecords, ...analytics.computedMonths];
  let rows = state.ledgerYear === 'all' ? all : analytics.computedMonths.filter((m) => m.record.year === state.ledgerYear);
  if (state.ledgerSearch.trim()) {
    const q = state.ledgerSearch.trim().toLowerCase();
    rows = rows.filter((m) => m.label.toLowerCase().includes(q) || (m.record.note || '').toLowerCase().includes(q) || `${m.record.year}年${m.record.month}月`.includes(q));
  }
  const nextPending = analytics.computedMonths.find((m) => !m.hasData);

  const isFull = state.ledgerViewMode === 'full';

  return `
    <section class="card card-compact" style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:12px">
      <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center">
        <button class="pill-btn ${state.ledgerYear === 'all' ? 'primary' : ''}" data-lyear="all">全部</button>
        ${analytics.years.map((y) => `<button class="pill-btn ${state.ledgerYear === y ? 'primary' : ''}" data-lyear="${y}">${y} ${analytics.yearMap[y]?.recordedMonths ? `(${analytics.yearMap[y].recordedMonths})` : ''}</button>`).join('')}
        <button class="pill-btn" data-action="add-year" style="color:var(--blue)">+ 新增年份</button>
      </div>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <div class="segmented">
          <button class="${isFull ? 'active' : ''}" data-lview="full">全部科目明细</button>
          <button class="${!isFull ? 'active' : ''}" data-lview="summary">精简汇总</button>
        </div>
        <input id="ledger-search" class="apple-input" style="width:162px;padding:6px 11px" value="${esc(state.ledgerSearch)}" placeholder="搜索月份或备注..." />
        ${nextPending ? `<button class="pill-btn primary" data-edit="${nextPending.record.id}">✦ 录入 ${nextPending.record.year}.${nextPending.record.month}</button>` : ''}
      </div>
    </section>

    <section class="card" style="padding:0;overflow:hidden">
      ${isFull ? `
        <div style="padding:10px 22px;border-bottom:0.5px solid var(--hairline);display:flex;justify-content:space-between;align-items:center;gap:12px;font-size:11.5px;color:var(--text-tertiary);background:var(--card-subtle)">
          <span>共 ${analytics.categories.length} 个收入科目（常规 ${analytics.regularCategories.length} 项 + 一次性 ${analytics.onetimeCategories.length} 项）· 左右滑动查看全部明细，首尾列已固定</span>
          <span style="flex-shrink:0">点击任意行编辑</span>
        </div>
      ` : ''}
      <div class="table-wrap ${isFull ? 'table-compact' : ''}">
        <table>
          <thead>
            ${isFull ? `
              <tr>
                <th class="sticky-left" style="padding-left:22px;min-width:116px">月份</th>
                ${analytics.regularCategories.map((c) => `<th>${esc(c.name)}</th>`).join('')}
                <th style="font-weight:600;color:var(--text)">常规小计</th>
                ${analytics.onetimeCategories.map((c) => `<th style="color:${ONETIME_GROUP_COLOR}">${esc(c.name)}</th>`).join('')}
                <th style="font-weight:600;color:${ONETIME_GROUP_COLOR}">一次性小计</th>
                <th style="font-weight:600;color:var(--text)">月度合计</th>
                <th style="color:var(--green)">实际到手</th>
                <th style="text-align:left">备注</th>
                <th class="sticky-right" style="padding-right:22px">操作</th>
              </tr>
            ` : `
              <tr>
                <th class="sticky-left" style="padding-left:22px">月份</th>
                <th style="color:var(--text);font-weight:600">月度合计</th>
                <th style="color:var(--green)">实际到手</th>
                <th style="color:var(--teal)">公积金</th>
                <th>常规小计</th>
                <th style="color:${ONETIME_GROUP_COLOR}">一次性小计</th>
                <th style="text-align:left">备注</th>
                <th class="sticky-right" style="padding-right:22px">操作</th>
              </tr>
            `}
          </thead>
          <tbody>
            ${rows.map((m) => {
              const isHist = Boolean(m.record.isHistorical);
              const isPend = !isHist && !m.hasData;
              const rowClass = isHist ? 'tr-hist' : isPend ? 'tr-pending' : 'tr-hover';
              const monthCell = `
                <td class="sticky-left" style="padding-left:22px;font-weight:500;white-space:nowrap">
                  ${isHist ? `${m.record.year} 历史` : `${m.record.year}年${m.record.month}月`}
                  ${isPend ? `<span class="badge" style="background:var(--amber-soft);color:var(--amber);margin-left:5px;font-size:10px">待录入</span>` : ''}
                  ${isHist ? `<span class="badge badge-neutral" style="margin-left:5px;font-size:10px">留存</span>` : ''}
                </td>
              `;

              if (isFull) {
                return `<tr class="${rowClass}" style="cursor:pointer" data-edit="${m.record.id}">
                  ${monthCell}
                  ${analytics.regularCategories.map((c) => {
                    const v = m.record.values?.[c.id];
                    return `<td style="color:${v != null && v !== 0 ? 'var(--text-secondary)' : 'var(--text-muted)'}">${v != null && v !== 0 ? fmtMoney(v, { privacy: p }) : '—'}</td>`;
                  }).join('')}
                  <td style="font-weight:600">${m.hasData ? fmtMoney(m.regularTotal, { privacy: p }) : '—'}</td>
                  ${analytics.onetimeCategories.map((c) => {
                    const v = m.record.values?.[c.id];
                    return `<td style="color:${v != null && v !== 0 ? ONETIME_GROUP_COLOR : 'var(--text-muted)'}">${v != null && v !== 0 ? fmtMoney(v, { privacy: p }) : '—'}</td>`;
                  }).join('')}
                  <td style="font-weight:600;color:${m.hasData && m.onetimeTotal !== 0 ? ONETIME_GROUP_COLOR : 'var(--text-muted)'}">${m.hasData && m.onetimeTotal !== 0 ? fmtMoney(m.onetimeTotal, { privacy: p }) : '—'}</td>
                  <td style="font-weight:600;color:var(--text)">${m.hasData ? fmtMoney(m.total, { privacy: p }) : '—'}</td>
                  <td style="color:var(--green);font-weight:500">${m.hasData ? fmtMoney(m.cashTotal, { privacy: p }) : '—'}</td>
                  <td class="note-cell-wrap" style="color:var(--text-secondary);min-width:220px">${esc(m.record.note || '')}</td>
                  <td class="sticky-right" style="padding-right:22px;color:var(--blue);font-weight:500">编辑</td>
                </tr>`;
              }

              return `<tr class="${rowClass}" style="cursor:pointer" data-edit="${m.record.id}">
                ${monthCell}
                <td style="font-weight:600">${m.hasData ? fmtMoney(m.total, { privacy: p }) : '—'}</td>
                <td style="color:var(--green);font-weight:500">${m.hasData ? fmtMoney(m.cashTotal, { privacy: p }) : '—'}</td>
                <td style="color:var(--teal)">${m.hasData ? fmtMoney(m.fundTotal, { privacy: p }) : '—'}</td>
                <td style="color:var(--text-secondary)">${m.hasData ? fmtMoney(m.regularTotal, { privacy: p }) : '—'}</td>
                <td style="color:${m.hasData && m.onetimeTotal !== 0 ? ONETIME_GROUP_COLOR : 'var(--text-muted)'}">${m.hasData && m.onetimeTotal !== 0 ? fmtMoney(m.onetimeTotal, { privacy: p }) : '—'}</td>
                <td class="note-cell-wrap" style="color:var(--text-secondary)">${esc(m.record.note || '')}</td>
                <td class="sticky-right" style="padding-right:22px;color:var(--blue);font-weight:500">编辑</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

// =========================================================================
// DRAWER & CATEGORY MODAL (100% Preserved)
// =========================================================================
function renderDrawer(analytics) {
  if (!state.editingRecordId) return '';
  const all = [...analytics.historicalRecords, ...analytics.computedMonths];
  const m = all.find((x) => x.record.id === state.editingRecordId);
  if (!m) return '';

  let reg = 0, one = 0, cash = 0, fund = 0;
  for (const cat of analytics.categories) {
    const num = Number((state.draftValues[cat.id] || '').trim());
    if (!Number.isNaN(num) && num !== 0) {
      if (cat.group === 'regular') reg += num; else one += num;
      if (cat.bucket === 'fund') fund += num; else cash += num;
    }
  }
  const total = round2(reg + one);

  let prevRec = null;
  if (!m.record.isHistorical) {
    const idx = analytics.computedMonths.findIndex((x) => x.record.id === m.record.id);
    for (let i = idx - 1; i >= 0; i--) {
      if (analytics.computedMonths[i].hasData) { prevRec = analytics.computedMonths[i]; break; }
    }
  }

  return `
    <div class="overlay" data-overlay="drawer">
      <div class="drawer" onclick="event.stopPropagation()">
        <div class="sheet-header">
          <div>
            <div style="font-size:17px;font-weight:600">${m.record.isHistorical ? `${m.record.year}年 历史记录` : `${m.record.year}年 ${m.record.month}月 工资明细`}</div>
            <div style="font-size:12px;color:var(--text-tertiary);margin-top:2px">保存后所有看板与本地 JSON 文件立即同步</div>
          </div>
          <button class="icon-btn" data-action="close-drawer">✕</button>
        </div>

        <div style="padding:14px 24px;background:var(--card-subtle);border-bottom:0.5px solid var(--hairline);display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px" class="tabular">
          <div><div style="font-size:11px;color:var(--text-tertiary)">月度合计</div><div id="live-total" style="font-size:16px;font-weight:600">¥${fmtMoney(total)}</div></div>
          <div><div style="font-size:11px;color:var(--text-tertiary)">实际到手</div><div id="live-cash" style="font-size:16px;font-weight:600;color:var(--green)">¥${fmtMoney(round2(cash))}</div></div>
          <div><div style="font-size:11px;color:var(--text-tertiary)">公积金入账</div><div id="live-fund" style="font-size:16px;font-weight:600;color:var(--teal)">¥${fmtMoney(round2(fund))}</div></div>
        </div>

        ${prevRec ? `
          <div style="padding:14px 24px 0">
            <button data-action="copy-prev" data-prev-id="${prevRec.record.id}" style="width:100%;padding:10px;border-radius:12px;background:rgba(0,122,255,0.08);border:0.5px solid rgba(0,122,255,0.22);color:var(--blue);font-size:13px;font-weight:500">
              ⎘ 一键沿用上月（${prevRec.record.year}.${prevRec.record.month}）常规项
            </button>
          </div>
        ` : ''}

        <div class="sheet-body">
          <div style="font-size:12.5px;font-weight:600;color:var(--text-secondary);margin-bottom:10px">常规月度项目</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px">
            ${analytics.regularCategories.map((cat) => `
              <div>
                <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
                  <span><span class="kpi-dot" style="background:${cat.color}"></span>${esc(cat.name)}</span>
                  ${cat.bucket === 'fund' ? `<span style="font-size:10px;color:var(--teal)">公积金</span>` : ''}
                </div>
                <input type="number" step="0.01" class="apple-input tabular" style="width:100%;color:var(--blue);font-weight:500" data-cat-input="${cat.id}" value="${esc(state.draftValues[cat.id] ?? '')}" placeholder="0.00" />
              </div>
            `).join('')}
          </div>

          <div style="font-size:12.5px;font-weight:600;color:var(--text-secondary);margin-bottom:10px">一次性款项（发放当月计入）</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px">
            ${analytics.onetimeCategories.map((cat) => `
              <div>
                <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
                  <span><span class="kpi-dot" style="background:${cat.color}"></span>${esc(cat.name)}</span>
                  ${cat.bucket === 'fund' ? `<span style="font-size:10px;color:var(--teal)">公积金</span>` : ''}
                </div>
                <input type="number" step="0.01" class="apple-input tabular" style="width:100%;color:var(--blue);font-weight:500" data-cat-input="${cat.id}" value="${esc(state.draftValues[cat.id] ?? '')}" placeholder="0.00" />
              </div>
            `).join('')}
          </div>

          <div style="font-size:12.5px;font-weight:600;color:var(--text-secondary);margin-bottom:6px">当月备注</div>
          <textarea id="draft-note" rows="3" class="apple-textarea" style="width:100%;resize:none" placeholder="例如：年终奖发放、补发或扣款说明...">${esc(state.draftNote)}</textarea>
        </div>

        <div class="sheet-footer">
          <button class="pill-btn" data-action="clear-draft" style="color:var(--red)">清空本月</button>
          <div style="display:flex;gap:8px">
            <button class="pill-btn" data-action="close-drawer">取消</button>
            <button class="pill-btn primary" data-action="save-draft">保存明细</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderCatModal(analytics) {
  if (!state.showCatModal) return '';
  return `
    <div class="overlay center" data-overlay="cat">
      <div class="modal" onclick="event.stopPropagation()">
        <div class="sheet-header">
          <div>
            <div style="font-size:17px;font-weight:600">自定义收入科目管理</div>
            <div style="font-size:12px;color:var(--text-tertiary);margin-top:2px">新增补贴、奖金或扣款项后，所有报表与录入表单自动同步</div>
          </div>
          <button class="icon-btn" data-action="close-cat">✕</button>
        </div>
        <div style="padding:16px 24px;background:var(--card-subtle);border-bottom:0.5px solid var(--hairline)">
          <div style="display:grid;grid-template-columns:1.2fr 1fr 1fr;gap:8px;margin-bottom:10px">
            <input id="new-cat-name" class="apple-input" placeholder="新科目名（如：餐补）" />
            <select id="new-cat-group" class="apple-select"><option value="regular">常规月度项目</option><option value="onetime">一次性款项</option></select>
            <select id="new-cat-bucket" class="apple-select"><option value="cash">实际到手现金</option><option value="fund">公积金账户</option></select>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;gap:10px">
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              ${APPLE_PALETTE.map((c) => `<button data-pick-color="${c}" style="width:20px;height:20px;border-radius:99px;background:${c};${state.newCatColor === c ? 'outline:2px solid var(--blue);outline-offset:2px' : 'opacity:0.75'}"></button>`).join('')}
            </div>
            <button class="pill-btn primary" data-action="add-cat">+ 添加科目</button>
          </div>
        </div>
        <div class="sheet-body" style="display:flex;flex-direction:column;gap:8px">
          ${analytics.categories.map((c) => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;border-radius:12px;border:0.5px solid var(--hairline)">
              <div style="display:flex;align-items:center;gap:8px">
                <span class="kpi-dot" style="background:${c.color};margin:0"></span>
                <span style="font-weight:500;font-size:13.5px">${esc(c.name)}</span>
                <span class="badge badge-neutral">${c.group === 'regular' ? '常规' : '一次性'}</span>
                <span class="badge ${c.bucket === 'fund' ? 'badge-neutral' : 'badge-up'}">${c.bucket === 'fund' ? '公积金' : '现金'}</span>
              </div>
              ${c.builtIn ? `<span style="font-size:11.5px;color:var(--text-tertiary)">内置</span>` : `<button data-del-cat="${c.id}" style="color:var(--red);font-size:12px;font-weight:500">删除</button>`}
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// =========================================================================
// ROOT RENDER & EVENT BINDINGS
// =========================================================================
function render() {
  document.documentElement.classList.toggle('dark', state.dark);
  const analytics = computeAnalytics(state.store);
  const activeNav = NAV.find((n) => n.id === state.tab) || NAV[0];

  let viewHtml = '';
  if (state.tab === 'overview') viewHtml = renderOverview(analytics);
  else if (state.tab === 'monthly') viewHtml = renderMonthly(analytics);
  else if (state.tab === 'structure') viewHtml = renderStructure(analytics);
  else if (state.tab === 'annual') viewHtml = renderAnnual(analytics);
  else viewHtml = renderLedger(analytics);

  const root = document.getElementById('app');
  root.innerHTML = `
    <div class="shell">
      <aside class="sidebar">
        <div class="brand">
          <img src="/icon.png" alt="个人收入分析" class="brand-logo" />
          <div>
            <div class="brand-title">个人收入分析</div>
            <div class="brand-sub">${analytics.years[0]}—${analytics.years[analytics.years.length - 1]}</div>
          </div>
        </div>
        <div class="nav-section-label">工作台</div>
        <nav class="nav-list">
          ${NAV.map((n) => `<button class="nav-btn ${state.tab === n.id ? 'active' : ''}" data-tab="${n.id}">${ICONS[n.id]}<span>${n.label}</span></button>`).join('')}
        </nav>
        <div class="sidebar-footer">
          <div class="sync-status">
            <span class="sync-dot"></span>
            <span>${state.saveMode === 'saving' ? '正在同步本地 JSON...' : state.saveMode === 'saved' ? '已同步至本地 JSON' : '浏览器本地缓存'}</span>
          </div>
        </div>
      </aside>

      <div class="main-wrap">
        <header class="topbar">
          <div class="topbar-inner">
            <div class="page-title-group">
              <div class="page-title">${activeNav.label}</div>
              <div class="page-sub">更新至 ${analytics.latestRecordedMonth ? `${analytics.latestRecordedMonth.record.year}年${analytics.latestRecordedMonth.record.month}月` : '暂无'} · ${analytics.totalRecordedCount} 个月</div>
            </div>
            <div class="toolbar-actions">
              ${state.tab === 'overview' ? `
                <div class="segmented" style="margin-right:4px">
                  <button class="${state.caliber === 'total' ? 'active' : ''}" data-caliber="total">总收入</button>
                  <button class="${state.caliber === 'cash' ? 'active' : ''}" data-caliber="cash">实际到手</button>
                  <button class="${state.caliber === 'fund' ? 'active' : ''}" data-caliber="fund">公积金</button>
                </div>
              ` : ''}
              <button class="icon-btn ${state.privacy ? 'active-amber' : ''}" data-action="toggle-privacy" title="一键打码隐藏金额">
                ${state.privacy ? ICONS.eyeOff : ICONS.eye}<span>${state.privacy ? '隐私中' : '隐私'}</span>
              </button>
              <button class="icon-btn" data-action="open-cat">${ICONS.sliders}<span>科目</span></button>
              <div class="menu-wrap">
                <button class="icon-btn" data-action="toggle-menu">${ICONS.file}<span>导入/导出</span></button>
                ${state.showDataMenu ? `
                  <div class="menu-pop">
                    <button class="menu-item" data-action="exp-excel">导出 Excel 工作簿 (.xls)</button>
                    <button class="menu-item" data-action="exp-csv">导出 CSV 明细 (.csv)</button>
                    <button class="menu-item" data-action="exp-json">导出 JSON 备份</button>
                    <div class="menu-divider"></div>
                    <button class="menu-item" data-action="imp-file">导入 CSV / JSON</button>
                  </div>
                ` : ''}
                <input id="file-import-input" type="file" accept=".csv,.json" style="display:none" />
              </div>
              <button class="icon-btn" data-action="toggle-dark" title="切换浅色/深色模式">${state.dark ? ICONS.sun : ICONS.moon}</button>
            </div>
          </div>
          <div class="mobile-nav">
            ${NAV.map((n) => `<button class="pill-btn ${state.tab === n.id ? 'primary' : ''}" data-tab="${n.id}">${n.label}</button>`).join('')}
          </div>
        </header>

        <main class="content">
          <div class="container">${viewHtml}</div>
        </main>
      </div>
    </div>
    ${renderDrawer(analytics)}
    ${renderCatModal(analytics)}
    ${state.toast ? `<div class="toast">${esc(state.toast)}</div>` : ''}
  `;

  bindEvents(root, analytics);
  bindChartTooltips(root);
}

function bindEvents(root, analytics) {
  root.querySelectorAll('[data-tab]').forEach((el) => {
    el.addEventListener('click', () => {
      state.tab = el.getAttribute('data-tab');
      state.showDataMenu = false;
      window.scrollTo({ top: 0, behavior: 'instant' });
      render();
    });
  });
  root.querySelectorAll('[data-caliber]').forEach((el) => {
    el.addEventListener('click', () => { state.caliber = el.getAttribute('data-caliber'); render(); });
  });
  root.querySelectorAll('[data-hscope]').forEach((el) => {
    el.addEventListener('click', () => { state.heroScope = el.getAttribute('data-hscope'); render(); });
  });
  root.querySelectorAll('[data-tstudio]').forEach((el) => {
    el.addEventListener('click', () => { state.trendStudioTab = el.getAttribute('data-tstudio'); render(); });
  });
  root.querySelectorAll('[data-oline]').forEach((el) => {
    el.addEventListener('click', () => { state.overviewLineMode = el.getAttribute('data-oline'); render(); });
  });
  root.querySelectorAll('[data-mmode]').forEach((el) => {
    el.addEventListener('click', () => { state.monthlyMode = el.getAttribute('data-mmode'); render(); });
  });
  root.querySelectorAll('[data-mdetail]').forEach((el) => {
    el.addEventListener('click', () => { state.monthlyDetailTab = el.getAttribute('data-mdetail'); render(); });
  });
  root.querySelectorAll('[data-atab]').forEach((el) => {
    el.addEventListener('click', () => { state.annualTableTab = el.getAttribute('data-atab'); render(); });
  });
  root.querySelectorAll('[data-cat-chip]').forEach((el) => {
    el.addEventListener('click', () => { state.selectedCategoryId = el.getAttribute('data-cat-chip'); render(); });
  });
  root.querySelectorAll('[data-lyear]').forEach((el) => {
    el.addEventListener('click', () => {
      const v = el.getAttribute('data-lyear');
      state.ledgerYear = v === 'all' ? 'all' : Number(v);
      render();
    });
  });
  root.querySelectorAll('[data-lview]').forEach((el) => {
    el.addEventListener('click', () => {
      state.ledgerViewMode = el.getAttribute('data-lview');
      render();
    });
  });
  root.querySelectorAll('[data-jump]').forEach((el) => {
    el.addEventListener('click', () => {
      const id = el.getAttribute('data-jump');
      if (!id) return;
      state.tab = 'ledger';
      const rec = state.store.records.find((r) => r.id === id);
      if (rec && !rec.isHistorical) state.ledgerYear = rec.year;
      openMonthEditor(id, analytics);
    });
  });
  root.querySelectorAll('[data-edit]').forEach((el) => {
    el.addEventListener('click', () => openMonthEditor(el.getAttribute('data-edit'), analytics));
  });

  const mSel = root.querySelector('#monthly-year-select');
  if (mSel) mSel.addEventListener('change', (e) => { state.monthlyCompareYear = Number(e.target.value); render(); });
  const sSel = root.querySelector('#structure-year-select');
  if (sSel) sSel.addEventListener('change', (e) => { state.structureYear = Number(e.target.value); render(); });
  const aSel = root.querySelector('#annual-attrib-year');
  if (aSel) aSel.addEventListener('change', (e) => { state.annualAttribYear = Number(e.target.value); render(); });
  const lSearch = root.querySelector('#ledger-search');
  if (lSearch) {
    lSearch.addEventListener('input', (e) => {
      state.ledgerSearch = e.target.value;
      render();
      const el = document.getElementById('ledger-search');
      if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
    });
  }

  root.querySelectorAll('[data-action]').forEach((el) => {
    el.addEventListener('click', () => {
      const act = el.getAttribute('data-action');
      if (act === 'toggle-privacy') { state.privacy = !state.privacy; render(); }
      else if (act === 'toggle-dark') { state.dark = !state.dark; render(); }
      else if (act === 'toggle-menu') { state.showDataMenu = !state.showDataMenu; render(); }
      else if (act === 'open-cat') { state.showCatModal = true; state.showDataMenu = false; render(); }
      else if (act === 'close-cat') { state.showCatModal = false; render(); }
      else if (act === 'close-drawer') { state.editingRecordId = null; render(); }
      else if (act === 'edit-goal') { state.editingGoal = true; render(); }
      else if (act === 'cancel-goal') { state.editingGoal = false; render(); }
      else if (act === 'save-goal') {
        const t = Number(document.getElementById('goal-total-input')?.value);
        const c = Number(document.getElementById('goal-cash-input')?.value);
        state.editingGoal = false;
        persist({
          ...state.store,
          goals: { ...state.store.goals, [analytics.latestYear]: { totalTarget: t > 0 ? t : undefined, cashTarget: c > 0 ? c : undefined } },
        }, `已更新 ${analytics.latestYear} 年度目标`);
      }
      else if (act === 'add-year') {
        const ny = state.store.settings.endYear + 1;
        const added = [];
        for (let m = 1; m <= 12; m++) {
          const id = makeMonthId(ny, m);
          if (!state.store.records.some((r) => r.id === id)) added.push({ id, year: ny, month: m, values: {}, note: '' });
        }
        state.ledgerYear = ny;
        persist({ ...state.store, records: [...state.store.records, ...added], settings: { ...state.store.settings, endYear: ny } }, `已新增 ${ny} 年`);
      }
      else if (act === 'copy-prev') {
        const pid = el.getAttribute('data-prev-id');
        const prev = state.store.records.find((r) => r.id === pid);
        if (prev) {
          for (const cat of analytics.regularCategories) {
            const v = prev.values?.[cat.id];
            if (v !== null && v !== undefined) state.draftValues[cat.id] = String(v);
          }
          showToast(`已沿用 ${prev.year}年${prev.month}月 常规项`);
        }
      }
      else if (act === 'clear-draft') {
        for (const cat of analytics.categories) state.draftValues[cat.id] = '';
        state.draftNote = '';
        render();
      }
      else if (act === 'save-draft') {
        const rec = state.store.records.find((r) => r.id === state.editingRecordId);
        if (rec) {
          const values = {};
          for (const cat of analytics.categories) {
            const raw = (state.draftValues[cat.id] || '').trim();
            values[cat.id] = raw === '' ? null : round2(Number(raw));
          }
          const updated = { ...rec, values, note: (state.draftNote || '').trim() };
          state.editingRecordId = null;
          persist({ ...state.store, records: state.store.records.map((r) => (r.id === updated.id ? updated : r)) }, `已保存 ${updated.year}年${updated.month ? `${updated.month}月` : '历史'}明细`);
        }
      }
      else if (act === 'add-cat') {
        const name = (document.getElementById('new-cat-name')?.value || '').trim();
        const group = document.getElementById('new-cat-group')?.value || 'regular';
        const bucket = document.getElementById('new-cat-bucket')?.value || 'cash';
        if (!name) return;
        const maxOrder = state.store.categories.reduce((m, c) => Math.max(m, c.order), 0);
        const cat = { id: `custom_${Date.now()}`, name, group, bucket, color: state.newCatColor, order: maxOrder + 1, builtIn: false };
        persist({ ...state.store, categories: [...state.store.categories, cat] }, `已新增科目「${name}」`);
      }
      else if (act === 'exp-excel') { state.showDataMenu = false; exportToExcel(state.store, analytics); showToast('已导出多工作表 Excel 文件'); }
      else if (act === 'exp-csv') { state.showDataMenu = false; exportToCsv(analytics); showToast('已导出 CSV 明细'); }
      else if (act === 'exp-json') { state.showDataMenu = false; exportToJson(state.store); showToast('已导出 JSON 备份'); }
      else if (act === 'imp-file') { document.getElementById('file-import-input')?.click(); }
    });
  });

  // Live drawer input sync
  root.querySelectorAll('[data-cat-input]').forEach((inp) => {
    inp.addEventListener('input', (e) => {
      state.draftValues[inp.getAttribute('data-cat-input')] = e.target.value;
      let reg = 0, one = 0, cash = 0, fund = 0;
      for (const cat of analytics.categories) {
        const n = Number((state.draftValues[cat.id] || '').trim());
        if (!Number.isNaN(n) && n !== 0) {
          if (cat.group === 'regular') reg += n; else one += n;
          if (cat.bucket === 'fund') fund += n; else cash += n;
        }
      }
      const lt = document.getElementById('live-total');
      const lc = document.getElementById('live-cash');
      const lf = document.getElementById('live-fund');
      if (lt) lt.textContent = `¥${fmtMoney(round2(reg + one))}`;
      if (lc) lc.textContent = `¥${fmtMoney(round2(cash))}`;
      if (lf) lf.textContent = `¥${fmtMoney(round2(fund))}`;
    });
  });
  const noteEl = root.querySelector('#draft-note');
  if (noteEl) noteEl.addEventListener('input', (e) => { state.draftNote = e.target.value; });

  root.querySelectorAll('[data-pick-color]').forEach((el) => {
    el.addEventListener('click', () => { state.newCatColor = el.getAttribute('data-pick-color'); render(); });
  });
  root.querySelectorAll('[data-del-cat]').forEach((el) => {
    el.addEventListener('click', () => {
      const id = el.getAttribute('data-del-cat');
      const target = state.store.categories.find((c) => c.id === id);
      if (!target || target.builtIn) return;
      persist({ ...state.store, categories: state.store.categories.filter((c) => c.id !== id) }, `已删除科目「${target.name}」`);
    });
  });
  root.querySelectorAll('[data-overlay]').forEach((el) => {
    el.addEventListener('click', () => {
      const o = el.getAttribute('data-overlay');
      if (o === 'drawer') state.editingRecordId = null;
      if (o === 'cat') state.showCatModal = false;
      render();
    });
  });

  const fileInp = root.querySelector('#file-import-input');
  if (fileInp) {
    fileInp.addEventListener('change', async (e) => {
      const f = e.target.files?.[0];
      if (!f) return;
      try {
        const { data, count } = await importFromFile(f, state.store);
        state.showDataMenu = false;
        await persist(data, `成功导入 ${count} 条记录`);
      } catch (err) {
        showToast(err?.message || '导入失败');
      }
    });
  }
}

async function init() {
  const { data, source } = await loadStoreData();
  state.store = data;
  state.saveMode = source === 'file' || source === 'seed' ? 'saved' : 'local';
  const a = computeAnalytics(data);
  state.monthlyCompareYear = a.latestYear;
  state.structureYear = a.latestYear;
  state.annualAttribYear = a.latestYear;
  state.ledgerYear = a.latestYear;
  state.selectedCategoryId = a.categories[0]?.id || 'salary';
  render();
}

init();
