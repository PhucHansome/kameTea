import React, { useState, useEffect } from 'react';
import { POSProvider, usePOS } from './context/POSContext';
import { MainLayout } from './components/layout/MainLayout';
import { TableGrid } from './components/pos/TableGrid';
import { OrderPOS } from './components/pos/OrderPOS';
import { BillCheckoutModal } from './components/pos/BillCheckoutModal';
import { SplitMergeTableModal } from './components/pos/SplitMergeTableModal';
import { KDSView } from './components/kds/KDSView';
import { HRMView } from './components/hrm/HRMView';
import { MenuManagement } from './components/menu/MenuManagement';
import { ReportsView } from './components/reports/ReportsView';
import { UserManagementView } from './components/admin/UserManagementView';
import { LoginView } from './components/auth/LoginView';
import { CustomerSelfOrderModal } from './components/pos/CustomerSelfOrderModal';
import { SupabaseIntegrationModal } from './components/common/SupabaseIntegrationModal';
import { QRNotificationToast } from './components/pos/QRNotificationToast';
import { GlobalToast } from './components/common/GlobalToast';
import { PaymentSuccessModal } from './components/pos/PaymentSuccessModal';
import { CupLabelModal } from './components/pos/CupLabelModal';
import { ThermalReceipt } from './components/pos/ThermalReceipt';
import { TableItem, Order } from './types/pos';

const POSContent: React.FC = () => {
  const { currentTab, activeTable, setActiveTable, tables, isAuthenticated, isAdmin, settings } = usePOS();

  // Active modals
  const [checkoutTable, setCheckoutTable] = useState<TableItem | null>(null);
  const [splitMergeTable, setSplitMergeTable] = useState<TableItem | null>(null);
  const [showSupabaseModal, setShowSupabaseModal] = useState<boolean>(false);
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
          // Fallback if table ID is custom or not yet initialized
          setCustomerOrderTable({
            id: tableId,
            name: `Bàn ${tableId}`,
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

  // Sync activeTable if it changes in state
  const currentActiveTable = activeTable
    ? tables.find((t) => t.id === activeTable.id) || activeTable
    : null;

  // 1. If customer accessed via QR code on their phone browser, display full-screen Customer Self-Order view immediately!
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

  // 2. Mandatory Authentication Guard: If not logged in, display the Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <LoginView />
        <GlobalToast />
      </div>
    );
  }

  return (
    <MainLayout onOpenSupabaseDocs={() => setShowSupabaseModal(false)}>
      {/* 1. POS TAB */}
      {currentTab === 'pos' && (
        <>
          {currentActiveTable ? (
            <OrderPOS
              table={currentActiveTable}
              onBackToTables={() => setActiveTable(null)}
              onOpenCheckout={(tbl) => setCheckoutTable(tbl)}
              onOpenSplitMerge={(tbl) => setSplitMergeTable(tbl)}
            />
          ) : (
            <TableGrid
              onSelectTable={(table) => setActiveTable(table)}
              onOpenCheckout={(table) => setCheckoutTable(table)}
              onOpenSplitMerge={(table) => setSplitMergeTable(table)}
            />
          )}
        </>
      )}

      {/* 2. KITCHEN DISPLAY SYSTEM (KDS) */}
      {currentTab === 'kds' && <KDSView />}

      {/* 4. MENU MANAGEMENT TAB (Admin only) */}
      {currentTab === 'menu' && (isAdmin ? <MenuManagement /> : null)}

      {/* 5. HUMAN RESOURCE MANAGEMENT (HRM) TAB */}
      {currentTab === 'hrm' && <HRMView />}

      {/* 6. REPORTS & P&L TAB */}
      {currentTab === 'reports' && <ReportsView />}

      {/* 7. USER MANAGEMENT & RBAC TAB (Admin only) */}
      {currentTab === 'users' && (isAdmin ? <UserManagementView /> : null)}

      {/* GLOBAL MODALS & TOASTS */}
      <QRNotificationToast />
      <GlobalToast />

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
          {/* Thermal Receipt for printing */}
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


