import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { leaseService } from '../../services/propertyService';

function LeaseList() {
  const navigate = useNavigate();
  const [leases, setLeases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        const response = await leaseService.getAll();
        const data = Array.isArray(response.data) ? response.data : (response.data.results || response.data.data || []);
        
        if (isMounted) {
          setLeases(data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to load leases');
          console.error(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const getStatusBadge = (status) => {
    const statusMap = {
      draft: 'secondary',
      active: 'success',
      expired: 'danger',
      terminated: 'warning'
    };
    return statusMap[status] || 'secondary';
  };

  return (
    <Container fluid className="mt-4">
      <div className="page-header mb-4">
        <h1>
          <i className="fas fa-file-contract me-2"></i>
          Leases
        </h1>
        <Button variant="primary" onClick={() => navigate('/leases/new')}>
          <i className="fas fa-plus me-2"></i>
          New Lease
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <div className="text-center">
          <Spinner animation="border" />
        </div>
      ) : (
        <Card>
          <Card.Body>
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Lease #</th>
                  <th>Tenant</th>
                  <th>Unit</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Monthly Rent</th>
                  <th>Security Deposit</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leases.length > 0 ? (
                  leases.map(lease => (
                    <tr key={lease.id}>
                      <td><strong>{lease.lease_number}</strong></td>
                      <td>{lease.tenant_name || 'N/A'}</td>
                      <td>{lease.unit_number || 'N/A'}</td>
                      <td>{lease.start_date}</td>
                      <td>{lease.end_date}</td>
                      <td>SAR {parseFloat(lease.monthly_rent).toFixed(2)}</td>
                      <td>SAR {parseFloat(lease.security_deposit).toFixed(2)}</td>
                      <td>
                        <Badge bg={getStatusBadge(lease.status)}>
                          {lease.status?.charAt(0).toUpperCase() + lease.status?.slice(1)}
                        </Badge>
                      </td>
                      <td>
                        <Button 
                          variant="info" 
                          size="sm" 
                          className="me-2"
                          onClick={() => navigate(`/leases/${lease.id}`)}
                          title="View lease details"
                        >
                          <i className="fas fa-eye"></i>
                        </Button>
                        <Button 
                          variant="warning" 
                          size="sm"
                          onClick={() => navigate(`/leases/edit/${lease.id}`)}
                          title="Edit lease"
                        >
                          <i className="fas fa-edit"></i>
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="text-center text-muted py-4">
                      No leases found.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
}

export default LeaseList;
