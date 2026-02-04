import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Alert, Spinner } from 'react-bootstrap';
import { expenseService } from '../../services/propertyService';

function ExpenseList() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        const response = await expenseService.getAll();
        // Handle both paginated and non-paginated responses
        const data = Array.isArray(response.data) ? response.data : (response.data.results || response.data.data || []);
        
        if (isMounted) {
          setExpenses(data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to load expenses');
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
        <h1>Expenses</h1>
        <Button variant="primary">
          <i className="fas fa-plus me-2"></i>
          Add Expense
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
                  <th>ID</th>
                  <th>Description</th>
                  <th>Property</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Payment Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length > 0 ? (
                  expenses.map(expense => (
                    <tr key={expense.id}>
                      <td>{expense.expense_id}</td>
                      <td>{expense.description}</td>
                      <td>{expense.property}</td>
                      <td>{expense.expense_type}</td>
                      <td>${expense.amount}</td>
                      <td>
                        <span className={`badge bg-${expense.payment_status === 'paid' ? 'success' : expense.payment_status === 'overdue' ? 'danger' : 'warning'}`}>
                          {expense.payment_status}
                        </span>
                      </td>
                      <td>{expense.expense_date}</td>
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
                      No expenses found.
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

export default ExpenseList;
