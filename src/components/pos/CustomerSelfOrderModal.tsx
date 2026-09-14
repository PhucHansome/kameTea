import React, { useState } from 'react';
import {
  TableItem,
  Product,
  OrderItem,
  Category,
  SelectedTopping,
  CookingMethod,
} from '../../types/pos';
import { usePOS } from '../../context/POSContext';
import { Logo } from '../common/Logo';
import {
  X,
  ShoppingBag,
  Plus,
  Minus,
  Sparkles,
  CheckCircle2,
  Utensils,
  Coffee,
  Flame,
  Clock,
  ArrowRight,
  ChevronRight,
  User,
  FileText,
  Check,
} from 'lucide-react';

interface CustomerSelfOrderModalProps {
  table: TableItem;
  onClose: () => void;
  isStandalone?: boolean;
}

export const CustomerSelfOrderModal: React.FC<CustomerSelfOrderModalProps> = ({
  table,
  onClose,
  isStandalone = false,
}) => {
  const { categories, products, toppings, submitCustomerSelfOrder } = usePOS();

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [guestName, setGuestName] = useState<string>('');
  const [customerNote, setCustomerNote] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [submittedOrderCode, setSubmittedOrderCode] = useState<string>('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState<boolean>(false);

  // Selected item for customization
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<CookingMethod | undefined>(undefined);
  const [selectedSize, setSelectedSize] = useState<{ name: string; price: number } | undefined>(
    undefined
  );
  const [selectedToppings, setSelectedToppings] = useState<SelectedTopping[]>([]);
  const [sugarLevel, setSugarLevel] = useState<string>('100%');
  const [iceLevel, setIceLevel] = useState<string>('100%');
  const [itemNote, setItemNote] = useState<string>('');
  const [itemQty, setItemQty] = useState<number>(1);

  const availableProducts = products.filter((p) => p.isAvailable);

  const filteredProducts =
    selectedCategory === 'ALL'
      ? availableProducts
      : availableProducts.filter((p) => p.categoryId === selectedCategory);

  const openCustomizer = (product: Product) => {
    setCustomizingProduct(product);
    setSelectedMethod(product.cookingMethods?.[0]);
    setSelectedSize(product.sizes?.[0]);
    setSelectedToppings([]);
    setSugarLevel('100%');
    setIceLevel('100%');
    setItemNote('');
    setItemQty(1);
  };

  const handleToggleTopping = (topping: { id: string; name: string; price: number }) => {
    setSelectedToppings((prev) => {
      const exists = prev.find((t) => t.id === topping.id);
      if (exists) {
        return prev.filter((t) => t.id !== topping.id);
      } else {
        return [...prev, { ...topping, quantity: 1 }];
      }
    });
  };

  const handleAddToCart = () => {
    if (!customizingProduct) return;

    const basePrice = selectedSize ? selectedSize.price : customizingProduct.basePrice;
    const methodPrice = selectedMethod ? selectedMethod.priceDelta : 0;
    const toppingsTotal = selectedToppings.reduce((sum, t) => sum + t.price * t.quantity, 0);
    const unitPrice = basePrice + methodPrice + toppingsTotal;

    const targetSugar = customizingProduct.station === 'BAR' ? sugarLevel : undefined;
    const targetIce = customizingProduct.station === 'BAR' ? iceLevel : undefined;
    const targetNote = itemNote.trim() ? itemNote.trim() : undefined;

    setCart((prev) => {
      // Find if an identical item is already in cart
      const existingIdx = prev.findIndex((it) => {
        if (it.productId !== customizingProduct.id) return false;
        if ((it.selectedSize?.name || '') !== (selectedSize?.name || '')) return false;
        if ((it.selectedCookingMethod?.name || '') !== (selectedMethod?.name || '')) return false;
        if ((it.sugarLevel || '') !== (targetSugar || '')) return false;
        if ((it.iceLevel || '') !== (targetIce || '')) return false;
        if ((it.note || '') !== (targetNote || '')) return false;

        const itTops = (it.selectedToppings || []).map((t) => `${t.id}:${t.quantity}`).sort().join(',');
        const curTops = selectedToppings.map((t) => `${t.id}:${t.quantity}`).sort().join(',');
        return itTops === curTops;
      });

      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx] = {
          ...next[existingIdx],
          quantity: next[existingIdx].quantity + itemQty,
        };
        return next;
      }

      const newItem: OrderItem = {
        id: 'cust-item-' + Date.now() + Math.random().toString(36).substring(2, 5),
        productId: customizingProduct.id,
        productName: customizingProduct.name,
        unitPrice,
        quantity: itemQty,
        station: customizingProduct.station,
        selectedCookingMethod: selectedMethod,
        selectedSize,
        selectedToppings,
        sugarLevel: targetSugar,
        iceLevel: targetIce,
        note: targetNote,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      };

      return [...prev, newItem];
    });

    setCustomizingProduct(null);
  };

  const updateCartQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQ = item.quantity + delta;
            return newQ > 0 ? { ...item, quantity: newQ } : null;
          }
          return item;
        })
        .filter(Boolean) as OrderItem[]
    );
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleSubmitOrder = async () => {
    if (cart.length === 0 || isSubmittingOrder) return;
    setIsSubmittingOrder(true);
    try {
      const { order } = await submitCustomerSelfOrder(
        table.id,
        cart,
        guestName.trim() || undefined,
        customerNote.trim() || undefined
      );
      setSubmittedOrderCode(order.orderCode);
      setIsSuccess(true);
      setCart([]);
    } catch (err: any) {
      alert(err?.message || 'Có lỗi khi gửi đơn hàng');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full h-[95vh] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col relative">
        {/* Top Header */}
        <div className="p-3.5 sm:p-4 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Logo size="sm" showSubtitle={false} />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm tracking-wide text-amber-400">
                  {table.name}
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                  {table.zone}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Tự phục vụ & gọi món tại bàn</p>
            </div>
          </div>

          {!isStandalone && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Success Screen State */}
        {isSuccess ? (
          <div className="flex-1 p-6 flex flex-col items-center justify-center text-center overflow-y-auto space-y-4">
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/60 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-2 animate-bounce">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              Đã Gửi Đơn Thành Công!
            </h3>

            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-2xl p-4 w-full text-left space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Mã đơn gọi:</span>
                <span className="font-black text-amber-700 dark:text-amber-400 font-mono text-sm">
                  {submittedOrderCode}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Vị trí:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {table.name} ({table.zone})
                </span>
              </div>
              {guestName && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Khách hàng:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{guestName}</span>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              🔔 Quầy thu ngân & pha chế đã nhận được thông báo và đang tiến hành phục vụ món cho bạn. Xin vui lòng đợi trong giây lát!
            </p>

            <div className="pt-4 w-full flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setIsSuccess(false)}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm shadow-md transition"
              >
                Gọi Thêm Món Khác
              </button>
              {!isStandalone && (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Hoàn Tất & Thoát
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Main Menu & Catalog View */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Category horizontal scroll bar */}
            <div className="p-2.5 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex gap-2 overflow-x-auto no-scrollbar shrink-0">
              <button
                type="button"
                onClick={() => setSelectedCategory('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  selectedCategory === 'ALL'
                    ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                }`}
              >
                Tất cả ({availableProducts.length})
              </button>
              {categories.map((cat) => {
                const count = availableProducts.filter((p) => p.categoryId === cat.id).length;
                if (count === 0) return null;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                      selectedCategory === cat.id
                        ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Product List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {filteredProducts.map((product) => {
                return (
                  <div
                    key={product.id}
                    className="p-3 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex items-center justify-between gap-3 hover:border-amber-400 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center font-bold text-xl shrink-0 border border-amber-200 dark:border-amber-900/50">
                          {product.station === 'BAR' ? '🧋' : '🐚'}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                          {product.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-black text-amber-600 dark:text-amber-400 text-xs sm:text-sm">
                            {product.basePrice.toLocaleString('vi-VN')}đ
                          </span>
                          <span className="text-[10px] text-slate-400">/{product.unit}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => openCustomizer(product)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1 shadow-xs shrink-0 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Chọn món</span>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Bottom Cart Drawer / Summary */}
            {cart.length > 0 && (
              <div className="p-3.5 bg-slate-900 text-white border-t border-slate-800 shrink-0 space-y-3 shadow-2xl">
                {/* Mini items preview */}
                <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1 text-xs">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between bg-slate-800/80 p-2 rounded-xl"
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="font-bold truncate">{item.productName}</div>
                        <div className="text-[10px] text-slate-400">
                          {(item.unitPrice * item.quantity).toLocaleString('vi-VN')}đ
                          {item.selectedCookingMethod ? ` • ${item.selectedCookingMethod.name}` : ''}
                          {item.selectedToppings && item.selectedToppings.length > 0
                            ? ` +${item.selectedToppings.map((t) => t.name).join(', ')}`
                            : ''}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 bg-slate-700/70 rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.id, -1)}
                          className="w-5 h-5 rounded flex items-center justify-center hover:bg-slate-600 text-slate-300"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.id, 1)}
                          className="w-5 h-5 rounded flex items-center justify-center hover:bg-slate-600 text-amber-400"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Customer input fields */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <input
                    type="text"
                    placeholder="Tên bạn (tuỳ chọn)"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-hidden focus:border-amber-500"
                  />
                  <input
                    type="text"
                    placeholder="Ghi chú món chung..."
                    value={customerNote}
                    onChange={(e) => setCustomerNote(e.target.value)}
                    className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="button"
                  disabled={isSubmittingOrder || cart.length === 0}
                  onClick={handleSubmitOrder}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 text-slate-950 font-black text-sm flex items-center justify-between px-4 shadow-lg shadow-amber-500/20 transition active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4" />
                    <span>
                      {isSubmittingOrder ? 'Đang gửi đơn hàng...' : `Xác Nhận Gọi Món (${cartItemCount})`}
                    </span>
                  </div>
                  <span className="font-mono text-base">{cartSubtotal.toLocaleString('vi-VN')}đ</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Customization Sub-Modal */}
        {customizingProduct && (
          <div className="absolute inset-0 z-20 bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-4 sm:p-5 flex flex-col max-h-[85vh] overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h4 className="font-black text-base text-slate-900 dark:text-white">
                    {customizingProduct.name}
                  </h4>
                  <p className="text-xs font-black text-amber-600 dark:text-amber-400">
                    {customizingProduct.basePrice.toLocaleString('vi-VN')}đ
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCustomizingProduct(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs">
                {/* Cooking methods if kitchen item */}
                {customizingProduct.cookingMethods &&
                  customizingProduct.cookingMethods.length > 0 && (
                    <div className="space-y-2">
                      <label className="font-bold text-slate-700 dark:text-slate-300 block">
                        Cách chế biến:
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {customizingProduct.cookingMethods.map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setSelectedMethod(m)}
                            className={`p-2 rounded-xl font-bold border transition text-left text-xs ${
                              selectedMethod?.id === m.id
                                ? 'border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <span>{m.name}</span>
                            {m.priceDelta > 0 && (
                              <span className="block text-[10px] text-amber-600 font-mono">
                                +{m.priceDelta.toLocaleString('vi-VN')}đ
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Toppings if bar item or configured */}
                {customizingProduct.station === 'BAR' && toppings.length > 0 && (
                  <div className="space-y-2">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block">
                      Topping thêm:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {toppings.map((top) => {
                        const isChecked = selectedToppings.some((t) => t.id === top.id);
                        return (
                          <button
                            key={top.id}
                            type="button"
                            onClick={() => handleToggleTopping(top)}
                            className={`p-2 rounded-xl font-bold border transition text-left flex justify-between items-center text-xs ${
                              isChecked
                                ? 'border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <span className="truncate">{top.name}</span>
                            <span className="text-[10px] opacity-80 shrink-0">
                              +{top.price.toLocaleString('vi-VN')}đ
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Item note */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">
                    Ghi chú món:
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Ít cay, không hành, v.v."
                    value={itemNote}
                    onChange={(e) => setItemNote(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                {/* Quantity selector */}
                <div className="flex items-center justify-between pt-2">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Số lượng:</span>
                  <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setItemQty(Math.max(1, itemQty - 1))}
                      className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 shadow-xs"
                    >
                      -
                    </button>
                    <span className="font-black text-sm w-5 text-center">{itemQty}</span>
                    <button
                      type="button"
                      onClick={() => setItemQty(itemQty + 1)}
                      className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center font-bold text-amber-600 dark:text-amber-400 shadow-xs"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Add to order cart button */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md transition"
                >
                  Thêm Vào Giỏ Gọi Món
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
