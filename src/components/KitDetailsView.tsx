import { useState } from 'react';
import { ArrowLeft, Check, Sparkles, ShieldCheck, Truck, Calendar, DollarSign, ChevronRight, HelpCircle } from 'lucide-react';
import { Kit, Category } from '../types';
import { motion } from 'motion/react';

interface KitDetailsViewProps {
  kit: Kit;
  category: Category;
  onBack: () => void;
  onChooseKit: () => void;
}

export default function KitDetailsView({ kit, category, onBack, onChooseKit }: KitDetailsViewProps) {
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  // Fallback for missing images
  const kitImages = kit.images && kit.images.length > 0 ? kit.images : ['https://picsum.photos/seed/kit/600/400'];
  const activeImage = kitImages[activeImageIdx] || kitImages[0];

  return (
    <div className="w-full min-h-screen bg-slate-50 pb-24">
      
      {/* Dynamic Header details */}
      <div className="bg-white px-4 py-3 border-b border-slate-100 flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-1 rounded-full text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <p className="text-[10px] font-bold text-[#0D47FF] uppercase tracking-widest">Gamme {category.title}</p>
          <h2 className="text-sm font-black text-slate-900 truncate">{kit.name}</h2>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-md mx-auto px-4 mt-4">
        
        {/* Gallery Visual Card */}
        <div className="bg-white rounded-2.5xl p-2.5 shadow-sm border border-slate-100">
          
          {/* Large Main Image */}
          <div className="relative h-64 rounded-2xl overflow-hidden bg-slate-100">
            <img
              src={activeImage}
              alt={kit.name}
              className="w-full h-full object-cover transition-all duration-300"
              referrerPolicy="no-referrer"
            />
            
            {/* Dark gradient blur at bottom */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
            
            {/* Top Indicator tags */}
            <span className="absolute top-3 left-3 bg-[#0D47FF] text-white text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg tracking-wider border border-blue-500/20 shadow-sm">
              Authentique Penta Gad
            </span>
          </div>

          {/* Inline Slider Thumbnails (If more than 1 image) */}
          {kitImages.length > 1 && (
            <div className="flex gap-2.5 mt-3 px-1 overflow-x-auto no-scrollbar pb-1">
              {kitImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`relative w-14 h-14 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                    activeImageIdx === idx 
                      ? 'border-[#0D47FF] ring-2 ring-[#0D47FF]/20' 
                      : 'border-slate-100 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img}
                    alt={`Preview ${idx + 1}`}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Essential Pricing Details Banner */}
        <div className="mt-5 bg-gradient-to-br from-[#0D47FF] to-[#2F6BFF] p-5 rounded-2.5xl text-white shadow-md shadow-blue-500/10 relative overflow-hidden">
          {/* Background vector spark */}
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <DollarSign className="w-32 h-32 -mr-10 -mt-10" />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-yellow-300 tracking-wider">
                Montant de la Contribution
              </span>
              <span className="text-2xl font-black font-mono mt-0.5">
                {kit.dailyAmount} <span className="text-xs font-normal text-white/80">/ jour</span>
              </span>
            </div>

            {kit.totalValue && (
              <div className="border-l border-white/20 pl-4 flex flex-col items-end">
                <span className="text-[10px] uppercase font-bold text-white/70 tracking-wider">
                  Valeur totale du Pack
                </span>
                <span className="text-sm font-extrabold font-mono text-white mt-1">
                  {kit.totalValue}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Included Products List */}
         <div className="mt-5 bg-white rounded-2.5xl p-5 shadow-sm border border-slate-100">
           <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
             <div className="w-1.5 h-4.5 bg-[#0D47FF] rounded-full" />
             <h3 className="font-display font-extrabold text-[#111] text-sm uppercase tracking-wide">
               Produits Inclus dans le Pack
             </h3>
           </div>

           {kit.products && kit.products.length > 0 ? (
             <div className="space-y-3">
               {kit.products.map((prod, idx) => (
                 <div key={idx} className="flex items-start gap-3 bg-slate-50/50 hover:bg-blue-50/20 p-2.5 rounded-xl border border-slate-100/50 transition-colors">
                   <div className="w-5 h-5 rounded-full bg-blue-50 text-[#0D47FF] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 border border-blue-100">
                     {idx + 1}
                   </div>
                   <span className="text-xs text-slate-700 font-medium leading-[1.4]">{prod}</span>
                 </div>
               ))}
             </div>
           ) : (
             <p className="text-xs text-slate-400">Aucun produit listé dans ce pack.</p>
           )}
         </div>

        {/* Benefits Column */}
         <div className="mt-5 bg-white rounded-2.5xl p-5 shadow-sm border border-slate-100">
           <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
             <div className="w-1.5 h-4.5 bg-amber-500 rounded-full" />
             <h3 className="font-display font-extrabold text-[#111] text-sm uppercase tracking-wide">
               Pourquoi Choisir ce Kit ?
             </h3>
           </div>

           {kit.benefits && kit.benefits.length > 0 ? (
             <div className="space-y-2.5">
               {kit.benefits.map((benefit, idx) => (
                 <div key={idx} className="flex items-start gap-2.5">
                   <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                   <span className="text-xs text-slate-600 leading-[1.4]">{benefit}</span>
                 </div>
               ))}
             </div>
           ) : (
             <p className="text-xs text-slate-400">Profitez de la fiabilité garantie et du suivi Penta Gad Distribution.</p>
           )}
         </div>

        {/* Delivery / Terms details Block */}
        <div className="mt-5 bg-slate-100/80 border border-slate-200/55 rounded-2.5xl p-5 space-y-3.5">
          
          <div className="flex gap-3">
            <Truck className="w-4.5 h-4.5 text-[#0D47FF] shrink-0" />
            <div className="flex flex-col">
              <span className="text-[11px] font-extrabold uppercase text-slate-800 tracking-wider">
                Informations de Livraison
              </span>
              <p className="text-xs text-slate-600 mt-1 leading-[1.4]">
                {kit.deliveryInfo || "Livraison gratuite programmée en Décembre."}
              </p>
            </div>
          </div>

          <div className="border-t border-slate-200/55 pt-3 flex gap-3">
            <Calendar className="w-4.5 h-4.5 text-[#0D47FF] shrink-0" />
            <div className="flex flex-col">
              <span className="text-[11px] font-extrabold uppercase text-slate-800 tracking-wider">
                Souscription Simple & Sans Stress
              </span>
              <p className="text-xs text-slate-600 mt-0.5 leading-[1.4]">
                Validez le pack aujourd'hui. Un agent vous contacte pour officialiser et bloquer vos produits avant rupture de stock d'année.
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* Floating Bottom Action CTA "Choisir ce Kit" */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100/90 py-3.5 px-4 shadow-lg z-35">
        <div className="max-w-md mx-auto flex items-center justify-between gap-4">
          
          <div className="flex flex-col justify-center min-w-0 shrink-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Acompte Journalier</span>
            <span className="text-md font-black text-[#0D47FF] font-mono mt-1.5 leading-none">{kit.dailyAmount}</span>
          </div>

          <button
            id="choose_kit_cta"
            onClick={onChooseKit}
            className="flex-1 bg-gradient-to-r from-blue-650 via-blue-600 to-[#0D47FF] hover:from-blue-700 hover:to-[#0935cc] text-white font-display font-extrabold text-sm py-4.5 px-5 rounded-xl shadow-lg shadow-blue-500/15 transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
          >
            <span>Choisir ce Kit</span>
            <ChevronRight className="w-4 h-4 text-white" />
          </button>

        </div>
      </div>

    </div>
  );
}
