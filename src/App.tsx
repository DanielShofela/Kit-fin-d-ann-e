import { useState, useEffect } from 'react';
import { 
  Sparkles, Phone, MessageCircle, ShieldCheck, ShoppingBag, 
  ArrowRight, Compass, RefreshCw, Calendar, Eye 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Shared interfaces
import { Category, Kit } from './types';
import { fallbackCategories, fallbackKits } from './defaultData';

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

  // Data Fetching loader
  const fetchData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      // Attempt loading from backend server API
      const catRes = await fetch('/api/categories');
      const kitRes = await fetch('/api/kits');

      if (!catRes.ok || !kitRes.ok) {
        throw new Error('Impossible de se connecter au serveur de données en direct.');
      }

      const catText = await catRes.text();
      const kitText = await kitRes.text();

      // Detect if static host fallbacks/redirects returned HTML instead of JSON
      if (
        catText.trim().startsWith('<!DOCTYPE') || 
        kitText.trim().startsWith('<!DOCTYPE') || 
        catText.trim().startsWith('<html') || 
        kitText.trim().startsWith('<html')
      ) {
        throw new Error('Données serveurs non disponibles sur cet hébergement statique.');
      }

      const catsData = JSON.parse(catText);
      const kitsData = JSON.parse(kitText);

      setCategories(catsData);
      setKits(kitsData);
      setIsStaticMode(false);
      localStorage.setItem('penta_is_static_mode', 'false');
    } catch (err: any) {
      console.warn("Passage en mode de stockage local autonome (Netlify/Hébergement statique détecté):", err.message);
      setIsStaticMode(true);
      localStorage.setItem('penta_is_static_mode', 'true');

      // Initialize from localStorage or default seeds
      const localCatsStr = localStorage.getItem('penta_local_categories');
      const localKitsStr = localStorage.getItem('penta_local_kits');

      let localCats: Category[] = [];
      let localKits: Kit[] = [];

      if (localCatsStr) {
        try {
          localCats = JSON.parse(localCatsStr);
        } catch (e) {
          localCats = fallbackCategories;
        }
      } else {
        localCats = fallbackCategories;
        localStorage.setItem('penta_local_categories', JSON.stringify(fallbackCategories));
      }

      if (localKitsStr) {
        try {
          localKits = JSON.parse(localKitsStr);
        } catch (e) {
          localKits = fallbackKits;
        }
      } else {
        localKits = fallbackKits;
        localStorage.setItem('penta_local_kits', JSON.stringify(fallbackKits));
      }

      setCategories(localCats);
      setKits(localKits);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
      // Return to homepage safely as fallback
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
    if (isStaticMode || passwordInput === 'adminpenta2026') {
      if (passwordInput === 'adminpenta2026') {
        const fakeToken = 'Token-adminpenta2026';
        setToken(fakeToken);
        localStorage.setItem('penta_admin_token', fakeToken);
        if (!isStaticMode) {
          setIsStaticMode(true);
          localStorage.setItem('penta_is_static_mode', 'true');
          fetchData();
        }
        return true;
      }
    }

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput })
      });

      if (!res.ok) {
        if (passwordInput === 'adminpenta2026') {
          const fakeToken = 'Token-adminpenta2026';
          setToken(fakeToken);
          localStorage.setItem('penta_admin_token', fakeToken);
          setIsStaticMode(true);
          localStorage.setItem('penta_is_static_mode', 'true');
          fetchData();
          return true;
        }
        return false;
      }

      const data = await res.json();
      if (data.token) {
        setToken(data.token);
        localStorage.setItem('penta_admin_token', data.token);
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      if (passwordInput === 'adminpenta2026') {
        const fakeToken = 'Token-adminpenta2026';
        setToken(fakeToken);
        localStorage.setItem('penta_admin_token', fakeToken);
        setIsStaticMode(true);
        localStorage.setItem('penta_is_static_mode', 'true');
        fetchData();
        return true;
      }
      return false;
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('penta_admin_token');
    setCurrentView('homepage');
    setViewHistory([{ view: 'homepage' }]);
  };


  // Server & Local Storage CRUD Operations Wrappers
  const handleAddCategory = async (catData: Partial<Category>): Promise<boolean> => {
    const newId = catData.title ? catData.title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-') : `cat-${Date.now()}`;
    const nextOrder = categories.length > 0 ? Math.max(...categories.map(c => c.order || 0)) + 1 : 1;
    const fullCategory: Category = {
      id: newId,
      title: catData.title || '',
      startingAmount: catData.startingAmount || '',
      image: catData.image || '',
      order: nextOrder
    };

    if (isStaticMode) {
      const updatedCats = [...categories, fullCategory];
      setCategories(updatedCats);
      localStorage.setItem('penta_local_categories', JSON.stringify(updatedCats));
      return true;
    }

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(catData)
      });
      if (res.ok) {
        fetchData();
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleUpdateCategory = async (id: string, catData: Partial<Category>): Promise<boolean> => {
    if (isStaticMode) {
      const updatedCats = categories.map(c => c.id === id ? { ...c, ...catData } : c);
      setCategories(updatedCats);
      localStorage.setItem('penta_local_categories', JSON.stringify(updatedCats));
      return true;
    }

    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(catData)
      });
      if (res.ok) {
        fetchData();
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleDeleteCategory = async (id: string): Promise<boolean> => {
    if (isStaticMode) {
      const updatedCats = categories.filter(c => c.id !== id);
      const updatedKits = kits.filter(k => k.categoryId !== id);
      setCategories(updatedCats);
      setKits(updatedKits);
      localStorage.setItem('penta_local_categories', JSON.stringify(updatedCats));
      localStorage.setItem('penta_local_kits', JSON.stringify(updatedKits));
      return true;
    }

    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        fetchData();
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleReorderCategories = async (sortedIds: string[]): Promise<boolean> => {
    if (isStaticMode) {
      const updatedCats = sortedIds.map((id, index) => {
        const cat = categories.find(c => c.id === id);
        return cat ? { ...cat, order: index + 1 } : null;
      }).filter(Boolean) as Category[];
      setCategories(updatedCats);
      localStorage.setItem('penta_local_categories', JSON.stringify(updatedCats));
      return true;
    }

    try {
      const res = await fetch('/api/reorder-categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sortedIds })
      });
      if (res.ok) {
        fetchData();
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
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

    if (isStaticMode) {
      const updatedKits = [...kits, fullKit];
      setKits(updatedKits);
      localStorage.setItem('penta_local_kits', JSON.stringify(updatedKits));
      return true;
    }

    try {
      const res = await fetch('/api/kits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(kitData)
      });
      if (res.ok) {
        fetchData();
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleUpdateKit = async (id: string, kitData: Partial<Kit>): Promise<boolean> => {
    if (isStaticMode) {
      const updatedKits = kits.map(k => k.id === id ? { ...k, ...kitData } : k);
      setKits(updatedKits);
      localStorage.setItem('penta_local_kits', JSON.stringify(updatedKits));
      return true;
    }

    try {
      const res = await fetch(`/api/kits/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(kitData)
      });
      if (res.ok) {
        fetchData();
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleDeleteKit = async (id: string): Promise<boolean> => {
    if (isStaticMode) {
      const updatedKits = kits.filter(k => k.id !== id);
      setKits(updatedKits);
      localStorage.setItem('penta_local_kits', JSON.stringify(updatedKits));
      return true;
    }

    try {
      const res = await fetch(`/api/kits/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        fetchData();
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleReorderKits = async (sortedIds: string[]): Promise<boolean> => {
    if (isStaticMode) {
      const updatedKits = sortedIds.map((id, index) => {
        const kit = kits.find(k => k.id === id);
        return kit ? { ...kit, order: index + 1 } : null;
      }).filter(Boolean) as Kit[];
      const remainingKits = kits.filter(k => !sortedIds.includes(k.id));
      const finalKits = [...updatedKits, ...remainingKits];
      setKits(finalKits);
      localStorage.setItem('penta_local_kits', JSON.stringify(finalKits));
      return true;
    }

    try {
      const res = await fetch('/api/reorder-kits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sortedIds })
      });
      if (res.ok) {
        fetchData();
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  // Targeting variables for view rendering
  const activeCategory = categories.find(c => c.id === activeCategoryId);
  const activeKit = kits.find(k => k.id === activeKitId);

  // Is back button present
  const isBackPresent = viewHistory.length > 1 ? handleBack : null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
      
      {/* Top sticky navigation header */}
      <Header
        currentView={currentView}
        onNavigate={(v) => handleNavigate(v as any)}
        onBack={isBackPresent}
        isAdmin={!!token}
        onLogout={handleLogout}
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
                  }} />

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
                        <h4 className="font-bold text-amber-900 text-xs uppercase tracking-wider">Pourquoi s'inscrire dès aujourd'hui ?</h4>
                        <p className="text-[11px] text-amber-800 leading-[1.45] mt-1.5">
                          Toutes les grandes enseignes connaissent des ruptures de riz et d'électroménager en décembre. En souscrivant aujourd'hui avec Penta Gad, votre kit est <strong>bloqué, emballé et stocké en priorité</strong> pour vous.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* FAQ Quick block */}
                  <div className="max-w-md mx-auto px-6 pb-12">
                    <div className="bg-white border rounded-2.5xl p-5 space-y-4">
                      <h4 className="font-display font-black text-xs uppercase tracking-wider text-slate-700">FAQ & Fonctionnement</h4>
                      
                      <div className="space-y-3 text-xs leading-[1.4]">
                        <div className="space-y-1">
                          <p className="font-bold text-slate-800">1. Comment se fait le paiement ?</p>
                          <p className="text-slate-500">Un agent commercial Penta Gad fixe avec vous une collecte périodique (journalière, hebdomadaire ou mensuelle) à votre convenance.</p>
                        </div>
                        <div className="space-y-1 border-t pt-2.5">
                          <p className="font-bold text-slate-800">2. Quand a lieu la livraison ?</p>
                          <p className="text-slate-500">La distribution festive commence dès la mi-décembre pour vous permettre d'anticiper sereinement vos fêtes.</p>
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
                />
              )}

            </div>
          )}

        </AnimatePresence>
      </main>

      {/* Corporate information Footer */}
      <Footer whatsappNumber={WHATSAPP_HOTLINE} />

      {/* Floating Action Button for Mobile Chat Support */}
      {currentView !== 'admin' && (
        <a
          href={`https://wa.me/${WHATSAPP_HOTLINE.replace(/[^0-9+]/g, '')}`}
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
          whatsappNumber={WHATSAPP_HOTLINE}
        />
      )}

    </div>
  );
}
