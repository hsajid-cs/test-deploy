// Consolidated Education section component (was in EducationSectionBody.tsx)
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Eye, EyeOff } from 'lucide-react';
import { EditableContent } from '../EditableContent';
import { DateField } from '../DateField';
import { SectionConfirm } from './SectionConfirm';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import type { Section, Entry } from '../ResumeBuilder';
import { degreeOptions, institutionOptions } from '@/data/educationOptions';

interface ComboFieldProps {
	entry: Entry;
	previewMode: boolean;
	suggestions: string[];
	placeholder: string;
	className?: string;
	onCommit: (val: string) => void;
}

const ComboField: React.FC<ComboFieldProps> = ({ entry, previewMode, suggestions, placeholder, className, onCommit }) => {
	const [open, setOpen] = useState(false);
	const [value, setValue] = useState(entry.content);
	const [query, setQuery] = useState('');
	useEffect(()=>{ setValue(entry.content); }, [entry.content]);
	if (previewMode) {
		// In preview mode, suppress placeholder text when the field is empty
		return entry.content ? <span className={className}>{entry.content}</span> : null;
	}
	const filtered = suggestions.filter(s => s.toLowerCase().includes(query.toLowerCase())).slice(0,8);
	return (
		<div className={`relative ${className || ''}`}> 
			<input
				value={value}
				placeholder={placeholder}
				onChange={e=>{ setValue(e.target.value); setQuery(e.target.value); setOpen(true); onCommit(e.target.value); }}
				onFocus={()=>{ setQuery(value); setOpen(true); }}
				onBlur={()=>{ // slight delay to allow click
					setTimeout(()=> setOpen(false), 120);
				}}
				className="bg-transparent border-b border-transparent hover:border-muted focus:border-primary focus:outline-none text-sm px-0 py-0.5 min-w-[8ch]"
				list={undefined}
			/>
			{open && filtered.length > 0 && (
				<div className="absolute z-20 mt-1 w-56 max-h-60 overflow-auto rounded-md border bg-popover text-popover-foreground shadow focus:outline-none text-xs">
					<ul>
						{filtered.map(opt => (
							<li key={opt}>
								<button
									type="button"
									className="w-full text-left px-2 py-1.5 hover:bg-accent hover:text-accent-foreground"
									onMouseDown={(e)=>{ e.preventDefault(); setValue(opt); onCommit(opt); setOpen(false); }}
								>{opt}</button>
							</li>
						))}
						{!filtered.includes(value) && value && (
							<li className="px-2 py-1.5 text-muted-foreground italic text-[11px]">Custom: {value}</li>
						)}
					</ul>
				</div>
			)}
		</div>
	);
};

interface EducationSectionBodyProps {
	section: Section;
	previewMode: boolean;
	onUpdateEntry: (sectionId: string, entryId: string, content: string) => void;
	deleteGroup: (prefix: string) => void;
	onToggleEntryVisibility: (sectionId: string, groupId: string) => void;
	onReorderEntries: (sectionId: string, order: string[], isGrouped: boolean) => void;
}

