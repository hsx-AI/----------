import { reactive, watch } from 'vue';
import { devices, notices, orders, attendanceIssues, handovers, TODAY } from '../data/seed';
import type { Device, Notice, WorkOrder, AttendanceIssue, Handover } from '../data/seed';
const KEY = 'hydro-platform-v1';
interface State {
  devices: Device[];
  notices: Notice[];
  orders: WorkOrder[];
  issues: AttendanceIssue[];
  handovers: Handover[];
  schedules: Record<string, string>;
  applications: Record<string, string>[];
  settings: { company: string; owner: string; compact: boolean };
  version: number;
}
const initial = (): State => ({
  devices: structuredClone(devices),
  notices: structuredClone(notices),
  orders: structuredClone(orders),
  issues: structuredClone(attendanceIssues),
  handovers: structuredClone(handovers),
  schedules: {},
  applications: [],
  settings: { company: '水电分厂', owner: '张建国', compact: false },
  version: 1,
});
let saved: State | undefined;
try {
  const parsed = JSON.parse(localStorage.getItem(KEY) || 'null');
  if (
    parsed?.version === 1 &&
    Array.isArray(parsed.devices) &&
    Array.isArray(parsed.orders) &&
    parsed.settings
  )
    saved = parsed;
} catch {
  /* Fall back to demo records when browser storage is unavailable. */
}
export const state = reactive<State>(saved || initial());
export const ui = reactive({ toast: '', toastKind: 'success', persistenceError: false });
let timer: ReturnType<typeof setTimeout>;
export function toast(message: string, kind = 'success') {
  ui.toast = message;
  ui.toastKind = kind;
  clearTimeout(timer);
  timer = setTimeout(() => (ui.toast = ''), 3800);
}
watch(
  state,
  () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      ui.persistenceError = false;
    } catch {
      ui.persistenceError = true;
      toast('浏览器存储空间不足，本次修改仅在当前页面保留', 'error');
    }
  },
  { deep: true },
);
export function resetDemo() {
  Object.assign(state, initial());
  toast('演示数据已恢复');
}
export function now() {
  const d = new Date();
  return d.toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' }).slice(0, 16);
}
export function downloadCsv(filename: string, headers: string[], rows: unknown[][]) {
  const escape = (v: unknown) =>
    '"' +
    String(v ?? '')
      .replace(/^[=+@\-]/, "'$&")
      .replaceAll('"', '""') +
    '"';
  const blob = new Blob(
    ['\uFEFF' + [headers, ...rows].map((r) => r.map(escape).join(',')).join('\r\n')],
    { type: 'text/csv;charset=utf-8;' },
  );
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
export function orderLog(order: WorkOrder, text: string) {
  order.logs.unshift({ time: now(), text });
}
export function nextOrderId() {
  let n =
    state.orders
      .filter((o) => o.id.startsWith('AD-20261022-'))
      .reduce((max, o) => Math.max(max, Number(o.id.split('-').at(-1)) || 0), 0) + 1;
  return `AD-${TODAY.replaceAll('-', '')}-${String(n).padStart(3, '0')}`;
}
