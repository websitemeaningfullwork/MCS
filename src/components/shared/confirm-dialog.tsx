"use client";

import { useCallback, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type ConfirmOptions = {
  title: string;
  /** Spell out what happens — especially whether the action can be undone. */
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Destructive actions get the red confirm button. Defaults to `true`. */
  destructive?: boolean;
};

/**
 * Presentational confirmation dialog. Prefer {@link useConfirm}, which wires
 * this up with a promise-based API that reads like the native `confirm()` it
 * replaces.
 */
export function ConfirmDialog({
  open,
  options,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  options: ConfirmOptions | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const {
    title = "Are you sure?",
    description = "This action cannot be undone.",
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    destructive = true,
  } = options ?? {};

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <DialogContent showCloseButton={false} className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            onClick={onConfirm}
            autoFocus
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Promise-based replacement for `window.confirm()`.
 *
 * ```tsx
 * const { confirm, confirmDialog } = useConfirm();
 * // …
 * if (!(await confirm({ title: "Delete?", description: "…" }))) return;
 * // …
 * return <>{rows}{confirmDialog}</>;
 * ```
 */
export function useConfirm() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const settle = useCallback((value: boolean) => {
    const resolve = resolveRef.current;
    resolveRef.current = null;
    setOptions(null);
    resolve?.(value);
  }, []);

  const confirm = useCallback((next: ConfirmOptions) => {
    // A second request while one is still open cancels the first.
    resolveRef.current?.(false);
    resolveRef.current = null;
    setOptions(next);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const confirmDialog = (
    <ConfirmDialog
      open={options !== null}
      options={options}
      onConfirm={() => settle(true)}
      onCancel={() => settle(false)}
    />
  );

  return { confirm, confirmDialog };
}
