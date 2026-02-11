import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, Table, Button, Badge, Form, Container, Alert, 
  Row, Col, Spinner, InputGroup, Pagination, Dropdown 
} from 'react-bootstrap';
import '../Lease/LeaseTermination.css';
import apiClient from '../../services/api';

const LeaseTermination = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    lease: '',
    termination_type: 'normal',
    termination_date: new Date().toISOString().split('T')[0],
    original_security_deposit: '',
    refundable_amount: '',
    unearned_rent: 0,
    early_termination_penalty: 0,
    maintenance_charges: 0,
    post_dated_cheques_adjusted: false,
    post_dated_cheques_notes: '',
    terms_conditions: '',
    exit_notes: '',
    notes: '',
    status: 'draft',
  });

  const [leases, setLeases] = useState([]);
  const [terminations, setTerminations] = useState([]);
  const [selectedLease, setSelectedLease] = useState(null);
  const [loading, setLoading] = useState(false);
  const [terminationsLoading, setTerminationsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
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
    fetchLeases();
    fetchTerminations();
  }, []);

  const fetchLeases = async () => {
    try {
      const response = await apiClient.get('/property/leases/');
      const leasesData = response.data.results || response.data;
      const activeLeases = leasesData.filter(
        (lease) => lease.status === 'active' || lease.status === 'Active'
      );
      setLeases(activeLeases);
      if (activeLeases.length === 0) {
        setError('No active leases found. Please create a lease first.');
      }
    } catch (err) {
      console.error('Error fetching leases:', err);
      setError(`Error loading leases: ${err.message}`);
    }
  };

  const fetchTerminations = async (page = 1) => {
    try {
      setTerminationsLoading(true);
      
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
      if (filterType) {
        params.termination_type = filterType;
      }
      
      const response = await apiClient.get('/property/lease-terminations/', { params });
      
      // Handle Django REST Framework pagination format
      if (response.data.results !== undefined) {
        setTerminations(response.data.results);
        setPagination(prev => ({
          ...prev,
          page: page,
          totalCount: response.data.count,
          totalPages: Math.ceil(response.data.count / prev.pageSize)
        }));
      } else {
        // Non-paginated response
        const data = response.data;
        setTerminations(Array.isArray(data) ? data : []);
        setPagination(prev => ({
          ...prev,
          page: 1,
          totalCount: Array.isArray(data) ? data.length : 0,
          totalPages: 1
        }));
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching terminations:', err);
      setError(`Error loading terminations: ${err.message}`);
    } finally {
      setTerminationsLoading(false);
    }
  };

  const handleLeaseSelect = (leaseId) => {
    const lease = leases.find((l) => l.id === parseInt(leaseId));
    setSelectedLease(lease);
    setFormData({
      ...formData,
      lease: leaseId,
      original_security_deposit: lease?.security_deposit || '',
      refundable_amount: lease?.security_deposit || '',
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  // FIXED: HandleEdit function that works with both data structures
  const handleEdit = async (termination) => {
    setEditMode(true);
    setEditId(termination.id);
    
    try {
      // Get the lease ID - handle both nested and direct references
      const leaseId = termination.lease || (termination.lease && typeof termination.lease === 'object' ? termination.lease.id : null);
      
      if (!leaseId) {
        throw new Error('Lease information not found in termination data');
      }
      
      const leaseResponse = await apiClient.get(`/property/leases/${leaseId}/`);
      setSelectedLease(leaseResponse.data);
      
      setFormData({
        lease: leaseId,
        termination_type: termination.termination_type,
        termination_date: termination.termination_date,
        original_security_deposit: termination.original_security_deposit || '',
        refundable_amount: termination.refundable_amount,
        unearned_rent: termination.unearned_rent || 0,
        early_termination_penalty: termination.early_termination_penalty || 0,
        maintenance_charges: termination.maintenance_charges || 0,
        post_dated_cheques_adjusted: termination.post_dated_cheques_adjusted || false,
        post_dated_cheques_notes: termination.post_dated_cheques_notes || '',
        terms_conditions: termination.terms_conditions || '',
        exit_notes: termination.exit_notes || '',
        notes: termination.notes || '',
        status: termination.status,
      });
      
      setShowForm(true);
    } catch (err) {
      console.error('Error fetching lease details:', err);
      setError('Failed to load termination details: ' + (err.message || 'Unknown error'));
    }
  };

  const validateForm = () => {
    if (!formData.lease) {
      setError('Please select a lease to terminate');
      return false;
    }
    if (!formData.termination_date) {
      setError('Please enter termination date');
      return false;
    }
    if (!formData.refundable_amount && formData.refundable_amount !== 0) {
      setError('Please enter refundable amount');
      return false;
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
      const submitData = {
        lease: formData.lease,
        termination_type: formData.termination_type,
        termination_date: formData.termination_date,
        original_security_deposit: formData.original_security_deposit,
        refundable_amount: formData.refundable_amount,
        unearned_rent: formData.termination_type === 'early' ? formData.unearned_rent : 0,
        early_termination_penalty: formData.termination_type === 'early' ? formData.early_termination_penalty : 0,
        maintenance_charges: formData.maintenance_charges,
        post_dated_cheques_adjusted: formData.post_dated_cheques_adjusted,
        post_dated_cheques_notes: formData.post_dated_cheques_notes,
        terms_conditions: formData.terms_conditions,
        exit_notes: formData.exit_notes,
        notes: formData.notes,
        status: formData.status,
      };

      if (editMode && editId) {
        await apiClient.put(`/property/lease-terminations/${editId}/`, submitData);
        setSuccess('Lease termination updated successfully');
      } else {
        await apiClient.post('/property/lease-terminations/', submitData);
        setSuccess('Lease termination created successfully');
      }

      setFormData({
        lease: '',
        termination_type: 'normal',
        termination_date: new Date().toISOString().split('T')[0],
        original_security_deposit: '',
        refundable_amount: '',
        unearned_rent: 0,
        early_termination_penalty: 0,
        maintenance_charges: 0,
        post_dated_cheques_adjusted: false,
        post_dated_cheques_notes: '',
        terms_conditions: '',
        exit_notes: '',
        notes: '',
        status: 'draft',
      });
      setSelectedLease(null);
      setEditMode(false);
      setEditId(null);
      setShowForm(false);
      fetchTerminations(pagination.page);
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData && typeof errorData === 'object') {
        const errorMessages = Object.entries(errorData)
          .map(([field, messages]) => {
            const msg = Array.isArray(messages) ? messages[0] : messages;
            return `${field.replace('_', ' ')}: ${msg}`;
          })
          .join('; ');
        setError(errorMessages || err.response?.data?.detail || 'Failed to create termination');
      } else {
        setError(err.response?.data?.detail || err.message || 'Failed to create termination');
      }
    } finally {
      setLoading(false);
    }
  };

  const approveTermination = async (id) => {
    try {
      await apiClient.post(`/property/lease-terminations/${id}/approve/`);
      setSuccess('Termination approved');
      fetchTerminations(pagination.page);
    } catch (err) {
      setError(err.message);
    }
  };

  const completeTermination = async (id) => {
    try {
      await apiClient.post(`/property/lease-terminations/${id}/complete/`);
      setSuccess('Termination completed');
      fetchTerminations(pagination.page);
      fetchLeases();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchTerminations(1);
  };

  const handleStatusFilterChange = (value) => {
    setFilterStatus(value);
  };

  const handleTypeFilterChange = (value) => {
    setFilterType(value);
  };

  const handlePageChange = (pageNumber) => {
    setPagination(prev => ({ ...prev, page: pageNumber }));
    fetchTerminations(pageNumber);
  };

  const handlePageSizeChange = (size) => {
    setPagination(prev => ({ 
      ...prev, 
      pageSize: size,
      page: 1
    }));
    fetchTerminations(1);
  };

  const handleClearFilters = () => {
    setFilterStatus('');
    setFilterType('');
    setSearchTerm('');
    fetchTerminations(1);
  };

  // Trigger fetch when filters change
  useEffect(() => {
    fetchTerminations(pagination.page);
  }, [filterStatus, filterType, searchTerm]);

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
      pending_approval: 'warning',
      approved: 'info',
      completed: 'success',
      rejected: 'danger',
      cancelled: 'dark',
    };
    return statusMap[status] || 'secondary';
  };

  const getTypeLabel = (type) => {
    return type === 'normal' ? 'Normal Termination' : 'Early Termination';
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
    <Container fluid className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <div className="page-header mb-4">
            <h1>Lease Terminations</h1>
          </div>
          <p className="text-muted">Handle normal and early termination with accounting entries</p>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <div className="mb-4">
        <Button 
          variant="primary"
          onClick={() => navigate('/lease-termination/new')}
        >
          <i className="fas fa-plus me-2"></i>
          New Lease Termination
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
                    placeholder="Search by termination number or lease number"
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
                <option value="pending_approval">Pending Approval</option>
                <option value="approved">Approved</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </Form.Select>
            </Col>
            
            <Col md={2}>
              <Form.Select
                value={filterType} 
                onChange={(e) => handleTypeFilterChange(e.target.value)}
              >
                <option value="">All Types</option>
                <option value="normal">Normal Termination</option>
                <option value="early">Early Termination</option>
              </Form.Select>
            </Col>
            
            <Col md={4} className="d-flex gap-2">
              <Button 
                variant="outline-secondary" 
                onClick={handleClearFilters}
                title="Clear all filters"
                disabled={!searchTerm && !filterStatus && !filterType}
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
          {(searchTerm || filterStatus || filterType) && (
            <div className="mt-3">
              <small className="text-muted me-2">Active filters:</small>
              {filterStatus && (
                <Badge bg="info" className="me-2" style={{ cursor: 'pointer' }}>
                  Status: {filterStatus}
                  <i className="fas fa-times ms-1" onClick={() => handleStatusFilterChange('')}></i>
                </Badge>
              )}
              {filterType && (
                <Badge bg="info" className="me-2" style={{ cursor: 'pointer' }}>
                  Type: {filterType === 'normal' ? 'Normal' : 'Early'}
                  <i className="fas fa-times ms-1" onClick={() => handleTypeFilterChange('')}></i>
                </Badge>
              )}
              {searchTerm && (
                <Badge bg="info" className="me-2" style={{ cursor: 'pointer' }}>
                  Search: "{searchTerm}"
                  <i className="fas fa-times ms-1" onClick={() => {
                    setSearchTerm('');
                    fetchTerminations(1);
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
            Showing {terminations.length} of {pagination.totalCount} terminations
          </span>
        </div>
        {terminationsLoading && <Spinner animation="border" size="sm" />}
      </div>

      {showForm && (
        <Card className="mb-4">
          <Card.Header className="bg-danger text-white">
            <h4 className="mb-0">{editMode ? 'Edit' : 'Create'} Lease Termination</h4>
          </Card.Header>
          <Card.Body>
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Select Lease to Terminate <span className="text-danger">*</span></Form.Label>
                <Form.Select
                  value={formData.lease}
                  onChange={(e) => handleLeaseSelect(e.target.value)}
                  required
                  disabled={editMode}
                >
                  <option value="">Select a lease</option>
                  {leases && leases.length > 0 ? (
                    leases.map((lease) => (
                      <option key={lease.id} value={lease.id}>
                        {lease.lease_number} - {lease.unit_number || 'Unit'} - SAR {lease.monthly_rent}/month
                      </option>
                    ))
                  ) : (
                    <option disabled>No active leases available</option>
                  )}
                </Form.Select>
              </Form.Group>

              {selectedLease && (
                <Card className="mb-3 bg-light">
                  <Card.Body>
                    <h5>Lease Information</h5>
                    <Row>
                      <Col md={4}>
                        <strong>End Date:</strong> {selectedLease.end_date}
                      </Col>
                      <Col md={4}>
                        <strong>Monthly Rent:</strong> SAR {parseFloat(selectedLease.monthly_rent).toFixed(2)}
                      </Col>
                      <Col md={4}>
                        <strong>Security Deposit:</strong> SAR {parseFloat(selectedLease.security_deposit).toFixed(2)}
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              )}

              <h5 className="mt-3 mb-3">Termination Details</h5>

              <Form.Group className="mb-3">
                <Form.Label>Termination Type <span className="text-danger">*</span></Form.Label>
                <div>
                  <Form.Check
                    type="radio"
                    name="termination_type"
                    value="normal"
                    label="Normal Termination (Refund + Maintenance Charges)"
                    checked={formData.termination_type === 'normal'}
                    onChange={handleInputChange}
                    inline
                  />
                  <Form.Check
                    type="radio"
                    name="termination_type"
                    value="early"
                    label="Early Termination (Penalties + Cheque Adjustment)"
                    checked={formData.termination_type === 'early'}
                    onChange={handleInputChange}
                    inline
                  />
                </div>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Termination Date <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="date"
                  name="termination_date"
                  value={formData.termination_date}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>

              <h5 className="mt-3 mb-3">Financial Details</h5>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Refundable Amount (SAR) <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="number"
                      name="refundable_amount"
                      value={formData.refundable_amount}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      step="0.01"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Maintenance Charges (SAR)</Form.Label>
                    <Form.Control
                      type="number"
                      name="maintenance_charges"
                      value={formData.maintenance_charges}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </Form.Group>
                </Col>
              </Row>

              {formData.termination_type === 'early' && (
                <>
                  <Alert variant="info">
                    <strong>Early Termination Charges:</strong> Unearned rent and penalties will be applied.
                  </Alert>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Unearned Rent (SAR) (auto-calculated)</Form.Label>
                        <Form.Control
                          type="number"
                          name="unearned_rent"
                          value={formData.unearned_rent}
                          onChange={handleInputChange}
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Early Termination Penalty (SAR)</Form.Label>
                        <Form.Control
                          type="number"
                          name="early_termination_penalty"
                          value={formData.early_termination_penalty}
                          onChange={handleInputChange}
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      name="post_dated_cheques_adjusted"
                      label="Post-Dated Cheques Adjusted/Cancelled"
                      checked={formData.post_dated_cheques_adjusted}
                      onChange={handleInputChange}
                    />
                  </Form.Group>

                  {formData.post_dated_cheques_adjusted && (
                    <Form.Group className="mb-3">
                      <Form.Label>Cheque Adjustment Notes</Form.Label>
                      <Form.Control
                        as="textarea"
                        name="post_dated_cheques_notes"
                        value={formData.post_dated_cheques_notes}
                        onChange={handleInputChange}
                        placeholder="Details of cheque adjustments"
                        rows={3}
                      />
                    </Form.Group>
                  )}
                </>
              )}

              <h5 className="mt-3 mb-3">Documentation</h5>

              <Form.Group className="mb-3">
                <Form.Label>Exit Notes & Damage Report</Form.Label>
                <Form.Control
                  as="textarea"
                  name="exit_notes"
                  value={formData.exit_notes}
                  onChange={handleInputChange}
                  placeholder="Tenant exit condition, property damage, repairs needed, etc."
                  rows={4}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Terms & Conditions</Form.Label>
                <Form.Control
                  as="textarea"
                  name="terms_conditions"
                  value={formData.terms_conditions}
                  onChange={handleInputChange}
                  placeholder="Enter termination terms and conditions"
                  rows={3}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Additional Notes</Form.Label>
                <Form.Control
                  as="textarea"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Additional notes"
                  rows={2}
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
                  <option value="pending_approval">Pending Approval</option>
                  <option value="approved">Approved</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
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
                    <><Spinner animation="border" size="sm" className="me-2" />{editMode ? 'Updating...' : 'Creating...'}</>
                  ) : (
                    <><i className="fas fa-check me-2"></i>{editMode ? 'Update' : 'Create'} Termination</>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="secondary"
                  onClick={() => {
                    setShowForm(false);
                    setEditMode(false);
                    setEditId(null);
                    setSelectedLease(null);
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
            {terminationsLoading && terminations.length === 0 ? (
              <div className="text-center py-5">
                <Spinner animation="border" />
                <p className="mt-2">Loading terminations...</p>
              </div>
            ) : (
              <>
                <Table responsive hover>
                  <thead className="table-header">
                    <tr>
                      <th>Termination #</th>
                      <th>Lease #</th>
                      <th>Type</th>
                      <th>Date</th>
                      <th>Refund/Charge</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {terminations.length > 0 ? (
                      terminations.map((term) => (
                        <tr key={term.id}>
                          <td>
                            <strong>{term.termination_number}</strong>
                          </td>
                          <td>{term.lease_details?.lease_number || term.lease?.lease_number || 'N/A'}</td>
                          <td>
                            <Badge bg={term.termination_type === 'early' ? 'warning' : 'info'}>
                              {getTypeLabel(term.termination_type)}
                            </Badge>
                          </td>
                          <td>{formatDate(term.termination_date)}</td>
                          <td>
                            <strong className={parseFloat(term.net_refund || term.refundable_amount) > 0 ? 'text-success' : 'text-danger'}>
                              {parseFloat(term.net_refund || term.refundable_amount) > 0 ? '↓ ' : '↑ '}
                              {formatCurrency(Math.abs(parseFloat(term.net_refund || term.refundable_amount || 0)))}
                            </strong>
                          </td>
                          <td>
                            <Badge bg={getStatusBadgeClass(term.status)}>
                              {term.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </td>
                          <td>
                            <small className="text-muted">
                              {formatDate(term.created_at)}
                            </small>
                          </td>
                          <td className="actions-cell">
                            <Button 
                              size="sm"
                              variant="info"
                              className="me-2"
                              onClick={() => navigate(`/lease-termination/${term.id}`)}
                              title="View termination details"
                            >
                              <i className="fas fa-eye"></i>
                            </Button>
                            <Button 
                              size="sm"
                              variant="warning"
                              onClick={() => navigate(`/lease-termination/edit/${term.id}`)}
                              title="Edit termination"
                            >
                              <i className="fas fa-edit"></i>
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="text-center text-muted py-4">
                          No lease terminations found. Try changing your filters or create a new termination.
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
                      {pagination.totalCount} total terminations
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

export default LeaseTermination;