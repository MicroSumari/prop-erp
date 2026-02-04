import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Button, Badge, Spinner, Alert, ListGroup } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../services/api';

function PropertyUnitDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [unit, setUnit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchUnit = async () => {
      try {
        const response = await apiClient.get(`/property/units/${id}/`);
        setUnit(response.data);
      } catch (err) {
        setError('Error fetching unit details');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchUnit();
    }
  }, [id]);
  
  const getStatusBadge = (status) => {
    const variants = {
      'vacant': 'secondary',
      'occupied': 'success',
      'under_maintenance': 'warning',
      'reserved': 'info'
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
        <Button variant="secondary" onClick={() => navigate('/property-units')}>
          Back to Units
        </Button>
      </Container>
    );
  }
  
  if (!unit) {
    return (
      <Container className="mt-4">
        <Alert variant="warning">Unit not found</Alert>
        <Button variant="secondary" onClick={() => navigate('/property-units')}>
          Back to Units
        </Button>
      </Container>
    );
  }
  
  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <i className="fas fa-door-open me-2"></i>
          Unit Details - {unit.unit_number}
        </h2>
        <div>
          <Button 
            variant="warning" 
            onClick={() => navigate(`/property-units/edit/${unit.id}`)}
            className="me-2"
          >
            <i className="fas fa-edit me-2"></i>
            Edit
          </Button>
          <Button variant="secondary" onClick={() => navigate('/property-units')}>
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
                  <strong>Unit Number:</strong> {unit.unit_number}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Property:</strong> {unit.property_name || 'N/A'}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Status:</strong> {getStatusBadge(unit.status)}
                </ListGroup.Item>
                {unit.floor && (
                  <ListGroup.Item>
                    <strong>Floor:</strong> {unit.floor}
                  </ListGroup.Item>
                )}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Unit Details</h5>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <strong>Bedrooms:</strong> {unit.bedrooms || 0}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Bathrooms:</strong> {unit.bathrooms || 0}
                </ListGroup.Item>
                {unit.square_footage && (
                  <ListGroup.Item>
                    <strong>Square Footage:</strong> {unit.square_footage} sq ft
                  </ListGroup.Item>
                )}
                <ListGroup.Item>
                  <strong>Market Rent:</strong> ${parseFloat(unit.market_rent || 0).toLocaleString()}
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {unit.description && (
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">Description</h5>
          </Card.Header>
          <Card.Body>
            <p>{unit.description}</p>
          </Card.Body>
        </Card>
      )}
      
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">
            <i className="fas fa-file-contract me-2"></i>
            Related Information
          </h5>
        </Card.Header>
        <Card.Body>
          <Button 
            variant="info" 
            onClick={() => navigate(`/leases?unit=${unit.id}`)}
            className="me-2"
          >
            <i className="fas fa-file-contract me-2"></i>
            View Leases
          </Button>
          {unit.property_id && (
            <Button 
              variant="secondary" 
              onClick={() => navigate(`/properties/${unit.property_id}`)}
            >
              <i className="fas fa-building me-2"></i>
              View Property
            </Button>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}

export default PropertyUnitDetail;
