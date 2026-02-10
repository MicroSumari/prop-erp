import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Alert, Container, Modal, Form, Row, Col } from 'react-bootstrap';
import apiClient from '../../services/api';

const ChequeRegister = () => {
  const [cheques, setCheques] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showView, setShowView] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({
    cheque_type: '',
    cheque_number: '',
    cheque_date: '',
    amount: '',
    bank_name: '',
    status: 'received',
  });

  const normalizeList = (data) => (Array.isArray(data) ? data : (data?.results || []));

  const fetchData = async () => {
    try {
      const res = await apiClient.get('/accounts/cheque-registers/');
      setCheques(normalizeList(res.data));
    } catch (err) {
      setError('Failed to load cheques');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleClear = async (id) => {
    setError('');
    setSuccess('');
    try {
      await apiClient.post(`/accounts/cheque-registers/${id}/mark_cleared/`);
      setSuccess('Cheque cleared');
      fetchData();
    } catch (err) {
      setError('Failed to clear cheque');
    }
  };

  const openView = (item) => {
    setViewItem(item);
    setShowView(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setEditData({
      cheque_type: item.cheque_type || '',
      cheque_number: item.cheque_number || '',
      cheque_date: item.cheque_date || '',
      amount: item.amount || '',
      bank_name: item.bank_name || '',
      status: item.status || 'received',
    });
    setShowEdit(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await apiClient.patch(`/accounts/cheque-registers/${editingId}/`, {
        ...editData,
        amount: parseFloat(editData.amount || 0),
      });
      setSuccess('Cheque updated');
      setShowEdit(false);
      setEditingId(null);
      fetchData();
    } catch (err) {
      setError('Failed to update cheque');
    }
  };

  return (
    <Container fluid>
      <div className="page-header mb-4">
        <h1>
          <i className="fas fa-money-check me-2"></i>
          Cheque Register
        </h1>
      </div>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Card>
        <Card.Header>Cheques</Card.Header>
        <Card.Body>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Type</th>
                <th>Cheque #</th>
                <th>Cheque Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {cheques.length > 0 ? (
                cheques.map((c) => (
                  <tr key={c.id}>
                    <td>{c.cheque_type}</td>
                    <td>{c.cheque_number}</td>
                    <td>{c.cheque_date}</td>
                    <td>{c.amount}</td>
                    <td>{c.status}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button
                          variant="info"
                          size="sm"
                          onClick={() => openView(c)}
                          title="View cheque"
                        >
                          <i className="fas fa-eye"></i>
                        </Button>
                        <Button
                          variant="warning"
                          size="sm"
                          onClick={() => openEdit(c)}
                          title="Edit cheque"
                        >
                          <i className="fas fa-edit"></i>
                        </Button>
                        {c.status !== 'cleared' && (
                          <Button size="sm" variant="success" onClick={() => handleClear(c.id)}>
                            Mark Cleared
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-4">
                    No cheques found.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal show={showView} onHide={() => setShowView(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Cheque Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {viewItem && (
            <div className="d-grid gap-2">
              <div><strong>Type:</strong> {viewItem.cheque_type}</div>
              <div><strong>Cheque #:</strong> {viewItem.cheque_number}</div>
              <div><strong>Date:</strong> {viewItem.cheque_date}</div>
              <div><strong>Amount:</strong> {viewItem.amount}</div>
              <div><strong>Status:</strong> {viewItem.status}</div>
              <div><strong>Bank:</strong> {viewItem.bank_name || 'N/A'}</div>
              <div><strong>Receipt Voucher:</strong> {viewItem.receipt_voucher || 'N/A'}</div>
              <div><strong>Payment Voucher:</strong> {viewItem.payment_voucher || 'N/A'}</div>
            </div>
          )}
        </Modal.Body>
      </Modal>

      <Modal show={showEdit} onHide={() => setShowEdit(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Cheque</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleEditSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Cheque Date</Form.Label>
                  <Form.Control type="date" value={editData.cheque_date} onChange={(e) => setEditData({ ...editData, cheque_date: e.target.value })} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Amount</Form.Label>
                  <Form.Control type="number" value={editData.amount} onChange={(e) => setEditData({ ...editData, amount: e.target.value })} />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Bank Name</Form.Label>
                  <Form.Control value={editData.bank_name} onChange={(e) => setEditData({ ...editData, bank_name: e.target.value })} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select value={editData.status} onChange={(e) => setEditData({ ...editData, status: e.target.value })}>
                    <option value="received">Received</option>
                    <option value="deposited">Deposited</option>
                    <option value="cleared">Cleared</option>
                    <option value="bounced">Bounced</option>
                    <option value="cancelled">Cancelled</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => setShowEdit(false)}>Cancel</Button>
              <Button type="submit" variant="primary">Save Changes</Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default ChequeRegister;
