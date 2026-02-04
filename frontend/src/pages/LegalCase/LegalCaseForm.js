import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Card, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/api';

function LegalCaseForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form data
  const [formData, setFormData] = useState({
    tenant: '',
    lease: '',
    case_type: 'eviction',
    case_number: '',
    filing_date: '',
    court_name: '',
    remarks: ''
  });
  
  // Dropdown data
  const [tenants, setTenants] = useState([]);
  const [leases, setLeases] = useState([]);
  const [allLeases, setAllLeases] = useState([]);
  const [properties, setProperties] = useState([]);
  const [units, setUnits] = useState([]);
  
  // Auto-filled data
  const [selectedLease, setSelectedLease] = useState(null);

  const selectedUnitId = selectedLease
    ? (typeof selectedLease.unit === 'object' ? selectedLease.unit.id : selectedLease.unit)
    : null;
  const selectedUnit = selectedUnitId
    ? units.find((unit) => unit.id === selectedUnitId)
    : null;
  const selectedPropertyId = selectedUnit
    ? selectedUnit.property
    : (selectedLease && typeof selectedLease.unit === 'object' ? selectedLease.unit.property : null);
  const selectedProperty = selectedPropertyId
    ? properties.find((property) => property.id === selectedPropertyId)
    : null;
  
  useEffect(() => {
    fetchTenants();
    fetchProperties();
    fetchUnits();
    fetchLeases();
  }, []);
  
  const normalizeList = (data) => {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.results)) return data.results;
    return [];
  };

  const fetchTenants = async () => {
    try {
      const response = await apiClient.get('/property/related-parties/');
      setTenants(normalizeList(response.data));
    } catch (err) {
      console.error('Error fetching tenants:', err);
    }
  };
  
  const fetchLeases = async () => {
    try {
      const response = await apiClient.get('/property/leases/');
      setAllLeases(normalizeList(response.data));
    } catch (err) {
      console.error('Error fetching leases:', err);
    }
  };
  
  const fetchProperties = async () => {
    try {
      const response = await apiClient.get('/property/properties/');
      setProperties(normalizeList(response.data));
    } catch (err) {
      console.error('Error fetching properties:', err);
    }
  };
  
  const fetchUnits = async () => {
    try {
      const response = await apiClient.get('/property/units/');
      setUnits(normalizeList(response.data));
    } catch (err) {
      console.error('Error fetching units:', err);
    }
  };
  
  const handleTenantChange = (e) => {
    const tenantId = e.target.value;
    setFormData({ ...formData, tenant: tenantId, lease: '' });
    setSelectedLease(null);
    
    // Filter leases by tenant
    if (tenantId) {
      const filteredLeases = allLeases.filter(l => l.tenant === parseInt(tenantId));
      setLeases(filteredLeases);
    } else {
      setLeases([]);
    }
  };
  
  const handleLeaseChange = (e) => {
    const leaseId = e.target.value;
    setFormData({ ...formData, lease: leaseId });
    
    // Auto-fill property and unit
    const lease = allLeases.find(l => l.id === parseInt(leaseId));
    setSelectedLease(lease);
  };
  
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Validate required fields
      if (!formData.tenant || !formData.lease || !formData.case_number || !formData.filing_date) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }
      
      // Get property and unit from selected lease
      if (!selectedLease) {
        setError('Please select a valid lease');
        setLoading(false);
        return;
      }

      if (!selectedUnit || !selectedProperty) {
        setError('Unable to resolve property and unit for the selected lease');
        setLoading(false);
        return;
      }
      
      const submitData = {
        ...formData,
        property: selectedUnit.property,
        unit: selectedUnit.id,
        tenant: parseInt(formData.tenant),
        lease: parseInt(formData.lease),
      };
      
      await apiClient.post('/property/legal-cases/', submitData);
      setSuccess('Legal case created successfully! Unit status updated.');
      
      setTimeout(() => {
        navigate('/legal-cases');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error creating legal case');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container className="mt-4">
      <Card>
        <Card.Header>
          <h3>Create Rental Legal Case</h3>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tenant <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="tenant"
                    value={formData.tenant}
                    onChange={handleTenantChange}
                    required
                  >
                    <option value="">Select Tenant</option>
                    {tenants.map(tenant => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.first_name} {tenant.last_name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Lease <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="lease"
                    value={formData.lease}
                    onChange={handleLeaseChange}
                    required
                    disabled={!formData.tenant}
                  >
                    <option value="">Select Lease</option>
                    {leases.map(lease => (
                      <option key={lease.id} value={lease.id}>
                        {lease.lease_number} (Unit: {lease.unit_number})
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Text className="text-muted">
                    Filtered by selected tenant
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Property (Auto-filled)</Form.Label>
                  <Form.Control
                    type="text"
                    value={selectedProperty?.name || ''}
                    disabled
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Unit (Auto-filled)</Form.Label>
                  <Form.Control
                    type="text"
                    value={selectedLease?.unit_number || selectedUnit?.unit_number || ''}
                    disabled
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Case Type <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="case_type"
                    value={formData.case_type}
                    onChange={handleChange}
                    required
                  >
                    <option value="eviction">Eviction</option>
                    <option value="non_payment">Non-Payment</option>
                    <option value="damage">Property Damage</option>
                    <option value="other">Other</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Case Number <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="case_number"
                    value={formData.case_number}
                    onChange={handleChange}
                    placeholder="External case reference"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Filing Date <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="date"
                    name="filing_date"
                    value={formData.filing_date}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Court Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="court_name"
                    value={formData.court_name}
                    onChange={handleChange}
                    placeholder="Name of court"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Remarks</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                placeholder="Additional notes"
              />
            </Form.Group>
            
            <div className="d-flex gap-2">
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Creating...
                  </>
                ) : (
                  'Create Legal Case'
                )}
              </Button>
              <Button variant="secondary" onClick={() => navigate('/legal-cases')}>
                Cancel
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default LegalCaseForm;
