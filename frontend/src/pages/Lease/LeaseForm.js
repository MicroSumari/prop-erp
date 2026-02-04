import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Alert, Spinner, Card, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { leaseService } from '../../services/propertyService';
import apiClient from '../../services/api';
import './LeaseForm.css';

function LeaseForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [units, setUnits] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  
  const [leaseData, setLeaseData] = useState({
    lease_number: '',
    unit: '',
    tenant: '',
    start_date: '',
    end_date: '',
    monthly_rent: '',
    security_deposit: '',
    other_charges: '',
    status: 'draft',
    terms_conditions: '',
    unearned_revenue_account: '',
    refundable_deposit_account: '',
    other_charges_account: '',
  });

  useEffect(() => {
    fetchUnitsAndTenants();
  }, []);

  const fetchUnitsAndTenants = async () => {
    try {
      const [unitsResponse, tenantsResponse, leasesResponse, accountsResponse] = await Promise.all([
        apiClient.get('/property/units/'),
        apiClient.get('/property/related-parties/'),
        apiClient.get('/property/leases/'),
        apiClient.get('/accounts/accounts/')
      ]);
      
      const allUnits = unitsResponse.data.results || unitsResponse.data;
      const leases = leasesResponse.data.results || leasesResponse.data;
      const allAccounts = accountsResponse.data.results || accountsResponse.data;
      
      console.log('All units:', allUnits);
      console.log('All leases:', leases);
      console.log('All accounts:', allAccounts);
      
      // Filter out units that have active leases (case insensitive)
      const occupiedUnitIds = leases
        .filter(lease => lease.status && lease.status.toLowerCase() === 'active')
        .map(lease => lease.unit);
      
      console.log('Occupied unit IDs:', occupiedUnitIds);
      
      const availableUnits = allUnits.filter(unit => !occupiedUnitIds.includes(unit.id));
      
      console.log('Available units:', availableUnits);
      
      setUnits(availableUnits);
      setTenants(tenantsResponse.data.results || tenantsResponse.data);
      setAccounts(allAccounts);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load units, tenants, and accounts');
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLeaseData(prev => ({
      ...prev,
      [name]: value
    }));
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFieldErrors({});
    setLoading(true);

    try {
      if (!leaseData.lease_number || !leaseData.unit || !leaseData.start_date || !leaseData.end_date || !leaseData.monthly_rent || !leaseData.security_deposit) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      if (!leaseData.unearned_revenue_account || !leaseData.refundable_deposit_account) {
        setError('Please select Unearned Revenue and Refundable Deposit accounts');
        setLoading(false);
        return;
      }

      await leaseService.create(leaseData);
      setSuccess('Lease created successfully!');
      setTimeout(() => navigate('/leases'), 2000);
    } catch (err) {
      const errorData = err.response?.data;
      
      if (errorData && typeof errorData === 'object') {
        const errors = {};
        let generalError = '';
        
        Object.keys(errorData).forEach(key => {
          if (Array.isArray(errorData[key])) {
            errors[key] = errorData[key][0];
          } else if (typeof errorData[key] === 'string') {
            errors[key] = errorData[key];
          } else {
            generalError = errorData[key]?.message || 'An error occurred';
          }
        });
        
        if (Object.keys(errors).length > 0) {
          setFieldErrors(errors);
        }
        if (generalError) {
          setError(generalError);
        } else if (Object.keys(errors).length === 0) {
          setError(errorData.detail || 'Failed to create lease');
        }
      } else {
        setError(err.response?.data?.detail || err.message || 'Failed to create lease');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="lease-form-container mt-5">
      <Card className="lease-form-card">
        <Card.Header className="bg-primary text-white">
          <h2 className="mb-0">
            <i className="fas fa-file-contract me-2"></i>
            Create New Lease
          </h2>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <Form onSubmit={handleSubmit}>
            <h4 className="mb-4">Lease Information</h4>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Lease Number <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="lease_number"
                    value={leaseData.lease_number}
                    onChange={handleChange}
                    placeholder="e.g., LEASE-001"
                    required
                    isInvalid={!!fieldErrors.lease_number}
                  />
                  {fieldErrors.lease_number && (
                    <Form.Control.Feedback type="invalid">
                      {fieldErrors.lease_number}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Unit <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="unit"
                    value={leaseData.unit}
                    onChange={handleChange}
                    required
                    isInvalid={!!fieldErrors.unit}
                    disabled={loadingData}
                  >
                    <option value="">Select Unit</option>
                    {units.map(unit => (
                      <option key={unit.id} value={unit.id}>
                        {unit.unit_number} - {unit.property_name || `Property ${unit.property}`} ({unit.status})
                      </option>
                    ))}
                  </Form.Select>
                  {fieldErrors.unit && (
                    <Form.Control.Feedback type="invalid">
                      {fieldErrors.unit}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Tenant</Form.Label>
                  <Form.Select
                    name="tenant"
                    value={leaseData.tenant}
                    onChange={handleChange}
                    isInvalid={!!fieldErrors.tenant}
                    disabled={loadingData}
                  >
                    <option value="">Select Tenant (Optional)</option>
                    {tenants.map(tenant => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.name || `${tenant.first_name} ${tenant.last_name}`}
                      </option>
                    ))}
                  </Form.Select>
                  {fieldErrors.tenant && (
                    <Form.Control.Feedback type="invalid">
                      {fieldErrors.tenant}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
              </Col>
            </Row>

            <h4 className="mt-4 mb-4">Lease Dates</h4>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Start Date <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="date"
                    name="start_date"
                    value={leaseData.start_date}
                    onChange={handleChange}
                    required
                    isInvalid={!!fieldErrors.start_date}
                  />
                  {fieldErrors.start_date && (
                    <Form.Control.Feedback type="invalid">
                      {fieldErrors.start_date}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>End Date <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="date"
                    name="end_date"
                    value={leaseData.end_date}
                    onChange={handleChange}
                    required
                    isInvalid={!!fieldErrors.end_date}
                  />
                  {fieldErrors.end_date && (
                    <Form.Control.Feedback type="invalid">
                      {fieldErrors.end_date}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
              </Col>
            </Row>

            <h4 className="mt-4 mb-4">Financial Details</h4>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Monthly Rent (SAR) <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="monthly_rent"
                    value={leaseData.monthly_rent}
                    onChange={handleChange}
                    placeholder="0.00"
                    required
                    isInvalid={!!fieldErrors.monthly_rent}
                  />
                  {fieldErrors.monthly_rent && (
                    <Form.Control.Feedback type="invalid">
                      {fieldErrors.monthly_rent}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Security Deposit (SAR) <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="security_deposit"
                    value={leaseData.security_deposit}
                    onChange={handleChange}
                    placeholder="0.00"
                    required
                    isInvalid={!!fieldErrors.security_deposit}
                  />
                  {fieldErrors.security_deposit && (
                    <Form.Control.Feedback type="invalid">
                      {fieldErrors.security_deposit}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Other Charges (SAR) <span className="text-muted">(Optional)</span></Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="other_charges"
                    value={leaseData.other_charges}
                    onChange={handleChange}
                    placeholder="0.00"
                    isInvalid={!!fieldErrors.other_charges}
                  />
                  {fieldErrors.other_charges && (
                    <Form.Control.Feedback type="invalid">
                      {fieldErrors.other_charges}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
              </Col>
            </Row>

            <h4 className="mt-4 mb-4">Accounting Configuration</h4>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Unearned Revenue Account <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="unearned_revenue_account"
                    value={leaseData.unearned_revenue_account}
                    onChange={handleChange}
                    required
                    isInvalid={!!fieldErrors.unearned_revenue_account}
                    disabled={loadingData}
                  >
                    <option value="">Select Account</option>
                    {accounts.filter(acc => acc.account_type === 'liability').map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.account_number} - {acc.account_name}
                      </option>
                    ))}
                  </Form.Select>
                  {fieldErrors.unearned_revenue_account && (
                    <Form.Control.Feedback type="invalid">
                      {fieldErrors.unearned_revenue_account}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Refundable Deposit Account <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="refundable_deposit_account"
                    value={leaseData.refundable_deposit_account}
                    onChange={handleChange}
                    required
                    isInvalid={!!fieldErrors.refundable_deposit_account}
                    disabled={loadingData}
                  >
                    <option value="">Select Account</option>
                    {accounts.filter(acc => acc.account_type === 'liability').map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.account_number} - {acc.account_name}
                      </option>
                    ))}
                  </Form.Select>
                  {fieldErrors.refundable_deposit_account && (
                    <Form.Control.Feedback type="invalid">
                      {fieldErrors.refundable_deposit_account}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Other Charges Account <span className="text-muted">(Optional)</span></Form.Label>
                  <Form.Select
                    name="other_charges_account"
                    value={leaseData.other_charges_account}
                    onChange={handleChange}
                    isInvalid={!!fieldErrors.other_charges_account}
                    disabled={loadingData}
                  >
                    <option value="">Select Account (Optional)</option>
                    {accounts.filter(acc => acc.account_type === 'income').map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.account_number} - {acc.account_name}
                      </option>
                    ))}
                  </Form.Select>
                  {fieldErrors.other_charges_account && (
                    <Form.Control.Feedback type="invalid">
                      {fieldErrors.other_charges_account}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
              </Col>
            </Row>

            <h4 className="mt-4 mb-4">Status</h4>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Lease Status <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="status"
                    value={leaseData.status}
                    onChange={handleChange}
                    isInvalid={!!fieldErrors.status}
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="terminated">Terminated</option>
                  </Form.Select>
                  {fieldErrors.status && (
                    <Form.Control.Feedback type="invalid">
                      {fieldErrors.status}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
              </Col>
            </Row>

            <h4 className="mt-4 mb-4">Terms & Conditions</h4>

            <Form.Group className="mb-3">
              <Form.Label>Terms & Conditions</Form.Label>
              <Form.Control
                as="textarea"
                name="terms_conditions"
                value={leaseData.terms_conditions}
                onChange={handleChange}
                placeholder="Enter lease terms and conditions"
                rows={4}
                isInvalid={!!fieldErrors.terms_conditions}
              />
              {fieldErrors.terms_conditions && (
                <Form.Control.Feedback type="invalid">
                  {fieldErrors.terms_conditions}
                </Form.Control.Feedback>
              )}
            </Form.Group>

            <div className="d-flex gap-2 mt-4">
              <Button
                variant="primary"
                type="submit"
                disabled={loading}
                className="btn-lg"
              >
                {loading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" className="me-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save me-2"></i>
                    Create Lease
                  </>
                )}
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate('/leases')}
                className="btn-lg"
                disabled={loading}
              >
                <i className="fas fa-times me-2"></i>
                Cancel
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default LeaseForm;
