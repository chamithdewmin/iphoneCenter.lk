import React, { useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const ReportPreviewModal = ({ open, onOpenChange, html, filename, reportTitle }) => {
  const iframeRef = useRef(null);

  useEffect(() => {
    if (!open || !iframeRef.current || !html) return;
    const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(html);
    doc.close();
  }, [open, html]);

  const handlePrint = () => {
    if (!iframeRef.current) return;
    const win = iframeRef.current.contentWindow;
    if (win && win.print) {
      win.focus();
      win.print();
    }
  };

  const handleDownload = () => {
    // Browsers let users "Save as PDF" from the print dialog.
    handlePrint();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{reportTitle || 'Report Preview'}</DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-between mb-3 gap-3">
          <p className="text-xs text-muted-foreground truncate">
            {filename}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              Print / Save as PDF
            </Button>
            <Button size="sm" onClick={handleDownload}>
              Download PDF
            </Button>
          </div>
        </div>
        <div className="flex-1 border rounded-md overflow-hidden bg-background">
          <iframe
            ref={iframeRef}
            title="Report preview"
            className="w-full h-full bg-background"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportPreviewModal;

