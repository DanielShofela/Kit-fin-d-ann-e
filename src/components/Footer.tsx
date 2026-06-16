import { Sparkles, Phone, MessageCircle, MapPin, Truck, ShieldCheck, Heart } from 'lucide-react';

interface FooterProps {
  whatsappNumber?: string;
}

export default function Footer({ whatsappNumber = "+2250102030405" }: FooterProps) {
  return (
    <footer className="w-full bg-slate-900 text-slate-300 py-12 px-6 border-t border-slate-800">
      <div className="max-w-md mx-auto space-y-8">
        
        {/* Value Prop Columns */}
        <div className="grid grid-cols-2 gap-4 pb-8 border-b border-slate-800">
          <div className="flex gap-2.5">
            <Truck className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div className="flex flex-col">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-100">
                Livraison de Fête
              </span>
              <p className="text-[10px] text-slate-400 mt-1 leading-[1.3]">
                Expéditions sécurisées gratuites à domicile en Décembre.
              </p>
            </div>
          </div>

          <div className="flex gap-2.5">
            <ShieldCheck className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div className="flex flex-col">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-100">
                Qualité Certifiée
              </span>
              <p className="text-[10px] text-slate-400 mt-1 leading-[1.3]">
                Tous les robots et plaques électriques sont testés et garantis 1 an.
              </p>
            </div>
          </div>
        </div>

        {/* Corporate details */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white font-extrabold text-xs">
              P
            </div>
            <div className="flex flex-col">
              <span className="font-display font-extrabold text-sm tracking-tight text-white leading-none">
                PENTA GAD DISTRIBUTION
              </span>
              <span className="text-[8px] font-bold tracking-widest text-blue-400 uppercase leading-none mt-0.5">
                Packs d'adhésion de fin d'année
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Penta Gad Distribution est votre partenaire officiel de confiance pour l'équipement de la maison et le ravitaillement de vos fêtes. Un crédit d'épargne journalier souple et adapté à vos revenus.
          </p>
        </div>

        {/* Speed Dial / Contact blocks */}
        <div className="space-y-3 pt-2">
          <h4 className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
            Centre de Relation Client
          </h4>
          
          <div className="flex items-center gap-3.5 text-xs">
            <Phone className="w-4 h-4 text-blue-500 shrink-0" />
            <span>+225 01 02 03 04 05</span>
          </div>

          <div className="flex items-center gap-3.5 text-xs">
            <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
            <span>Cocody Angré, Carrefour Pétrole, Abidjan</span>
          </div>

          {/* Quick Chat Bubble trigger */}
          <a
            href={`https://wa.me/${whatsappNumber.replace(/[^0-9+]/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-2 py-2 px-4 rounded-xl bg-emerald-600/15 border border-emerald-500/20 text-emerald-400 text-xs font-bold hover:bg-emerald-600/25 transition-all text-left"
          >
            <MessageCircle className="w-4 h-4 text-emerald-500" />
            <span>Une question ? Écrivez au service WhatsApp</span>
          </a>
        </div>

        {/* Footnote Copyright & developer credit bounds */}
        <div className="pt-8 border-t border-slate-800/60 text-center space-y-2">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
            &copy; 2026 Penta Gad Distribution. Tous droits réservés.
          </p>
          <div className="flex items-center justify-center gap-1 text-[9px] text-slate-600 uppercase tracking-wide">
            <span>Conçu avec</span>
            <Heart className="w-2.5 h-2.5 text-blue-500 fill-blue-500" />
            <span>pour les familles ivoiriennes</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
