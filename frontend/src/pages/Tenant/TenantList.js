import React, { useState, useEffect } from 'react';
import { 
  Container, Card, Table, Button, Alert, Spinner, Badge,
  Form, InputGroup, FormControl, Dropdown, Pagination, Row, Col
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { tenantService } from '../../services/propertyService';

function TenantList() {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalPages: 1,
    totalCount: 0
  });
  
  // Filter and search state - Based on actual model fields
  const [filters, setFilters] = useState({
    search: '',
    ledger_account_type: '',  // Filter by customer/supplier
    has_ledger_account: '',   // Filter by ledger account existence
    ordering: '-created_at'
  });

  // Fetch tenants with filters and pagination
  const fetchTenants = async (page = 1) => {
    try {
      setLoading(true);
      
      // Prepare query parameters
      const params = {
        page: page,
        page_size: pagination.pageSize,
      };
      
      // Add filters if they exist - Based on actual model fields
      if (filters.search) params.search = filters.search;
      if (filters.ledger_account_type) params.ledger_account_type = filters.ledger_account_type;
      if (filters.has_ledger_account !== '') params.has_ledger_account = filters.has_ledger_account;
      if (filters.ordering) params.ordering = filters.ordering;
      
      const response = await tenantService.getAll(params);
      
      // Handle paginated response
      if (response.data.results !== undefined) {
        setTenants(response.data.results);
        setPagination(prev => ({
          ...prev,
          page: page,
          totalCount: response.data.count,
          totalPages: Math.ceil(response.data.count / prev.pageSize)
        }));
      } else if (response.data.data !== undefined) {
        setTenants(response.data.data);
        setPagination(prev => ({
          ...prev,
          page: page,
          totalCount: response.data.total,
          totalPages: Math.ceil(response.data.total / prev.pageSize)
        }));
      } else {
        const tenantsData = Array.isArray(response.data) ? response.data : [];
        setTenants(tenantsData);
        setPagination(prev => ({
          ...prev,
          page: 1,
          totalCount: tenantsData.length,
          totalPages: 1
        }));
      }
      
      setError(null);
    } catch (err) {
      setError('Failed to load related parties');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants(pagination.page);
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
    fetchTenants(1);
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      ledger_account_type: '',
      has_ledger_account: '',
      ordering: '-created_at'
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (pageNumber) => {
    setPagination(prev => ({ ...prev, page: pageNumber }));
    fetchTenants(pageNumber);
  };

  const handlePageSizeChange = (size) => {
    setPagination(prev => ({ 
      ...prev, 
      pageSize: size,
      page: 1
    }));
    fetchTenants(1);
  };

  const getLedgerTypeBadge = (type) => {
    const typeColors = {
      customer: 'success',
      supplier: 'primary',
    };
    return <Badge bg={typeColors[type] || 'secondary'}>{type}</Badge>;
  };

  const getStatusBadge = (tenant) => {
    // Determine status based on move_in_date and move_out_date
    const today = new Date();
    const moveInDate = new Date(tenant.move_in_date);
    const moveOutDate = tenant.move_out_date ? new Date(tenant.move_out_date) : null;
    
    if (moveOutDate && moveOutDate < today) {
      return <Badge bg="secondary">Past Tenant</Badge>;
    } else if (moveInDate > today) {
      return <Badge bg="warning">Future Tenant</Badge>;
    } else {
      return <Badge bg="success">Current Tenant</Badge>;
    }
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

  return (
    <Container fluid className="mt-4">
      <div className="page-header mb-4">    
        <h1>
          <i className="fas fa-users me-2"></i>
          Related Parties
        </h1>

        <Button variant="primary" onClick={() => navigate('/related-parties/new')}>
          <i className="fas fa-plus me-2"></i>
          Add Party
        </Button>
      </div>

      {/* Filters and Search Bar */}
      <Card className="mb-4">
        <Card.Body>
          <Row className="g-3">
            <Col md={3}>
              <Form onSubmit={handleSearch}>
                <InputGroup>
                  <FormControl
                    placeholder="Search by name, email or phone"
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
                value={filters.ledger_account_type}
                onChange={(e) => handleFilterChange('ledger_account_type', e.target.value)}
              >
                <option value="">All Ledger Types</option>
                <option value="customer">Customer</option>
                <option value="supplier">Supplier</option>
              </Form.Select>
            </Col>
            
            <Col md={2}>
              <Form.Select
                value={filters.has_ledger_account}
                onChange={(e) => handleFilterChange('has_ledger_account', e.target.value)}
              >
                <option value="">All Accounts</option>
                <option value="true">Has Ledger Account</option>
                <option value="false">No Ledger Account</option>
              </Form.Select>
            </Col>
            
            <Col md={2}>
              <Form.Select
                value={filters.ordering}
                onChange={(e) => handleFilterChange('ordering', e.target.value)}
              >
                <option value="-created_at">Newest First</option>
                <option value="created_at">Oldest First</option>
                <option value="first_name">Name A-Z</option>
                <option value="-first_name">Name Z-A</option>
                <option value="move_in_date">Move-in Date Asc</option>
                <option value="-move_in_date">Move-in Date Desc</option>
              </Form.Select>
            </Col>
            
            <Col md={3} className="d-flex gap-2">
              <Button 
                variant="outline-secondary" 
                onClick={handleClearFilters}
                title="Clear all filters"
                disabled={!filters.search && !filters.ledger_account_type && filters.has_ledger_account === ''}
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
          {(filters.search || filters.ledger_account_type || filters.has_ledger_account !== '') && (
            <div className="mt-3">
              <small className="text-muted me-2">Active filters:</small>
              {filters.ledger_account_type && (
                <Badge bg="info" className="me-2" style={{ cursor: 'pointer' }}>
                  Ledger Type: {filters.ledger_account_type}
                  <i className="fas fa-times ms-1" onClick={() => handleFilterChange('ledger_account_type', '')}></i>
                </Badge>
              )}
              {filters.has_ledger_account !== '' && (
                <Badge bg="info" className="me-2" style={{ cursor: 'pointer' }}>
                  Account: {filters.has_ledger_account === 'true' ? 'Has Account' : 'No Account'}
                  <i className="fas fa-times ms-1" onClick={() => handleFilterChange('has_ledger_account', '')}></i>
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
            Showing {tenants.length} of {pagination.totalCount} related parties
          </span>
        </div>
        {loading && <Spinner animation="border" size="sm" />}
      </div>

      {loading && tenants.length === 0 ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
          <p className="mt-2">Loading related parties...</p>
        </div>
      ) : (
        <>
          <Card>
            <Card.Body>
              <Table responsive hover>
                <thead className="table-header">
                  <tr>
                    <th>Name</th>
                    <th>Contact</th>
                    <th>Move-in Date</th>
                    <th>Ledger Account</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.length > 0 ? (
                    tenants.map(tenant => (
                      <tr key={tenant.id}>
                        <td>
                          <strong>{tenant.first_name} {tenant.last_name}</strong>
                          <div>
                            <small className="text-muted">Unit: {tenant.unit?.unit_number || 'Not Assigned'}</small>
                          </div>
                        </td>
                        <td>
                          <div>{tenant.email}</div>
                          <small className="text-muted">{tenant.phone}</small>
                        </td>
                        <td>
                          {formatDate(tenant.move_in_date)}
                          {tenant.move_out_date && (
                            <div>
                              <small className="text-muted">Move-out: {formatDate(tenant.move_out_date)}</small>
                            </div>
                          )}
                        </td>
                        <td>
                          {tenant.has_ledger_account ? (
                            <>
                              {getLedgerTypeBadge(tenant.ledger_account_type)}
                              <div>
                                <small className="text-muted">Account #{tenant.ledger_account?.id || 'N/A'}</small>
                              </div>
                            </>
                          ) : (
                            <Badge bg="secondary">No Account</Badge>
                          )}
                        </td>
                        <td>
                          {getStatusBadge(tenant)}
                        </td>
                        <td>
                          <small className="text-muted">
                            {formatDate(tenant.created_at)}
                          </small>
                        </td>
                        <td>
                          <Button 
                            variant="outline-info" 
                            size="sm" 
                            className="me-2"
                            onClick={() => navigate(`/related-parties/${tenant.id}`)}
                            title="View party details"
                          >
                            <i className="fas fa-eye"></i>
                          </Button>
                          <Button 
                            variant="outline-warning" 
                            size="sm"
                            onClick={() => navigate(`/related-parties/edit/${tenant.id}`)}
                            title="Edit party"
                          >
                            <i className="fas fa-edit"></i>
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center text-muted py-4">
                        No related parties found. Try changing your filters or create a new party.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>

              {tenants.length > 0 && (
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
                {pagination.totalCount} total parties
              </div>
            </div>
          )}
        </>
      )}
    </Container>
  );
}

export default TenantList;