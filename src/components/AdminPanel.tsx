import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash2, ArrowUp, ArrowDown, Save, X, Lock, 
  Settings, CheckCircle, RefreshCcw, Tag, ShoppingBag, Eye,
  Image as ImageIcon, HelpCircle, Layers, ClipboardList, Info
} from 'lucide-react';
import { Category, Kit } from '../types';

interface AdminPanelProps {
  categories: Category[];
  kits: Kit[];
  token: string | null;
  onLogin: (password: string) => Promise<boolean>;
  onRefreshData: () => void;
  // Category Callbacks
  onAddCategory: (category: Partial<Category>) => Promise<boolean>;
  onUpdateCategory: (id: string, category: Partial<Category>) => Promise<boolean>;
  onDeleteCategory: (id: string) => Promise<boolean>;
  onReorderCategories: (sortedIds: string[]) => Promise<boolean>;
  // Kit Callbacks
  onAddKit: (kit: Partial<Kit>) => Promise<boolean>;
  onUpdateKit: (id: string, kit: Partial<Kit>) => Promise<boolean>;
  onDeleteKit: (id: string) => Promise<boolean>;
  onReorderKits: (sortedIds: string[]) => Promise<boolean>;
}

export default function AdminPanel({
  categories,
  kits,
  token,
  onLogin,
  onRefreshData,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onReorderCategories,
  onAddKit,
  onUpdateKit,
  onDeleteKit,
  onReorderKits
}: AdminPanelProps) {
  
  // Login State
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'categories' | 'kits'>('categories');

  // Selected Category filter for Kits list
  const [selectedCatFilter, setSelectedCatFilter] = useState<string>('all');

  // Editing Categories
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [catEditingId, setCatEditingId] = useState<string | null>(null); // null means adding
  const [catForm, setCatForm] = useState({
    title: '',
    startingAmount: '500 FCFA / jour',
    image: '/src/assets/images/food_pack_bronze_1781612322822.jpg'
  });

  // Editing Kits
  const [isKitModalOpen, setIsKitModalOpen] = useState(false);
  const [kitEditingId, setKitEditingId] = useState<string | null>(null); // null means adding
  const [kitForm, setKitForm] = useState({
    categoryId: '',
    name: '',
    dailyAmount: '1 000 FCFA / jour',
    totalValue: '90 000 FCFA',
    images: ['https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600'],
    products: [] as string[],
    benefits: [] as string[],
    deliveryInfo: 'Livraison gratuite en Décembre.'
  });

  // Temp state for key lists
  const [productInput, setProductInput] = useState('');
  const [benefitInput, setBenefitInput] = useState('');
  const [imageInput, setImageInput] = useState('');

  // Status message
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => {
      setStatusMessage(null);
    }, 4000);
  };

  const [isUploading, setIsUploading] = useState(false);

  const uploadImageFile = async (file: File): Promise<string | null> => {
    setIsUploading(true);
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
      });

      const base64Data = await base64Promise;

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: file.name,
          type: file.type,
          data: base64Data
        })
      });

      if (!res.ok) {
        let errorMessage = 'Erreur lors du téléversement';
        try {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errData = await res.json();
            errorMessage = errData.error || errorMessage;
          } else {
            const textData = await res.text();
            errorMessage = textData.substring(0, 150) || res.statusText;
          }
        } catch (e) {
          errorMessage = `Erreur (${res.status}): ${res.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      setIsUploading(false);
      return data.url;
    } catch (err: any) {
      console.error(err);
      showStatus(err.message || 'Erreur lors de l’envoi de l’image', 'error');
      setIsUploading(false);
      return null;
    }
  };

  // Preset Image Catalog to choose from tap
  const imagePresets = [
    { name: "Alimentation Bronze", url: "/src/assets/images/food_pack_bronze_1781612322822.jpg" },
    { name: "Électroménager Platinum", url: "/src/assets/images/appliances_pack_platinum_1781612340346.jpg" },
    { name: "Riz & Épicerie", url: "https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?auto=format&fit=crop&q=80&w=600" },
    { name: "Supermarché frais", url: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600" },
    { name: "Ustensils Four de Cuisine", url: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=600" },
    { name: "TV & Écrans", url: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&q=80&w=600" },
    { name: "Équipements Blendeur", url: "https://images.unsplash.com/photo-1578643463396-0997cb5328c1?auto=format&fit=crop&q=80&w=600" }
  ];

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    
    const success = await onLogin(password);
    setIsLoggingIn(false);
    
    if (!success) {
      setLoginError('Mot de passe incorrect. Réessayez.');
    }
  };

  // Reordering Methods
  const handleMoveCategory = async (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= categories.length) return;

    const listCopy = [...categories];
    // swap objects
    const temp = listCopy[index];
    listCopy[index] = listCopy[targetIdx];
    listCopy[targetIdx] = temp;

    const ids = listCopy.map(c => c.id);
    const success = await onReorderCategories(ids);
    if (success) {
      showStatus('Ordre des catégories mis à jour.');
      onRefreshData();
    } else {
      showStatus('Échec de la réorganisation', 'error');
    }
  };

  const handleMoveKit = async (index: number, direction: 'up' | 'down') => {
    // We must swap within the currently visible kits in the list
    const visibleKits = selectedCatFilter === 'all' 
      ? [...kits] 
      : kits.filter(k => k.categoryId === selectedCatFilter);

    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= visibleKits.length) return;

    // Swap ids in master sorted order
    const masterCopy = [...kits];
    const kitA = visibleKits[index];
    const kitB = visibleKits[targetIdx];

    const idxA = masterCopy.findIndex(k => k.id === kitA.id);
    const idxB = masterCopy.findIndex(k => k.id === kitB.id);

    // Swap indexes in master order
    const temp = masterCopy[idxA];
    masterCopy[idxA] = masterCopy[idxB];
    masterCopy[idxB] = temp;

    const ids = masterCopy.map(k => k.id);
    const success = await onReorderKits(ids);
    if (success) {
      showStatus('Ordre des kits mis à jour.');
      onRefreshData();
    } else {
      showStatus('Échec de la réorganisation des kits', 'error');
    }
  };

  // Category Form Dialog Action
  const handleOpenCatModal = (cat: Category | null = null) => {
    if (cat === null) {
      setCatEditingId(null);
      setCatForm({
        title: '',
        startingAmount: '500 FCFA / jour',
        image: '/src/assets/images/food_pack_bronze_1781612322822.jpg'
      });
    } else {
      setCatEditingId(cat.id);
      setCatForm({
        title: cat.title,
        startingAmount: cat.startingAmount,
        image: cat.image
      });
    }
    setIsCatModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.title.trim()) {
      showStatus('Le titre est obligatoire', 'error');
      return;
    }

    if (catEditingId === null) {
      // Create new
      const success = await onAddCategory(catForm);
      if (success) {
        showStatus('Catégorie créée avec succès.');
        setIsCatModalOpen(false);
        onRefreshData();
      } else {
        showStatus('Erreur lors de la création de la catégorie.', 'error');
      }
    } else {
      // Modify
      const success = await onUpdateCategory(catEditingId, catForm);
      if (success) {
        showStatus('Catégorie modifiée avec succès.');
        setIsCatModalOpen(false);
        onRefreshData();
      } else {
        showStatus('Erreur lors de la modification.', 'error');
      }
    }
  };

  const handleDeleteCategoryClick = async (id: string, name: string) => {
    if (window.confirm(`Voulez-vous vraiment supprimer la catégorie "${name}" ? ATTENTION: Tous les kits associés à cette catégorie seront irrémédiablement supprimés.`)) {
      const success = await onDeleteCategory(id);
      if (success) {
        showStatus('Catégorie supprimée.');
        onRefreshData();
      } else {
        showStatus('Échec de la suppression.', 'error');
      }
    }
  };

  // Kit Form Dialog Action
  const handleOpenKitModal = (kit: Kit | null = null) => {
    if (kit === null) {
      setKitEditingId(null);
      setKitForm({
        categoryId: categories[0]?.id || '',
        name: '',
        dailyAmount: '1 000 FCFA / jour',
        totalValue: '90 000 FCFA',
        images: ['/src/assets/images/food_pack_bronze_1781612322822.jpg'],
        products: [],
        benefits: [],
        deliveryInfo: 'Livraison gratuite en Décembre.'
      });
      setProductInput('');
      setBenefitInput('');
      setImageInput('');
    } else {
      setKitEditingId(kit.id);
      setKitForm({
        categoryId: kit.categoryId,
        name: kit.name,
        dailyAmount: kit.dailyAmount,
        totalValue: kit.totalValue || '',
        images: [...(kit.images || [])],
        products: [...(kit.products || [])],
        benefits: [...(kit.benefits || [])],
        deliveryInfo: kit.deliveryInfo || 'Livraison gratuite.'
      });
      setProductInput('');
      setBenefitInput('');
      setImageInput('');
    }
    setIsKitModalOpen(true);
  };

  const handleAddProductItem = () => {
    if (productInput.trim()) {
      setKitForm({
        ...kitForm,
        products: [...kitForm.products, productInput.trim()]
      });
      setProductInput('');
    }
  };

  const handleRemoveProductItem = (idx: number) => {
    const list = [...kitForm.products];
    list.splice(idx, 1);
    setKitForm({ ...kitForm, products: list });
  };

  const handleAddBenefitItem = () => {
    if (benefitInput.trim()) {
      setKitForm({
        ...kitForm,
        benefits: [...kitForm.benefits, benefitInput.trim()]
      });
      setBenefitInput('');
    }
  };

  const handleRemoveBenefitItem = (idx: number) => {
    const list = [...kitForm.benefits];
    list.splice(idx, 1);
    setKitForm({ ...kitForm, benefits: list });
  };

  const handleAddImageURL = () => {
    if (imageInput.trim()) {
      setKitForm({
        ...kitForm,
        images: [...kitForm.images, imageInput.trim()]
      });
      setImageInput('');
    }
  };

  const handleRemoveImageURL = (idx: number) => {
    if (kitForm.images.length <= 1) {
      showStatus('Un kit doit avoir au moins une image', 'error');
      return;
    }
    const list = [...kitForm.images];
    list.splice(idx, 1);
    setKitForm({ ...kitForm, images: list });
  };

  const handleSaveKit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kitForm.categoryId || !kitForm.name || !kitForm.dailyAmount) {
      showStatus('Veuillez renseigner les champs requis (Catégorie, Nom, Montant)', 'error');
      return;
    }

    if (kitEditingId === null) {
      // Create new
      const success = await onAddKit(kitForm);
      if (success) {
        showStatus('Nouveau kit créé avec succès !');
        setIsKitModalOpen(false);
        onRefreshData();
      } else {
        showStatus('Échec de la création du kit', 'error');
      }
    } else {
      // Edit
      const success = await onUpdateKit(kitEditingId, kitForm);
      if (success) {
        showStatus('Kit mis à jour avec succès.');
        setIsKitModalOpen(false);
        onRefreshData();
      } else {
        showStatus('Échec de la modification.', 'error');
      }
    }
  };

  const handleDeleteKitClick = async (id: string, name: string) => {
    if (window.confirm(`Sûr de vouloir supprimer le kit "${name}" ?`)) {
      const success = await onDeleteKit(id);
      if (success) {
        showStatus('Kit supprimé.');
        onRefreshData();
      } else {
        showStatus('Échec de la suppression.', 'error');
      }
    }
  };


  // If no auth token, render secure login page
  if (!token) {
    return (
      <div className="w-full min-h-screen bg-slate-900 flex flex-col justify-center px-4 py-12 relative">
        <div className="absolute inset-0 bg-radial-at-b from-blue-900/40 via-transparent to-transparent pointer-events-none" />
        
        <div className="max-w-md w-full mx-auto bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100 p-8 z-10">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#0D47FF] flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-sm">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="font-display font-extrabold text-xl text-slate-900">
              Espace Administration
            </h1>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Consoles dédiées de gestion du catalogue "Penta Gad Distribution" pour fêter la fin d'année.
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">
                Clé d'Accès Sécurisée
              </label>
              <input
                type="password"
                required
                placeholder="Introduire le code d'accès..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-[#0D47FF] focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-3.5 text-sm focus:outline-none placeholder:text-slate-400 font-mono tracking-widest text-center"
              />
            </div>

            {loginError && (
              <p className="text-xs text-red-500 font-bold text-center bg-red-50 border border-red-100 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5">
                <span>⚠️ {loginError}</span>
              </p>
            )}

            <button
              id="admin_login_submit_btn"
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-display font-bold text-sm py-4 px-5 rounded-xl transition-all shadow-md shadow-blue-500/10 cursor-pointer uppercase tracking-wider"
            >
              {isLoggingIn ? 'Authentification...' : 'Se connecter'}
            </button>
          </form>

          <p className="text-[10px] text-center text-slate-400 mt-6 font-mono uppercase tracking-widest">
            Penta Gad Distribution • 2026 Admin
          </p>
        </div>
      </div>
    );
  }

  // Active items count helpers
  const kitsList = selectedCatFilter === 'all' 
    ? kits 
    : kits.filter(k => k.categoryId === selectedCatFilter);

  return (
    <div className="w-full min-h-screen bg-slate-50 pb-20">
      
      {/* Header Info */}
      <div className="bg-slate-900 text-white py-12 px-6 shadow-md relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-[#0D47FF]/20 to-transparent pointer-events-none" />
        <div className="max-w-md mx-auto relative z-10 flex items-center justify-between">
          <div>
            <span className="text-yellow-300 text-[10px] font-extrabold uppercase tracking-widest block mb-1">Penta Gad Distribution CMS</span>
            <h1 className="font-display font-black text-2xl tracking-tight leading-none text-white">Console Gérant</h1>
            <p className="text-white/70 text-xs mt-1">Gérez le catalogue interactif en temps réel</p>
          </div>
          <button
            onClick={onRefreshData}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/18 text-white transition-all cursor-pointer"
            title="Rafraîchir les données"
          >
            <RefreshCcw className="w-4 h-4 animate-spin-reverse" />
          </button>
        </div>
      </div>

      {/* Floating Status Notification bar */}
      {statusMessage && (
        <div className="fixed top-20 left-4 right-4 max-w-sm mx-auto z-50 animate-bounce">
          <div className={`p-3.5 rounded-xl text-xs font-extrabold shadow-lg border flex items-center gap-2 ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-100 shadow-emerald-100/40' 
              : 'bg-red-50 text-red-800 border-red-100 shadow-red-100/40'
          }`}>
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMessage.text}</span>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="max-w-md mx-auto px-4 mt-6">
        <div className="bg-white p-1 rounded-2xl border border-slate-100 shadow-sm flex">
          <button
            id="tab_categories_btn"
            onClick={() => setActiveTab('categories')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'categories' 
                ? 'bg-[#0D47FF] text-white shadow-md' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Catégories ({categories.length})</span>
          </button>
          
          <button
            id="tab_kits_btn"
            onClick={() => setActiveTab('kits')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'kits' 
                ? 'bg-[#0D47FF] text-white shadow-md' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Packs & Kits ({kits.length})</span>
          </button>
        </div>
      </div>

      {/* TABS CONTAINER */}
      <div className="max-w-md mx-auto px-4 mt-6">
        
        {/* TAB 1: CATEGORIES */}
        {activeTab === 'categories' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Index d'agencement</span>
              
              <button
                id="add_cat_btn_quick"
                onClick={() => handleOpenCatModal()}
                className="bg-[#2F6BFF] hover:bg-blue-600 text-white text-[11px] font-bold py-1.5 px-3 rounded-xl shadow-md flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nouvelle</span>
              </button>
            </div>

            {/* List */}
            <div className="space-y-3.5">
              {categories.map((cat, idx) => (
                <div 
                  key={cat.id} 
                  className="bg-white rounded-2xl border border-slate-150 p-4 shadow-sm flex items-center justify-between gap-3 hover:border-blue-100 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img 
                      src={cat.image} 
                      alt={cat.title} 
                      className="w-12 h-12 object-cover rounded-xl shrink-0 bg-slate-100 border border-slate-50"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <h4 className="font-display font-extrabold text-sm text-slate-800 leading-none">{cat.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-1 uppercase font-mono tracking-wider">{cat.startingAmount}</p>
                    </div>
                  </div>

                  {/* Toolbar Row */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Reordering indicators */}
                    <button
                      onClick={() => handleMoveCategory(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50/50 rounded-lg disabled:opacity-20 transition-colors cursor-pointer"
                      title="Monter"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMoveCategory(idx, 'down')}
                      disabled={idx === categories.length - 1}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50/50 rounded-lg disabled:opacity-20 transition-colors cursor-pointer"
                      title="Descendre"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>

                    <div className="h-5 w-[1px] bg-slate-100 mx-1" />

                    <button
                      onClick={() => handleOpenCatModal(cat)}
                      className="p-1.5 text-slate-500 hover:text-[#0D47FF] hover:bg-blue-50/50 rounded-lg transition-colors cursor-pointer"
                      title="Modifier la catégorie"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategoryClick(cat.id, cat.title)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Supprimer la catégorie"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: KITS */}
        {activeTab === 'kits' && (
          <div className="space-y-4">
            
            {/* Category Filter selector for Kits management */}
            <div className="bg-slate-100 hover:bg-slate-200/60 p-3 rounded-2.5xl space-y-2">
              <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
                Filtrer par catégorie de pack:
              </label>
              <select
                id="kit_filter_select"
                value={selectedCatFilter}
                onChange={(e) => setSelectedCatFilter(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
              >
                <option value="all">Tous les packs ({kits.length})</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>Gamme {c.title}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Produits enregistrés ({kitsList.length})</span>
              
              <button
                id="add_kit_btn_quick"
                onClick={() => handleOpenKitModal()}
                className="bg-[#2F6BFF] hover:bg-blue-600 text-white text-[11px] font-bold py-1.5 px-3 rounded-xl shadow-md flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nouveau Kit</span>
              </button>
            </div>

            {/* Kits List Grid */}
            <div className="space-y-3.5">
              {kitsList.map((kit, idx) => {
                const associatedCat = categories.find(c => c.id === kit.categoryId);
                return (
                  <div 
                    key={kit.id} 
                    className="bg-white rounded-2xl border border-slate-150 p-4 shadow-sm flex items-center justify-between gap-3 hover:border-blue-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img 
                        src={kit.images && kit.images[0] ? kit.images[0] : 'https://picsum.photos/seed/kit/100/100'} 
                        alt={kit.name} 
                        className="w-12 h-12 object-cover rounded-xl shrink-0 bg-slate-100 border border-slate-50"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0">
                        <span className="text-[9px] font-bold bg-blue-50 text-blue-800 tracking-wider px-2 py-0.5 rounded uppercase font-sans">
                          {associatedCat ? `Gamme ${associatedCat.title}` : 'Sans Catégorie'}
                        </span>
                        <h4 className="font-display font-extrabold text-sm text-slate-800 leading-tight mt-1.5 truncate">{kit.name}</h4>
                        <p className="text-[10px] text-slate-400 font-mono tracking-wider mt-0.5">{kit.dailyAmount} (Total: {kit.totalValue || 'N/A'})</p>
                      </div>
                    </div>

                    {/* Toolbar Row */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Reordering buttons within active segment scope */}
                      <button
                        onClick={() => handleMoveKit(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50/50 rounded-lg disabled:opacity-20 transition-colors cursor-pointer"
                        title="Monter"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveKit(idx, 'down')}
                        disabled={idx === kitsList.length - 1}
                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50/50 rounded-lg disabled:opacity-20 transition-colors cursor-pointer"
                        title="Descendre"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      <div className="h-5 w-[1px] bg-slate-100 mx-1" />

                      <button
                        onClick={() => handleOpenKitModal(kit)}
                        className="p-1 text-slate-500 hover:text-[#0D47FF] hover:bg-blue-50/50 rounded-lg transition-colors cursor-pointer"
                        title="Modifier"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteKitClick(kit.id, kit.name)}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
              
              {kitsList.length === 0 && (
                <p className="text-xs text-center p-6 text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-white">
                  Aucun kit enregistré sous cette catégorie pour le moment.
                </p>
              )}
            </div>
          </div>
        )}

      </div>

      {/* MODAL EDIT/ADD CATEGORY */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="font-display font-extrabold text-sm text-slate-900 uppercase tracking-wide">
                {catEditingId === null ? 'Nouvelle Catégorie' : 'Modifier la Catégorie'}
              </h3>
              <button onClick={() => setIsCatModalOpen(false)} className="p-1 rounded-full text-slate-400 hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs font-semibold uppercase text-slate-500">
              {/* Title */}
              <div className="space-y-1.5">
                <label className="block tracking-wider">Titre / Niveau de Pack *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Platine, Bronze, Elite..."
                  value={catForm.title}
                  onChange={(e) => setCatForm({ ...catForm, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-800 lowercase first-letter:uppercase focus:outline-none"
                />
              </div>

              {/* Starting amount */}
              <div className="space-y-1.5">
                <label className="block tracking-wider">Montant de Départ Estimé *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 500 FCFA / jour"
                  value={catForm.startingAmount}
                  onChange={(e) => setCatForm({ ...catForm, startingAmount: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-800 focus:outline-none"
                />
              </div>

              {/* Image url selection and preset list */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block tracking-wider">Image de la catégorie *</label>
                  <span className="text-[10px] text-[#0D47FF] font-bold">Uploader ou URL</span>
                </div>

                {/* Direct device-file uploader */}
                <div className="flex gap-2.5 items-center">
                  <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-[#0D47FF] rounded-xl p-3 bg-slate-50 hover:bg-slate-100/50 cursor-pointer transition-all">
                    <span className="text-xs text-slate-600 font-bold flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-[#0D47FF]" />
                      {isUploading ? 'Téléversement...' : 'Uploader une Image'}
                    </span>
                    <span className="text-[8px] text-slate-400 mt-1">PNG, JPG de votre appareil</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploading}
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const uploadedUrl = await uploadImageFile(file);
                          if (uploadedUrl) {
                            setCatForm({ ...catForm, image: uploadedUrl });
                            showStatus('Image téléversée avec succès !');
                          }
                        }
                      }}
                    />
                  </label>
                  {catForm.image && (
                    <img 
                      src={catForm.image} 
                      alt="Aperçu" 
                      className="w-14 h-14 object-cover rounded-xl border border-slate-200 bg-slate-100 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  )}
                </div>

                <div className="text-[10px] text-slate-400 uppercase tracking-wider text-center py-1">ou</div>

                <input
                  type="text"
                  required
                  placeholder="Introduisez une URL ou sélectionnez un modèle..."
                  value={catForm.image}
                  onChange={(e) => setCatForm({ ...catForm, image: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[11px] font-mono font-medium text-slate-800 text-left focus:outline-none mb-1.5"
                />

                {/* Fast select templates */}
                <div className="space-y-1 bg-slate-50 p-2 rounded-xl">
                  <span className="text-[10px] text-slate-400 block tracking-wider">Presets d'images de fin d'année :</span>
                  <div className="flex gap-1.5 flex-wrap">
                    {imagePresets.map((preset, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => setCatForm({ ...catForm, image: preset.url })}
                        className={`text-[9px] font-bold px-2 py-1 rounded bg-white border border-slate-250 cursor-pointer ${
                          catForm.image === preset.url ? 'border-blue-600 text-blue-600 font-extrabold ring-1 ring-blue-50' : 'text-slate-600'
                        }`}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Submit triggers */}
              <button
                id="cat_save_submit_btn"
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-display font-extrabold py-3.5 px-4 rounded-xl shadow-md cursor-pointer text-center uppercase tracking-wider mt-4"
              >
                Sauvegarder la Catégorie
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT/ADD KIT */}
      {isKitModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border p-6 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b shrink-0">
              <h3 className="font-display font-extrabold text-sm text-slate-900 uppercase tracking-wide">
                {kitEditingId === null ? 'Nouveau Pack Cadeau' : 'Modifier le Pack Cadeau'}
              </h3>
              <button onClick={() => setIsKitModalOpen(false)} className="p-1 rounded-full text-slate-400 hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveKit} className="space-y-4 text-xs font-semibold uppercase text-slate-500 overflow-y-auto no-scrollbar py-3 flex-1">
              
              {/* Category selector */}
              <div className="space-y-1.5">
                <label className="block tracking-wider">Catégorie d'appartenance *</label>
                <select
                  required
                  value={kitForm.categoryId}
                  onChange={(e) => setKitForm({ ...kitForm, categoryId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-bold focus:outline-none"
                >
                  <option value="" disabled>Choisir une catégorie...</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>Gamme {c.title}</option>
                  ))}
                </select>
              </div>

              {/* Kit Name */}
              <div className="space-y-1.5">
                <label className="block tracking-wider">Nom complet du Kit *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Pack Or Prestige Alimentaire..."
                  value={kitForm.name}
                  onChange={(e) => setKitForm({ ...kitForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-800 focus:outline-none"
                />
              </div>

              {/* Contribution Amount and total value */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block tracking-wider">Contribution Jour *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 1 500 FCFA"
                    value={kitForm.dailyAmount}
                    onChange={(e) => setKitForm({ ...kitForm, dailyAmount: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-800 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block tracking-wider">Total Package Value</label>
                  <input
                    type="text"
                    placeholder="Ex: 135 000 FCFA"
                    value={kitForm.totalValue}
                    onChange={(e) => setKitForm({ ...kitForm, totalValue: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              {/* Multiple Images URL and selection presets */}
              <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border">
                <label className="block tracking-wider text-slate-600">Galerie d'Images (Multimédia) *</label>
                
                {/* Active images */}
                <div className="flex flex-wrap gap-1.5 py-1.5">
                  {kitForm.images.map((img, iIdx) => (
                    <div key={iIdx} className="text-[10px] bg-white border border-slate-300 rounded px-2 py-1 flex items-center gap-1.5 text-slate-800 font-mono">
                      <span className="truncate max-w-[140px]">{img}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveImageURL(iIdx)}
                        className="text-red-500 font-bold hover:scale-105"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                {/* Direct uploader for Kit images */}
                <div className="mb-2 mt-1">
                  <label className="flex flex-col items-center justify-center border border-dashed border-slate-300 hover:border-[#0D47FF] rounded-lg p-2.5 bg-white hover:bg-slate-50 cursor-pointer transition-all">
                    <span className="text-[11px] text-slate-700 font-bold flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-[#0D47FF]" />
                      {isUploading ? 'Téléversement en cours...' : 'Uploader une image de votre appareil'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploading}
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const uploadedUrl = await uploadImageFile(file);
                          if (uploadedUrl) {
                            setKitForm(prev => ({
                              ...prev,
                              images: [...prev.images, uploadedUrl]
                            }));
                            showStatus('Image téléversée et ajoutée avec succès !');
                          }
                        }
                      }}
                    />
                  </label>
                </div>

                <div className="text-[9px] text-slate-400 uppercase tracking-widest text-center my-1.5">ou par adresse URL</div>

                {/* Input row */}
                <div className="flex gap-2.5">
                  <input
                    type="text"
                    placeholder="Saisir un lien public ou preset..."
                    value={imageInput}
                    onChange={(e) => setImageInput(e.target.value)}
                    className="flex-1 bg-white border border-slate-250 rounded-lg px-2 text-[11px] font-mono font-medium focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageURL}
                    className="bg-[#0D47FF] hover:bg-blue-700 text-white text-[10px] py-1 px-3.5 rounded-lg shrink-0 cursor-pointer font-bold"
                  >
                    Ajouter URL
                  </button>
                </div>

                {/* Quick select presets inside Kit creation */}
                <div className="space-y-1 pt-1 border-t border-slate-200/50 mt-1.5">
                  <span className="text-[9px] text-slate-400 block tracking-wider">Tap pour insérer :</span>
                  <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
                    {imagePresets.map((preset, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => setImageInput(preset.url)}
                        className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-white border shrink-0 text-slate-600"
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Products included section */}
              <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border">
                <label className="block tracking-wider text-slate-600">Produits Inclus dans la Caisse *</label>
                
                {/* Product checklist */}
                <div className="space-y-1.5 py-1 text-slate-800 text-xs">
                  {kitForm.products.map((prod, pIdx) => (
                    <div key={pIdx} className="flex justify-between items-center text-[11px] gap-2 p-1.5 rounded bg-white border">
                      <span className="truncate max-w-[240px] font-medium leading-none">{prod}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveProductItem(pIdx)}
                        className="text-red-500 font-bold hover:scale-105 shrink-0"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add item */}
                <div className="flex gap-2.5">
                  <input
                    type="text"
                    placeholder="Ex: Sac de Riz parfumé (25 Kg)..."
                    value={productInput}
                    onChange={(e) => setProductInput(e.target.value)}
                    className="flex-1 bg-white border border-slate-250 rounded-lg px-2 text-xs focus:outline-none text-slate-800"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddProductItem();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddProductItem}
                    className="bg-blue-600 text-white text-[10px] py-1 px-3.5 rounded-lg shrink-0 cursor-pointer"
                  >
                    Ajouter
                  </button>
                </div>
              </div>

              {/* Benefits checklist */}
              <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border">
                <label className="block tracking-wider text-slate-600">Avantages & Atouts phares *</label>
                
                {/* Benefit item list */}
                <div className="space-y-1.5 py-1 text-slate-800 text-xs">
                  {kitForm.benefits.map((benefit, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[11px] gap-2 p-1.5 rounded bg-white border">
                      <span className="truncate max-w-[240px] font-medium leading-none">{benefit}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveBenefitItem(idx)}
                        className="text-red-500 font-bold hover:scale-105 shrink-0"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add item */}
                <div className="flex gap-2.5">
                  <input
                    type="text"
                    placeholder="Ex: Garantie certifiée d'un an inclus..."
                    value={benefitInput}
                    onChange={(e) => setBenefitInput(e.target.value)}
                    className="flex-1 bg-white border border-slate-250 rounded-lg px-2 text-xs focus:outline-none text-slate-800"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddBenefitItem();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddBenefitItem}
                    className="bg-blue-600 text-white text-[10px] py-1 px-3.5 rounded-lg shrink-0 cursor-pointer"
                  >
                    Ajouter
                  </button>
                </div>
              </div>

              {/* Delivery info description */}
              <div className="space-y-1.5">
                <label className="block tracking-wider">Détails de Livraison et Logistique *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Livraison gratuite à partir du 15 Décembre..."
                  value={kitForm.deliveryInfo}
                  onChange={(e) => setKitForm({ ...kitForm, deliveryInfo: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-800 focus:outline-none"
                />
              </div>

              {/* Submit trigger */}
              <button
                id="kit_save_submit_btn"
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-display font-extrabold py-3.5 px-4 rounded-xl shadow-md cursor-pointer text-center uppercase tracking-wider mt-5"
              >
                Sauvegarder le Kit public
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
