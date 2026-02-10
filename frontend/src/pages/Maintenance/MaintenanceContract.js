import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Card, 
  Button, 
  Alert, 
  Table, 
  Modal, 
  Badge,
  Row,
  Col,
  Form,
  InputGroup,
  FormControl,
  Pagination,
  Spinner
} from 'react-bootstrap';
import apiClient from '../../services/api';

const MaintenanceContract = () => {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [pendingActivationId, setPendingActivationId] = useState(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    status: '',
  });

  useEffect(() => {
    fetchContracts();
  }, [currentPage, filters.status]);

  // Debounced search
  useEffect(() => {
    if (searchQuery !== undefined) {
      setCurrentPage(1);
      const delayDebounceFn = setTimeout(() => {
        fetchContracts();
      }, 500);

      return () => clearTimeout(delayDebounceFn);
    }
  }, [searchQuery]);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        page_size: itemsPerPage,
      };
      
      if (searchQuery) params.search = searchQuery;
      if (filters.status) params.status = filters.status;
      
      const response = await apiClient.get('/maintenance/contracts/', { params });
      
      if (response.data.results) {
        setContracts(response.data.results);
        setTotalItems(response.data.count || 0);
        setTotalPages(Math.ceil((response.data.count || 0) / itemsPerPage));
      } else {
        setContracts(Array.isArray(response.data) ? response.data : []);
        setTotalItems(Array.isArray(response.data) ? response.data.length : 0);
        setTotalPages(1);
      }
      
      setError(null);
    } catch (err) {
      setError('Failed to load contracts');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      status: '',
    });
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleActivate = async (contractId) => {
    try {
      setLoading(true);
      await apiClient.post(`/maintenance/contracts/${contractId}/activate/`);
      setSuccess('Contract activated successfully');
      fetchContracts();
    } catch (err) {
      setError('Failed to activate contract');
    } finally {
      setLoading(false);
      setShowActivateModal(false);
      setPendingActivationId(null);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      draft: 'secondary',
      active: 'success',
      completed: 'primary',
    };
    return map[status] || 'secondary';
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
        <div>
          <div className="page-header mb-4">

            <h1>

              <i className="fas fa-file-contract"></i>

              Maintenance Contracts

            </h1>

          </div>

 
          <p className="text-muted">Manage prepaid maintenance contracts</p>
        </div>
        <Button variant="primary" onClick={() => navigate('/maintenance/contracts/new')}>
          <i className="fas fa-plus me-2"></i>
          New Contract
        </Button>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess(null)}>{success}</Alert>}

      {/* Search and Filter Card */}
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
                  placeholder="Search by id ..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </InputGroup>
            </Col>
            
            {/* Status Filter */}
            <Col md={2}>
              <Form.Select 
                value={filters.status} 
                onChange={(e) => handleFilterChange('status', e.target.value)}
                size="sm"
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
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
            <Col md={4} className="text-end">
              <div className="text-muted small">
                <div>Page {currentPage} of {totalPages}</div>
                <div>{contracts.length} of {totalItems} shown</div>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <div>
            Maintenance Contracts
            {loading && <Spinner animation="border" size="sm" className="ms-2" />}
          </div>
        </Card.Header>
        <Card.Body>
          <div className="table-responsive">
            <Table hover>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Supplier</th>
                  <th>Property</th>
                  <th>Unit</th>
                  <th>Total Amount</th>
                  <th>Duration</th>
                  <th>Amortized</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {contracts.length > 0 ? (
                  contracts.map((contract) => (
                    <tr key={contract.id}>
                      <td><strong>#{contract.id}</strong></td>
                      <td>{contract.supplier_name || contract.supplier}</td>
                      <td>{contract.property_name || contract.property}</td>
                      <td>{contract.unit_number || '—'}</td>
                      <td>SAR {parseFloat(contract.total_amount).toFixed(2)}</td>
                      <td>{contract.duration_months}</td>
                      <td>SAR {parseFloat(contract.amortized_amount).toFixed(2)}</td>
                      <td>
                        <Badge bg={getStatusBadge(contract.status)}>
                          {contract.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td>
                        <Button
                          size="sm"
                          variant="info"
                          onClick={() => navigate(`/maintenance/contracts/${contract.id}`)}
                          className="me-2"
                          title="View contract details"
                        >
                          <i className="fas fa-eye"></i>
                        </Button>
                        {contract.status === 'draft' && (
                          <>
                            <Button
                              size="sm"
                              variant="warning"
                              onClick={() => navigate(`/maintenance/contracts/edit/${contract.id}`)}
                              className="me-2"
                              title="Edit this contract"
                            >
                              <i className="fas fa-edit"></i>
                            </Button>
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() => {
                                setPendingActivationId(contract.id);
                                setShowActivateModal(true);
                              }}
                              title="Activate contract"
                            >
                              <i className="fas fa-check-circle"></i>
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="text-center text-muted py-4">
                      {loading ? 'Loading...' : 'No contracts found'}
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

      <Modal show={showActivateModal} onHide={() => setShowActivateModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Activate Contract</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Activating this contract will post accounting entries. Are you sure you want to proceed?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowActivateModal(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={() => handleActivate(pendingActivationId)}>
            Confirm Activation
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default MaintenanceContract;