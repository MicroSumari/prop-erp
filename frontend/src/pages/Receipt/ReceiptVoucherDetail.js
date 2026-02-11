import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Button, Badge, Spinner, Alert, ListGroup } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../services/api';

function ReceiptVoucherDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        const response = await apiClient.get(`/sales/receipt-vouchers/${id}/`);
        setReceipt(response.data);
      } catch (err) {
        setError('Error fetching receipt details');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchReceipt();
    }
  }, [id]);
  
  const getStatusBadge = (status) => {
    const variants = {
      'draft': 'secondary',
      'submitted': 'warning',
      'cleared': 'success',
      'bounced': 'danger',
      'cancelled': 'secondary'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status.toUpperCase()}</Badge>;
  };
  
  const getPaymentMethodBadge = (method) => {
    const variants = {
      'cash': 'success',
      'bank': 'info',
      'cheque': 'warning',
      'post_dated_cheque': 'warning'
    };
    const label = method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    return <Badge bg={variants[method] || 'secondary'}>{label}</Badge>;
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
        <Button variant="secondary" onClick={() => navigate('/receipt-vouchers')}>
          Back to Receipts
        </Button>
      </Container>
    );
  }
  
  if (!receipt) {
    return (
      <Container className="mt-4">
        <Alert variant="warning">Receipt not found</Alert>
        <Button variant="secondary" onClick={() => navigate('/receipt-vouchers')}>
          Back to Receipts
        </Button>
      </Container>
    );
  }
  
  return (
    <Container fluid className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <i className="fas fa-receipt me-2"></i>
          Receipt Voucher Details
        </h2>
        <div>
          <Button 
            variant="warning" 
            onClick={() => navigate(`/receipt-vouchers/edit/${receipt.id}`)}
            className="me-2"
          >
            <i className="fas fa-edit me-2"></i>
            Edit
          </Button>
          <Button variant="secondary" onClick={() => navigate('/receipt-vouchers')}>
            <i className="fas fa-arrow-left me-2"></i>
            Back
          </Button>
        </div>
      </div>
      
      <Row>
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Receipt Information</h5>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <strong>Receipt Number:</strong> {receipt.receipt_number || 'N/A'}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Tenant:</strong> {receipt.tenant_name || 'N/A'}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Payment Date:</strong> {receipt.payment_date ? new Date(receipt.payment_date).toLocaleDateString() : 'N/A'}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Status:</strong> {getStatusBadge(receipt.status)}
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Payment Details</h5>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <strong>Amount:</strong> ${parseFloat(receipt.amount || 0).toLocaleString()}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Payment Method:</strong> {getPaymentMethodBadge(receipt.payment_method)}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Cheque Number:</strong> {receipt.cheque_number || 'N/A'}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Cheque Date:</strong> {receipt.cheque_date ? new Date(receipt.cheque_date).toLocaleDateString() : 'N/A'}
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {receipt.lease && (
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">Lease Information</h5>
          </Card.Header>
          <Card.Body>
            <ListGroup variant="flush">
              <ListGroup.Item>
                <strong>Lease:</strong> {receipt.lease_number || `Lease #${receipt.lease}`}
              </ListGroup.Item>
            </ListGroup>
          </Card.Body>
        </Card>
      )}
      
      {receipt.description && (
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">Description</h5>
          </Card.Header>
          <Card.Body>
            <p>{receipt.description}</p>
          </Card.Body>
        </Card>
      )}
      
      {receipt.notes && (
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">Notes</h5>
          </Card.Header>
          <Card.Body>
            <p>{receipt.notes}</p>
          </Card.Body>
        </Card>
      )}
      
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">
            <i className="fas fa-link me-2"></i>
            Related Information
          </h5>
        </Card.Header>
        <Card.Body>
          {receipt.tenant && (
            <Button 
              variant="info"
              onClick={() => navigate(`/related-parties/${receipt.tenant}`)}
              className="me-2"
            >
              <i className="fas fa-user me-2"></i>
              View Tenant
            </Button>
          )}
          {receipt.lease && (
            <Button 
              variant="success"
              onClick={() => navigate(`/leases/${receipt.lease}`)}
            >
              <i className="fas fa-file-contract me-2"></i>
              View Lease
            </Button>
          )}
        </Card.Body>
      </Card>
      
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">
            <i className="fas fa-history me-2"></i>
            Accounting Status
          </h5>
        </Card.Header>
        <Card.Body>
          <ListGroup variant="flush">
            <ListGroup.Item>
              <strong>Accounting Posted:</strong> {receipt.accounting_posted ? <Badge bg="success">Yes</Badge> : <Badge bg="secondary">No</Badge>}
            </ListGroup.Item>
          </ListGroup>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default ReceiptVoucherDetail;
