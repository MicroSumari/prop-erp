import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../../services/api';
import './LeaseTermination.css'; // Create this CSS file

function LeaseTerminationForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [leases, setLeases] = useState([]);
  
  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState('success');
  
  // Add this state to track when form should be disabled
  const [isFormDisabled, setIsFormDisabled] = useState(false);
  
  const [formData, setFormData] = useState({
    lease: '',
    termination_type: 'normal',
    termination_date: '',
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
    status: 'draft'
  });

  useEffect(() => {
    fetchLeases();
    if (id) {
      fetchTermination();
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

  const fetchTermination = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/property/lease-terminations/${id}/`);
      setFormData(response.data);
    } catch (err) {
      setError('Error fetching termination details');
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
      navigate('/lease-termination');
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
      navigate('/lease-termination');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (id) {
        await apiClient.put(`/property/lease-terminations/${id}/`, formData);
        showSuccessToast('Lease termination updated successfully!');
      } else {
        await apiClient.post('/property/lease-terminations/', formData);
        showSuccessToast('Lease termination created successfully!');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Error saving lease termination';
      setError(errorMsg);
      showErrorToast(errorMsg);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
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
            <i className="fas fa-ban me-2"></i>
            {id ? 'Edit' : 'Create'} Lease Termination
          </h3>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Lease <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="lease"
                    value={formData.lease}
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
                  <Form.Label>Termination Type <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="termination_type"
                    value={formData.termination_type}
                    onChange={handleChange}
                    required
                    disabled={isDisabled}
                  >
                    <option value="normal">Normal Termination</option>
                    <option value="early">Early Termination</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Termination Date <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="date"
                    name="termination_date"
                    value={formData.termination_date}
                    onChange={handleChange}
                    required
                    disabled={isDisabled}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Original Security Deposit <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="original_security_deposit"
                    value={formData.original_security_deposit}
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
                  <Form.Label>Refundable Amount <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="refundable_amount"
                    value={formData.refundable_amount}
                    onChange={handleChange}
                    required
                    disabled={isDisabled}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Maintenance Charges</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="maintenance_charges"
                    value={formData.maintenance_charges}
                    onChange={handleChange}
                    disabled={isDisabled}
                  />
                </Form.Group>
              </Col>
            </Row>

            {formData.termination_type === 'early' && (
              <>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Unearned Rent</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.01"
                        name="unearned_rent"
                        value={formData.unearned_rent}
                        onChange={handleChange}
                        disabled={isDisabled}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Early Termination Penalty</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.01"
                        name="early_termination_penalty"
                        value={formData.early_termination_penalty}
                        onChange={handleChange}
                        disabled={isDisabled}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        name="post_dated_cheques_adjusted"
                        label="Post-Dated Cheques Adjusted/Cancelled"
                        checked={formData.post_dated_cheques_adjusted}
                        onChange={handleChange}
                        disabled={isDisabled}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                {formData.post_dated_cheques_adjusted && (
                  <Row>
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Label>Cheque Adjustment Notes</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          name="post_dated_cheques_notes"
                          value={formData.post_dated_cheques_notes}
                          onChange={handleChange}
                          disabled={isDisabled}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                )}
              </>
            )}

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Terms & Conditions</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="terms_conditions"
                    value={formData.terms_conditions}
                    onChange={handleChange}
                    disabled={isDisabled}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Exit Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="exit_notes"
                    value={formData.exit_notes}
                    onChange={handleChange}
                    disabled={isDisabled}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Additional Notes</Form.Label>
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
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    disabled={isDisabled}
                  >
                    <option value="draft">Draft</option>
                    <option value="pending_approval">Pending Approval</option>
                    <option value="approved">Approved</option>
                    <option value="completed">Completed</option>
                    <option value="rejected">Rejected</option>
                    <option value="cancelled">Cancelled</option>
                  </Form.Select>
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
                    {id ? 'Update' : 'Create'} Termination
                  </>
                )}
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => navigate('/lease-termination')}
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

export default LeaseTerminationForm;