import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../../services/api';
import './ReceiptVoucherForm.css'; // Create this CSS file

function ReceiptVoucherForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [leases, setLeases] = useState([]);
  const [tenants, setTenants] = useState([]);
  
  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState('success');
  
  // Add this state to track when form should be disabled
  const [isFormDisabled, setIsFormDisabled] = useState(false);
  
  const [formData, setFormData] = useState({
    lease: '',
    tenant: '',
    payment_date: new Date().toISOString().split('T')[0],
    amount: '',
    payment_method: 'cash',
    bank_name: '',
    cheque_number: '',
    cheque_date: '',
    description: '',
    notes: '',
    status: 'draft'
  });

  useEffect(() => {
    fetchLeases();
    fetchTenants();
    if (id) {
      fetchReceipt();
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

  const fetchTenants = async () => {
    try {
      const response = await apiClient.get('/property/related-parties/');
      const data = Array.isArray(response.data) ? response.data : (response.data.results || []);
      setTenants(data);
    } catch (err) {
      console.error('Error fetching tenants:', err);
    }
  };

  const fetchReceipt = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/sales/receipt-vouchers/${id}/`);
      setFormData(response.data);
    } catch (err) {
      setError('Error fetching receipt details');
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
      navigate('/receipt-vouchers');
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
      navigate('/receipt-vouchers');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Create a copy of formData
      const dataToSend = { ...formData };
      
      // Only include cheque-related fields if payment method is cheque
      if (formData.payment_method !== 'cheque') {
        delete dataToSend.cheque_date;
        delete dataToSend.cheque_number;
        delete dataToSend.bank_name;
      } else {
        // If payment method is cheque but fields are empty, remove them
        if (!dataToSend.cheque_date) delete dataToSend.cheque_date;
        if (!dataToSend.cheque_number) delete dataToSend.cheque_number;
        if (!dataToSend.bank_name) delete dataToSend.bank_name;
      }
      
      // Remove empty description and notes
      if (!dataToSend.description) delete dataToSend.description;
      if (!dataToSend.notes) delete dataToSend.notes;

      if (id) {
        await apiClient.put(`/sales/receipt-vouchers/${id}/`, dataToSend);
        showSuccessToast('Receipt voucher updated successfully!');
      } else {
        await apiClient.post('/sales/receipt-vouchers/', dataToSend);
        showSuccessToast('Receipt voucher created successfully!');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Error saving receipt voucher';
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
            <i className="fas fa-receipt me-2"></i>
            {id ? 'Edit' : 'Create'} Receipt Voucher
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
                  <Form.Label>Tenant <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="tenant"
                    value={formData.tenant}
                    onChange={handleChange}
                    required
                    disabled={isDisabled}
                  >
                    <option value="">Select Tenant</option>
                    {tenants.map(tenant => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.first_name} {tenant.last_name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Payment Date <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="date"
                    name="payment_date"
                    value={formData.payment_date}
                    onChange={handleChange}
                    required
                    disabled={isDisabled}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Amount <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    required
                    placeholder="0.00"
                    disabled={isDisabled}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Payment Method <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="payment_method"
                    value={formData.payment_method}
                    onChange={handleChange}
                    required
                    disabled={isDisabled}
                  >
                    <option value="cash">Cash</option>
                    <option value="cheque">Cheque</option>
                    <option value="transfer">Bank Transfer</option>
                    <option value="online">Online Payment</option>
                  </Form.Select>
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
                    <option value="cleared">Cleared</option>
                    <option value="bounced">Bounced</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Bank Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="bank_name"
                    value={formData.bank_name}
                    onChange={handleChange}
                    disabled={isDisabled}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Cheque/Reference Number</Form.Label>
                  <Form.Control
                    type="text"
                    name="cheque_number"
                    value={formData.cheque_number}
                    onChange={handleChange}
                    placeholder="Cheque/Transaction number"
                    disabled={isDisabled}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Cheque Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="cheque_date"
                    value={formData.cheque_date}
                    onChange={handleChange}
                    disabled={isDisabled}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    type="text"
                    name="description"
                    value={formData.description}
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
                    placeholder="Additional notes"
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
                    {id ? 'Update' : 'Create'} Receipt
                  </>
                )}
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => navigate('/receipt-vouchers')}
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

export default ReceiptVoucherForm;