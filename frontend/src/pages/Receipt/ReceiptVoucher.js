import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, Table, Button, Badge, Form, Container, Alert, 
  Row, Col, Spinner, InputGroup, Pagination, Dropdown 
} from 'react-bootstrap';
import '../Receipt/ReceiptVoucher.css';
import apiClient from '../../services/api';

const ReceiptVoucher = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    tenant: '',
    payment_date: new Date().toISOString().split('T')[0],
    amount: '',
    payment_method: 'cash',
    bank_name: '',
    cheque_number: '',
    cheque_date: '',
    description: '',
    notes: '',
    status: 'draft',
  });

  const [tenants, setTenants] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [receiptsLoading, setReceiptsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalPages: 1,
    totalCount: 0
  });
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTenants();
    fetchReceipts();
  }, []);

  const fetchTenants = async () => {
    try {
      const response = await apiClient.get('/property/related-parties/');
      setTenants(response.data.results || response.data);
    } catch (err) {
      console.error('Error fetching tenants:', err);
    }
  };

  const fetchReceipts = async (page = 1) => {
    try {
      setReceiptsLoading(true);
      
      const params = {
        page: page,
        page_size: pagination.pageSize,
      };
      
      // Add backend filters
      if (searchTerm) {
        params.search = searchTerm;
      }
      if (filterStatus) {
        params.status = filterStatus;
      }
      if (filterPaymentMethod) {
        params.payment_method = filterPaymentMethod;
      }
      
      const response = await apiClient.get('/sales/receipt-vouchers/', { params });
      
      // Handle Django REST Framework pagination format
      if (response.data.results !== undefined) {
        setReceipts(response.data.results);
        setPagination(prev => ({
          ...prev,
          page: page,
          totalCount: response.data.count,
          totalPages: Math.ceil(response.data.count / prev.pageSize)
        }));
      } else {
        // Non-paginated response
        const data = response.data;
        setReceipts(Array.isArray(data) ? data : []);
        setPagination(prev => ({
          ...prev,
          page: 1,
          totalCount: Array.isArray(data) ? data.length : 0,
          totalPages: 1
        }));
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching receipts:', err);
      setError(`Error loading receipts: ${err.message}`);
    } finally {
      setReceiptsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handlePaymentMethodChange = (e) => {
    setFormData({
      ...formData,
      payment_method: e.target.value,
      bank_name: '',
      cheque_number: '',
      cheque_date: '',
    });
  };

  const handleEdit = (receipt) => {
    setEditMode(true);
    setEditId(receipt.id);
    setFormData({
      tenant: receipt.tenant || receipt.tenant_details?.id,
      payment_date: receipt.payment_date,
      amount: receipt.amount,
      payment_method: receipt.payment_method,
      bank_name: receipt.bank_name || '',
      cheque_number: receipt.cheque_number || '',
      cheque_date: receipt.cheque_date || '',
      description: receipt.description || '',
      notes: receipt.notes || '',
      status: receipt.status || 'draft',
    });
    setShowForm(true);
  };

  const validateForm = () => {
    if (!formData.tenant) {
      setError('Please select a tenant');
      return false;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid amount');
      return false;
    }
    if (formData.payment_method !== 'cash') {
      if (!formData.bank_name) {
        setError('Bank name is required for bank and cheque payments');
        return false;
      }
    }
    if (formData.payment_method !== 'cash' && formData.payment_method !== 'bank') {
      if (!formData.cheque_number) {
        setError('Cheque number is required');
        return false;
      }
      if (!formData.cheque_date) {
        setError('Cheque date is required');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Prepare data, excluding empty optional fields
      const submitData = {
        tenant: formData.tenant,
        payment_date: formData.payment_date,
        amount: formData.amount,
        payment_method: formData.payment_method,
        description: formData.description,
        notes: formData.notes,
        status: formData.status,
      };

      // Only include bank/cheque fields if they have values
      if (formData.payment_method !== 'cash') {
        if (formData.bank_name) submitData.bank_name = formData.bank_name;
        if (formData.cheque_number) submitData.cheque_number = formData.cheque_number;
        if (formData.cheque_date) submitData.cheque_date = formData.cheque_date;
      }

      if (editMode && editId) {
        await apiClient.put(`/sales/receipt-vouchers/${editId}/`, submitData);
        setSuccess('Receipt voucher updated successfully');
      } else {
        await apiClient.post('/sales/receipt-vouchers/', submitData);
        setSuccess('Receipt voucher created successfully');
      }
      setFormData({
        tenant: '',
        payment_date: new Date().toISOString().split('T')[0],
        amount: '',
        payment_method: 'cash',
        bank_name: '',
        cheque_number: '',
        cheque_date: '',
        description: '',
        notes: '',
        status: 'draft',
      });
      setEditMode(false);
      setEditId(null);
      setShowForm(false);
      fetchReceipts(pagination.page);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const markAsCleared = async (id) => {
    try {
      await apiClient.post(`/sales/receipt-vouchers/${id}/mark_cleared/`);
      setSuccess('Receipt marked as cleared');
      fetchReceipts(pagination.page);
    } catch (err) {
      setError(err.message);
    }
  };

  const markAsBounced = async (id) => {
    try {
      await apiClient.post(`/sales/receipt-vouchers/${id}/mark_bounced/`);
      setSuccess('Receipt marked as bounced');
      fetchReceipts(pagination.page);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchReceipts(1);
  };

  const handleStatusFilterChange = (value) => {
    setFilterStatus(value);
  };

  const handlePaymentMethodFilterChange = (value) => {
    setFilterPaymentMethod(value);
  };

  const handlePageChange = (pageNumber) => {
    setPagination(prev => ({ ...prev, page: pageNumber }));
    fetchReceipts(pageNumber);
  };

  const handlePageSizeChange = (size) => {
    setPagination(prev => ({ 
      ...prev, 
      pageSize: size,
      page: 1
    }));
    fetchReceipts(1);
  };

  const handleClearFilters = () => {
    setFilterStatus('');
    setFilterPaymentMethod('');
    setSearchTerm('');
    fetchReceipts(1);
  };

  // Trigger fetch when filters change
  useEffect(() => {
    fetchReceipts(pagination.page);
  }, [filterStatus, filterPaymentMethod, searchTerm]);

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

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      draft: 'secondary',
      submitted: 'warning',
      cleared: 'success',
      bounced: 'danger',
      cancelled: 'dark',
    };
    return statusMap[status] || 'secondary';
  };

  const getPaymentMethodLabel = (method) => {
    const methodMap = {
      cash: 'Cash',
      bank: 'Bank Transfer',
      cheque: 'Cheque',
      post_dated_cheque: 'Post-Dated Cheque',
    };
    return methodMap[method] || method;
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
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <div className="page-header mb-4">
            <h1>Receipt Vouchers</h1>
          </div>
          <p className="text-muted">Manage tenant payments (Cash / Bank / Cheque)</p>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <div className="mb-4">
        <Button 
          variant="primary"
          onClick={() => navigate('/receipt-vouchers/new')}
        >
          <i className="fas fa-plus me-2"></i>
          New Receipt Voucher
        </Button>
      </div>

      {/* Filters and Search Bar */}
      <Card className="mb-4">
        <Card.Body>
          <Row className="g-3">
            <Col md={4}>
              <Form onSubmit={handleSearch}>
                <InputGroup>
                  <Form.Control
                    placeholder="Search by receipt number, tenant name, or cheque number"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Button variant="outline-secondary" type="submit">
                    <i className="fas fa-search"></i>
                  </Button>
                </InputGroup>
              </Form>
            </Col>
            
            <Col md={2}>
              <Form.Select
                value={filterStatus} 
                onChange={(e) => handleStatusFilterChange(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="cleared">Cleared</option>
                <option value="bounced">Bounced</option>
                <option value="cancelled">Cancelled</option>
              </Form.Select>
            </Col>
            
            <Col md={2}>
              <Form.Select
                value={filterPaymentMethod} 
                onChange={(e) => handlePaymentMethodFilterChange(e.target.value)}
              >
                <option value="">All Methods</option>
                <option value="cash">Cash</option>
                <option value="bank">Bank Transfer</option>
                <option value="cheque">Cheque</option>
                <option value="post_dated_cheque">Post-Dated Cheque</option>
              </Form.Select>
            </Col>
            
            <Col md={4} className="d-flex gap-2">
              <Button 
                variant="outline-secondary" 
                onClick={handleClearFilters}
                title="Clear all filters"
                disabled={!searchTerm && !filterStatus && !filterPaymentMethod}
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
          {(searchTerm || filterStatus || filterPaymentMethod) && (
            <div className="mt-3">
              <small className="text-muted me-2">Active filters:</small>
              {filterStatus && (
                <Badge bg="info" className="me-2" style={{ cursor: 'pointer' }}>
                  Status: {filterStatus}
                  <i className="fas fa-times ms-1" onClick={() => handleStatusFilterChange('')}></i>
                </Badge>
              )}
              {filterPaymentMethod && (
                <Badge bg="info" className="me-2" style={{ cursor: 'pointer' }}>
                  Method: {getPaymentMethodLabel(filterPaymentMethod)}
                  <i className="fas fa-times ms-1" onClick={() => handlePaymentMethodFilterChange('')}></i>
                </Badge>
              )}
              {searchTerm && (
                <Badge bg="info" className="me-2" style={{ cursor: 'pointer' }}>
                  Search: "{searchTerm}"
                  <i className="fas fa-times ms-1" onClick={() => {
                    setSearchTerm('');
                    fetchReceipts(1);
                  }}></i>
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
            Showing {receipts.length} of {pagination.totalCount} receipts
          </span>
        </div>
        {receiptsLoading && <Spinner animation="border" size="sm" />}
      </div>

      {showForm && (
        <Card className="mb-4">
          <Card.Header className="bg-success text-white">
            <h4 className="mb-0">{editMode ? 'Edit' : 'Create'} Receipt Voucher</h4>
          </Card.Header>
          <Card.Body>
            <Form onSubmit={handleSubmit}>
              {/* Form remains exactly the same - no changes */}
              <Form.Group className="mb-3">
                <Form.Label>Tenant <span className="text-danger">*</span></Form.Label>
                <Form.Select
                  name="tenant"
                  value={formData.tenant}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Tenant</option>
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.first_name} {tenant.last_name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Payment Date <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="date"
                      name="payment_date"
                      value={formData.payment_date}
                      onChange={handleInputChange}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Amount (SAR) <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Payment Method <span className="text-danger">*</span></Form.Label>
                <Form.Select
                  name="payment_method"
                  value={formData.payment_method}
                  onChange={handlePaymentMethodChange}
                  required
                >
                  <option value="cash">Cash</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                  <option value="post_dated_cheque">Post-Dated Cheque</option>
                </Form.Select>
              </Form.Group>

              {formData.payment_method !== 'cash' && (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label>Bank Name <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      name="bank_name"
                      value={formData.bank_name}
                      onChange={handleInputChange}
                      placeholder="Bank name"
                      required={formData.payment_method !== 'cash'}
                    />
                  </Form.Group>

                  {(formData.payment_method === 'cheque' || 
                    formData.payment_method === 'post_dated_cheque') && (
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Cheque Number <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="text"
                            name="cheque_number"
                            value={formData.cheque_number}
                            onChange={handleInputChange}
                            placeholder="Cheque number"
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Cheque Date <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="date"
                            name="cheque_date"
                            value={formData.cheque_date}
                            onChange={handleInputChange}
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  )}
                </>
              )}

              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Description"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Notes</Form.Label>
                <Form.Control
                  as="textarea"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Additional notes"
                  rows={3}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <option value="draft">Draft</option>
                  <option value="submitted">Submitted</option>
                  <option value="cleared">Cleared</option>
                  <option value="bounced">Bounced</option>
                  <option value="cancelled">Cancelled</option>
                </Form.Select>
              </Form.Group>

              <div className="d-flex gap-2">
                <Button 
                  type="submit" 
                  variant="success"
                  disabled={loading}
                >
                  {loading ? (
                    <><Spinner animation="border" size="sm" className="me-2" />{ editMode ? 'Updating...' : 'Creating...'}</>
                  ) : (
                    <><i className="fas fa-receipt me-2"></i>{editMode ? 'Update' : 'Create'} Receipt Voucher</>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="secondary"
                  onClick={() => {
                    setShowForm(false);
                    setEditMode(false);
                    setEditId(null);
                  }}
                >
                  <i className="fas fa-times me-2"></i>Cancel
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      )}

      <div>
        <Card>
          <Card.Body>
            {receiptsLoading && receipts.length === 0 ? (
              <div className="text-center py-5">
                <Spinner animation="border" />
                <p className="mt-2">Loading receipts...</p>
              </div>
            ) : (
              <>
                <Table responsive hover>
                  <thead className="table-header">
                    <tr>
                      <th>ID</th>
                      <th>Receipt #</th>
                      <th>Tenant</th>
                      <th>Amount</th>
                      <th>Date</th>
                      <th>Method</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipts.length > 0 ? (
                      receipts.map((receipt) => (
                        <tr key={receipt.id}>
                          <td>{receipt.id}</td>
                          <td>
                            <strong>{receipt.receipt_number}</strong>
                          </td>
                          <td>
                            {receipt.tenant_details?.first_name} {receipt.tenant_details?.last_name}
                          </td>
                          <td>{formatCurrency(receipt.amount)}</td>
                          <td>{formatDate(receipt.payment_date)}</td>
                          <td>{getPaymentMethodLabel(receipt.payment_method)}</td>
                          <td>
                            <Badge bg={getStatusBadgeClass(receipt.status)}>
                              {receipt.status.toUpperCase()}
                            </Badge>
                          </td>
                          <td>
                            <small className="text-muted">
                              {formatDate(receipt.created_at)}
                            </small>
                          </td>
                          <td className="actions-cell">
                            <Button 
                              size="sm"
                              variant="info"
                              onClick={() => navigate(`/receipt-vouchers/${receipt.id}`)}
                              className="me-2"
                              title="View receipt details"
                            >
                              <i className="fas fa-eye"></i>
                            </Button>
                            <Button 
                              size="sm"
                              variant="warning"
                              onClick={() => handleEdit(receipt)}
                              className="me-2"
                              title="Edit receipt"
                            >
                              <i className="fas fa-edit"></i>
                            </Button>
                            {receipt.payment_method !== 'cash' && receipt.status === 'submitted' && (
                              <Button 
                                size="sm"
                                variant="success"
                                onClick={() => markAsCleared(receipt.id)}
                                className="me-2"
                                title="Mark as cleared"
                              >
                                <i className="fas fa-check"></i>
                              </Button>
                            )}
                            {(receipt.payment_method === 'cheque' || 
                              receipt.payment_method === 'post_dated_cheque') && 
                              receipt.status === 'submitted' && (
                              <Button 
                                size="sm"
                                variant="danger"
                                onClick={() => markAsBounced(receipt.id)}
                                title="Mark as bounced"
                              >
                                <i className="fas fa-ban"></i>
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="9" className="text-center text-muted py-4">
                          No receipt vouchers found. Try changing your filters or create a new receipt.
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
                      {pagination.totalCount} total receipts
                    </div>
                  </div>
                )}
              </>
            )}
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
};

export default ReceiptVoucher;