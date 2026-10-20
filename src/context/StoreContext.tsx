import React, { createContext, useContext, useState } from 'react';
import { CountryConfig, Product, ProductVariant, CartItem, WishlistItem } from '../types';
import { COUNTRIES, PRODUCTS, UI_TRANSLATIONS } from '../data/mockData';

interface StoreContextType {
  currentCountry: CountryConfig;
  setCountryByCode: (code: string) => void;
  currentLanguage: 'es' | 'en' | 'de' | 'fr' | 'it';
  setLanguage: (lang: 'es' | 'en' | 'de' | 'fr' | 'it') => void;
  t: (key: string) => string;
  formatPrice: (amountEUR: number) => string;
  formatRawAmount: (amountEUR: number) => number;
  
  // Product State
  activeProduct: Product;
  setActiveProductById: (id: string) => void;
  selectedVariant: ProductVariant;
  setSelectedVariantId: (id: string) => void;
  activeImageIndex: number;
  setActiveImageIndex: (index: number) => void;
  
  // Cart State
  cart: CartItem[];
  cartCount: number;
  cartSubtotalEUR: number;
  promoCode: string;
  discountPercent: number;
  applyPromoCode: (code: string) => boolean;
  addToCart: (product: Product, variant: ProductVariant, quantity?: number) => void;
  updateCartQuantity: (variantId: string, quantity: number) => void;
  removeFromCart: (variantId: string) => void;
  
  // Wishlist State
  wishlist: WishlistItem[];
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  
  // Drawers and Modals
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isWishlistOpen: boolean;
  setIsWishlistOpen: (open: boolean) => void;
  isManualModalOpen: boolean;
  setIsManualModalOpen: (open: boolean) => void;
  isTrackOrderModalOpen: boolean;
  setIsTrackOrderModalOpen: (open: boolean) => void;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  
  // Feedback Toast
  toast: { message: string; visible: boolean };
  showToast: (message: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentCountry, setCurrentCountry] = useState<CountryConfig>(COUNTRIES[0]); // default ES
  const [currentLanguage, setCurrentLanguage] = useState<'es' | 'en' | 'de' | 'fr' | 'it'>('es');
  
  const [activeProduct, setActiveProduct] = useState<Product>(PRODUCTS[0]);
  const [selectedVariantId, setSelectedVariantId] = useState<string>(PRODUCTS[0].selectedVariantId);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  
  const [cart, setCart] = useState<CartItem[]>([
    {
      productId: PRODUCTS[0].id,
      variantId: PRODUCTS[0].variants[0].id,
      spu: PRODUCTS[0].spu,
      sku: PRODUCTS[0].variants[0].sku,
      title: PRODUCTS[0].title.es,
      brand: PRODUCTS[0].brand,
      colorName: PRODUCTS[0].variants[0].colorName,
      imageUrl: PRODUCTS[0].images[0].url,
      priceEUR: PRODUCTS[0].basePriceEUR,
      originalPriceEUR: PRODUCTS[0].originalPriceEUR,
      quantity: 1,
    },
  ]);
  
