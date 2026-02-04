import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../../services/api';
import FormModal from '../../components/FormModal';

function MaintenanceRequestForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [properties, setProperties] = useState([]);
  const [units, setUnits] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    property: '',
    unit: '',
    request_type: 'plumbing',
    priority: 'medium',
    description: '',
    status: 'open'
  });

  useEffect(() => {
    fetchProperties();
    if (id) {
      fetchRequest();
    }
  }, [id]);

  const fetchProperties = async () => {
    try {
      const response = await apiClient.get('/property/properties/');
      const data = Array.isArray(response.data) ? response.data : (response.data.results || []);
      setProperties(data);
    } catch (err) {
      console.error('Error fetching properties:', err);
    }
  };

  const fetchUnits = async (propertyId) => {
    try {
      const response = await apiClient.get(`/property/units/?property=${propertyId}`);
      const data = Array.isArray(response.data) ? response.data : (response.data.results || []);
      setUnits(data);
    } catch (err) {
      console.error('Error fetching units:', err);
    }
  };

  const fetchRequest = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/maintenance/requests/${id}/`);
      setFormData(response.data);
      if (response.data.property) {
        fetchUnits(response.data.property);
      }
    } catch (err) {
      setError('Error fetching request details');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setModalLoading(true);
    setShowModal(true);
    setError('');

    try {
      if (id) {
        await apiClient.put(`/maintenance/requests/${id}/`, formData);
        setSuccessMessage('Maintenance request updated successfully!');
      } else {
        await apiClient.post('/maintenance/requests/', formData);
        setSuccessMessage('Maintenance request created successfully!');
      }
      
      setModalLoading(false);
      setTimeout(() => {
        setShowModal(false);
        navigate('/maintenance/requests');
      }, 1500);
    } catch (err) {
      setShowModal(false);
      setError(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Error saving maintenance request');
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

    if (name === 'property') {
      fetchUnits(value);
      setFormData(prev => ({ ...prev, unit: '' }));
    }
  };

  if (loading && id) {
    return (
      <Container className="mt-4 text-center">
        <Spinner animation="border" />
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <Card>
        <Card.Header>
          <h3>
            <i className="fas fa-wrench me-2"></i>
            {id ? 'Edit' : 'Create'} Maintenance Request
          </h3>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Property <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="property"
                    value={formData.property}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Property</option>
                    {properties.map(property => (
                      <option key={property.id} value={property.id}>
                        {property.name} ({property.property_code})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Unit <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    required
                    disabled={!formData.property}
                  >
                    <option value="">Select Unit</option>
                    {units.map(unit => (
                      <option key={unit.id} value={unit.id}>
                        {unit.unit_number}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Request Type <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="request_type"
                    value={formData.request_type}
                    onChange={handleChange}
                    required
                  >
                    <option value="plumbing">Plumbing</option>
                    <option value="electrical">Electrical</option>
                    <option value="hvac">HVAC</option>
                    <option value="carpentry">Carpentry</option>
                    <option value="general">General</option>
                    <option value="other">Other</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Priority <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    required
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Description <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex gap-2">
              <Button variant="primary" type="submit" disabled={loading}>
                <i className="fas fa-save me-2"></i>
                {loading ? 'Saving...' : (id ? 'Update' : 'Create')} Request
              </Button>
              <Button variant="secondary" onClick={() => navigate('/maintenance/requests')}>
                <i className="fas fa-times me-2"></i>
                Cancel
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
      
      <FormModal 
        show={showModal}
        loading={modalLoading}
        message={successMessage}
        onHide={() => {
          setShowModal(false);
          navigate('/maintenance/requests');
        }}
      />
    </Container>
  );
}

export default MaintenanceRequestForm;
