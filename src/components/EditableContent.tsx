import React, { useRef, useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface EditableContentProps {
  content: string;
  onChange: (content: string) => void;
  previewMode: boolean;
  type?: "text" | "html";
  className?: string;
  placeholder?: string;
  maxLength?: number;
  rich?: boolean; // enable rich text toolbar and sanitization (only for html)
}

export const EditableContent: React.FC<EditableContentProps> = ({
  content,
  onChange,
  previewMode,
  type = "text",
  className = "",
  placeholder = "Click to edit...",
  maxLength,
  rich = false,
}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const lastHtmlRef = useRef<string>(content);
  const [selStates, setSelStates] = useState<{bold:boolean;italic:boolean;underline:boolean;ul:boolean;ol:boolean}>({bold:false,italic:false,underline:false,ul:false,ol:false});

  const getPlainText = useCallback((html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || '';
  }, []);

  const sanitizeHtml = useCallback((html: string) => {
    // allow only a, b, strong, i, em, u, ul, ol, li, br
    const allowed = new Set(['B','STRONG','I','EM','U','UL','OL','LI','BR']);
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    const walker = document.createTreeWalker(wrapper, NodeFilter.SHOW_ELEMENT, null);
    const toRemove: Element[] = [];
    while (walker.nextNode()) {
      const el = walker.currentNode as Element;
      if (!allowed.has(el.tagName)) {
        // unwrap element (replace with its children)
        if (el.parentNode) {
          while (el.firstChild) el.parentNode.insertBefore(el.firstChild, el);
          toRemove.push(el);
        }
      } else {
        // strip attributes
        [...el.attributes].forEach(attr => el.removeAttribute(attr.name));
      }
    }
    toRemove.forEach(n => n.remove());
    return wrapper.innerHTML
      .replace(/<br><br>/g,'<br>')
      .trim();
  }, []);

  // Cleaning specifically for pasted HTML when we want to retain only basic formatting
  const cleanPastedHtml = useCallback((html: string) => {
    if (!html) return '';
    const allowed = new Set(['B','STRONG','I','EM','U','UL','OL','LI','BR']);
    const unwrapInsteadOfRemove = new Set(['P','DIV','SPAN']); // structural containers we flatten
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    // Remove obviously unsafe / unwanted nodes first
    wrapper.querySelectorAll('script,style,meta,link,iframe,object,embed,svg,canvas,video,audio,picture,source,track,hr,form,fieldset,legend,button,input,textarea,select,option,table,thead,tbody,tfoot,tr,th,td,img').forEach(n => n.remove());

    const walker = document.createTreeWalker(wrapper, NodeFilter.SHOW_ELEMENT, null);
    const toRemove: Element[] = [];
    while (walker.nextNode()) {
      const el = walker.currentNode as Element;
      if (allowed.has(el.tagName)) {
        // strip all attributes
        [...el.attributes].forEach(a => el.removeAttribute(a.name));
      } else if (unwrapInsteadOfRemove.has(el.tagName)) {
        // Convert block boundaries to <br> if needed
        if (el.tagName === 'P' || el.tagName === 'DIV') {
          // ensure a break before if previous sibling is not a line break and this is not first
          if (el.previousSibling && el.firstChild) {
            const br = document.createElement('br');
            el.parentNode?.insertBefore(br, el);
          }
        }
        while (el.firstChild) el.parentNode?.insertBefore(el.firstChild, el);
        toRemove.push(el);
      } else {
        // remove entirely for anything else
        toRemove.push(el);
      }
    }
    toRemove.forEach(n => n.remove());
    let out = wrapper.innerHTML;
    // Normalize multiple breaks
    out = out
      .replace(/<(?:br)\s*\/?>\s*(?:<br\s*\/?>\s*)+/gi,'<br>')
      .replace(/\u00A0/g,' ')
      .trim();
    return out;
  }, []);

  // only update when content changes externally
  useEffect(() => {
    if (!elementRef.current || previewMode) return;
    const el = elementRef.current;
    if (
      (type === "html" && el.innerHTML !== content) ||
      (type === "text" && el.textContent !== content)
    ) {
      // If focused and selection inside the element, preserve caret offset across the update
      const sel = typeof window !== 'undefined' ? window.getSelection?.() : null;
      const selectionInside = sel && sel.rangeCount > 0 && el.contains(sel.anchorNode);

      const getCaretOffset = (container: HTMLElement) => {
        try {
          const selection = window.getSelection();
          if (!selection || selection.rangeCount === 0) return 0;
          const range = selection.getRangeAt(0).cloneRange();
          const preRange = range.cloneRange();
          preRange.selectNodeContents(container);
          preRange.setEnd(range.endContainer, range.endOffset);
          return preRange.toString().length;
        } catch { return 0; }
      };

      const setCaretOffset = (container: HTMLElement, chars: number) => {
        try {
          const range = document.createRange();
          range.selectNodeContents(container);
          let node: Node | null = container;
          let remaining = chars;

          const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
          while (walker.nextNode()) {
            const t = walker.currentNode as Text;
            if (t.nodeValue) {
              if (t.nodeValue.length >= remaining) {
                range.setStart(t, remaining);
                range.collapse(true);
                const sel = window.getSelection();
                sel?.removeAllRanges();
                sel?.addRange(range);
                return true;
              } else {
                remaining -= t.nodeValue.length;
              }
            }
          }
          // Fallback: place at end
          range.selectNodeContents(container);
          range.collapse(false);
          const sel = window.getSelection();
          sel?.removeAllRanges();
          sel?.addRange(range);
          return true;
        } catch { return false; }
      };

      const prevOffset = selectionInside ? getCaretOffset(el) : 0;

      // assign new content
      el.innerHTML = type === "html" ? content : content || "";
      lastHtmlRef.current = el.innerHTML;

      // restore caret if we captured it
      if (selectionInside) {
        // clamp offset to new content length
        const newPlain = el.textContent || '';
        const clamped = Math.min(prevOffset, newPlain.length);
        setCaretOffset(el, clamped);
      }
    }
  }, [content, type, previewMode]);

  // selection state updater for toolbar
  useEffect(() => {
    if (!rich || previewMode) return;
    const handler = () => {
      const el = elementRef.current;
      if (!el) return;
      const sel = document.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      if (!el.contains(sel.anchorNode)) return;
      try {
        setSelStates({
          bold: document.queryCommandState('bold'),
          italic: document.queryCommandState('italic'),
          underline: document.queryCommandState('underline'),
          ul: document.queryCommandState('insertUnorderedList'),
          ol: document.queryCommandState('insertOrderedList'),
        });
      } catch { /* ignore */ }
    };
    document.addEventListener('selectionchange', handler);
    return () => document.removeEventListener('selectionchange', handler);
  }, [rich, previewMode]);

  const handleInput = () => {
    if (!elementRef.current) return;
    let newContent = type === "html" ? elementRef.current.innerHTML : (elementRef.current.textContent || "");
    if (rich && type === 'html') {
      newContent = sanitizeHtml(newContent);
      elementRef.current.innerHTML = newContent; // reassign sanitized
    }
    // enforce maxLength on plain text length (for both modes if provided)
    if (maxLength) {
      const plain = type === 'html' ? getPlainText(newContent) : newContent;
      if (plain.length > maxLength) {
        // Truncate instead of reverting so paste/typing feels responsive.
        if (type === 'html') {
          const truncateHtml = (html: string, limit: number) => {
            const wrapper = document.createElement('div');
            wrapper.innerHTML = html;
            let remaining = limit;
            const walker = document.createTreeWalker(wrapper, NodeFilter.SHOW_TEXT, null);
            let overLimitNode: Text | null = null;
            while (walker.nextNode()) {
              const node = walker.currentNode as Text;
              const len = node.data.length;
              if (remaining === 0) { // already full -> everything that follows removed
                overLimitNode = node;
                break;
              }
              if (len <= remaining) {
                remaining -= len;
              } else { // truncate this node only, keep existing part
                node.data = node.data.slice(0, remaining);
                remaining = 0;
              }
            }
            if (remaining === 0) {
              // remove everything after the last kept/truncated node
              // Find reference node (last kept text node)
              const refWalker = document.createTreeWalker(wrapper, NodeFilter.SHOW_TEXT, null);
              let consumed = 0;
              let refNode: Text | null = null;
              while (refWalker.nextNode()) {
                const n = refWalker.currentNode as Text;
                consumed += n.data.length;
                if (consumed >= limit) { refNode = n; break; }
              }
              if (refNode) {
                // Remove following siblings of refNode and its ancestors
                const prune = (start: Node | null) => {
                  let current: Node | null = start;
                  while (current && current !== wrapper) {
                    let sib = current.nextSibling;
                    while (sib) { const toRemove = sib; sib = sib.nextSibling; toRemove.parentNode?.removeChild(toRemove); }
                    current = current.parentNode;
                  }
                };
                prune(refNode);
              }
            }
            return wrapper.innerHTML;
          };
          const truncated = truncateHtml(newContent, maxLength);
            if (truncated !== newContent) {
              newContent = truncated;
              elementRef.current.innerHTML = newContent;
            }
        } else {
          const sliced = newContent.slice(0, maxLength);
          if (sliced !== newContent) {
            newContent = sliced;
            elementRef.current.textContent = newContent;
          }
        }
      }
    }
    if (newContent !== content) {
      lastHtmlRef.current = newContent;
      onChange(newContent);
    }
    const isEmpty = (type === 'html' ? getPlainText(newContent) : newContent).trim().length === 0;
    elementRef.current.setAttribute('data-empty', isEmpty ? 'true' : 'false');
    // If empty ensure caret at start (avoid phantom position after placeholder/ghost text)
    if (isEmpty && elementRef.current.isConnected && document.activeElement === elementRef.current) {
      const el = elementRef.current;
      const range = document.createRange();
      range.setStart(el, 0);
      range.collapse(true);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!rich && e.key === "Enter" && type === "text") {
      e.preventDefault();
      elementRef.current?.blur();
    }
  };

  // Paste handler: retain basic inline + list formatting for HTML; plain text for text mode.
  const handlePaste = (e: React.ClipboardEvent) => {
    if (!elementRef.current) return;
    e.preventDefault();
    // Remaining characters allowed (plain text count)
    const remaining = (() => {
      if (!maxLength) return Number.MAX_SAFE_INTEGER;
      const currentPlain = type === 'html' ? getPlainText(elementRef.current!.innerHTML) : (elementRef.current!.textContent || '');
      return Math.max(0, maxLength - currentPlain.length);
    })();

    if (remaining === 0) {
      // Nothing more allowed; ignore paste entirely.
      return;
    }

    if (type === 'html') {
      const html = e.clipboardData.getData('text/html');
      const text = e.clipboardData.getData('text/plain');
      let cleaned = '';
      if (html) cleaned = cleanPastedHtml(html);
      if (!cleaned) {
        cleaned = (text || '')
          .replace(/\r\n?|\n/g,'\n')
          .split('\n')
          .map(l => l.replace(/\s+/g,' ').trim())
          .filter(l => l.length > 0)
          .join('<br>');
      }
      // Truncate cleaned HTML by plain text length to remaining
      const truncateFragment = (fragmentHtml: string, limit: number) => {
        const frag = document.createElement('div');
        frag.innerHTML = fragmentHtml;
        let left = limit;
        const walker = document.createTreeWalker(frag, NodeFilter.SHOW_TEXT, null);
        while (walker.nextNode()) {
          const node = walker.currentNode as Text;
          if (left === 0) { // remove this and everything after
            const removeAfter = (n: Node) => {
              let sib = n.nextSibling;
              while (sib) { const r = sib; sib = sib.nextSibling; r.parentNode?.removeChild(r); }
              if (n.parentNode && n.parentNode !== frag) removeAfter(n.parentNode);
            };
            removeAfter(node);
            node.parentNode?.removeChild(node);
            break;
          }
            const len = node.data.length;
            if (len <= left) {
              left -= len;
            } else {
              node.data = node.data.slice(0, left);
              left = 0;
            }
        }
        return frag.innerHTML;
      };
      const limitedHtml = truncateFragment(cleaned, remaining);
      if (limitedHtml.length) document.execCommand('insertHTML', false, limitedHtml);
    } else {
      const text = (e.clipboardData.getData('text/plain') || '').replace(/\r\n?|\n/g,'\n');
      const toInsert = text.slice(0, remaining);
      if (toInsert.length) document.execCommand('insertText', false, toInsert);
    }
  };

  const exec = (command: string) => {
    if (!elementRef.current) return;
    elementRef.current.focus();
    try {
      document.execCommand(command, false);
      handleInput();
      // force selection state update
      setSelStates({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        ul: document.queryCommandState('insertUnorderedList'),
        ol: document.queryCommandState('insertOrderedList'),
      });
    } catch { /* noop */ }
  };

  if (previewMode) {
    return type === "html" ? (
      <div className={cn("", className)} dangerouslySetInnerHTML={{ __html: content }} />
    ) : (
      <div className={cn("", className)}>{content}</div>
    );
  }

  const editor = (
    <div
      ref={elementRef}
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      dir="ltr"
      className={cn(
        "editable-content outline-none min-h-[1.2rem] focus:outline-dashed focus:outline-2 focus:outline-primary/50 focus:bg-primary/5 hover:bg-muted/50 transition-all duration-200 rounded-sm px-1 py-0.5",
        rich && type === 'html' && 'whitespace-pre-wrap break-words',
        className
      )}
      data-placeholder={placeholder}
    />
  );

  if (!rich || type !== 'html') return editor;

  return (
    <div className="relative group">
      <div
        className="hidden group-focus-within:flex gap-1 mb-0 group-focus-within:mb-1 opacity-100 text-[11px] select-none transition-all pointer-events-none group-focus-within:pointer-events-auto"
        data-toolbar
      >
        <button type="button" onClick={()=>exec('bold')} className={cn("px-1.5 py-0.5 rounded border text-xs", selStates.bold ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/70')}>B</button>
        <button type="button" onClick={()=>exec('italic')} className={cn("px-1.5 py-0.5 rounded border text-xs italic", selStates.italic ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/70')}>I</button>
        <button type="button" onClick={()=>exec('underline')} className={cn("px-1.5 py-0.5 rounded border text-xs underline", selStates.underline ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/70')}>U</button>
        <button type="button" onClick={()=>exec('insertUnorderedList')} className={cn("px-1.5 py-0.5 rounded border text-xs", selStates.ul ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/70')}>• List</button>
        <button type="button" onClick={()=>exec('insertOrderedList')} className={cn("px-1.5 py-0.5 rounded border text-xs", selStates.ol ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/70')}>1. List</button>
      </div>
      {editor}
    </div>
  );
};