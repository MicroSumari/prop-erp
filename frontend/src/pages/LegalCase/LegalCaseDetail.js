import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Badge, Spinner, Alert, Modal, Form } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../services/api';

function LegalCaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [legalCase, setLegalCase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [changeReason, setChangeReason] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  
  useEffect(() => {
    if (id) {
      fetchLegalCase();
    }
  }, [id]);
  
  const fetchLegalCase = async () => {
    try {
      const response = await apiClient.get(`/property/legal-cases/${id}/`);
      setLegalCase(response.data);
      setEditData(response.data);
    } catch (err) {
      setError('Error fetching legal case details');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
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
  
  const getCaseTypeBadge = (caseType) => {
    const variants = {
      'eviction': 'danger',
      'non_payment': 'warning',
      'damage': 'info',
      'other': 'secondary'
    };
    return <Badge bg={variants[caseType] || 'secondary'}>{caseType.replace('_', ' ').toUpperCase()}</Badge>;
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
  
  const handleStatusChange = () => {
    setNewStatus('');
    setChangeReason('');
    setShowStatusModal(true);
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
      await apiClient.post(`/property/legal-cases/${id}/change_status/`, {
        new_status: newStatus,
        change_reason: changeReason
      });
      
      setShowStatusModal(false);
      fetchLegalCase();
      alert('Status updated successfully! Unit status has been updated.');
    } catch (err) {
      alert(err.response?.data?.error || 'Error changing status');
      console.error('Error:', err);
    } finally {
      setStatusLoading(false);
    }
  };
  
  const handleEditClick = () => {
    setEditData(legalCase);
    setShowEditModal(true);
  };
  
  const submitEdit = async () => {
    setEditLoading(true);
    
    try {
      const updateData = {
        court_name: editData.court_name,
        remarks: editData.remarks
      };
      
      await apiClient.patch(`/property/legal-cases/${id}/`, updateData);
      
      setShowEditModal(false);
      fetchLegalCase();
      alert('Case details updated successfully!');
    } catch (err) {
      alert(err.response?.data?.detail || 'Error updating case');
      console.error('Error:', err);
    } finally {
      setEditLoading(false);
    }
  };
  
  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" />
      </Container>
    );
  }
  
  if (!legalCase) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">Legal case not found</Alert>
        <Button onClick={() => navigate('/legal-cases')}>Back to Cases</Button>
      </Container>
    );
  }
  
  return (
    <Container fluid className="mt-4">
      <div className="mb-4">
        <Button variant="outline-secondary" onClick={() => navigate('/legal-cases')}>
          <i className="fas fa-arrow-left me-2"></i>
          Back to Cases
        </Button>
      </div>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Card className="mb-4">
        <Card.Header className="bg-light">
          <div className="d-flex justify-content-between align-items-center">
            <h3 className="mb-0">Case #{legalCase.case_number}</h3>
            <div>
              {getNextStatuses(legalCase.current_status).length > 0 && (
                <Button
                  variant="warning"
                  size="sm"
                  className="me-2"
                  onClick={handleStatusChange}
                >
                  <i className="fas fa-exchange-alt me-2"></i>
                  Change Status
                </Button>
              )}
              <Button variant="primary" size="sm" onClick={handleEditClick}>
                <i className="fas fa-edit me-2"></i>
                Edit
              </Button>
            </div>
          </div>
        </Card.Header>
        <Card.Body>
          <div className="row">
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label fw-bold">Case Number</label>
                <p>{legalCase.case_number}</p>
              </div>
              
              <div className="mb-3">
                <label className="form-label fw-bold">Tenant</label>
                <p>{legalCase.tenant_name}</p>
              </div>
              
              <div className="mb-3">
                <label className="form-label fw-bold">Lease</label>
                <p>{legalCase.lease_number}</p>
              </div>
              
              <div className="mb-3">
                <label className="form-label fw-bold">Property</label>
                <p>{legalCase.property_name}</p>
              </div>
              
              <div className="mb-3">
                <label className="form-label fw-bold">Unit</label>
                <p>{legalCase.unit_number}</p>
              </div>
            </div>
            
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label fw-bold">Case Type</label>
                <p>{getCaseTypeBadge(legalCase.case_type)}</p>
              </div>
              
              <div className="mb-3">
                <label className="form-label fw-bold">Current Status</label>
                <p>{getStatusBadge(legalCase.current_status)}</p>
              </div>
              
              <div className="mb-3">
                <label className="form-label fw-bold">Filing Date</label>
                <p>{new Date(legalCase.filing_date).toLocaleDateString()}</p>
              </div>
              
              <div className="mb-3">
                <label className="form-label fw-bold">Court Name</label>
                <p>{legalCase.court_name || '-'}</p>
              </div>
              
              <div className="mb-3">
                <label className="form-label fw-bold">Cost Center</label>
                <p>{legalCase.cost_center || '-'}</p>
              </div>
            </div>
          </div>
          
          {legalCase.remarks && (
            <div className="mb-3">
              <label className="form-label fw-bold">Remarks</label>
              <p>{legalCase.remarks}</p>
            </div>
          )}
        </Card.Body>
      </Card>
      
      {/* Status History */}
      {legalCase.status_history && legalCase.status_history.length > 0 && (
        <Card>
          <Card.Header className="bg-light">
            <h4 className="mb-0">Status History</h4>
          </Card.Header>
          <Card.Body>
            <div className="timeline">
              {legalCase.status_history.map((history, idx) => (
                <div key={history.id} className="timeline-item mb-3">
                  <div className="d-flex">
                    <div className="timeline-marker me-3">
                      <div className="marker-circle">
                        <i className="fas fa-check"></i>
                      </div>
                      {idx < legalCase.status_history.length - 1 && <div className="marker-line"></div>}
                    </div>
                    <div className="flex-grow-1">
                      <div className="mb-2">
                        <strong>{new Date(history.changed_at).toLocaleString()}</strong>
                        {history.changed_by && <span className="ms-2 text-muted">by {history.changed_by}</span>}
                      </div>
                      <div className="mb-2">
                        {history.previous_status ? (
                          <>
                            {getStatusBadge(history.previous_status)} → {getStatusBadge(history.new_status)}
                          </>
                        ) : (
                          <>Case created with status: {getStatusBadge(history.new_status)}</>
                        )}
                      </div>
                      {history.change_reason && (
                        <p className="text-muted mb-0">
                          <small>{history.change_reason}</small>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      )}
      
      {/* Status Change Modal */}
      <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Change Case Status</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p><strong>Current Status:</strong> {getStatusBadge(legalCase.current_status)}</p>
          
          <Form.Group className="mb-3">
            <Form.Label>New Status <span className="text-danger">*</span></Form.Label>
            <Form.Select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              required
            >
              <option value="">Select new status</option>
              {getNextStatuses(legalCase.current_status).map(status => (
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
            {statusLoading ? 'Updating...' : 'Update Status'}
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Case Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Court Name</Form.Label>
            <Form.Control
              type="text"
              value={editData.court_name || ''}
              onChange={(e) => setEditData({ ...editData, court_name: e.target.value })}
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Remarks</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={editData.remarks || ''}
              onChange={(e) => setEditData({ ...editData, remarks: e.target.value })}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={submitEdit}
            disabled={editLoading}
          >
            {editLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </Modal.Footer>
      </Modal>
      
      <style>{`
        .timeline {
          position: relative;
        }
        
        .timeline-item {
          position: relative;
        }
        
        .timeline-marker {
          position: relative;
          width: 30px;
        }
        
        .marker-circle {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: #0d6efd;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          position: relative;
          z-index: 1;
        }
        
        .marker-line {
          position: absolute;
          left: 14px;
          top: 30px;
          width: 2px;
          height: 80px;
          background: #dee2e6;
        }
      `}
      </style>
      </Container>
  );
}

export default LegalCaseDetail;