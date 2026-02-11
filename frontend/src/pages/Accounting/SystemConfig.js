import React, { useEffect, useState } from 'react';
import { Tabs, Tab, Card, Table, Button, Modal, Form, Row, Col, Alert, Container, Spinner } from 'react-bootstrap';
import apiClient from '../../services/api';
import './SystemConfig.css'; // Create this CSS file

const SystemConfig = () => {
  const [accounts, setAccounts] = useState([]);
  const [costCenters, setCostCenters] = useState([]);
  const [txMappings, setTxMappings] = useState([]);
  const [propertyClasses, setPropertyClasses] = useState([]);
  const [receiptPaymentMappings, setReceiptPaymentMappings] = useState([]);
  const [error, setError] = useState('');
  
  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState('success');

  const [showTxForm, setShowTxForm] = useState(false);
  const [showPropForm, setShowPropForm] = useState(false);
  const [showRpForm, setShowRpForm] = useState(false);

  const [txEditingId, setTxEditingId] = useState(null);
  const [propEditingId, setPropEditingId] = useState(null);
  const [rpEditingId, setRpEditingId] = useState(null);
  
  const [loading, setLoading] = useState(false);

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

  // Toast functions
  const showSuccessToast = (message) => {
    setToastMessage(message);
    setToastVariant('success');
    setShowToast(true);
    
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  const showErrorToast = (message) => {
    setToastMessage(message);
    setToastVariant('danger');
    setShowToast(true);
    
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  const handleToastClose = () => {
    setShowToast(false);
  };

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
    setLoading(true);
    try {
      if (txEditingId) {
        await apiClient.put(`/accounts/transaction-mappings/${txEditingId}/`, txForm);
        showSuccessToast('Transaction mapping updated successfully!');
      } else {
        await apiClient.post('/accounts/transaction-mappings/', txForm);
        showSuccessToast('Transaction mapping created successfully!');
      }
      setShowTxForm(false);
      setTxEditingId(null);
      setTxForm(txInitial);
      fetchData();
    } catch (err) {
      const errorMsg = 'Failed to save transaction mapping';
      setError(errorMsg);
      showErrorToast(errorMsg);
    } finally {
      setLoading(false);
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
    setLoading(true);
    try {
      if (propEditingId) {
        await apiClient.put(`/accounts/property-classifications/${propEditingId}/`, propForm);
        showSuccessToast('Property classification updated successfully!');
      } else {
        await apiClient.post('/accounts/property-classifications/', propForm);
        showSuccessToast('Property classification created successfully!');
      }
      setShowPropForm(false);
      setPropEditingId(null);
      setPropForm(propInitial);
      fetchData();
    } catch (err) {
      const errorMsg = 'Failed to save property classification';
      setError(errorMsg);
      showErrorToast(errorMsg);
    } finally {
      setLoading(false);
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
    setLoading(true);
    try {
      if (rpEditingId) {
        await apiClient.put(`/accounts/receipt-payment-mappings/${rpEditingId}/`, rpForm);
        showSuccessToast('Receipt/payment mapping updated successfully!');
      } else {
        await apiClient.post('/accounts/receipt-payment-mappings/', rpForm);
        showSuccessToast('Receipt/payment mapping created successfully!');
      }
      setShowRpForm(false);
      setRpEditingId(null);
      setRpForm(rpInitial);
      fetchData();
    } catch (err) {
      const errorMsg = 'Failed to save receipt/payment mapping';
      setError(errorMsg);
      showErrorToast(errorMsg);
    } finally {
      setLoading(false);
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
      {/* Advanced Animated Toast */}
      <div className={`custom-toast ${showToast ? 'show' : ''} ${toastVariant}`}>
        <div className="toast-content">
          <div className="toast-icon">
            {toastVariant === 'success' ? (
              <i className="fas fa-check-circle"></i>
            ) : (
              <i className="fas fa-exclamation-circle"></i>
            )}
          </div>
          <div className="toast-message">
            <div className="toast-title">
              {toastVariant === 'success' ? 'Success' : 'Error'}
            </div>
            <div className="toast-text">{toastMessage}</div>
          </div>
          <button className="toast-close" onClick={handleToastClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="toast-progress"></div>
      </div>

      <div className="page-header mb-4">
        <h1>
          <i className="fas fa-sliders-h me-2"></i>
          System Configuration
        </h1>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

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

      {/* Transaction Mapping Modal - Improved UI */}
      <Modal 
        show={showTxForm} 
        onHide={() => setShowTxForm(false)} 
        size="lg" 
        centered 
        backdrop="static"
      >
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <i className={`fas ${txEditingId ? 'fa-edit' : 'fa-plus-circle'} me-2`}></i>
            {txEditingId ? 'Edit' : 'Add'} Transaction Mapping
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Form onSubmit={handleTxSubmit}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Transaction Type</Form.Label>
              <Form.Select
                value={txForm.transaction_type}
                onChange={(e) => setTxForm({ ...txForm, transaction_type: e.target.value })}
                required
                className="border-2"
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

            <Card className="bg-light mb-3">
              <Card.Header className="bg-secondary text-white">
                <i className="fas fa-exchange-alt me-2"></i>
                Account Mapping
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">Debit Account</Form.Label>
                      <Form.Select
                        value={txForm.debit_account}
                        onChange={(e) => setTxForm({ ...txForm, debit_account: e.target.value })}
                        required
                        className="border-2"
                      >
                        <option value="">-- Select Account --</option>
                        {accounts.map((a) => (
                          <option key={a.id} value={a.id}>{a.account_number} - {a.account_name}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">Credit Account</Form.Label>
                      <Form.Select
                        value={txForm.credit_account}
                        onChange={(e) => setTxForm({ ...txForm, credit_account: e.target.value })}
                        required
                        className="border-2"
                      >
                        <option value="">-- Select Account --</option>
                        {accounts.map((a) => (
                          <option key={a.id} value={a.id}>{a.account_number} - {a.account_name}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <Card className="bg-light mb-3">
              <Card.Header className="bg-secondary text-white">
                <i className="fas fa-cog me-2"></i>
                Additional Configuration
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">Cost Center</Form.Label>
                      <Form.Select
                        value={txForm.cost_center}
                        onChange={(e) => setTxForm({ ...txForm, cost_center: e.target.value })}
                        className="border-2"
                      >
                        <option value="">-- Select Cost Center --</option>
                        {costCenters.map((c) => (
                          <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">Tax Account</Form.Label>
                      <Form.Select
                        value={txForm.tax_account}
                        onChange={(e) => setTxForm({ ...txForm, tax_account: e.target.value })}
                        className="border-2"
                      >
                        <option value="">-- Select Account --</option>
                        {accounts.map((a) => (
                          <option key={a.id} value={a.id}>{a.account_number} - {a.account_name}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Bank/Cash Account</Form.Label>
                  <Form.Select
                    value={txForm.bank_account}
                    onChange={(e) => setTxForm({ ...txForm, bank_account: e.target.value })}
                    className="border-2"
                  >
                    <option value="">-- Select Account --</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.account_number} - {a.account_name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Card.Body>
            </Card>

            <Form.Check
              className="mb-3"
              type="checkbox"
              id="tx-active"
              label={<span className="fw-bold">Active</span>}
              checked={txForm.is_active}
              onChange={(e) => setTxForm({ ...txForm, is_active: e.target.checked })}
            />

            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button 
                variant="secondary" 
                onClick={() => setShowTxForm(false)}
                size="lg"
                disabled={loading}
              >
                <i className="fas fa-times me-2"></i>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="lg" disabled={loading}>
                {loading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" className="me-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <i className={`fas ${txEditingId ? 'fa-save' : 'fa-plus-circle'} me-2`}></i>
                    {txEditingId ? 'Save Changes' : 'Create Mapping'}
                  </>
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Property Classification Modal - Improved UI */}
      <Modal 
        show={showPropForm} 
        onHide={() => setShowPropForm(false)} 
        size="lg" 
        centered 
        backdrop="static"
      >
        <Modal.Header closeButton className="bg-success text-white">
          <Modal.Title>
            <i className={`fas ${propEditingId ? 'fa-edit' : 'fa-plus-circle'} me-2`}></i>
            {propEditingId ? 'Edit' : 'Add'} Property Classification
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Form onSubmit={handlePropSubmit}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Name</Form.Label>
              <Form.Control
                value={propForm.name}
                onChange={(e) => setPropForm({ ...propForm, name: e.target.value })}
                required
                className="border-2"
                placeholder="Enter classification name"
              />
            </Form.Group>

            <Card className="bg-light mb-3">
              <Card.Header className="bg-secondary text-white">
                <i className="fas fa-warehouse me-2"></i>
                Default Accounts
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">Revenue Account</Form.Label>
                      <Form.Select
                        value={propForm.default_revenue_account}
                        onChange={(e) => setPropForm({ ...propForm, default_revenue_account: e.target.value })}
                        required
                        className="border-2"
                      >
                        <option value="">-- Select Account --</option>
                        {accounts.map((a) => (
                          <option key={a.id} value={a.id}>{a.account_number} - {a.account_name}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">Expense Account</Form.Label>
                      <Form.Select
                        value={propForm.default_expense_account}
                        onChange={(e) => setPropForm({ ...propForm, default_expense_account: e.target.value })}
                        required
                        className="border-2"
                      >
                        <option value="">-- Select Account --</option>
                        {accounts.map((a) => (
                          <option key={a.id} value={a.id}>{a.account_number} - {a.account_name}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Default Cost Center</Form.Label>
                  <Form.Select
                    value={propForm.default_cost_center}
                    onChange={(e) => setPropForm({ ...propForm, default_cost_center: e.target.value })}
                    className="border-2"
                  >
                    <option value="">-- Select Cost Center --</option>
                    {costCenters.map((c) => (
                      <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Card.Body>
            </Card>

            <Form.Check
              className="mb-3"
              type="checkbox"
              id="prop-active"
              label={<span className="fw-bold">Active</span>}
              checked={propForm.is_active}
              onChange={(e) => setPropForm({ ...propForm, is_active: e.target.checked })}
            />

            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button 
                variant="secondary" 
                onClick={() => setShowPropForm(false)}
                size="lg"
                disabled={loading}
              >
                <i className="fas fa-times me-2"></i>
                Cancel
              </Button>
              <Button type="submit" variant="success" size="lg" disabled={loading}>
                {loading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" className="me-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <i className={`fas ${propEditingId ? 'fa-save' : 'fa-plus-circle'} me-2`}></i>
                    {propEditingId ? 'Save Changes' : 'Create Classification'}
                  </>
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Receipt/Payment Mapping Modal - Improved UI */}
      <Modal 
        show={showRpForm} 
        onHide={() => setShowRpForm(false)} 
        size="lg" 
        centered 
        backdrop="static"
      >
        <Modal.Header closeButton className="bg-info text-white">
          <Modal.Title>
            <i className={`fas ${rpEditingId ? 'fa-edit' : 'fa-plus-circle'} me-2`}></i>
            {rpEditingId ? 'Edit' : 'Add'} Receipt/Payment Mapping
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Form onSubmit={handleRpSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Name</Form.Label>
                  <Form.Control
                    value={rpForm.name}
                    onChange={(e) => setRpForm({ ...rpForm, name: e.target.value })}
                    required
                    className="border-2"
                    placeholder="Enter mapping name"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Type</Form.Label>
                  <Form.Select
                    value={rpForm.mapping_type}
                    onChange={(e) => setRpForm({ ...rpForm, mapping_type: e.target.value })}
                    className="border-2"
                  >
                    <option value="receipt">Receipt</option>
                    <option value="payment">Payment</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Card className="bg-light mb-3">
              <Card.Header className="bg-secondary text-white">
                <i className="fas fa-exchange-alt me-2"></i>
                Account Mapping
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">Debit Account</Form.Label>
                      <Form.Select
                        value={rpForm.debit_account}
                        onChange={(e) => setRpForm({ ...rpForm, debit_account: e.target.value })}
                        required
                        className="border-2"
                      >
                        <option value="">-- Select Account --</option>
                        {accounts.map((a) => (
                          <option key={a.id} value={a.id}>{a.account_number} - {a.account_name}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">Credit Account</Form.Label>
                      <Form.Select
                        value={rpForm.credit_account}
                        onChange={(e) => setRpForm({ ...rpForm, credit_account: e.target.value })}
                        required
                        className="border-2"
                      >
                        <option value="">-- Select Account --</option>
                        {accounts.map((a) => (
                          <option key={a.id} value={a.id}>{a.account_number} - {a.account_name}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <Card className="bg-light mb-3">
              <Card.Header className="bg-secondary text-white">
                <i className="fas fa-cog me-2"></i>
                Additional Configuration
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">Tax Account</Form.Label>
                      <Form.Select
                        value={rpForm.tax_account}
                        onChange={(e) => setRpForm({ ...rpForm, tax_account: e.target.value })}
                        className="border-2"
                      >
                        <option value="">-- Select Account --</option>
                        {accounts.map((a) => (
                          <option key={a.id} value={a.id}>{a.account_number} - {a.account_name}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">Bank/Cash Account</Form.Label>
                      <Form.Select
                        value={rpForm.bank_account}
                        onChange={(e) => setRpForm({ ...rpForm, bank_account: e.target.value })}
                        className="border-2"
                      >
                        <option value="">-- Select Account --</option>
                        {accounts.map((a) => (
                          <option key={a.id} value={a.id}>{a.account_number} - {a.account_name}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <Row>
              <Col md={6}>
                <Form.Check
                  className="mb-3"
                  type="checkbox"
                  id="rp-taxable"
                  label={<span className="fw-bold">Taxable</span>}
                  checked={rpForm.is_taxable}
                  onChange={(e) => setRpForm({ ...rpForm, is_taxable: e.target.checked })}
                />
              </Col>
              <Col md={6}>
                <Form.Check
                  className="mb-3"
                  type="checkbox"
                  id="rp-active"
                  label={<span className="fw-bold">Active</span>}
                  checked={rpForm.is_active}
                  onChange={(e) => setRpForm({ ...rpForm, is_active: e.target.checked })}
                />
              </Col>
            </Row>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button 
                variant="secondary" 
                onClick={() => setShowRpForm(false)}
                size="lg"
                disabled={loading}
              >
                <i className="fas fa-times me-2"></i>
                Cancel
              </Button>
              <Button type="submit" variant="info" size="lg" className="text-white" disabled={loading}>
                {loading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" className="me-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <i className={`fas ${rpEditingId ? 'fa-save' : 'fa-plus-circle'} me-2`}></i>
                    {rpEditingId ? 'Save Changes' : 'Create Mapping'}
                  </>
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default SystemConfig;