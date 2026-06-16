export interface Category {
  id: string;
  title: string;          // e.g. "Bronze"
  startingAmount: string; // e.g. "500 FCFA / jour"
  image: string;          // image URL or path
  order: number;
}

export interface Kit {
  id: string;
  categoryId: string;
  name: string;
  dailyAmount: string;    // e.g. "1.200 FCFA / jour"
  totalValue: string;     // e.g. "120.000 FCFA"
  images: string[];       // multiple images
  products: string[];     // list of products
  benefits: string[];     // list of benefits
  deliveryInfo: string;   // delivery details, e.g. "Livraison gratuite en Décembre dans toute la ville"
  order: number;
}

export interface AdminSession {
  token: string;
  username: string;
}
