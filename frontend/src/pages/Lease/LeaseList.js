import React, { useState, useEffect } from 'react';
import { 
  Container, Card, Table, Button, Alert, Spinner, Badge,
  Form, InputGroup, FormControl, Dropdown, Pagination, Row, Col
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { leaseService } from '../../services/propertyService';

function LeaseList() {
  const navigate = useNavigate();
  const [leases, setLeases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalPages: 1,
    totalCount: 0
  });
  
  // Filter and search state
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    ordering: '-created_at'
  });

  // Fetch leases with filters and pagination
  const fetchLeases = async (page = 1) => {
    try {
      setLoading(true);
      
      // Prepare query parameters
      const params = {
        page: page,
        page_size: pagination.pageSize,
      };
      
      // Add filters if they exist
      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.ordering) params.ordering = filters.ordering;
      
      const response = await leaseService.getAll(params);
      
      // Handle paginated response
      if (response.data.results !== undefined) {
        setLeases(response.data.results);
        setPagination(prev => ({
          ...prev,
          page: page,
          totalCount: response.data.count,
          totalPages: Math.ceil(response.data.count / prev.pageSize)
        }));
      } else if (response.data.data !== undefined) {
        setLeases(response.data.data);
        setPagination(prev => ({
          ...prev,
          page: page,
          totalCount: response.data.total,
          totalPages: Math.ceil(response.data.total / prev.pageSize)
        }));
      } else {
        const leasesData = Array.isArray(response.data) ? response.data : [];
        setLeases(leasesData);
        setPagination(prev => ({
          ...prev,
          page: 1,
          totalCount: leasesData.length,
          totalPages: 1
        }));
      }
      
      setError(null);
    } catch (err) {
      setError('Failed to load leases');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeases(pagination.page);
  }, [filters]);

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value,
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchLeases(1);
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      status: '',
      ordering: '-created_at'
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (pageNumber) => {
    setPagination(prev => ({ ...prev, page: pageNumber }));
    fetchLeases(pageNumber);
  };

  const handlePageSizeChange = (size) => {
    setPagination(prev => ({ 
      ...prev, 
      pageSize: size,
      page: 1
    }));
    fetchLeases(1);
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      draft: 'secondary',
      active: 'success',
      expired: 'danger',
      terminated: 'warning',
      renewed: 'info',
      pending: 'primary'
    };
    return <Badge bg={statusColors[status] || 'secondary'}>{status?.charAt(0).toUpperCase() + status?.slice(1)}</Badge>;
  };

  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, pagination.page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let number = startPage; number <= endPage; number++) {
      items.push(
        <Pagination.Item
          key={number}
          active={number === pagination.page}
          onClick={() => handlePageChange(number)}
        >
          {number}
        </Pagination.Item>
      );
    }
    
    return items;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'SAR 0.00';
    return `SAR ${parseFloat(amount).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
  };

  return (
    <Container fluid className="mt-4">
      <div className="page-header mb-4">
        <h1>
          <i className="fas fa-file-contract me-2"></i>
          Leases
        </h1>
        <Button variant="primary" onClick={() => navigate('/leases/new')}>
          <i className="fas fa-plus me-2"></i>
          New Lease
        </Button>
      </div>

      {/* Filters and Search Bar */}
      <Card className="mb-4">
        <Card.Body>
          <Row className="g-3">
            <Col md={4}>
              <Form onSubmit={handleSearch}>
                <InputGroup>
                  <FormControl
                    placeholder="Search by lease number"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                  />
                  <Button variant="outline-secondary" type="submit">
                    <i className="fas fa-search"></i>
                  </Button>
                </InputGroup>
              </Form>
            </Col>
            
            <Col md={2}>
              <Form.Select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="terminated">Terminated</option>
              </Form.Select>
            </Col>
            
            <Col md={2}>
              <Form.Select
                value={filters.ordering}
                onChange={(e) => handleFilterChange('ordering', e.target.value)}
              >
                <option value="-created_at">Newest First</option>
                <option value="created_at">Oldest First</option>
                <option value="start_date">Start Date Asc</option>
                <option value="-start_date">Start Date Desc</option>
                <option value="end_date">End Date Asc</option>
                <option value="-end_date">End Date Desc</option>
                <option value="monthly_rent">Rent Low to High</option>
                <option value="-monthly_rent">Rent High to Low</option>
              </Form.Select>
            </Col>
            
            <Col md={4} className="d-flex gap-2">
              <Button 
                variant="outline-secondary" 
                onClick={handleClearFilters}
                title="Clear all filters"
                disabled={!filters.search && !filters.status}
              >
                <i className="fas fa-times me-1"></i>
                Clear Filters
              </Button>
              
              <Dropdown>
                <Dropdown.Toggle variant="outline-secondary">
                  {pagination.pageSize} per page
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={() => handlePageSizeChange(10)}>10</Dropdown.Item>
                  <Dropdown.Item onClick={() => handlePageSizeChange(25)}>25</Dropdown.Item>
                  <Dropdown.Item onClick={() => handlePageSizeChange(50)}>50</Dropdown.Item>
                  <Dropdown.Item onClick={() => handlePageSizeChange(100)}>100</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Col>
          </Row>
          
          {/* Active filters display */}
          {(filters.search || filters.status) && (
            <div className="mt-3">
              <small className="text-muted me-2">Active filters:</small>
              {filters.status && (
                <Badge bg="info" className="me-2" style={{ cursor: 'pointer' }}>
                  Status: {filters.status}
                  <i className="fas fa-times ms-1" onClick={() => handleFilterChange('status', '')}></i>
                </Badge>
              )}
              {filters.search && (
                <Badge bg="info" className="me-2" style={{ cursor: 'pointer' }}>
                  Search: "{filters.search}"
                  <i className="fas fa-times ms-1" onClick={() => handleFilterChange('search', '')}></i>
                </Badge>
              )}
            </div>
          )}
        </Card.Body>
      </Card>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Results Info */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <span className="text-muted">
            Showing {leases.length} of {pagination.totalCount} leases
          </span>
        </div>
        {loading && <Spinner animation="border" size="sm" />}
      </div>

      {loading && leases.length === 0 ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
          <p className="mt-2">Loading leases...</p>
        </div>
      ) : (
        <>
          <Card>
            <Card.Body>
              <Table responsive hover>
                <thead className="table-header">
                  <tr>
                    <th>Lease #</th>
                    <th>Tenant</th>
                    <th>Unit</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Monthly Rent</th>
                    <th>Security Deposit</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leases.length > 0 ? (
                    leases.map(lease => (
                      <tr key={lease.id}>
                        <td><strong>{lease.lease_number}</strong></td>
                        <td>
                          {lease.tenant_name || (lease.tenant?.first_name && lease.tenant?.last_name 
                            ? `${lease.tenant.first_name} ${lease.tenant.last_name}` 
                            : 'N/A')}
                        </td>
                        <td>
                          {lease.unit_number || (lease.unit?.unit_number 
                            ? `Unit ${lease.unit.unit_number}` 
                            : 'N/A')}
                          {lease.unit?.property?.name && (
                            <div>
                              <small className="text-muted">{lease.unit.property.name}</small>
                            </div>
                          )}
                        </td>
                        <td>{formatDate(lease.start_date)}</td>
                        <td>{formatDate(lease.end_date)}</td>
                        <td>{formatCurrency(lease.monthly_rent)}</td>
                        <td>{formatCurrency(lease.security_deposit)}</td>
                        <td>{getStatusBadge(lease.status)}</td>
                        <td>
                          <small className="text-muted">
                            {formatDate(lease.created_at)}
                          </small>
                        </td>
                        <td>
                          <Button 
                            variant="outline-info" 
                            size="sm" 
                            className="me-2"
                            onClick={() => navigate(`/leases/${lease.id}`)}
                            title="View lease details"
                          >
                            <i className="fas fa-eye"></i>
                          </Button>
                          <Button 
                            variant="outline-warning" 
                            size="sm"
                            onClick={() => navigate(`/leases/edit/${lease.id}`)}
                            title="Edit lease"
                          >
                            <i className="fas fa-edit"></i>
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="10" className="text-center text-muted py-4">
                        No leases found. Try changing your filters or create a new lease.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>

              {leases.length > 0 && (
                <div className="mt-3 text-muted">
                  <small>
                    <i className="fas fa-info-circle me-1"></i>
                    Showing page {pagination.page} of {pagination.totalPages}
                  </small>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Pagination */}
          {pagination.totalPages > 1 && pagination.totalCount > pagination.pageSize && (
            <div className="d-flex justify-content-between align-items-center mt-4">
              <div className="text-muted">
                Page {pagination.page} of {pagination.totalPages}
              </div>
              
              <Pagination>
                <Pagination.First 
                  onClick={() => handlePageChange(1)} 
                  disabled={pagination.page === 1}
                />
                <Pagination.Prev 
                  onClick={() => handlePageChange(pagination.page - 1)} 
                  disabled={pagination.page === 1}
                />
                
                {renderPaginationItems()}
                
                <Pagination.Next 
                  onClick={() => handlePageChange(pagination.page + 1)} 
                  disabled={pagination.page === pagination.totalPages}
                />
                <Pagination.Last 
                  onClick={() => handlePageChange(pagination.totalPages)} 
                  disabled={pagination.page === pagination.totalPages}
                />
              </Pagination>
              
              <div className="text-muted">
                {pagination.totalCount} total leases
              </div>
            </div>
          )}
        </>
      )}
    </Container>
  );
}

export default LeaseList;