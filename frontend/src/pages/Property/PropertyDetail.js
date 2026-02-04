import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Button, Badge, Spinner, Alert, ListGroup } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../services/api';

function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const response = await apiClient.get(`/property/properties/${id}/`);
        setProperty(response.data);
      } catch (err) {
        setError('Error fetching property details');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchProperty();
    }
  }, [id]);
  
  const getPropertyTypeBadge = (type) => {
    const variants = {
      'residential': 'primary',
      'commercial': 'success',
      'industrial': 'warning',
      'land': 'info',
      'mixed_use': 'secondary'
    };
    return <Badge bg={variants[type] || 'secondary'}>{type.replace('_', ' ').toUpperCase()}</Badge>;
  };
  
  const getStatusBadge = (status) => {
    const variants = {
      'active': 'success',
      'inactive': 'secondary',
      'under_maintenance': 'warning'
    };
    const label = status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return <Badge bg={variants[status] || 'secondary'}>{label}</Badge>;
  };
  
  if (loading) {
    return (
      <Container className="mt-4 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">{error}</Alert>
        <Button variant="secondary" onClick={() => navigate('/properties')}>
          Back to Properties
        </Button>
      </Container>
    );
  }
  
  if (!property) {
    return (
      <Container className="mt-4">
        <Alert variant="warning">Property not found</Alert>
        <Button variant="secondary" onClick={() => navigate('/properties')}>
          Back to Properties
        </Button>
      </Container>
    );
  }
  
  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <i className="fas fa-building me-2"></i>
          Property Details
        </h2>
        <div>
          <Button 
            variant="warning" 
            onClick={() => navigate(`/properties/edit/${property.id}`)}
            className="me-2"
          >
            <i className="fas fa-edit me-2"></i>
            Edit
          </Button>
          <Button variant="secondary" onClick={() => navigate('/properties')}>
            <i className="fas fa-arrow-left me-2"></i>
            Back
          </Button>
        </div>
      </div>
      
      <Row>
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Basic Information</h5>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <strong>Property Code:</strong> {property.property_code}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Name:</strong> {property.name}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Type:</strong> {getPropertyTypeBadge(property.property_type)}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Status:</strong> {getStatusBadge(property.status)}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Acquisition Date:</strong> {property.acquisition_date ? new Date(property.acquisition_date).toLocaleDateString() : 'N/A'}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Acquisition Cost:</strong> ${parseFloat(property.acquisition_cost || 0).toLocaleString()}
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Location</h5>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <strong>Address:</strong> {property.address || 'N/A'}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>City:</strong> {property.city || 'N/A'}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>State:</strong> {property.state || 'N/A'}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Postal Code:</strong> {property.postal_code || 'N/A'}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Country:</strong> {property.country || 'N/A'}
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row>
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Physical Details</h5>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <strong>Total Area:</strong> {property.total_area || 'N/A'} sq ft
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Lot Size:</strong> {property.lot_size || 'N/A'} sq ft
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Year Built:</strong> {property.year_built || 'N/A'}
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Additional Information</h5>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <strong>Description:</strong> {property.description || 'No description provided'}
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">
            <i className="fas fa-door-open me-2"></i>
            Units
          </h5>
        </Card.Header>
        <Card.Body>
          <Button 
            variant="info" 
            onClick={() => navigate(`/property-units?property=${property.id}`)}
          >
            <i className="fas fa-list me-2"></i>
            View All Units
          </Button>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default PropertyDetail;
