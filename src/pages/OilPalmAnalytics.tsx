import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n';
import { useActivity } from '@/lib/activity-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Palmtree, Camera, Sparkles, Loader2, Upload, ShieldCheck, AlertTriangle, FlaskConical, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface DiagnosisResult {
  disease: string;
  confidence: number;
  solution: string;
  fullText: string;
}

interface PalmTree {
  id: string;
  tree_id: string;
  status: string;
  last_scan_date: string | null;
  location: string | null;
  notes: string | null;
  photo_url: string | null;
}

const statusColors: Record<string, string> = {
  'Healthy': 'bg-primary/10 text-primary border-primary/20',
  'Infected': 'bg-destructive/10 text-destructive border-destructive/20',
  'Pending Scan': 'bg-warning/10 text-warning border-warning/20',
};

export default function OilPalmAnalytics() {
  const { t, language } = useI18n();
  const { user } = useAuth();
  const { addActivity } = useActivity();
  const [trees, setTrees] = useState<PalmTree[]>([]);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchTrees = async () => {
    if (!user) return;
    const { data } = await supabase.from('oil_palm_trees').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setTrees((data || []) as PalmTree[]);
  };

  useEffect(() => { fetchTrees(); }, [user]);

  const startCamera = async () => {
    setCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      toast.error('Unable to access camera');
      setCameraOpen(false);
    }
  };

  const captureImage = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedPhoto(dataUrl);
    stopCamera();
    analyzeImage(dataUrl);
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setCapturedPhoto(dataUrl);
      analyzeImage(dataUrl);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const analyzeImage = async (imageBase64: string) => {
    setAnalyzing(true);
    setDiagnosis(null);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-image', {
        body: { imageBase64, type: 'tree', language },
      });
      if (error) throw error;
      const text: string = data.analysis || '';
      const parsed = parseAIDiagnosis(text);
      setDiagnosis(parsed);

      // Save tree record
      if (user) {
        const status = parsed.confidence > 50 && parsed.disease.toLowerCase() !== 'healthy' && parsed.disease !== 'None' ? 'Infected' : 'Healthy';
        let photoUrl: string | null = null;
        const blob = await fetch(imageBase64).then(r => r.blob());
        const fileName = `${user.id}/${Date.now()}.jpg`;
        const { error: uploadErr } = await supabase.storage.from('palm-tree-photos').upload(fileName, blob, { contentType: 'image/jpeg' });
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from('palm-tree-photos').getPublicUrl(fileName);
          photoUrl = urlData.publicUrl;
        }
        await supabase.from('oil_palm_trees').insert({
          tree_id: `SCAN-${Date.now().toString(36).toUpperCase()}`,
          status,
          notes: text,
          photo_url: photoUrl,
          user_id: user.id,
          last_scan_date: new Date().toISOString(),
        } as any);
        addActivity(
          `Oil Palm scanned as ${status}`,
          `ऑयल पाम ${status === 'Healthy' ? 'स्वस्थ' : 'संक्रमित'} स्कैन किया`,
          status === 'Healthy' ? '✅' : '🔴'
        );
        fetchTrees();
      }
    } catch (err: any) {
      toast.error(err.message || 'AI analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  function parseAIDiagnosis(text: string): DiagnosisResult {
    const lines = text.split('\n');
    let disease = 'Unknown';
    let confidence = 75;
    let solution = text;
    for (const line of lines) {
      const lower = line.toLowerCase();
      if (lower.includes('disease') || lower.includes('diagnosis') || lower.includes('रोग')) {
        const val = line.split(/[:：]/)[1]?.trim();
        if (val && val.length > 1) disease = val;
      }
      if (lower.includes('confidence') || lower.includes('विश्वसनीयता') || lower.includes('%')) {
        const match = line.match(/(\d+)/);
        if (match) confidence = parseInt(match[1]);
      }
      if (lower.includes('treatment') || lower.includes('solution') || lower.includes('समाधान') || lower.includes('pesticide') || lower.includes('fungicide') || lower.includes('उपचार')) {
        const val = line.split(/[:：]/).slice(1).join(':').trim();
        if (val && val.length > 1) solution = val;
      }
    }
    return { disease, confidence, solution, fullText: text };
  }

  const resetScan = () => {
    setCapturedPhoto(null);
    setDiagnosis(null);
    setAnalyzing(false);
  };

  const handleDeleteScan = async (id: string) => {
    await supabase.from('oil_palm_trees').delete().eq('id', id);
    addActivity('Oil Palm scan deleted', 'ऑयल पाम स्कैन हटाया', '🗑️');
    toast.success(language === 'hi' ? 'स्कैन हटाया गया' : 'Scan deleted');
    fetchTrees();
  };

  const counts = {
    healthy: trees.filter(t => t.status === 'Healthy').length,
    infected: trees.filter(t => t.status === 'Infected').length,
    pending: trees.filter(t => t.status === 'Pending Scan').length,
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
        <Palmtree className="h-6 w-6 text-primary" /> {t('healthMonitoring')}
      </h1>

      {/* Quick Diagnosis Section */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg md:text-xl font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> {t('quickDiagnosis')}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{t('quickDiagnosisDesc')}</p>
        </CardHeader>
        <CardContent>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />

          {analyzing ? (
            <div className="flex flex-col items-center py-12 gap-4">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <p className="text-lg font-medium text-foreground">{t('analyzing')}</p>
            </div>
          ) : diagnosis && capturedPhoto ? (
            <div className="space-y-4">
              <img src={capturedPhoto} alt="Scanned" className="w-full max-h-48 rounded-xl object-cover border border-border shadow-sm" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Card className="border-destructive/20 bg-gradient-to-br from-destructive/10 to-destructive/5">
                  <CardContent className="pt-4 text-center">
                    <AlertTriangle className="h-6 w-6 text-destructive mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">{t('diseaseName')}</p>
                    <p className="text-base font-bold text-foreground">{diagnosis.disease}</p>
                  </CardContent>
                </Card>
                <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-blue-500/5">
                  <CardContent className="pt-4 text-center">
                    <ShieldCheck className="h-6 w-6 text-blue-500 mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">{t('confidence')}</p>
                    <p className="text-base font-bold text-foreground">{diagnosis.confidence}%</p>
                  </CardContent>
                </Card>
                <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5">
                  <CardContent className="pt-4 text-center">
                    <FlaskConical className="h-6 w-6 text-primary mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">{t('solution')}</p>
                    <p className="text-sm font-medium text-foreground leading-relaxed">{diagnosis.solution}</p>
                  </CardContent>
                </Card>
              </div>
              {/* Full AI analysis */}
              <Card className="border-border bg-muted/30">
                <CardContent className="pt-4">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">{language === 'hi' ? 'पूर्ण विश्लेषण' : 'Full Analysis'}</p>
                  <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{diagnosis.fullText}</p>
                </CardContent>
              </Card>
              <Button onClick={resetScan} className="w-full">{t('scanAnother')}</Button>
            </div>
          ) : cameraOpen ? (
            <div className="space-y-2">
              <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg border border-border" />
              <div className="flex gap-2">
                <Button onClick={captureImage} className="flex-1">
                  <Camera className="mr-2 h-4 w-4" />{t('capturePhoto')}
                </Button>
                <Button variant="outline" onClick={stopCamera}>{t('cancel')}</Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={startCamera} size="lg" className="flex-1 text-base py-6 hover:scale-[1.02] transition-transform">
                <Camera className="mr-2 h-5 w-5" /> {t('capturePhoto')}
              </Button>
              <Button variant="outline" size="lg" onClick={() => fileInputRef.current?.click()} className="flex-1 text-base py-6 hover:scale-[1.02] transition-transform">
                <Upload className="mr-2 h-5 w-5" /> {t('uploadFromGallery')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 hover:scale-[1.02] transition-all">
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-primary">{counts.healthy}</p>
            <p className="text-sm text-muted-foreground">{t('healthy')}</p>
          </CardContent>
        </Card>
        <Card className="border-destructive/20 bg-gradient-to-br from-destructive/10 to-destructive/5 hover:scale-[1.02] transition-all">
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-destructive">{counts.infected}</p>
            <p className="text-sm text-muted-foreground">{t('infected')}</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-gradient-to-br from-amber-500/10 to-amber-500/5 hover:scale-[1.02] transition-all">
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-muted-foreground">{counts.pending}</p>
            <p className="text-sm text-muted-foreground">{t('pendingScan')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Past Scans */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {trees.map((tree) => (
          <Card key={tree.id} className="border-border hover:shadow-lg hover:scale-[1.01] transition-all duration-300">
            <CardContent className="pt-4 space-y-2">
              {tree.photo_url && (
                <img src={tree.photo_url} alt={tree.tree_id} className="w-full h-32 rounded-lg object-cover border border-border" />
              )}
              <div className="flex items-center justify-between">
                <Badge className={statusColors[tree.status] || ''} variant="outline">
                  {tree.status === 'Healthy' ? t('healthy') : tree.status === 'Infected' ? t('infected') : t('pendingScan')}
                </Badge>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{tree.tree_id}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteScan(tree.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
              {tree.notes && <p className="text-xs text-muted-foreground line-clamp-2">{tree.notes}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
