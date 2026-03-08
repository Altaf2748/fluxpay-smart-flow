import React, { useState } from 'react';
import { ArrowLeft, ShoppingCart, Plus, Minus, Trash2, Star, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { productImages } from '@/assets/products';

interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice: number;
  image: string; // key into productImages
  rating: number;
  category: string;
}

interface CartItem extends Product {
  quantity: number;
}

interface Offer {
  id: number;
  title: string;
  description: string;
  validUntil: string | null;
  minAmount: number;
  maxCashback: number;
  category: string;
  rail: string;
  redeemCode: string;
}

const BRAND_PRODUCTS: Record<string, Product[]> = {
  "Amazon": [
    { id: 1, name: "Wireless Earbuds Pro", price: 2499, originalPrice: 3999, image: "earbuds", rating: 4.5, category: "Electronics" },
    { id: 2, name: "Smart Watch Series 5", price: 4999, originalPrice: 7999, image: "smartwatch", rating: 4.3, category: "Electronics" },
    { id: 3, name: "Laptop Stand Aluminum", price: 1299, originalPrice: 1999, image: "laptop", rating: 4.7, category: "Accessories" },
    { id: 4, name: "USB-C Hub 7-in-1", price: 1899, originalPrice: 2499, image: "usbhub", rating: 4.4, category: "Accessories" },
    { id: 5, name: "Kindle Paperwhite", price: 13999, originalPrice: 15999, image: "smartphone", rating: 4.8, category: "Electronics" },
    { id: 6, name: "Echo Dot 5th Gen", price: 4499, originalPrice: 5499, image: "speaker", rating: 4.6, category: "Smart Home" },
    { id: 7, name: "Fire TV Stick 4K", price: 3999, originalPrice: 5999, image: "tv", rating: 4.5, category: "Entertainment" },
    { id: 8, name: "Portable Charger 20000mAh", price: 1499, originalPrice: 2299, image: "powerbank", rating: 4.2, category: "Accessories" },
  ],
  "Flipkart": [
    { id: 1, name: "Noise Colorfit Pro 4", price: 3499, originalPrice: 5999, image: "smartwatch", rating: 4.3, category: "Wearables" },
    { id: 2, name: "boAt Rockerz 450", price: 1499, originalPrice: 2990, image: "earbuds", rating: 4.1, category: "Audio" },
    { id: 3, name: "Samsung Galaxy Buds", price: 4999, originalPrice: 7999, image: "earbuds", rating: 4.5, category: "Audio" },
    { id: 4, name: "Redmi Note 13 Pro", price: 19999, originalPrice: 24999, image: "smartphone", rating: 4.4, category: "Smartphones" },
    { id: 5, name: "HP Pavilion Laptop", price: 45999, originalPrice: 55999, image: "laptop", rating: 4.3, category: "Laptops" },
    { id: 6, name: "LG 43\" Smart TV", price: 28999, originalPrice: 35999, image: "tv", rating: 4.2, category: "TVs" },
    { id: 7, name: "Prestige Mixer Grinder", price: 2499, originalPrice: 3999, image: "usbhub", rating: 4.0, category: "Kitchen" },
    { id: 8, name: "Canon EOS Camera", price: 34999, originalPrice: 42999, image: "camera", rating: 4.6, category: "Cameras" },
  ],
  "Swiggy": [
    { id: 1, name: "Biryani Meal Combo", price: 349, originalPrice: 449, image: "biryani", rating: 4.5, category: "Meals" },
    { id: 2, name: "Pizza Party Pack (4)", price: 799, originalPrice: 999, image: "pizza", rating: 4.3, category: "Pizza" },
    { id: 3, name: "Butter Chicken Thali", price: 299, originalPrice: 399, image: "curry", rating: 4.6, category: "Meals" },
    { id: 4, name: "Sushi Platter (12 pcs)", price: 899, originalPrice: 1199, image: "sushi", rating: 4.4, category: "Japanese" },
    { id: 5, name: "Burger Combo Meal", price: 249, originalPrice: 349, image: "burger", rating: 4.2, category: "Fast Food" },
    { id: 6, name: "South Indian Thali", price: 199, originalPrice: 299, image: "dosa", rating: 4.7, category: "Meals" },
    { id: 7, name: "Dessert Box (6 pcs)", price: 449, originalPrice: 599, image: "dessert", rating: 4.5, category: "Desserts" },
    { id: 8, name: "Smoothie Bowl Combo", price: 399, originalPrice: 499, image: "smoothie", rating: 4.1, category: "Beverages" },
  ],
  "Zomato": [
    { id: 1, name: "Dal Makhani + Naan", price: 279, originalPrice: 379, image: "curry", rating: 4.5, category: "North Indian" },
    { id: 2, name: "Paneer Tikka Platter", price: 349, originalPrice: 449, image: "biryani", rating: 4.4, category: "Starters" },
    { id: 3, name: "Chicken Wings (8 pcs)", price: 399, originalPrice: 499, image: "burger", rating: 4.3, category: "Starters" },
    { id: 4, name: "Hakka Noodles Combo", price: 249, originalPrice: 349, image: "noodles", rating: 4.2, category: "Chinese" },
    { id: 5, name: "Masala Dosa Set", price: 149, originalPrice: 199, image: "dosa", rating: 4.6, category: "South Indian" },
    { id: 6, name: "Ice Cream Sundae", price: 199, originalPrice: 279, image: "dessert", rating: 4.5, category: "Desserts" },
    { id: 7, name: "Cold Coffee (Large)", price: 179, originalPrice: 229, image: "smoothie", rating: 4.1, category: "Beverages" },
    { id: 8, name: "Wrap Meal Deal", price: 299, originalPrice: 399, image: "burger", rating: 4.3, category: "Fast Food" },
  ],
  "Nike": [
    { id: 1, name: "Air Max 270 React", price: 8999, originalPrice: 12999, image: "sneakers", rating: 4.7, category: "Running" },
    { id: 2, name: "Dri-FIT Training Tee", price: 1999, originalPrice: 2499, image: "tshirt", rating: 4.4, category: "Apparel" },
    { id: 3, name: "Air Jordan 1 Mid", price: 10999, originalPrice: 14999, image: "sneakers", rating: 4.8, category: "Lifestyle" },
    { id: 4, name: "Running Shorts", price: 1499, originalPrice: 2299, image: "shorts", rating: 4.3, category: "Apparel" },
    { id: 5, name: "Pro Sports Bag", price: 2999, originalPrice: 3999, image: "backpack", rating: 4.5, category: "Bags" },
    { id: 6, name: "Everyday Cushion Socks", price: 799, originalPrice: 999, image: "socks", rating: 4.2, category: "Accessories" },
    { id: 7, name: "ZoomX Invincible Run", price: 14999, originalPrice: 18999, image: "sneakers", rating: 4.9, category: "Running" },
    { id: 8, name: "Windrunner Jacket", price: 4999, originalPrice: 6499, image: "jacket", rating: 4.6, category: "Apparel" },
  ],
  "Myntra": [
    { id: 1, name: "Roadster Slim Jeans", price: 999, originalPrice: 1599, image: "jeans", rating: 4.3, category: "Men" },
    { id: 2, name: "Mango Floral Dress", price: 2499, originalPrice: 3999, image: "dress", rating: 4.5, category: "Women" },
    { id: 3, name: "HRX Sneakers", price: 1799, originalPrice: 2999, image: "sneakers", rating: 4.2, category: "Footwear" },
    { id: 4, name: "Allen Solly Formal Shirt", price: 1299, originalPrice: 1999, image: "shirt", rating: 4.4, category: "Men" },
    { id: 5, name: "Fossil Analog Watch", price: 6999, originalPrice: 9999, image: "watch", rating: 4.6, category: "Accessories" },
    { id: 6, name: "Lavie Handbag", price: 1499, originalPrice: 2299, image: "handbag", rating: 4.1, category: "Bags" },
    { id: 7, name: "Ray-Ban Sunglasses", price: 5999, originalPrice: 7999, image: "sunglasses", rating: 4.7, category: "Accessories" },
    { id: 8, name: "Puma Track Pants", price: 1299, originalPrice: 1999, image: "shorts", rating: 4.3, category: "Sportswear" },
  ],
  "BookMyShow": [
    { id: 1, name: "Movie Ticket (Premium)", price: 350, originalPrice: 450, image: "movieticket", rating: 4.5, category: "Movies" },
    { id: 2, name: "Movie Ticket (Standard)", price: 200, originalPrice: 250, image: "movieticket", rating: 4.3, category: "Movies" },
    { id: 3, name: "Combo: 2 Tickets + Popcorn", price: 799, originalPrice: 999, image: "movieticket", rating: 4.6, category: "Combos" },
    { id: 4, name: "Live Concert Pass", price: 1499, originalPrice: 1999, image: "movieticket", rating: 4.7, category: "Events" },
    { id: 5, name: "Stand-up Comedy Show", price: 599, originalPrice: 799, image: "movieticket", rating: 4.4, category: "Events" },
    { id: 6, name: "Sports Match Ticket", price: 999, originalPrice: 1299, image: "football", rating: 4.5, category: "Sports" },
    { id: 7, name: "IMAX Experience", price: 499, originalPrice: 699, image: "movieticket", rating: 4.8, category: "Movies" },
    { id: 8, name: "Family Pack (4 Tickets)", price: 1199, originalPrice: 1599, image: "movieticket", rating: 4.4, category: "Combos" },
  ],
  "Uber": [
    { id: 1, name: "City Ride Voucher", price: 199, originalPrice: 299, image: "car", rating: 4.3, category: "Rides" },
    { id: 2, name: "Airport Transfer", price: 799, originalPrice: 999, image: "car", rating: 4.5, category: "Premium" },
    { id: 3, name: "Uber XL (6 seater)", price: 499, originalPrice: 699, image: "car", rating: 4.2, category: "Rides" },
    { id: 4, name: "Uber Black Premium", price: 999, originalPrice: 1299, image: "car", rating: 4.7, category: "Premium" },
    { id: 5, name: "Uber Moto Ride", price: 79, originalPrice: 99, image: "car", rating: 4.1, category: "Rides" },
    { id: 6, name: "Ride Pass (10 rides)", price: 1499, originalPrice: 2499, image: "car", rating: 4.4, category: "Passes" },
  ],
  "Nykaa": [
    { id: 1, name: "MAC Lipstick", price: 1650, originalPrice: 1950, image: "lipstick", rating: 4.7, category: "Lips" },
    { id: 2, name: "Maybelline Mascara", price: 599, originalPrice: 799, image: "lipstick", rating: 4.4, category: "Eyes" },
    { id: 3, name: "Lakme Foundation", price: 799, originalPrice: 999, image: "skincare", rating: 4.3, category: "Face" },
    { id: 4, name: "Nykaa Nail Polish Set", price: 499, originalPrice: 699, image: "nailpolish", rating: 4.5, category: "Nails" },
    { id: 5, name: "Perfume Gift Set", price: 2999, originalPrice: 3999, image: "perfume", rating: 4.6, category: "Fragrance" },
    { id: 6, name: "Skincare Kit", price: 1299, originalPrice: 1799, image: "skincare", rating: 4.5, category: "Skincare" },
    { id: 7, name: "Hair Serum Premium", price: 899, originalPrice: 1199, image: "skincare", rating: 4.2, category: "Hair" },
    { id: 8, name: "Makeup Brush Set (7)", price: 999, originalPrice: 1499, image: "brushes", rating: 4.4, category: "Tools" },
  ],
  "Decathlon": [
    { id: 1, name: "Running Shoes", price: 2499, originalPrice: 3499, image: "sneakers", rating: 4.5, category: "Footwear" },
    { id: 2, name: "Yoga Mat Premium", price: 999, originalPrice: 1499, image: "yogamat", rating: 4.6, category: "Fitness" },
    { id: 3, name: "Badminton Racket", price: 699, originalPrice: 999, image: "badminton", rating: 4.3, category: "Racquet Sports" },
    { id: 4, name: "Camping Tent (4P)", price: 4999, originalPrice: 6999, image: "tent", rating: 4.7, category: "Camping" },
    { id: 5, name: "Cycling Helmet", price: 1299, originalPrice: 1799, image: "helmet", rating: 4.4, category: "Cycling" },
    { id: 6, name: "Swimming Goggles", price: 499, originalPrice: 699, image: "goggles", rating: 4.2, category: "Swimming" },
    { id: 7, name: "Football Size 5", price: 799, originalPrice: 1099, image: "football", rating: 4.5, category: "Football" },
    { id: 8, name: "Trekking Backpack 40L", price: 2299, originalPrice: 3299, image: "backpack", rating: 4.6, category: "Trekking" },
  ],
  "Reliance Digital": [
    { id: 1, name: "iPhone 15 (128GB)", price: 69999, originalPrice: 79999, image: "smartphone", rating: 4.8, category: "Smartphones" },
    { id: 2, name: "Samsung 55\" QLED TV", price: 54999, originalPrice: 69999, image: "tv", rating: 4.6, category: "TVs" },
    { id: 3, name: "Sony WH-1000XM5", price: 24999, originalPrice: 29999, image: "earbuds", rating: 4.9, category: "Audio" },
    { id: 4, name: "iPad Air M2", price: 59999, originalPrice: 69999, image: "smartphone", rating: 4.7, category: "Tablets" },
    { id: 5, name: "Dyson V12 Vacuum", price: 42999, originalPrice: 52999, image: "usbhub", rating: 4.5, category: "Home" },
    { id: 6, name: "PS5 Digital Edition", price: 39999, originalPrice: 44999, image: "console", rating: 4.8, category: "Gaming" },
    { id: 7, name: "MacBook Air M3", price: 99999, originalPrice: 114999, image: "laptop", rating: 4.9, category: "Laptops" },
    { id: 8, name: "LG Washing Machine 8kg", price: 32999, originalPrice: 39999, image: "usbhub", rating: 4.3, category: "Appliances" },
  ],
  "Big Bazaar": [
    { id: 1, name: "Rice Basmati 5kg", price: 499, originalPrice: 649, image: "rice", rating: 4.3, category: "Staples" },
    { id: 2, name: "Cooking Oil 5L", price: 699, originalPrice: 849, image: "oil", rating: 4.2, category: "Staples" },
    { id: 3, name: "Fresh Fruits Basket", price: 399, originalPrice: 499, image: "fruits", rating: 4.5, category: "Fresh" },
    { id: 4, name: "Snacks Mega Pack", price: 299, originalPrice: 399, image: "chocolates", rating: 4.1, category: "Snacks" },
    { id: 5, name: "Detergent Powder 4kg", price: 449, originalPrice: 599, image: "skincare", rating: 4.4, category: "Household" },
    { id: 6, name: "Tea Premium 500g", price: 349, originalPrice: 449, image: "smoothie", rating: 4.6, category: "Beverages" },
    { id: 7, name: "Dairy Combo Pack", price: 249, originalPrice: 349, image: "fruits", rating: 4.3, category: "Dairy" },
    { id: 8, name: "Chocolate Gift Box", price: 599, originalPrice: 799, image: "chocolates", rating: 4.7, category: "Snacks" },
  ],
};

