import React, { useEffect, useState } from 'react';
import { Card, Button, Form, Row, Col, Alert, Container, Table, Modal } from 'react-bootstrap';
import apiClient from '../../services/api';

const ManualJournals = () => {
  const [accounts, setAccounts] = useState([]);
  const [costCenters, setCostCenters] = useState([]);
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showView, setShowView] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editDescription, setEditDescription] = useState('');
  const initialFormData = {
    description: '',
    lines: [
      { account: '', debit: '', credit: '', cost_center: '' },
      { account: '', debit: '', credit: '', cost_center: '' },
    ],
  };
  const [formData, setFormData] = useState(initialFormData);

  const normalizeList = (data) => (Array.isArray(data) ? data : (data?.results || []));

  const fetchData = async () => {
    try {
      const [accRes, ccRes, entryRes] = await Promise.all([
        apiClient.get('/accounts/accounts/'),
        apiClient.get('/accounts/cost-centers/'),
        apiClient.get('/accounts/journal-entries/'),
      ]);
      const accountsList = normalizeList(accRes.data);
      const costCentersList = normalizeList(ccRes.data);
      const entriesList = normalizeList(entryRes.data);
      setAccounts(accountsList);
      setCostCenters(costCentersList);
      setEntries(entriesList.filter((e) => e.entry_type === 'manual'));
    } catch (err) {
      setError('Failed to load data');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLineChange = (index, field, value) => {
    const updated = [...formData.lines];
    updated[index][field] = value;
    setFormData((prev) => ({ ...prev, lines: updated }));
  };

  const addLine = () => {
    setFormData((prev) => ({
      ...prev,
      lines: [...prev.lines, { account: '', debit: '', credit: '', cost_center: '' }],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const payload = {
        description: formData.description,
        lines: formData.lines.map((l) => ({
          account: l.account,
          debit: parseFloat(l.debit || 0),
          credit: parseFloat(l.credit || 0),
          cost_center: l.cost_center,
        })),
      };
      await apiClient.post('/accounts/manual-journals/', payload);
      setSuccess('Manual journal entry created');
      setShowForm(false);
      setFormData(initialFormData);
      fetchData();
    } catch (err) {
      setError('Failed to create manual journal entry');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await apiClient.patch(`/accounts/journal-entries/${editingId}/`, {
        description: editDescription,
      });
      setSuccess('Manual journal entry updated');
      setShowEdit(false);
      setEditingId(null);
      setEditDescription('');
      fetchData();
    } catch (err) {
      setError('Failed to update manual journal entry');
    }
  };

  const openCreate = () => {
    setFormData(initialFormData);
    setShowForm(true);
  };

  const openView = (item) => {
    setViewItem(item);
    setShowView(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setEditDescription(item.description || '');
    setShowEdit(true);
  };

  return (
    <Container fluid>
      <div className="page-header mb-4">
        <h1>Manual Journal Entries</h1>
        <Button variant="primary" onClick={openCreate}>
          <i className="fas fa-plus me-2"></i>
          Add Manual Journal
        </Button>
      </div>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Card>
        <Card.Header>Manual Journal Entries</Card.Header>
        <Card.Body>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id}>
                  <td>{e.id}</td>
                  <td>{e.entry_date}</td>
                  <td>{e.description}</td>
                  <td>
                    <Button
                      variant="info"
                      size="sm"
                      className="me-2"
                      onClick={() => openView(e)}
                      title="View journal"
                    >
                      <i className="fas fa-eye"></i>
                    </Button>
                    <Button
                      variant="warning"
                      size="sm"
                      onClick={() => openEdit(e)}
                      title="Edit journal"
                    >
                      <i className="fas fa-edit"></i>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal
        show={showForm}
        onHide={() => {
          setShowForm(false);
          setFormData(initialFormData);
        }}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Create Manual Journal Entry</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control name="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </Form.Group>
            {formData.lines.map((line, idx) => (
              <Row key={idx} className="mb-3">
                <Col md={4}>
                  <Form.Select value={line.account} onChange={(e) => handleLineChange(idx, 'account', e.target.value)} required>
                    <option value="">Select account</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.account_number} - {a.account_name}</option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <Form.Control type="number" placeholder="Debit" value={line.debit} onChange={(e) => handleLineChange(idx, 'debit', e.target.value)} />
                </Col>
                <Col md={2}>
                  <Form.Control type="number" placeholder="Credit" value={line.credit} onChange={(e) => handleLineChange(idx, 'credit', e.target.value)} />
                </Col>
                <Col md={4}>
                  <Form.Select value={line.cost_center} onChange={(e) => handleLineChange(idx, 'cost_center', e.target.value)} required>
                    <option value="">Select cost center</option>
                    {costCenters.map((c) => (
                      <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                    ))}
                  </Form.Select>
                </Col>
              </Row>
            ))}
            <div className="d-flex justify-content-between">
              <Button variant="secondary" onClick={addLine}>Add Line</Button>
              <div className="d-flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowForm(false);
                    setFormData(initialFormData);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary">Post Journal</Button>
              </div>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      <Modal show={showView} onHide={() => setShowView(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Manual Journal Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {viewItem && (
            <div className="d-grid gap-2">
              <div><strong>ID:</strong> {viewItem.id}</div>
              <div><strong>Date:</strong> {viewItem.entry_date}</div>
              <div><strong>Description:</strong> {viewItem.description}</div>
            </div>
          )}
        </Modal.Body>
      </Modal>

      <Modal show={showEdit} onHide={() => setShowEdit(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Manual Journal</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleEditSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
            </Form.Group>
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

export default ManualJournals;
