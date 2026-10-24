import { SidebarTrigger } from '@/components/ui/sidebar';
import { useI18n, Language } from '@/lib/i18n';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe } from 'lucide-react';

export function AppHeader() {
  const { language, setLanguage, t } = useI18n();

  return (
    <header className="h-14 flex items-center justify-between border-b border-border px-4 bg-card">
      <SidebarTrigger className="text-foreground" />
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4 text-muted-foreground" />
        <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
          <SelectTrigger className="w-[130px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="hi">हिंदी</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </header>
  );
}
