export function exportCsv(filename, rows) {
  if (!rows.length) return;
  const columns = Object.keys(rows[0]);
  const csv = [columns.join(','), ...rows.map((row) => columns.map((column) => JSON.stringify(row[column] ?? '')).join(','))].join('\n');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function printReport() { window.print(); }
