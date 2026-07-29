export const STATUS_CLASS = {
  Drafting: 'es-pill',
  'Pending Counselor Review': 'es-pill es-pill-warn',
  Final: 'es-pill es-pill-good',
};

export function statusClass(status) {
  return STATUS_CLASS[status] || 'es-pill';
}

export default statusClass;
