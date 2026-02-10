import React, { useEffect, useState } from 'react';
import { Tabs, Tab, Card, Table, Button, Modal, Form, Row, Col, Alert, Container } from 'react-bootstrap';
import apiClient from '../../services/api';

const SystemConfig = () => {
  const [accounts, setAccounts] = useState([]);
  const [costCenters, setCostCenters] = useState([]);
  const [txMappings, setTxMappings] = useState([]);
  const [propertyClasses, setPropertyClasses] = useState([]);
  const [receiptPaymentMappings, setReceiptPaymentMappings] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showTxForm, setShowTxForm] = useState(false);
  const [showPropForm, setShowPropForm] = useState(false);
  const [showRpForm, setShowRpForm] = useState(false);

  const [txEditingId, setTxEditingId] = useState(null);
  const [propEditingId, setPropEditingId] = useState(null);
  const [rpEditingId, setRpEditingId] = useState(null);

  const txInitial = {
    transaction_type: 'lease_creation',
    debit_account: '',
    credit_account: '',
    cost_center: '',
    tax_account: '',
    bank_account: '',
    is_active: true,
  };

  const propInitial = {
    name: '',
    default_revenue_account: '',
    default_expense_account: '',
    default_cost_center: '',
    is_active: true,
  };

  const rpInitial = {
    name: '',
    mapping_type: 'receipt',
    debit_account: '',
    credit_account: '',
    tax_account: '',
    bank_account: '',
    is_taxable: false,
    is_active: true,
  };

  const [txForm, setTxForm] = useState(txInitial);
  const [propForm, setPropForm] = useState(propInitial);
  const [rpForm, setRpForm] = useState(rpInitial);

  const normalizeList = (data) => (Array.isArray(data) ? data : (data?.results || []));

  const fetchData = async () => {
    try {
      const [accRes, ccRes, txRes, propRes, rpRes] = await Promise.all([
        apiClient.get('/accounts/accounts/'),
        apiClient.get('/accounts/cost-centers/'),
        apiClient.get('/accounts/transaction-mappings/'),
        apiClient.get('/accounts/property-classifications/'),
        apiClient.get('/accounts/receipt-payment-mappings/'),
      ]);
      setAccounts(normalizeList(accRes.data));
      setCostCenters(normalizeList(ccRes.data));
      setTxMappings(normalizeList(txRes.data));
      setPropertyClasses(normalizeList(propRes.data));
      setReceiptPaymentMappings(normalizeList(rpRes.data));
    } catch (err) {
      setError('Failed to load system configuration');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resolveAccount = (id) => {
    const acc = accounts.find((a) => a.id === id);
    return acc ? `${acc.account_number} - ${acc.account_name}` : 'N/A';
  };

  const resolveCostCenter = (id) => {
    const cc = costCenters.find((c) => c.id === id);
    return cc ? `${cc.code} - ${cc.name}` : 'N/A';
  };

  const handleTxSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      if (txEditingId) {
        await apiClient.put(`/accounts/transaction-mappings/${txEditingId}/`, txForm);
        setSuccess('Transaction mapping updated');
      } else {
        await apiClient.post('/accounts/transaction-mappings/', txForm);
        setSuccess('Transaction mapping created');
      }
      setShowTxForm(false);
      setTxEditingId(null);
      setTxForm(txInitial);
      fetchData();
    } catch (err) {
      setError('Failed to save transaction mapping');
    }
  };

  const openTxEdit = (item) => {
    setTxEditingId(item.id);
    setTxForm({
      transaction_type: item.transaction_type,
      debit_account: item.debit_account,
      credit_account: item.credit_account,
      cost_center: item.cost_center || '',
      tax_account: item.tax_account || '',
      bank_account: item.bank_account || '',
      is_active: item.is_active,
    });
    setShowTxForm(true);
  };

  const handlePropSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      if (propEditingId) {
        await apiClient.put(`/accounts/property-classifications/${propEditingId}/`, propForm);
        setSuccess('Property classification updated');
      } else {
        await apiClient.post('/accounts/property-classifications/', propForm);
        setSuccess('Property classification created');
      }
      setShowPropForm(false);
      setPropEditingId(null);
      setPropForm(propInitial);
      fetchData();
    } catch (err) {
      setError('Failed to save property classification');
    }
  };

  const openPropEdit = (item) => {
    setPropEditingId(item.id);
    setPropForm({
      name: item.name,
      default_revenue_account: item.default_revenue_account,
      default_expense_account: item.default_expense_account,
      default_cost_center: item.default_cost_center || '',
      is_active: item.is_active,
    });
    setShowPropForm(true);
  };

  const handleRpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      if (rpEditingId) {
        await apiClient.put(`/accounts/receipt-payment-mappings/${rpEditingId}/`, rpForm);
        setSuccess('Receipt/payment mapping updated');
      } else {
        await apiClient.post('/accounts/receipt-payment-mappings/', rpForm);
        setSuccess('Receipt/payment mapping created');
      }
      setShowRpForm(false);
      setRpEditingId(null);
      setRpForm(rpInitial);
      fetchData();
    } catch (err) {
      setError('Failed to save receipt/payment mapping');
    }
  };

  const openRpEdit = (item) => {
    setRpEditingId(item.id);
    setRpForm({
      name: item.name,
      mapping_type: item.mapping_type,
      debit_account: item.debit_account,
      credit_account: item.credit_account,
      tax_account: item.tax_account || '',
      bank_account: item.bank_account || '',
      is_taxable: item.is_taxable,
      is_active: item.is_active,
    });
    setShowRpForm(true);
  };

  return (
    <Container fluid>
      <div className="page-header mb-4">
        <h1>
          <i className="fas fa-sliders-h me-2"></i>
          System Configuration
        </h1>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Tabs defaultActiveKey="transactions" className="mb-3">
        <Tab eventKey="transactions" title="Transaction Account Mapping">
          <div className="d-flex justify-content-end mb-3">
            <Button onClick={() => {
              setTxEditingId(null);
              setTxForm(txInitial);
              setShowTxForm(true);
            }}>
              <i className="fas fa-plus me-2"></i> Add Mapping
            </Button>
          </div>
          <Card>
            <Card.Body>
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>Transaction</th>
                    <th>Debit</th>
                    <th>Credit</th>
                    <th>Cost Center</th>
                    <th>Tax</th>
                    <th>Bank</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {txMappings.length > 0 ? (
                    txMappings.map((m) => (
                      <tr key={m.id}>
                        <td>{m.transaction_type}</td>
                        <td>{resolveAccount(m.debit_account)}</td>
                        <td>{resolveAccount(m.credit_account)}</td>
                        <td>{resolveCostCenter(m.cost_center)}</td>
                        <td>{resolveAccount(m.tax_account)}</td>
                        <td>{resolveAccount(m.bank_account)}</td>
                        <td>{m.is_active ? 'Active' : 'Inactive'}</td>
                        <td>
                          <Button
                            variant="warning"
                            size="sm"
                            onClick={() => openTxEdit(m)}
                            title="Edit mapping"
                          >
                            <i className="fas fa-edit"></i>
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center text-muted py-4">
                        No transaction mappings configured yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="properties" title="Property Classifications">
          <div className="d-flex justify-content-end mb-3">
            <Button onClick={() => {
              setPropEditingId(null);
              setPropForm(propInitial);
              setShowPropForm(true);
            }}>
              <i className="fas fa-plus me-2"></i> Add Classification
            </Button>
          </div>
          <Card>
            <Card.Body>
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Revenue Account</th>
                    <th>Expense Account</th>
                    <th>Cost Center</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {propertyClasses.length > 0 ? (
                    propertyClasses.map((c) => (
                      <tr key={c.id}>
                        <td>{c.name}</td>
                        <td>{resolveAccount(c.default_revenue_account)}</td>
                        <td>{resolveAccount(c.default_expense_account)}</td>
                        <td>{resolveCostCenter(c.default_cost_center)}</td>
                        <td>{c.is_active ? 'Active' : 'Inactive'}</td>
                        <td>
                          <Button
                            variant="warning"
                            size="sm"
                            onClick={() => openPropEdit(c)}
                            title="Edit classification"
                          >
                            <i className="fas fa-edit"></i>
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center text-muted py-4">
                        No property classifications configured yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="receipt-payment" title="Receipt & Payment Classifications">
          <div className="d-flex justify-content-end mb-3">
            <Button onClick={() => {
              setRpEditingId(null);
              setRpForm(rpInitial);
              setShowRpForm(true);
            }}>
              <i className="fas fa-plus me-2"></i> Add Mapping
            </Button>
          </div>
          <Card>
            <Card.Body>
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Debit</th>
                    <th>Credit</th>
                    <th>Tax</th>
                    <th>Bank</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {receiptPaymentMappings.length > 0 ? (
                    receiptPaymentMappings.map((m) => (
                      <tr key={m.id}>
                        <td>{m.name}</td>
                        <td>{m.mapping_type}</td>
                        <td>{resolveAccount(m.debit_account)}</td>
                        <td>{resolveAccount(m.credit_account)}</td>
                        <td>{resolveAccount(m.tax_account)}</td>
                        <td>{resolveAccount(m.bank_account)}</td>
                        <td>{m.is_active ? 'Active' : 'Inactive'}</td>
                        <td>
                          <Button
                            variant="warning"
                            size="sm"
                            onClick={() => openRpEdit(m)}
                            title="Edit mapping"
                          >
                            <i className="fas fa-edit"></i>
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center text-muted py-4">
                        No receipt/payment mappings configured yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      <Modal show={showTxForm} onHide={() => setShowTxForm(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{txEditingId ? 'Edit' : 'Add'} Transaction Mapping</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleTxSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Transaction Type</Form.Label>
              <Form.Select
                value={txForm.transaction_type}
                onChange={(e) => setTxForm({ ...txForm, transaction_type: e.target.value })}
                required
              >
                <option value="lease_creation">Lease Creation</option>
                <option value="receipt_voucher">Receipt Voucher</option>
                <option value="customer_invoice">Customer Invoice</option>
                <option value="supplier_invoice">Supplier Invoice</option>
                <option value="payment_voucher">Payment Voucher</option>
                <option value="revenue_recognition">Revenue Recognition</option>
                <option value="maintenance_request">Maintenance Request</option>
              </Form.Select>
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Debit Account</Form.Label>
                  <Form.Select
                    value={txForm.debit_account}
                    onChange={(e) => setTxForm({ ...txForm, debit_account: e.target.value })}
                    required
                  >
                    <option value="">Select account</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.account_number} - {a.account_name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Credit Account</Form.Label>
                  <Form.Select
                    value={txForm.credit_account}
                    onChange={(e) => setTxForm({ ...txForm, credit_account: e.target.value })}
                    required
                  >
                    <option value="">Select account</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.account_number} - {a.account_name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Cost Center</Form.Label>
                  <Form.Select
                    value={txForm.cost_center}
                    onChange={(e) => setTxForm({ ...txForm, cost_center: e.target.value })}
                  >
                    <option value="">Select cost center</option>
                    {costCenters.map((c) => (
                      <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tax Account</Form.Label>
                  <Form.Select
                    value={txForm.tax_account}
                    onChange={(e) => setTxForm({ ...txForm, tax_account: e.target.value })}
                  >
                    <option value="">Select account</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.account_number} - {a.account_name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Bank/Cash Account</Form.Label>
              <Form.Select
                value={txForm.bank_account}
                onChange={(e) => setTxForm({ ...txForm, bank_account: e.target.value })}
              >
                <option value="">Select account</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.account_number} - {a.account_name}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Check
              className="mb-3"
              type="checkbox"
              label="Active"
              checked={txForm.is_active}
              onChange={(e) => setTxForm({ ...txForm, is_active: e.target.checked })}
            />
            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => setShowTxForm(false)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      <Modal show={showPropForm} onHide={() => setShowPropForm(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{propEditingId ? 'Edit' : 'Add'} Property Classification</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handlePropSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                value={propForm.name}
                onChange={(e) => setPropForm({ ...propForm, name: e.target.value })}
                required
              />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Default Revenue Account</Form.Label>
                  <Form.Select
                    value={propForm.default_revenue_account}
                    onChange={(e) => setPropForm({ ...propForm, default_revenue_account: e.target.value })}
                    required
                  >
                    <option value="">Select account</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.account_number} - {a.account_name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Default Expense Account</Form.Label>
                  <Form.Select
                    value={propForm.default_expense_account}
                    onChange={(e) => setPropForm({ ...propForm, default_expense_account: e.target.value })}
                    required
                  >
                    <option value="">Select account</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.account_number} - {a.account_name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Default Cost Center</Form.Label>
              <Form.Select
                value={propForm.default_cost_center}
                onChange={(e) => setPropForm({ ...propForm, default_cost_center: e.target.value })}
              >
                <option value="">Select cost center</option>
                {costCenters.map((c) => (
                  <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Check
              className="mb-3"
              type="checkbox"
              label="Active"
              checked={propForm.is_active}
              onChange={(e) => setPropForm({ ...propForm, is_active: e.target.checked })}
            />
            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => setShowPropForm(false)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      <Modal show={showRpForm} onHide={() => setShowRpForm(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{rpEditingId ? 'Edit' : 'Add'} Receipt/Payment Mapping</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleRpSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    value={rpForm.name}
                    onChange={(e) => setRpForm({ ...rpForm, name: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Type</Form.Label>
                  <Form.Select
                    value={rpForm.mapping_type}
                    onChange={(e) => setRpForm({ ...rpForm, mapping_type: e.target.value })}
                  >
                    <option value="receipt">Receipt</option>
                    <option value="payment">Payment</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Debit Account</Form.Label>
                  <Form.Select
                    value={rpForm.debit_account}
                    onChange={(e) => setRpForm({ ...rpForm, debit_account: e.target.value })}
                    required
                  >
                    <option value="">Select account</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.account_number} - {a.account_name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Credit Account</Form.Label>
                  <Form.Select
                    value={rpForm.credit_account}
                    onChange={(e) => setRpForm({ ...rpForm, credit_account: e.target.value })}
                    required
                  >
                    <option value="">Select account</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.account_number} - {a.account_name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tax Account</Form.Label>
                  <Form.Select
                    value={rpForm.tax_account}
                    onChange={(e) => setRpForm({ ...rpForm, tax_account: e.target.value })}
                  >
                    <option value="">Select account</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.account_number} - {a.account_name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Bank/Cash Account</Form.Label>
                  <Form.Select
                    value={rpForm.bank_account}
                    onChange={(e) => setRpForm({ ...rpForm, bank_account: e.target.value })}
                  >
                    <option value="">Select account</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.account_number} - {a.account_name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Form.Check
              className="mb-3"
              type="checkbox"
              label="Taxable"
              checked={rpForm.is_taxable}
              onChange={(e) => setRpForm({ ...rpForm, is_taxable: e.target.checked })}
            />
            <Form.Check
              className="mb-3"
              type="checkbox"
              label="Active"
              checked={rpForm.is_active}
              onChange={(e) => setRpForm({ ...rpForm, is_active: e.target.checked })}
            />
            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => setShowRpForm(false)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default SystemConfig;
