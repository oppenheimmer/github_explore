"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, ClipboardPaste } from "lucide-react";

interface FileImportProps {
  onImport: (lines: string[]) => void;
  placeholder?: string;
  accept?: string;
  label?: string;
}

export default function FileImport({
  onImport,
  placeholder = "Paste lines here (one per line)…",
  accept = ".txt,.csv",
  label = "Import",
}: FileImportProps) {
  const [text, setText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const parseAndEmit = useCallback(
    (raw: string) => {
      const lines = raw
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      if (lines.length > 0) onImport(lines);
    },
    [onImport]
  );

  const handleFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const content = reader.result as string;
        setText(content);
        parseAndEmit(content);
      };
      reader.readAsText(file);
      e.target.value = "";
    },
    [parseAndEmit]
  );

  const handlePaste = () => {
    parseAndEmit(text);
  };

  return (
    <div className="space-y-2">
      <textarea
        className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={handlePaste} disabled={!text.trim()}>
          <ClipboardPaste className="h-3.5 w-3.5 mr-1" />
          {label}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept={accept}
          onChange={handleFile}
          className="hidden"
        />
        <Button
          size="sm"
          variant="outline"
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="h-3.5 w-3.5 mr-1" />
          Upload File
        </Button>
      </div>
    </div>
  );
}
