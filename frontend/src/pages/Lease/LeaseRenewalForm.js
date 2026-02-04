import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../../services/api';
import FormModal from '../../components/FormModal';

function LeaseRenewalForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [leases, setLeases] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    original_lease: '',
    original_start_date: '',
    original_end_date: '',
    original_monthly_rent: '',
    new_start_date: '',
    new_end_date: '',
    new_monthly_rent: '',
    billing_cycle: 'monthly',
    special_terms: '',
    notes: ''
  });

  useEffect(() => {
    fetchLeases();
    if (id) {
      fetchRenewal();
    }
  }, [id]);

  const fetchLeases = async () => {
    try {
      const response = await apiClient.get('/property/leases/');
      const data = Array.isArray(response.data) ? response.data : (response.data.results || []);
      setLeases(data.filter(lease => lease.status === 'active'));
    } catch (err) {
      console.error('Error fetching leases:', err);
    }
  };

  const fetchRenewal = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/property/lease-renewals/${id}/`);
      setFormData(response.data);
    } catch (err) {
      setError('Error fetching renewal details');
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
        await apiClient.put(`/property/lease-renewals/${id}/`, formData);
        setSuccessMessage('Lease renewal updated successfully!');
      } else {
        await apiClient.post('/property/lease-renewals/', formData);
        setSuccessMessage('Lease renewal created successfully!');
      }
      
      setModalLoading(false);
      setTimeout(() => {
        setShowModal(false);
        navigate('/lease-renewal');
      }, 1500);
    } catch (err) {
      setShowModal(false);
      setError(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Error saving lease renewal');
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
            <i className="fas fa-redo me-2"></i>
            {id ? 'Edit' : 'Create'} Lease Renewal
          </h3>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Original Lease <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="original_lease"
                    value={formData.original_lease}
                    onChange={handleChange}
                    required
                    disabled={!!id}
                  >
                    <option value="">Select Lease</option>
                    {leases.map(lease => (
                      <option key={lease.id} value={lease.id}>
                        {lease.lease_number} - {lease.tenant_name} ({lease.unit_number})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Billing Cycle <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="billing_cycle"
                    value={formData.billing_cycle}
                    onChange={handleChange}
                    required
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="semi_annual">Semi-Annual</option>
                    <option value="annual">Annual</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Original Start Date <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="date"
                    name="original_start_date"
                    value={formData.original_start_date}
                    onChange={handleChange}
                    required
                    disabled={!!id}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Original End Date <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="date"
                    name="original_end_date"
                    value={formData.original_end_date}
                    onChange={handleChange}
                    required
                    disabled={!!id}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Original Monthly Rent <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="original_monthly_rent"
                    value={formData.original_monthly_rent}
                    onChange={handleChange}
                    required
                    disabled={!!id}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>New Start Date <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="date"
                    name="new_start_date"
                    value={formData.new_start_date}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>New End Date <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="date"
                    name="new_end_date"
                    value={formData.new_end_date}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>New Monthly Rent <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="new_monthly_rent"
                    value={formData.new_monthly_rent}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Special Terms</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="special_terms"
                    value={formData.special_terms}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex gap-2">
              <Button variant="primary" type="submit" disabled={loading}>
                <i className="fas fa-save me-2"></i>
                {loading ? 'Saving...' : (id ? 'Update' : 'Create')} Renewal
              </Button>
              <Button variant="secondary" onClick={() => navigate('/lease-renewal')}>
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
          navigate('/lease-renewal');
        }}
      />
    </Container>
  );
}

export default LeaseRenewalForm;
