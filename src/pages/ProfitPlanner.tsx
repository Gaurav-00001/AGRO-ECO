import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, TrendingUp, TrendingDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface CropData {
  currentMSP: number;
  threeMonthTrend: number; // % change
  sixMonthTrend: number;
  storageCostPerQuintalPerMonth: number;
}

const CROP_DATA: Record<string, CropData> = {
  wheat:     { currentMSP: 2275, threeMonthTrend: 5,  sixMonthTrend: 8,  storageCostPerQuintalPerMonth: 15 },
  rice:      { currentMSP: 2203, threeMonthTrend: 3,  sixMonthTrend: 6,  storageCostPerQuintalPerMonth: 18 },
  pulses:    { currentMSP: 6600, threeMonthTrend: 7,  sixMonthTrend: 12, storageCostPerQuintalPerMonth: 20 },
  mustard:   { currentMSP: 5650, threeMonthTrend: 4,  sixMonthTrend: -2, storageCostPerQuintalPerMonth: 12 },
  soybean:   { currentMSP: 4600, threeMonthTrend: -3, sixMonthTrend: 5,  storageCostPerQuintalPerMonth: 14 },
  sugarcane: { currentMSP: 315,  threeMonthTrend: 2,  sixMonthTrend: 4,  storageCostPerQuintalPerMonth: 25 },
};

interface Projection {
  label: string;
  price: number;
  storageCost: number;
  revenue: number;
  netReturn: number;
}

export default function ProfitPlanner() {
  const { t } = useI18n();
  const [cropType, setCropType] = useState('');
  const [quantity, setQuantity] = useState('');
  const [projections, setProjections] = useState<Projection[] | null>(null);

  const calculate = () => {
    if (!cropType || !quantity) return;
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) return;

    const crop = CROP_DATA[cropType];
    const nowPrice = crop.currentMSP;
    const threePrice = Math.round(nowPrice * (1 + crop.threeMonthTrend / 100));
    const sixPrice = Math.round(nowPrice * (1 + crop.sixMonthTrend / 100));

    const results: Projection[] = [
      {
        label: t('sellNow'),
        price: nowPrice,
        storageCost: 0,
        revenue: nowPrice * qty,
        netReturn: nowPrice * qty,
      },
      {
        label: t('holdThreeMonths'),
        price: threePrice,
        storageCost: crop.storageCostPerQuintalPerMonth * 3 * qty,
        revenue: threePrice * qty,
        netReturn: threePrice * qty - crop.storageCostPerQuintalPerMonth * 3 * qty,
      },
      {
        label: t('holdSixMonths'),
        price: sixPrice,
        storageCost: crop.storageCostPerQuintalPerMonth * 6 * qty,
        revenue: sixPrice * qty,
        netReturn: sixPrice * qty - crop.storageCostPerQuintalPerMonth * 6 * qty,
      },
    ];

    setProjections(results);
  };

  const baseReturn = projections?.[0]?.netReturn || 0;

  const chartData = projections?.map((p) => ({
    name: p.label,
    value: p.netReturn,
    diff: p.netReturn - baseReturn,
    isProfit: p.netReturn >= baseReturn,
  }));

  const crops = [
    { value: 'wheat', label: t('wheat') },
    { value: 'rice', label: t('rice') },
    { value: 'pulses', label: t('pulses') },
    { value: 'mustard', label: t('mustard') },
    { value: 'soybean', label: t('soybean') },
    { value: 'sugarcane', label: t('sugarcane') },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Calculator className="h-6 w-6 text-primary" /> {t('profitPlannerTitle')}
        </h1>
        <p className="text-muted-foreground">{t('profitPlannerDesc')}</p>
      </div>

      {/* Calculator Inputs */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg">{t('sellVsHold')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('cropType')}</Label>
              <Select value={cropType} onValueChange={setCropType}>
                <SelectTrigger><SelectValue placeholder={t('selectCrop')} /></SelectTrigger>
                <SelectContent>
                  {crops.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('harvestQuantity')}</Label>
              <Input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="e.g. 50" />
            </div>
          </div>
          <Button onClick={calculate} disabled={!cropType || !quantity} className="w-full sm:w-auto">
            <Calculator className="mr-2 h-4 w-4" /> {t('calculate')}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {projections && (
        <>
          {/* Bar Chart */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg">{t('projectedProfitLoss')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, t('netReturn')]}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {chartData?.map((entry, index) => (
                        <Cell
                          key={index}
                          fill={entry.isProfit ? 'hsl(142, 71%, 45%)' : 'hsl(0, 84%, 60%)'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Detail Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {projections.map((p, i) => {
              const diff = p.netReturn - baseReturn;
              const isProfit = diff >= 0;
              return (
                <Card key={i} className={`border ${isProfit ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      {isProfit ? <TrendingUp className="h-4 w-4 text-green-600" /> : <TrendingDown className="h-4 w-4 text-red-600" />}
                      {p.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground">{t('projectedPrice')}</p>
                      <p className="text-lg font-bold text-foreground">₹{p.price.toLocaleString('en-IN')}/qtl</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('storageCost')}</p>
                      <p className="text-sm text-foreground">₹{p.storageCost.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="pt-2 border-t border-border">
                      <p className="text-xs text-muted-foreground">{t('netReturn')}</p>
                      <p className={`text-xl font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{p.netReturn.toLocaleString('en-IN')}
                      </p>
                      {i > 0 && (
                        <p className={`text-sm font-medium ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                          {diff >= 0 ? '+' : ''}₹{diff.toLocaleString('en-IN')} vs {t('sellNow')}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}