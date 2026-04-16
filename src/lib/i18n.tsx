import React, { createContext, useContext, useState, useCallback } from 'react';

export type Language = 'en' | 'hi';

const translations = {
  en: {
    // Auth
    login: 'Login',
    signup: 'Sign Up',
    email: 'Email',
    password: 'Password',
    fullName: 'Full Name',
    forgotPassword: 'Forgot Password?',
    resetPassword: 'Reset Password',
    sendResetLink: 'Send Reset Link',
    backToLogin: 'Back to Login',
    noAccount: "Don't have an account?",
    haveAccount: 'Already have an account?',
    loginSubtitle: 'Sign in to your agro-ecosystem platform',
    signupSubtitle: 'Create your account to get started',
    resetSubtitle: 'Enter your email to receive a reset link',
    
    // Nav
    dashboard: 'Dashboard',
    wheatManagement: 'Wheat Management',
    oilPalmAnalytics: 'Oil Palm Analytics',
    marketInsights: 'Market Insights',
    profitPlanner: 'Profit Planner',
    language: 'Language',
    logout: 'Logout',
    
    // Dashboard
    welcomeBack: 'Welcome Back',
    dashboardSubtitle: 'Overview of your agro-ecosystem',
    totalPlots: 'Total Plots',
    healthyTrees: 'Healthy Trees',
    totalArea: 'Total Area',
    localLandValue: 'Local Land Value',
    landRatePerAcre: 'Current Rate per Acre',
    landRatePerBigha: 'Current Rate per Bigha',
    estimatedLocation: 'Estimated Location',
    detectingLocation: 'Detecting location...',
    
    // Wheat
    wheatPlots: 'Wheat Plots',
    addPlot: 'Add Plot',
    plotName: 'Plot Name',
    length: 'Length (m)',
    breadth: 'Breadth (m)',
    area: 'Area (m²)',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    infectedPlots: 'Infected Plots',
    
    // Oil Palm
    healthMonitoring: 'Health Monitoring',
    addTree: 'Add Tree',
    treeId: 'Tree ID',
    status: 'Status',
    healthy: 'Healthy',
    infected: 'Infected',
    pendingScan: 'Pending Scan',
    lastScan: 'Last Scan',
    location: 'Location',
    capturePhoto: 'Capture Photo',
    uploadFromGallery: 'Upload from Gallery',
    notes: 'Notes',
    photo: 'Photo',
    scanTree: 'Scan Tree',
    quickDiagnosis: 'Quick Diagnosis',
    quickDiagnosisDesc: 'Take or upload a photo of your oil palm tree to get instant AI health diagnosis',
    diseaseName: 'Disease',
    confidence: 'Confidence',
    solution: 'Solution',
    scanAnother: 'Scan Another',
    
    // Market
    marketOverview: 'Market Overview',
    comingSoon: 'Coming Soon',
    marketDesc: 'Real-time market data and insights will appear here.',
    
    // AI Analysis
    analyzeWithAI: 'Analyze with AI',
    analyzing: 'Analyzing...',
    aiAnalysis: 'AI Analysis',
    retake: 'Retake',
    aiHealthReport: 'AI Health Report',
    captureAndAnalyze: 'Capture & Analyze',
    
    // Crop Advisory
    cropAdvisory: 'Smart Crop Advisory',
    cropAdvisoryDesc: 'Ask any farming question — get expert AI advice in simple language',
    askAnything: 'Ask me anything about farming!',
    cropAdvisoryHint: 'Tap a question below or type your own',
    typeQuestion: 'Type your farming question...',
    clearChat: 'Clear',
    noResponse: 'No response received. Please try again.',

    // Profit Planner
    profitPlannerTitle: 'Profit Planner',
    profitPlannerDesc: 'Predict whether to sell now or hold your harvest for better prices',
    sellVsHold: 'Sell vs. Hold Calculator',
    cropType: 'Crop Type',
    harvestQuantity: 'Harvest Quantity (Quintals)',
    calculate: 'Calculate Projection',
    projectedProfitLoss: 'Projected Profit/Loss',
    sellNow: 'Sell Now',
    holdThreeMonths: 'Hold 3 Months',
    holdSixMonths: 'Hold 6 Months',
    profit: 'Profit',
    loss: 'Loss',
    storageCost: 'Storage Cost',
    projectedPrice: 'Projected Price',
    netReturn: 'Net Return',
    selectCrop: 'Select a crop',
    wheat: 'Wheat',
    rice: 'Rice',
    pulses: 'Pulses (Dal)',
    mustard: 'Mustard',
    soybean: 'Soybean',
    sugarcane: 'Sugarcane',

    // Weather
    weather: 'Weather',
    farmingAdvice: 'Farming Advice',
    fetchingWeather: 'Fetching weather...',
    weatherUnavailable: 'Weather data unavailable',
    temperature: 'Temperature',
    
    // Disease Alert
    diseaseAlert: 'Disease Alert',
    diseaseAlertMsg: 'High risk of Yellow Rust in wheat-growing regions. Apply fungicide within 48 hours.',
    diseaseAlertMsgHi: 'गेहूं उगाने वाले क्षेत्रों में पीला रतुआ का उच्च जोखिम। 48 घंटों के भीतर कवकनाशी लगाएं।',
    
    // Activity
    activityTimeline: 'Activity Timeline',
    recentActivity: 'Recent Activity',
    noActivity: 'No recent activity',
    
    // Crop Growth
    cropGrowthTrend: 'Crop Growth Trend',
    month1: 'Month 1',
    month2: 'Month 2',
    month3: 'Month 3',
    growthPercent: 'Growth %',
    
    // Profit chart
    profitLossStorage: 'Profit vs Storage Cost',

    sqm: 'm²',
  },
  hi: {
    login: 'लॉगिन',
    signup: 'साइन अप',
    email: 'ईमेल',
    password: 'पासवर्ड',
    fullName: 'पूरा नाम',
    forgotPassword: 'पासवर्ड भूल गए?',
    resetPassword: 'पासवर्ड रीसेट',
    sendResetLink: 'रीसेट लिंक भेजें',
    backToLogin: 'लॉगिन पर वापस जाएं',
    noAccount: 'खाता नहीं है?',
    haveAccount: 'पहले से खाता है?',
    loginSubtitle: 'अपने कृषि-पारिस्थितिकी मंच में साइन इन करें',
    signupSubtitle: 'शुरू करने के लिए अपना खाता बनाएं',
    resetSubtitle: 'रीसेट लिंक प्राप्त करने के लिए अपना ईमेल दर्ज करें',
    
    dashboard: 'डैशबोर्ड',
    wheatManagement: 'गेहूं प्रबंधन',
    oilPalmAnalytics: 'ऑयल पाम एनालिटिक्स',
    marketInsights: 'बाजार अंतर्दृष्टि',
    profitPlanner: 'लाभ योजनाकार',
    language: 'भाषा',
    logout: 'लॉगआउट',
    
    welcomeBack: 'वापस स्वागत है',
    dashboardSubtitle: 'आपके कृषि-पारिस्थितिकी का अवलोकन',
    totalPlots: 'कुल भूखंड',
    healthyTrees: 'स्वस्थ पेड़',
    totalArea: 'कुल क्षेत्रफल',
    localLandValue: 'स्थानीय भूमि मूल्य',
    landRatePerAcre: 'प्रति एकड़ वर्तमान दर',
    landRatePerBigha: 'प्रति बीघा वर्तमान दर',
    estimatedLocation: 'अनुमानित स्थान',
    detectingLocation: 'स्थान पता लगा रहा है...',
    
    wheatPlots: 'गेहूं के भूखंड',
    addPlot: 'भूखंड जोड़ें',
    plotName: 'भूखंड का नाम',
    length: 'लंबाई (मी)',
    breadth: 'चौड़ाई (मी)',
    area: 'क्षेत्रफल (वर्ग मी)',
    save: 'सहेजें',
    cancel: 'रद्द करें',
    delete: 'हटाएं',
    edit: 'संपादित करें',
    infectedPlots: 'संक्रमित भूखंड',
    
    healthMonitoring: 'स्वास्थ्य निगरानी',
    addTree: 'पेड़ जोड़ें',
    treeId: 'पेड़ आईडी',
    status: 'स्थिति',
    healthy: 'स्वस्थ',
    infected: 'संक्रमित',
    pendingScan: 'स्कैन लंबित',
    lastScan: 'अंतिम स्कैन',
    location: 'स्थान',
    capturePhoto: 'फोटो लें',
    uploadFromGallery: 'गैलरी से अपलोड करें',
    notes: 'टिप्पणियाँ',
    photo: 'फोटो',
    scanTree: 'पेड़ स्कैन करें',
    quickDiagnosis: 'तुरंत जांच',
    quickDiagnosisDesc: 'अपने ऑयल पाम पेड़ की फोटो लें या अपलोड करें — तुरंत AI स्वास्थ्य जांच पाएं',
    diseaseName: 'रोग',
    confidence: 'विश्वसनीयता',
    solution: 'समाधान',
    scanAnother: 'दूसरा स्कैन करें',
    
    marketOverview: 'बाजार अवलोकन',
    comingSoon: 'जल्द आ रहा है',
    marketDesc: 'रीयल-टाइम बाजार डेटा और अंतर्दृष्टि यहां दिखाई देगी।',
    
    analyzeWithAI: 'AI से जांच करें',
    analyzing: 'जांच हो रही है...',
    aiAnalysis: 'AI विश्लेषण',
    retake: 'दोबारा लें',
    aiHealthReport: 'AI स्वास्थ्य रिपोर्ट',
    captureAndAnalyze: 'फोटो लें और जांचें',
    
    cropAdvisory: 'स्मार्ट फसल सलाहकार',
    cropAdvisoryDesc: 'खेती से जुड़ा कोई भी सवाल पूछें — आसान भाषा में AI सलाह पाएं',
    askAnything: 'खेती के बारे में कुछ भी पूछें!',
    cropAdvisoryHint: 'नीचे कोई सवाल चुनें या अपना खुद का लिखें',
    typeQuestion: 'अपना खेती का सवाल लिखें...',
    clearChat: 'मिटाएं',
    noResponse: 'कोई जवाब नहीं मिला। कृपया फिर से कोशिश करें।',

    profitPlannerTitle: 'लाभ योजनाकार',
    profitPlannerDesc: 'अपनी फसल बेचें या रखें — बेहतर मूल्य की भविष्यवाणी करें',
    sellVsHold: 'बेचें बनाम रखें कैलकुलेटर',
    cropType: 'फसल का प्रकार',
    harvestQuantity: 'फसल की मात्रा (क्विंटल)',
    calculate: 'अनुमान लगाएं',
    projectedProfitLoss: 'अनुमानित लाभ/हानि',
    sellNow: 'अभी बेचें',
    holdThreeMonths: '3 महीने रखें',
    holdSixMonths: '6 महीने रखें',
    profit: 'लाभ',
    loss: 'हानि',
    storageCost: 'भंडारण लागत',
    projectedPrice: 'अनुमानित मूल्य',
    netReturn: 'शुद्ध आय',
    selectCrop: 'फसल चुनें',
    wheat: 'गेहूं',
    rice: 'चावल',
    pulses: 'दालें',
    mustard: 'सरसों',
    soybean: 'सोयाबीन',
    sugarcane: 'गन्ना',

    weather: 'मौसम',
    farmingAdvice: 'खेती सलाह',
    fetchingWeather: 'मौसम जानकारी ला रहे हैं...',
    weatherUnavailable: 'मौसम डेटा उपलब्ध नहीं',
    temperature: 'तापमान',

    diseaseAlert: 'रोग चेतावनी',
    diseaseAlertMsg: 'High risk of Yellow Rust in wheat-growing regions. Apply fungicide within 48 hours.',
    diseaseAlertMsgHi: 'गेहूं उगाने वाले क्षेत्रों में पीला रतुआ का उच्च जोखिम। 48 घंटों के भीतर कवकनाशी लगाएं।',

    activityTimeline: 'गतिविधि समयरेखा',
    recentActivity: 'हालिया गतिविधि',
    noActivity: 'कोई हालिया गतिविधि नहीं',

    cropGrowthTrend: 'फसल वृद्धि रुझान',
    month1: 'महीना 1',
    month2: 'महीना 2',
    month3: 'महीना 3',
    growthPercent: 'वृद्धि %',

    profitLossStorage: 'लाभ बनाम भंडारण लागत',

    sqm: 'वर्ग मी',
  },
} as const;

type TranslationKey = keyof typeof translations.en;

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const t = useCallback(
    (key: TranslationKey): string => {
      return translations[language][key] || key;
    },
    [language]
  );

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within I18nProvider');
  return context;
}
