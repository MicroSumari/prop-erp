import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../../services/api';
import './LeaseRenewalForm.css';

function LeaseRenewalForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [leases, setLeases] = useState([]);
  
  // Toast state - remove modal states
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState('success');
  
  // Add this state to track when form should be disabled
  const [isFormDisabled, setIsFormDisabled] = useState(false);
  
  const [formData, setFormData] = useState({
    original_lease: '',
    original_start_date: '',
    original_end_date: '',
    original_monthly_rent: '',
    new_start_date: '',
    new_end_date: '',
    new_monthly_rent: '',
    billing_cycle: 'monthly',
    special_terms: '',
    notes: ''
  });

  useEffect(() => {
    fetchLeases();
    if (id) {
      fetchRenewal();
    }
  }, [id]);

  const fetchLeases = async () => {
    try {
      const response = await apiClient.get('/property/leases/');
      const data = Array.isArray(response.data) ? response.data : (response.data.results || []);
      setLeases(data.filter(lease => lease.status === 'active'));
    } catch (err) {
      console.error('Error fetching leases:', err);
    }
  };

  const fetchRenewal = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/property/lease-renewals/${id}/`);
      setFormData(response.data);
    } catch (err) {
      setError('Error fetching renewal details');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const showSuccessToast = (message) => {
    setToastMessage(message);
    setToastVariant('success');
    setShowToast(true);
    setIsFormDisabled(true);
    
    setTimeout(() => {
      setShowToast(false);
      setIsFormDisabled(false);
      // Navigate after toast disappears
      navigate('/lease-renewal');
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
    // If it was a success toast, navigate back
    if (toastVariant === 'success') {
      navigate('/lease-renewal');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (id) {
        await apiClient.put(`/property/lease-renewals/${id}/`, formData);
        showSuccessToast('Lease renewal updated successfully!');
      } else {
        await apiClient.post('/property/lease-renewals/', formData);
        showSuccessToast('Lease renewal created successfully!');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Error saving lease renewal';
      setError(errorMsg);
      showErrorToast(errorMsg);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Helper variable for form disabled state
  const isDisabled = loading || isFormDisabled;

  if (loading && id) {
    return (
      <Container className="mt-4 text-center">
        <Spinner animation="border" />
      </Container>
    );
  }

  return (
    <Container className="mt-4">
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
          <button className="toast-close" onClick={handleToastClose} disabled={loading}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="toast-progress"></div>
      </div>

      <Card className={`${isDisabled ? 'form-disabled' : ''}`}>
        <Card.Header>
          <h3>
            <i className="fas fa-redo me-2"></i>
            {id ? 'Edit' : 'Create'} Lease Renewal
          </h3>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Original Lease <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="original_lease"
                    value={formData.original_lease}
                    onChange={handleChange}
                    required
                    disabled={!!id || isDisabled}
                  >
                    <option value="">Select Lease</option>
                    {leases.map(lease => (
                      <option key={lease.id} value={lease.id}>
                        {lease.lease_number} - {lease.tenant_name} ({lease.unit_number})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Billing Cycle <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="billing_cycle"
                    value={formData.billing_cycle}
                    onChange={handleChange}
                    required
                    disabled={isDisabled}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="semi_annual">Semi-Annual</option>
                    <option value="annual">Annual</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Original Start Date <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="date"
                    name="original_start_date"
                    value={formData.original_start_date}
                    onChange={handleChange}
                    required
                    disabled={!!id || isDisabled}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Original End Date <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="date"
                    name="original_end_date"
                    value={formData.original_end_date}
                    onChange={handleChange}
                    required
                    disabled={!!id || isDisabled}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Original Monthly Rent <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="original_monthly_rent"
                    value={formData.original_monthly_rent}
                    onChange={handleChange}
                    required
                    disabled={!!id || isDisabled}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>New Start Date <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="date"
                    name="new_start_date"
                    value={formData.new_start_date}
                    onChange={handleChange}
                    required
                    disabled={isDisabled}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>New End Date <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="date"
                    name="new_end_date"
                    value={formData.new_end_date}
                    onChange={handleChange}
                    required
                    disabled={isDisabled}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>New Monthly Rent <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="new_monthly_rent"
                    value={formData.new_monthly_rent}
                    onChange={handleChange}
                    required
                    disabled={isDisabled}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Special Terms</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="special_terms"
                    value={formData.special_terms}
                    onChange={handleChange}
                    disabled={isDisabled}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    disabled={isDisabled}
                  />
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex gap-2">
              <Button variant="primary" type="submit" disabled={isDisabled}>
                {loading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" className="me-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save me-2"></i>
                    {id ? 'Update' : 'Create'} Renewal
                  </>
                )}
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => navigate('/lease-renewal')}
                disabled={isDisabled}
              >
                <i className="fas fa-times me-2"></i>
                Cancel
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default LeaseRenewalForm;