  const [promoCode, setPromoCode] = useState<string>('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  
  const [wishlist, setWishlist] = useState<WishlistItem[]>([
    {
      productId: PRODUCTS[1].id,
      title: PRODUCTS[1].title.es,
      brand: PRODUCTS[1].brand,
      imageUrl: PRODUCTS[1].images[0].url,
      priceEUR: PRODUCTS[1].basePriceEUR,
    },
  ]);
  
  // Modals & Drawers
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isTrackOrderModalOpen, setIsTrackOrderModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  
  // Toast state
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({
    message: '',
    visible: false,
  });

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3500);
  };

  const setCountryByCode = (code: string) => {
    const found = COUNTRIES.find((c) => c.code === code);
    if (found) {
      setCurrentCountry(found);
      setCurrentLanguage(found.language);
      showToast(`Locale updated: ${found.flag} ${found.name} (${found.currency})`);
    }
  };

  const setLanguage = (lang: 'es' | 'en' | 'de' | 'fr' | 'it') => {
    setCurrentLanguage(lang);
  };

  const t = (key: string): string => {
    const langDict = UI_TRANSLATIONS[currentLanguage] || UI_TRANSLATIONS.en;
    return langDict[key] || UI_TRANSLATIONS.es[key] || key;
  };

  const formatRawAmount = (amountEUR: number): number => {
    return Math.round(amountEUR * currentCountry.exchangeRate * 100) / 100;
  };

  const formatPrice = (amountEUR: number): string => {
    const converted = formatRawAmount(amountEUR);
    
    if (currentCountry.currency === 'GBP') {
      return `£${converted.toFixed(2)}`;
    }
    if (currentCountry.currency === 'USD') {
      return `$${converted.toFixed(2)}`;
    }
    if (currentCountry.currency === 'PLN') {
      return `${converted.toFixed(2)} zł`;
    }
    return `${converted.toFixed(2).replace('.', ',')} €`;
  };

  const selectedVariant =
    activeProduct.variants.find((v) => v.id === selectedVariantId) ||
    activeProduct.variants[0];

  const handleSelectVariantId = (id: string) => {
    setSelectedVariantId(id);
    const variant = activeProduct.variants.find((v) => v.id === id);
    if (variant && variant.imageIndex !== undefined) {
      setActiveImageIndex(variant.imageIndex);
    }
  };

  const setActiveProductById = (id: string) => {
    const product = PRODUCTS.find((p) => p.id === id);
    if (product) {
      setActiveProduct(product);
      setSelectedVariantId(product.selectedVariantId);
      setActiveImageIndex(0);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Cart actions
  const addToCart = (product: Product, variant: ProductVariant, quantity: number = 1) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.variantId === variant.id);
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + quantity,
        };
        return next;
      } else {
        const title = product.title[currentLanguage] || product.title.es;
        return [
          ...prev,
          {
            productId: product.id,
            variantId: variant.id,
            spu: product.spu,
            sku: variant.sku,
            title,
            brand: product.brand,
            colorName: variant.colorName,
            imageUrl: product.images[variant.imageIndex || 0]?.url || product.images[0].url,
            priceEUR: product.basePriceEUR,
            originalPriceEUR: product.originalPriceEUR,
            quantity,
          },
        ];
      }
    });
    showToast(`Added to Bag: ${variant.colorName.split('/')[0].trim()}`);
  };

  const updateCartQuantity = (variantId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(variantId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.variantId === variantId ? { ...item, quantity } : item
      )
    );
  };

  const removeFromCart = (variantId: string) => {
    setCart((prev) => prev.filter((item) => item.variantId !== variantId));
  };

  const applyPromoCode = (code: string): boolean => {
    const clean = code.trim().toUpperCase();
    if (clean === 'CASE10' || clean === 'CASELIVE10') {
      setPromoCode('CASE10');
      setDiscountPercent(10);
      showToast('10% discount applied to your order');
      return true;
    }
    return false;
  };

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const rawSubtotal = cart.reduce((acc, item) => acc + item.priceEUR * item.quantity, 0);
  const cartSubtotalEUR = discountPercent > 0 ? rawSubtotal * (1 - discountPercent / 100) : rawSubtotal;

  // Wishlist actions
  const isInWishlist = (productId: string) => {
    return wishlist.some((item) => item.productId === productId);
  };

  const toggleWishlist = (product: Product) => {
    if (isInWishlist(product.id)) {
      setWishlist((prev) => prev.filter((item) => item.productId !== product.id));
      showToast('Removed from Saved Items');
    } else {
      const title = product.title[currentLanguage] || product.title.es;
      setWishlist((prev) => [
        ...prev,
        {
          productId: product.id,
          title,
          brand: product.brand,
          imageUrl: product.images[0].url,
          priceEUR: product.basePriceEUR,
        },
      ]);
      showToast('Saved to your collection');
    }
  };

  return (
    <StoreContext.Provider
      value={{
        currentCountry,
        setCountryByCode,
        currentLanguage,
        setLanguage,
        t,
        formatPrice,
        formatRawAmount,
        activeProduct,
        setActiveProductById,
        selectedVariant,
        setSelectedVariantId: handleSelectVariantId,
        activeImageIndex,
        setActiveImageIndex,
        cart,
        cartCount,
        cartSubtotalEUR,
        promoCode,
        discountPercent,
        applyPromoCode,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        wishlist,
        toggleWishlist,
        isInWishlist,
        isCartOpen,
        setIsCartOpen,
        isWishlistOpen,
        setIsWishlistOpen,
        isManualModalOpen,
        setIsManualModalOpen,
        isTrackOrderModalOpen,
        setIsTrackOrderModalOpen,
        isLoginModalOpen,
        setIsLoginModalOpen,
        toast,
        showToast,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
