import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Form, Row, Col, Alert, Container, Modal } from 'react-bootstrap';
import apiClient from '../../services/api';

const PaymentVouchers = () => {
  const [vouchers, setVouchers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [supplierInvoices, setSupplierInvoices] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [costCenters, setCostCenters] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showView, setShowView] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const initialFormData = {
    supplier: '',
    supplier_invoice: '',
    payment_date: new Date().toISOString().split('T')[0],
    amount: '',
    payment_method: 'cash',
    cash_account: '',
    bank_account: '',
    cheques_issued_account: '',
    supplier_account: '',
    cost_center: '',
    status: 'draft',
    description: '',
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

  const resolveSupplierName = (id) => {
    const supplier = suppliers.find((s) => s.id === id);
    return supplier ? `${supplier.first_name} ${supplier.last_name}` : 'N/A';
  };

  const resolveInvoiceNumber = (id) => {
    const invoice = supplierInvoices.find((i) => i.id === id);
    return invoice ? invoice.invoice_number : 'N/A';
  };

  const normalizeList = (data) => (Array.isArray(data) ? data : (data?.results || []));

  const fetchData = async () => {
    try {
      const [voucherRes, supplierRes, invoiceRes, accRes, ccRes] = await Promise.all([
        apiClient.get('/purchase/payment-vouchers/'),
        apiClient.get('/property/related-parties/'),
        apiClient.get('/purchase/supplier-invoices/'),
        apiClient.get('/accounts/accounts/'),
        apiClient.get('/accounts/cost-centers/'),
      ]);
      setVouchers(normalizeList(voucherRes.data));
      setSuppliers(normalizeList(supplierRes.data));
      setSupplierInvoices(normalizeList(invoiceRes.data));
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
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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
      };
      if (editingId) {
        await apiClient.put(`/purchase/payment-vouchers/${editingId}/`, payload);
        setSuccess('Payment voucher updated');
      } else {
        await apiClient.post('/purchase/payment-vouchers/', payload);
        setSuccess('Payment voucher created');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData(initialFormData);
      fetchData();
    } catch (err) {
      setError('Failed to create payment voucher');
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
      supplier: item.supplier || '',
      supplier_invoice: item.supplier_invoice || '',
      payment_date: item.payment_date || new Date().toISOString().split('T')[0],
      amount: item.amount || '',
      payment_method: item.payment_method || 'cash',
      cash_account: item.cash_account || '',
      bank_account: item.bank_account || '',
      cheques_issued_account: item.cheques_issued_account || '',
      supplier_account: item.supplier_account || '',
      cost_center: item.cost_center || '',
      status: item.status || 'draft',
      description: item.description || '',
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
          <i className="fas fa-hand-holding-usd me-2"></i>
          Payment Vouchers
        </h1>
        <Button variant="primary" onClick={openCreate}>
          <i className="fas fa-plus me-2"></i>
          Add Payment Voucher
        </Button>
      </div>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Card>
        <Card.Header>Payment Vouchers</Card.Header>
        <Card.Body>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Voucher #</th>
                <th>Supplier</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vouchers.length > 0 ? (
                vouchers.map((v) => (
                  <tr key={v.id}>
                    <td>{v.voucher_number}</td>
                    <td>{v.supplier}</td>
                    <td>{v.payment_date}</td>
                    <td>{v.amount}</td>
                    <td>{v.payment_method}</td>
                    <td>{v.status}</td>
                    <td>
                      <Button
                        variant="info"
                        size="sm"
                        className="me-2"
                        onClick={() => openView(v)}
                        title="View voucher"
                      >
                        <i className="fas fa-eye"></i>
                      </Button>
                      <Button
                        variant="warning"
                        size="sm"
                        onClick={() => openEdit(v)}
                        title="Edit voucher"
                      >
                        <i className="fas fa-edit"></i>
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center text-muted py-4">
                    No payment vouchers yet. Click "Add Payment Voucher" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal show={showForm} onHide={() => setShowForm(false)} size="lg"/>
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
          <Modal.Title>{editingId ? 'Edit Payment Voucher' : 'Create Payment Voucher'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Supplier</Form.Label>
                  <Form.Select name="supplier" value={formData.supplier} onChange={handleChange} required>
                    <option value="">Select supplier</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.first_name} {s.last_name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Supplier Invoice</Form.Label>
                  <Form.Select name="supplier_invoice" value={formData.supplier_invoice} onChange={handleChange}>
                    <option value="">Select invoice</option>
                    {supplierInvoices.map((inv) => (
                      <option key={inv.id} value={inv.id}>{inv.invoice_number}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Payment Date</Form.Label>
                  <Form.Control type="date" name="payment_date" value={formData.payment_date} onChange={handleChange} required />
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
                  <Form.Label>Payment Method</Form.Label>
                  <Form.Select name="payment_method" value={formData.payment_method} onChange={handleChange}>
                    <option value="cash">Cash</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select name="status" value={formData.status} onChange={handleChange}>
                    <option value="draft">Draft</option>
                    <option value="submitted">Submitted</option>
                    <option value="cleared">Cleared</option>
                    <option value="cancelled">Cancelled</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Cash Account</Form.Label>
                  <Form.Select name="cash_account" value={formData.cash_account} onChange={handleChange}>
                    <option value="">Select account</option>
                    {accounts.filter((a) => a.account_type === 'asset').map((a) => (
                      <option key={a.id} value={a.id}>{a.account_number} - {a.account_name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Bank Account</Form.Label>
                  <Form.Select name="bank_account" value={formData.bank_account} onChange={handleChange}>
                    <option value="">Select account</option>
                    {accounts.filter((a) => a.account_type === 'asset').map((a) => (
                      <option key={a.id} value={a.id}>{a.account_number} - {a.account_name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Cheques Issued Account</Form.Label>
                  <Form.Select name="cheques_issued_account" value={formData.cheques_issued_account} onChange={handleChange}>
                    <option value="">Select account</option>
                    {accounts.filter((a) => a.account_type === 'liability').map((a) => (
                      <option key={a.id} value={a.id}>{a.account_number} - {a.account_name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Supplier Account</Form.Label>
                  <Form.Select name="supplier_account" value={formData.supplier_account} onChange={handleChange}>
                    <option value="">Select account</option>
                    {accounts.filter((a) => a.account_type === 'liability').map((a) => (
                      <option key={a.id} value={a.id}>{a.account_number} - {a.account_name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
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
                {editingId ? 'Save Changes' : 'Create Voucher'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      <Modal show={showView} onHide={() => setShowView(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Payment Voucher Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {viewItem && (
            <div className="d-grid gap-2">
              <div><strong>Voucher #:</strong> {viewItem.voucher_number}</div>
              <div><strong>Supplier:</strong> {resolveSupplierName(viewItem.supplier)}</div>
              <div><strong>Supplier Invoice:</strong> {resolveInvoiceNumber(viewItem.supplier_invoice)}</div>
              <div><strong>Date:</strong> {viewItem.payment_date}</div>
              <div><strong>Amount:</strong> {viewItem.amount}</div>
              <div><strong>Method:</strong> {viewItem.payment_method}</div>
              <div><strong>Status:</strong> {viewItem.status}</div>
              <div><strong>Cash Account:</strong> {resolveAccountName(viewItem.cash_account)}</div>
              <div><strong>Bank Account:</strong> {resolveAccountName(viewItem.bank_account)}</div>
              <div><strong>Cheques Issued Account:</strong> {resolveAccountName(viewItem.cheques_issued_account)}</div>
              <div><strong>Supplier Account:</strong> {resolveAccountName(viewItem.supplier_account)}</div>
              <div><strong>Cost Center:</strong> {resolveCostCenter(viewItem.cost_center)}</div>
              {viewItem.description && <div><strong>Description:</strong> {viewItem.description}</div>}
            </div>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default PaymentVouchers;
