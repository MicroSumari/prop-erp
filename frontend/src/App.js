import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Spinner, Container } from 'react-bootstrap';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navigation from './components/Navigation';
import Sidebar from './components/Sidebar';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard';
import PropertyList from './pages/Property/PropertyList';
import PropertyDetail from './pages/Property/PropertyDetail';
import PropertyForm from './pages/Property/PropertyForm';
import PropertyUnitList from './pages/Property/PropertyUnitList';
import PropertyUnitDetail from './pages/Property/PropertyUnitDetail';
import PropertyUnitForm from './pages/Property/PropertyUnitForm';
import TenantList from './pages/Tenant/TenantList';
import TenantDetail from './pages/Tenant/TenantDetail';
import TenantForm from './pages/Tenant/TenantForm';
import LeaseList from './pages/Lease/LeaseList';
import LeaseDetail from './pages/Lease/LeaseDetail';
import LeaseForm from './pages/Lease/LeaseForm';
import LeaseEdit from './pages/Lease/LeaseEdit';
import LeaseRenewal from './pages/Lease/LeaseRenewal';
import LeaseRenewalDetail from './pages/Lease/LeaseRenewalDetail';
import LeaseRenewalForm from './pages/Lease/LeaseRenewalForm';
import LeaseTermination from './pages/Lease/LeaseTermination';
import LeaseTerminationDetail from './pages/Lease/LeaseTerminationDetail';
import LeaseTerminationForm from './pages/Lease/LeaseTerminationForm';
import MaintenanceList from './pages/Maintenance/MaintenanceList';
import MaintenanceRequest from './pages/Maintenance/MaintenanceRequest';
import MaintenanceRequestForm from './pages/Maintenance/MaintenanceRequestForm';
import MaintenanceRequestDetail from './pages/Maintenance/MaintenanceRequestDetail';
import MaintenanceContract from './pages/Maintenance/MaintenanceContract';
import MaintenanceContractForm from './pages/Maintenance/MaintenanceContractForm';
import MaintenanceContractDetail from './pages/Maintenance/MaintenanceContractDetail';
import ExpenseList from './pages/Expense/ExpenseList';
import RentCollection from './pages/Rent/RentCollection';
import ReceiptVoucher from './pages/Receipt/ReceiptVoucher';
import ReceiptVoucherDetail from './pages/Receipt/ReceiptVoucherDetail';
import ReceiptVoucherForm from './pages/Receipt/ReceiptVoucherForm';
import CustomerInvoices from './pages/Accounting/CustomerInvoices';
import SupplierInvoices from './pages/Accounting/SupplierInvoices';
import PaymentVouchers from './pages/Accounting/PaymentVouchers';
import ChequeRegister from './pages/Accounting/ChequeRegister';
import ManualJournals from './pages/Accounting/ManualJournals';
import TrialBalance from './pages/Accounting/TrialBalance';
import GeneralLedger from './pages/Accounting/GeneralLedger';
import Accounts from './pages/Accounting/Accounts';
import SystemConfig from './pages/Accounting/SystemConfig';
import LegalCaseForm from './pages/LegalCase/LegalCaseForm';
import LegalCaseList from './pages/LegalCase/LegalCaseList';
import LegalCaseDetail from './pages/LegalCase/LegalCaseDetail';
import './App.css';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const [sidebarShow, setSidebarShow] = useState(false);

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center min-vh-100">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="app-container">
      <Navigation onSidebarToggle={() => setSidebarShow(!sidebarShow)} />
      <div className="app-body">
        <Sidebar show={sidebarShow} handleClose={() => setSidebarShow(false)} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/properties" element={<PropertyList />} />
            <Route path="/properties/new" element={<PropertyForm />} />
            <Route path="/properties/:id" element={<PropertyDetail />} />
            <Route path="/properties/edit/:id" element={<PropertyForm />} />
            <Route path="/property-units" element={<PropertyUnitList />} />
            <Route path="/property-units/new" element={<PropertyUnitForm />} />
            <Route path="/property-units/:id" element={<PropertyUnitDetail />} />
            <Route path="/property-units/edit/:id" element={<PropertyUnitForm />} />
            <Route path="/related-parties" element={<TenantList />} />
            <Route path="/related-parties/new" element={<TenantForm />} />
            <Route path="/related-parties/:id" element={<TenantDetail />} />
            <Route path="/related-parties/edit/:id" element={<TenantForm />} />
            <Route path="/leases" element={<LeaseList />} />
            <Route path="/leases/new" element={<LeaseForm />} />
            <Route path="/leases/:id" element={<LeaseDetail />} />
            <Route path="/leases/edit/:id" element={<LeaseEdit />} />
            <Route path="/maintenance" element={<MaintenanceList />} />
            <Route path="/maintenance/requests" element={<MaintenanceRequest />} />
            <Route path="/maintenance/requests/new" element={<MaintenanceRequestForm />} />
            <Route path="/maintenance/requests/:id" element={<MaintenanceRequestDetail />} />
            <Route path="/maintenance/requests/edit/:id" element={<MaintenanceRequestForm />} />
            <Route path="/maintenance/contracts" element={<MaintenanceContract />} />
            <Route path="/maintenance/contracts/new" element={<MaintenanceContractForm />} />
            <Route path="/maintenance/contracts/:id" element={<MaintenanceContractDetail />} />
            <Route path="/maintenance/contracts/edit/:id" element={<MaintenanceContractForm />} />
            <Route path="/expenses" element={<ExpenseList />} />
            <Route path="/rent-collection" element={<RentCollection />} />
            <Route path="/receipt-vouchers" element={<ReceiptVoucher />} />
            <Route path="/receipt-vouchers/new" element={<ReceiptVoucherForm />} />
            <Route path="/receipt-vouchers/:id" element={<ReceiptVoucherDetail />} />
            <Route path="/receipt-vouchers/edit/:id" element={<ReceiptVoucherForm />} />
            <Route path="/accounting/customer-invoices" element={<CustomerInvoices />} />
            <Route path="/accounting/supplier-invoices" element={<SupplierInvoices />} />
            <Route path="/accounting/payment-vouchers" element={<PaymentVouchers />} />
            <Route path="/accounting/cheque-register" element={<ChequeRegister />} />
            <Route path="/accounting/manual-journals" element={<ManualJournals />} />
            <Route path="/accounting/trial-balance" element={<TrialBalance />} />
            <Route path="/accounting/general-ledger" element={<GeneralLedger />} />
            <Route path="/accounting/accounts" element={<Accounts />} />
            <Route path="/system/configuration" element={<SystemConfig />} />
            <Route path="/lease-renewal" element={<LeaseRenewal />} />
            <Route path="/lease-renewal/new" element={<LeaseRenewalForm />} />
            <Route path="/lease-renewal/:id" element={<LeaseRenewalDetail />} />
            <Route path="/lease-renewal/edit/:id" element={<LeaseRenewalForm />} />
            <Route path="/lease-termination" element={<LeaseTermination />} />
            <Route path="/lease-termination/new" element={<LeaseTerminationForm />} />
            <Route path="/lease-termination/:id" element={<LeaseTerminationDetail />} />
            <Route path="/lease-termination/edit/:id" element={<LeaseTerminationForm />} />
            <Route path="/legal-cases" element={<LegalCaseList />} />
            <Route path="/legal-cases/new" element={<LegalCaseForm />} />
            <Route path="/legal-cases/:id" element={<LegalCaseDetail />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;

