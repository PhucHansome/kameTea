import React, { useState } from 'react';
import { Product, CookingMethod, SelectedTopping, ToppingOption } from '../../types/pos';
import { usePOS } from '../../context/POSContext';
import { X, Plus, Minus, Check, Sparkles } from 'lucide-react';

interface CustomizationModalProps {
  product: Product;
  onClose: () => void;
  onConfirm: (customization: {
    cookingMethod?: CookingMethod;
    size?: { name: string; price: number };
    toppings?: SelectedTopping[];
    sugarLevel?: string;
    iceLevel?: string;
    note?: string;
    quantity: number;
  }) => void;
}

export const CustomizationModal: React.FC<CustomizationModalProps> = ({
  product,
  onClose,
  onConfirm,
}) => {
  const { toppings: allToppings } = usePOS();

  // Selected state
  const [selectedCookingMethod, setSelectedCookingMethod] = useState<CookingMethod | undefined>(
    product.cookingMethods && product.cookingMethods.length > 0 ? product.cookingMethods[0] : undefined
  );

  const [selectedSize, setSelectedSize] = useState<{ name: string; price: number } | undefined>(
    product.sizes && product.sizes.length > 0 ? product.sizes[0] : undefined
  );

  const [selectedToppings, setSelectedToppings] = useState<Record<string, number>>({});
  const [sugarLevel, setSugarLevel] = useState<string>('100%');
  const [iceLevel, setIceLevel] = useState<string>('100%');
  const [quantity, setQuantity] = useState<number>(1);
  const [note, setNote] = useState<string>('');

  const handleToppingToggle = (top: ToppingOption) => {
    setSelectedToppings((prev) => {
      const current = prev[top.id] || 0;
      if (current > 0) {
        const next = { ...prev };
        delete next[top.id];
        return next;
      }
      return { ...prev, [top.id]: 1 };
    });
  };

  const handleToppingQtyChange = (topId: string, delta: number) => {
    setSelectedToppings((prev) => {
      const current = prev[topId] || 0;
      const next = current + delta;
      if (next <= 0) {
        const updated = { ...prev };
        delete updated[topId];
        return updated;
      }
      return { ...prev, [topId]: next };
    });
  };

  // Calculate current unit price
  let currentUnitPrice = product.basePrice;
  if (selectedSize) {
    currentUnitPrice = selectedSize.price;
  }
  if (selectedCookingMethod) {
    currentUnitPrice += selectedCookingMethod.priceDelta;
  }
  const toppingTotal = Object.entries(selectedToppings).reduce((sum, [id, qty]) => {
    const top = allToppings.find((t) => t.id === id);
    return sum + (top ? top.price * Number(qty) : 0);
  }, 0);
  currentUnitPrice += toppingTotal;

  const totalCalculated = currentUnitPrice * quantity;

  const handleSave = () => {
    const toppingsList: SelectedTopping[] = Object.entries(selectedToppings)
      .map(([id, qty]) => {
        const top = allToppings.find((t) => t.id === id);
        if (!top) return null;
        return {
          id: top.id,
          name: top.name,
          price: top.price,
          quantity: qty,
        };
      })
      .filter(Boolean) as SelectedTopping[];

    onConfirm({
      cookingMethod: selectedCookingMethod,
      size: selectedSize,
      toppings: toppingsList,
      sugarLevel: product.station === 'BAR' ? sugarLevel : undefined,
      iceLevel: product.station === 'BAR' ? iceLevel : undefined,
      note: note.trim() || undefined,
      quantity,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50 dark:bg-stone-800/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300">
                {product.station === 'BAR' ? 'Đồ uống / Bar' : 'Bếp / Nướng'}
              </span>
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                {product.name}
              </h3>
            </div>
            <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
              Đơn giá cơ bản: {product.basePrice.toLocaleString('vi-VN')}đ /{product.unit}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          {/* Size Selection (for Lẩu / Drinks with sizes) */}
          {product.sizes && product.sizes.length > 0 && (
            <div>
              <label className="block text-sm font-bold text-stone-800 dark:text-stone-200 mb-2">
                Chọn Size / Khẩu phần <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {product.sizes.map((s) => {
                  const isSelected = selectedSize?.name === s.name;
                  return (
                    <button
                      key={s.name}
                      type="button"
                      onClick={() => setSelectedSize(s)}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-950 dark:text-amber-100 font-semibold shadow-xs ring-1 ring-amber-500'
                          : 'border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{s.name}</span>
                        {isSelected && <Check className="w-4 h-4 text-amber-600" />}
                      </div>
                      <span className="text-sm font-bold text-amber-700 dark:text-amber-400 mt-1">
                        {s.price.toLocaleString('vi-VN')}đ
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cooking Methods (for Ốc, Ngao, Sò, Nướng) */}
          {product.cookingMethods && product.cookingMethods.length > 0 && (
            <div>
              <label className="block text-sm font-bold text-stone-800 dark:text-stone-200 mb-2">
                Chọn Cách Chế Biến / Loại Sốt <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {product.cookingMethods.map((cm) => {
                  const isSelected = selectedCookingMethod?.id === cm.id;
                  return (
                    <button
                      key={cm.id}
                      type="button"
                      onClick={() => setSelectedCookingMethod(cm)}
                      className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all text-xs sm:text-sm ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-950 dark:text-amber-100 font-bold shadow-xs ring-1 ring-amber-500'
                          : 'border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate">{cm.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0 ml-1" />}
                      </div>
                      {cm.priceDelta > 0 && (
                        <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 mt-1">
                          +{cm.priceDelta.toLocaleString('vi-VN')}đ
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sugar & Ice customization for Drinks */}
          {product.station === 'BAR' && (
            <div className="space-y-4 pt-2 border-t border-stone-200 dark:border-stone-800">
              {/* Sugar Level */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                  Mức Đường
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {['100%', '70%', '50%', '30%', '0% (Không đường)'].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setSugarLevel(lvl)}
                      className={`py-2 px-1 text-center rounded-lg text-xs font-medium transition ${
                        sugarLevel === lvl
                          ? 'bg-amber-500 text-stone-900 font-bold shadow-xs'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                      }`}
                    >
                      {lvl.replace(' (Không đường)', '')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ice Level */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                  Mức Đá
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {['100%', '70%', '50%', 'Không đá', 'Uống Nóng'].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setIceLevel(lvl)}
                      className={`py-2 px-1 text-center rounded-lg text-xs font-medium transition ${
                        iceLevel === lvl
                          ? 'bg-amber-500 text-stone-900 font-bold shadow-xs'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Toppings (Allowed for Drinks, Milk Tea, Desserts) */}
          {product.allowedToppings && (
            <div className="pt-2 border-t border-stone-200 dark:border-stone-800">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Chọn Topping Thêm
                </label>
                <span className="text-xs text-stone-500">Có thể chọn nhiều</span>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {allToppings.map((top) => {
                  const qty = selectedToppings[top.id] || 0;
                  const isSelected = qty > 0;
                  return (
                    <div
                      key={top.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50/80 dark:bg-amber-950/30 text-stone-900 dark:text-stone-100'
                          : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      <div
                        className="cursor-pointer flex-1 mr-2"
                        onClick={() => handleToppingToggle(top)}
                      >
                        <p className="text-xs font-bold leading-tight">{top.name}</p>
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                          +{top.price.toLocaleString('vi-VN')}đ
                        </p>
                      </div>

                      {isSelected ? (
                        <div className="flex items-center gap-1 bg-white dark:bg-stone-800 rounded-lg p-0.5 border border-stone-300 dark:border-stone-700">
                          <button
                            type="button"
                            onClick={() => handleToppingQtyChange(top.id, -1)}
                            className="p-1 hover:bg-stone-100 dark:hover:bg-stone-700 rounded text-stone-600 dark:text-stone-300"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold w-4 text-center">{qty}</span>
                          <button
                            type="button"
                            onClick={() => handleToppingQtyChange(top.id, 1)}
                            className="p-1 hover:bg-stone-100 dark:hover:bg-stone-700 rounded text-stone-600 dark:text-stone-300"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToppingToggle(top)}
                          className="px-2 py-1 rounded-md text-xs font-medium bg-stone-100 dark:bg-stone-800 hover:bg-amber-100 dark:hover:bg-amber-900 hover:text-amber-800 transition"
                        >
                          Thêm
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Note Input */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
              Ghi chú cho Bếp / Pha chế
            </label>
            <input
              type="text"
              placeholder="VD: Không cay, ít ngọt, làm cay nhiều, mang thêm chén mắm..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/80 flex items-center justify-between gap-4">
          {/* Quantity selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-stone-600 dark:text-stone-400 hidden sm:inline">
              Số lượng:
            </span>
            <div className="flex items-center border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-xl p-1 shadow-xs">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center text-sm font-black text-stone-900 dark:text-stone-100">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 text-sm transition"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-98 text-stone-950 font-bold text-sm shadow-md shadow-amber-500/20 flex items-center gap-2 transition"
            >
              <span>Thêm vào đơn</span>
              <span className="bg-amber-400/80 px-2 py-0.5 rounded-md text-xs font-black">
                {totalCalculated.toLocaleString('vi-VN')}đ
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
