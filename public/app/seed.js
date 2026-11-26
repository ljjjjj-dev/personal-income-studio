export const ONETIME_GROUP_COLOR = '#F28482';
export const PRIMARY_BLUE = '#4A90E2';
export const CASH_GREEN = '#52C498';
export const FUND_TEAL = '#4ECDC4';

export const DEFAULT_CATEGORIES = [
  { id: 'salary', name: '基本工资', group: 'regular', bucket: 'cash', color: '#4A90E2', order: 1, builtIn: true },
  { id: 'duty', name: '岗位津贴', group: 'regular', bucket: 'cash', color: '#8086E8', order: 2, builtIn: true },
  { id: 'overtime', name: '加班费', group: 'regular', bucket: 'cash', color: '#B18CEB', order: 3, builtIn: true },
  { id: 'transport', name: '交通补贴', group: 'regular', bucket: 'cash', color: '#56C2E6', order: 4, builtIn: true },
  { id: 'housing', name: '住房补贴', group: 'regular', bucket: 'cash', color: '#F6B26B', order: 5, builtIn: true },
  { id: 'performance', name: '绩效奖金', group: 'regular', bucket: 'cash', color: '#52C498', order: 6, builtIn: true },
  { id: 'fund', name: '公积金', group: 'regular', bucket: 'fund', color: '#4ECDC4', order: 7, builtIn: true },
  { id: 'allowance', name: '专项津贴', group: 'regular', bucket: 'cash', color: '#F3D060', order: 8, builtIn: true },
  { id: 'bonus_eval', name: '年度考核奖', group: 'onetime', bucket: 'cash', color: '#F28482', order: 9, builtIn: true },
  { id: 'bonus_once', name: '项目激励奖', group: 'onetime', bucket: 'cash', color: '#F08AB4', order: 10, builtIn: true },
  { id: 'leave_pay', name: '未休假补贴', group: 'onetime', bucket: 'cash', color: '#C9A984', order: 11, builtIn: true },
  { id: 'salary_adj', name: '调薪补发', group: 'onetime', bucket: 'cash', color: '#63B8C8', order: 12, builtIn: true },
  { id: 'fund_interest', name: '公积金结息', group: 'onetime', bucket: 'fund', color: '#7DD3FC', order: 13, builtIn: true },
];

export const APPLE_PALETTE = [
  '#4A90E2', '#52C498', '#F6B26B', '#B18CEB', '#4ECDC4', '#F08AB4',
  '#8086E8', '#F28482', '#56C2E6', '#63B8C8', '#C9A984', '#F3D060',
];

export function makeMonthId(year, month) {
  return `${year}-${month < 10 ? `0${month}` : month}`;
}

