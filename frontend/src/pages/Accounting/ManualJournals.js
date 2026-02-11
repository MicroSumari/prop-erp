import React, { useEffect, useState } from 'react';
import { 
  Card, 
  Button, 
  Form, 
  Row, 
  Col, 
  Alert, 
  Container, 
  Table, 
  Modal,
  InputGroup,
  FormControl,
  Pagination,
  Badge,
  Spinner
} from 'react-bootstrap';
import apiClient from '../../services/api';
import './ManualJournals.css'; // Create this CSS file

const ManualJournals = () => {
  const [accounts, setAccounts] = useState([]);
  const [costCenters, setCostCenters] = useState([]);
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showView, setShowView] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editDescription, setEditDescription] = useState('');
  
  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState('success');
  
  // Add this state to track when modals should be disabled
  const [isFormDisabled, setIsFormDisabled] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [sortField, setSortField] = useState('-entry_date');
  const [isLoading, setIsLoading] = useState(false);
  
  const initialFormData = {
    description: '',
    lines: [
      { account: '', debit: '', credit: '', cost_center: '' },
      { account: '', debit: '', credit: '', cost_center: '' },
    ],
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
    if (dateFromFilter) params.entry_date__gte = dateFromFilter;
    if (dateToFilter) params.entry_date__lte = dateToFilter;
    
    return params;
  };

  const normalizeList = (data) => (Array.isArray(data) ? data : (data?.results || []));

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const queryParams = buildQueryParams();
      const paramsString = new URLSearchParams(queryParams).toString();
      
      const [accRes, ccRes, entryRes] = await Promise.all([
        apiClient.get('/accounts/accounts/'),
        apiClient.get('/accounts/cost-centers/'),
        apiClient.get(`/accounts/manual-journals/?${paramsString}`),
      ]);
      
      const accountsList = normalizeList(accRes.data);
      const costCentersList = normalizeList(ccRes.data);
      
      // Handle paginated response for journal entries
      let entriesList = [];
      let totalCount = 0;
      
      if (entryRes.data.results) {
        entriesList = entryRes.data.results;
        totalCount = entryRes.data.count || entryRes.data.results.length;
      } else {
        entriesList = normalizeList(entryRes.data);
        totalCount = entriesList.length;
      }
      
      setAccounts(accountsList);
      setCostCenters(costCentersList);
      setEntries(entriesList);
      setTotalItems(totalCount);
      setTotalPages(Math.ceil(totalCount / itemsPerPage));
      setError('');
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when filters or pagination change
  useEffect(() => {
    fetchData();
  }, [currentPage, sortField, dateFromFilter, dateToFilter]);

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

  const resolveAccountName = (accountId) => {
    if (!accountId) return 'N/A';
    if (typeof accountId === 'object') {
      return `${accountId.account_number} - ${accountId.account_name}`;
    }
    const account = accounts.find((a) => a.id === accountId);
    return account ? `${account.account_number} - ${account.account_name}` : 'N/A';
  };

  const resolveCostCenter = (centerId) => {
    if (!centerId) return 'N/A';
    if (typeof centerId === 'object') {
      return `${centerId.code} - ${centerId.name}`;
    }
    const center = costCenters.find((c) => c.id === centerId);
    return center ? `${center.code} - ${center.name}` : 'N/A';
  };

  const handleLineChange = (index, field, value) => {
    const updated = [...formData.lines];
    updated[index][field] = value;
    
    // Ensure either debit or credit is filled, not both
    if (field === 'debit' && value) {
      updated[index].credit = '';
    } else if (field === 'credit' && value) {
      updated[index].debit = '';
    }
    
    setFormData((prev) => ({ ...prev, lines: updated }));
  };

  const addLine = () => {
    setFormData((prev) => ({
      ...prev,
      lines: [...prev.lines, { account: '', debit: '', credit: '', cost_center: '' }],
    }));
  };

  const removeLine = (index) => {
    if (formData.lines.length > 2) {
      const updated = [...formData.lines];
      updated.splice(index, 1);
      setFormData((prev) => ({ ...prev, lines: updated }));
    }
  };

  const validateJournal = () => {
    let totalDebit = 0;
    let totalCredit = 0;
    
    for (const line of formData.lines) {
      if (!line.account) {
        setError('All lines must have an account selected');
        return false;
      }
      
      const debit = parseFloat(line.debit || 0);
      const credit = parseFloat(line.credit || 0);
      
      if (debit > 0 && credit > 0) {
        setError('Each line must have either debit OR credit, not both');
        return false;
      }
      
      totalDebit += debit;
      totalCredit += credit;
    }
    
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      setError(`Debit total (${totalDebit.toFixed(2)}) must equal credit total (${totalCredit.toFixed(2)})`);
      return false;
    }
    
    if (totalDebit === 0 && totalCredit === 0) {
      setError('At least one line must have an amount');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!validateJournal()) {
      return;
    }
    
    setIsFormDisabled(true);
    
    try {
      const payload = {
        description: formData.description,
        lines: formData.lines.map((l) => ({
          account: l.account,
          debit: parseFloat(l.debit || 0),
          credit: parseFloat(l.credit || 0),
          cost_center: l.cost_center || null,
        })),
      };
      await apiClient.post('/accounts/manual-journals/', payload);
      showSuccessToast('Manual journal entry created successfully!');
      setSuccess('Manual journal entry created successfully');
      setShowForm(false);
      setFormData(initialFormData);
      fetchData();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to create manual journal entry';
      setError(errorMsg);
      showErrorToast(errorMsg);
    } finally {
      setIsFormDisabled(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsFormDisabled(true);
    
    try {
      await apiClient.patch(`/accounts/manual-journals/${editingId}/`, {
        description: editDescription,
      });
      showSuccessToast('Manual journal entry updated successfully!');
      
      setShowEdit(false);
      setEditingId(null);
      setEditDescription('');
      fetchData();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to update manual journal entry';
      setError(errorMsg);
      showErrorToast(errorMsg);
    } finally {
      setIsFormDisabled(false);
    }
  };

  const openCreate = () => {
    setFormData(initialFormData);
    setShowForm(true);
  };

  const openView = (item) => {
    setViewItem(item);
    setShowView(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setEditDescription(item.description || '');
    setShowEdit(true);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleFilterChange = (filterType, value) => {
    switch (filterType) {
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
    setDateFromFilter('');
    setDateToFilter('');
    setCurrentPage(1);
  };

  const handleSort = (field) => {
    const newSortField = sortField === field ? `-${field}` : field;
    setSortField(newSortField);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const calculateTotals = () => {
    let totalDebit = 0;
    let totalCredit = 0;
    
    entries.forEach(entry => {
      if (entry.lines) {
        entry.lines.forEach(line => {
          totalDebit += parseFloat(line.debit || 0);
          totalCredit += parseFloat(line.credit || 0);
        });
      }
    });
    
    return { totalDebit, totalCredit };
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

  const totals = calculateTotals();

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
          <i className="fas fa-book me-2"></i>
          Manual Journal Entries
        </h1>
        <Button variant="primary" onClick={openCreate} disabled={isFormDisabled}>
          <i className="fas fa-plus me-2"></i>
          Add Manual Journal
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
          <Row className="mb-3">
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text>
                  <i className="fas fa-search"></i>
                </InputGroup.Text>
                <FormControl
                  placeholder="Search by description, account number, or account name..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  disabled={isFormDisabled}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Button variant="outline-secondary" onClick={clearFilters} disabled={isFormDisabled}>
                <i className="fas fa-times me-2"></i>
                Clear Filters
              </Button>
            </Col>
            <Col md={3} className="d-flex align-items-center justify-content-end">
              <div className="text-muted">
                {itemsPerPage} per page
              </div>
            </Col>
          </Row>
          <Row>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Entry Date From</Form.Label>
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
                <Form.Label>Entry Date To</Form.Label>
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
                Showing {entries.length} of {totalItems} entries
                {totals.totalDebit > 0 && (
                  <span className="ms-3">
                    <strong>Total Debit:</strong> ${totals.totalDebit.toFixed(2)} | 
                    <strong> Total Credit:</strong> ${totals.totalCredit.toFixed(2)}
                  </span>
                )}
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Main Table Card */}
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <div>
            Manual Journal Entries
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
                    onClick={() => handleSort('id')}
                    title="Click to sort"
                  >
                    ID
                    {sortField === 'id' && <i className="fas fa-sort-up ms-1"></i>}
                    {sortField === '-id' && <i className="fas fa-sort-down ms-1"></i>}
                  </th>
                  <th 
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleSort('entry_date')}
                    title="Click to sort"
                  >
                    Date
                    {sortField === 'entry_date' && <i className="fas fa-sort-up ms-1"></i>}
                    {sortField === '-entry_date' && <i className="fas fa-sort-down ms-1"></i>}
                  </th>
                  <th>Description</th>
                  <th>Debit Total</th>
                  <th>Credit Total</th>
                  <th>Lines</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.length > 0 ? (
                  entries.map((entry) => {
                    const entryTotals = entry.lines?.reduce((acc, line) => ({
                      debit: acc.debit + parseFloat(line.debit || 0),
                      credit: acc.credit + parseFloat(line.credit || 0),
                    }), { debit: 0, credit: 0 }) || { debit: 0, credit: 0 };
                    
                    return (
                      <tr key={entry.id}>
                        <td>
                          <Badge bg="secondary">#{entry.id}</Badge>
                        </td>
                        <td>{formatDate(entry.entry_date)}</td>
                        <td>
                          {entry.description || (
                            <span className="text-muted">No description</span>
                          )}
                        </td>
                        <td className="text-success">
                          <strong>${entryTotals.debit.toFixed(2)}</strong>
                        </td>
                        <td className="text-danger">
                          <strong>${entryTotals.credit.toFixed(2)}</strong>
                        </td>
                        <td>
                          <Badge bg="info">{entry.lines?.length || 0} lines</Badge>
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <Button
                              variant="info"
                              size="sm"
                              onClick={() => openView(entry)}
                              title="View details"
                              disabled={isFormDisabled}
                            >
                              <i className="fas fa-eye"></i>
                            </Button>
                            <Button
                              variant="warning"
                              size="sm"
                              onClick={() => openEdit(entry)}
                              title="Edit description"
                              disabled={isFormDisabled}
                            >
                              <i className="fas fa-edit"></i>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center text-muted py-4">
                      {isLoading ? (
                        <div>
                          <i className="fas fa-spinner fa-spin me-2"></i>
                          Loading journal entries...
                        </div>
                      ) : (
                        <div>
                          <i className="fas fa-book me-2"></i>
                          No manual journal entries found. Try adjusting your filters or create a new entry.
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
                  disabled={currentPage === 1 || isFormDisabled}
                  title="First Page"
                />
                <Pagination.Prev 
                  onClick={() => setCurrentPage(currentPage - 1)} 
                  disabled={currentPage === 1 || isFormDisabled}
                  title="Previous Page"
                />
                {renderPaginationItems()}
                <Pagination.Next 
                  onClick={() => setCurrentPage(currentPage + 1)} 
                  disabled={currentPage === totalPages || isFormDisabled}
                  title="Next Page"
                />
                <Pagination.Last 
                  onClick={() => setCurrentPage(totalPages)} 
                  disabled={currentPage === totalPages || isFormDisabled}
                  title="Last Page"
                />
              </Pagination>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Create Modal */}
      <Modal
        show={showForm}
        onHide={() => {
          setShowForm(false);
          setFormData(initialFormData);
          setError('');
        }}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Create Manual Journal Entry</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Description *</Form.Label>
              <Form.Control 
                value={formData.description} 
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter journal description"
                required
                disabled={isFormDisabled}
              />
            </Form.Group>
            
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6>Journal Lines *</h6>
                <Button variant="outline-primary" size="sm" onClick={addLine} disabled={isFormDisabled}>
                  <i className="fas fa-plus me-1"></i> Add Line
                </Button>
              </div>
              
              <div className="table-responsive">
                <table className="table table-bordered">
                  <thead>
                    <tr>
                      <th>Account</th>
                      <th>Debit</th>
                      <th>Credit</th>
                      <th>Cost Center</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.lines.map((line, idx) => (
                      <tr key={idx}>
                        <td>
                          <Form.Select 
                            value={line.account} 
                            onChange={(e) => handleLineChange(idx, 'account', e.target.value)}
                            required
                            disabled={isFormDisabled}
                          >
                            <option value="">Select account</option>
                            {accounts.map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.account_number} - {a.account_name}
                              </option>
                            ))}
                          </Form.Select>
                        </td>
                        <td>
                          <Form.Control 
                            type="number" 
                            step="0.01"
                            placeholder="0.00" 
                            value={line.debit} 
                            onChange={(e) => handleLineChange(idx, 'debit', e.target.value)}
                            disabled={isFormDisabled}
                          />
                        </td>
                        <td>
                          <Form.Control 
                            type="number" 
                            step="0.01"
                            placeholder="0.00" 
                            value={line.credit} 
                            onChange={(e) => handleLineChange(idx, 'credit', e.target.value)}
                            disabled={isFormDisabled}
                          />
                        </td>
                        <td>
                          <Form.Select 
                            value={line.cost_center} 
                            onChange={(e) => handleLineChange(idx, 'cost_center', e.target.value)}
                            disabled={isFormDisabled}
                          >
                            <option value="">Optional</option>
                            {costCenters.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.code} - {c.name}
                              </option>
                            ))}
                          </Form.Select>
                        </td>
                        <td>
                          {formData.lines.length > 2 && (
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              onClick={() => removeLine(idx)}
                              title="Remove line"
                              disabled={isFormDisabled}
                            >
                              <i className="fas fa-trash"></i>
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="text-muted small">
                <i className="fas fa-info-circle me-1"></i>
                Note: Debit and Credit must balance. Each line should have either debit OR credit, not both.
              </div>
            </div>
            
            <div className="d-flex justify-content-end gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowForm(false);
                  setFormData(initialFormData);
                  setError('');
                }}
                disabled={isFormDisabled}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isFormDisabled}>
                {isFormDisabled ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" className="me-2" />
                    Posting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save me-2"></i>
                    Post Journal
                  </>
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* View Modal */}
      <Modal show={showView} onHide={() => setShowView(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Manual Journal Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {viewItem && (
            <Row>
              <Col md={6}>
                <Card className="mb-3">
                  <Card.Header>Journal Information</Card.Header>
                  <Card.Body>
                    <table className="table table-borderless">
                      <tbody>
                        <tr>
                          <td><strong>Journal ID:</strong></td>
                          <td><Badge bg="secondary">#{viewItem.id}</Badge></td>
                        </tr>
                        <tr>
                          <td><strong>Entry Date:</strong></td>
                          <td>{formatDate(viewItem.entry_date)}</td>
                        </tr>
                        <tr>
                          <td><strong>Entry Type:</strong></td>
                          <td>{viewItem.entry_type || 'Manual'}</td>
                        </tr>
                        <tr>
                          <td><strong>Description:</strong></td>
                          <td>{viewItem.description || 'No description'}</td>
                        </tr>
                        <tr>
                          <td><strong>Created At:</strong></td>
                          <td>{new Date(viewItem.created_at).toLocaleString()}</td>
                        </tr>
                      </tbody>
                    </table>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6}>
                <Card>
                  <Card.Header>Journal Lines</Card.Header>
                  <Card.Body>
                    {viewItem.lines && viewItem.lines.length > 0 ? (
                      <div className="table-responsive">
                        <table className="table table-bordered table-sm">
                          <thead>
                            <tr>
                              <th>Account</th>
                              <th>Debit</th>
                              <th>Credit</th>
                              <th>Cost Center</th>
                            </tr>
                          </thead>
                          <tbody>
                            {viewItem.lines.map((line, idx) => (
                              <tr key={idx}>
                                <td>{resolveAccountName(line.account)}</td>
                                <td className="text-success">
                                  {parseFloat(line.debit || 0).toFixed(2)}
                                </td>
                                <td className="text-danger">
                                  {parseFloat(line.credit || 0).toFixed(2)}
                                </td>
                                <td>{resolveCostCenter(line.cost_center)}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="table-active">
                              <td><strong>Totals:</strong></td>
                              <td className="text-success">
                                <strong>
                                  ${viewItem.lines.reduce((sum, line) => sum + parseFloat(line.debit || 0), 0).toFixed(2)}
                                </strong>
                              </td>
                              <td className="text-danger">
                                <strong>
                                  ${viewItem.lines.reduce((sum, line) => sum + parseFloat(line.credit || 0), 0).toFixed(2)}
                                </strong>
                              </td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center text-muted py-3">
                        No lines found for this journal entry.
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowView(false)} disabled={isFormDisabled}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Modal */}
      <Modal show={showEdit} onHide={() => setShowEdit(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Manual Journal Description</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleEditSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Description *</Form.Label>
              <Form.Control 
                value={editDescription} 
                onChange={(e) => setEditDescription(e.target.value)}
                required
                disabled={isFormDisabled}
              />
            </Form.Group>
            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => setShowEdit(false)} disabled={isFormDisabled}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isFormDisabled}>
                {isFormDisabled ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" className="me-2" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default ManualJournals;