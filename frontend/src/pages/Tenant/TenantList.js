import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { tenantService } from '../../services/propertyService';

function TenantList() {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        const response = await tenantService.getAll();
        // Handle both paginated and non-paginated responses
        const data = Array.isArray(response.data) ? response.data : (response.data.results || response.data.data || []);
        
        if (isMounted) {
          setTenants(data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to load related parties');
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

  return (
    <Container fluid className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Related Parties</h1>
        <Button variant="primary" onClick={() => navigate('/related-parties/new')}>
          <i className="fas fa-plus me-2"></i>
          Add Party
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
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Move-In Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tenants.length > 0 ? (
                  tenants.map(tenant => (
                    <tr key={tenant.id}>
                      <td>{tenant.first_name} {tenant.last_name}</td>
                      <td>{tenant.email}</td>
                      <td>{tenant.phone}</td>
                      <td>{tenant.move_in_date}</td>
                      <td>
                        <span className="badge bg-success">Active</span>
                      </td>
                      <td>
                        <Button 
                          variant="info" 
                          size="sm" 
                          className="me-2"
                          onClick={() => navigate(`/related-parties/${tenant.id}`)}
                          title="View party details"
                        >
                          <i className="fas fa-eye"></i>
                        </Button>
                        <Button 
                          variant="warning" 
                          size="sm"
                          onClick={() => navigate(`/related-parties/edit/${tenant.id}`)}
                          title="Edit party"
                        >
                          <i className="fas fa-edit"></i>
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center text-muted py-4">
                      No tenants found.
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

export default TenantList;
