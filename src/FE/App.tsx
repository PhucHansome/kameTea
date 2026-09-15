import React, { useState, useEffect } from 'react';
import { POSProvider, usePOS } from './context/POSContext';
import { MainLayout } from './components/Sidebar/Sidebar';
import { PosTab } from './components/Pos/PosTab';
import { BillCheckoutModal } from './components/Pos/Modals/BillCheckoutModal';
import { SplitMergeTableModal } from './components/Pos/Modals/SplitMergeTableModal';
import { CustomerSelfOrderModal } from './components/Pos/Modals/CustomerSelfOrderModal';
import { PaymentSuccessModal } from './components/Pos/Modals/PaymentSuccessModal';
import { CupLabelModal } from './components/Pos/Modals/CupLabelModal';
import { QRNotificationToast } from './components/Pos/Modals/QRNotificationToast';
import { ThermalReceipt } from './components/Pos/SubComponents/ThermalReceipt';
import { KdsTab } from './components/Kds/KdsTab';
import { HrmTab } from './components/Hrm/HrmTab';
import { MenuTab } from './components/Menu/MenuTab';
import { ReportsTab } from './components/Reports/ReportsTab';
import { UsersTab } from './components/Users/UsersTab';
import { LoginView } from './components/Auth/LoginView';
import { GlobalToast } from './components/Common/GlobalToast';
import { TableItem, Order } from './types';

