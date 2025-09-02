import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Eye, EyeOff } from 'lucide-react';
import { EditableContent } from '../EditableContent';
import { DateField } from '../DateField';
import { SectionConfirm } from './SectionConfirm';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Section, Entry } from '../ResumeBuilder';
import { ROLE_SUGGESTIONS, COMPANY_SUGGESTIONS } from '@/data/experienceOptions';

// Simple combobox field (mirrors Education section behavior)
interface ComboFieldProps {
	entry: Entry;
	previewMode: boolean;
	suggestions: string[];
	placeholder: string;
	className?: string;
	onCommit: (val: string) => void;
}

const ComboField: React.FC<ComboFieldProps> = ({ entry, previewMode, suggestions, placeholder, className, onCommit }) => {
	const [open, setOpen] = React.useState(false);
	const [value, setValue] = React.useState(entry.content);
	const [query, setQuery] = React.useState('');
	React.useEffect(()=>{ setValue(entry.content); }, [entry.content]);
	if (previewMode) {
		// In preview mode, hide placeholder if there's no actual content
		return entry.content ? <span className={className}>{entry.content}</span> : null;
	}
	const filtered = suggestions.filter(s => s.toLowerCase().includes(query.toLowerCase())).slice(0,8);
	return (
		<div className={`relative ${className || ''}`}>
			<input
				value={value}
				placeholder={placeholder}
				onChange={e=>{ const v=e.target.value; setValue(v); setQuery(v); setOpen(true); onCommit(v); }}
				onFocus={()=>{ setQuery(value); setOpen(true); }}
				onBlur={()=>{ setTimeout(()=> setOpen(false),120); }}
				className="bg-transparent border-b border-transparent hover:border-muted focus:border-primary focus:outline-none text-sm px-0 py-0.5 min-w-[8ch]"
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

interface ExperienceSectionBodyProps {
	section: Section;
	previewMode: boolean;
	onUpdateEntry: (sectionId: string, entryId: string, content: string) => void;
	onDeleteEntry: (sectionId: string, entryId: string) => void; // not used directly here
	deleteGroup: (prefix: string) => void;
	onToggleEntryVisibility: (sectionId: string, groupId: string) => void;
	onReorderEntries: (sectionId: string, order: string[], isGrouped: boolean) => void;
}

export const ExperienceSectionBody: React.FC<ExperienceSectionBodyProps> = ({ section, previewMode, onUpdateEntry, deleteGroup, onToggleEntryVisibility, onReorderEntries }) => {
	const isMobile = useIsMobile();
	const pointerDrag = React.useRef<string | null>(null);
	const DESC_CHAR_LIMIT = 350; // character limit for description fields
	const groups: Record<string, Partial<Record<string, Entry>>> = {};
	section.entries.forEach(e => {
		const m = e.id.match(/^(exp\d+)-(role|company|start|end|desc)$/);
		if (m) {
			const key = m[1]; const field = m[2];
			(groups[key] ||= {})[field] = e;
		}
	});

	const handleDragStart = (e: React.DragEvent, groupId: string) => {
		if (previewMode) return;
		e.dataTransfer.setData('text/plain', groupId);
	};
	const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { if (!previewMode) { e.preventDefault(); } };
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
				const g = groups[groupId]; if (!g) return null;
				// Determine visibility from first field
				const firstEntry = g.role || g.company || g.start || g.end || g.desc;
				const hidden = firstEntry?.visible === false;
				if (previewMode && hidden) return null;
				return (
					<div
						key={groupId}
						className={`experience-item relative group ${hidden && !previewMode ? 'opacity-40' : ''} ${!previewMode ? 'cursor-grab' : ''}`}
						draggable={!previewMode}
						onDragStart={e=>handleDragStart(e, groupId)}
						onDragOver={handleDragOver}
						onDrop={e=>handleDrop(e, groupId)}
						onPointerDown={()=>{ if (!previewMode) pointerDrag.current = groupId; }}
						onPointerUp={()=>{ if (!previewMode && pointerDrag.current && pointerDrag.current !== groupId) { const order = Object.keys(groups).sort(); const from = order.indexOf(pointerDrag.current); const to = order.indexOf(groupId); if (from>-1 && to>-1) { const newOrder=[...order]; const [m]=newOrder.splice(from,1); newOrder.splice(to,0,m); onReorderEntries(section.id,newOrder,true);} } pointerDrag.current=null; }}
					>
						{!previewMode && (
							<div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100">
								<SectionConfirm
									title="Delete experience entry?"
									description="This will remove this experience group."
									onConfirm={() => deleteGroup(groupId)}
								>
									<Button variant="ghost" size="sm" className="w-6 h-6 p-0" title="Delete Experience Entry">
										<Trash2 className="w-3 h-3" />
									</Button>
								</SectionConfirm>
								<Button variant="ghost" size="sm" className="w-6 h-6 p-0" onClick={()=>onToggleEntryVisibility(section.id, groupId)} title={hidden ? 'Show' : 'Hide'}>
									{hidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
								</Button>
							</div>
						)}
						{/* Drag handle removed; entire item is draggable */}
						<div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
							{g.role && (
								<ComboField
									entry={g.role}
									previewMode={previewMode}
									suggestions={ROLE_SUGGESTIONS}
									placeholder="Role"
									className="font-semibold"
									onCommit={(val)=>onUpdateEntry(section.id,g.role!.id,val)}
								/>
							)}
							{g.company && (
								<ComboField
									entry={g.company}
									previewMode={previewMode}
									suggestions={COMPANY_SUGGESTIONS}
									placeholder="Company"
									className="text-muted-foreground"
									onCommit={(val)=>onUpdateEntry(section.id,g.company!.id,val)}
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
						</div>
						{g.desc && (
							<div className="mt-1 text-sm relative">
								<EditableContent
									content={g.desc.content}
									onChange={c=>onUpdateEntry(section.id,g.desc!.id,c)}
									previewMode={previewMode}
									type="html"
									className="text-sm"
									placeholder="Description"
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
