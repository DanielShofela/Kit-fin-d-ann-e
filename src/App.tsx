import { useState, useEffect } from 'react';
import { 
  Sparkles, Phone, MessageCircle, ShieldCheck, ShoppingBag, 
  ArrowRight, Compass, RefreshCw, Calendar, Eye 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Shared interfaces
import { Category, Kit, SiteSettings } from './types';
import { fallbackCategories, fallbackKits, fallbackSettings } from './defaultData';

// Firebase & Firestore setup
import { 
  collection, getDocs, getDoc, setDoc, doc, deleteDoc, writeBatch, query, orderBy 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';

// Modular Components
import Header from './components/Header';
import Hero from './components/Hero';
import CategoryCarousel from './components/CategoryCarousel';
import CategoryView from './components/CategoryView';
import KitDetailsView from './components/KitDetailsView';
import RequestFormModal from './components/RequestFormModal';
import AdminPanel from './components/AdminPanel';
import Footer from './components/Footer';

export default function App() {
  // Application Data States
  const [categories, setCategories] = useState<Category[]>([]);
  const [kits, setKits] = useState<Kit[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(fallbackSettings);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isStaticMode, setIsStaticMode] = useState<boolean>(() => {
    return localStorage.getItem('penta_is_static_mode') === 'true';
  });

  // Authentication Token State
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('penta_admin_token');
  });

  // Navigation Routing States
  const [currentView, setCurrentView] = useState<'homepage' | 'category' | 'kit-details' | 'admin'>('homepage');
  const [viewHistory, setViewHistory] = useState<Array<{ view: 'homepage' | 'category' | 'kit-details' | 'admin'; activeCategory?: string; activeKit?: string }>>([{ view: 'homepage' }]);
  
  // Specific Resource Targets
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [activeKitId, setActiveKitId] = useState<string | null>(null);

  // Client Subscription Form state
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Global Customizable WhatsApp Phone Number
  const WHATSAPP_HOTLINE = "+2250703397921";

  // Data Fetching loader from Firebase Firestore
  const fetchData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      // Fetch categories, kits, and settings from Firebase Firestore
      const cats: Category[] = [];
      const kts: Kit[] = [];
      let siteSettings: SiteSettings = { ...fallbackSettings };

      // Try fetching our customizable site settings first
      try {
        const settingsRef = doc(db, 'settings', 'site_config');
        const settingsSnap = await getDoc(settingsRef);
        if (settingsSnap.exists()) {
          siteSettings = { ...fallbackSettings, ...settingsSnap.data() } as SiteSettings;
        } else {
          console.log("Les configurations du site sont vides en base. Initialisation...");
          await setDoc(settingsRef, fallbackSettings);
        }
      } catch (err) {
        console.warn("Impossible de charger les configurations du site, utilisation des valeurs de secours :", err);
      }

      try {
        const catQuery = query(collection(db, 'categories'), orderBy('order', 'asc'));
        const catSnap = await getDocs(catQuery);
        catSnap.forEach((docSnap) => {
          cats.push({ id: docSnap.id, ...docSnap.data() } as Category);
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'categories');
      }

      try {
        const kitQuery = query(collection(db, 'kits'), orderBy('order', 'asc'));
        const kitSnap = await getDocs(kitQuery);
        kitSnap.forEach((docSnap) => {
          kts.push({ id: docSnap.id, ...docSnap.data() } as Kit);
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'kits');
      }

      // If Firestore is empty (new setup), seed with fallback presets immediately so the site is instantly alive
      if (cats.length === 0) {
        console.log("Firestore est vide. Initialisation avec les kits et catégories de démonstration...");
        
        for (const cat of fallbackCategories) {
          try {
            await setDoc(doc(db, 'categories', cat.id), cat);
            cats.push(cat);
          } catch (err) {
            handleFirestoreError(err, OperationType.CREATE, `categories/${cat.id}`);
          }
        }

        for (const kit of fallbackKits) {
          try {
            await setDoc(doc(db, 'kits', kit.id), kit);
            kts.push(kit);
          } catch (err) {
            handleFirestoreError(err, OperationType.CREATE, `kits/${kit.id}`);
          }
        }
      }

      // Sort lists by order property
      cats.sort((a, b) => (a.order || 0) - (b.order || 0));
      kts.sort((a, b) => (a.order || 0) - (b.order || 0));

      setCategories(cats);
      setKits(kts);
      setSettings(siteSettings);
      setIsStaticMode(true); // Always keep in static/decentralized Firestore direct mode
      localStorage.setItem('penta_is_static_mode', 'true');
    } catch (err: any) {
      console.warn("Erreur de connexion Firebase Firestore. Utilisation de la mémoire locale :", err.message);
      setErrorMsg("Une erreur de communication est survenue. Chargement en mode local.");
      
      setCategories(fallbackCategories);
      setKits(fallbackKits);
      setSettings(fallbackSettings);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Dynamically update browser tab Title and Favicon based on site configuration
  useEffect(() => {
    if (settings) {
      const name = settings.headerBrand || "PENTA GAD";
      const subtitle = settings.headerSubtitle || "Distribution";
      document.title = `${name} | ${subtitle}`;

      let faviconLink = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!faviconLink) {
        faviconLink = document.createElement('link');
        faviconLink.rel = 'icon';
        document.head.appendChild(faviconLink);
      }
      
      if (settings.logoUrl) {
        faviconLink.href = settings.logoUrl;
      } else {
        // Fallback to unicode emoji svg representing the gift icon
        faviconLink.href = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎁</text></svg>";
      }
    }
  }, [settings]);

  // Safe Navigation Stack Helpers
  const handleNavigate = (view: 'homepage' | 'category' | 'kit-details' | 'admin', categoryId?: string, kitId?: string) => {
    if (categoryId) setActiveCategoryId(categoryId);
    if (kitId) setActiveKitId(kitId);

    setCurrentView(view);
    
    // Add item to history stack
    setViewHistory(prev => [
      ...prev,
      { view, activeCategory: categoryId || activeCategoryId || undefined, activeKit: kitId || activeKitId || undefined }
    ]);
  };

  const handleBack = () => {
    if (viewHistory.length <= 1) {
      setCurrentView('homepage');
      setViewHistory([{ view: 'homepage' }]);
      return;
    }

    const historyCopy = [...viewHistory];
    historyCopy.pop(); // Remove current screen
    const previousState = historyCopy[historyCopy.length - 1];

    if (previousState) {
      setCurrentView(previousState.view);
      if (previousState.activeCategory) setActiveCategoryId(previousState.activeCategory);
      if (previousState.activeKit) setActiveKitId(previousState.activeKit);
      setViewHistory(historyCopy);
    } else {
      setCurrentView('homepage');
      setViewHistory([{ view: 'homepage' }]);
    }
  };

  // Auth Operations
  const handleLogin = async (passwordInput: string): Promise<boolean> => {
    const cleanPass = (passwordInput || '').trim();
    if (cleanPass === '7056Amapiano20!!' || cleanPass.toLowerCase() === '7056amapiano20!!') {
      const fakeToken = 'Token-adminpenta2026';
      setToken(fakeToken);
      localStorage.setItem('penta_admin_token', fakeToken);
      return true;
    }
    return false;
  };

  const handleUpdateSettings = async (newSettings: Partial<SiteSettings>): Promise<boolean> => {
    try {
      const merged = { ...settings, ...newSettings };
      await setDoc(doc(db, 'settings', 'site_config'), merged);
      setSettings(merged);
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'settings/site_config');
      return false;
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('penta_admin_token');
    setCurrentView('homepage');
    setViewHistory([{ view: 'homepage' }]);
  };


  // Direct Firestore Cloud CRUD Operations Wrappers
  const handleAddCategory = async (catData: Partial<Category>): Promise<boolean> => {
    const newId = catData.title 
      ? catData.title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-') 
      : `cat-${Date.now()}`;
    const nextOrder = categories.length > 0 ? Math.max(...categories.map(c => c.order || 0)) + 1 : 1;
    const fullCategory: Category = {
      id: newId,
      title: catData.title || '',
      startingAmount: catData.startingAmount || '',
      image: catData.image || '',
      order: nextOrder
    };

    try {
      await setDoc(doc(db, 'categories', newId), fullCategory);
      await fetchData();
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `categories/${newId}`);
    }
  };

  const handleUpdateCategory = async (id: string, catData: Partial<Category>): Promise<boolean> => {
    try {
      const catRef = doc(db, 'categories', id);
      await setDoc(catRef, catData, { merge: true });
      await fetchData();
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `categories/${id}`);
    }
  };

  const handleDeleteCategory = async (id: string): Promise<boolean> => {
    try {
      // Delete the category document
      await deleteDoc(doc(db, 'categories', id));
      
      // Cascade delete kits belonging to this category
      const targetKits = kits.filter(k => k.categoryId === id);
      for (const k of targetKits) {
        await deleteDoc(doc(db, 'kits', k.id));
      }

      await fetchData();
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `categories/${id}`);
    }
  };

  const handleReorderCategories = async (sortedIds: string[]): Promise<boolean> => {
    try {
      const batch = writeBatch(db);
      sortedIds.forEach((id, index) => {
        const catRef = doc(db, 'categories', id);
        batch.update(catRef, { order: index + 1 });
      });
      await batch.commit();
      await fetchData();
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'categories/reorder');
    }
  };

  const handleAddKit = async (kitData: Partial<Kit>): Promise<boolean> => {
    const newId = `kit-${Date.now()}`;
    const nextOrder = kits.length > 0 ? Math.max(...kits.map(k => k.order || 0)) + 1 : 1;
    const fullKit: Kit = {
      id: newId,
      categoryId: kitData.categoryId || '',
      name: kitData.name || '',
      dailyAmount: kitData.dailyAmount || '',
      totalValue: kitData.totalValue || '',
      images: kitData.images || [],
      products: kitData.products || [],
      benefits: kitData.benefits || [],
      deliveryInfo: kitData.deliveryInfo || '',
      order: nextOrder
    };

    try {
      await setDoc(doc(db, 'kits', newId), fullKit);
      await fetchData();
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `kits/${newId}`);
    }
  };

  const handleUpdateKit = async (id: string, kitData: Partial<Kit>): Promise<boolean> => {
    try {
      const kitRef = doc(db, 'kits', id);
      await setDoc(kitRef, kitData, { merge: true });
      await fetchData();
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `kits/${id}`);
    }
  };

  const handleDeleteKit = async (id: string): Promise<boolean> => {
    try {
      await deleteDoc(doc(db, 'kits', id));
      await fetchData();
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `kits/${id}`);
    }
  };

  const handleReorderKits = async (sortedIds: string[]): Promise<boolean> => {
    try {
      const batch = writeBatch(db);
      sortedIds.forEach((id, index) => {
        const kitRef = doc(db, 'kits', id);
        batch.update(kitRef, { order: index + 1 });
      });
      await batch.commit();
      await fetchData();
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'kits/reorder');
    }
  };

  // Targeting variables for view rendering
  const activeCategory = categories.find(c => c.id === activeCategoryId);
  const activeKit = kits.find(k => k.id === activeKitId);

  // Is back button present
  const isBackPresent = viewHistory.length > 1 ? handleBack : null;

  const activeWhatsApp = settings.whatsappHotline || WHATSAPP_HOTLINE;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
      
      {/* Top sticky navigation header */}
      <Header
        currentView={currentView}
        onNavigate={(v) => handleNavigate(v as any)}
        onBack={isBackPresent}
        isAdmin={!!token}
        onLogout={handleLogout}
        settings={settings}
      />

      {/* Main Core Router View Wrapper */}
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          
          {loading ? (
            <div className="w-full min-h-[70vh] flex flex-col items-center justify-center p-8">
              <RefreshCw className="w-8 h-8 text-[#0D47FF] animate-spin mb-3.5" />
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest animate-pulse">
                Chargement du catalogue fete...
              </p>
            </div>
          ) : errorMsg ? (
            <div className="max-w-md mx-auto my-12 p-8 bg-white border border-red-100 rounded-3xl shadow-sm text-center">
              <span className="text-3xl">⚠️</span>
              <h3 className="font-display font-extrabold text-slate-800 text-md mt-4">Erreur de connexion</h3>
              <p className="text-xs text-slate-550 mt-2 leading-relaxed">{errorMsg}</p>
              <button
                onClick={fetchData}
                className="mt-6 font-display font-bold text-xs bg-[#0D47FF] hover:bg-blue-700 text-white py-3 px-5 rounded-xl shadow-md cursor-pointer"
              >
                Actualiser
              </button>
            </div>
          ) : (
            <div key={currentView} className="w-full">
              
              {/* VIEW 1: HOMEPAGE */}
              {currentView === 'homepage' && (
                <div className="w-full space-y-0">
                  
                  {/* Visual Hero Campaign */}
                  <Hero onDiscover={() => {
                    const el = document.getElementById('category_swipe_carousel');
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }} settings={settings} />

                  {/* Horizontal swipe Categories list */}
                  <CategoryCarousel
                    categories={categories}
                    kits={kits}
                    onSelectCategory={(id) => handleNavigate('category', id)}
                  />

                  {/* Highlight of select premium packs */}
                  <div className="max-w-md mx-auto px-6 py-8 space-y-6">
                    <div className="flex flex-col text-left">
                      <span className="text-[#0D47FF] text-[10px] font-extrabold uppercase tracking-widest">Gamme Élite</span>
                      <h2 className="font-display font-extrabold text-[15px] uppercase tracking-wider text-slate-900 mt-0.5">
                        Packs Vedettes De Fin d'Année
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-5">
                      {kits.slice(0, 3).map((kit) => {
                        const associatedCat = categories.find(c => c.id === kit.categoryId);
                        return (
                          <div
                            key={kit.id}
                            onClick={() => handleNavigate('kit-details', kit.categoryId, kit.id)}
                            className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-4 p-3 cursor-pointer"
                          >
                            <img
                              src={kit.images && kit.images[0] ? kit.images[0] : 'https://picsum.photos/seed/elite-kit/200/200'}
                              alt={kit.name}
                              className="w-18 h-18 object-cover rounded-xl shrink-0 border border-slate-50 bg-slate-50"
                              referrerPolicy="no-referrer"
                            />
                            
                            <div className="min-w-0 flex-1">
                              {associatedCat && (
                                <span className="text-[8px] font-extrabold bg-[#0D47FF]/10 text-[#0D47FF] px-1.5 py-0.5 rounded uppercase tracking-wider">
                                  Gamme {associatedCat.title}
                                </span>
                              )}
                              <h3 className="font-display font-black text-sm text-slate-900 mt-1 truncate">
                                {kit.name}
                              </h3>
                              <p className="text-[10px] font-bold text-slate-400 font-mono tracking-wider uppercase mt-1">
                                {kit.dailyAmount} <span className="font-normal font-sans lowercase">/ jour</span>
                              </p>
                            </div>

                            <div className="w-8 h-8 rounded-full bg-[#0D47FF]/10 flex items-center justify-center shrink-0">
                              <Eye className="w-4 h-4 text-[#0D47FF]" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Holiday Countdown Concept Line */}
                  <div className="max-w-md mx-auto px-6 pb-12">
                    <div className="bg-gradient-to-tr from-amber-50 to-amber-100/50 border border-amber-200 p-5 rounded-2.5xl space-y-3 shadow-sm text-center flex flex-col items-center">
                      <Calendar className="w-7 h-7 text-amber-600 animate-pulse" />
                      <div className="text-center">
                        <h4 className="font-bold text-amber-900 text-xs uppercase tracking-wider">{settings.infoTitle}</h4>
                        <p className="text-[11px] text-amber-800 leading-[1.45] mt-1.5">
                          {settings.infoDescription}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* FAQ Quick block */}
                  <div className="max-w-md mx-auto px-6 pb-12">
                    <div className="bg-white border rounded-2.5xl p-5 space-y-4">
                      <h4 className="font-display font-black text-xs uppercase tracking-wider text-slate-700">{settings.faqTitle}</h4>
                      
                      <div className="space-y-3 text-xs leading-[1.4]">
                        <div className="space-y-1">
                          <p className="font-bold text-slate-800">1. {settings.faqQ1}</p>
                          <p className="text-slate-500">{settings.faqA1}</p>
                        </div>
                        <div className="space-y-1 border-t pt-2.5">
                          <p className="font-bold text-slate-800">2. {settings.faqQ2}</p>
                          <p className="text-slate-500">{settings.faqA2}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* VIEW 2: CATEGORY VIEW */}
              {currentView === 'category' && activeCategory && (
                <CategoryView
                  category={activeCategory}
                  kits={kits.filter(k => k.categoryId === activeCategoryId)}
                  onSelectKit={(kitId) => handleNavigate('kit-details', activeCategoryId || undefined, kitId)}
                  onBack={handleBack}
                />
              )}

              {/* VIEW 3: KIT DETAILS VIEW */}
              {currentView === 'kit-details' && activeKit && activeCategory && (
                <KitDetailsView
                  kit={activeKit}
                  category={activeCategory}
                  onBack={handleBack}
                  onChooseKit={() => setIsFormOpen(true)}
                />
              )}

              {/* VIEW 4: ADMIN */}
              {currentView === 'admin' && (
                <AdminPanel
                  categories={categories}
                  kits={kits}
                  token={token}
                  onLogin={handleLogin}
                  onRefreshData={fetchData}
                  onAddCategory={handleAddCategory}
                  onUpdateCategory={handleUpdateCategory}
                  onDeleteCategory={handleDeleteCategory}
                  onReorderCategories={handleReorderCategories}
                  onAddKit={handleAddKit}
                  onUpdateKit={handleUpdateKit}
                  onDeleteKit={handleDeleteKit}
                  onReorderKits={handleReorderKits}
                  settings={settings}
                  onUpdateSettings={handleUpdateSettings}
                />
              )}

            </div>
          )}

        </AnimatePresence>
      </main>

      {/* Corporate information Footer */}
      <Footer 
        whatsappNumber={activeWhatsApp} 
        settings={settings} 
        onGoAdmin={() => handleNavigate('admin')}
      />

      {/* Floating Action Button for Mobile Chat Support */}
      {currentView !== 'admin' && (
        <a
          href={`https://wa.me/${activeWhatsApp.replace(/[^0-9+]/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-24 right-4 z-40 bg-emerald-500 hover:bg-emerald-600 text-white p-3.5 rounded-full shadow-lg hover:shadow-emerald-500/20 active:scale-95 transition-all text-sm flex items-center justify-center cursor-pointer border-2 border-white"
          title="Besoin d'aide ? WhatsApp"
        >
          <MessageCircle className="w-6 h-6" />
        </a>
      )}

      {/* Global Subscription Lead Form Popup */}
      {isFormOpen && activeKit && (
        <RequestFormModal
          kit={activeKit}
          onClose={() => setIsFormOpen(false)}
          whatsappNumber={activeWhatsApp}
        />
      )}

    </div>
  );
}
