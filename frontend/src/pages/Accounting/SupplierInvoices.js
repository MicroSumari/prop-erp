import React, { useEffect, useState } from 'react';
import { 
  Card, Table, Button, Form, Row, Col, Alert, Container, Modal,
  InputGroup, Pagination, Dropdown, Badge, Spinner
} from 'react-bootstrap';
import apiClient from '../../services/api';
import './SupplierInvoices.css'; // Create this CSS file

const SupplierInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [costCenters, setCostCenters] = useState([]);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showView, setShowView] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  
  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState('success');
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalPages: 1,
    totalCount: 0
  });
  
  // Filter and search state
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    supplier: '',
  });

  const initialFormData = {
    supplier: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    amount: '',
    is_taxable: false,
    tax_rate: 0,
    expense_account: '',
    tax_account: '',
    supplier_account: '',
    cost_center: '',
    status: 'draft',
    notes: '',
  };
  const [formData, setFormData] = useState(initialFormData);

  // Toast functions
  const showSuccessToast = (message) => {
    setToastMessage(message);
    setToastVariant('success');
    setShowToast(true);
    
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  const showErrorToast = (message) => {
    setToastMessage(message);
    setToastVariant('danger');
    setShowToast(true);
    
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  const handleToastClose = () => {
    setShowToast(false);
  };

  const resolveAccountName = (id) => {
    const account = accounts.find((a) => a.id === id);
    return account ? `${account.account_number} - ${account.account_name}` : 'N/A';
  };

  const resolveCostCenter = (id) => {
    const center = costCenters.find((c) => c.id === id);
    return center ? `${center.code} - ${center.name}` : 'N/A';
  };

  const resolveSupplierName = (id) => {
    const supplier = suppliers.find((s) => s.id === id);
    return supplier ? `${supplier.first_name} ${supplier.last_name}` : 'N/A';
  };

  const fetchSuppliersAndAccounts = async () => {
    try {
      const [supplierRes, accRes, ccRes] = await Promise.all([
        apiClient.get('/property/related-parties/'),
        apiClient.get('/accounts/accounts/'),
        apiClient.get('/accounts/cost-centers/'),
      ]);
      setSuppliers(supplierRes.data.results || supplierRes.data);
      setAccounts(accRes.data.results || accRes.data);
      setCostCenters(ccRes.data.results || ccRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const fetchInvoices = async (page = 1) => {
    try {
      setInvoicesLoading(true);
      
      const params = {
        page: page,
        page_size: pagination.pageSize,
        ...(filters.search && { search: filters.search }),
        ...(filters.status && { status: filters.status }),
        ...(filters.supplier && { supplier: filters.supplier }),
      };
      
      const response = await apiClient.get('/purchase/supplier-invoices/', { params });
      
      if (response.data.results !== undefined) {
        setInvoices(response.data.results);
        setPagination(prev => ({
          ...prev,
          page: page,
          totalCount: response.data.count,
          totalPages: Math.ceil(response.data.count / prev.pageSize)
        }));
      } else {
        const data = response.data;
        setInvoices(Array.isArray(data) ? data : []);
        setPagination(prev => ({
          ...prev,
          page: 1,
          totalCount: Array.isArray(data) ? data.length : 0,
          totalPages: 1
        }));
      }
      
      setError(null);
    } catch (err) {
      setError('Failed to load supplier invoices');
      console.error('Error fetching invoices:', err);
    } finally {
      setInvoicesLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliersAndAccounts();
    fetchInvoices();
  }, []);

  useEffect(() => {
    fetchInvoices(pagination.page);
  }, [filters]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount || 0),
        tax_rate: parseFloat(formData.tax_rate || 0),
      };
      if (editingId) {
        await apiClient.put(`/purchase/supplier-invoices/${editingId}/`, payload);
        showSuccessToast('Supplier invoice updated successfully!');
      } else {
        await apiClient.post('/purchase/supplier-invoices/', payload);
        showSuccessToast('Supplier invoice created successfully!');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData(initialFormData);
      fetchInvoices(pagination.page);
    } catch (err) {
      const errorMsg = 'Failed to save supplier invoice: ' + (err.response?.data?.detail || err.message);
      setError(errorMsg);
      showErrorToast(errorMsg);
    } finally {
      setLoading(false);
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
      supplier: item.supplier || '',
      invoice_date: item.invoice_date || new Date().toISOString().split('T')[0],
      due_date: item.due_date || '',
      amount: item.amount || '',
      is_taxable: !!item.is_taxable,
      tax_rate: item.tax_rate || 0,
      expense_account: item.expense_account || '',
      tax_account: item.tax_account || '',
      supplier_account: item.supplier_account || '',
      cost_center: item.cost_center || '',
      status: item.status || 'draft',
      notes: item.notes || '',
    });
    setShowForm(true);
  };

  const openView = (item) => {
    setViewItem(item);
    setShowView(true);
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value,
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchInvoices(1);
  };

  const handlePageChange = (pageNumber) => {
    setPagination(prev => ({ ...prev, page: pageNumber }));
    fetchInvoices(pageNumber);
  };

  const handlePageSizeChange = (size) => {
    setPagination(prev => ({ 
      ...prev, 
      pageSize: size,
      page: 1
    }));
    fetchInvoices(1);
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      status: '',
      supplier: '',
    });
    fetchInvoices(1);
  };

  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, pagination.page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let number = startPage; number <= endPage; number++) {
      items.push(
        <Pagination.Item
          key={number}
          active={number === pagination.page}
          onClick={() => handlePageChange(number)}
        >
          {number}
        </Pagination.Item>
      );
    }
    
    return items;
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      draft: 'secondary',
      submitted: 'warning',
      paid: 'success',
      void: 'danger',
    };
    return <Badge bg={statusMap[status] || 'secondary'}>{status.toUpperCase()}</Badge>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'SAR 0.00';
    return `SAR ${parseFloat(amount).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
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
          <button className="toast-close" onClick={handleToastClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="toast-progress"></div>
      </div>

      <div className="page-header mb-4">
        <h1>
          <i className="fas fa-file-invoice-dollar me-2"></i>
          Supplier Invoices
        </h1>
        <Button variant="primary" onClick={openCreate}>
          <i className="fas fa-plus me-2"></i>
          Add Supplier Invoice
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Filters and Search Bar */}
      <Card className="mb-4">
        <Card.Body>
          <Row className="g-3">
            <Col md={4}>
              <Form onSubmit={handleSearch}>
                <InputGroup>
                  <Form.Control
                    placeholder="Search by invoice number or supplier name"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                  />
                  <Button variant="outline-secondary" type="submit">
                    <i className="fas fa-search"></i>
                  </Button>
                </InputGroup>
              </Form>
            </Col>
            
            <Col md={2}>
              <Form.Select
                value={filters.status} 
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="paid">Paid</option>
                <option value="void">Void</option>
              </Form.Select>
            </Col>
            
            <Col md={3}>
              <Form.Select
                value={filters.supplier} 
                onChange={(e) => handleFilterChange('supplier', e.target.value)}
              >
                <option value="">All Suppliers</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.first_name} {supplier.last_name}
                  </option>
                ))}
              </Form.Select>
            </Col>
            
            <Col md={3} className="d-flex gap-2">
              <Button 
                variant="outline-secondary" 
                onClick={handleClearFilters}
                title="Clear all filters"
                disabled={!filters.search && !filters.status && !filters.supplier}
              >
                <i className="fas fa-times me-1"></i>
                Clear Filters
              </Button>
              
              <Dropdown>
                <Dropdown.Toggle variant="outline-secondary">
                  {pagination.pageSize} per page
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={() => handlePageSizeChange(10)}>10</Dropdown.Item>
                  <Dropdown.Item onClick={() => handlePageSizeChange(25)}>25</Dropdown.Item>
                  <Dropdown.Item onClick={() => handlePageSizeChange(50)}>50</Dropdown.Item>
                  <Dropdown.Item onClick={() => handlePageSizeChange(100)}>100</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Col>
          </Row>
          
          {/* Active filters display */}
          {(filters.search || filters.status || filters.supplier) && (
            <div className="mt-3">
              <small className="text-muted me-2">Active filters:</small>
              {filters.status && (
                <Badge bg="info" className="me-2" style={{ cursor: 'pointer' }}>
                  Status: {filters.status}
                  <i className="fas fa-times ms-1" onClick={() => handleFilterChange('status', '')}></i>
                </Badge>
              )}
              {filters.supplier && (
                <Badge bg="info" className="me-2" style={{ cursor: 'pointer' }}>
                  Supplier: {suppliers.find(s => s.id === parseInt(filters.supplier))?.first_name || filters.supplier}
                  <i className="fas fa-times ms-1" onClick={() => handleFilterChange('supplier', '')}></i>
                </Badge>
              )}
              {filters.search && (
                <Badge bg="info" className="me-2" style={{ cursor: 'pointer' }}>
                  Search: "{filters.search}"
                  <i className="fas fa-times ms-1" onClick={() => handleFilterChange('search', '')}></i>
                </Badge>
              )}
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Results Info */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <span className="text-muted">
            Showing {invoices.length} of {pagination.totalCount} invoices
          </span>
        </div>
        {invoicesLoading && <Spinner animation="border" size="sm" />}
      </div>

      <Card>
        <Card.Header>Supplier Invoices</Card.Header>
        <Card.Body>
          {invoicesLoading && invoices.length === 0 ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
              <p className="mt-2">Loading supplier invoices...</p>
            </div>
          ) : (
            <>
              <Table striped bordered hover responsive>
                <thead className="table-header">
                  <tr>
                    <th>Invoice #</th>
                    <th>Supplier</th>
                    <th>Invoice Date</th>
                    <th>Due Date</th>
                    <th>Amount</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.length > 0 ? (
                    invoices.map((inv) => (
                      <tr key={inv.id}>
                        <td><strong>{inv.invoice_number}</strong></td>
                        <td>{resolveSupplierName(inv.supplier)}</td>
                        <td>{formatDate(inv.invoice_date)}</td>
                        <td>{formatDate(inv.due_date)}</td>
                        <td>{formatCurrency(inv.amount)}</td>
                        <td><strong>{formatCurrency(inv.total_amount)}</strong></td>
                        <td>{getStatusBadge(inv.status)}</td>
                        <td>
                          <small className="text-muted">
                            {formatDate(inv.created_at)}
                          </small>
                        </td>
                        <td>
                          <Button
                            variant="info"
                            size="sm"
                            className="me-2"
                            onClick={() => openView(inv)}
                            title="View invoice"
                          >
                            <i className="fas fa-eye"></i>
                          </Button>
                          <Button
                            variant="warning"
                            size="sm"
                            onClick={() => openEdit(inv)}
                            title="Edit invoice"
                          >
                            <i className="fas fa-edit"></i>
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="text-center text-muted py-4">
                        No supplier invoices found. Try changing your filters or create a new invoice.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>

              {/* Pagination */}
              {pagination.totalPages > 1 && pagination.totalCount > pagination.pageSize && (
                <div className="d-flex justify-content-between align-items-center mt-4">
                  <div className="text-muted">
                    Page {pagination.page} of {pagination.totalPages}
                  </div>
                  
                  <Pagination>
                    <Pagination.First 
                      onClick={() => handlePageChange(1)} 
                      disabled={pagination.page === 1}
                    />
                    <Pagination.Prev 
                      onClick={() => handlePageChange(pagination.page - 1)} 
                      disabled={pagination.page === 1}
                    />
                    
                    {renderPaginationItems()}
                    
                    <Pagination.Next 
                      onClick={() => handlePageChange(pagination.page + 1)} 
                      disabled={pagination.page === pagination.totalPages}
                    />
                    <Pagination.Last 
                      onClick={() => handlePageChange(pagination.totalPages)} 
                      disabled={pagination.page === pagination.totalPages}
                    />
                  </Pagination>
                  
                  <div className="text-muted">
                    {pagination.totalCount} total invoices
                  </div>
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>

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
            {editingId ? 'Edit Supplier Invoice' : 'Create Supplier Invoice'}
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
                  <Form.Label className="fw-bold">Invoice Date <span className="text-danger">*</span></Form.Label>
                  <Form.Control 
                    type="date" 
                    name="invoice_date" 
                    value={formData.invoice_date} 
                    onChange={handleChange} 
                    required 
                    className="border-2"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Due Date</Form.Label>
                  <Form.Control 
                    type="date" 
                    name="due_date" 
                    value={formData.due_date} 
                    onChange={handleChange} 
                    className="border-2"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Amount (SAR) <span className="text-danger">*</span></Form.Label>
                  <Form.Control 
                    type="number" 
                    name="amount" 
                    value={formData.amount} 
                    onChange={handleChange} 
                    step="0.01"
                    min="0"
                    required 
                    className="border-2"
                    placeholder="0.00"
                  />
                </Form.Group>
              </Col>
              <Col md={4} className="d-flex align-items-center">
                <Form.Group className="mb-3">
                  <Form.Check 
                    type="checkbox" 
                    name="is_taxable" 
                    label={<span className="fw-bold">Taxable</span>} 
                    checked={formData.is_taxable} 
                    onChange={handleChange} 
                    className="mt-4"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                {formData.is_taxable && (
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold">Tax Rate (%)</Form.Label>
                    <Form.Control 
                      type="number" 
                      name="tax_rate" 
                      value={formData.tax_rate} 
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      max="100"
                      className="border-2"
                      placeholder="15"
                    />
                  </Form.Group>
                )}
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
                      <Form.Label className="fw-bold">Expense Account <span className="text-danger">*</span></Form.Label>
                      <Form.Select 
                        name="expense_account" 
                        value={formData.expense_account} 
                        onChange={handleChange} 
                        required
                        className="border-2"
                      >
                        <option value="">-- Select Account --</option>
                        {accounts.filter((a) => a.account_type === 'expense').map((a) => (
                          <option key={a.id} value={a.id}>{a.account_number} - {a.account_name}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">Tax Account</Form.Label>
                      <Form.Select 
                        name="tax_account" 
                        value={formData.tax_account} 
                        onChange={handleChange}
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
                      <Form.Label className="fw-bold">Supplier Account</Form.Label>
                      <Form.Select 
                        name="supplier_account" 
                        value={formData.supplier_account} 
                        onChange={handleChange}
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
                      <Form.Label className="fw-bold">Cost Center</Form.Label>
                      <Form.Select 
                        name="cost_center" 
                        value={formData.cost_center} 
                        onChange={handleChange}
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
                      <Form.Label className="fw-bold">Status</Form.Label>
                      <Form.Select 
                        name="status" 
                        value={formData.status} 
                        onChange={handleChange}
                        className="border-2"
                      >
                        <option value="draft">Draft</option>
                        <option value="submitted">Submitted</option>
                        <option value="paid">Paid</option>
                        <option value="void">Void</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Notes</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={2} 
                name="notes" 
                value={formData.notes} 
                onChange={handleChange}
                placeholder="Additional notes (optional)"
                className="border-2"
              />
            </Form.Group>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setFormData(initialFormData);
                }}
                size="lg"
              >
                <i className="fas fa-times me-2"></i>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={loading} size="lg">
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    {editingId ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <i className={`fas ${editingId ? 'fa-save' : 'fa-plus-circle'} me-2`}></i>
                    {editingId ? 'Save Changes' : 'Create Invoice'}
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
            Supplier Invoice Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {viewItem && (
            <Row>
              <Col md={6}>
                <Card className="mb-3 shadow-sm">
                  <Card.Header className="bg-light fw-bold">
                    <i className="fas fa-info-circle me-2"></i>
                    Invoice Information
                  </Card.Header>
                  <Card.Body>
                    <div className="d-grid gap-2">
                      <div className="d-flex justify-content-between border-bottom pb-2">
                        <span className="fw-bold">Invoice #:</span>
                        <span className="badge bg-secondary fs-6 p-2">{viewItem.invoice_number}</span>
                      </div>
                      <div className="d-flex justify-content-between border-bottom pb-2">
                        <span className="fw-bold">Supplier:</span>
                        <span>{resolveSupplierName(viewItem.supplier)}</span>
                      </div>
                      <div className="d-flex justify-content-between border-bottom pb-2">
                        <span className="fw-bold">Invoice Date:</span>
                        <span>{formatDate(viewItem.invoice_date)}</span>
                      </div>
                      <div className="d-flex justify-content-between border-bottom pb-2">
                        <span className="fw-bold">Due Date:</span>
                        <span>{formatDate(viewItem.due_date)}</span>
                      </div>
                      <div className="d-flex justify-content-between border-bottom pb-2">
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
                    <i className="fas fa-calculator me-2"></i>
                    Amount Details
                  </Card.Header>
                  <Card.Body>
                    <div className="d-grid gap-2">
                      <div className="d-flex justify-content-between border-bottom pb-2">
                        <span className="fw-bold">Amount:</span>
                        <span className="text-primary fw-bold">{formatCurrency(viewItem.amount)}</span>
                      </div>
                      <div className="d-flex justify-content-between border-bottom pb-2">
                        <span className="fw-bold">Taxable:</span>
                        <span>{viewItem.is_taxable ? 
                          <Badge bg="success">Yes</Badge> : 
                          <Badge bg="secondary">No</Badge>
                        }</span>
                      </div>
                      {viewItem.is_taxable && (
                        <>
                          <div className="d-flex justify-content-between border-bottom pb-2">
                            <span className="fw-bold">Tax Rate:</span>
                            <span>{viewItem.tax_rate}%</span>
                          </div>
                          <div className="d-flex justify-content-between border-bottom pb-2">
                            <span className="fw-bold">Tax Amount:</span>
                            <span>{formatCurrency(viewItem.tax_amount)}</span>
                          </div>
                        </>
                      )}
                      <div className="d-flex justify-content-between pt-2">
                        <span className="fw-bold fs-5">Total:</span>
                        <span className="text-success fw-bold fs-5">{formatCurrency(viewItem.total_amount)}</span>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={12}>
                <Card className="shadow-sm">
                  <Card.Header className="bg-light fw-bold">
                    <i className="fas fa-warehouse me-2"></i>
                    Accounting Details
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col md={6}>
                        <div className="d-flex justify-content-between border-bottom pb-2 mb-2">
                          <span className="fw-bold">Expense Account:</span>
                          <span>{resolveAccountName(viewItem.expense_account)}</span>
                        </div>
                        <div className="d-flex justify-content-between border-bottom pb-2 mb-2">
                          <span className="fw-bold">Supplier Account:</span>
                          <span>{resolveAccountName(viewItem.supplier_account)}</span>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="d-flex justify-content-between border-bottom pb-2 mb-2">
                          <span className="fw-bold">Tax Account:</span>
                          <span>{resolveAccountName(viewItem.tax_account)}</span>
                        </div>
                        <div className="d-flex justify-content-between border-bottom pb-2 mb-2">
                          <span className="fw-bold">Cost Center:</span>
                          <span>{resolveCostCenter(viewItem.cost_center)}</span>
                        </div>
                      </Col>
                      {viewItem.notes && (
                        <Col md={12}>
                          <div className="mt-3 p-3 bg-light rounded">
                            <span className="fw-bold">Notes:</span>
                            <p className="mt-2 mb-0">{viewItem.notes}</p>
                          </div>
                        </Col>
                      )}
                    </Row>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowView(false)} size="lg">
            <i className="fas fa-times me-2"></i>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default SupplierInvoices;