"use client";
import React from "react";
import { Button } from "./button";
import { Icon } from "./icons";
import { tryShareText, downloadBlob } from "@/lib/export";
import { useToast } from "./toast";

export function ShareButton({ title, text, filename, content, mime = "text/plain" }: { title: string; text: string; filename?: string; content?: string; mime?: string }) {
  const { toast } = useToast();
  const handle = async () => {
    if (content && filename) {
      const blob = new Blob([content], { type: mime });
      // Try Web Share with file
      // @ts-ignore
      if (navigator.canShare && navigator.canShare({ files: [new File([blob], filename, { type: mime })] })) {
        try {
          // @ts-ignore
          await navigator.share({ files: [new File([blob], filename, { type: mime })], title, text });
          toast("Shared", "success");
          return;
        } catch {}
      }
      if (navigator.share) {
        try { await navigator.share({ title, text, url: location.href }); toast("Shared", "success"); return; } catch {}
      }
      // Fallback download
      downloadBlob(blob, filename, mime);
      toast("Downloaded — share from files", "success");
      return;
    }
    if (tryShareText(title, text)) {
      toast("Shared / copied", "success");
      return;
    }
    // fallback copy
    try { await navigator.clipboard.writeText(`${title}\n${text}`); toast("Copied to clipboard", "success"); } catch { toast("Share not supported", "error"); }
  };
  return (
    <Button variant="secondary" size="sm" onClick={handle} aria-label={`Share ${title}`}>
      <Icon name="share" size={16} /> <span className="ml-1.5">Share</span>
    </Button>
  );
}