const GENERIC_PRODUCTS: Product[] = [
  { id: 1, name: "Premium Package", price: 999, originalPrice: 1499, image: "backpack", rating: 4.3, category: "General" },
  { id: 2, name: "Standard Bundle", price: 599, originalPrice: 799, image: "earbuds", rating: 4.1, category: "General" },
  { id: 3, name: "Value Pack", price: 299, originalPrice: 449, image: "powerbank", rating: 4.0, category: "General" },
  { id: 4, name: "Exclusive Deal", price: 1499, originalPrice: 1999, image: "smartwatch", rating: 4.5, category: "Premium" },
  { id: 5, name: "Combo Offer", price: 799, originalPrice: 1099, image: "usbhub", rating: 4.2, category: "General" },
  { id: 6, name: "Best Seller", price: 1199, originalPrice: 1699, image: "sneakers", rating: 4.6, category: "Premium" },
];

interface BrandStoreProps {
  offer: Offer;
  onBack: () => void;
  onCheckout: (merchant: string, amount: number, couponCode: string) => void;
}

export const BrandStore: React.FC<BrandStoreProps> = ({ offer, onBack, onCheckout }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const { toast } = useToast();

  const brandName = offer.title.split(' ')[0].replace(/[^a-zA-Z\s]/g, '').trim();
  
  const products = BRAND_PRODUCTS[brandName] 
    || BRAND_PRODUCTS[Object.keys(BRAND_PRODUCTS).find(k => 
        k.toLowerCase().includes(brandName.toLowerCase()) || 
        brandName.toLowerCase().includes(k.toLowerCase())
      ) || ''] 
    || GENERIC_PRODUCTS;

  const categories = [...new Set(products.map(p => p.category))];

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    toast({ title: "Added to cart", description: product.name });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id !== productId) return item;
      const newQty = item.quantity + delta;
      return newQty > 0 ? { ...item, quantity: newQty } : item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const merchantName = offer.title.split(' - ')[0].split(' ')[0];

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({ title: "Cart is empty", description: "Add items before checkout", variant: "destructive" });
      return;
    }
    setShowCart(false);
    onCheckout(merchantName, cartTotal, offer.redeemCode);
  };

  const getProductImage = (imageKey: string) => {
    return productImages[imageKey] || productImages.backpack;
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{brandName} Store</h1>
            <p className="text-muted-foreground text-sm">{offer.description}</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="relative" 
          onClick={() => setShowCart(true)}
        >
          <ShoppingCart className="w-5 h-5" />
          {cartCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
              {cartCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Discount Banner */}
      <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center gap-3">
        <ShoppingBag className="w-6 h-6 text-primary shrink-0" />
        <div>
          <p className="font-semibold text-sm">
            Use code <span className="text-primary font-mono">{offer.redeemCode}</span> at checkout
          </p>
          <p className="text-xs text-muted-foreground">
            Up to ₹{offer.maxCashback} cashback • Min order ₹{offer.minAmount}
          </p>
        </div>
      </div>

      {/* Product Categories */}
      {categories.map(category => (
        <div key={category} className="space-y-3">
          <h2 className="text-lg font-semibold">{category}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {products.filter(p => p.category === category).map(product => {
              const inCart = cart.find(item => item.id === product.id);
              return (
                <Card key={product.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-3 sm:p-4 space-y-2">
                    <div className="aspect-square overflow-hidden rounded-lg bg-muted/30">
                      <img
                        src={getProductImage(product.image)}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-sm line-clamp-2 leading-tight">{product.name}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs text-muted-foreground">{product.rating}</span>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-sm">₹{product.price.toLocaleString()}</span>
                      <span className="text-xs text-muted-foreground line-through">₹{product.originalPrice.toLocaleString()}</span>
                    </div>
                    {inCart ? (
                      <div className="flex items-center justify-between gap-1">
                        <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQuantity(product.id, -1)}>
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="font-semibold text-sm">{inCart.quantity}</span>
                        <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQuantity(product.id, 1)}>
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" className="w-full text-xs h-8" onClick={() => addToCart(product)}>
                        <Plus className="w-3 h-3 mr-1" /> Add
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {/* Floating Cart Button (mobile) */}
      {cartCount > 0 && (
        <div className="fixed bottom-20 left-4 right-4 sm:hidden z-40">
          <Button className="w-full shadow-lg" size="lg" onClick={() => setShowCart(true)}>
            <ShoppingCart className="w-5 h-5 mr-2" />
            {cartCount} items • ₹{cartTotal.toLocaleString()} — View Cart
          </Button>
        </div>
      )}

      {/* Cart Dialog */}
      <Dialog open={showCart} onOpenChange={setShowCart}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" /> Your Cart
            </DialogTitle>
            <DialogDescription>
              {cart.length === 0 ? "Your cart is empty" : `${cartCount} item(s) from ${brandName}`}
            </DialogDescription>
          </DialogHeader>

          {cart.length > 0 && (
            <ScrollArea className="max-h-64">
              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center gap-3">
                    <img 
                      src={getProductImage(item.image)} 
                      alt={item.name} 
                      className="w-10 h-10 rounded object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">₹{item.price.toLocaleString()} × {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-sm shrink-0">₹{(item.price * item.quantity).toLocaleString()}</p>
                    <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => removeFromCart(item.id)}>
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {cart.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">₹{cartTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Coupon</span>
                  <span className="font-mono text-primary text-xs">{offer.redeemCode}</span>
                </div>
              </div>
              <DialogFooter>
                <Button className="w-full" size="lg" onClick={handleCheckout}>
                  Proceed to Pay • ₹{cartTotal.toLocaleString()}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BrandStore;
