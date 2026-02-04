import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Button, Badge, Spinner, Alert, ListGroup } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../services/api';

function LeaseTerminationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [termination, setTermination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchTermination = async () => {
      try {
        const response = await apiClient.get(`/property/lease-terminations/${id}/`);
        setTermination(response.data);
      } catch (err) {
        setError('Error fetching termination details');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchTermination();
    }
  }, [id]);
  
  const getStatusBadge = (status) => {
    const variants = {
      'draft': 'secondary',
      'proposed': 'warning',
      'approved': 'info',
      'completed': 'success',
      'rejected': 'danger'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status.toUpperCase()}</Badge>;
  };
  
  const getTerminationReasonBadge = (reason) => {
    const variants = {
      'tenant_request': 'info',
      'owner_request': 'warning',
      'mutual_agreement': 'success',
      'lease_expiry': 'secondary',
      'non_payment': 'danger',
      'breach': 'danger'
    };
    const label = reason.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return <Badge bg={variants[reason] || 'secondary'}>{label}</Badge>;
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
        <Button variant="secondary" onClick={() => navigate('/lease-termination')}>
          Back to Terminations
        </Button>
      </Container>
    );
  }
  
  if (!termination) {
    return (
      <Container className="mt-4">
        <Alert variant="warning">Termination not found</Alert>
        <Button variant="secondary" onClick={() => navigate('/lease-termination')}>
          Back to Terminations
        </Button>
      </Container>
    );
  }
  
  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <i className="fas fa-ban me-2"></i>
          Lease Termination Details
        </h2>
        <div>
          <Button 
            variant="warning" 
            onClick={() => navigate(`/lease-termination/edit/${termination.id}`)}
            className="me-2"
          >
            <i className="fas fa-edit me-2"></i>
            Edit
          </Button>
          <Button variant="secondary" onClick={() => navigate('/lease-termination')}>
            <i className="fas fa-arrow-left me-2"></i>
            Back
          </Button>
        </div>
      </div>
      
      <Row>
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Termination Information</h5>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <strong>Lease:</strong> {termination.lease_number || 'N/A'}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Status:</strong> {getStatusBadge(termination.status)}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Termination Date:</strong> {termination.termination_date ? new Date(termination.termination_date).toLocaleDateString() : 'N/A'}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Reason:</strong> {termination.termination_reason ? getTerminationReasonBadge(termination.termination_reason) : 'N/A'}
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Financial Details</h5>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <strong>Refundable Deposit:</strong> ${parseFloat(termination.refundable_deposit || 0).toLocaleString()}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Rent Payable:</strong> ${parseFloat(termination.rent_payable || 0).toLocaleString()}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Rent Received:</strong> ${parseFloat(termination.rent_received || 0).toLocaleString()}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Settlement Amount:</strong> ${parseFloat(termination.settlement_amount || 0).toLocaleString()}
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {termination.tenant_contact && (
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">Tenant Contact</h5>
          </Card.Header>
          <Card.Body>
            <ListGroup variant="flush">
              <ListGroup.Item>
                <strong>Contact:</strong> {termination.tenant_contact}
              </ListGroup.Item>
            </ListGroup>
          </Card.Body>
        </Card>
      )}
      
      {termination.remarks && (
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">Remarks</h5>
          </Card.Header>
          <Card.Body>
            <p>{termination.remarks}</p>
          </Card.Body>
        </Card>
      )}
      
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">
            <i className="fas fa-link me-2"></i>
            Related Lease
          </h5>
        </Card.Header>
        <Card.Body>
          <Button 
            variant="info"
            onClick={() => navigate(`/leases/${termination.lease}`)}
          >
            <i className="fas fa-file-contract me-2"></i>
            View Lease
          </Button>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default LeaseTerminationDetail;
