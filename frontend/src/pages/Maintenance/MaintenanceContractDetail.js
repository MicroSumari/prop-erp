import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, Card, Button, Badge, Alert, Spinner, Row, Col } from 'react-bootstrap';
import apiClient from '../../services/api';

function MaintenanceContractDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchContract();
  }, [id]);

  const fetchContract = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.get(`/maintenance/contracts/${id}/`);
      setContract(response.data);
    } catch (err) {
      setError('Error loading maintenance contract details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      draft: 'secondary',
      active: 'success',
      completed: 'primary',
      expired: 'warning',
      cancelled: 'danger'
    };
    return <Badge bg={map[status] || 'secondary'}>{(status || 'unknown').toUpperCase()}</Badge>;
  };

  if (loading) {
    return (
      <Container className="mt-4 text-center">
        <Spinner animation="border" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">{error}</Alert>
        <Button variant="secondary" onClick={() => navigate('/maintenance/contracts')}>
          <i className="fas fa-arrow-left me-2"></i>
          Back to Contracts
        </Button>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Maintenance Contract Details</h1>
          <p className="text-muted">Contract ID: {contract?.id}</p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="secondary" onClick={() => navigate('/maintenance/contracts')}>
            <i className="fas fa-arrow-left me-2"></i>
            Back
          </Button>
          <Button variant="warning" onClick={() => navigate(`/maintenance/contracts/edit/${contract?.id}`)}>
            <i className="fas fa-edit me-2"></i>
            Edit
          </Button>
        </div>
      </div>

      <Card className="mb-4">
        <Card.Header className="bg-success text-white">
          <h4 className="mb-0">Contract Information</h4>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <p><strong>Supplier:</strong> {contract?.supplier_name || contract?.supplier || '-'}</p>
            </Col>
            <Col md={6}>
              <p><strong>Status:</strong> {getStatusBadge(contract?.status)}</p>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <p><strong>Property:</strong> {contract?.property_name || contract?.property || '-'}</p>
            </Col>
            <Col md={6}>
              <p><strong>Unit:</strong> {contract?.unit_number || contract?.unit || '-'}</p>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <p><strong>Start Date:</strong> {contract?.start_date || '-'}</p>
            </Col>
            <Col md={6}>
              <p><strong>End Date:</strong> {contract?.end_date || '-'}</p>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <p><strong>Total Amount:</strong> {contract?.total_amount ? `SAR ${parseFloat(contract.total_amount).toFixed(2)}` : '-'}</p>
            </Col>
            <Col md={6}>
              <p><strong>Duration (Months):</strong> {contract?.duration_months || '-'}</p>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <p><strong>Amortized Amount:</strong> {contract?.amortized_amount ? `SAR ${parseFloat(contract.amortized_amount).toFixed(2)}` : '-'}</p>
            </Col>
            <Col md={6}>
              <p><strong>Cost Center:</strong> {contract?.cost_center || '-'}</p>
            </Col>
          </Row>
          <Row>
            <Col md={12}>
              <p><strong>Description:</strong></p>
              <p className="text-muted">{contract?.description || '-'}</p>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default MaintenanceContractDetail;
