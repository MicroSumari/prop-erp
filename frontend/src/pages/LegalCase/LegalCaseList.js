import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Card, Badge, Spinner, Alert, Modal, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/api';

function LegalCaseList() {
  const navigate = useNavigate();
  const [legalCases, setLegalCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Status change modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [changeReason, setChangeReason] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  

  
  useEffect(() => {
    fetchLegalCases();
  }, []);
  
  const fetchLegalCases = async () => {
    try {
      const response = await apiClient.get('/property/legal-cases/');
      // Handle both paginated (with results) and non-paginated responses
      const data = Array.isArray(response.data) ? response.data : (response.data.results || []);
      setLegalCases(data);
    } catch (err) {
      setError('Error fetching legal cases');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const getCaseTypeBadge = (caseType) => {
    const variants = {
      'eviction': 'danger',
      'non_payment': 'warning',
      'damage': 'info',
      'other': 'secondary'
    };
    return <Badge bg={variants[caseType] || 'secondary'}>{caseType.replace('_', ' ').toUpperCase()}</Badge>;
  };
  
  const getStatusBadge = (status) => {
    const variants = {
      'filed': 'primary',
      'in_progress': 'warning',
      'judgment_passed': 'info',
      'closed_tenant_won': 'success',
      'closed_owner_won': 'danger'
    };
    const label = status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return <Badge bg={variants[status] || 'secondary'}>{label}</Badge>;
  };
  
  const handleStatusChange = (legalCase) => {
    setSelectedCase(legalCase);
    setNewStatus('');
    setChangeReason('');
    setShowStatusModal(true);
  };
  
  const getNextStatuses = (currentStatus) => {
    const transitions = {
      'filed': ['in_progress'],
      'in_progress': ['judgment_passed', 'closed_tenant_won', 'closed_owner_won'],
      'judgment_passed': ['closed_tenant_won', 'closed_owner_won'],
      'closed_tenant_won': [],
      'closed_owner_won': []
    };
    return transitions[currentStatus] || [];
  };
  
  const submitStatusChange = async () => {
    if (!newStatus) {
      alert('Please select a new status');
      return;
    }
    
    if (!changeReason.trim()) {
      alert('Please provide a reason for status change');
      return;
    }
    
    setStatusLoading(true);
    
    try {
      await apiClient.post(`/property/legal-cases/${selectedCase.id}/change_status/`, {
        new_status: newStatus,
        change_reason: changeReason
      });
      
      setShowStatusModal(false);
      fetchLegalCases(); // Refresh list
      alert('Status updated successfully! Unit status has been updated.');
    } catch (err) {
      alert(err.response?.data?.error || 'Error changing status');
      console.error('Error:', err);
    } finally {
      setStatusLoading(false);
    }
  };
  

  return (
    <Container fluid className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Rental Legal Cases</h1>
        <Button variant="primary" onClick={() => navigate('/legal-cases/new')}>
          <i className="fas fa-plus me-2"></i>
          Create Legal Case
        </Button>
      </div>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      {loading ? (
        <div className="text-center">
          <Spinner animation="border" />
        </div>
      ) : (
        <Card>
          <Card.Body>
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Case Number</th>
                  <th>Tenant</th>
                  <th>Property</th>
                  <th>Unit</th>
                  <th>Case Type</th>
                  <th>Filing Date</th>
                  <th>Status</th>
                  <th>Court</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {legalCases.length > 0 ? (
                  legalCases.map(legalCase => (
                    <tr key={legalCase.id}>
                      <td>{legalCase.case_number}</td>
                      <td>{legalCase.tenant_name}</td>
                      <td>{legalCase.property_name}</td>
                      <td>{legalCase.unit_number}</td>
                      <td>{getCaseTypeBadge(legalCase.case_type)}</td>
                      <td>{new Date(legalCase.filing_date).toLocaleDateString()}</td>
                      <td>{getStatusBadge(legalCase.current_status)}</td>
                      <td>{legalCase.court_name}</td>
                      <td>
                        <Button
                          size="sm"
                          variant="info"
                          className="me-2"
                          onClick={() => navigate(`/legal-cases/${legalCase.id}`)}
                          title="View details and history"
                        >
                          <i className="fas fa-eye"></i>
                        </Button>
                        {getNextStatuses(legalCase.current_status).length > 0 && (
                          <Button
                            size="sm"
                            variant="warning"
                            onClick={() => handleStatusChange(legalCase)}
                            title="Change status"
                          >
                            <i className="fas fa-exchange-alt"></i>
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="text-center">No legal cases found</td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}
      
      {/* Status Change Modal */}
      <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Change Case Status</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedCase && (
            <>
              <p><strong>Case:</strong> {selectedCase.case_number}</p>
              <p><strong>Current Status:</strong> {getStatusBadge(selectedCase.current_status)}</p>
              
              <Form.Group className="mb-3">
                <Form.Label>New Status <span className="text-danger">*</span></Form.Label>
                <Form.Select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  required
                >
                  <option value="">Select new status</option>
                  {getNextStatuses(selectedCase.current_status).map(status => (
                    <option key={status} value={status}>
                      {status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Reason for Change <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  placeholder="Explain why status is changing"
                  required
                />
              </Form.Group>
              
              <Alert variant="info">
                <strong>Note:</strong> Changing status will automatically update the unit status.
              </Alert>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStatusModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={submitStatusChange}
            disabled={statusLoading || !newStatus || !changeReason.trim()}
          >
            {statusLoading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Updating...
              </>
            ) : (
              'Update Status'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default LegalCaseList;
