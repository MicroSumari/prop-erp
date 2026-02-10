import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Form, Row, Col, Alert, Container, Modal } from 'react-bootstrap';
import apiClient from '../../services/api';

const CustomerInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [costCenters, setCostCenters] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showView, setShowView] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const initialFormData = {
    tenant: '',
    lease: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    amount: '',
    is_taxable: false,
    tax_rate: 0,
    income_account: '',
    tax_account: '',
    tenant_account: '',
    cost_center: '',
    status: 'draft',
    notes: '',
  };
  const [formData, setFormData] = useState(initialFormData);

  const resolveAccountName = (id) => {
    const account = accounts.find((a) => a.id === id);
    return account ? `${account.account_number} - ${account.account_name}` : 'N/A';
  };

  const resolveCostCenter = (id) => {
    const center = costCenters.find((c) => c.id === id);
    return center ? `${center.code} - ${center.name}` : 'N/A';
  };

  const resolveTenantName = (id) => {
    const tenant = tenants.find((t) => t.id === id);
    return tenant ? `${tenant.first_name} ${tenant.last_name}` : 'N/A';
  };

  const normalizeList = (data) => (Array.isArray(data) ? data : (data?.results || []));

  const fetchData = async () => {
    try {
      const [invRes, tenantRes, accRes, ccRes] = await Promise.all([
        apiClient.get('/sales/customer-invoices/'),
        apiClient.get('/property/related-parties/'),
        apiClient.get('/accounts/accounts/'),
        apiClient.get('/accounts/cost-centers/'),
      ]);
      setInvoices(normalizeList(invRes.data));
      setTenants(normalizeList(tenantRes.data));
      setAccounts(normalizeList(accRes.data));
      setCostCenters(normalizeList(ccRes.data));
    } catch (err) {
      setError('Failed to load data');
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
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount || 0),
        tax_rate: parseFloat(formData.tax_rate || 0),
      };
      if (editingId) {
        await apiClient.put(`/sales/customer-invoices/${editingId}/`, payload);
        setSuccess('Customer invoice updated');
      } else {
        await apiClient.post('/sales/customer-invoices/', payload);
        setSuccess('Customer invoice created');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData(initialFormData);
      fetchData();
    } catch (err) {
      setError('Failed to create customer invoice');
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
      tenant: item.tenant || '',
      lease: item.lease || '',
      invoice_date: item.invoice_date || new Date().toISOString().split('T')[0],
      due_date: item.due_date || '',
      amount: item.amount || '',
      is_taxable: !!item.is_taxable,
      tax_rate: item.tax_rate || 0,
      income_account: item.income_account || '',
      tax_account: item.tax_account || '',
      tenant_account: item.tenant_account || '',
      cost_center: item.cost_center || '',
      status: item.status || 'draft',
      notes: item.notes || '',
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
          <i className="fas fa-file-invoice me-2"></i>
          Customer Invoices
        </h1>
        <Button variant="primary" onClick={openCreate}>
          <i className="fas fa-plus me-2"></i>
          Add Customer Invoice
        </Button>
      </div>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Card>
        <Card.Header>Customer Invoices</Card.Header>
        <Card.Body>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Tenant</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length > 0 ? (
                invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td>{inv.invoice_number}</td>
                    <td>{inv.tenant}</td>
                    <td>{inv.invoice_date}</td>
                    <td>{inv.amount}</td>
                    <td>{inv.total_amount}</td>
                    <td>{inv.status}</td>
                    <td>
                      <Button
                        variant="info"
                        size="sm"
                        className="me-2"
                        onClick={() => openView(inv)}
                        title="View invoice"
                      >
                        <i className="fas fa-eye"></i>
                      </Button>
                      <Button
                        variant="warning"
                        size="sm"
                        onClick={() => openEdit(inv)}
                        title="Edit invoice"
                      >
                        <i className="fas fa-edit"></i>
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center text-muted py-4">
                    No customer invoices yet. Click "Add Customer Invoice" to create one.
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
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>{editingId ? 'Edit Customer Invoice' : 'Create Customer Invoice'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Tenant</Form.Label>
                  <Form.Select name="tenant" value={formData.tenant} onChange={handleChange} required>
                    <option value="">Select tenant</option>
                    {tenants.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.first_name} {t.last_name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Invoice Date</Form.Label>
                  <Form.Control type="date" name="invoice_date" value={formData.invoice_date} onChange={handleChange} required />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Due Date</Form.Label>
                  <Form.Control type="date" name="due_date" value={formData.due_date} onChange={handleChange} />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Amount</Form.Label>
                  <Form.Control type="number" name="amount" value={formData.amount} onChange={handleChange} required />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Check type="checkbox" name="is_taxable" label="Taxable" checked={formData.is_taxable} onChange={handleChange} />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Tax Rate (%)</Form.Label>
                  <Form.Control type="number" name="tax_rate" value={formData.tax_rate} onChange={handleChange} />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Income Account</Form.Label>
                  <Form.Select name="income_account" value={formData.income_account} onChange={handleChange} required>
                    <option value="">Select account</option>
                    {accounts.filter((a) => a.account_type === 'income').map((a) => (
                      <option key={a.id} value={a.id}>{a.account_number} - {a.account_name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Tax Account</Form.Label>
                  <Form.Select name="tax_account" value={formData.tax_account} onChange={handleChange}>
                    <option value="">Select account</option>
                    {accounts.filter((a) => a.account_type === 'liability').map((a) => (
                      <option key={a.id} value={a.id}>{a.account_number} - {a.account_name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Tenant Account</Form.Label>
                  <Form.Select name="tenant_account" value={formData.tenant_account} onChange={handleChange}>
                    <option value="">Select account</option>
                    {accounts.filter((a) => a.account_type === 'asset').map((a) => (
                      <option key={a.id} value={a.id}>{a.account_number} - {a.account_name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Cost Center</Form.Label>
                  <Form.Select name="cost_center" value={formData.cost_center} onChange={handleChange}>
                    <option value="">Select cost center</option>
                    {costCenters.map((c) => (
                      <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select name="status" value={formData.status} onChange={handleChange}>
                    <option value="draft">Draft</option>
                    <option value="submitted">Submitted</option>
                    <option value="paid">Paid</option>
                    <option value="void">Void</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
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
                {editingId ? 'Save Changes' : 'Create Invoice'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      <Modal show={showView} onHide={() => setShowView(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Customer Invoice Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {viewItem && (
            <div className="d-grid gap-2">
              <div><strong>Invoice #:</strong> {viewItem.invoice_number}</div>
              <div><strong>Tenant:</strong> {resolveTenantName(viewItem.tenant)}</div>
              <div><strong>Date:</strong> {viewItem.invoice_date}</div>
              <div><strong>Due Date:</strong> {viewItem.due_date || 'N/A'}</div>
              <div><strong>Amount:</strong> {viewItem.amount}</div>
              <div><strong>Taxable:</strong> {viewItem.is_taxable ? 'Yes' : 'No'}</div>
              <div><strong>Tax Rate:</strong> {viewItem.tax_rate || 0}%</div>
              <div><strong>Tax Amount:</strong> {viewItem.tax_amount || 0}</div>
              <div><strong>Total:</strong> {viewItem.total_amount}</div>
              <div><strong>Status:</strong> {viewItem.status}</div>
              <div><strong>Income Account:</strong> {resolveAccountName(viewItem.income_account)}</div>
              <div><strong>Tenant Account:</strong> {resolveAccountName(viewItem.tenant_account)}</div>
              <div><strong>Tax Account:</strong> {resolveAccountName(viewItem.tax_account)}</div>
              <div><strong>Cost Center:</strong> {resolveCostCenter(viewItem.cost_center)}</div>
              {viewItem.notes && <div><strong>Notes:</strong> {viewItem.notes}</div>}
            </div>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default CustomerInvoices;
