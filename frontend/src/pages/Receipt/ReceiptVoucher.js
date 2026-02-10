import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Table, Button, Badge, Form, Container, Alert, Row, Col, Spinner } from 'react-bootstrap';
import '../Receipt/ReceiptVoucher.css';
import apiClient from '../../services/api';

const ReceiptVoucher = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    tenant: '',
    payment_date: new Date().toISOString().split('T')[0],
    amount: '',
    payment_method: 'cash',
    bank_name: '',
    cheque_number: '',
    cheque_date: '',
    description: '',
    notes: '',
    status: 'draft',
  });

  const [tenants, setTenants] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchTenants();
    fetchReceipts();
  }, []);

  const fetchTenants = async () => {
    try {
      const response = await apiClient.get('/property/related-parties/');
      setTenants(response.data.results || response.data);
    } catch (err) {
      console.error('Error fetching tenants:', err);
    }
  };

  const fetchReceipts = async () => {
    try {
      const response = await apiClient.get('/sales/receipt-vouchers/');
      setReceipts(response.data.results || response.data);
    } catch (err) {
      console.error('Error fetching receipts:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handlePaymentMethodChange = (e) => {
    setFormData({
      ...formData,
      payment_method: e.target.value,
      bank_name: '',
      cheque_number: '',
      cheque_date: '',
    });
  };

  const handleEdit = (receipt) => {
    setEditMode(true);
    setEditId(receipt.id);
    setFormData({
      tenant: receipt.tenant,
      payment_date: receipt.payment_date,
      amount: receipt.amount,
      payment_method: receipt.payment_method,
      bank_name: receipt.bank_name || '',
      cheque_number: receipt.cheque_number || '',
      cheque_date: receipt.cheque_date || '',
      description: receipt.description || '',
      notes: receipt.notes || '',
      status: receipt.status || 'draft',
    });
    setShowForm(true);
  };

  const validateForm = () => {
    if (!formData.tenant) {
      setError('Please select a tenant');
      return false;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid amount');
      return false;
    }
    if (formData.payment_method !== 'cash') {
      if (!formData.bank_name) {
        setError('Bank name is required for bank and cheque payments');
        return false;
      }
    }
    if (formData.payment_method !== 'cash' && formData.payment_method !== 'bank') {
      if (!formData.cheque_number) {
        setError('Cheque number is required');
        return false;
      }
      if (!formData.cheque_date) {
        setError('Cheque date is required');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Prepare data, excluding empty optional fields
      const submitData = {
        tenant: formData.tenant,
        payment_date: formData.payment_date,
        amount: formData.amount,
        payment_method: formData.payment_method,
        description: formData.description,
        notes: formData.notes,
        status: formData.status,
      };

      // Only include bank/cheque fields if they have values
      if (formData.payment_method !== 'cash') {
        if (formData.bank_name) submitData.bank_name = formData.bank_name;
        if (formData.cheque_number) submitData.cheque_number = formData.cheque_number;
        if (formData.cheque_date) submitData.cheque_date = formData.cheque_date;
      }

      if (editMode && editId) {
        await apiClient.put(`/sales/receipt-vouchers/${editId}/`, submitData);
        setSuccess('Receipt voucher updated successfully');
      } else {
        await apiClient.post('/sales/receipt-vouchers/', submitData);
        setSuccess('Receipt voucher created successfully');
      }
      setFormData({
        tenant: '',
        payment_date: new Date().toISOString().split('T')[0],
        amount: '',
        payment_method: 'cash',
        bank_name: '',
        cheque_number: '',
        cheque_date: '',
        description: '',
        notes: '',
        status: 'draft',
      });
      setEditMode(false);
      setEditId(null);
      setShowForm(false);
      fetchReceipts();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const markAsCleared = async (id) => {
    try {
      await apiClient.post(`/sales/receipt-vouchers/${id}/mark_cleared/`);
      setSuccess('Receipt marked as cleared');
      fetchReceipts();
    } catch (err) {
      setError(err.message);
    }
  };

  const markAsBounced = async (id) => {
    try {
      await apiClient.post(`/sales/receipt-vouchers/${id}/mark_bounced/`);
      setSuccess('Receipt marked as bounced');
      fetchReceipts();
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredReceipts = receipts.filter((receipt) => {
    if (filterStatus === 'all') return true;
    return receipt.status === filterStatus;
  });

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      draft: 'secondary',
      submitted: 'warning',
      cleared: 'success',
      bounced: 'danger',
      cancelled: 'dark',
    };
    return statusMap[status] || 'secondary';
  };

  const getPaymentMethodLabel = (method) => {
    const methodMap = {
      cash: 'Cash',
      bank: 'Bank Transfer',
      cheque: 'Cheque',
      post_dated_cheque: 'Post-Dated Cheque',
    };
    return methodMap[method] || method;
  };

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <div className="page-header mb-4">
            <h1>Receipt Vouchers</h1>
          </div>
          <p className="text-muted">Manage tenant payments (Cash / Bank / Cheque)</p>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <div className="mb-4">
        <Button 
          variant="primary"
          onClick={() => navigate('/receipt-vouchers/new')}
        >
          <i className="fas fa-plus me-2"></i>
          New Receipt Voucher
        </Button>
      </div>

      {showForm && (
        <Card className="mb-4">
          <Card.Header className="bg-success text-white">
            <h4 className="mb-0">{editMode ? 'Edit' : 'Create'} Receipt Voucher</h4>
          </Card.Header>
          <Card.Body>
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Tenant <span className="text-danger">*</span></Form.Label>
                <Form.Select
                  name="tenant"
                  value={formData.tenant}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Tenant</option>
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.first_name} {tenant.last_name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Payment Date <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="date"
                      name="payment_date"
                      value={formData.payment_date}
                      onChange={handleInputChange}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Amount (SAR) <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Payment Method <span className="text-danger">*</span></Form.Label>
                <Form.Select
                  name="payment_method"
                  value={formData.payment_method}
                  onChange={handlePaymentMethodChange}
                  required
                >
                  <option value="cash">Cash</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                  <option value="post_dated_cheque">Post-Dated Cheque</option>
                </Form.Select>
              </Form.Group>

              {formData.payment_method !== 'cash' && (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label>Bank Name <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      name="bank_name"
                      value={formData.bank_name}
                      onChange={handleInputChange}
                      placeholder="Bank name"
                      required={formData.payment_method !== 'cash'}
                    />
                  </Form.Group>

                  {(formData.payment_method === 'cheque' || 
                    formData.payment_method === 'post_dated_cheque') && (
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Cheque Number <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="text"
                            name="cheque_number"
                            value={formData.cheque_number}
                            onChange={handleInputChange}
                            placeholder="Cheque number"
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Cheque Date <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="date"
                            name="cheque_date"
                            value={formData.cheque_date}
                            onChange={handleInputChange}
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  )}
                </>
              )}

              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Description"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Notes</Form.Label>
                <Form.Control
                  as="textarea"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Additional notes"
                  rows={3}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <option value="draft">Draft</option>
                  <option value="submitted">Submitted</option>
                  <option value="cleared">Cleared</option>
                  <option value="bounced">Bounced</option>
                  <option value="cancelled">Cancelled</option>
                </Form.Select>
              </Form.Group>

              <div className="d-flex gap-2">
                <Button 
                  type="submit" 
                  variant="success"
                  disabled={loading}
                >
                  {loading ? (
                    <><Spinner animation="border" size="sm" className="me-2" />{ editMode ? 'Updating...' : 'Creating...'}</>
                  ) : (
                    <><i className="fas fa-receipt me-2"></i>{editMode ? 'Update' : 'Create'} Receipt Voucher</>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="secondary"
                  onClick={() => {
                    setShowForm(false);
                    setEditMode(false);
                    setEditId(null);
                  }}
                >
                  <i className="fas fa-times me-2"></i>Cancel
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      )}

      <div className="mb-3">
        <Form.Label>Filter by Status:</Form.Label>
        <Form.Select
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{width: '200px'}}
        >
          <option value="all">All</option>
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
          <option value="cleared">Cleared</option>
          <option value="bounced">Bounced</option>
          <option value="cancelled">Cancelled</option>
        </Form.Select>
      </div>

      <div>
        <Card>
          <Card.Body>
            <Table responsive hover>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Receipt #</th>
                  <th>Tenant</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReceipts.length > 0 ? (
                  filteredReceipts.map((receipt) => (
                    <tr key={receipt.id}>
                      <td>{receipt.id}</td>
                      <td>
                        <strong>{receipt.receipt_number}</strong>
                      </td>
                      <td>
                        {receipt.tenant_details?.first_name} {receipt.tenant_details?.last_name}
                      </td>
                      <td>SAR {parseFloat(receipt.amount).toFixed(2)}</td>
                      <td>{receipt.payment_date}</td>
                      <td>{getPaymentMethodLabel(receipt.payment_method)}</td>
                      <td>
                        <Badge bg={getStatusBadgeClass(receipt.status)}>
                          {receipt.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="actions-cell">
                        <Button 
                          size="sm"
                          variant="info"
                          onClick={() => navigate(`/receipt-vouchers/${receipt.id}`)}
                          className="me-2"
                          title="View receipt details"
                        >
                          <i className="fas fa-eye"></i>
                        </Button>
                        <Button 
                          size="sm"
                          variant="warning"
                          onClick={() => handleEdit(receipt)}
                          className="me-2"
                          title="Edit receipt"
                        >
                          <i className="fas fa-edit"></i>
                        </Button>
                        {receipt.payment_method !== 'cash' && receipt.status === 'submitted' && (
                          <Button 
                            size="sm"
                            variant="success"
                            onClick={() => markAsCleared(receipt.id)}
                            className="me-2"
                            title="Mark as cleared"
                          >
                            <i className="fas fa-check"></i>
                          </Button>
                        )}
                        {(receipt.payment_method === 'cheque' || 
                          receipt.payment_method === 'post_dated_cheque') && 
                          receipt.status === 'submitted' && (
                          <Button 
                            size="sm"
                            variant="danger"
                            onClick={() => markAsBounced(receipt.id)}
                          >
                            Mark Bounced
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center text-muted">
                      No receipt vouchers found
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
};

export default ReceiptVoucher;
