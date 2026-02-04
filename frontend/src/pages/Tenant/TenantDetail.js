import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Button, Badge, Spinner, Alert, ListGroup } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../services/api';

function TenantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchTenant = async () => {
      try {
        const response = await apiClient.get(`/property/related-parties/${id}/`);
        setTenant(response.data);
      } catch (err) {
        setError('Error fetching party details');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchTenant();
    }
  }, [id]);
  
  const getPartyTypeBadge = (type) => {
    if (!type) return <Badge bg="secondary">Not Set</Badge>;
    const variants = {
      'tenant': 'primary',
      'landlord': 'success',
      'vendor': 'info',
      'contractor': 'warning',
      'other': 'secondary'
    };
    return <Badge bg={variants[type] || 'secondary'}>{type.toUpperCase()}</Badge>;
  };
  
  const getStatusBadge = (status) => {
    if (!status) return <Badge bg="secondary">Not Set</Badge>;
    const variants = {
      'active': 'success',
      'inactive': 'secondary'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status.toUpperCase()}</Badge>;
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
        <Button variant="secondary" onClick={() => navigate('/related-parties')}>
          Back to Related Parties
        </Button>
      </Container>
    );
  }
  
  if (!tenant) {
    return (
      <Container className="mt-4">
        <Alert variant="warning">Related party not found</Alert>
        <Button variant="secondary" onClick={() => navigate('/related-parties')}>
          Back to Related Parties
        </Button>
      </Container>
    );
  }
  
  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <i className="fas fa-user me-2"></i>
          {tenant.party_type === 'tenant' ? 'Tenant' : 'Related Party'} Details
        </h2>
        <div>
          <Button 
            variant="warning" 
            onClick={() => navigate(`/related-parties/edit/${tenant.id}`)}
            className="me-2"
          >
            <i className="fas fa-edit me-2"></i>
            Edit
          </Button>
          <Button variant="secondary" onClick={() => navigate('/related-parties')}>
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
                  <strong>Party Code:</strong> {tenant.party_code || 'Not Assigned'}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Name:</strong> {`${tenant.first_name || ''} ${tenant.last_name || ''}`.trim() || tenant.name || 'Not Provided'}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Type:</strong> {getPartyTypeBadge(tenant.party_type)}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Status:</strong> {getStatusBadge(tenant.status)}
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Contact Information</h5>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <strong><i className="fas fa-envelope me-2"></i>Email:</strong> {tenant.email || 'Not Provided'}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong><i className="fas fa-phone me-2"></i>Phone:</strong> {tenant.phone || tenant.mobile || 'Not Provided'}
                </ListGroup.Item>
                {(tenant.address || tenant.city || tenant.state) && (
                  <ListGroup.Item>
                    <strong><i className="fas fa-map-marker-alt me-2"></i>Address:</strong>
                    <div>
                      {tenant.address && <div>{tenant.address}</div>}
                      {(tenant.city || tenant.state) && (
                        <div>{[tenant.city, tenant.state].filter(Boolean).join(', ')}</div>
                      )}
                    </div>
                  </ListGroup.Item>
                )}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {tenant.national_id && (
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">Identification</h5>
          </Card.Header>
          <Card.Body>
            <ListGroup variant="flush">
              <ListGroup.Item>
                <strong>National ID:</strong> {tenant.national_id}
              </ListGroup.Item>
            </ListGroup>
          </Card.Body>
        </Card>
      )}
      
      {tenant.notes && (
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">Notes</h5>
          </Card.Header>
          <Card.Body>
            <p>{tenant.notes}</p>
          </Card.Body>
        </Card>
      )}
      
      {tenant.party_type === 'tenant' && (
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
              onClick={() => navigate(`/leases?tenant=${tenant.id}`)}
            >
              <i className="fas fa-file-contract me-2"></i>
              View Leases
            </Button>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
}

export default TenantDetail;