// 虚拟演示数据（仅供首次启动预览图表，可在界面直接编辑或导入自己的数据）
const DEMO_SEED = [
  {
    id: '2024-hist', year: 2024, month: 0, label: '历史期初', isHistorical: true,
    values: { salary: 6200, transport: 400, housing: 1200, performance: 2400, fund: 2200 },
    note: '示例历史合并记录，仅作存档展示，不参与 2025—2030 年度同比。',
  },
  { id: '2025-01', year: 2025, month: 1, values: { salary: 5800, duty: 800, overtime: 650, transport: 400, housing: 1200, performance: 2600, fund: 2400, bonus_eval: 3600, salary_adj: 800 }, note: '示例：上年度考核奖与调薪补发' },
  { id: '2025-02', year: 2025, month: 2, values: { salary: 5800, duty: 800, overtime: 420, transport: 400, housing: 1200, performance: 2600, fund: 2400 }, note: '' },
  { id: '2025-03', year: 2025, month: 3, values: { salary: 5800, duty: 800, overtime: 780, transport: 400, housing: 1200, performance: 2600, fund: 2400 }, note: '' },
  { id: '2025-04', year: 2025, month: 4, values: { salary: 5800, duty: 800, overtime: 560, transport: 400, housing: 1200, performance: 2600, fund: 2400 }, note: '' },
  { id: '2025-05', year: 2025, month: 5, values: { salary: 5800, duty: 800, overtime: 610, transport: 400, housing: 1200, performance: 2600, fund: 2400 }, note: '' },
  { id: '2025-06', year: 2025, month: 6, values: { salary: 5800, duty: 800, overtime: 520, transport: 400, housing: 1200, performance: 2600, fund: 2400, fund_interest: 320 }, note: '示例：年度公积金结息' },
  { id: '2025-07', year: 2025, month: 7, values: { salary: 6000, duty: 800, overtime: 740, transport: 400, housing: 1200, performance: 2800, fund: 2600 }, note: '示例：年度基数微调' },
  { id: '2025-08', year: 2025, month: 8, values: { salary: 6000, duty: 800, overtime: 490, transport: 400, housing: 1200, performance: 2800, fund: 2600 }, note: '' },
  { id: '2025-09', year: 2025, month: 9, values: { salary: 6000, duty: 800, overtime: 680, transport: 400, housing: 1200, performance: 2800, fund: 2600, bonus_once: 1500 }, note: '示例：阶段性项目激励' },
  { id: '2025-10', year: 2025, month: 10, values: { salary: 6000, duty: 800, overtime: 530, transport: 400, housing: 1200, performance: 2800, fund: 2600 }, note: '' },
  { id: '2025-11', year: 2025, month: 11, values: { salary: 6000, duty: 800, overtime: 620, transport: 400, housing: 1200, performance: 2800, fund: 2600 }, note: '' },
  { id: '2025-12', year: 2025, month: 12, values: { salary: 6000, duty: 800, overtime: 710, transport: 400, housing: 1200, performance: 2800, fund: 2600, allowance: 500 }, note: '示例：新增专项津贴' },
  { id: '2026-01', year: 2026, month: 1, values: { salary: 6400, duty: 900, overtime: 580, transport: 450, housing: 1300, performance: 3000, fund: 2800, allowance: 500 }, note: '' },
  { id: '2026-02', year: 2026, month: 2, values: { salary: 6400, duty: 900, overtime: 460, transport: 450, housing: 1300, performance: 3000, fund: 2800, allowance: 500, bonus_eval: 12000, bonus_once: 2400, leave_pay: 600 }, note: '示例：年终考核奖 / 项目激励 / 未休假补贴' },
  { id: '2026-03', year: 2026, month: 3, values: { salary: 6400, duty: 900, overtime: 820, transport: 450, housing: 1300, performance: 3000, fund: 2800, allowance: 500 }, note: '' },
  { id: '2026-04', year: 2026, month: 4, values: { salary: 6400, duty: 900, overtime: 640, transport: 450, housing: 1300, performance: 3000, fund: 2800, allowance: 500 }, note: '' },
  { id: '2026-05', year: 2026, month: 5, values: { salary: 6400, duty: 900, overtime: 700, transport: 450, housing: 1300, performance: 3000, fund: 2800, allowance: 500 }, note: '' },
  { id: '2026-06', year: 2026, month: 6, values: { salary: 6400, duty: 900, overtime: 540, transport: 450, housing: 1300, performance: 3000, fund: 2800, allowance: 500, fund_interest: 480 }, note: '示例：年度公积金结息' },
  { id: '2026-07', year: 2026, month: 7, values: { salary: 6800, duty: 900, overtime: 760, transport: 450, housing: 1300, performance: 3200, fund: 3000, allowance: 500 }, note: '示例：职级晋升调薪' },
  { id: '2026-08', year: 2026, month: 8, values: { salary: 6800, duty: 900, overtime: 610, transport: 450, housing: 1300, performance: 3200, fund: 3000, allowance: 500 }, note: '' },
  { id: '2026-09', year: 2026, month: 9, values: { salary: 6800, duty: 900, overtime: 830, transport: 450, housing: 1300, performance: 3200, fund: 3000, allowance: 500 }, note: '' },
  { id: '2026-10', year: 2026, month: 10, values: { salary: 6800, duty: 900, overtime: 590, transport: 450, housing: 1300, performance: 3200, fund: 3000, allowance: 500 }, note: '' },
];

export function createSeedData() {
  const map = new Map(DEMO_SEED.map((r) => [r.id, r]));
  const records = [map.get('2024-hist')];
  for (let year = 2025; year <= 2030; year++) {
    for (let month = 1; month <= 12; month++) {
      const id = makeMonthId(year, month);
      records.push(map.get(id) || { id, year, month, values: {}, note: '' });
    }
  }
  return {
    version: 6,
    updatedAt: new Date().toISOString(),
    categories: DEFAULT_CATEGORIES,
    records,
    goals: { 2026: { totalTarget: 210000, cashTarget: 170000 } },
    settings: { startYear: 2025, endYear: 2030 },
  };
}
