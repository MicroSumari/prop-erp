import React, { useEffect, useState } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Alert, 
  Container, 
  Modal, 
  Form, 
  Row, 
  Col,
  InputGroup,
  FormControl,
  Pagination,
  Badge,
  Dropdown
} from 'react-bootstrap';
import apiClient from '../../services/api';

const ChequeRegister = () => {
  const [cheques, setCheques] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showView, setShowView] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [editingId, setEditingId] = useState(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [chequeTypeFilter, setChequeTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [bankFilter, setBankFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [sortField, setSortField] = useState('-created_at');
  const [isLoading, setIsLoading] = useState(false);
  
  const [editData, setEditData] = useState({
    cheque_type: '',
    cheque_number: '',
    cheque_date: '',
    amount: '',
    bank_name: '',
    status: 'received',
  });

  const [accounts, setAccounts] = useState([]);
  const [costCenters, setCostCenters] = useState([]);

  // Build query parameters for API
  const buildQueryParams = () => {
    const params = {
      page: currentPage,
      page_size: itemsPerPage,
      ordering: sortField,
    };
    
    // Use search parameter for text searches
    if (searchQuery) params.search = searchQuery;
    
    // Use direct filter fields (exact matches)
    if (chequeTypeFilter) params.cheque_type = chequeTypeFilter;
    if (statusFilter) params.status = statusFilter;
    if (bankFilter) params.bank_name = bankFilter;
    
    // Date filters use __ lookups
    if (dateFromFilter) params.cheque_date__gte = dateFromFilter;
    if (dateToFilter) params.cheque_date__lte = dateToFilter;
    
    return params;
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const queryParams = buildQueryParams();
      const paramsString = new URLSearchParams(queryParams).toString();
      
      const [chequeRes, accRes, ccRes] = await Promise.all([
        apiClient.get(`/accounts/cheque-registers/?${paramsString}`),
        apiClient.get('/accounts/accounts/'),
        apiClient.get('/accounts/cost-centers/'),
      ]);
      
      // Handle paginated response
      if (chequeRes.data.results) {
        setCheques(chequeRes.data.results);
        setTotalItems(chequeRes.data.count || chequeRes.data.results.length);
        setTotalPages(Math.ceil((chequeRes.data.count || 0) / itemsPerPage));
      } else {
        setCheques(normalizeList(chequeRes.data));
        setTotalItems(normalizeList(chequeRes.data).length);
        setTotalPages(1);
      }
      
      setAccounts(normalizeList(accRes.data));
      setCostCenters(normalizeList(ccRes.data));
      setError('');
    } catch (err) {
      setError('Failed to load cheques');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const normalizeList = (data) => (Array.isArray(data) ? data : (data?.results || []));

  // Fetch data when filters or pagination change
  useEffect(() => {
    fetchData();
  }, [currentPage, sortField, chequeTypeFilter, statusFilter, bankFilter, dateFromFilter, dateToFilter]);

  // Debounced search
  useEffect(() => {
    if (searchQuery !== undefined) {
      setCurrentPage(1);
      const delayDebounceFn = setTimeout(() => {
        fetchData();
      }, 500);

      return () => clearTimeout(delayDebounceFn);
    }
  }, [searchQuery]);

  const handleClear = async (id) => {
    setError('');
    setSuccess('');
    try {
      await apiClient.post(`/accounts/cheque-registers/${id}/mark_cleared/`);
      setSuccess('Cheque cleared successfully');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to clear cheque');
    }
  };

  const handleDeposit = async (id) => {
    setError('');
    setSuccess('');
    try {
      await apiClient.post(`/accounts/cheque-registers/${id}/mark_deposited/`);
      setSuccess('Cheque marked as deposited');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to mark cheque as deposited');
    }
  };

  const handleBounce = async (id) => {
    setError('');
    setSuccess('');
    try {
      await apiClient.post(`/accounts/cheque-registers/${id}/mark_bounced/`);
      setSuccess('Cheque marked as bounced');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to mark cheque as bounced');
    }
  };

  const handleCancel = async (id) => {
    setError('');
    setSuccess('');
    try {
      await apiClient.post(`/accounts/cheque-registers/${id}/cancel/`);
      setSuccess('Cheque cancelled');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to cancel cheque');
    }
  };

  const openView = (item) => {
    setViewItem(item);
    setShowView(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setEditData({
      cheque_type: item.cheque_type || '',
      cheque_number: item.cheque_number || '',
      cheque_date: item.cheque_date || '',
      amount: item.amount || '',
      bank_name: item.bank_name || '',
      status: item.status || 'received',
    });
    setShowEdit(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await apiClient.patch(`/accounts/cheque-registers/${editingId}/`, {
        ...editData,
        amount: parseFloat(editData.amount || 0),
      });
      setSuccess('Cheque updated successfully');
      setShowEdit(false);
      setEditingId(null);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update cheque');
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleFilterChange = (filterType, value) => {
    switch (filterType) {
      case 'cheque_type':
        setChequeTypeFilter(value);
        break;
      case 'status':
        setStatusFilter(value);
        break;
      case 'bank':
        setBankFilter(value);
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
    setChequeTypeFilter('');
    setStatusFilter('');
    setBankFilter('');
    setDateFromFilter('');
    setDateToFilter('');
    setCurrentPage(1);
  };

  const handleSort = (field) => {
    const newSortField = sortField === field ? `-${field}` : field;
    setSortField(newSortField);
  };

  const getChequeTypeBadge = (type) => {
    const variants = {
      incoming: 'primary',
      outgoing: 'warning',
    };
    return <Badge bg={variants[type] || 'secondary'}>{type}</Badge>;
  };

  const getStatusBadge = (status) => {
    const variants = {
      received: 'info',
      deposited: 'primary',
      cleared: 'success',
      bounced: 'danger',
      cancelled: 'secondary',
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
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

  const getVoucherNumber = (voucher) => {
    if (!voucher) return '-';
    if (typeof voucher === 'object') {
      return voucher.voucher_number || 'N/A';
    }
    return voucher;
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
        <Pagination.Item key={1} onClick={() => setCurrentPage(1)}>
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
        >
          {totalPages}
        </Pagination.Item>
      );
    }
    
    return items;
  };

  const formatAmount = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  // Get unique banks for filter dropdown
  const getUniqueBanks = () => {
    const banks = cheques
      .map(c => c.bank_name)
      .filter(bank => bank && bank.trim() !== '')
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort();
    
    return banks;
  };

  return (
    <Container fluid>
      <div className="page-header mb-4">
        <h1>
          <i className="fas fa-money-check me-2"></i>
          Cheque Register
        </h1>
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
          <Row className="mb-3">
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text>
                  <i className="fas fa-search"></i>
                </InputGroup.Text>
                <FormControl
                  placeholder="Search cheque #, bank, or voucher #..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select 
                value={chequeTypeFilter} 
                onChange={(e) => handleFilterChange('cheque_type', e.target.value)}
              >
                <option value="">All Cheque Types</option>
                <option value="incoming">Incoming</option>
                <option value="outgoing">Outgoing</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Button variant="outline-secondary" onClick={clearFilters}>
                <i className="fas fa-times me-2"></i>
                Clear Filters
              </Button>
            </Col>
          </Row>
          <Row>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Status</Form.Label>
                <Form.Select 
                  value={statusFilter} 
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="received">Received</option>
                  <option value="deposited">Deposited</option>
                  <option value="cleared">Cleared</option>
                  <option value="bounced">Bounced</option>
                  <option value="cancelled">Cancelled</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Bank Name</Form.Label>
                <Form.Select 
                  value={bankFilter} 
                  onChange={(e) => handleFilterChange('bank', e.target.value)}
                >
                  <option value="">All Banks</option>
                  {getUniqueBanks().map((bank, index) => (
                    <option key={index} value={bank}>{bank}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Cheque Date From</Form.Label>
                <Form.Control
                  type="date"
                  value={dateFromFilter}
                  onChange={(e) => handleFilterChange('date_from', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Cheque Date To</Form.Label>
                <Form.Control
                  type="date"
                  value={dateToFilter}
                  onChange={(e) => handleFilterChange('date_to', e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>
          <Row className="mt-3">
            <Col md={12}>
              <div className="d-flex justify-content-between align-items-center">
                <div className="text-muted">
                  Showing {cheques.length} of {totalItems} cheques
                </div>
                <div className="text-muted">
                  {itemsPerPage} cheques per page
                </div>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Main Table Card */}
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <div>
            Cheque Register
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
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleSort('cheque_type')}
                    title="Click to sort"
                  >
                    Type
                    {sortField === 'cheque_type' && <i className="fas fa-sort-up ms-1"></i>}
                    {sortField === '-cheque_type' && <i className="fas fa-sort-down ms-1"></i>}
                  </th>
                  <th 
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleSort('cheque_number')}
                    title="Click to sort"
                  >
                    Cheque #
                    {sortField === 'cheque_number' && <i className="fas fa-sort-up ms-1"></i>}
                    {sortField === '-cheque_number' && <i className="fas fa-sort-down ms-1"></i>}
                  </th>
                  <th 
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleSort('cheque_date')}
                    title="Click to sort"
                  >
                    Date
                    {sortField === 'cheque_date' && <i className="fas fa-sort-up ms-1"></i>}
                    {sortField === '-cheque_date' && <i className="fas fa-sort-down ms-1"></i>}
                  </th>
                  <th 
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleSort('amount')}
                    title="Click to sort"
                  >
                    Amount
                    {sortField === 'amount' && <i className="fas fa-sort-up ms-1"></i>}
                    {sortField === '-amount' && <i className="fas fa-sort-down ms-1"></i>}
                  </th>
                  <th>Bank</th>
                  <th>Status</th>
                  <th>Related Voucher</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cheques.length > 0 ? (
                  cheques.map((cheque) => (
                    <tr key={cheque.id}>
                      <td>{getChequeTypeBadge(cheque.cheque_type)}</td>
                      <td>
                        <strong>{cheque.cheque_number}</strong>
                      </td>
                      <td>{formatDate(cheque.cheque_date)}</td>
                      <td>
                        <strong className={cheque.cheque_type === 'outgoing' ? 'text-danger' : 'text-success'}>
                          {formatAmount(cheque.amount)}
                        </strong>
                      </td>
                      <td>{cheque.bank_name || '-'}</td>
                      <td>{getStatusBadge(cheque.status)}</td>
                      <td>
                        {cheque.payment_voucher ? (
                          <Badge bg="primary">
                            PV: {getVoucherNumber(cheque.payment_voucher)}
                          </Badge>
                        ) : cheque.receipt_voucher ? (
                          <Badge bg="success">
                            RV: {getVoucherNumber(cheque.receipt_voucher)}
                          </Badge>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>
                        <div className="d-flex gap-2 flex-wrap">
                          <Button
                            variant="info"
                            size="sm"
                            onClick={() => openView(cheque)}
                            title="View details"
                          >
                            <i className="fas fa-eye"></i>
                          </Button>
                          <Button
                            variant="warning"
                            size="sm"
                            onClick={() => openEdit(cheque)}
                            title="Edit cheque"
                            disabled={cheque.status === 'cleared' || cheque.status === 'cancelled'}
                          >
                            <i className="fas fa-edit"></i>
                          </Button>
                          
                          {/* Status-specific actions dropdown */}
                          <Dropdown>
                            <Dropdown.Toggle 
                              size="sm" 
                              variant="outline-primary" 
                              id={`dropdown-actions-${cheque.id}`}
                              disabled={cheque.status === 'cancelled'}
                            >
                              <i className="fas fa-cog"></i> Actions
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                              {cheque.status === 'received' && (
                                <>
                                  <Dropdown.Item onClick={() => handleDeposit(cheque.id)}>
                                    <i className="fas fa-piggy-bank me-2"></i> Mark as Deposited
                                  </Dropdown.Item>
                                  <Dropdown.Divider />
                                </>
                              )}
                              {cheque.status === 'deposited' && (
                                <>
                                  <Dropdown.Item onClick={() => handleClear(cheque.id)}>
                                    <i className="fas fa-check-circle me-2"></i> Mark as Cleared
                                  </Dropdown.Item>
                                  <Dropdown.Divider />
                                </>
                              )}
                              {cheque.status === 'cleared' && (
                                <Dropdown.Item onClick={() => handleBounce(cheque.id)}>
                                  <i className="fas fa-exclamation-triangle me-2"></i> Mark as Bounced
                                </Dropdown.Item>
                              )}
                              <Dropdown.Item 
                                onClick={() => handleCancel(cheque.id)}
                                className={cheque.status === 'cancelled' ? 'disabled' : ''}
                              >
                                <i className="fas fa-ban me-2"></i> Cancel Cheque
                              </Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center text-muted py-4">
                      {isLoading ? (
                        <div>
                          <i className="fas fa-spinner fa-spin me-2"></i>
                          Loading cheques...
                        </div>
                      ) : (
                        <div>
                          <i className="fas fa-search me-2"></i>
                          No cheques found. Try adjusting your search or filters.
                        </div>
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
                  disabled={currentPage === 1}
                  title="First Page"
                />
                <Pagination.Prev 
                  onClick={() => setCurrentPage(currentPage - 1)} 
                  disabled={currentPage === 1}
                  title="Previous Page"
                />
                {renderPaginationItems()}
                <Pagination.Next 
                  onClick={() => setCurrentPage(currentPage + 1)} 
                  disabled={currentPage === totalPages}
                  title="Next Page"
                />
                <Pagination.Last 
                  onClick={() => setCurrentPage(totalPages)} 
                  disabled={currentPage === totalPages}
                  title="Last Page"
                />
              </Pagination>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* View Modal */}
      <Modal show={showView} onHide={() => setShowView(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Cheque Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {viewItem && (
            <Row>
              <Col md={6}>
                <Card className="mb-3">
                  <Card.Header>Basic Information</Card.Header>
                  <Card.Body>
                    <table className="table table-borderless">
                      <tbody>
                        <tr>
                          <td><strong>Type:</strong></td>
                          <td>{getChequeTypeBadge(viewItem.cheque_type)}</td>
                        </tr>
                        <tr>
                          <td><strong>Cheque #:</strong></td>
                          <td>{viewItem.cheque_number}</td>
                        </tr>
                        <tr>
                          <td><strong>Cheque Date:</strong></td>
                          <td>{formatDate(viewItem.cheque_date)}</td>
                        </tr>
                        <tr>
                          <td><strong>Amount:</strong></td>
                          <td><strong>{formatAmount(viewItem.amount)}</strong></td>
                        </tr>
                        <tr>
                          <td><strong>Status:</strong></td>
                          <td>{getStatusBadge(viewItem.status)}</td>
                        </tr>
                        <tr>
                          <td><strong>Bank Name:</strong></td>
                          <td>{viewItem.bank_name || 'N/A'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6}>
                <Card className="mb-3">
                  <Card.Header>Accounting Details</Card.Header>
                  <Card.Body>
                    <table className="table table-borderless">
                      <tbody>
                        <tr>
                          <td><strong>Cheques Received Account:</strong></td>
                          <td>{resolveAccountName(viewItem.cheques_received_account)}</td>
                        </tr>
                        <tr>
                          <td><strong>Cheques Issued Account:</strong></td>
                          <td>{resolveAccountName(viewItem.cheques_issued_account)}</td>
                        </tr>
                        <tr>
                          <td><strong>Bank Account:</strong></td>
                          <td>{resolveAccountName(viewItem.bank_account)}</td>
                        </tr>
                        <tr>
                          <td><strong>Cost Center:</strong></td>
                          <td>{resolveCostCenter(viewItem.cost_center)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </Card.Body>
                </Card>
                
                <Card>
                  <Card.Header>Related Information</Card.Header>
                  <Card.Body>
                    <table className="table table-borderless">
                      <tbody>
                        <tr>
                          <td><strong>Receipt Voucher:</strong></td>
                          <td>
                            {viewItem.receipt_voucher ? (
                              <Badge bg="success">RV: {getVoucherNumber(viewItem.receipt_voucher)}</Badge>
                            ) : 'N/A'}
                          </td>
                        </tr>
                        <tr>
                          <td><strong>Payment Voucher:</strong></td>
                          <td>
                            {viewItem.payment_voucher ? (
                              <Badge bg="primary">PV: {getVoucherNumber(viewItem.payment_voucher)}</Badge>
                            ) : 'N/A'}
                          </td>
                        </tr>
                        <tr>
                          <td><strong>Created At:</strong></td>
                          <td>{new Date(viewItem.created_at).toLocaleString()}</td>
                        </tr>
                        <tr>
                          <td><strong>Updated At:</strong></td>
                          <td>{new Date(viewItem.updated_at).toLocaleString()}</td>
                        </tr>
                      </tbody>
                    </table>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowView(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Modal */}
      <Modal show={showEdit} onHide={() => setShowEdit(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Cheque</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleEditSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Cheque Type</Form.Label>
                  <Form.Control 
                    value={editData.cheque_type === 'incoming' ? 'Incoming' : 'Outgoing'}
                    disabled
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Cheque Number</Form.Label>
                  <Form.Control 
                    value={editData.cheque_number} 
                    disabled
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Cheque Date *</Form.Label>
                  <Form.Control 
                    type="date" 
                    value={editData.cheque_date} 
                    onChange={(e) => setEditData({ ...editData, cheque_date: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Amount *</Form.Label>
                  <Form.Control 
                    type="number" 
                    step="0.01"
                    value={editData.amount} 
                    onChange={(e) => setEditData({ ...editData, amount: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Bank Name</Form.Label>
                  <Form.Control 
                    value={editData.bank_name} 
                    onChange={(e) => setEditData({ ...editData, bank_name: e.target.value })}
                    placeholder="Enter bank name"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Status *</Form.Label>
                  <Form.Select 
                    value={editData.status} 
                    onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                    required
                  >
                    <option value="received">Received</option>
                    <option value="deposited">Deposited</option>
                    <option value="cleared">Cleared</option>
                    <option value="bounced">Bounced</option>
                    <option value="cancelled">Cancelled</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <div className="d-flex justify-content-end gap-2 mt-3">
              <Button variant="secondary" onClick={() => setShowEdit(false)}>Cancel</Button>
              <Button type="submit" variant="primary">Save Changes</Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default ChequeRegister;