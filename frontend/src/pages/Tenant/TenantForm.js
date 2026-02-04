import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Alert, Spinner, Card, Row, Col } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { tenantService } from '../../services/propertyService';
import './TenantForm.css';

function TenantForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEditMode);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  
  // Form state - only fields that exist on backend Tenant model
  const [tenantData, setTenantData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    move_in_date: '',
    move_out_date: '',
    emergency_contact: '',
    emergency_contact_phone: '',
  });

  useEffect(() => {
    if (isEditMode) {
      fetchTenant();
    }
  }, [id]);

  const fetchTenant = async () => {
    try {
      const response = await tenantService.getById(id);
      const tenant = response.data;
      setTenantData({
        first_name: tenant.first_name || '',
        last_name: tenant.last_name || '',
        email: tenant.email || '',
        phone: tenant.phone || '',
        move_in_date: tenant.move_in_date || '',
        move_out_date: tenant.move_out_date || '',
        emergency_contact: tenant.emergency_contact || '',
        emergency_contact_phone: tenant.emergency_contact_phone || '',
      });
    } catch (err) {
      setError('Failed to load related party data');
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTenantData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFieldErrors({});
    setLoading(true);

    try {
      // Validate required fields
      if (!tenantData.first_name || !tenantData.last_name || !tenantData.email || !tenantData.phone || !tenantData.move_in_date) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Create or update tenant
      if (isEditMode) {
        await tenantService.update(id, tenantData);
        setSuccess('Related Party updated successfully!');
      } else {
        await tenantService.create(tenantData);
        setSuccess('Related Party created successfully!');
      }
      setTimeout(() => navigate('/related-parties'), 2000);
    } catch (err) {
      const errorData = err.response?.data;
      
      // Extract field-specific errors
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
        }
        if (generalError) {
          setError(generalError);
        } else if (Object.keys(errors).length === 0) {
          setError(errorData.detail || 'Failed to create related party');
        }
      } else {
        setError(err.response?.data?.detail || err.message || 'Failed to create related party');
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
        <p className="mt-2">Loading related party data...</p>
      </Container>
    );
  }

  return (
    <Container className="tenant-form-container mt-5">
      <Card className="tenant-form-card">
        <Card.Header className="bg-primary text-white">
          <h2 className="mb-0">
            <i className={`fas ${isEditMode ? 'fa-user-edit' : 'fa-user-plus'} me-2`}></i>
            {isEditMode ? 'Edit Related Party' : 'Add New Related Party'}
          </h2>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <Form onSubmit={handleSubmit}>
            <h4 className="mb-4">Personal Information</h4>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>First Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="first_name"
                    value={tenantData.first_name}
                    onChange={handleChange}
                    placeholder="First name"
                    required
                    isInvalid={!!fieldErrors.first_name}
                  />
                  {fieldErrors.first_name && (
                    <Form.Control.Feedback type="invalid">
                      {fieldErrors.first_name}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Last Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="last_name"
                    value={tenantData.last_name}
                    onChange={handleChange}
                    placeholder="Last name"
                    required
                    isInvalid={!!fieldErrors.last_name}
                  />
                  {fieldErrors.last_name && (
                    <Form.Control.Feedback type="invalid">
                      {fieldErrors.last_name}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
              </Col>
            </Row>

            <h4 className="mt-4 mb-4">Contact Information</h4>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={tenantData.email}
                    onChange={handleChange}
                    placeholder="Email address"
                    required
                    isInvalid={!!fieldErrors.email}
                  />
                  {fieldErrors.email && (
                    <Form.Control.Feedback type="invalid">
                      {fieldErrors.email}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone Number <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={tenantData.phone}
                    onChange={handleChange}
                    placeholder="Phone number"
                    required
                    isInvalid={!!fieldErrors.phone}
                  />
                  {fieldErrors.phone && (
                    <Form.Control.Feedback type="invalid">
                      {fieldErrors.phone}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
              </Col>
            </Row>

            <h4 className="mt-4 mb-4">Move Dates</h4>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Move-In Date <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="date"
                    name="move_in_date"
                    value={tenantData.move_in_date}
                    onChange={handleChange}
                    required
                    isInvalid={!!fieldErrors.move_in_date}
                  />
                  {fieldErrors.move_in_date && (
                    <Form.Control.Feedback type="invalid">
                      {fieldErrors.move_in_date}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Move-Out Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="move_out_date"
                    value={tenantData.move_out_date}
                    onChange={handleChange}
                    isInvalid={!!fieldErrors.move_out_date}
                  />
                  {fieldErrors.move_out_date && (
                    <Form.Control.Feedback type="invalid">
                      {fieldErrors.move_out_date}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
              </Col>
            </Row>

            <h4 className="mt-4 mb-4">Emergency Contact</h4>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Emergency Contact Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="emergency_contact"
                    value={tenantData.emergency_contact}
                    onChange={handleChange}
                    placeholder="Emergency contact name"
                    isInvalid={!!fieldErrors.emergency_contact}
                  />
                  {fieldErrors.emergency_contact && (
                    <Form.Control.Feedback type="invalid">
                      {fieldErrors.emergency_contact}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Emergency Contact Phone</Form.Label>
                  <Form.Control
                    type="tel"
                    name="emergency_contact_phone"
                    value={tenantData.emergency_contact_phone}
                    onChange={handleChange}
                    placeholder="Emergency contact phone number"
                    isInvalid={!!fieldErrors.emergency_contact_phone}
                  />
                  {fieldErrors.emergency_contact_phone && (
                    <Form.Control.Feedback type="invalid">
                      {fieldErrors.emergency_contact_phone}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex gap-2 mt-4">
              <Button
                variant="primary"
                type="submit"
                disabled={loading}
                className="btn-lg"
              >
                {loading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" className="me-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save me-2"></i>
                    {isEditMode ? 'Update Party' : 'Create Party'}
                  </>
                )}
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate('/related-parties')}
                className="btn-lg"
                disabled={loading}
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

export default TenantForm;
