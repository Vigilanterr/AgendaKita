export type TableColumn = {
  key: string;
  header: string;
  align?: "left" | "right";
  className?: string;
};

export default function Table({
  columns,
  children,
  caption,
}: {
  columns: TableColumn[];
  children: React.ReactNode;
  caption?: string;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-rule bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[38rem] text-left text-sm">
          {caption && (
            <caption className="sr-only">{caption}</caption>
          )}
          <thead>
            <tr className="border-b border-rule bg-surface-2">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-ink-3 ${
                    column.align === "right" ? "text-right" : "text-left"
                  } ${column.className ?? ""}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-rule">{children}</tbody>
        </table>
      </div>
    </div>
  );
}

export function TableRow({
  columns,
  children,
}: {
  columns: TableColumn[];
  children: React.ReactNode[];
}) {
  return (
    <tr className="transition-colors hover:bg-surface-2/60">
      {columns.map((column, index) => (
        <td
          key={column.key}
          className={`px-4 py-3 align-middle ${
            column.align === "right" ? "text-right" : "text-left"
          } ${column.className ?? ""}`}
        >
          {children[index]}
        </td>
      ))}
    </tr>
  );
}
