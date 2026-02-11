import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Button, Table, Alert, 
  Spinner, Modal, Form, InputGroup, FormControl, 
  Dropdown, Pagination, Badge 
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { propertyService } from '../../services/propertyService';
import './PropertyList.css';

function PropertyList() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalPages: 1
  });
  
  // Filter and search states
  const [filters, setFilters] = useState({
    status: '',
    property_type: '',
    search: '',
    ordering: '-created_at'
  });

  const [formData, setFormData] = useState({
    property_id: '',
    name: '',
    property_type: 'residential',
    status: 'available',
    street_address: '',
    city: '',
    state: '',
    zip_code: '',
    country: '',
    purchase_price: '',
    total_area: '',
    acquisition_date: '',
  });

  // Fetch data with current filters and pagination
  const fetchProperties = async (page = 1) => {
    try {
      setLoading(true);
      
      // Prepare query parameters
      const params = {
        page: page,
        page_size: pagination.pageSize,  // Send selected page size
        ordering: filters.ordering
      };
      
      // Add filters if they exist
      if (filters.status) params.status = filters.status;
      if (filters.property_type) params.property_type = filters.property_type;
      if (filters.search) params.search = filters.search;
      
      const response = await propertyService.getAll(params);
      
      // Check if pagination exists in response
      if (response.data.results !== undefined) {
        // Django REST Framework pagination format
        setProperties(response.data.results);
        setTotalCount(response.data.count);
        setPagination(prev => ({
          ...prev,
          page: page,
          totalPages: Math.ceil(response.data.count / prev.pageSize)
        }));
      } else {
        // Non-paginated response
        setProperties(Array.isArray(response.data) ? response.data : []);
        setTotalCount(response.data.length || 0);
        setPagination(prev => ({
          ...prev,
          page: 1,
          totalPages: 1
        }));
      }
      
      setError(null);
    } catch (err) {
      setError('Failed to load properties');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties(pagination.page);
  }, [filters]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value,
    }));
    // Reset to first page when filters change
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProperties(1);
  };

  const handleClearFilters = () => {
    setFilters({
      status: '',
      property_type: '',
      search: '',
      ordering: '-created_at'
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (pageNumber) => {
    setPagination(prev => ({ ...prev, page: pageNumber }));
    fetchProperties(pageNumber);
  };

  const handlePageSizeChange = (size) => {
    setPagination(prev => ({ 
      ...prev, 
      pageSize: size,
      page: 1
    }));
    fetchProperties(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await propertyService.create(formData);
      setShowForm(false);
      setFormData({
        property_id: '',
        name: '',
        property_type: 'residential',
        status: 'available',
        street_address: '',
        city: '',
        state: '',
        zip_code: '',
        country: '',
        purchase_price: '',
        total_area: '',
        acquisition_date: '',
      });
      fetchProperties(pagination.page); // Refresh with current page
    } catch (err) {
      setError('Failed to create property');
      console.error(err);
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

  return (
    <Container fluid className="property-list">
      <div className="page-header mb-4">
        <h1>
          <i className="fas fa-building me-2"></i>
          Properties
        </h1>
        <Button variant="primary" onClick={() => navigate('/properties/new')}>
          <i className="fas fa-plus me-2"></i>
          Add Property
        </Button>
      </div>

      {/* Filters and Search Bar */}
      <Card className="mb-4 shadow-sm border-0">
  <Card.Body className="p-4">
    <Row className="g-3 align-items-end">
      {/* Search Input */}
      <Col lg={4} md={6} sm={12}>
        <Form onSubmit={handleSearch}>
          <Form.Label className="small text-muted mb-1">Search</Form.Label>
          <InputGroup>
            <FormControl
              placeholder="Name, property ID, or city"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
            <Button variant="primary" type="submit">
              <i className="fas fa-search"></i>
            </Button>
          </InputGroup>
        </Form>
      </Col>
      
      {/* Status Filter */}
      <Col lg={2} md={6} sm={6}>
        <div>
          <Form.Label className="small text-muted mb-1">Status</Form.Label>
          <Form.Select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">All Status</option>
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
            <option value="leased">Leased</option>
          </Form.Select>
        </div>
      </Col>
      
      {/* Property Type Filter */}
      <Col lg={2} md={6} sm={6}>
        <div>
          <Form.Label className="small text-muted mb-1">Type</Form.Label>
          <Form.Select
            value={filters.property_type}
            onChange={(e) => handleFilterChange('property_type', e.target.value)}
          >
            <option value="">All Types</option>
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
            <option value="industrial">Industrial</option>
            <option value="land">Land</option>
          </Form.Select>
        </div>
      </Col>
      
      {/* Sort Filter */}
      <Col lg={2} md={6} sm={6}>
        <div>
          <Form.Label className="small text-muted mb-1">Sort By</Form.Label>
          <Form.Select
            value={filters.ordering}
            onChange={(e) => handleFilterChange('ordering', e.target.value)}
          >
            <option value="-created_at">Newest First</option>
            <option value="created_at">Oldest First</option>
            <option value="name">Name A-Z</option>
            <option value="-name">Name Z-A</option>
          </Form.Select>
        </div>
      </Col>
      
      {/* Action Buttons */}
      <Col lg={2} md={6} sm={12}>
        <div className="d-flex gap-2 h-100">
          <Button 
            variant="outline-secondary" 
            onClick={handleClearFilters}
            title="Clear all filters"
            className="flex-fill"
          >
            <i className="fas fa-times me-1"></i>
            <span className="d-none d-lg-inline">Clear</span>
          </Button>
          
          <Dropdown className="flex-fill">
            <Dropdown.Toggle variant="outline-secondary" className="w-100">
              <i className="fas fa-list me-1"></i>
              <span className="d-none d-sm-inline">{pagination.pageSize}</span>
            </Dropdown.Toggle>
            <Dropdown.Menu align="end">
              <Dropdown.Header className="small">Per page</Dropdown.Header>
              <Dropdown.Divider />
              <Dropdown.Item 
                onClick={() => handlePageSizeChange(10)}
                active={pagination.pageSize === 10}
              >
                10
              </Dropdown.Item>
              <Dropdown.Item 
                onClick={() => handlePageSizeChange(25)}
                active={pagination.pageSize === 25}
              >
                25
              </Dropdown.Item>
              <Dropdown.Item 
                onClick={() => handlePageSizeChange(50)}
                active={pagination.pageSize === 50}
              >
                50
              </Dropdown.Item>
              <Dropdown.Item 
                onClick={() => handlePageSizeChange(100)}
                active={pagination.pageSize === 100}
              >
                100
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </Col>
    </Row>
    
    {/* Active Filters Display */}
    {(filters.status || filters.property_type || filters.search) && (
      <Row className="mt-3">
        <Col>
          <div className="d-flex align-items-center flex-wrap gap-2 p-3 bg-light rounded">
            <span className="text-muted small fw-semibold">
              <i className="fas fa-filter me-1"></i>
              Active Filters:
            </span>
            {filters.status && (
              <Badge 
                bg="primary" 
                className="d-flex align-items-center gap-2 py-2 px-3"
                role="button"
                onClick={() => handleFilterChange('status', '')}
                style={{ cursor: 'pointer' }}
              >
                <span>Status: <strong>{filters.status}</strong></span>
                <i className="fas fa-times"></i>
              </Badge>
            )}
            {filters.property_type && (
              <Badge 
                bg="primary" 
                className="d-flex align-items-center gap-2 py-2 px-3"
                role="button"
                onClick={() => handleFilterChange('property_type', '')}
                style={{ cursor: 'pointer' }}
              >
                <span>Type: <strong>{filters.property_type}</strong></span>
                <i className="fas fa-times"></i>
              </Badge>
            )}
            {filters.search && (
              <Badge 
                bg="primary" 
                className="d-flex align-items-center gap-2 py-2 px-3"
                role="button"
                onClick={() => handleFilterChange('search', '')}
                style={{ cursor: 'pointer' }}
              >
                <span>Search: <strong>"{filters.search}"</strong></span>
                <i className="fas fa-times"></i>
              </Badge>
            )}
          </div>
        </Col>
      </Row>
    )}
  </Card.Body>
</Card>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Results Info */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <span className="text-muted">
            Showing {properties.length} of {totalCount} properties
          </span>
        </div>
        {loading && <Spinner animation="border" size="sm" />}
      </div>

      {loading && properties.length === 0 ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
          <p className="mt-2">Loading properties...</p>
        </div>
      ) : (
        <>
          <Card>
            <Card.Body>
              <Table responsive hover>
                <thead className="table-header">
                  <tr>
                    <th>Property ID</th>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Area (sq.m)</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {properties.length > 0 ? (
                    properties.map(property => (
                      <tr key={property.id}>
                        <td><strong>{property.property_id}</strong></td>
                        <td>{property.name}</td>
                        <td>
                          <Badge bg="secondary">
                            {property.property_type}
                          </Badge>
                        </td>
                        <td>{property.city}, {property.state}</td>
                        <td>
                          <Badge bg={property.status === 'available' ? 'success' : property.status === 'occupied' ? 'warning' : 'info'}>
                            {property.status}
                          </Badge>
                        </td>
                        <td>{property.total_area || '-'}</td>
                        <td>
                          <Button 
                            variant="outline-info" 
                            size="sm"
                            className="me-2"
                            onClick={() => navigate(`/properties/${property.id}`)}
                            title="View property details"
                          >
                            <i className="fas fa-eye"></i>
                          </Button>
                          <Button 
                            variant="outline-warning" 
                            size="sm"
                            onClick={() => navigate(`/properties/edit/${property.id}`)}
                            title="Edit property"
                          >
                            <i className="fas fa-edit"></i>
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center text-muted py-4">
                        No properties found. Try changing your filters or create a new property.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          {/* Pagination */}
          {pagination.totalPages > 1 && totalCount > pagination.pageSize && (
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
                {totalCount} total properties
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Property Modal (same as before) */}
      <Modal show={showForm} onHide={() => setShowForm(false)} size="lg">
        {/* ... existing modal code ... */}
      </Modal>
    </Container>
  );
}

export default PropertyList;