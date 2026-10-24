import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Minus, RefreshCw, Loader2, Wheat, Droplets, Bug, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

interface Commodity {
  name: string;
  category: 'grain' | 'oilseed' | 'other';
  price: number;
  unit: string;
  change: number;
  trend: 'up' | 'down' | 'stable';
  mandi: string;
}

interface MarketData {
  commodities: Commodity[];
  lastUpdated: string;
  marketSummary: string;
}

const categoryIcons: Record<string, React.ReactNode> = {
  grain: <Wheat className="h-5 w-5" />,
  oilseed: <Droplets className="h-5 w-5" />,
  other: <BarChart3 className="h-5 w-5" />,
};

const categoryColors: Record<string, string> = {
  grain: 'border-primary/30 bg-primary/5',
  oilseed: 'border-yellow-500/30 bg-yellow-500/5',
  other: 'border-purple-500/30 bg-purple-500/5',
};

export default function MarketInsights() {
  const { t, language } = useI18n();
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  const fetchPrices = async () => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('market-prices', {
        body: { language },
      });
      if (error) throw error;
      if (result.error) throw new Error(result.error);
      setData(result);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch market data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPrices(); }, [language]);

  const trendIcon = (trend: string) => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-destructive" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const trendColor = (trend: string) => {
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-destructive';
    return 'text-muted-foreground';
  };

  const categories = ['all', 'grain', 'oilseed', 'other'];
  const categoryLabels: Record<string, string> = language === 'hi'
    ? { all: 'सभी', grain: 'अनाज', oilseed: 'तिलहन', other: 'अन्य' }
    : { all: 'All', grain: 'Grains', oilseed: 'Oilseeds', other: 'Other' };

  const filtered = data?.commodities.filter(c => filter === 'all' || c.category === filter) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" /> {t('marketOverview')}
        </h1>
        <Button onClick={fetchPrices} disabled={loading} variant="outline">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          {loading ? (language === 'hi' ? 'लोड हो रहा है...' : 'Loading...') : (language === 'hi' ? 'रिफ्रेश' : 'Refresh')}
        </Button>
      </div>

      {/* Market Summary */}
      {data && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <p className="text-foreground">{data.marketSummary}</p>
            <p className="text-xs text-muted-foreground mt-2">{data.lastUpdated}</p>
          </CardContent>
        </Card>
      )}

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(cat => (
          <Button
            key={cat}
            variant={filter === cat ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(cat)}
          >
            {categoryLabels[cat]}
          </Button>
        ))}
      </div>

      {/* Loading State */}
      {loading && !data && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Price Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((commodity, i) => (
          <Card key={i} className={`border hover:shadow-md transition-shadow ${categoryColors[commodity.category] || ''}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-foreground">
                  {categoryIcons[commodity.category]}
                  <CardTitle className="text-base font-semibold">{commodity.name}</CardTitle>
                </div>
                {trendIcon(commodity.trend)}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-foreground">₹{commodity.price.toLocaleString('en-IN')}</span>
                <span className="text-xs text-muted-foreground">/{commodity.unit}</span>
              </div>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className={`text-xs ${trendColor(commodity.trend)}`}>
                  {commodity.change > 0 ? '+' : ''}{commodity.change}%
                </Badge>
                <span className="text-xs text-muted-foreground">{commodity.mandi}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!loading && filtered.length === 0 && data && (
        <div className="text-center py-12 text-muted-foreground">
          {language === 'hi' ? 'इस श्रेणी में कोई डेटा नहीं' : 'No data in this category'}
        </div>
      )}
    </div>
  );
}
