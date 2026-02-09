import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Form, Row, Col, Alert, Container } from 'react-bootstrap';
import apiClient from '../../services/api';

const GeneralLedger = () => {
  const [accounts, setAccounts] = useState([]);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ account_id: '', start_date: '', end_date: '' });

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await apiClient.get('/accounts/accounts/');
        const list = Array.isArray(res.data) ? res.data : (res.data?.results || []);
        setAccounts(list);
      } catch (err) {
        setError('Failed to load accounts');
      }
    };
    fetchAccounts();
  }, []);

  const fetchData = async () => {
    try {
      const params = {};
      if (filters.account_id) params.account_id = filters.account_id;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
      const res = await apiClient.get('/accounts/journal-lines/general_ledger/', { params });
      setRows(res.data);
      setError('');
    } catch (err) {
      setError('Failed to load general ledger');
    }
  };

  return (
    <Container fluid>
      <h2 className="mb-4">General Ledger</h2>
      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={4}>
              <Form.Select value={filters.account_id} onChange={(e) => setFilters({ ...filters, account_id: e.target.value })}>
                <option value="">Select account</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.account_number} - {a.account_name}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Control type="date" value={filters.start_date} onChange={(e) => setFilters({ ...filters, start_date: e.target.value })} />
            </Col>
            <Col md={3}>
              <Form.Control type="date" value={filters.end_date} onChange={(e) => setFilters({ ...filters, end_date: e.target.value })} />
            </Col>
            <Col md={2}>
              <Button onClick={fetchData}>Load</Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>Ledger Entries</Card.Header>
        <Card.Body>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Date</th>
                <th>Entry Type</th>
                <th>Reference</th>
                <th>Account</th>
                <th>Debit</th>
                <th>Credit</th>
                <th>Cost Center</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={`${r.entry_id}-${idx}`}>
                  <td>{r.entry_date}</td>
                  <td>{r.entry_type}</td>
                  <td>{r.reference_type} #{r.reference_id}</td>
                  <td>{r.account_number} - {r.account_name}</td>
                  <td>{r.debit}</td>
                  <td>{r.credit}</td>
                  <td>{r.cost_center}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default GeneralLedger;
