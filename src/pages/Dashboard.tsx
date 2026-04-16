import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n';
import { useActivity } from '@/lib/activity-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Wheat, Palmtree, Ruler, MapPin, Loader2, CloudSun, AlertTriangle, TrendingUp, BarChart3, Clock, CheckCircle2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';

function DiseaseAlertCard({ language, t }: { language: string; t: (k: string) => string }) {
  const [applied, setApplied] = useState(false);
  return (
    <Card className={`border-destructive/40 bg-gradient-to-r from-destructive/10 to-destructive/5 animate-in fade-in duration-700 ${applied ? 'opacity-70' : ''}`}>
      <CardContent className="pt-5 pb-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-full bg-destructive/20 ${!applied ? 'animate-pulse' : ''}`}>
            {applied ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <AlertTriangle className="h-5 w-5 text-destructive" />}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-destructive text-base md:text-lg">{t('diseaseAlert')}</p>
            <p className="text-sm md:text-base text-foreground mt-1">
              {language === 'hi' ? t('diseaseAlertMsgHi') : t('diseaseAlertMsg')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {language === 'hi' ? 'राज्य सलाह • म.प्र. कृषि विभाग' : 'State Advisory • MP Agriculture Dept.'}
            </p>
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <Checkbox checked={applied} onCheckedChange={(v) => setApplied(!!v)} />
          <span className="text-sm font-medium text-foreground">
            {language === 'hi' ? 'मैंने यह सलाह लागू कर दी है' : 'I have applied the advisory'}
          </span>
        </label>
      </CardContent>
    </Card>
  );
}

const SIMULATED_LAND_RATES: Record<string, { perAcre: number; perBigha: number; region: string }> = {
  'default': { perAcre: 1200000, perBigha: 480000, region: 'Central India' },
  'north': { perAcre: 1500000, perBigha: 600000, region: 'North India (Punjab/Haryana)' },
  'south': { perAcre: 2000000, perBigha: 800000, region: 'South India (Kerala/Karnataka)' },
  'east': { perAcre: 800000, perBigha: 320000, region: 'East India (Bihar/Jharkhand)' },
  'west': { perAcre: 1800000, perBigha: 720000, region: 'West India (Maharashtra/Gujarat)' },
};

function getRegionFromCoords(lat: number, _lng: number): string {
  if (lat > 28) return 'north';
  if (lat < 15) return 'south';
  if (lat < 23) return 'east';
  return 'west';
}

const WEATHER_ADVICE_EN: Record<string, string> = {
  Clear: 'Great day for field work and drying crops.',
  Clouds: 'Cloudy skies — good day for transplanting.',
  Rain: 'Avoid spraying pesticides today. Let rain nourish the soil.',
  Drizzle: 'Light drizzle — ideal for sowing seeds.',
  Thunderstorm: 'Stay indoors. Secure loose equipment.',
  Snow: 'Protect crops with mulch or covers.',
  Mist: 'Good for fertilizer application, low wind.',
  Haze: 'Good for fertilizer application, low wind.',
  Fog: 'Good for fertilizer application, low wind.',
};
const WEATHER_ADVICE_HI: Record<string, string> = {
  Clear: 'खेत के काम और फसल सुखाने के लिए अच्छा दिन।',
  Clouds: 'बादल छाए हैं — रोपाई के लिए अच्छा दिन।',
  Rain: 'आज कीटनाशक छिड़काव से बचें। बारिश मिट्टी को पोषण दे।',
  Drizzle: 'हल्की बूंदाबांदी — बीज बोने के लिए आदर्श।',
  Thunderstorm: 'घर के अंदर रहें। खुले उपकरण सुरक्षित करें।',
  Snow: 'मल्च या कवर से फसलों की रक्षा करें।',
  Mist: 'खाद डालने के लिए अच्छा, हवा कम।',
  Haze: 'खाद डालने के लिए अच्छा, हवा कम।',
  Fog: 'खाद डालने के लिए अच्छा, हवा कम।',
};

const PROFIT_CHART_DATA = [
  { name: 'Now', profit: 25000, storage: 0 },
  { name: '3 Mo', profit: 32000, storage: 4500 },
];

const CROP_GROWTH_DATA = [
  { name: 'Now', growth: 30 },
  { name: 'Month 1', growth: 55 },
  { name: 'Month 2', growth: 78 },
  { name: 'Month 3', growth: 95 },
];

export default function Dashboard() {
  const { t, language } = useI18n();
  const { user } = useAuth();
  const { activities } = useActivity();
  const [stats, setStats] = useState({ plots: 0, healthyTrees: 0, totalArea: 0 });
  const [landData, setLandData] = useState<{ perAcre: number; perBigha: number; region: string } | null>(null);
  const [detectingLocation, setDetectingLocation] = useState(true);
  const [weather, setWeather] = useState<{ temp: number; main: string; desc: string; icon: string } | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || '';

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const [plotsRes, treesRes] = await Promise.all([
        supabase.from('plots').select('area_sqm').eq('user_id', user.id),
        supabase.from('oil_palm_trees').select('status').eq('user_id', user.id),
      ]);
      const plots = plotsRes.data || [];
      const totalArea = plots.reduce((sum, p) => sum + Number(p.area_sqm), 0);
      const healthyTrees = (treesRes.data || []).filter((t) => t.status === 'Healthy').length;
      setStats({ plots: plots.length, healthyTrees, totalArea });
    };
    fetchStats();
  }, [user]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setCoords({ lat: latitude, lng: longitude });
          const region = getRegionFromCoords(latitude, longitude);
          setLandData(SIMULATED_LAND_RATES[region]);
          setDetectingLocation(false);
          fetchWeather(latitude, longitude);
        },
        () => {
          setLandData(SIMULATED_LAND_RATES['default']);
          setDetectingLocation(false);
          fetchWeather(28.6139, 77.2090);
        },
        { timeout: 5000 }
      );
    } else {
      setLandData(SIMULATED_LAND_RATES['default']);
      setDetectingLocation(false);
      fetchWeather(28.6139, 77.2090);
    }
  }, []);

  const fetchWeather = async (lat: number, lon: number) => {
    setWeatherLoading(true);
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
      const data = await res.json();
      const cw = data.current_weather;
      const wmoMain = getWmoMain(cw.weathercode);
      setWeather({ temp: Math.round(cw.temperature), main: wmoMain, desc: wmoMain, icon: '🌤️' });
    } catch {
      setWeather(null);
    } finally {
      setWeatherLoading(false);
    }
  };

  function getWmoMain(code: number): string {
    if (code <= 1) return 'Clear';
    if (code <= 3) return 'Clouds';
    if (code >= 51 && code <= 57) return 'Drizzle';
    if (code >= 61 && code <= 67) return 'Rain';
    if (code >= 71 && code <= 77) return 'Snow';
    if (code >= 80 && code <= 82) return 'Rain';
    if (code >= 95) return 'Thunderstorm';
    if (code >= 45 && code <= 48) return 'Fog';
    return 'Clouds';
  }

  const weatherAdvice = weather
    ? (language === 'hi' ? WEATHER_ADVICE_HI[weather.main] : WEATHER_ADVICE_EN[weather.main]) || ''
    : '';

  const cards = [
    { title: t('totalPlots'), value: stats.plots, icon: Wheat, gradient: 'from-primary/15 to-primary/5', iconColor: 'text-primary' },
    { title: t('healthyTrees'), value: stats.healthyTrees, icon: Palmtree, gradient: 'from-green-500/15 to-green-500/5', iconColor: 'text-green-600' },
    { title: t('totalArea'), value: `${stats.totalArea.toLocaleString()} ${t('sqm')}`, icon: Ruler, gradient: 'from-blue-500/15 to-blue-500/5', iconColor: 'text-blue-600' },
  ];

  const recentActivities = activities.slice(0, 5);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          {t('welcomeBack')}{userName ? `, ${userName}` : ''} 👋
        </h1>
        <p className="text-muted-foreground text-base md:text-lg">{t('dashboardSubtitle')}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Card key={card.title} className={`border-border bg-gradient-to-br ${card.gradient} hover:shadow-lg hover:scale-[1.02] transition-all duration-300`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm md:text-base font-medium text-muted-foreground">{card.title}</CardTitle>
              <div className={`p-2 rounded-lg bg-background/80 ${card.iconColor}`}>
                <card.icon className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl md:text-3xl font-bold text-foreground">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Disease Alert with tick option */}
      <DiseaseAlertCard language={language} t={t} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Weather */}
        <Card className="border-border bg-gradient-to-br from-blue-500/10 to-sky-500/5 hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-base md:text-lg font-semibold flex items-center gap-2">
              <CloudSun className="h-5 w-5 text-blue-500" /> {t('weather')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weatherLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> {t('fetchingWeather')}
              </div>
            ) : weather ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-bold text-foreground">{weather.temp}°C</span>
                  <span className="text-lg text-muted-foreground">{weather.main}</span>
                </div>
                <p className="text-sm md:text-base text-primary font-medium">{weatherAdvice}</p>
              </div>
            ) : (
              <p className="text-muted-foreground">{t('weatherUnavailable')}</p>
            )}
          </CardContent>
        </Card>

        {/* Profit/Loss Storage Chart */}
        <Card className="border-border bg-gradient-to-br from-primary/10 to-primary/5 hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-base md:text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" /> {t('profitLossStorage')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={PROFIT_CHART_DATA} barGap={8}>
                <XAxis dataKey="name" tick={{ fontSize: 14 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="profit" name={t('profit')} radius={[6, 6, 0, 0]}>
                  {PROFIT_CHART_DATA.map((entry, i) => (
                    <Cell key={i} fill={entry.profit > entry.storage ? 'hsl(152, 82%, 26%)' : 'hsl(0, 84%, 60%)'} />
                  ))}
                </Bar>
                <Bar dataKey="storage" name={t('storageCost')} fill="hsl(38, 92%, 50%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Crop Growth Trend */}
        <Card className="border-border bg-gradient-to-br from-green-500/10 to-green-500/5 hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-base md:text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" /> {t('cropGrowthTrend')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={CROP_GROWTH_DATA}>
                <XAxis dataKey="name" tick={{ fontSize: 14 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="growth" stroke="hsl(152, 82%, 26%)" strokeWidth={3} dot={{ fill: 'hsl(152, 82%, 26%)', r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Activity Timeline */}
        <Card className="border-border bg-gradient-to-br from-amber-500/10 to-amber-500/5 hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-base md:text-lg font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-600" /> {t('recentActivity')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivities.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t('noActivity')}</p>
            ) : (
              <div className="space-y-3">
                {recentActivities.map((a) => (
                  <div key={a.id} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5">{a.icon}</span>
                    <div className="flex-1">
                      <p className="text-foreground">{language === 'hi' ? a.messageHi : a.message}</p>
                      <p className="text-xs text-muted-foreground">{a.timestamp.toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Local Land Value */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 hover:shadow-lg transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base md:text-lg font-semibold text-foreground flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" /> {t('localLandValue')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {detectingLocation ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> {t('detectingLocation')}
            </div>
          ) : landData ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{t('landRatePerAcre')}</p>
                <p className="text-2xl font-bold text-primary">₹{landData.perAcre.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('landRatePerBigha')}</p>
                <p className="text-2xl font-bold text-primary">₹{landData.perBigha.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('estimatedLocation')}</p>
                <p className="text-lg font-medium text-foreground">{landData.region}</p>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
