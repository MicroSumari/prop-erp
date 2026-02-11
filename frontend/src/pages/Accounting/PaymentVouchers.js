import React, { useEffect, useState } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Form, 
  Row, 
  Col, 
  Alert, 
  Container, 
  Modal,
  InputGroup,
  FormControl,
  Pagination,
  Badge,
  Spinner
} from 'react-bootstrap';
import apiClient from '../../services/api';
import './PaymentVouchers.css'; // Create this CSS file

const PaymentVouchers = () => {
  const [vouchers, setVouchers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [supplierInvoices, setSupplierInvoices] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [costCenters, setCostCenters] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showView, setShowView] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  
  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState('success');
  
  // Add this state to track when forms should be disabled
  const [isFormDisabled, setIsFormDisabled] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [sortField, setSortField] = useState('-payment_date');
  const [isLoading, setIsLoading] = useState(false);

  const initialFormData = {
    supplier: '',
    supplier_invoice: '',
    payment_date: new Date().toISOString().split('T')[0],
    amount: '',
    payment_method: 'cash',
    cash_account: '',
    bank_account: '',
    cheques_issued_account: '',
    supplier_account: '',
    cost_center: '',
    status: 'draft',
    description: '',
  };
  const [formData, setFormData] = useState(initialFormData);

  // Toast functions
  const showSuccessToast = (message) => {
    setToastMessage(message);
    setToastVariant('success');
    setShowToast(true);
    setIsFormDisabled(true);
    
    setTimeout(() => {
      setShowToast(false);
      setIsFormDisabled(false);
    }, 3000);
  };

  const showErrorToast = (message) => {
    setToastMessage(message);
    setToastVariant('danger');
    setShowToast(true);
    setIsFormDisabled(true);
    
    setTimeout(() => {
      setShowToast(false);
      setIsFormDisabled(false);
    }, 3000);
  };

  const handleToastClose = () => {
    setShowToast(false);
    setIsFormDisabled(false);
  };

  // Build query parameters for API
  const buildQueryParams = () => {
    const params = {
      page: currentPage,
      page_size: itemsPerPage,
      ordering: sortField,
    };
    
    if (searchQuery) params.search = searchQuery;
    if (statusFilter) params.status = statusFilter;
    if (paymentMethodFilter) params.payment_method = paymentMethodFilter;
    if (dateFromFilter) params.payment_date__gte = dateFromFilter;
    if (dateToFilter) params.payment_date__lte = dateToFilter;
    
    return params;
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const queryParams = buildQueryParams();
      const paramsString = new URLSearchParams(queryParams).toString();
      
      const [voucherRes, supplierRes, invoiceRes, accRes, ccRes] = await Promise.all([
        apiClient.get(`/purchase/payment-vouchers/?${paramsString}`),
        apiClient.get('/property/related-parties/'),
        apiClient.get('/purchase/supplier-invoices/'),
        apiClient.get('/accounts/accounts/'),
        apiClient.get('/accounts/cost-centers/'),
      ]);
      
      // Handle paginated response
      if (voucherRes.data.results) {
        setVouchers(voucherRes.data.results);
        setTotalItems(voucherRes.data.count || voucherRes.data.results.length);
        setTotalPages(Math.ceil((voucherRes.data.count || 0) / itemsPerPage));
      } else {
        setVouchers(normalizeList(voucherRes.data));
        setTotalItems(normalizeList(voucherRes.data).length);
        setTotalPages(1);
      }
      
      setSuppliers(normalizeList(supplierRes.data));
      setSupplierInvoices(normalizeList(invoiceRes.data));
      setAccounts(normalizeList(accRes.data));
      setCostCenters(normalizeList(ccRes.data));
      setError('');
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const normalizeList = (data) => (Array.isArray(data) ? data : (data?.results || []));

  // Fetch data when filters or pagination change
  useEffect(() => {
    fetchData();
  }, [currentPage, sortField, statusFilter, paymentMethodFilter, dateFromFilter, dateToFilter]);

  // Reset to first page when search query changes
  useEffect(() => {
    if (searchQuery !== undefined) {
      setCurrentPage(1);
      const delayDebounceFn = setTimeout(() => {
        fetchData();
      }, 500);

      return () => clearTimeout(delayDebounceFn);
    }
  }, [searchQuery]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsFormDisabled(true);
    
    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount || 0),
      };
      if (editingId) {
        await apiClient.put(`/purchase/payment-vouchers/${editingId}/`, payload);
        showSuccessToast('Payment voucher updated successfully!');
      } else {
        await apiClient.post('/purchase/payment-vouchers/', payload);
        showSuccessToast('Payment voucher created successfully!');
        setSuccess('Payment voucher created');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData(initialFormData);
      fetchData();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to save payment voucher';
      setError(errorMsg);
      showErrorToast(errorMsg);
    } finally {
      setIsFormDisabled(false);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setFormData(initialFormData);
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      supplier: item.supplier?.id || item.supplier || '',
      supplier_invoice: item.supplier_invoice?.id || item.supplier_invoice || '',
      payment_date: item.payment_date || new Date().toISOString().split('T')[0],
      amount: item.amount || '',
      payment_method: item.payment_method || 'cash',
      cash_account: item.cash_account?.id || item.cash_account || '',
      bank_account: item.bank_account?.id || item.bank_account || '',
      cheques_issued_account: item.cheques_issued_account?.id || item.cheques_issued_account || '',
      supplier_account: item.supplier_account?.id || item.supplier_account || '',
      cost_center: item.cost_center?.id || item.cost_center || '',
      status: item.status || 'draft',
      description: item.description || '',
    });
    setShowForm(true);
  };

  const openView = (item) => {
    setViewItem(item);
    setShowView(true);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleFilterChange = (filterType, value) => {
    switch (filterType) {
      case 'status':
        setStatusFilter(value);
        break;
      case 'payment_method':
        setPaymentMethodFilter(value);
        break;
      case 'date_from':
        setDateFromFilter(value);
        break;
      case 'date_to':
        setDateToFilter(value);
        break;
      default:
        break;
    }
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setPaymentMethodFilter('');
    setDateFromFilter('');
    setDateToFilter('');
    setCurrentPage(1);
  };

  const handleSort = (field) => {
    if (isFormDisabled) return;
    const newSortField = sortField === field ? `-${field}` : field;
    setSortField(newSortField);
  };

  const resolveAccountName = (account) => {
    if (!account) return 'N/A';
    if (typeof account === 'object') {
      return `${account.account_number} - ${account.account_name}`;
    }
    const acc = accounts.find((a) => a.id === account);
    return acc ? `${acc.account_number} - ${acc.account_name}` : 'N/A';
  };

  const resolveCostCenter = (center) => {
    if (!center) return 'N/A';
    if (typeof center === 'object') {
      return `${center.code} - ${center.name}`;
    }
    const cc = costCenters.find((c) => c.id === center);
    return cc ? `${cc.code} - ${cc.name}` : 'N/A';
  };

  const resolveSupplierName = (supplier) => {
    if (!supplier) return 'N/A';
    if (typeof supplier === 'object') {
      return `${supplier.first_name} ${supplier.last_name}`;
    }
    const sup = suppliers.find((s) => s.id === supplier);
    return sup ? `${sup.first_name} ${sup.last_name}` : 'N/A';
  };

  const resolveInvoiceNumber = (invoice) => {
    if (!invoice) return 'N/A';
    if (typeof invoice === 'object') {
      return invoice.invoice_number;
    }
    const inv = supplierInvoices.find((i) => i.id === invoice);
    return inv ? inv.invoice_number : 'N/A';
  };

  const getStatusBadge = (status) => {
    const variants = {
      draft: 'secondary',
      submitted: 'warning',
      cleared: 'success',
      cancelled: 'danger',
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const getPaymentMethodBadge = (method) => {
    const variants = {
      cash: 'success',
      bank: 'primary',
      cheque: 'info',
    };
    return <Badge bg={variants[method] || 'secondary'}>{method}</Badge>;
  };

  // Generate pagination items
  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // First page
    if (startPage > 1) {
      items.push(
        <Pagination.Item 
          key={1} 
          onClick={() => setCurrentPage(1)}
          disabled={isFormDisabled}
        >
          1
        </Pagination.Item>
      );
      if (startPage > 2) {
        items.push(<Pagination.Ellipsis key="ellipsis-start" />);
      }
    }
    
    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <Pagination.Item
          key={i}
          active={i === currentPage}
          onClick={() => setCurrentPage(i)}
          disabled={isFormDisabled}
        >
          {i}
        </Pagination.Item>
      );
    }
    
    // Last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(<Pagination.Ellipsis key="ellipsis-end" />);
      }
      items.push(
        <Pagination.Item
          key={totalPages}
          onClick={() => setCurrentPage(totalPages)}
          disabled={isFormDisabled}
        >
          {totalPages}
        </Pagination.Item>
      );
    }
    
    return items;
  };

  return (
    <Container fluid>
      {/* Advanced Animated Toast */}
      <div className={`custom-toast ${showToast ? 'show' : ''} ${toastVariant}`}>
        <div className="toast-content">
          <div className="toast-icon">
            {toastVariant === 'success' ? (
              <i className="fas fa-check-circle"></i>
            ) : (
              <i className="fas fa-exclamation-circle"></i>
            )}
          </div>
          <div className="toast-message">
            <div className="toast-title">
              {toastVariant === 'success' ? 'Success' : 'Error'}
            </div>
            <div className="toast-text">{toastMessage}</div>
          </div>
          <button className="toast-close" onClick={handleToastClose} disabled={isFormDisabled}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="toast-progress"></div>
      </div>

      <div className="page-header mb-4">
        <h1>
          <i className="fas fa-hand-holding-usd me-2"></i>
          Payment Vouchers
        </h1>
        <Button variant="primary" onClick={openCreate} disabled={isFormDisabled}>
          <i className="fas fa-plus me-2"></i>
          Add Payment Voucher
        </Button>
      </div>
      
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

      {/* Search and Filter Card */}
      <Card className="mb-4">
        <Card.Header>
          <i className="fas fa-filter me-2"></i>
          Search & Filters
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <InputGroup className="mb-3">
                <InputGroup.Text>
                  <i className="fas fa-search"></i>
                </InputGroup.Text>
                <FormControl
                  placeholder="Search by voucher number, supplier name..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  disabled={isFormDisabled}
                />
              </InputGroup>
            </Col>
            <Col md={2}>
              <Form.Select 
                value={statusFilter} 
                onChange={(e) => handleFilterChange('status', e.target.value)}
                disabled={isFormDisabled}
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="cleared">Cleared</option>
                <option value="cancelled">Cancelled</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select 
                value={paymentMethodFilter} 
                onChange={(e) => handleFilterChange('payment_method', e.target.value)}
                disabled={isFormDisabled}
              >
                <option value="">All Methods</option>
                <option value="cash">Cash</option>
                <option value="bank">Bank Transfer</option>
                <option value="cheque">Cheque</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Button variant="outline-secondary" onClick={clearFilters} disabled={isFormDisabled}>
                <i className="fas fa-times me-2"></i>
                Clear Filters
              </Button>
            </Col>
          </Row>
          <Row className="mt-2">
            <Col md={3}>
              <Form.Group>
                <Form.Label>Date From</Form.Label>
                <Form.Control
                  type="date"
                  value={dateFromFilter}
                  onChange={(e) => handleFilterChange('date_from', e.target.value)}
                  disabled={isFormDisabled}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Date To</Form.Label>
                <Form.Control
                  type="date"
                  value={dateToFilter}
                  onChange={(e) => handleFilterChange('date_to', e.target.value)}
                  disabled={isFormDisabled}
                />
              </Form.Group>
            </Col>
            <Col md={6} className="d-flex align-items-end">
              <div className="text-muted">
                Showing {vouchers.length} of {totalItems} vouchers
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Main Table Card */}
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <div>
            Payment Vouchers
            {isLoading && <span className="ms-2"><i className="fas fa-spinner fa-spin"></i> Loading...</span>}
          </div>
          <div className="text-muted">
            Page {currentPage} of {totalPages}
          </div>
        </Card.Header>
        <Card.Body>
          <div className="table-responsive">
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th 
                    style={{ cursor: isFormDisabled ? 'not-allowed' : 'pointer' }}
                    onClick={() => !isFormDisabled && handleSort('voucher_number')}
                  >
                    Voucher #
                    {sortField === 'voucher_number' && <i className="fas fa-sort-up ms-1"></i>}
                    {sortField === '-voucher_number' && <i className="fas fa-sort-down ms-1"></i>}
                  </th>
                  <th 
                    style={{ cursor: isFormDisabled ? 'not-allowed' : 'pointer' }}
                    onClick={() => !isFormDisabled && handleSort('supplier__first_name')}
                  >
                    Supplier
                    {sortField === 'supplier__first_name' && <i className="fas fa-sort-up ms-1"></i>}
                    {sortField === '-supplier__first_name' && <i className="fas fa-sort-down ms-1"></i>}
                  </th>
                  <th 
                    style={{ cursor: isFormDisabled ? 'not-allowed' : 'pointer' }}
                    onClick={() => !isFormDisabled && handleSort('payment_date')}
                  >
                    Date
                    {sortField === 'payment_date' && <i className="fas fa-sort-up ms-1"></i>}
                    {sortField === '-payment_date' && <i className="fas fa-sort-down ms-1"></i>}
                  </th>
                  <th 
                    style={{ cursor: isFormDisabled ? 'not-allowed' : 'pointer' }}
                    onClick={() => !isFormDisabled && handleSort('amount')}
                  >
                    Amount
                    {sortField === 'amount' && <i className="fas fa-sort-up ms-1"></i>}
                    {sortField === '-amount' && <i className="fas fa-sort-down ms-1"></i>}
                  </th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vouchers.length > 0 ? (
                  vouchers.map((v) => (
                    <tr key={v.id}>
                      <td>
                        <strong>{v.voucher_number}</strong>
                      </td>
                      <td>{resolveSupplierName(v.supplier)}</td>
                      <td>{v.payment_date}</td>
                      <td>
                        <strong>${parseFloat(v.amount).toFixed(2)}</strong>
                      </td>
                      <td>{getPaymentMethodBadge(v.payment_method)}</td>
                      <td>{getStatusBadge(v.status)}</td>
                      <td>
                        <Button
                          variant="info"
                          size="sm"
                          className="me-2"
                          onClick={() => openView(v)}
                          title="View voucher"
                          disabled={isFormDisabled}
                        >
                          <i className="fas fa-eye"></i>
                        </Button>
                        <Button
                          variant="warning"
                          size="sm"
                          className="me-2"
                          onClick={() => openEdit(v)}
                          title="Edit voucher"
                          disabled={v.status === 'cleared' || v.status === 'cancelled' || isFormDisabled}
                        >
                          <i className="fas fa-edit"></i>
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center text-muted py-4">
                      {isLoading ? (
                        <div>
                          <i className="fas fa-spinner fa-spin me-2"></i>
                          Loading vouchers...
                        </div>
                      ) : (
                        'No payment vouchers found. Try adjusting your filters or create a new voucher.'
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <Pagination>
                <Pagination.First 
                  onClick={() => setCurrentPage(1)} 
                  disabled={currentPage === 1 || isFormDisabled}
                />
                <Pagination.Prev 
                  onClick={() => setCurrentPage(currentPage - 1)} 
                  disabled={currentPage === 1 || isFormDisabled}
                />
                {renderPaginationItems()}
                <Pagination.Next 
                  onClick={() => setCurrentPage(currentPage + 1)} 
                  disabled={currentPage === totalPages || isFormDisabled}
                />
                <Pagination.Last 
                  onClick={() => setCurrentPage(totalPages)} 
                  disabled={currentPage === totalPages || isFormDisabled}
                />
              </Pagination>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Create/Edit Modal */}
     {/* Create/Edit Modal - Improved UI */}
<Modal
  show={showForm}
  onHide={() => {
    setShowForm(false);
    setEditingId(null);
    setFormData(initialFormData);
  }}
  size="lg"
  centered
  backdrop="static"
>
  <Modal.Header closeButton className="bg-primary text-white">
    <Modal.Title>
      <i className={`fas ${editingId ? 'fa-edit' : 'fa-plus-circle'} me-2`}></i>
      {editingId ? 'Edit Payment Voucher' : 'Create Payment Voucher'}
    </Modal.Title>
  </Modal.Header>
  <Modal.Body className="p-4">
    <Form onSubmit={handleSubmit}>
      <Row>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">Supplier <span className="text-danger">*</span></Form.Label>
            <Form.Select 
              name="supplier" 
              value={formData.supplier} 
              onChange={handleChange} 
              required
              disabled={isFormDisabled}
              className="border-2"
            >
              <option value="">-- Select Supplier --</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.first_name} {s.last_name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">Supplier Invoice</Form.Label>
            <Form.Select 
              name="supplier_invoice" 
              value={formData.supplier_invoice} 
              onChange={handleChange}
              disabled={isFormDisabled}
              className="border-2"
            >
              <option value="">-- Select Invoice --</option>
              {supplierInvoices.map((inv) => (
                <option key={inv.id} value={inv.id}>{inv.invoice_number}</option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">Payment Date <span className="text-danger">*</span></Form.Label>
            <Form.Control 
              type="date" 
              name="payment_date" 
              value={formData.payment_date} 
              onChange={handleChange} 
              required 
              disabled={isFormDisabled}
              className="border-2"
            />
          </Form.Group>
        </Col>
      </Row>

      <Row>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">Amount <span className="text-danger">*</span></Form.Label>
            <Form.Control 
              type="number" 
              step="0.01" 
              name="amount" 
              value={formData.amount} 
              onChange={handleChange} 
              required 
              disabled={isFormDisabled}
              className="border-2"
              placeholder="0.00"
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">Payment Method <span className="text-danger">*</span></Form.Label>
            <Form.Select 
              name="payment_method" 
              value={formData.payment_method} 
              onChange={handleChange} 
              required
              disabled={isFormDisabled}
              className="border-2"
            >
              <option value="cash">Cash</option>
              <option value="bank">Bank Transfer</option>
              <option value="cheque">Cheque</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">Status <span className="text-danger">*</span></Form.Label>
            <Form.Select 
              name="status" 
              value={formData.status} 
              onChange={handleChange} 
              required
              disabled={isFormDisabled}
              className="border-2"
            >
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="cleared">Cleared</option>
              <option value="cancelled">Cancelled</option>
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      <Card className="bg-light mb-3">
        <Card.Header className="bg-secondary text-white">
          <i className="fas fa-warehouse me-2"></i>
          Accounting Configuration
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Cash Account</Form.Label>
                <Form.Select 
                  name="cash_account" 
                  value={formData.cash_account} 
                  onChange={handleChange}
                  disabled={isFormDisabled}
                  className="border-2"
                >
                  <option value="">-- Select Account --</option>
                  {accounts.filter((a) => a.account_type === 'asset').map((a) => (
                    <option key={a.id} value={a.id}>{a.account_number} - {a.account_name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Bank Account</Form.Label>
                <Form.Select 
                  name="bank_account" 
                  value={formData.bank_account} 
                  onChange={handleChange}
                  disabled={isFormDisabled}
                  className="border-2"
                >
                  <option value="">-- Select Account --</option>
                  {accounts.filter((a) => a.account_type === 'asset').map((a) => (
                    <option key={a.id} value={a.id}>{a.account_number} - {a.account_name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Cheques Issued Account</Form.Label>
                <Form.Select 
                  name="cheques_issued_account" 
                  value={formData.cheques_issued_account} 
                  onChange={handleChange}
                  disabled={isFormDisabled}
                  className="border-2"
                >
                  <option value="">-- Select Account --</option>
                  {accounts.filter((a) => a.account_type === 'liability').map((a) => (
                    <option key={a.id} value={a.id}>{a.account_number} - {a.account_name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Supplier Account <span className="text-danger">*</span></Form.Label>
                <Form.Select 
                  name="supplier_account" 
                  value={formData.supplier_account} 
                  onChange={handleChange} 
                  required
                  disabled={isFormDisabled}
                  className="border-2"
                >
                  <option value="">-- Select Account --</option>
                  {accounts.filter((a) => a.account_type === 'liability').map((a) => (
                    <option key={a.id} value={a.id}>{a.account_number} - {a.account_name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Cost Center</Form.Label>
                <Form.Select 
                  name="cost_center" 
                  value={formData.cost_center} 
                  onChange={handleChange}
                  disabled={isFormDisabled}
                  className="border-2"
                >
                  <option value="">-- Select Cost Center --</option>
                  {costCenters.map((c) => (
                    <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Description</Form.Label>
                <Form.Control 
                  as="textarea" 
                  rows={3} 
                  name="description" 
                  value={formData.description} 
                  onChange={handleChange}
                  placeholder="Optional description"
                  disabled={isFormDisabled}
                  className="border-2"
                />
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <div className="d-flex justify-content-end gap-2 mt-4">
        <Button
          variant="secondary"
          onClick={() => {
            setShowForm(false);
            setEditingId(null);
            setFormData(initialFormData);
          }}
          disabled={isFormDisabled}
          size="lg"
        >
          <i className="fas fa-times me-2"></i>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={isFormDisabled} size="lg">
          {isFormDisabled ? (
            <>
              <Spinner as="span" animation="border" size="sm" className="me-2" />
              {editingId ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            <>
              <i className={`fas ${editingId ? 'fa-save' : 'fa-plus-circle'} me-2`}></i>
              {editingId ? 'Save Changes' : 'Create Voucher'}
            </>
          )}
        </Button>
      </div>
    </Form>
  </Modal.Body>
</Modal>

      {/* View Modal - Improved UI */}
      <Modal show={showView} onHide={() => setShowView(false)} size="lg" centered>
        <Modal.Header closeButton className="bg-info text-white">
          <Modal.Title>
            <i className="fas fa-file-invoice me-2"></i>
            Payment Voucher Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {viewItem && (
            <Row>
              <Col md={6}>
                <Card className="mb-3 shadow-sm">
                  <Card.Header className="bg-light fw-bold">
                    <i className="fas fa-info-circle me-2"></i>
                    Basic Information
                  </Card.Header>
                  <Card.Body>
                    <div className="d-grid gap-2">
                      <div className="d-flex justify-content-between border-bottom pb-2">
                        <span className="fw-bold">Voucher #:</span>
                        <span className="badge bg-secondary fs-6 p-2">{viewItem.voucher_number}</span>
                      </div>
                      <div className="d-flex justify-content-between border-bottom pb-2">
                        <span className="fw-bold">Supplier:</span>
                        <span>{resolveSupplierName(viewItem.supplier)}</span>
                      </div>
                      <div className="d-flex justify-content-between border-bottom pb-2">
                        <span className="fw-bold">Supplier Invoice:</span>
                        <span className="text-primary">{resolveInvoiceNumber(viewItem.supplier_invoice)}</span>
                      </div>
                      <div className="d-flex justify-content-between border-bottom pb-2">
                        <span className="fw-bold">Payment Date:</span>
                        <span>{viewItem.payment_date}</span>
                      </div>
                      <div className="d-flex justify-content-between border-bottom pb-2">
                        <span className="fw-bold">Amount:</span>
                        <span className="text-success fw-bold">${parseFloat(viewItem.amount).toFixed(2)}</span>
                      </div>
                      <div className="d-flex justify-content-between border-bottom pb-2">
                        <span className="fw-bold">Payment Method:</span>
                        <span>{getPaymentMethodBadge(viewItem.payment_method)}</span>
                      </div>
                      <div className="d-flex justify-content-between pb-2">
                        <span className="fw-bold">Status:</span>
                        <span>{getStatusBadge(viewItem.status)}</span>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6}>
                <Card className="mb-3 shadow-sm">
                  <Card.Header className="bg-light fw-bold">
                    <i className="fas fa-warehouse me-2"></i>
                    Accounting Details
                  </Card.Header>
                  <Card.Body>
                    <div className="d-grid gap-2">
                      <div className="d-flex justify-content-between border-bottom pb-2">
                        <span className="fw-bold">Cash Account:</span>
                        <span className="text-primary">{resolveAccountName(viewItem.cash_account)}</span>
                      </div>
                      <div className="d-flex justify-content-between border-bottom pb-2">
                        <span className="fw-bold">Bank Account:</span>
                        <span className="text-primary">{resolveAccountName(viewItem.bank_account)}</span>
                      </div>
                      <div className="d-flex justify-content-between border-bottom pb-2">
                        <span className="fw-bold">Cheques Issued Account:</span>
                        <span className="text-primary">{resolveAccountName(viewItem.cheques_issued_account)}</span>
                      </div>
                      <div className="d-flex justify-content-between border-bottom pb-2">
                        <span className="fw-bold">Supplier Account:</span>
                        <span className="text-primary">{resolveAccountName(viewItem.supplier_account)}</span>
                      </div>
                      <div className="d-flex justify-content-between pb-2">
                        <span className="fw-bold">Cost Center:</span>
                        <span className="text-primary">{resolveCostCenter(viewItem.cost_center)}</span>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              {viewItem.description && (
                <Col md={12}>
                  <Card className="shadow-sm">
                    <Card.Header className="bg-light fw-bold">
                      <i className="fas fa-align-left me-2"></i>
                      Description
                    </Card.Header>
                    <Card.Body>
                      <div className="bg-light p-3 rounded">
                        <p className="mb-0">{viewItem.description}</p>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              )}
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowView(false)} disabled={isFormDisabled} size="lg">
            <i className="fas fa-times me-2"></i>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default PaymentVouchers;