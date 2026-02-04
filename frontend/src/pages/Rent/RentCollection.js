import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Alert, Spinner } from 'react-bootstrap';
import { rentService } from '../../services/propertyService';

function RentCollection() {
  const [rentPayments, setRentPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        const response = await rentService.getAll();
        // Handle both paginated and non-paginated responses
        const data = Array.isArray(response.data) ? response.data : (response.data.results || response.data.data || []);
        
        if (isMounted) {
          setRentPayments(data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to load rent payments');
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
        <h1>Rent Collection</h1>
        <Button variant="primary">
          <i className="fas fa-plus me-2"></i>
          Record Payment
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
                  <th>Tenant</th>
                  <th>Unit</th>
                  <th>Rent Date</th>
                  <th>Due Date</th>
                  <th>Amount</th>
                  <th>Paid Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rentPayments.length > 0 ? (
                  rentPayments.map(rent => (
                    <tr key={rent.id}>
                      <td>{rent.tenant_name}</td>
                      <td>{rent.unit}</td>
                      <td>{rent.rent_date}</td>
                      <td>{rent.due_date}</td>
                      <td>${rent.amount}</td>
                      <td>${rent.paid_amount}</td>
                      <td>
                        <span className={`badge bg-${rent.status === 'paid' ? 'success' : rent.status === 'overdue' ? 'danger' : 'warning'}`}>
                          {rent.status}
                        </span>
                      </td>
                      <td>
                        <Button variant="sm" size="sm">
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center text-muted py-4">
                      No rent payments found.
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

export default RentCollection;
