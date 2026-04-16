import { useI18n } from '@/lib/i18n';
import { useActivity } from '@/lib/activity-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';

export default function ActivityTimeline() {
  const { t, language } = useI18n();
  const { activities } = useActivity();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
        <Clock className="h-6 w-6 text-amber-600" /> {t('activityTimeline')}
      </h1>
      <Card className="border-border bg-gradient-to-br from-amber-500/10 to-amber-500/5">
        <CardHeader>
          <CardTitle className="text-lg">{t('recentActivity')}</CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">{t('noActivity')}</p>
          ) : (
            <div className="space-y-4">
              {activities.map((a) => (
                <div key={a.id} className="flex items-start gap-3 border-l-2 border-primary/30 pl-4 py-1">
                  <span className="text-lg">{a.icon}</span>
                  <div className="flex-1">
                    <p className="text-foreground text-base">{language === 'hi' ? a.messageHi : a.message}</p>
                    <p className="text-xs text-muted-foreground">{a.timestamp.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
