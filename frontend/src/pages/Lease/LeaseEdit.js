import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Alert, Spinner, Card, Row, Col } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { leaseService } from '../../services/propertyService';
import apiClient from '../../services/api';
import './LeaseForm.css';

function LeaseEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [units, setUnits] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  
  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState('success');
  
  // Add this state to track when form should be disabled
  const [isFormDisabled, setIsFormDisabled] = useState(false);
  
  const [leaseData, setLeaseData] = useState({
    lease_number: '',
    unit: '',
    tenant: '',
    start_date: '',
    end_date: '',
    monthly_rent: '',
    security_deposit: '',
    status: 'draft',
    terms_conditions: '',
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [unitsResponse, tenantsResponse, leaseResponse] = await Promise.all([
        apiClient.get('/property/units/'),
        apiClient.get('/property/related-parties/'),
        apiClient.get(`/property/leases/${id}/`)
      ]);
      
      setUnits(unitsResponse.data.results || unitsResponse.data);
      setTenants(tenantsResponse.data.results || tenantsResponse.data);
      
      const lease = leaseResponse.data;
      setLeaseData({
        lease_number: lease.lease_number || '',
        unit: lease.unit || '',
        tenant: lease.tenant || '',
        start_date: lease.start_date || '',
        end_date: lease.end_date || '',
        monthly_rent: lease.monthly_rent || '',
        security_deposit: lease.security_deposit || '',
        status: lease.status || 'draft',
        terms_conditions: lease.terms_conditions || '',
      });
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load lease data');
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLeaseData(prev => ({
      ...prev,
      [name]: value
    }));
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setLoading(true);

    try {
      await apiClient.put(`/property/leases/${id}/`, leaseData);
      showSuccessToast('Lease updated successfully!');
      setTimeout(() => navigate('/leases'), 1500);
    } catch (err) {
      const errorData = err.response?.data;
      
      if (errorData && typeof errorData === 'object') {
        const errors = {};
        let generalError = '';
        
        Object.keys(errorData).forEach(key => {
          if (Array.isArray(errorData[key])) {
            errors[key] = errorData[key][0];
          } else if (typeof errorData[key] === 'string') {
            errors[key] = errorData[key];
          } else {
            generalError = errorData[key]?.message || 'An error occurred';
          }
        });
        
        if (Object.keys(errors).length > 0) {
          setFieldErrors(errors);
          showErrorToast('Please fix the errors in the form');
        }
        if (generalError) {
          setError(generalError);
          showErrorToast(generalError);
        } else if (Object.keys(errors).length === 0) {
          const errorMsg = errorData.detail || 'Failed to update lease';
          setError(errorMsg);
          showErrorToast(errorMsg);
        }
      } else {
        const errorMsg = err.response?.data?.detail || err.message || 'Failed to update lease';
        setError(errorMsg);
        showErrorToast(errorMsg);
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" />
        <p className="mt-2">Loading lease data...</p>
      </Container>
    );
  }

  // Helper variable for form disabled state
  const isDisabled = loading || isFormDisabled;

  return (
    <Container className="lease-form-container mt-5">
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

      {/* Loading Overlay */}
      {loading && (
        <div className="form-loading-overlay">
          <div className="loading-spinner-container">
            <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
            <p className="mt-3">Updating lease...</p>
          </div>
        </div>
      )}

      <Card className={`lease-form-card ${isDisabled ? 'form-disabled' : ''}`}>
        <Card.Header className="bg-primary text-white">
          <h2 className="mb-0">
            <i className="fas fa-edit me-2"></i>
            Edit Lease
          </h2>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <h4 className="mb-4">Lease Information</h4>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Lease Number <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="lease_number"
                    value={leaseData.lease_number}
                    onChange={handleChange}
                    placeholder="e.g., LEASE-001"
                    required
                    disabled={isDisabled}
                    isInvalid={!!fieldErrors.lease_number}
                  />
                  {fieldErrors.lease_number && (
                    <Form.Control.Feedback type="invalid">
                      {fieldErrors.lease_number}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Unit <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="unit"
                    value={leaseData.unit}
                    onChange={handleChange}
                    required
                    disabled={isDisabled}
                    isInvalid={!!fieldErrors.unit}
                  >
                    <option value="">Select Unit</option>
                    {units.map(unit => (
                      <option key={unit.id} value={unit.id}>
                        {unit.unit_number} - {unit.property_name || `Property ${unit.property}`}
                      </option>
                    ))}
                  </Form.Select>
                  {fieldErrors.unit && (
                    <Form.Control.Feedback type="invalid">
                      {fieldErrors.unit}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Tenant</Form.Label>
                  <Form.Select
                    name="tenant"
                    value={leaseData.tenant}
                    onChange={handleChange}
                    disabled={isDisabled}
                    isInvalid={!!fieldErrors.tenant}
                  >
                    <option value="">Select Tenant (Optional)</option>
                    {tenants.map(tenant => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.name || `${tenant.first_name} ${tenant.last_name}`}
                      </option>
                    ))}
                  </Form.Select>
                  {fieldErrors.tenant && (
                    <Form.Control.Feedback type="invalid">
                      {fieldErrors.tenant}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
              </Col>
            </Row>

            <h4 className="mt-4 mb-4">Lease Dates</h4>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Start Date <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="date"
                    name="start_date"
                    value={leaseData.start_date}
                    onChange={handleChange}
                    required
                    disabled={isDisabled}
                    isInvalid={!!fieldErrors.start_date}
                  />
                  {fieldErrors.start_date && (
                    <Form.Control.Feedback type="invalid">
                      {fieldErrors.start_date}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>End Date <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="date"
                    name="end_date"
                    value={leaseData.end_date}
                    onChange={handleChange}
                    required
                    disabled={isDisabled}
                    isInvalid={!!fieldErrors.end_date}
                  />
                  {fieldErrors.end_date && (
                    <Form.Control.Feedback type="invalid">
                      {fieldErrors.end_date}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
              </Col>
            </Row>

            <h4 className="mt-4 mb-4">Financial Details</h4>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Monthly Rent (SAR) <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="monthly_rent"
                    value={leaseData.monthly_rent}
                    onChange={handleChange}
                    placeholder="0.00"
                    required
                    disabled={isDisabled}
                    isInvalid={!!fieldErrors.monthly_rent}
                  />
                  {fieldErrors.monthly_rent && (
                    <Form.Control.Feedback type="invalid">
                      {fieldErrors.monthly_rent}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Security Deposit (SAR) <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="security_deposit"
                    value={leaseData.security_deposit}
                    onChange={handleChange}
                    placeholder="0.00"
                    required
                    disabled={isDisabled}
                    isInvalid={!!fieldErrors.security_deposit}
                  />
                  {fieldErrors.security_deposit && (
                    <Form.Control.Feedback type="invalid">
                      {fieldErrors.security_deposit}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Status <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="status"
                    value={leaseData.status}
                    onChange={handleChange}
                    disabled={isDisabled}
                    isInvalid={!!fieldErrors.status}
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="terminated">Terminated</option>
                  </Form.Select>
                  {fieldErrors.status && (
                    <Form.Control.Feedback type="invalid">
                      {fieldErrors.status}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
              </Col>
            </Row>

            <h4 className="mt-4 mb-4">Terms & Conditions</h4>

            <Form.Group className="mb-3">
              <Form.Label>Terms & Conditions</Form.Label>
              <Form.Control
                as="textarea"
                name="terms_conditions"
                value={leaseData.terms_conditions}
                onChange={handleChange}
                placeholder="Enter lease terms and conditions"
                rows={4}
                disabled={isDisabled}
                isInvalid={!!fieldErrors.terms_conditions}
              />
              {fieldErrors.terms_conditions && (
                <Form.Control.Feedback type="invalid">
                  {fieldErrors.terms_conditions}
                </Form.Control.Feedback>
              )}
            </Form.Group>

            <div className="d-flex gap-2 mt-4">
              <Button
                variant="primary"
                type="submit"
                disabled={isDisabled}
                className="btn-lg"
              >
                {loading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" className="me-2" />
                    Updating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save me-2"></i>
                    Update Lease
                  </>
                )}
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate('/leases')}
                className="btn-lg"
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

export default LeaseEdit;