import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Table, Button, Badge, Form, Container, Alert, Row, Col, Spinner } from 'react-bootstrap';
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
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchLeases();
    fetchTerminations();
  }, []);

  const fetchLeases = async () => {
    try {
      const response = await apiClient.get('/property/leases/');
      const leasesData = response.data.results || response.data;
      console.log('Fetched leases:', leasesData);
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

  const fetchTerminations = async () => {
    try {
      const response = await apiClient.get('/property/lease-terminations/');
      setTerminations(response.data.results || response.data);
    } catch (err) {
      console.error('Error fetching terminations:', err);
      setError(`Error loading terminations: ${err.message}`);
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

  const handleEdit = async (termination) => {
    setEditMode(true);
    setEditId(termination.id);
    
    // Fetch the lease details
    try {
      const leaseResponse = await apiClient.get(`/property/leases/${termination.lease}/`);
      setSelectedLease(leaseResponse.data);
      
      setFormData({
        lease: termination.lease,
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
      setError('Failed to load termination details');
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
      fetchTerminations();
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
      fetchTerminations();
    } catch (err) {
      setError(err.message);
    }
  };

  const completeTermination = async (id) => {
    try {
      await apiClient.post(`/property/lease-terminations/${id}/complete/`);
      setSuccess('Termination completed');
      fetchTerminations();
      fetchLeases();
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredTerminations = terminations.filter((term) => {
    if (filterStatus === 'all') return true;
    return term.status === filterStatus;
  });

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

  return (
    <Container className="mt-4">
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

      <div className="mb-3">
        <Form.Label>Filter by Status:</Form.Label>
        <Form.Select
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{width: '200px'}}
        >
          <option value="all">All</option>
          <option value="draft">Draft</option>
          <option value="pending_approval">Pending Approval</option>
          <option value="approved">Approved</option>
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </Form.Select>
      </div>

      <div>
        <Card>
          <Card.Body>
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Termination #</th>
                  <th>Lease #</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Refund/Charge</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTerminations.length > 0 ? (
                  filteredTerminations.map((term) => (
                    <tr key={term.id}>
                      <td>
                        <strong>{term.termination_number}</strong>
                      </td>
                      <td>{term.lease_details?.lease_number}</td>
                      <td>
                        <Badge bg={term.termination_type === 'early' ? 'warning' : 'info'}>
                          {getTypeLabel(term.termination_type)}
                        </Badge>
                      </td>
                      <td>{term.termination_date}</td>
                      <td>
                        <strong className={parseFloat(term.net_refund) > 0 ? 'text-success' : 'text-danger'}>
                          {parseFloat(term.net_refund) > 0 ? '↓ ' : '↑ '}
                          SAR {Math.abs(parseFloat(term.net_refund)).toFixed(2)}
                        </strong>
                      </td>
                      <td>
                        <Badge bg={getStatusBadgeClass(term.status)}>
                          {term.status.replace('_', ' ').toUpperCase()}
                        </Badge>
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
                          onClick={() => handleEdit(term)}
                          title="Edit termination"
                        >
                          <i className="fas fa-edit"></i>
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center text-muted">
                      No lease terminations found
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
};

export default LeaseTermination;
