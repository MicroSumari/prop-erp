import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Alert, Spinner, Card, Row, Col } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { unitService, propertyService } from '../../services/propertyService';
import './PropertyForm.css';

function PropertyUnitForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [properties, setProperties] = useState([]);
  
  // Unit form state
  const [unitData, setUnitData] = useState({
    property: '',
    unit_number: '',
    unit_type: 'apartment',
    area: '',
    bedrooms: '0',
    bathrooms: '0',
    monthly_rent: '',
    status: 'vacant',
  });

  useEffect(() => {
    // Load all properties for selection
    const loadProperties = async () => {
      try {
        const response = await propertyService.getAll();
        const data = Array.isArray(response.data) 
          ? response.data 
          : (response.data.results || response.data.data || []);
        setProperties(data);
      } catch (err) {
        console.error('Failed to load properties:', err);
      }
    };
    loadProperties();
  }, []);

  useEffect(() => {
    if (id) {
      // Load existing unit data for editing
      const loadUnit = async () => {
        try {
          setLoading(true);
          const response = await unitService.getById(id);
          setUnitData(response.data);
        } catch (err) {
          setError('Failed to load unit data');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      loadUnit();
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUnitData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Validate required fields
      if (!unitData.property || !unitData.unit_number || !unitData.area) {
        setError('Please fill in all required fields (Property, Unit Number, Area)');
        setLoading(false);
        return;
      }

      const unitPayload = {
        property: parseInt(unitData.property),
        unit_number: unitData.unit_number,
        unit_type: unitData.unit_type,
        area: parseFloat(unitData.area),
        bedrooms: parseInt(unitData.bedrooms || 0),
        bathrooms: parseInt(unitData.bathrooms || 0),
        monthly_rent: parseFloat(unitData.monthly_rent || 0),
        status: unitData.status,
      };

      if (id) {
        // Update existing unit
        await unitService.update(id, unitPayload);
        setSuccess('Property unit updated successfully!');
      } else {
        // Create new unit
        await unitService.create(unitPayload);
        setSuccess('Property unit created successfully!');
      }

      setTimeout(() => navigate('/property-units'), 2000);
    } catch (err) {
      const apiErrors = err.response?.data;
      const errorMessage =
        apiErrors?.non_field_errors?.[0] ||
        apiErrors?.unit_number?.[0] ||
        apiErrors?.property?.[0] ||
        apiErrors?.detail ||
        `Failed to ${id ? 'update' : 'create'} unit`;
      setError(errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectedProperty = properties.find(p => p.id === parseInt(unitData.property));

  return (
    <Container className="property-form-container mt-5">
      <Card className="property-form-card">
        <Card.Header className="bg-primary text-white">
          <h2 className="mb-0">
            <i className="fas fa-cube me-2"></i>
            {id ? 'Edit' : 'Add New'} Property Unit
          </h2>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <Form onSubmit={handleSubmit}>
            <h4 className="mb-4">Unit Information</h4>

            <Form.Group className="mb-3">
              <Form.Label>Parent Property <span className="text-danger">*</span></Form.Label>
              <Form.Select
                name="property"
                value={unitData.property}
                onChange={handleChange}
                required
              >
                <option value="">-- Select Property --</option>
                {properties.map(property => (
                  <option key={property.id} value={property.id}>
                    {property.name} ({property.property_id}) - {property.city}, {property.state}
                  </option>
                ))}
              </Form.Select>
              {selectedProperty && (
                <Form.Text className="text-muted">
                  <i className="fas fa-info-circle me-1"></i>
                  Selected: {selectedProperty.name} - {selectedProperty.street_address}
                </Form.Text>
              )}
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Unit Number <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="unit_number"
                    value={unitData.unit_number}
                    onChange={handleChange}
                    placeholder="e.g., 101, 102, Shop-A"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Unit Type</Form.Label>
                  <Form.Select
                    name="unit_type"
                    value={unitData.unit_type}
                    onChange={handleChange}
                  >
                    <option value="apartment">Apartment</option>
                    <option value="shop">Shop</option>
                    <option value="showroom">Showroom</option>
                    <option value="office">Office</option>
                    <option value="warehouse">Warehouse</option>
                    <option value="parking">Parking</option>
                    <option value="other">Other</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Area (sq m) <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number"
                    name="area"
                    value={unitData.area}
                    onChange={handleChange}
                    placeholder="0.00"
                    step="0.01"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Bedrooms</Form.Label>
                  <Form.Control
                    type="number"
                    name="bedrooms"
                    value={unitData.bedrooms}
                    onChange={handleChange}
                    placeholder="0"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Bathrooms</Form.Label>
                  <Form.Control
                    type="number"
                    name="bathrooms"
                    value={unitData.bathrooms}
                    onChange={handleChange}
                    placeholder="0"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Monthly Rent</Form.Label>
                  <Form.Control
                    type="number"
                    name="monthly_rent"
                    value={unitData.monthly_rent}
                    onChange={handleChange}
                    placeholder="0.00"
                    step="0.01"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    name="status"
                    value={unitData.status}
                    onChange={handleChange}
                  >
                    <option value="vacant">Vacant</option>
                    <option value="occupied">Occupied</option>
                    <option value="maintenance">Under Maintenance</option>
                  </Form.Select>
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
                    {id ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <i className="fas fa-save me-2"></i>
                    {id ? 'Update Unit' : 'Create Unit'}
                  </>
                )}
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate('/property-units')}
                className="btn-lg"
              >
                <i className="fas fa-arrow-left me-2"></i>
                Cancel
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default PropertyUnitForm;
