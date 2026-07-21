"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link2,
  Link2Off,
  Highlighter,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Lightweight rich-text editor for the class Overview tab. Uses a contentEditable
 * surface + document.execCommand (deprecated but universally supported in current
 * browsers — fine for an internal admin tool, and keeps the bundle dependency-free).
 * Emits sanitized-ish HTML via onChange; the parent debounces the persistence.
 *
 * The parent should mount this with `key={classId}` so switching classes reloads
 * fresh content without fighting React over the contentEditable DOM.
 */
export function RichTextEditor({
  initialHtml,
  onChange,
  placeholder = "What will students learn in this class?",
}: {
  initialHtml: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [words, setWords] = useState(0);
  const [empty, setEmpty] = useState(!initialHtml.trim());

  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = initialHtml || "";
      recompute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function recompute() {
    const el = ref.current;
    if (!el) return;
    const text = el.textContent ?? "";
    setWords(text.trim() ? text.trim().split(/\s+/).length : 0);
    setEmpty(!text.trim() && !el.querySelector("img, li"));
  }

  function emit() {
    if (!ref.current) return;
    recompute();
    onChange(ref.current.innerHTML);
  }

  function exec(command: string, value?: string) {
    ref.current?.focus();
    document.execCommand(command, false, value);
    emit();
  }

  function addLink() {
    const url = window.prompt("Link URL", "https://");
    if (!url) return;
    exec("createLink", url);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-secondary/40 p-1.5">
        <select
          aria-label="Text style"
          className="mr-1 h-8 rounded-md border border-border bg-card px-2 text-xs text-foreground"
          onChange={(e) => {
            exec("formatBlock", e.target.value);
            e.target.selectedIndex = 0;
          }}
          defaultValue="p"
        >
          <option value="p">Paragraph</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>
        <ToolbarButton label="Bold" onClick={() => exec("bold")}>
          <Bold className="size-4" />
        </ToolbarButton>
        <ToolbarButton label="Italic" onClick={() => exec("italic")}>
          <Italic className="size-4" />
        </ToolbarButton>
        <ToolbarButton label="Underline" onClick={() => exec("underline")}>
          <Underline className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Highlight"
          onClick={() => exec("hiliteColor", "#fef08a")}
        >
          <Highlighter className="size-4" />
        </ToolbarButton>
        <Divider />
        <ToolbarButton label="Bullet list" onClick={() => exec("insertUnorderedList")}>
          <List className="size-4" />
        </ToolbarButton>
        <ToolbarButton label="Numbered list" onClick={() => exec("insertOrderedList")}>
          <ListOrdered className="size-4" />
        </ToolbarButton>
        <Divider />
        <ToolbarButton label="Align left" onClick={() => exec("justifyLeft")}>
          <AlignLeft className="size-4" />
        </ToolbarButton>
        <ToolbarButton label="Align center" onClick={() => exec("justifyCenter")}>
          <AlignCenter className="size-4" />
        </ToolbarButton>
        <ToolbarButton label="Align right" onClick={() => exec("justifyRight")}>
          <AlignRight className="size-4" />
        </ToolbarButton>
        <Divider />
        <ToolbarButton label="Insert link" onClick={addLink}>
          <Link2 className="size-4" />
        </ToolbarButton>
        <ToolbarButton label="Remove link" onClick={() => exec("unlink")}>
          <Link2Off className="size-4" />
        </ToolbarButton>
      </div>

      <div className="relative">
        {empty ? (
          <p className="pointer-events-none absolute left-4 top-3 text-sm text-muted-foreground">
            {placeholder}
          </p>
        ) : null}
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          onInput={emit}
          onBlur={emit}
          className={cn(
            "prose prose-sm dark:prose-invert max-w-none min-h-40 px-4 py-3 text-sm text-foreground outline-none",
            "[&_h2]:mt-2 [&_h2]:text-lg [&_h3]:text-base [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5",
          )}
        />
      </div>

      <div className="flex justify-end border-t border-border px-3 py-1.5 text-xs text-muted-foreground">
        {words} {words === 1 ? "word" : "words"}
      </div>
    </div>
  );
}

function ToolbarButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      // onMouseDown preventDefault keeps the editor selection while clicking.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-border" aria-hidden />;
}
