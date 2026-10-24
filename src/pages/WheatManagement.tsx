import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n';
import { useActivity } from '@/lib/activity-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Wheat, Info } from 'lucide-react';
import { toast } from 'sonner';

interface Plot {
  id: string;
  name: string;
  length_m: number;
  breadth_m: number;
  area_sqm: number;
}

export default function WheatManagement() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { addActivity } = useActivity();
  const [plots, setPlots] = useState<Plot[]>([]);
  const [open, setOpen] = useState(false);
  const [editingPlot, setEditingPlot] = useState<Plot | null>(null);
  const [form, setForm] = useState({ name: '', length_m: '', breadth_m: '' });

  const fetchPlots = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('plots')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setPlots((data || []) as Plot[]);
  };

  useEffect(() => { fetchPlots(); }, [user]);

  const length = parseFloat(form.length_m) || 0;
  const breadth = parseFloat(form.breadth_m) || 0;
  const area = length * breadth;

  const handleSave = async () => {
    if (!user || !form.name) {
      toast.error("Plot name is required");
      return;
    }
    
    const payload = { 
      name: form.name, 
      length_m: length, 
      breadth_m: breadth, 
      area_sqm: area, 
      user_id: user.id 
    };

    if (editingPlot) {
      const { error } = await supabase.from('plots').update(payload).eq('id', editingPlot.id);
      if (error) { toast.error(error.message); return; }
      addActivity(`Updated: ${form.name}`, `अपडेट किया: ${form.name}`, '✏️');
    } else {
      const { error } = await supabase.from('plots').insert(payload);
      if (error) { toast.error(error.message); return; }
      addActivity(`Added: ${form.name}`, `नया जोड़ा: ${form.name}`, '🌾');
    }
    
    toast.success(editingPlot ? 'Updated' : 'Created');
    setOpen(false);
    setEditingPlot(null);
    setForm({ name: '', length_m: '', breadth_m: '' });
    fetchPlots();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this plot?")) return;
    const { error } = await supabase.from('plots').delete().eq('id', id);
    if (error) { toast.error("Delete failed"); return; }
    toast.success('Removed');
    fetchPlots();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 px-4 md:px-0">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold text-emerald-900 flex items-center gap-2">
          <Wheat className="h-7 w-7 text-emerald-600" /> {t('wheatPlots')}
        </h1>
        
        <Dialog open={open} onOpenChange={(v) => { 
          setOpen(v); 
          if (!v) { setEditingPlot(null); setForm({ name: '', length_m: '', breadth_m: '' }); } 
        }}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-700 hover:bg-emerald-800">
              <Plus className="mr-2 h-4 w-4" />{t('addPlot')}
            </Button>
          </DialogTrigger>
          
          {/* THE ABSOLUTE CENTER FIX */}
          <DialogContent className="fixed inset-0 m-auto z-[100] h-fit w-[92vw] max-w-[400px] gap-0 border border-emerald-100 bg-white p-0 shadow-2xl rounded-2xl overflow-hidden focus:outline-none">
            <div className="bg-emerald-700 p-4 text-white">
              <DialogTitle className="text-lg font-bold">
                {editingPlot ? "Edit Wheat Plot" : "Create New Plot"}
              </DialogTitle>
            </div>

            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <Label className="text-emerald-800 font-bold">{t('plotName')}</Label>
                <Input 
                  className="border-emerald-200"
                  placeholder="e.g. North Field"
                  value={form.name} 
                  onChange={(e) => setForm({ ...form, name: e.target.value })} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-emerald-800 font-bold">{t('length')} (m)</Label>
                  <Input 
                    type="number" 
                    value={form.length_m} 
                    onChange={(e) => setForm({ ...form, length_m: e.target.value })} 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-emerald-800 font-bold">{t('breadth')} (m)</Label>
                  <Input 
                    type="number" 
                    value={form.breadth_m} 
                    onChange={(e) => setForm({ ...form, breadth_m: e.target.value })} 
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex justify-between items-center mt-2">
                <span className="text-emerald-700 font-bold">{t('area')}:</span>
                <span className="text-xl font-black text-emerald-900">{area.toLocaleString()} m²</span>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setOpen(false)} className="flex-1 border-emerald-200">
                  {t('cancel')}
                </Button>
                <Button onClick={handleSave} className="flex-1 bg-emerald-700 hover:bg-emerald-800">
                  {t('save')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Seasonal Advisory Banner */}
      <Card className="border-none bg-amber-50 shadow-sm">
        <CardContent className="p-4 flex items-center gap-3">
          <Info className="h-5 w-5 text-amber-600" />
          <p className="text-sm font-bold text-amber-900">
            April 2026: Harvesting season active. Monitor grain moisture levels before storage.
          </p>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {plots.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-emerald-900 text-white border-none">
            <CardContent className="p-4 text-center">
              <p className="text-[10px] uppercase font-bold text-emerald-300 tracking-widest">{t('totalPlots')}</p>
              <p className="text-2xl font-black">{plots.length}</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-emerald-100 shadow-sm text-center">
            <CardContent className="p-4">
              <p className="text-[10px] uppercase font-bold text-emerald-600 tracking-widest">Total Area</p>
              <p className="text-2xl font-black text-emerald-900">
                {plots.reduce((acc, p) => acc + p.area_sqm, 0).toLocaleString()} <span className="text-xs">m²</span>
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Plots Display */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {plots.map((plot) => (
          <Card key={plot.id} className="border-emerald-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-600" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-black text-emerald-900">{plot.name}</CardTitle>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => {
                  setEditingPlot(plot);
                  setForm({ name: plot.name, length_m: String(plot.length_m), breadth_m: String(plot.breadth_m) });
                  setOpen(true);
                }} className="h-8 w-8 text-emerald-600">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(plot.id)} className="h-8 w-8 text-red-500">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-emerald-600/60 font-bold mb-3">
                {plot.length_m}m × {plot.breadth_m}m
              </div>
              <div className="text-3xl font-black text-emerald-900">
                {Number(plot.area_sqm).toLocaleString()} <span className="text-sm font-medium">m²</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}