export const EducationSectionBody: React.FC<EducationSectionBodyProps> = ({ section, previewMode, onUpdateEntry, deleteGroup, onToggleEntryVisibility, onReorderEntries }) => {
	const isMobile = useIsMobile();
	const DESC_CHAR_LIMIT = 350; // character limit for description fields
	const [gpaStates, setGpaStates] = useState<Record<string, { mode: 'gpa' | 'marks' | 'percentage'; obtained: string; outOf: string; hidden?: boolean }>>({});

	function parseContent(content: string): { mode: 'gpa' | 'marks' | 'percentage'; obtained: string; outOf: string; hidden?: boolean } {
		const raw = content.trim();
		if (!raw) return { mode: 'gpa', obtained: '', outOf: '' };
		if (raw === '__HIDDEN__') return { mode: 'gpa', obtained: '', outOf: '', hidden: true };
		if (/^\d+(?:\.\d+)?%$/.test(raw)) {
			return { mode: 'percentage', obtained: raw.replace(/%$/, ''), outOf: '' };
		}
		const cleaned = raw.replace(/^(CGPA|GPA|Marks|Percentage)[:\s]*/i, '');
		const parts = cleaned.split(/\//).map(s => s.trim());
		if (parts.length === 2) {
			const [a, b] = parts;
			const mode: 'gpa' | 'marks' = (parseFloat(b) <= 5 || parseFloat(a) <= 5) ? 'gpa' : 'marks';
			return { mode, obtained: a, outOf: b };
		}
		return { mode: 'gpa', obtained: cleaned, outOf: '' };
	}

	function buildContent(state: { mode: 'gpa' | 'marks' | 'percentage'; obtained: string; outOf: string; hidden?: boolean }): string {
		if (state.hidden) return '__HIDDEN__';
		if (state.mode === 'percentage') {
			return state.obtained ? `Percentage: ${state.obtained}%` : '';
		}
		const label = state.mode === 'gpa' ? 'CGPA' : 'Marks';
		if (state.obtained && state.outOf) return `${label}: ${state.obtained}/${state.outOf}`;
		return state.obtained ? `${label}: ${state.obtained}` : '';
	}

	const setStateForGroup = (groupId: string, updater: (prev: { mode: 'gpa' | 'marks' | 'percentage'; obtained: string; outOf: string }) => { mode: 'gpa' | 'marks' | 'percentage'; obtained: string; outOf: string }) => {
		setGpaStates(prev => {
			const current = prev[groupId] || { mode: 'gpa', obtained: '', outOf: '' };
			const next = updater(current);
			return { ...prev, [groupId]: next };
		});
	};

	const groups: Record<string, Partial<Record<string, Entry>>> = {};
	section.entries.forEach(e => {
		const m = e.id.match(/^(edu\d+)-(degree|institution|start|end|gpa|desc)$/);
		if (m) {
			const key = m[1]; const field = m[2];
			(groups[key] ||= {})[field] = e;
		}
	});
	 const handleDragStart = (e: React.DragEvent<HTMLDivElement>, groupId: string) => { if (previewMode) return; e.dataTransfer.setData('text/plain', groupId); };
	 const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { if (!previewMode) e.preventDefault(); };
	 const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
	   if (previewMode) return; e.preventDefault();
	   const sourceId = e.dataTransfer.getData('text/plain'); if (!sourceId || sourceId===targetId) return;
	   const order = Object.keys(groups).sort();
	   const from = order.indexOf(sourceId); const to = order.indexOf(targetId);
	   if (from===-1 || to===-1) return;
	   const newOrder = [...order]; const [m] = newOrder.splice(from,1); newOrder.splice(to,0,m);
	   onReorderEntries(section.id, newOrder, true);
	 };

	return (
		<div className="space-y-5">
			{Object.keys(groups).sort().map(groupId => {
				const g = groups[groupId]; if (!g) return null; const hasDesc = g.desc && g.desc.content.trim().length > 0; const first = g.degree || g.institution || g.start || g.end || g.gpa || g.desc; const hidden = first?.visible === false; if (previewMode && hidden) return null;
				return (
					<div
						key={groupId}
						className={`education-item relative group ${hidden && !previewMode ? 'opacity-40' : ''} ${!previewMode ? 'cursor-grab' : ''}`}
						draggable={!previewMode}
						onDragStart={e=>handleDragStart(e, groupId)}
						onDragOver={handleDragOver}
						onDrop={e=>handleDrop(e, groupId)}
						onPointerDown={()=>{ if (!previewMode) (window as any)._eduDrag = groupId; }}
						onPointerUp={()=>{ if (!previewMode && (window as any)._eduDrag && (window as any)._eduDrag !== groupId) { const order = Object.keys(groups).sort(); const from = order.indexOf((window as any)._eduDrag); const to = order.indexOf(groupId); if (from>-1 && to>-1) { const newOrder=[...order]; const [m]=newOrder.splice(from,1); newOrder.splice(to,0,m); onReorderEntries(section.id,newOrder,true);} } (window as any)._eduDrag=null; }}
					>
						{!previewMode && (
							<div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100">
								<SectionConfirm
									title="Delete education entry?"
									description="This will remove this education group."
									onConfirm={() => deleteGroup(groupId)}
								>
									<Button variant="ghost" size="sm" className="w-6 h-6 p-0" title="Delete Education Entry">
										<Trash2 className="w-3 h-3" />
									</Button>
								</SectionConfirm>
								<Button variant="ghost" size="sm" className="w-6 h-6 p-0" onClick={()=>onToggleEntryVisibility(section.id, groupId)} title={hidden ? 'Show' : 'Hide'}>
									{hidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
								</Button>
							</div>
						)}
						{/* Drag handle removed; entire education item is draggable */}
						<div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
							{g.degree && (
								<ComboField
									entry={g.degree}
									previewMode={previewMode}
									suggestions={degreeOptions}
									placeholder="Degree"
									className="font-semibold"
									onCommit={(val)=>onUpdateEntry(section.id,g.degree!.id,val)}
								/>
							)}
							{g.institution && (
								<ComboField
									entry={g.institution}
									previewMode={previewMode}
									suggestions={institutionOptions}
									placeholder="Institution"
									className="text-muted-foreground"
									onCommit={(val)=>onUpdateEntry(section.id,g.institution!.id,val)}
								/>
							)}
							{(g.start || g.end) && (
							<div className="flex items-center text-xs text-muted-foreground gap-1">
								{g.start && (
									<DateField
										entry={g.start}
										label="Start"
										onCommit={(val)=>onUpdateEntry(section.id,g.start!.id,val)}
										previewMode={previewMode}
										isMobile={isMobile}
								/>
								)}
								<span>-</span>
								{g.end && (
									<DateField
										entry={g.end}
										label="End"
										onCommit={(val)=>onUpdateEntry(section.id,g.end!.id,val)}
										previewMode={previewMode}
										isMobile={isMobile}
										allowPresent
								/>
								)}
							</div>
							)}
							{g.gpa && (
								<GpaField
									key={groupId + '-gpa'}
									groupId={groupId}
									entry={g.gpa}
									state={gpaStates[groupId] || parseContent(g.gpa.content)}
									setStateForGroup={setStateForGroup}
									onCommit={(val)=>onUpdateEntry(section.id,g.gpa!.id,val)}
									isMobile={isMobile}
									previewMode={previewMode}
									buildContent={buildContent}
									parseContent={parseContent}
								/>
							)}
						</div>
						{g.desc && (!previewMode || hasDesc) && (
							<div className="mt-1 text-sm relative">
								<EditableContent
									content={g.desc.content}
									onChange={c=>onUpdateEntry(section.id,g.desc!.id,c)}
									previewMode={previewMode}
									type="html"
									className="text-sm"
									placeholder="Description (optional)"
									maxLength={DESC_CHAR_LIMIT}
								/>
								{!previewMode && (
									<div className="absolute -bottom-4 right-0 text-[10px] text-muted-foreground select-none">
										{Math.max(0, DESC_CHAR_LIMIT - (g.desc.content ? g.desc.content.replace(/<[^>]*>/g,'').length : 0))} left
									</div>
								)}
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
};

// DateField moved to shared component: src/components/DateField.tsx

interface GpaFieldProps {
	groupId: string;
	entry: Entry;
	state: { mode: 'gpa' | 'marks' | 'percentage'; obtained: string; outOf: string; hidden?: boolean };
	setStateForGroup: (groupId: string, updater: (prev: { mode: 'gpa' | 'marks' | 'percentage'; obtained: string; outOf: string; hidden?: boolean }) => { mode: 'gpa' | 'marks' | 'percentage'; obtained: string; outOf: string; hidden?: boolean }) => void;
	onCommit: (val: string) => void;
	isMobile: boolean;
	previewMode: boolean;
	buildContent: (s: { mode: 'gpa' | 'marks' | 'percentage'; obtained: string; outOf: string; hidden?: boolean }) => string;
	parseContent: (content: string) => { mode: 'gpa' | 'marks' | 'percentage'; obtained: string; outOf: string; hidden?: boolean };
}

const GpaField: React.FC<GpaFieldProps> = ({ groupId, entry, state, setStateForGroup, onCommit, isMobile, previewMode, buildContent, parseContent }) => {
	const [open, setOpen] = useState(false);
	useEffect(() => {
		if (previewMode) return;
		const val = buildContent(state);
		if (val !== entry.content) onCommit(val);
	}, [state, buildContent, onCommit, entry.content, previewMode]);
	if (previewMode) {
		if (state.hidden || entry.content === '__HIDDEN__') return null;
		return <div className="text-xs text-muted-foreground">{entry.content}</div>;
	}
	const body = (
		<div className="space-y-3">
			<div className="space-y-2">
				<RadioGroup
					value={state.mode}
					onValueChange={(v)=>setStateForGroup(groupId, prev=>({ ...prev, mode: v as any }))}
					className="flex flex-col gap-1"
				>
					<div className="flex items-center gap-2">
						<RadioGroupItem value="gpa" id={`gpa-${groupId}`} />
						<Label htmlFor={`gpa-${groupId}`} className="text-xs">CGPA</Label>
					</div>
					<div className="flex items-center gap-2">
						<RadioGroupItem value="marks" id={`marks-${groupId}`} />
						<Label htmlFor={`marks-${groupId}`} className="text-xs">Marks</Label>
					</div>
					<div className="flex items-center gap-2">
						<RadioGroupItem value="percentage" id={`percent-${groupId}`} />
						<Label htmlFor={`percent-${groupId}`} className="text-xs">Percentage</Label>
					</div>
				</RadioGroup>
			</div>
			<div className="flex items-center gap-2 pt-1">
				<Checkbox
					checked={!!state.hidden}
					onCheckedChange={(checked)=>setStateForGroup(groupId, prev=>({ ...prev, hidden: !!checked }))}
					id={`hide-${groupId}`}
				/>
				<Label htmlFor={`hide-${groupId}`} className="text-[11px]">Hide this field</Label>
			</div>
			{!state.hidden && (state.mode === 'percentage' ? (
				<div className="flex items-end gap-2">
					<div className="flex-1 min-w-[5rem]">
						<Label className="text-[10px] uppercase tracking-wide">Percent</Label>
						<Input
							type="number"
							value={state.obtained}
							placeholder="e.g. 85"
							onChange={e=>setStateForGroup(groupId, prev=>({ ...prev, obtained: e.target.value }))}
							className="h-8 text-xs"
						/>
					</div>
					  <div className="text-xs text-muted-foreground mb-2">%</div>
				</div>
			) : (
				<div className="flex gap-2">
					<div className="flex-1 min-w-[4rem]">
						<Label className="text-[10px] uppercase tracking-wide">Obtained</Label>
						<Input
							type="text"
							value={state.obtained}
							placeholder={state.mode === 'gpa' ? '3.8' : state.mode === 'marks' ? '85' : ''}
							onChange={e=>setStateForGroup(groupId, prev=>({ ...prev, obtained: e.target.value }))}
							className="h-8 text-xs"
						/>
					</div>
					<div className="flex-1 min-w-[4rem]">
						<Label className="text-[10px] uppercase tracking-wide">Out of</Label>
						<Input
							type="text"
							value={state.outOf}
							placeholder={state.mode === 'gpa' ? '4.0' : '100' }
							onChange={e=>setStateForGroup(groupId, prev=>({ ...prev, outOf: e.target.value }))}
							className="h-8 text-xs"
						/>
					</div>
				</div>
			))}
			<div className="flex justify-end gap-2 pt-2">
				<Button variant="ghost" size="sm" className="h-7 px-2 text-[11px]" onClick={()=>{ setStateForGroup(groupId, _=>({ mode: 'gpa', obtained: '', outOf: '', hidden: false })); onCommit(''); setOpen(false); }}>Clear</Button>
				<Button size="sm" className="h-7 px-3 text-[11px]" onClick={()=>setOpen(false)}>Done</Button>
			</div>
		</div>
	);
	const displayValue = state.hidden || entry.content === '__HIDDEN__'
		? 'Hidden'
		: (entry.content || (state.mode === 'percentage' ? 'Percentage (click to set)' : state.mode === 'marks' ? 'Marks (click to set)' : 'CGPA (click to set)'));
	return isMobile ? (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger asChild>
				<button
					type="button"
					className="text-xs text-muted-foreground px-1 py-0.5 rounded-sm hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
					onClick={()=>{
						setStateForGroup(groupId, prev => prev.obtained === '' && prev.outOf === '' && entry.content ? parseContent(entry.content) : prev);
					}}
				>{displayValue}</button>
			</SheetTrigger>
			<SheetContent side="bottom" className="p-4">
				<SheetHeader>
					<SheetTitle>Academic Score</SheetTitle>
				</SheetHeader>
				<div className="mt-4">{body}</div>
			</SheetContent>
		</Sheet>
	) : (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<button
					type="button"
					className="text-xs text-muted-foreground px-1 py-0.5 rounded-sm hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
					onClick={()=>{
						setStateForGroup(groupId, prev => prev.obtained === '' && prev.outOf === '' && entry.content ? parseContent(entry.content) : prev);
					}}
				>{displayValue}</button>
			</PopoverTrigger>
			<PopoverContent className="w-72 p-3" align="start">
				{body}
			</PopoverContent>
		</Popover>
	);
};

