import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Button, Badge, Spinner, Alert, ListGroup } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../services/api';

function LeaseRenewalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [renewal, setRenewal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchRenewal = async () => {
      try {
        const response = await apiClient.get(`/property/lease-renewals/${id}/`);
        setRenewal(response.data);
      } catch (err) {
        setError('Error fetching renewal details');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchRenewal();
    }
  }, [id]);
  
  const getStatusBadge = (status) => {
    const variants = {
      'draft': 'secondary',
      'proposed': 'warning',
      'approved': 'info',
      'activated': 'success',
      'rejected': 'danger'
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
        <Button variant="secondary" onClick={() => navigate('/lease-renewal')}>
          Back to Renewals
        </Button>
      </Container>
    );
  }
  
  if (!renewal) {
    return (
      <Container className="mt-4">
        <Alert variant="warning">Renewal not found</Alert>
        <Button variant="secondary" onClick={() => navigate('/lease-renewal')}>
          Back to Renewals
        </Button>
      </Container>
    );
  }
  
  return (
    <Container fluid className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <i className="fas fa-redo me-2"></i>
          Lease Renewal Details
        </h2>
        <div>
          <Button 
            variant="warning" 
            onClick={() => navigate(`/lease-renewal/edit/${renewal.id}`)}
            className="me-2"
          >
            <i className="fas fa-edit me-2"></i>
            Edit
          </Button>
          <Button variant="secondary" onClick={() => navigate('/lease-renewal')}>
            <i className="fas fa-arrow-left me-2"></i>
            Back
          </Button>
        </div>
      </div>
      
      <Row>
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Renewal Information</h5>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <strong>Original Lease:</strong> {renewal.original_lease_number || 'N/A'}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Status:</strong> {getStatusBadge(renewal.status)}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Proposed Start Date:</strong> {renewal.proposed_start_date ? new Date(renewal.proposed_start_date).toLocaleDateString() : 'N/A'}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Proposed End Date:</strong> {renewal.proposed_end_date ? new Date(renewal.proposed_end_date).toLocaleDateString() : 'N/A'}
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Financial Terms</h5>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <strong>Proposed Rent:</strong> ${parseFloat(renewal.proposed_rent || 0).toLocaleString()}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Proposed Deposit:</strong> ${parseFloat(renewal.proposed_deposit || 0).toLocaleString()}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Billing Cycle:</strong> {renewal.billing_cycle ? renewal.billing_cycle.replace('_', '-').toUpperCase() : 'N/A'}
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {renewal.special_terms && (
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">Special Terms</h5>
          </Card.Header>
          <Card.Body>
            <p>{renewal.special_terms}</p>
          </Card.Body>
        </Card>
      )}
      
      {renewal.notes && (
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">Notes</h5>
          </Card.Header>
          <Card.Body>
            <p>{renewal.notes}</p>
          </Card.Body>
        </Card>
      )}
      
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">
            <i className="fas fa-link me-2"></i>
            Original Lease
          </h5>
        </Card.Header>
        <Card.Body>
          <Button 
            variant="info"
            onClick={() => navigate(`/leases/${renewal.original_lease}`)}
          >
            <i className="fas fa-file-contract me-2"></i>
            View Original Lease
          </Button>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default LeaseRenewalDetail;
