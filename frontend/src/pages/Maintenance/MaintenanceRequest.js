import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Button, Alert, Table } from 'react-bootstrap';
import apiClient from '../../services/api';

const MaintenanceRequest = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await apiClient.get('/maintenance/requests/');
      setRequests(response.data.results || response.data);
    } catch (err) {
      setError('Failed to load maintenance requests');
    }
  };


  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Maintenance Requests</h1>
          <p className="text-muted">Log maintenance issues for units</p>
        </div>
        <Button variant="primary" onClick={() => navigate('/maintenance/requests/new')}>
          <i className="fas fa-plus me-2"></i>
          New Request
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      <Card>
        <Card.Body>
          <Table responsive hover>
            <thead>
              <tr>
                <th>ID</th>
                <th>Property</th>
                <th>Unit</th>
                <th>Type</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.length > 0 ? (
                requests.map((req) => (
                  <tr key={req.id}>
                    <td>{req.id}</td>
                    <td>{req.property_name || req.property}</td>
                    <td>{req.unit_number || req.unit}</td>
                    <td>{req.request_type}</td>
                    <td>{req.priority}</td>
                    <td>{req.status}</td>
                    <td>{req.created_at?.split('T')[0]}</td>
                    <td>
                      <Button
                        variant="info"
                        size="sm"
                        className="me-2"
                        onClick={() => navigate(`/maintenance/requests/${req.id}`)}
                        title="View request details"
                      >
                        <i className="fas fa-eye"></i>
                      </Button>
                      <Button
                        variant="warning"
                        size="sm"
                        onClick={() => navigate(`/maintenance/requests/edit/${req.id}`)}
                        title="Edit this request"
                      >
                        <i className="fas fa-edit"></i>
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center text-muted">No maintenance requests found</td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default MaintenanceRequest;
