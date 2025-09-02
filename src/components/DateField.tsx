import React, { useState, useEffect } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { Entry } from './ResumeBuilder';

interface DateFieldProps {
  entry: Entry;
  onCommit: (val: string) => void;
  previewMode: boolean;
  isMobile: boolean;
  allowPresent?: boolean;
  label?: string;
}

export const DateField: React.FC<DateFieldProps> = ({ entry, onCommit, previewMode, isMobile, allowPresent, label }) => {
  const [open, setOpen] = useState(false);
  const parse = (raw: string): { month: string; year: string; present: boolean } => {
    const t = (raw || '').trim();
    if (!t) return { month: '', year: '', present: false };
    if (/^present$/i.test(t)) return { month: '', year: '', present: true };
    const m = t.match(/^(\d{1,2})[/-](\d{4})$/);
    if (m) return { month: m[1].padStart(2,'0'), year: m[2], present: false };
    return { month: '', year: '', present: false };
  };
  const initial = parse(entry.content);
  const [month, setMonth] = useState(initial.month);
  const [year, setYear] = useState(initial.year);
  const [present, setPresent] = useState(initial.present);
  useEffect(() => {
    if (!open) {
      const p = parse(entry.content);
      setMonth(p.month); setYear(p.year); setPresent(p.present);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry.content]);
  const format = () => present ? 'Present' : (month && year ? `${month}/${year}` : '');
  if (previewMode) {
    const text = entry.content || '';
    return text ? <span>{text}</span> : null;
  }
  const years: number[] = []; const currentYear = new Date().getFullYear();
  for (let y = currentYear + 1; y >= 1980; y--) years.push(y);
  const body = (
    <div className="space-y-3">
      {allowPresent && (
        <div className="flex items-center gap-2">
          <Checkbox
            id={`present-${entry.id}`}
            checked={present}
            onCheckedChange={(c)=>{ const val = !!c; setPresent(val); if (val){ setMonth(''); setYear(''); } }}
          />
          <Label htmlFor={`present-${entry.id}`} className="text-[11px]">Present</Label>
        </div>
      )}
      {!present && (
        <div className="flex gap-2">
          <div className="flex flex-col flex-1 min-w-[4.5rem]">
            <Label className="text-[10px] uppercase tracking-wide mb-1">Month</Label>
            <select
              value={month}
              onChange={(e)=>setMonth(e.target.value)}
              className="h-8 text-xs border rounded px-1 bg-background"
            >
              <option value="">MM</option>
              {Array.from({length:12},(_,i)=>i+1).map(m=>{
                const v = String(m).padStart(2,'0');
                return <option key={v} value={v}>{v}</option>;
              })}
            </select>
          </div>
          <div className="flex flex-col flex-1 min-w-[4.5rem]">
            <Label className="text-[10px] uppercase tracking-wide mb-1">Year</Label>
            <select
              value={year}
              onChange={(e)=>setYear(e.target.value)}
              className="h-8 text-xs border rounded px-1 bg-background"
            >
              <option value="">YYYY</option>
              {years.map(y=> <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      )}
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px]" onClick={()=>{ setMonth(''); setYear(''); setPresent(false); onCommit(''); setOpen(false); }}>Clear</Button>
        <Button size="sm" className="h-7 px-3 text-[11px]" onClick={()=>{ onCommit(format()); setOpen(false); }}>Done</Button>
      </div>
    </div>
  );
  const display = entry.content ? entry.content : (label ? `${label}` : 'MM/YYYY');
  return isMobile ? (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="px-1 py-0.5 rounded-sm hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >{display}</button>
      </SheetTrigger>
      <SheetContent side="bottom" className="p-4">
        <SheetHeader>
          <SheetTitle>Select Date</SheetTitle>
        </SheetHeader>
        <div className="mt-4">{body}</div>
      </SheetContent>
    </Sheet>
  ) : (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="px-1 py-0.5 rounded-sm hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >{display}</button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        {body}
      </PopoverContent>
    </Popover>
  );
};

export default DateField;
