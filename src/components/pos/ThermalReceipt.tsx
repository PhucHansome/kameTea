import React from 'react';
import { Order, TableItem, User, StoreSettings, PaymentMethodType } from '../../types/pos';
import { SacombankQR } from '../common/SacombankQR';

interface ThermalReceiptProps {
  order: Order;
  table: TableItem;
  activeUser: User;
  settings: StoreSettings;
  subtotal: number;
  discountAmount: number;
  discountPercent: number;
  shippingFee: number;
  taxAmount: number;
  totalPayable: number;
  paymentMethod: PaymentMethodType;
  cashGiven: number;
  changeReturn: number;
  cashAmountPaid: number;
  transferAmountPaid: number;
  isPreview?: boolean;
}

export const ThermalReceipt: React.FC<ThermalReceiptProps> = ({
  order,
  table,
  activeUser,
  settings,
  subtotal,
  discountAmount,
  discountPercent,
  shippingFee,
  taxAmount,
  totalPayable,
  paymentMethod,
  cashGiven,
  changeReturn,
  cashAmountPaid,
  transferAmountPaid,
  isPreview = false,
}) => {
  return (
    <div
      id="printable-receipt"
      className={`w-full bg-white text-stone-900 font-mono text-[11px] leading-tight space-y-2.5 ${
        isPreview
          ? 'p-4 rounded-2xl shadow-lg border border-stone-300 max-h-[460px] overflow-y-auto'
          : 'hidden print:block p-2'
      }`}
    >
      {/* Store Header */}
      <div className="text-center pb-2 border-b-2 border-dashed border-stone-400">
        <h4 className="font-black text-sm uppercase">{settings.storeName}</h4>
        <p className="text-[10px] text-stone-600">{settings.slogan}</p>
        <p className="text-[10px]">{settings.address}</p>
        <p className="text-[10px] font-bold">Hotline: {settings.phone}</p>
      </div>

      {/* Bill Meta */}
      <div className="py-1 border-b border-dashed border-stone-400 space-y-0.5 text-[10px]">
        <div className="flex justify-between font-bold">
          <span>HÓA ĐƠN: {order.orderCode}</span>
          <span>{order.orderType === 'TAKEAWAY' ? '🛵 MANG VỀ' : '🍽️ ĂN TẠI CHỖ'}</span>
        </div>
        <p>
          Bàn: {table.code} ({table.zone})
        </p>
        <p>Thời gian: {new Date().toLocaleString('vi-VN')}</p>
        <p>Thu ngân: {activeUser.name}</p>
        {order.deliveryPhone && <p>SĐT khách: {order.deliveryPhone}</p>}
        {order.deliveryAddress && <p>Địa chỉ: {order.deliveryAddress}</p>}
      </div>

      {/* Items List */}
      <div className="py-1 space-y-1 text-[11px]">
        <div className="flex justify-between font-bold border-b border-stone-200 pb-0.5">
          <span>Tên món</span>
          <span>Thành tiền</span>
        </div>
        {order.items
          .filter((i) => i.status !== 'CANCELLED')
          .map((item) => (
            <div key={item.id} className="flex justify-between">
              <span className="flex-1 pr-2">
                {item.quantity}x {item.productName}
                {item.selectedCookingMethod && ` (${item.selectedCookingMethod.name})`}
                {item.selectedSize && ` [${item.selectedSize.name}]`}
              </span>
              <span className="font-bold">
                {(item.unitPrice * item.quantity).toLocaleString('vi-VN')}
              </span>
            </div>
          ))}
      </div>

      {/* Summary & Totals */}
      <div className="pt-2 border-t-2 border-dashed border-stone-400 space-y-1 text-[11px]">
        <div className="flex justify-between">
          <span>Tạm tính món:</span>
          <span>{subtotal.toLocaleString('vi-VN')}đ</span>
        </div>

        {discountAmount > 0 && (
          <div className="flex justify-between text-stone-700">
            <span>Giảm giá ({discountPercent}%):</span>
            <span>-{discountAmount.toLocaleString('vi-VN')}đ</span>
          </div>
        )}

        {taxAmount > 0 && (
          <div className="flex justify-between text-stone-700">
            <span>Thuế VAT:</span>
            <span>+{taxAmount.toLocaleString('vi-VN')}đ</span>
          </div>
        )}

        {order.orderType === 'TAKEAWAY' && shippingFee > 0 && (
          <div className="flex justify-between font-bold">
            <span>Phí ship giao hàng:</span>
            <span>+{shippingFee.toLocaleString('vi-VN')}đ</span>
          </div>
        )}

        <div className="flex justify-between font-black text-sm pt-1 border-t border-stone-400">
          <span>TỔNG CỘNG:</span>
          <span>{totalPayable.toLocaleString('vi-VN')}đ</span>
        </div>

        {/* Payment Breakdown in Receipt */}
        <div className="pt-1 text-[10px] space-y-0.5 border-t border-stone-200 text-stone-700">
          <p className="font-bold">
            HTTT:{' '}
            {paymentMethod === 'SACOMBANK_QR'
              ? `Chuyển khoản QR ${settings.bankName || 'Ngân hàng'}`
              : paymentMethod === 'CASH'
              ? `Tiền mặt (Đưa: ${cashGiven.toLocaleString('vi-VN')}đ | Thối: ${changeReturn.toLocaleString('vi-VN')}đ)`
              : paymentMethod === 'MIXED'
              ? `Mix (Tiền mặt: ${cashAmountPaid.toLocaleString('vi-VN')}đ + CK QR: ${transferAmountPaid.toLocaleString('vi-VN')}đ)`
              : 'Thẻ / POS'}
          </p>
        </div>
      </div>

      {/* Sacombank QR in Receipt Footer for quick transfer or verification */}
      {(paymentMethod === 'SACOMBANK_QR' || (paymentMethod === 'MIXED' && transferAmountPaid > 0)) && (
        <div className="pt-2 border-t-2 border-dashed border-stone-400">
          <SacombankQR
            size="receipt"
            amount={paymentMethod === 'MIXED' ? transferAmountPaid : totalPayable}
            orderCode={order.orderCode}
            tableName={table.code}
          />
        </div>
      )}

      {/* Footer Greeting */}
      <div className="text-center pt-2 border-t border-dashed border-stone-300 text-[9px] space-y-0.5">
        <p className="font-bold">
          {settings.receiptFooter || 'Cảm ơn quý khách và hẹn gặp lại!'}
        </p>
        <p className="italic">Wifi: KAME_FreePass / MK: kame8888</p>
      </div>
    </div>
  );
};
