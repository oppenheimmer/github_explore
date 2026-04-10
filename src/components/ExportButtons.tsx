"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { exportToCSV, exportToJSON } from "@/lib/export";

interface ExportButtonsProps<T extends Record<string, unknown>> {
  data: T[];
  filenamePrefix: string;
  disabled?: boolean;
}

export default function ExportButtons<T extends Record<string, unknown>>({
  data,
  filenamePrefix,
  disabled,
}: ExportButtonsProps<T>) {
  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={disabled || data.length === 0}
        onClick={() => exportToCSV(data, `${filenamePrefix}.csv`)}
      >
        <Download className="h-3.5 w-3.5 mr-1" />
        CSV
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={disabled || data.length === 0}
        onClick={() => exportToJSON(data, `${filenamePrefix}.json`)}
      >
        <Download className="h-3.5 w-3.5 mr-1" />
        JSON
      </Button>
    </div>
  );
}
