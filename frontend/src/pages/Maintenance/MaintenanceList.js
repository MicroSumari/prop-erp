import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Alert, Spinner } from 'react-bootstrap';
import { maintenanceService } from '../../services/propertyService';

function MaintenanceList() {
  const [maintenance, setMaintenance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        const response = await maintenanceService.getAll();
        // Handle both paginated and non-paginated responses
        const data = Array.isArray(response.data) ? response.data : (response.data.results || response.data.data || []);
        
        if (isMounted) {
          setMaintenance(data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to load maintenance records');
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
        <h1>Maintenance Records</h1>
        {/* <Button variant="primary">
          <i className="fas fa-plus me-2"></i>
          Create Maintenance
        </Button> */}
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
                  <th>ID</th>
                  <th>Title</th>
                  <th>Property</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Reported Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {maintenance.length > 0 ? (
                  maintenance.map(record => (
                    <tr key={record.id}>
                      <td>{record.maintenance_id}</td>
                      <td>{record.title}</td>
                      <td>{record.property}</td>
                      <td>
                        <span className={`badge bg-${record.priority === 'critical' ? 'danger' : record.priority === 'high' ? 'warning' : 'info'}`}>
                          {record.priority}
                        </span>
                      </td>
                      <td>{record.status}</td>
                      <td>{record.reported_date}</td>
                      <td>
                        <Button variant="sm" size="sm">
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center text-muted py-4">
                      No maintenance records found.
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

export default MaintenanceList;
