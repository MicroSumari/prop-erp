import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, Card, Button, Badge, Alert, Spinner, Row, Col } from 'react-bootstrap';
import apiClient from '../../services/api';

function MaintenanceRequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const fetchRequest = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.get(`/maintenance/requests/${id}/`);
      setRequest(response.data);
    } catch (err) {
      setError('Error loading maintenance request details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      open: 'primary',
      pending: 'warning',
      in_progress: 'info',
      completed: 'success',
      cancelled: 'secondary'
    };
    return <Badge bg={map[status] || 'secondary'}>{(status || 'unknown').replace('_', ' ').toUpperCase()}</Badge>;
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
        <Button variant="secondary" onClick={() => navigate('/maintenance/requests')}>
          <i className="fas fa-arrow-left me-2"></i>
          Back to Requests
        </Button>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Maintenance Request Details</h1>
          <p className="text-muted">Request ID: {request?.id}</p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="secondary" onClick={() => navigate('/maintenance/requests')}>
            <i className="fas fa-arrow-left me-2"></i>
            Back
          </Button>
          <Button variant="warning" onClick={() => navigate(`/maintenance/requests/edit/${request?.id}`)}>
            <i className="fas fa-edit me-2"></i>
            Edit
          </Button>
        </div>
      </div>

      <Card>
        <Card.Header className="bg-primary text-white">
          <h4 className="mb-0">Request Information</h4>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <p><strong>Property:</strong> {request?.property_name || request?.property || '-'}</p>
            </Col>
            <Col md={6}>
              <p><strong>Unit:</strong> {request?.unit_number || request?.unit || '-'}</p>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <p><strong>Request Type:</strong> {request?.request_type || '-'}</p>
            </Col>
            <Col md={6}>
              <p><strong>Priority:</strong> {request?.priority || '-'}</p>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <p><strong>Status:</strong> {getStatusBadge(request?.status)}</p>
            </Col>
            <Col md={6}>
              <p><strong>Reported By:</strong> {request?.reported_by || '-'}</p>
            </Col>
          </Row>
          <Row>
            <Col md={12}>
              <p><strong>Description:</strong></p>
              <p className="text-muted">{request?.description || '-'}</p>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <p><strong>Created At:</strong> {request?.created_at ? new Date(request.created_at).toLocaleString() : '-'}</p>
            </Col>
            <Col md={6}>
              <p><strong>Updated At:</strong> {request?.updated_at ? new Date(request.updated_at).toLocaleString() : '-'}</p>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default MaintenanceRequestDetail;
