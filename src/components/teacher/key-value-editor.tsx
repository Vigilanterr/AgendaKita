"use client";

import { Input } from "@/components/ui/field";

export type DetailRow = {
  key: string;
  value: string;
};

export default function KeyValueEditor({
  rows,
  onChange,
  disabled,
}: {
  rows: DetailRow[];
  onChange: (rows: DetailRow[]) => void;
  disabled?: boolean;
}) {
  const update = (index: number, patch: Partial<DetailRow>) => {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  return (
    <div className="space-y-2">
      {rows.length === 0 && (
        <p className="rounded-md border border-dashed border-rule px-3 py-4 text-center text-xs text-ink-3">
          Belum ada ketentuan tambahan. Tambahkan bila perlu.
        </p>
      )}

      {rows.map((row, index) => (
        <div
          key={index}
          className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)_auto]"
        >
          <Input
            value={row.key}
            disabled={disabled}
            onChange={(event) => update(index, { key: event.target.value })}
            placeholder="Nama detail"
            aria-label={`Nama detail baris ${index + 1}`}
            maxLength={60}
          />
          <Input
            value={row.value}
            disabled={disabled}
            onChange={(event) => update(index, { value: event.target.value })}
            placeholder="Isi detail"
            aria-label={`Isi detail baris ${index + 1}`}
            maxLength={400}
          />
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange(rows.filter((_, i) => i !== index))}
            aria-label={`Hapus detail baris ${index + 1}`}
            className="h-10 rounded-md border border-rule px-3 text-xs font-medium text-ink-3 transition-colors hover:border-danger/30 hover:text-danger disabled:opacity-50"
          >
            Hapus
          </button>
        </div>
      ))}

      <button
        type="button"
        disabled={disabled || rows.length >= 12}
        onClick={() => onChange([...rows, { key: "", value: "" }])}
        className="text-xs font-medium text-accent underline-offset-2 transition-colors hover:underline disabled:text-ink-3 disabled:no-underline"
      >
        + Tambah detail
      </button>
    </div>
  );
}
