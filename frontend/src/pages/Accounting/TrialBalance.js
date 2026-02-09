import React, { useState } from 'react';
import { Card, Table, Button, Form, Row, Col, Alert, Container } from 'react-bootstrap';
import apiClient from '../../services/api';

const TrialBalance = () => {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ start_date: '', end_date: '' });

  const fetchData = async () => {
    try {
      const params = {};
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
      const res = await apiClient.get('/accounts/journal-lines/trial_balance/', { params });
      setRows(res.data);
      setError('');
    } catch (err) {
      setError('Failed to load trial balance');
    }
  };

  return (
    <Container fluid>
      <h2 className="mb-4">Trial Balance</h2>
      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={4}>
              <Form.Control type="date" value={filters.start_date} onChange={(e) => setFilters({ ...filters, start_date: e.target.value })} />
            </Col>
            <Col md={4}>
              <Form.Control type="date" value={filters.end_date} onChange={(e) => setFilters({ ...filters, end_date: e.target.value })} />
            </Col>
            <Col md={4}>
              <Button onClick={fetchData}>Load</Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>Trial Balance</Card.Header>
        <Card.Body>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Account #</th>
                <th>Account Name</th>
                <th>Debit</th>
                <th>Credit</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.account__id}>
                  <td>{r.account__account_number}</td>
                  <td>{r.account__account_name}</td>
                  <td>{r.total_debit}</td>
                  <td>{r.total_credit}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default TrialBalance;
