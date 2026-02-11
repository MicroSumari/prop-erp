import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, Table, Button, Badge, Form, Container, Alert, 
  Row, Col, Spinner, InputGroup, Pagination, Dropdown 
} from 'react-bootstrap';
import '../Lease/LeaseRenewal.css';
import apiClient from '../../services/api';

const LeaseRenewal = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    original_lease: '',
    new_start_date: '',
    new_end_date: '',
    new_monthly_rent: '',
    new_security_deposit: '',
    terms_conditions: '',
    notes: '',
    status: 'draft',
  });

  const [leases, setLeases] = useState([]);
  const [renewals, setRenewals] = useState([]);
  const [selectedLease, setSelectedLease] = useState(null);
  const [loading, setLoading] = useState(false);
  const [renewalLoading, setRenewalLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
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
    fetchRenewals(pagination.page);
  }, [filterStatus, searchTerm]);

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

  const fetchRenewals = async (page = 1) => {
    try {
      setRenewalLoading(true);
      
      const params = {
        page: page,
        page_size: pagination.pageSize,
      };
      
      // Add search filter if exists
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      const response = await apiClient.get('/property/lease-renewals/', { params });
      const data = response.data.results || response.data;
      
      // Handle paginated response
      if (response.data.results !== undefined) {
        setRenewals(response.data.results);
        setPagination(prev => ({
          ...prev,
          page: page,
          totalCount: response.data.count,
          totalPages: Math.ceil(response.data.count / prev.pageSize)
        }));
      } else if (response.data.data !== undefined) {
        setRenewals(response.data.data);
        setPagination(prev => ({
          ...prev,
          page: page,
          totalCount: response.data.total,
          totalPages: Math.ceil(response.data.total / prev.pageSize)
        }));
      } else {
        setRenewals(data);
        setPagination(prev => ({
          ...prev,
          page: 1,
          totalCount: data.length,
          totalPages: 1
        }));
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching renewals:', err);
      setError(`Error loading renewals: ${err.message}`);
    } finally {
      setRenewalLoading(false);
    }
  };

  // Filter renewals based on status
  const filteredRenewals = filterStatus === 'all' 
    ? renewals 
    : renewals.filter(renewal => renewal.status === filterStatus);

  const handleLeaseSelect = (leaseId) => {
    const lease = leases.find((l) => l.id === parseInt(leaseId));
    setSelectedLease(lease);
    setFormData({
      ...formData,
      original_lease: leaseId,
      original_start_date: lease?.start_date || '',
      original_end_date: lease?.end_date || '',
      original_monthly_rent: lease?.monthly_rent || '',
      new_monthly_rent: lease?.monthly_rent || '',
      new_security_deposit: lease?.security_deposit || '',
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleEdit = async (renewal) => {
    setEditMode(true);
    setEditId(renewal.id);
    
    try {
      const leaseResponse = await apiClient.get(`/property/leases/${renewal.original_lease}/`);
      setSelectedLease(leaseResponse.data);
      
      setFormData({
        original_lease: renewal.original_lease,
        new_start_date: renewal.new_start_date,
        new_end_date: renewal.new_end_date,
        new_monthly_rent: renewal.new_monthly_rent,
        new_security_deposit: renewal.new_security_deposit || '',
        terms_conditions: renewal.terms_conditions || '',
        notes: renewal.notes || '',
        status: renewal.status,
      });
      
      setShowForm(true);
    } catch (err) {
      console.error('Error fetching lease details:', err);
      setError('Failed to load renewal details');
    }
  };

  const validateForm = () => {
    if (!formData.original_lease) {
      setError('Please select a lease to renew');
      return false;
    }
    if (!formData.new_start_date) {
      setError('Please enter new start date');
      return false;
    }
    if (!formData.new_end_date) {
      setError('Please enter new end date');
      return false;
    }
    if (formData.new_start_date >= formData.new_end_date) {
      setError('New end date must be after new start date');
      return false;
    }
    if (!formData.new_monthly_rent || parseFloat(formData.new_monthly_rent) <= 0) {
      setError('Please enter a valid monthly rent');
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
        original_lease: formData.original_lease,
        original_start_date: selectedLease?.start_date,
        original_end_date: selectedLease?.end_date,
        original_monthly_rent: selectedLease?.monthly_rent,
        new_start_date: formData.new_start_date,
        new_end_date: formData.new_end_date,
        new_monthly_rent: formData.new_monthly_rent,
        new_security_deposit: formData.new_security_deposit || null,
        terms_conditions: formData.terms_conditions,
        notes: formData.notes,
        status: formData.status,
      };

      if (editMode && editId) {
        await apiClient.put(`/property/lease-renewals/${editId}/`, submitData);
        setSuccess('Lease renewal updated successfully');
      } else {
        await apiClient.post('/property/lease-renewals/', submitData);
        setSuccess('Lease renewal created successfully');
      }

      setFormData({
        original_lease: '',
        new_start_date: '',
        new_end_date: '',
        new_monthly_rent: '',
        new_security_deposit: '',
        terms_conditions: '',
        notes: '',
        status: 'draft',
      });
      setSelectedLease(null);
      setEditMode(false);
      setEditId(null);
      setShowForm(false);
      fetchRenewals(pagination.page);
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData && typeof errorData === 'object') {
        const errorMessages = Object.entries(errorData)
          .map(([field, messages]) => {
            const msg = Array.isArray(messages) ? messages[0] : messages;
            return `${field.replace('_', ' ')}: ${msg}`;
          })
          .join('; ');
        setError(errorMessages || err.response?.data?.detail || 'Failed to create renewal');
      } else {
        setError(err.response?.data?.detail || err.message || 'Failed to create renewal');
      }
    } finally {
      setLoading(false);
    }
  };

  const approveRenewal = async (id) => {
    try {
      await apiClient.post(`/property/lease-renewals/${id}/approve/`);
      setSuccess('Renewal approved');
      fetchRenewals(pagination.page);
    } catch (err) {
      setError(err.message);
    }
  };

  const activateRenewal = async (id) => {
    try {
      await apiClient.post(`/property/lease-renewals/${id}/activate/`);
      setSuccess('Renewal activated and new lease created');
      fetchRenewals(pagination.page);
      fetchLeases();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchRenewals(1);
  };

  const handlePageChange = (pageNumber) => {
    setPagination(prev => ({ ...prev, page: pageNumber }));
    fetchRenewals(pageNumber);
  };

  const handlePageSizeChange = (size) => {
    setPagination(prev => ({ 
      ...prev, 
      pageSize: size,
      page: 1
    }));
    fetchRenewals(1);
  };

  const handleClearFilters = () => {
    setFilterStatus('all');
    setSearchTerm('');
    fetchRenewals(1);
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

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      draft: 'secondary',
      pending_approval: 'warning',
      approved: 'info',
      active: 'success',
      rejected: 'danger',
      cancelled: 'dark',
    };
    return statusMap[status] || 'secondary';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <Container fluid className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <div className="page-header mb-4">
            <h1>Lease Renewals</h1>
          </div>
          <p className="text-muted">Extend existing leases with new terms and conditions</p>
        </div>
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}
        <div className="mb-4">
          <Button 
            variant="primary"
            onClick={() => navigate('/lease-renewal/new')}
          >
            <i className="fas fa-plus me-2"></i>
            New Lease Renewal
          </Button>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <Card className="mb-4">
        <Card.Body>
          <Row className="g-3">
            <Col md={4}>
              <Form onSubmit={handleSearch}>
                <InputGroup>
                  <Form.Control
                    placeholder="Search by renewal number or lease number"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Button variant="outline-secondary" type="submit">
                    <i className="fas fa-search"></i>
                  </Button>
                </InputGroup>
              </Form>
            </Col>
            
            <Col md={3}>
              <Form.Select
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="pending_approval">Pending Approval</option>
                <option value="approved">Approved</option>
                <option value="active">Active</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </Form.Select>
            </Col>
            
            <Col md={5} className="d-flex gap-2">
              <Button 
                variant="outline-secondary" 
                onClick={handleClearFilters}
                title="Clear all filters"
                disabled={!searchTerm && filterStatus === 'all'}
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
          {(searchTerm || filterStatus !== 'all') && (
            <div className="mt-3">
              <small className="text-muted me-2">Active filters:</small>
              {filterStatus !== 'all' && (
                <Badge bg="info" className="me-2" style={{ cursor: 'pointer' }}>
                  Status: {filterStatus}
                  <i className="fas fa-times ms-1" onClick={() => setFilterStatus('all')}></i>
                </Badge>
              )}
              {searchTerm && (
                <Badge bg="info" className="me-2" style={{ cursor: 'pointer' }}>
                  Search: "{searchTerm}"
                  <i className="fas fa-times ms-1" onClick={() => {
                    setSearchTerm('');
                    fetchRenewals(1);
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
            Showing {filteredRenewals.length} of {pagination.totalCount} renewals
          </span>
        </div>
        {renewalLoading && <Spinner animation="border" size="sm" />}
      </div>

      {showForm && (
        <Card className="mb-4">
          <Card.Header className="bg-info text-white">
            <h4 className="mb-0">{editMode ? 'Edit' : 'Create'} Lease Renewal</h4>
          </Card.Header>
          <Card.Body>
            <Form onSubmit={handleSubmit}>
              {/* Form remains exactly the same */}
              <Form.Group className="mb-3">
                <Form.Label>Select Lease to Renew <span className="text-danger">*</span></Form.Label>
                <Form.Select
                  value={formData.original_lease}
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
                    <h5>Current Lease Terms</h5>
                    <Row>
                      <Col md={6}>
                        <strong>Current Start Date:</strong> {selectedLease.start_date}
                      </Col>
                      <Col md={6}>
                        <strong>Current End Date:</strong> {selectedLease.end_date}
                      </Col>
                      <Col md={6} className="mt-2">
                        <strong>Current Monthly Rent:</strong> SAR {parseFloat(selectedLease.monthly_rent).toFixed(2)}
                      </Col>
                      <Col md={6} className="mt-2">
                        <strong>Current Security Deposit:</strong> SAR {parseFloat(selectedLease.security_deposit).toFixed(2)}
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              )}

              <h5 className="mt-3 mb-3">New Lease Terms</h5>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>New Start Date <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="date"
                      name="new_start_date"
                      value={formData.new_start_date}
                      onChange={handleInputChange}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>New End Date <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="date"
                      name="new_end_date"
                      value={formData.new_end_date}
                      onChange={handleInputChange}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>New Monthly Rent (SAR) <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="number"
                      name="new_monthly_rent"
                      value={formData.new_monthly_rent}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>New Security Deposit (SAR) (leave blank if unchanged)</Form.Label>
                    <Form.Control
                      type="number"
                      name="new_security_deposit"
                      value={formData.new_security_deposit}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Terms & Conditions</Form.Label>
                <Form.Control
                  as="textarea"
                  name="terms_conditions"
                  value={formData.terms_conditions}
                  onChange={handleInputChange}
                  placeholder="Enter lease renewal terms and conditions"
                  rows={4}
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
                  <option value="pending_approval">Pending Approval</option>
                  <option value="approved">Approved</option>
                  <option value="active">Active</option>
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
                    <><i className="fas fa-check me-2"></i>{editMode ? 'Update' : 'Create'} Renewal</>
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
            {renewalLoading && filteredRenewals.length === 0 ? (
              <div className="text-center py-5">
                <Spinner animation="border" />
                <p className="mt-2">Loading renewals...</p>
              </div>
            ) : (
              <>
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Renewal #</th>
                      <th>Lease #</th>
                      <th>New Period</th>
                      <th>Current Rent</th>
                      <th>New Rent</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRenewals.length > 0 ? (
                      filteredRenewals.map((renewal) => (
                        <tr key={renewal.id}>
                          <td>
                            <strong>{renewal.renewal_number}</strong>
                          </td>
                          <td>{renewal.lease_details?.lease_number || renewal.original_lease?.lease_number}</td>
                          <td>
                            {formatDate(renewal.new_start_date)} to{' '}
                            {formatDate(renewal.new_end_date)}
                          </td>
                          <td>SAR {parseFloat(renewal.original_monthly_rent).toFixed(2)}</td>
                          <td>
                            <strong>SAR {parseFloat(renewal.new_monthly_rent).toFixed(2)}</strong>
                          </td>
                          <td>
                            <Badge bg={getStatusBadgeClass(renewal.status)}>
                              {renewal.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </td>
                          <td className="actions-cell">
                            <Button 
                              size="sm"
                              variant="info"
                              className="me-2"
                              onClick={() => navigate(`/lease-renewal/${renewal.id}`)}
                              title="View renewal details"
                            >
                              <i className="fas fa-eye"></i>
                            </Button>
                            <Button 
                              size="sm"
                              variant="warning"
                              onClick={() => navigate(`/lease-renewal/edit/${renewal.id}`)}
                              title="Edit renewal"
                            >
                              <i className="fas fa-edit"></i>
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center text-muted">
                          No lease renewals found
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
                      {pagination.totalCount} total renewals
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

export default LeaseRenewal;