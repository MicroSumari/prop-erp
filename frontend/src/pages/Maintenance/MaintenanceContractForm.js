import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../../services/api';
import FormModal from '../../components/FormModal';

function MaintenanceContractForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [properties, setProperties] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [units, setUnits] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    supplier: '',
    property: '',
    unit: '',
    start_date: '',
    end_date: '',
    total_amount: '',
    prepaid_account: '',
    expense_account: '',
    supplier_account: '',
    status: 'draft'
  });

  useEffect(() => {
    fetchProperties();
    fetchVendors();
    fetchAccounts();
    if (id) {
      fetchContract();
    }
  }, [id]);

  const fetchProperties = async () => {
    try {
      const response = await apiClient.get('/property/properties/');
      const data = Array.isArray(response.data) ? response.data : (response.data.results || []);
      setProperties(data);
    } catch (err) {
      console.error('Error fetching properties:', err);
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await apiClient.get('/property/related-parties/?party_type=vendor');
      const data = Array.isArray(response.data) ? response.data : (response.data.results || []);
      setVendors(data);
    } catch (err) {
      console.error('Error fetching vendors:', err);
    }
  };

  const fetchUnits = async (propertyId) => {
    try {
      const response = await apiClient.get(`/property/units/?property=${propertyId}`);
      const data = Array.isArray(response.data) ? response.data : (response.data.results || []);
      setUnits(data);
    } catch (err) {
      console.error('Error fetching units:', err);
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await apiClient.get('/accounts/accounts/');
      const data = Array.isArray(response.data) ? response.data : (response.data.results || []);
      setAccounts(data);
    } catch (err) {
      console.error('Error fetching accounts:', err);
    }
  };

  const fetchContract = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/maintenance/contracts/${id}/`);
      setFormData(response.data);
      if (response.data.property) {
        fetchUnits(response.data.property);
      }
    } catch (err) {
      setError('Error fetching contract details');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setModalLoading(true);
    setShowModal(true);
    setError('');

    try {
      if (id) {
        await apiClient.put(`/maintenance/contracts/${id}/`, formData);
        setSuccessMessage('Maintenance contract updated successfully!');
      } else {
        await apiClient.post('/maintenance/contracts/', formData);
        setSuccessMessage('Maintenance contract created successfully!');
      }
      
      setModalLoading(false);
      setTimeout(() => {
        setShowModal(false);
        navigate('/maintenance/contracts');
      }, 1500);
    } catch (err) {
      setShowModal(false);
      setError(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Error saving maintenance contract');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'property') {
      fetchUnits(value);
      setFormData(prev => ({ ...prev, unit: '' }));
    }
  };

  if (loading && id) {
    return (
      <Container className="mt-4 text-center">
        <Spinner animation="border" />
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <Card>
        <Card.Header>
          <h3>
            <i className="fas fa-file-contract me-2"></i>
            {id ? 'Edit' : 'Create'} Maintenance Contract
          </h3>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Property <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="property"
                    value={formData.property}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Property</option>
                    {properties.map(property => (
                      <option key={property.id} value={property.id}>
                        {property.name} ({property.property_code})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Supplier <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="supplier"
                    value={formData.supplier}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Supplier</option>
                    {vendors.map(vendor => (
                      <option key={vendor.id} value={vendor.id}>
                        {(vendor.first_name || vendor.last_name) ? `${vendor.first_name || ''} ${vendor.last_name || ''}`.trim() : (vendor.email || `Vendor #${vendor.id}`)}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Unit (Optional)</Form.Label>
                  <Form.Select
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    disabled={!formData.property}
                  >
                    <option value="">Select Unit</option>
                    {units.map(unit => (
                      <option key={unit.id} value={unit.id}>
                        {unit.unit_number}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Start Date <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>End Date <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Total Amount <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="total_amount"
                    value={formData.total_amount}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Prepaid Account <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="prepaid_account"
                    value={formData.prepaid_account}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Account</option>
                    {accounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.account_number} - {account.account_name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Expense Account <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="expense_account"
                    value={formData.expense_account}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Account</option>
                    {accounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.account_number} - {account.account_name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Supplier Account <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="supplier_account"
                    value={formData.supplier_account}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Account</option>
                    {accounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.account_number} - {account.account_name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex gap-2">
              <Button variant="primary" type="submit" disabled={loading}>
                <i className="fas fa-save me-2"></i>
                {loading ? 'Saving...' : (id ? 'Update' : 'Create')} Contract
              </Button>
              <Button variant="secondary" onClick={() => navigate('/maintenance/contracts')}>
                <i className="fas fa-times me-2"></i>
                Cancel
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
      
      <FormModal 
        show={showModal}
        loading={modalLoading}
        message={successMessage}
        onHide={() => {
          setShowModal(false);
          navigate('/maintenance/contracts');
        }}
      />
    </Container>
  );
}

export default MaintenanceContractForm;