const POSContent: React.FC = () => {
  const { currentTab, setActiveTable, tables, isAuthenticated, isAdmin, settings } = usePOS();

  // Active modals
  const [checkoutTable, setCheckoutTable] = useState<TableItem | null>(null);
  const [splitMergeTable, setSplitMergeTable] = useState<TableItem | null>(null);
  const [customerOrderTable, setCustomerOrderTable] = useState<TableItem | null>(null);
  const [paymentSuccessOrder, setPaymentSuccessOrder] = useState<Order | null>(null);
  const [cupLabelSuccessOrder, setCupLabelSuccessOrder] = useState<Order | null>(null);

  // Parse QR Code Self-Order directly from URL (hash or search query)
  useEffect(() => {
    const parseQRUrl = () => {
      if (typeof window === 'undefined') return;

      const hash = window.location.hash;
      const search = window.location.search;

      let tableId: string | null = null;

      // Check hash #order-table=tbl-xxx or #table=xxx
      if (hash) {
        const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
        tableId = hashParams.get('order-table') || hashParams.get('table');
        if (!tableId && hash.includes('order-table=')) {
          tableId = hash.split('order-table=')[1]?.split('&')[0];
        }
      }

      // Check query ?table=xxx or ?order-table=xxx
      if (!tableId && search) {
        const queryParams = new URLSearchParams(search);
        tableId = queryParams.get('order-table') || queryParams.get('table');
      }

      if (tableId && tables.length > 0) {
        const matched = tables.find((t) => t.id === tableId || t.name.toLowerCase() === tableId.toLowerCase());
        if (matched) {
          setCustomerOrderTable(matched);
        } else {
          setCustomerOrderTable({
            id: tableId,
            name: `Bàn ${tableId}`,
            code: `Bàn ${tableId}`,
            zone: 'Trong Nhà',
            capacity: 4,
            status: 'EMPTY',
          });
        }
      }
    };

    parseQRUrl();
    window.addEventListener('hashchange', parseQRUrl);
    return () => window.removeEventListener('hashchange', parseQRUrl);
  }, [tables]);

  // 1. Customer Self-Order QR access
  if (customerOrderTable) {
    return (
      <div className="fixed inset-0 z-50 bg-stone-950 flex flex-col">
        <CustomerSelfOrderModal
          table={customerOrderTable}
          isStandalone={true}
          onClose={() => {
            setCustomerOrderTable(null);
            if (typeof window !== 'undefined' && window.location.hash) {
              window.location.hash = '';
            }
          }}
        />
        <GlobalToast />
      </div>
    );
  }

  // 2. Authentication Guard
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <LoginView />
        <GlobalToast />
      </div>
    );
  }

  return (
    <MainLayout onOpenSupabaseDocs={() => {}}>
      {/* 1. POS TAB */}
      {currentTab === 'pos' && (
        <PosTab
          onCheckoutTable={(table) => setCheckoutTable(table)}
          onSplitMergeTable={(table) => setSplitMergeTable(table)}
        />
      )}

      {/* 2. KITCHEN DISPLAY SYSTEM (KDS) */}
      {currentTab === 'kds' && <KdsTab />}

      {/* 3. MENU MANAGEMENT (Admin only) */}
      {currentTab === 'menu' && (isAdmin ? <MenuTab /> : null)}

      {/* 4. HUMAN RESOURCE MANAGEMENT (HRM) */}
      {currentTab === 'hrm' && <HrmTab />}

      {/* 5. REPORTS & P&L */}
      {currentTab === 'reports' && <ReportsTab />}

      {/* 6. USER MANAGEMENT & RBAC (Admin only) */}
      {currentTab === 'users' && (isAdmin ? <UsersTab /> : null)}

      {/* GLOBAL TOASTS & NOTIFICATIONS */}
      <QRNotificationToast />
      <GlobalToast />

      {/* CHECKOUT MODAL */}
      {checkoutTable && (
        <BillCheckoutModal
          table={checkoutTable}
          onClose={() => setCheckoutTable(null)}
          onPaymentDone={(paidOrder) => {
            setCheckoutTable(null);
            setActiveTable(null);
            if (paidOrder) {
              setPaymentSuccessOrder(paidOrder);
            }
          }}
        />
      )}

      {/* PAYMENT SUCCESS CELEBRATION MODAL */}
      {paymentSuccessOrder && (
        <>
          <PaymentSuccessModal
            order={paymentSuccessOrder}
            onClose={() => setPaymentSuccessOrder(null)}
            onPrintReceipt={() => {
              window.print();
            }}
            onPrintCupLabels={() => {
              setCupLabelSuccessOrder(paymentSuccessOrder);
            }}
          />
          <ThermalReceipt
            order={paymentSuccessOrder}
            table={
              tables.find((t) => t.id === paymentSuccessOrder.tableId) || {
                id: paymentSuccessOrder.tableId,
                name: paymentSuccessOrder.tableName,
                code: paymentSuccessOrder.tableName,
                zone: 'Chung',
                capacity: 4,
                status: 'EMPTY',
              }
            }
            activeUser={null}
            settings={settings}
            subtotal={paymentSuccessOrder.subtotal || paymentSuccessOrder.totalAmount}
            discountAmount={paymentSuccessOrder.discountAmount || 0}
            discountPercent={paymentSuccessOrder.discountPercent || 0}
            shippingFee={paymentSuccessOrder.shippingFee || 0}
            taxAmount={paymentSuccessOrder.taxAmount || 0}
            totalPayable={paymentSuccessOrder.finalTotal || paymentSuccessOrder.totalAmount}
            paymentMethod={paymentSuccessOrder.paymentMethod}
            cashGiven={paymentSuccessOrder.cashAmountPaid || paymentSuccessOrder.totalAmount}
            changeReturn={0}
            cashAmountPaid={paymentSuccessOrder.cashAmountPaid || 0}
            transferAmountPaid={paymentSuccessOrder.transferAmountPaid || 0}
            isPreview={false}
          />
        </>
      )}

      {/* Cup Sticker Label Modal */}
      {cupLabelSuccessOrder && (
        <CupLabelModal
          order={cupLabelSuccessOrder}
          onClose={() => setCupLabelSuccessOrder(null)}
        />
      )}

      {/* Split / Merge Table Modal */}
      {splitMergeTable && (
        <SplitMergeTableModal
          table={splitMergeTable}
          onClose={() => setSplitMergeTable(null)}
        />
      )}
    </MainLayout>
  );
};

export default function App() {
  return (
    <POSProvider>
      <POSContent />
    </POSProvider>
  );
}
