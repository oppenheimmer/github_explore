function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeCSVField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string
) {
  if (data.length === 0) return;
  const keys = Object.keys(data[0]);
  const header = keys.map(escapeCSVField).join(",");
  const rows = data.map((row) =>
    keys
      .map((k) => {
        const val = row[k];
        if (val === null || val === undefined) return "";
        if (Array.isArray(val)) return escapeCSVField(val.join("; "));
        return escapeCSVField(String(val));
      })
      .join(",")
  );
  const csv = [header, ...rows].join("\n");
  downloadBlob(csv, filename, "text/csv;charset=utf-8;");
}

export function exportToJSON<T>(data: T[], filename: string) {
  const json = JSON.stringify(data, null, 2);
  downloadBlob(json, filename, "application/json");
}
