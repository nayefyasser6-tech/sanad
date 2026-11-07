"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useCartStore } from "@/store/useCartStore";
import { useLangStore, dict } from "@/store/useLangStore";
import { createClient } from "@/utils/supabase/client";

type Product = {
  id: string | number;
  name: string;
  name_en?: string;
  price: number;
  image: string;
};

function ProductCard({ product }: { product: Product }) {
  const { lang } = useLangStore();
  const t = dict[lang] || dict['ar'];

  const addItem = useCartStore((state) => state.addItem);
  const router = useRouter();

  // رفعنا هذا السطر للأعلى لنتمكن من حفظ الاسم المترجم مباشرة في السلة
  const productName = lang === 'en' && product.name_en ? product.name_en : product.name;

  const handleAddToCart = () => {
    // تمرير البيانات بشكل صريح لحفظها كاملة في قاعدة البيانات
    const success = addItem({
      id: String(product.id),
      name: productName,
      price: Number(product.price),
      image: product.image || ''
    }, 1);
    
    const toastId = "cart-status-toast";

    if (success) {
      toast.success(t.productAddedSuccess, { id: toastId });
    } else {
      toast.error(t.productAlreadyInCart, { id: toastId });
    }
  };

  const handleBuyNow = () => {
    addItem({
      id: String(product.id),
      name: productName,
      price: Number(product.price),
      image: product.image || ''
    }, 1);
    router.push("/checkout");
  };

  return (
    <div className="glass-panel rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col bg-white border border-slate-200 group">
      
      <div className="h-56 w-full overflow-hidden bg-slate-50 relative p-4 flex items-center justify-center">
        <img 
          src={product.image} 
          alt={productName} 
          className="max-h-full object-contain transform group-hover:scale-110 transition-transform duration-500"
        />
      </div>

      <div className="p-6 flex flex-col flex-grow text-center border-t border-slate-100">
        <h3 className="text-xl font-black text-slate-800 flex-grow mb-2">{productName}</h3>
        <span className="text-3xl font-black text-primary mb-4">${Number(product.price).toFixed(2)}</span>
        
        <div className="flex flex-col gap-3 mt-auto">
          <button
            onClick={handleBuyNow}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-bold rounded-xl shadow hover:shadow-lg transition-all active:scale-95 text-lg"
          >
            {t.btnSendNow}
          </button>

          <button
            onClick={handleAddToCart}
            className="w-full py-3 font-bold rounded-xl transition-all active:scale-95 text-lg border-2 bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200"
          >
            {t.btnAddToCart}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BuildBoxPage() {
  const { lang } = useLangStore();
  const t = dict[lang] || dict['ar'];
  const supabase = createClient();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', 'food')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching food products:", error);
      } else if (data) {
        const mapped: Product[] = data.map((p: any) => ({
          id: p.id,
          name: p.name,
          name_en: p.name_en,
          price: p.price,
          image: p.image_url || p.image,
        }));
        setProducts(mapped);
      }
      setLoading(false);
    };

    fetchProducts();
  }, [supabase]);

  return (
    <main className="min-h-screen bg-slate-100 py-20 px-4">
      <div className="max-w-7xl mx-auto space-y-12 mt-10">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-black text-slate-900">
            {t.buildBoxTitle1} <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-500">{t.buildBoxTitle2}</span>
          </h1>
          <p className="text-2xl text-slate-600 font-bold max-w-2xl mx-auto">
            {t.buildBoxDesc}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-2xl font-bold text-slate-600">
            لا توجد منتجات مضافة حالياً.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}