import React, { useEffect, useState } from 'react';
import { 
  Card, Table, Button, Form, Row, Col, Alert, Container, Modal,
  InputGroup, Pagination, Dropdown, Badge, Spinner
} from 'react-bootstrap';
import apiClient from '../../services/api';
import './Accounts.css'; // Create this CSS file

const Accounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showView, setShowView] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [accountsLoading, setAccountsLoading] = useState(false);
  
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
    account_type: '',
    is_active: '',
  });

  const initialFormData = {
    account_number: '',
    account_name: '',
    account_type: 'asset',
    description: '',
    is_active: true,
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

  const fetchAccounts = async (page = 1) => {
    try {
      setAccountsLoading(true);
      
      const params = {
        page: page,
        page_size: pagination.pageSize,
        ...(filters.search && { search: filters.search }),
        ...(filters.account_type && { account_type: filters.account_type }),
        ...(filters.is_active !== '' && { is_active: filters.is_active }),
      };
      
      const response = await apiClient.get('/accounts/accounts/', { params });
      
      // Handle Django REST Framework pagination format
      if (response.data.results !== undefined) {
        setAccounts(response.data.results);
        setPagination(prev => ({
          ...prev,
          page: page,
          totalCount: response.data.count,
          totalPages: Math.ceil(response.data.count / prev.pageSize)
        }));
      } else {
        // Non-paginated response
        const data = response.data;
        setAccounts(Array.isArray(data) ? data : []);
        setPagination(prev => ({
          ...prev,
          page: 1,
          totalCount: Array.isArray(data) ? data.length : 0,
          totalPages: 1
        }));
      }
      
      setError(null);
    } catch (err) {
      setError('Failed to load accounts');
      console.error('Error fetching accounts:', err);
    } finally {
      setAccountsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts(pagination.page);
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
      if (editingId) {
        await apiClient.put(`/accounts/accounts/${editingId}/`, formData);
        showSuccessToast('Account updated successfully!');
      } else {
        await apiClient.post('/accounts/accounts/', formData);
        showSuccessToast('Account created successfully!');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData(initialFormData);
      fetchAccounts(pagination.page);
    } catch (err) {
      const errorMsg = 'Failed to save account: ' + (err.response?.data?.detail || err.message);
      setError(errorMsg);
      showErrorToast(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setError('');
    if (!window.confirm('Are you sure you want to delete this account?')) {
      return;
    }
    try {
      await apiClient.delete(`/accounts/accounts/${id}/`);
      showSuccessToast('Account deleted successfully!');
      fetchAccounts(pagination.page);
    } catch (err) {
      const errorMsg = 'Failed to delete account: ' + (err.response?.data?.detail || err.message);
      setError(errorMsg);
      showErrorToast(errorMsg);
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
      account_number: item.account_number || '',
      account_name: item.account_name || '',
      account_type: item.account_type || 'asset',
      description: item.description || '',
      is_active: item.is_active !== false,
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
    fetchAccounts(1);
  };

  const handlePageChange = (pageNumber) => {
    setPagination(prev => ({ ...prev, page: pageNumber }));
    fetchAccounts(pageNumber);
  };

  const handlePageSizeChange = (size) => {
    setPagination(prev => ({ 
      ...prev, 
      pageSize: size,
      page: 1
    }));
    fetchAccounts(1);
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      account_type: '',
      is_active: '',
    });
    fetchAccounts(1);
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

  const getAccountTypeBadge = (type) => {
    const typeColors = {
      asset: 'primary',
      liability: 'warning',
      equity: 'success',
      income: 'info',
      expense: 'danger',
    };
    return <Badge bg={typeColors[type] || 'secondary'}>{type.toUpperCase()}</Badge>;
  };

  const getAccountTypeLabel = (type) => {
    const typeMap = {
      asset: 'Asset',
      liability: 'Liability',
      equity: 'Equity',
      income: 'Income',
      expense: 'Expense',
    };
    return typeMap[type] || type;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString();
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
          <i className="fas fa-book me-2"></i>
          Chart of Accounts
        </h1>
        <Button variant="primary" onClick={openCreate}>
          <i className="fas fa-plus me-2"></i>
          Add Account
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
                    placeholder="Search by account number or name"
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
                value={filters.account_type} 
                onChange={(e) => handleFilterChange('account_type', e.target.value)}
              >
                <option value="">All Types</option>
                <option value="asset">Asset</option>
                <option value="liability">Liability</option>
                <option value="equity">Equity</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </Form.Select>
            </Col>
            
            <Col md={2}>
              <Form.Select
                value={filters.is_active} 
                onChange={(e) => handleFilterChange('is_active', e.target.value)}
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </Form.Select>
            </Col>
            
            <Col md={4} className="d-flex gap-2">
              <Button 
                variant="outline-secondary" 
                onClick={handleClearFilters}
                title="Clear all filters"
                disabled={!filters.search && !filters.account_type && filters.is_active === ''}
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
          {(filters.search || filters.account_type || filters.is_active !== '') && (
            <div className="mt-3">
              <small className="text-muted me-2">Active filters:</small>
              {filters.account_type && (
                <Badge bg="info" className="me-2" style={{ cursor: 'pointer' }}>
                  Type: {getAccountTypeLabel(filters.account_type)}
                  <i className="fas fa-times ms-1" onClick={() => handleFilterChange('account_type', '')}></i>
                </Badge>
              )}
              {filters.is_active !== '' && (
                <Badge bg="info" className="me-2" style={{ cursor: 'pointer' }}>
                  Status: {filters.is_active === 'true' ? 'Active' : 'Inactive'}
                  <i className="fas fa-times ms-1" onClick={() => handleFilterChange('is_active', '')}></i>
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
            Showing {accounts.length} of {pagination.totalCount} accounts
          </span>
        </div>
        {accountsLoading && <Spinner animation="border" size="sm" />}
      </div>

      <Card>
        <Card.Header>Chart of Accounts</Card.Header>
        <Card.Body>
          {accountsLoading && accounts.length === 0 ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
              <p className="mt-2">Loading accounts...</p>
            </div>
          ) : (
            <>
              <Table striped bordered hover responsive>
                <thead className="table-header">
                  <tr>
                    <th>Account #</th>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.length > 0 ? (
                    accounts.map((acc) => (
                      <tr key={acc.id}>
                        <td><strong>{acc.account_number}</strong></td>
                        <td>{acc.account_name}</td>
                        <td>{getAccountTypeBadge(acc.account_type)}</td>
                        <td>
                          <Badge bg={acc.is_active ? 'success' : 'secondary'}>
                            {acc.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td>
                          <small className="text-muted">
                            {formatDate(acc.created_at)}
                          </small>
                        </td>
                        <td>
                          <Button
                            variant="info"
                            size="sm"
                            className="me-2"
                            onClick={() => openView(acc)}
                            title="View account"
                          >
                            <i className="fas fa-eye"></i>
                          </Button>
                          <Button
                            variant="warning"
                            size="sm"
                            className="me-2"
                            onClick={() => openEdit(acc)}
                            title="Edit account"
                          >
                            <i className="fas fa-edit"></i>
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDelete(acc.id)}
                            title="Delete account"
                          >
                            <i className="fas fa-trash"></i>
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center text-muted py-4">
                        No accounts found. Try changing your filters or create a new account.
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
                    {pagination.totalCount} total accounts
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
            {editingId ? 'Edit Account' : 'Create Account'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Account Number <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    name="account_number"
                    value={formData.account_number}
                    onChange={handleChange}
                    placeholder="e.g., 1001"
                    required
                    className="border-2"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Account Type <span className="text-danger">*</span></Form.Label>
                  <Form.Select 
                    name="account_type" 
                    value={formData.account_type} 
                    onChange={handleChange} 
                    required
                    className="border-2"
                  >
                    <option value="asset">Asset</option>
                    <option value="liability">Liability</option>
                    <option value="equity">Equity</option>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Account Name <span className="text-danger">*</span></Form.Label>
              <Form.Control
                name="account_name"
                value={formData.account_name}
                onChange={handleChange}
                placeholder="e.g., Cash in Bank"
                required
                className="border-2"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Description of the account"
                className="border-2"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                label={<span className="fw-bold">Active Account</span>}
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
                    {editingId ? 'Save Changes' : 'Create Account'}
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
            Account Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {viewItem && (
            <Row>
              <Col md={12}>
                <Card className="shadow-sm">
                  <Card.Body>
                    <Row>
                      <Col md={6}>
                        <div className="d-flex justify-content-between border-bottom pb-2 mb-2">
                          <span className="fw-bold">Account #:</span>
                          <span className="badge bg-primary fs-6 p-2">{viewItem.account_number}</span>
                        </div>
                        <div className="d-flex justify-content-between border-bottom pb-2 mb-2">
                          <span className="fw-bold">Name:</span>
                          <span>{viewItem.account_name}</span>
                        </div>
                        <div className="d-flex justify-content-between border-bottom pb-2 mb-2">
                          <span className="fw-bold">Type:</span>
                          <span>{getAccountTypeBadge(viewItem.account_type)}</span>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="d-flex justify-content-between border-bottom pb-2 mb-2">
                          <span className="fw-bold">Status:</span>
                          <span>
                            <Badge bg={viewItem.is_active ? 'success' : 'secondary'} className="fs-6 p-2">
                              {viewItem.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </span>
                        </div>
                        <div className="d-flex justify-content-between border-bottom pb-2 mb-2">
                          <span className="fw-bold">Created:</span>
                          <span>{formatDate(viewItem.created_at)}</span>
                        </div>
                        <div className="d-flex justify-content-between border-bottom pb-2 mb-2">
                          <span className="fw-bold">Last Updated:</span>
                          <span>{formatDate(viewItem.updated_at)}</span>
                        </div>
                      </Col>
                      {viewItem.description && (
                        <Col md={12}>
                          <div className="mt-3 p-3 bg-light rounded">
                            <span className="fw-bold">Description:</span>
                            <p className="mt-2 mb-0">{viewItem.description}</p>
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

export default Accounts;