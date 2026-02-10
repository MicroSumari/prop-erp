import React, { useState, useEffect } from 'react';
import { 
  Container, Table, Button, Card, Badge, Spinner, Alert, Modal, Form,
  Row, Col, InputGroup, FormControl, Pagination
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/api';

function LegalCaseList() {
  const navigate = useNavigate();
  const [legalCases, setLegalCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    case_type: '',
    current_status: '',
  });
  
  // Status change modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [changeReason, setChangeReason] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  
  // Fetch data with pagination and filters
  const fetchLegalCases = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        page_size: itemsPerPage,
      };
      
      if (searchQuery) params.search = searchQuery;
      if (filters.case_type) params.case_type = filters.case_type;
      if (filters.current_status) params.current_status = filters.current_status;
      
      const response = await apiClient.get('/property/legal-cases/', { params });
      
      // Handle paginated response
      if (response.data.results) {
        setLegalCases(response.data.results);
        setTotalItems(response.data.count || 0);
        setTotalPages(Math.ceil((response.data.count || 0) / itemsPerPage));
      } else {
        setLegalCases(Array.isArray(response.data) ? response.data : []);
        setTotalItems(Array.isArray(response.data) ? response.data.length : 0);
        setTotalPages(1);
      }
      
      setError('');
    } catch (err) {
      setError('Error fetching legal cases');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch on initial load and when filters/pagination changes
  useEffect(() => {
    fetchLegalCases();
  }, [currentPage, filters.case_type, filters.current_status]);
  
  // Debounced search
  useEffect(() => {
    if (searchQuery !== undefined) {
      setCurrentPage(1);
      const delayDebounceFn = setTimeout(() => {
        fetchLegalCases();
      }, 500);

      return () => clearTimeout(delayDebounceFn);
    }
  }, [searchQuery]);
  
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };
  
  const clearFilters = () => {
    setFilters({
      case_type: '',
      current_status: '',
    });
    setSearchQuery('');
    setCurrentPage(1);
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
  
  // Generate pagination items
  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    if (startPage > 1) {
      items.push(
        <Pagination.Item key={1} onClick={() => setCurrentPage(1)}>
          1
        </Pagination.Item>
      );
      if (startPage > 2) {
        items.push(<Pagination.Ellipsis key="ellipsis-start" />);
      }
    }
    
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <Pagination.Item
          key={i}
          active={i === currentPage}
          onClick={() => setCurrentPage(i)}
        >
          {i}
        </Pagination.Item>
      );
    }
    
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(<Pagination.Ellipsis key="ellipsis-end" />);
      }
      items.push(
        <Pagination.Item
          key={totalPages}
          onClick={() => setCurrentPage(totalPages)}
        >
          {totalPages}
        </Pagination.Item>
      );
    }
    
    return items;
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
      
      {/* Search and Filter Card - All in one line */}
      <Card className="mb-4">
        <Card.Body>
          <Row className="align-items-center">
            {/* Search Input */}
            <Col md={5}>
              <InputGroup>
                <InputGroup.Text>
                  <i className="fas fa-search"></i>
                </InputGroup.Text>
                <FormControl
                  placeholder="Search by case number or court name..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </InputGroup>
            </Col>
            
            {/* Case Type Filter */}
            <Col md={2}>
              <Form.Select 
                value={filters.case_type} 
                onChange={(e) => handleFilterChange('case_type', e.target.value)}
                size="sm"
              >
                <option value="">All Case Types</option>
                <option value="eviction">Eviction</option>
                <option value="non_payment">Non-Payment</option>
                <option value="damage">Property Damage</option>
                <option value="other">Other</option>
              </Form.Select>
            </Col>
            
            {/* Status Filter */}
            <Col md={2}>
              <Form.Select 
                value={filters.current_status} 
                onChange={(e) => handleFilterChange('current_status', e.target.value)}
                size="sm"
              >
                <option value="">All Statuses</option>
                <option value="filed">Filed</option>
                <option value="in_progress">In Progress</option>
                <option value="judgment_passed">Judgment Passed</option>
                <option value="closed_tenant_won">Closed (Tenant Won)</option>
                <option value="closed_owner_won">Closed (Owner Won)</option>
              </Form.Select>
            </Col>
            
            {/* Clear Filters Button */}
            <Col md={1}>
              <Button 
                variant="outline-secondary" 
                onClick={clearFilters}
                size="sm"
                title="Clear all filters"
              >
                <i className="fas fa-times"></i>
              </Button>
            </Col>
            
            {/* Stats Display */}
            <Col md={2} className="text-end">
              <div className="text-muted small">
                <div>Page {currentPage} of {totalPages}</div>
                <div>{legalCases.length} of {totalItems} shown</div>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {loading ? (
        <div className="text-center">
          <Spinner animation="border" />
        </div>
      ) : (
        <Card>
          <Card.Header className="d-flex justify-content-between align-items-center">
            <div>
              Legal Cases
              {loading && <Spinner animation="border" size="sm" className="ms-2" />}
            </div>
          </Card.Header>
          <Card.Body>
            <div className="table-responsive">
              <Table hover>
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
                        <td><strong>{legalCase.case_number}</strong></td>
                        <td>{legalCase.tenant_name || legalCase.tenant}</td>
                        <td>{legalCase.property_name || legalCase.property}</td>
                        <td>{legalCase.unit_number || legalCase.unit}</td>
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
                      <td colSpan="9" className="text-center text-muted py-4">
                        {loading ? 'Loading...' : 'No legal cases found'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-center mt-3">
                <Pagination>
                  <Pagination.First 
                    onClick={() => setCurrentPage(1)} 
                    disabled={currentPage === 1}
                  />
                  <Pagination.Prev 
                    onClick={() => setCurrentPage(currentPage - 1)} 
                    disabled={currentPage === 1}
                  />
                  {renderPaginationItems()}
                  <Pagination.Next 
                    onClick={() => setCurrentPage(currentPage + 1)} 
                    disabled={currentPage === totalPages}
                  />
                  <Pagination.Last 
                    onClick={() => setCurrentPage(totalPages)} 
                    disabled={currentPage === totalPages}
                  />
                </Pagination>
              </div>
            )}
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