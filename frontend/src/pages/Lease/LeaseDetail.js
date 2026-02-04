import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Button, Badge, Spinner, Alert, ListGroup } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../services/api';

function LeaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lease, setLease] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchLease = async () => {
      try {
        const response = await apiClient.get(`/property/leases/${id}/`);
        setLease(response.data);
      } catch (err) {
        setError('Error fetching lease details');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchLease();
    }
  }, [id]);
  
  const getStatusBadge = (status) => {
    const variants = {
      'draft': 'secondary',
      'active': 'success',
      'expired': 'warning',
      'terminated': 'danger'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status.toUpperCase()}</Badge>;
  };
  
  const getBillingCycleBadge = (cycle) => {    if (!cycle) return <Badge bg="secondary">Not Set</Badge>;    const variants = {
      'monthly': 'primary',
      'quarterly': 'info',
      'semi_annual': 'warning',
      'annual': 'success'
    };
    const label = cycle.replace('_', '-').toUpperCase();
    return <Badge bg={variants[cycle] || 'secondary'}>{label}</Badge>;
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
        <Button variant="secondary" onClick={() => navigate('/leases')}>
          Back to Leases
        </Button>
      </Container>
    );
  }
  
  if (!lease) {
    return (
      <Container className="mt-4">
        <Alert variant="warning">Lease not found</Alert>
        <Button variant="secondary" onClick={() => navigate('/leases')}>
          Back to Leases
        </Button>
      </Container>
    );
  }
  
  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <i className="fas fa-file-contract me-2"></i>
          Lease Details - {lease.lease_number}
        </h2>
        <div>
          <Button 
            variant="warning" 
            onClick={() => navigate(`/leases/edit/${lease.id}`)}
            className="me-2"
          >
            <i className="fas fa-edit me-2"></i>
            Edit
          </Button>
          <Button variant="secondary" onClick={() => navigate('/leases')}>
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
                  <strong>Lease Number:</strong> {lease.lease_number}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Property:</strong> {lease.property_name || 'N/A'}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Unit:</strong> {lease.unit_number || 'N/A'}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Tenant:</strong> {lease.tenant_name || 'N/A'}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Status:</strong> {getStatusBadge(lease.status)}
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Lease Period</h5>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <strong>Start Date:</strong> {new Date(lease.start_date).toLocaleDateString()}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>End Date:</strong> {new Date(lease.end_date).toLocaleDateString()}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Signed Date:</strong> {lease.signed_date ? new Date(lease.signed_date).toLocaleDateString() : 'Not signed'}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Duration:</strong> {Math.ceil((new Date(lease.end_date) - new Date(lease.start_date)) / (1000 * 60 * 60 * 24 * 30))} months
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
              <h5 className="mb-0">Financial Details</h5>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <strong>Monthly Rent:</strong> ${parseFloat(lease.monthly_rent || 0).toLocaleString()}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Security Deposit:</strong> ${parseFloat(lease.security_deposit || 0).toLocaleString()}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Billing Cycle:</strong> {getBillingCycleBadge(lease.billing_cycle)}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Payment Day:</strong> {lease.payment_day_of_month || 'N/A'}
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Escalation</h5>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <strong>Escalation Rate:</strong> {lease.escalation_rate || 0}%
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Next Escalation Date:</strong> {lease.next_escalation_date ? new Date(lease.next_escalation_date).toLocaleDateString() : 'N/A'}
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {lease.special_terms && (
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">Special Terms</h5>
          </Card.Header>
          <Card.Body>
            <p>{lease.special_terms}</p>
          </Card.Body>
        </Card>
      )}
      
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">
            <i className="fas fa-link me-2"></i>
            Related Actions
          </h5>
        </Card.Header>
        <Card.Body>
          <Button 
            variant="info" 
            onClick={() => navigate(`/renewals?lease=${lease.id}`)}
            className="me-2"
          >
            <i className="fas fa-redo me-2"></i>
            View Renewals
          </Button>
          <Button 
            variant="warning" 
            onClick={() => navigate(`/terminations?lease=${lease.id}`)}
            className="me-2"
          >
            <i className="fas fa-ban me-2"></i>
            View Terminations
          </Button>
          <Button 
            variant="success" 
            onClick={() => navigate(`/receipts?lease=${lease.id}`)}
            className="me-2"
          >
            <i className="fas fa-receipt me-2"></i>
            View Receipts
          </Button>
          {lease.unit_id && (
            <Button 
              variant="secondary" 
              onClick={() => navigate(`/property-units/${lease.unit_id}`)}
            >
              <i className="fas fa-door-open me-2"></i>
              View Unit
            </Button>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}

export default LeaseDetail;
