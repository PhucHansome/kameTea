import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { Product, Category, StationType, CookingMethod } from '../../types/pos';
import { CurrencyInput } from '../common/CurrencyInput';
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Check,
  Search,
  Sparkles,
  Flame,
  CupSoda,
  Layers,
  X,
} from 'lucide-react';

export const MenuManagement: React.FC = () => {
  const {
    products,
    categories,
    toppings,
    saveProduct,
    deleteProduct,
    toggleProductAvailability,
    saveCategory,
    deleteCategory,
    isSubmitting,
  } = usePOS();

  const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'CATEGORIES' | 'TOPPINGS'>('PRODUCTS');
  const [selectedCatId, setSelectedCatId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Product Form Modal state
  const [showProductModal, setShowProductModal] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form fields
  const [prodName, setProdName] = useState('');
  const [prodCategoryId, setProdCategoryId] = useState(categories[0]?.id || '');
  const [prodPrice, setProdPrice] = useState<number>(28000);
  const [prodUnit, setProdUnit] = useState('ly');
  const [prodStation, setProdStation] = useState<StationType>('BAR');
  const [prodAllowedToppings, setProdAllowedToppings] = useState(true);
  const [prodIsPopular, setProdIsPopular] = useState(false);
  const [prodCookingMethods, setProdCookingMethods] = useState<CookingMethod[]>([]);

  // Category Modal State
  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);
  const [catName, setCatName] = useState('');
  const [catStation, setCatStation] = useState<StationType>('BAR');

  const openNewProductModal = () => {
    setEditingProduct(null);
    setProdName('');
    setProdCategoryId(categories[0]?.id || '');
    setProdPrice(28000);
    setProdUnit('ly');
    setProdStation('BAR');
    setProdAllowedToppings(true);
    setProdIsPopular(false);
    setProdCookingMethods([]);
    setShowProductModal(true);
  };

  const openEditProductModal = (product: Product) => {
    setEditingProduct(product);
    setProdName(product.name);
    setProdCategoryId(product.categoryId);
    setProdPrice(product.basePrice);
    setProdUnit(product.unit);
    setProdStation(product.station);
    setProdAllowedToppings(!!product.allowedToppings);
    setProdIsPopular(!!product.isPopular);
    setProdCookingMethods(product.cookingMethods || []);
    setShowProductModal(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) {
      alert('Vui lòng nhập tên món');
      return;
    }

    const item: Product = {
      id: editingProduct ? editingProduct.id : 'P-' + Date.now(),
      categoryId: prodCategoryId,
      name: prodName.trim(),
      basePrice: Number(prodPrice),
      unit: prodUnit,
      station: prodStation,
      isAvailable: editingProduct ? editingProduct.isAvailable : true,
      isPopular: prodIsPopular,
      allowedToppings: prodAllowedToppings,
      cookingMethods: prodCookingMethods.length > 0 ? prodCookingMethods : undefined,
    };

    saveProduct(item);
    setShowProductModal(false);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    const newCat: Category = {
      id: 'cat-' + Date.now(),
      name: catName.trim(),
      icon: catStation === 'BAR' ? 'CupSoda' : 'Flame',
      station: catStation,
    };

    saveCategory(newCat);
    setCatName('');
    setShowCategoryModal(false);
  };

  const filteredProducts = products.filter((p) => {
    if (selectedCatId !== 'ALL' && p.categoryId !== selectedCatId) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.basePrice.toString().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500 text-stone-950 shadow-xs">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-stone-900 dark:text-stone-100">
              Quản Lý Menu, Danh Mục & Topping
            </h2>
            <p className="text-xs text-stone-500 font-medium mt-0.5">
              Cài đặt danh sách món ăn, giá bán, trạm làm món và trạng thái còn/hết hàng.
            </p>
          </div>
        </div>

        {/* Tab Pills */}
        <div className="flex rounded-xl bg-stone-100 dark:bg-stone-800 p-1 border border-stone-200 dark:border-stone-700">
          <button
            type="button"
            onClick={() => setActiveTab('PRODUCTS')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'PRODUCTS'
                ? 'bg-amber-500 text-stone-950 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Món Ăn & Đồ Uống ({products.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('CATEGORIES')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'CATEGORIES'
                ? 'bg-amber-500 text-stone-950 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            <span>Danh Mục ({categories.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('TOPPINGS')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'TOPPINGS'
                ? 'bg-amber-500 text-stone-950 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Topping ({toppings.length})</span>
          </button>
        </div>
      </div>

      {/* PRODUCTS TAB */}
      {activeTab === 'PRODUCTS' && (
        <div className="space-y-4">
          {/* Filters & Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-stone-50 dark:bg-stone-800/40 p-4 rounded-2xl border border-stone-200 dark:border-stone-800">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm món trong menu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl text-xs border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900"
                />
              </div>

              <select
                value={selectedCatId}
                onChange={(e) => setSelectedCatId(e.target.value)}
                className="px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-bold"
              >
                <option value="ALL">Tất cả danh mục ({products.length})</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={openNewProductModal}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm món mới</span>
            </button>
          </div>

          {/* Product Table */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 dark:bg-stone-800/60 text-stone-500">
                <tr>
                  <th className="p-3.5">Tên món</th>
                  <th className="p-3.5">Danh mục</th>
                  <th className="p-3.5">Trạm</th>
                  <th className="p-3.5 text-right">Giá bán</th>
                  <th className="p-3.5 text-center">Trạng thái kho</th>
                  <th className="p-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {filteredProducts.map((prod) => {
                  const cat = categories.find((c) => c.id === prod.categoryId);
                  return (
                    <tr key={prod.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30">
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-900 dark:text-stone-100">
                            {prod.name}
                          </span>
                          {prod.isPopular && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-red-100 text-red-700">
                              Hot
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-stone-400">ĐVT: {prod.unit}</span>
                      </td>
                      <td className="p-3.5 text-stone-600 dark:text-stone-400">
                        {cat?.name || 'Khác'}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                            prod.station === 'BAR'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-orange-100 text-orange-900'
                          }`}
                        >
                          {prod.station === 'BAR' ? 'Quầy Bar' : 'Bếp Ốc'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-black text-amber-600 dark:text-amber-400 text-sm">
                        {prod.basePrice.toLocaleString('vi-VN')}đ
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => toggleProductAvailability(prod.id)}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                            prod.isAvailable
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 hover:bg-red-200'
                          }`}
                        >
                          {prod.isAvailable ? '✓ Còn hàng' : '✕ Hết hàng'}
                        </button>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditProductModal(prod)}
                            className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 transition"
                            title="Sửa món"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Bạn có chắc muốn xóa món "${prod.name}"?`)) {
                                deleteProduct(prod.id);
                              }
                            }}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition"
                            title="Xóa món"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CATEGORIES TAB */}
      {activeTab === 'CATEGORIES' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-stone-800 dark:text-stone-200">
              Danh sách nhóm món ăn / đồ uống ({categories.length})
            </h3>
            <button
              type="button"
              onClick={() => setShowCategoryModal(true)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm danh mục</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map((cat) => {
              const count = products.filter((p) => p.categoryId === cat.id).length;
              return (
                <div
                  key={cat.id}
                  className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-4 flex items-center justify-between shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-700">
                      {cat.station === 'BAR' ? <CupSoda className="w-5 h-5" /> : <Flame className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                        {cat.name}
                      </h4>
                      <p className="text-xs text-stone-500">
                        {count} món • Trạm: {cat.station === 'BAR' ? 'Bar' : 'Bếp'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Xóa danh mục "${cat.name}"?`)) {
                        deleteCategory(cat.id);
                      }
                    }}
                    className="p-1.5 text-stone-400 hover:text-red-500 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TOPPINGS TAB */}
      {activeTab === 'TOPPINGS' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-4 shadow-xs">
            <h3 className="text-sm font-bold text-stone-800 dark:text-stone-200 mb-3">
              Danh sách Topping Trà Sữa (Theo Menu Quán KAME)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {toppings.map((top) => (
                <div
                  key={top.id}
                  className="p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50 flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs font-bold text-stone-900 dark:text-stone-100">
                      {top.name}
                    </p>
                    <p className="text-xs font-black text-amber-600">
                      +{top.price.toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Sẵn sàng
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Product Edit/Create Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 max-w-lg w-full border border-stone-200 dark:border-stone-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                {editingProduct ? 'Chỉnh sửa món' : 'Thêm món mới vào menu'}
              </h3>
              <button onClick={() => setShowProductModal(false)}>
                <X className="w-5 h-5 text-stone-400" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Tên món ăn / thức uống:
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Trà dâu Khe Sanh, Ốc mít xào sả ớt..."
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Danh mục:
                  </label>
                  <select
                    value={prodCategoryId}
                    onChange={(e) => setProdCategoryId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-bold"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Trạm chế biến:
                  </label>
                  <select
                    value={prodStation}
                    onChange={(e) => setProdStation(e.target.value as StationType)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-bold"
                  >
                    <option value="BAR">Quầy Bar (Đồ uống, Trà sữa)</option>
                    <option value="KITCHEN">Bếp (Ốc, Nướng, Ăn vặt)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Giá bán cơ bản (VNĐ):
                  </label>
                  <CurrencyInput
                    required
                    value={prodPrice}
                    onChange={(val) => setProdPrice(val)}
                    placeholder="VD: 28.000"
                    className="p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-black text-amber-600 text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Đơn vị tính (ĐVT):
                  </label>
                  <input
                    type="text"
                    required
                    value={prodUnit}
                    onChange={(e) => setProdUnit(e.target.value)}
                    placeholder="ly, phần, dĩa, con, nồi..."
                    className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prodAllowedToppings}
                    onChange={(e) => setProdAllowedToppings(e.target.checked)}
                    className="rounded text-amber-600"
                  />
                  <span>Cho phép chọn Topping</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prodIsPopular}
                    onChange={(e) => setProdIsPopular(e.target.checked)}
                    className="rounded text-amber-600"
                  />
                  <span>Gắn nhãn Món Bán Chạy (Hot)</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200 dark:border-stone-700">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-500 font-bold text-stone-950 shadow-xs disabled:opacity-50 transition"
                >
                  {isSubmitting ? 'Đang lưu...' : 'Lưu món ăn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 max-w-sm w-full border border-stone-200 dark:border-stone-800 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
              Thêm danh mục mới
            </h3>
            <form onSubmit={handleSaveCategory} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Tên danh mục:
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Trà Trái Cây, Ốc Sốt..."
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Trạm phụ trách:
                </label>
                <select
                  value={catStation}
                  onChange={(e) => setCatStation(e.target.value as StationType)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-bold"
                >
                  <option value="BAR">Quầy Bar (Đồ uống)</option>
                  <option value="KITCHEN">Bếp (Món ăn / Ốc)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-500 font-bold text-stone-950 shadow-xs disabled:opacity-50 transition"
                >
                  {isSubmitting ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
