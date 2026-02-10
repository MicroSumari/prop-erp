import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Card, 
  Button, 
  Alert, 
  Table,
  Row,
  Col,
  Form,
  InputGroup,
  FormControl,
  Pagination,
  Badge,
  Spinner
} from 'react-bootstrap';
import apiClient from '../../services/api';

const MaintenanceRequest = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    request_type: '',
    status: '',
  });

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const params = {
        page: currentPage,
        page_size: itemsPerPage,
      };
      
      if (searchQuery) params.search = searchQuery;
      if (filters.request_type) params.request_type = filters.request_type;
      if (filters.status) params.status = filters.status;
      
      const response = await apiClient.get('/maintenance/requests/', { params });
      
      if (response.data.results) {
        setRequests(response.data.results);
        setTotalItems(response.data.count || 0);
        setTotalPages(Math.ceil((response.data.count || 0) / itemsPerPage));
      } else {
        setRequests(Array.isArray(response.data) ? response.data : []);
        setTotalItems(Array.isArray(response.data) ? response.data.length : 0);
        setTotalPages(1);
      }
      
      setError(null);
    } catch (err) {
      setError('Failed to load maintenance requests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [currentPage, filters.request_type, filters.status]);

  // Debounced search
  useEffect(() => {
    if (searchQuery !== undefined) {
      setCurrentPage(1);
      const delayDebounceFn = setTimeout(() => {
        fetchRequests();
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
      request_type: '',
      status: '',
    });
    setSearchQuery('');
    setCurrentPage(1);
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'secondary',
      assigned: 'info',
      in_progress: 'primary',
      completed: 'success',
      cancelled: 'danger',
      open: 'warning',
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const getPriorityBadge = (priority) => {
    const variants = {
      low: 'success',
      medium: 'warning',
      high: 'danger',
      emergency: 'dark',
    };
    return <Badge bg={variants[priority] || 'secondary'}>{priority}</Badge>;
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
             <i className="fas fa-wrench"></i>

             Maintenance Requests
           </h1>

         </div>
          <p className="text-muted">Log maintenance issues for units</p>
        </div>
        <Button variant="primary" onClick={() => navigate('/maintenance/requests/new')}>
          <i className="fas fa-plus me-2"></i>
          New Request
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      
      {/* Search and Filter Card - All in one line */}
      <Card className="mb-4">
        <Card.Body>
          <Row className="align-items-center">
            {/* Search Input */}
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text>
                  <i className="fas fa-search"></i>
                </InputGroup.Text>
                <FormControl
                  placeholder="Search ID, unit, description..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </InputGroup>
            </Col>
            
            {/* Request Type Filter */}
            <Col md={3}>
              <Form.Select 
                value={filters.request_type} 
                onChange={(e) => handleFilterChange('request_type', e.target.value)}
                size="sm"
              >
                <option value="">All Types</option>
                <option value="plumbing">Plumbing</option>
                <option value="electrical">Electrical</option>
                <option value="heating">Heating</option>
                <option value="cooling">Cooling</option>
                <option value="appliance">Appliance</option>
                <option value="structural">Structural</option>
                <option value="pest_control">Pest Control</option>
                <option value="cleaning">Cleaning</option>
                <option value="landscaping">Landscaping</option>
                <option value="other">Other</option>
              </Form.Select>
            </Col>
            
            {/* Status Filter */}
            <Col md={2}>
              <Form.Select 
                value={filters.status} 
                onChange={(e) => handleFilterChange('status', e.target.value)}
                size="sm"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="open">Open</option>
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
                <div>{requests.length} of {totalItems} shown</div>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <div>
            Maintenance Requests
            {isLoading && <Spinner animation="border" size="sm" className="ms-2" />}
          </div>
        </Card.Header>
        <Card.Body>
          <div className="table-responsive">
            <Table hover>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Property</th>
                  <th>Unit</th>
                  <th>Type</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.length > 0 ? (
                  requests.map((req) => (
                    <tr key={req.id}>
                      <td><strong>#{req.id}</strong></td>
                      <td>{req.property_name || req.property}</td>
                      <td>{req.unit_number || req.unit}</td>
                      <td>{req.request_type}</td>
                      <td>{getPriorityBadge(req.priority)}</td>
                      <td>{getStatusBadge(req.status)}</td>
                      <td>{req.created_at?.split('T')[0]}</td>
                      <td>
                        <Button
                          variant="info"
                          size="sm"
                          className="me-2"
                          onClick={() => navigate(`/maintenance/requests/${req.id}`)}
                          title="View request details"
                        >
                          <i className="fas fa-eye"></i>
                        </Button>
                        <Button
                          variant="warning"
                          size="sm"
                          onClick={() => navigate(`/maintenance/requests/edit/${req.id}`)}
                          title="Edit this request"
                        >
                          <i className="fas fa-edit"></i>
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center text-muted py-4">
                      {isLoading ? 'Loading...' : 'No maintenance requests found'}
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
    </Container>
  );
};

export default MaintenanceRequest;