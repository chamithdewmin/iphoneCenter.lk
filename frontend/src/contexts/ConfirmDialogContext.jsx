import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const ConfirmDialogContext = createContext(null);

export function ConfirmDialogProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('Confirm');
  const [message, setMessage] = useState('');
  const resolverRef = useRef(null);

  const closeWithValue = useCallback((value) => {
    setOpen(false);
    if (resolverRef.current) {
      resolverRef.current(value);
      resolverRef.current = null;
    }
  }, []);

  const confirm = useCallback(
    (nextMessage, options = {}) => {
      const nextTitle = options.title || 'Confirm';
      const nextMessageStr = String(nextMessage ?? '');

      return new Promise((resolve) => {
        resolverRef.current = resolve;
        setTitle(nextTitle);
        setMessage(nextMessageStr);
        setOpen(true);
      });
    },
    []
  );

  const contextValue = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmDialogContext.Provider value={contextValue}>
      {children}

      <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && closeWithValue(false)}>
        <DialogContent className="max-w-md">
          <DialogTitle className="text-base">{title}</DialogTitle>
          <div className="text-sm text-muted-foreground whitespace-pre-wrap mt-1">{message}</div>

          <div className="flex items-center justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => closeWithValue(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => closeWithValue(true)}>
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirmDialog() {
  const ctx = useContext(ConfirmDialogContext);
  if (!ctx) throw new Error('useConfirmDialog must be used within ConfirmDialogProvider');
  return ctx;
}

