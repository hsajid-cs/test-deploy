import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { Code, Briefcase, Award, Globe, Heart, BookOpen, Trophy, Users, Handshake, FileText, Plus, GraduationCap, ListChecks } from 'lucide-react';
import { SectionType } from '@/types/resume';

export interface AddSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSection: (type: SectionType, title: string) => void;
  /** Already added section types (excluding personal information). */
  existingKinds?: SectionType[];
}

const sectionTypes = [
  { type: 'summary' as SectionType, title: 'Professional Summary', description: 'Short overview of your profile', icon: ListChecks },
  { type: 'experience' as SectionType, title: 'Experience', description: 'Work history and roles', icon: Briefcase },
  { type: 'education' as SectionType, title: 'Education', description: 'Academic background', icon: GraduationCap },
  { type: 'skills' as SectionType, title: 'Technical Skills', description: 'Programming languages, frameworks, tools', icon: Code },
  { type: 'projects' as SectionType, title: 'Projects', description: 'Personal and professional projects', icon: Briefcase },
  { type: 'certifications' as SectionType, title: 'Certifications', description: 'Professional certifications and licenses', icon: Award },
  { type: 'languages' as SectionType, title: 'Languages', description: 'Language proficiencies', icon: Globe },
  { type: 'hobbies' as SectionType, title: 'Hobbies & Interests', description: 'Personal interests and activities', icon: Heart },
  { type: 'publications' as SectionType, title: 'Publications', description: 'Articles, papers, and publications', icon: BookOpen },
  { type: 'awards' as SectionType, title: 'Awards & Honors', description: 'Recognition and achievements', icon: Trophy },
  { type: 'references' as SectionType, title: 'References', description: 'Professional references', icon: Users },
  { type: 'volunteer' as SectionType, title: 'Volunteer Experience', description: 'Community service and volunteering', icon: Handshake },
  { type: 'custom' as SectionType, title: 'Custom Section', description: 'Create your own section', icon: FileText },
];

export const AddSectionModal: React.FC<AddSectionModalProps> = ({ isOpen, onClose, onAddSection, existingKinds = [] }) => {
  const isMobile = useIsMobile();
  const available = sectionTypes.filter(s => s.type === 'custom' || !existingKinds.includes(s.type));

  const handleAddSection = (type: SectionType, title: string) => {
    onAddSection(type, title);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${isMobile ? 'h-screen max-w-full rounded-none' : 'max-w-4xl'} p-0`}>
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-xl font-semibold">Add New Section</DialogTitle>
          <p className="text-muted-foreground">Choose a section type to add to your resume</p>
        </DialogHeader>
        <div className="px-6 pb-6">
          {isMobile ? (
            <div className="space-y-3 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {available.map(section => (
                <Button
                  key={section.type}
                  variant="outline"
                  className="w-full justify-between h-auto p-4 text-left border-border hover:border-primary hover:bg-accent/30 transition-all duration-200"
                  onClick={() => handleAddSection(section.type, section.title)}
                >
                  <div className="flex items-center gap-3">
                    <section.icon className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{section.title}</span>
                  </div>
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </Button>
              ))}
              {available.length === 0 && (
                <div className="text-xs text-muted-foreground italic">All optional sections added.</div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {available.map(section => (
                <div
                  key={section.type}
                  className="group p-4 bg-card rounded-lg border border-border hover:border-primary hover:shadow-md transition-all duration-200 cursor-pointer"
                  onClick={() => handleAddSection(section.type, section.title)}
                >
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="p-3 bg-accent/40 rounded-lg group-hover:bg-primary/10 transition-colors duration-200">
                      <section.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground mb-1">{section.title}</h3>
                      <p className="text-xs text-muted-foreground">{section.description}</p>
                    </div>
                    <Button size="sm" className="w-full opacity-0 group-hover:opacity-100 transition-all duration-200">
                      Add Section
                    </Button>
                  </div>
                </div>
              ))}
              {available.length === 0 && (
                <div className="col-span-full text-xs text-muted-foreground italic">All optional sections added.</div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};