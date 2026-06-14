import React, { useState } from 'react';
import { ShoppingBag, MapPin, Navigation, ArrowRight, CheckCircle2, Loader2, Phone } from 'lucide-react';

const ACTIVE_IP = "10.0.13.206"; 
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || `http://${ACTIVE_IP}:8000`;

interface CartItem {
  product: any;
  hub: any;
}

interface CartCheckoutProps {
  cart: CartItem[];
  user: any;
  onClearCart: () => void;
  onCheckoutSuccess: (deliveryId: string) => void;
}

export const CartCheckout: React.FC<CartCheckoutProps> = ({ cart, user, onClearCart, onCheckoutSuccess }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [stkStatus, setStkStatus] = useState<'IDLE' | 'PROMPTED' | 'SUCCESS' | 'ERROR'>('IDLE');
  
  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center gap-4 mt-20">
         <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center">
            <ShoppingBag className="w-10 h-10 text-gray-600" />
         </div>
         <h2 className="text-xl font-black text-white">Your cart is empty</h2>
         <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest max-w-[200px]">Add some items from the storefront to get started</p>
      </div>
    );
  }

  // Basic calculation
  const subtotal = cart.reduce((acc, item) => acc + item.product.price, 0);
  const deliveryFee = 250; // Hardcoded base for demo
  const totalWeight = cart.reduce((acc, item) => acc + item.product.weight_kg, 0);

  const handleCheckout = async () => {
    setIsProcessing(true);
    setStkStatus('PROMPTED');

    // MOCK M-Pesa Delay
    await new Promise(r => setTimeout(r, 2000));
    
    try {
       // 1. Authorize Delivery
       // Assuming first item's hub is the target hub (MVP logic)
       const primaryHub = cart[0].hub;
       
       const delRes = await fetch(`${BACKEND_URL}/api/v1/deliveries/authorize`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           customer_id: user.id,
           company_id: primaryHub.company_id,
           origin_lat: -1.2921, // Tustar HQ / Hub
           origin_lon: 36.7884,
           destination_lat: -1.2650, // Mock customer location (Westlands)
           destination_lon: 36.8000,
           package_weight_kg: totalWeight,
           scheduled_at: null
         })
       });

       if (!delRes.ok) throw new Error("Failed to authorize mission");
       const delData = await delRes.json();
       const deliveryId = delData.delivery_id;

       // 2. STK Push / FinTech Checkout
       const payRes = await fetch(`${BACKEND_URL}/api/v1/fintech/checkout/${deliveryId}?phone_number=254700000000`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' }
       });

       if (!payRes.ok) throw new Error("Payment Failed");
       
       setStkStatus('SUCCESS');
       await new Promise(r => setTimeout(r, 1500));
       onClearCart();
       onCheckoutSuccess(deliveryId);

    } catch (e) {
       console.error(e);
       setStkStatus('ERROR');
       setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 pb-32">
       <h2 className="text-2xl font-black text-white">Checkout</h2>

       <div className="bg-white/5 rounded-[2rem] p-6 border border-white/5 flex flex-col gap-6">
          <div className="flex items-start gap-4 pb-6 border-b border-white/5">
             <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center shrink-0">
               <MapPin className="w-5 h-5 text-cyan-400" />
             </div>
             <div>
               <h4 className="text-sm font-black text-white">Delivery Location</h4>
               <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Westlands, Nairobi</p>
             </div>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Order Summary</h4>
            {cart.map((item, i) => (
              <div key={i} className="flex justify-between items-center">
                 <div className="flex items-center gap-3">
                   <div className="w-8 h-8 bg-black rounded-xl border border-white/10 flex items-center justify-center text-[10px] font-black text-white">
                     1x
                   </div>
                   <span className="text-sm font-bold text-white">{item.product.name}</span>
                 </div>
                 <span className="text-sm font-black text-gray-400">KES {item.product.price}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 pt-6 border-t border-white/5">
             <div className="flex justify-between items-center text-sm font-bold text-gray-500">
                <span>Subtotal</span>
                <span>KES {subtotal}</span>
             </div>
             <div className="flex justify-between items-center text-sm font-bold text-gray-500">
                <span>UAV Delivery Fee</span>
                <span>KES {deliveryFee}</span>
             </div>
             <div className="flex justify-between items-center text-lg font-black text-white mt-2">
                <span>Total</span>
                <span className="text-cyan-400">KES {subtotal + deliveryFee}</span>
             </div>
          </div>
       </div>

       <button 
         disabled={isProcessing}
         onClick={handleCheckout}
         className={`w-full p-5 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${
           isProcessing ? 'bg-white/10 text-white cursor-not-allowed' : 'bg-green-500 text-black hover:bg-green-400'
         }`}
       >
          {stkStatus === 'IDLE' && (
            <>
              <Phone className="w-5 h-5" />
              Pay with M-Pesa
            </>
          )}
          {stkStatus === 'PROMPTED' && (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Check your phone...
            </>
          )}
          {stkStatus === 'SUCCESS' && (
            <>
              <CheckCircle2 className="w-5 h-5" />
              Payment Received
            </>
          )}
          {stkStatus === 'ERROR' && (
            <>
              Payment Failed. Try Again.
            </>
          )}
       </button>
    </div>
  );
};
