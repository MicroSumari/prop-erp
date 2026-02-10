import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Form, Row, Col, Alert, Container, Modal } from 'react-bootstrap';
import apiClient from '../../services/api';

const Accounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showView, setShowView] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewItem, setViewItem] = useState(null);

  const initialFormData = {
    account_number: '',
    account_name: '',
    account_type: 'asset',
    description: '',
    is_active: true,
  };
  const [formData, setFormData] = useState(initialFormData);

  const normalizeList = (data) => (Array.isArray(data) ? data : (data?.results || []));

  const fetchData = async () => {
    try {
      const res = await apiClient.get('/accounts/accounts/');
      setAccounts(normalizeList(res.data));
    } catch (err) {
      setError('Failed to load accounts');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      if (editingId) {
        await apiClient.put(`/accounts/accounts/${editingId}/`, formData);
        setSuccess('Account updated');
      } else {
        await apiClient.post('/accounts/accounts/', formData);
        setSuccess('Account created');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData(initialFormData);
      fetchData();
    } catch (err) {
      setError('Failed to save account');
    }
  };

  const handleDelete = async (id) => {
    setError('');
    setSuccess('');
    try {
      await apiClient.delete(`/accounts/accounts/${id}/`);
      setSuccess('Account deleted');
      fetchData();
    } catch (err) {
      setError('Failed to delete account');
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setFormData(initialFormData);
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      account_number: item.account_number || '',
      account_name: item.account_name || '',
      account_type: item.account_type || 'asset',
      description: item.description || '',
      is_active: item.is_active !== false,
    });
    setShowForm(true);
  };

  const openView = (item) => {
    setViewItem(item);
    setShowView(true);
  };

  return (
    <Container fluid>
      <div className="page-header mb-4">
        <h1>
          <i className="fas fa-book me-2"></i>
          Accounts
        </h1>
        <Button variant="primary" onClick={openCreate}>
          <i className="fas fa-plus me-2"></i>
          Add Account
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Card>
        <Card.Header>Chart of Accounts</Card.Header>
        <Card.Body>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Account #</th>
                <th>Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.length > 0 ? (
                accounts.map((acc) => (
                  <tr key={acc.id}>
                    <td>{acc.account_number}</td>
                    <td>{acc.account_name}</td>
                    <td>{acc.account_type}</td>
                    <td>{acc.is_active ? 'Active' : 'Inactive'}</td>
                    <td>
                      <Button
                        variant="info"
                        size="sm"
                        className="me-2"
                        onClick={() => openView(acc)}
                        title="View account"
                      >
                        <i className="fas fa-eye"></i>
                      </Button>
                      <Button
                        variant="warning"
                        size="sm"
                        className="me-2"
                        onClick={() => openEdit(acc)}
                        title="Edit account"
                      >
                        <i className="fas fa-edit"></i>
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(acc.id)}
                        title="Delete account"
                      >
                        <i className="fas fa-trash"></i>
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center text-muted py-4">
                    No accounts found. Click "Add Account" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal
        show={showForm}
        onHide={() => {
          setShowForm(false);
          setEditingId(null);
          setFormData(initialFormData);
        }}
      >
        <Modal.Header closeButton>
          <Modal.Title>{editingId ? 'Edit Account' : 'Create Account'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Account Number</Form.Label>
                  <Form.Control
                    name="account_number"
                    value={formData.account_number}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Account Type</Form.Label>
                  <Form.Select name="account_type" value={formData.account_type} onChange={handleChange}>
                    <option value="asset">Asset</option>
                    <option value="liability">Liability</option>
                    <option value="equity">Equity</option>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Account Name</Form.Label>
              <Form.Control
                name="account_name"
                value={formData.account_name}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                label="Active"
              />
            </Form.Group>
            <div className="d-flex justify-content-end gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setFormData(initialFormData);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                {editingId ? 'Save Changes' : 'Create Account'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      <Modal show={showView} onHide={() => setShowView(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Account Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {viewItem && (
            <div className="d-grid gap-2">
              <div><strong>Account #:</strong> {viewItem.account_number}</div>
              <div><strong>Name:</strong> {viewItem.account_name}</div>
              <div><strong>Type:</strong> {viewItem.account_type}</div>
              <div><strong>Status:</strong> {viewItem.is_active ? 'Active' : 'Inactive'}</div>
              {viewItem.description && <div><strong>Description:</strong> {viewItem.description}</div>}
            </div>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default Accounts;
