export const SAVE_KEY = 'z-outpost-v2';
export const COLORS = { lime: '#d7ff70', lilac: '#c9aeff', peach: '#ffbd8a' };
export const STATIONS = [
  { id: 'z-peak', name: 'z-peak', role: 'LEAD', title: 'Set the direction', x: 244, y: 244, color: 'lilac', number: '01' },
  { id: 'z-current', name: 'z-current', role: 'PM', title: 'Shape the plan', x: 626, y: 244, color: 'lime', number: '02' },
  { id: 'z-timber', name: 'z-timber', role: 'DEV', title: 'Build the product', x: 268, y: 442, color: 'peach', number: '03' },
  { id: 'z-lens', name: 'z-lens', role: 'REVIEWER', title: 'Review and launch', x: 680, y: 442, color: 'lilac', number: '04' },
];
export function freshState() { return { version: 2, stage: 0, minutes: 25, color: 'lime', sparks: [], circuit: [1, 0, 3], launched: false, sound: false }; }
export function loadState(storage) {
  try {
    const value = JSON.parse(storage.getItem(SAVE_KEY));
    if (!value || value.version !== 2) return freshState();
    const stage = Number.isInteger(value.stage) && value.stage >= 0 && value.stage <= 4 ? value.stage : 0;
    return { ...freshState(), stage, minutes: [5, 15, 25].includes(value.minutes) ? value.minutes : 25,
      color: Object.hasOwn(COLORS, value.color) ? value.color : 'lime',
      sparks: Array.isArray(value.sparks) ? [...new Set(value.sparks.filter(n => Number.isInteger(n) && n >= 0 && n < 6))] : [],
      circuit: Array.isArray(value.circuit) && value.circuit.length === 3 && value.circuit.every(n => Number.isInteger(n) && n >= 0 && n <= 3) ? value.circuit : [1, 0, 3],
      launched: stage === 4, sound: value.sound === true };
  } catch { return freshState(); }
}
export function saveState(storage, state) { try { storage.setItem(SAVE_KEY, JSON.stringify(state)); } catch { /* The experience also works without browser storage. */ } }
export function advance(state, station) {
  if (state.stage !== station || station < 0 || station > 3) return false;
  if (station === 2 && !circuitReady(state.circuit)) return false;
  state.stage++;
  state.launched = state.stage === 4;
  return true;
}
export function circuitReady(rotations) { return rotations.length === 3 && rotations.every(n => n % 2 === 0); }
