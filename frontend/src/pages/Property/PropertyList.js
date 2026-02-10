import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Alert, Spinner, Modal, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { propertyService } from '../../services/propertyService';
import './PropertyList.css';

function PropertyList() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [formData, setFormData] = useState({
    property_id: '',
    name: '',
    property_type: 'residential',
    status: 'available',
    street_address: '',
    city: '',
    state: '',
    zip_code: '',
    country: '',
    purchase_price: '',
    total_area: '',
    acquisition_date: '',
  });

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        const response = await propertyService.getAll();
        // Handle both paginated and non-paginated responses
        const data = Array.isArray(response.data) ? response.data : (response.data.results || response.data.data || []);
        
        if (isMounted) {
          setProperties(data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to load properties');
          console.error(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await propertyService.create(formData);
      setShowForm(false);
      setFormData({
        property_id: '',
        name: '',
        property_type: 'residential',
        status: 'available',
        street_address: '',
        city: '',
        state: '',
        zip_code: '',
        country: '',
        purchase_price: '',
        total_area: '',
        acquisition_date: '',
      });
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      setError('Failed to create property');
      console.error(err);
    }
  };

  return (
    <Container fluid className="property-list">
      <div className="page-header mb-4">
        <h1>
          <i className="fas fa-building me-2"></i>
          Properties
        </h1>
        <Button variant="primary" onClick={() => navigate('/properties/new')}>
          <i className="fas fa-plus me-2"></i>
          Add Property
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <div className="text-center">
          <Spinner animation="border" />
        </div>
      ) : (
        <Card>
          <Card.Body>
            <Table responsive hover>
              <thead className="table-header">
                <tr>
                  <th>Property ID</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Area (sq.m)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {properties.length > 0 ? (
                  properties.map(property => (
                    <tr key={property.id}>
                      <td><strong>{property.property_id}</strong></td>
                      <td>{property.name}</td>
                      <td>{property.property_type}</td>
                      <td>{property.city}, {property.state}</td>
                      <td>
                        <span className={`badge bg-${property.status === 'available' ? 'success' : property.status === 'occupied' ? 'warning' : 'info'}`}>
                          {property.status}
                        </span>
                      </td>
                      <td>{property.total_area}</td>
                      <td>
                        <Button 
                          variant="info" 
                          size="sm"
                          className="me-2"
                          onClick={() => navigate(`/properties/${property.id}`)}
                          title="View property details"
                        >
                          <i className="fas fa-eye"></i>
                        </Button>
                        <Button 
                          variant="warning" 
                          size="sm"
                          onClick={() => navigate(`/properties/edit/${property.id}`)}
                          title="Edit property"
                        >
                          <i className="fas fa-edit"></i>
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center text-muted py-4">
                      No properties found. Create one to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      {/* Add Property Modal */}
      <Modal show={showForm} onHide={() => setShowForm(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Add New Property</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Property ID</Form.Label>
              <Form.Control
                type="text"
                name="property_id"
                value={formData.property_id}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Property Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Property Type</Form.Label>
                  <Form.Select
                    name="property_type"
                    value={formData.property_type}
                    onChange={handleInputChange}
                  >
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                    <option value="industrial">Industrial</option>
                    <option value="land">Land</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="leased">Leased</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Street Address</Form.Label>
              <Form.Control
                type="text"
                name="street_address"
                value={formData.street_address}
                onChange={handleInputChange}
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>City</Form.Label>
                  <Form.Control
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>State</Form.Label>
                  <Form.Control
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Zip Code</Form.Label>
                  <Form.Control
                    type="text"
                    name="zip_code"
                    value={formData.zip_code}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Country</Form.Label>
                  <Form.Control
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Purchase Price</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="purchase_price"
                    value={formData.purchase_price}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Total Area (sq.m)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="total_area"
                    value={formData.total_area}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Acquisition Date</Form.Label>
              <Form.Control
                type="date"
                name="acquisition_date"
                value={formData.acquisition_date}
                onChange={handleInputChange}
              />
            </Form.Group>

            <div className="d-flex gap-2">
              <Button variant="primary" type="submit">
                Create Property
              </Button>
              <Button variant="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
}

export default PropertyList;
