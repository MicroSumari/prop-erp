import React, { useState, useEffect } from 'react';
import { 
  Container, Card, Table, Button, Alert, Spinner, Badge,
  Form, InputGroup, FormControl, Dropdown, Pagination, Row, Col
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { unitService, propertyService } from '../../services/propertyService';

function PropertyUnitList() {
  const navigate = useNavigate();
  const [units, setUnits] = useState([]);
  const [properties, setProperties] = useState({});
  const [propertyList, setPropertyList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingProperties, setLoadingProperties] = useState(false);
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
    property: '',
    status: '',
    search: '',
    unit_type: ''
  });

  // Load properties for filter dropdown
  useEffect(() => {
    const loadProperties = async () => {
      try {
        setLoadingProperties(true);
        const response = await propertyService.getAll();
        const propertiesData = Array.isArray(response.data) 
          ? response.data 
          : (response.data.results || response.data.data || []);
        
        // Create a map of property id to property data
        const propertyMap = {};
        propertiesData.forEach(prop => {
          propertyMap[prop.id] = prop;
        });
        
        setPropertyList(propertiesData);
        setProperties(propertyMap);
      } catch (err) {
        console.error('Failed to load properties:', err);
      } finally {
        setLoadingProperties(false);
      }
    };
    
    loadProperties();
  }, []);

  // Fetch units with filters and pagination
  const fetchUnits = async (page = 1) => {
    try {
      setLoading(true);
      
      // Prepare query parameters
      const params = {
        page: page,
        page_size: pagination.pageSize,
      };
      
      // Add filters if they exist
      if (filters.property) params.property = filters.property;
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;
      if (filters.unit_type) params.unit_type = filters.unit_type;
      
      const response = await unitService.getAll(params);
      
      // Handle paginated response
      if (response.data.results !== undefined) {
        // Django REST Framework pagination format
        setUnits(response.data.results);
        setPagination(prev => ({
          ...prev,
          page: page,
          totalCount: response.data.count,
          totalPages: Math.ceil(response.data.count / prev.pageSize)
        }));
      } else if (response.data.data !== undefined) {
        // Custom pagination format
        setUnits(response.data.data);
        setPagination(prev => ({
          ...prev,
          page: page,
          totalCount: response.data.total,
          totalPages: Math.ceil(response.data.total / prev.pageSize)
        }));
      } else {
        // Non-paginated response
        const unitsData = Array.isArray(response.data) ? response.data : [];
        setUnits(unitsData);
        setPagination(prev => ({
          ...prev,
          page: 1,
          totalCount: unitsData.length,
          totalPages: 1
        }));
      }
      
      setError(null);
    } catch (err) {
      setError('Failed to load property units');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits(pagination.page);
  }, [filters]);

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
    fetchUnits(1);
  };

  const handleClearFilters = () => {
    setFilters({
      property: '',
      status: '',
      search: '',
      unit_type: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (pageNumber) => {
    setPagination(prev => ({ ...prev, page: pageNumber }));
    fetchUnits(pageNumber);
  };

  const handlePageSizeChange = (size) => {
    setPagination(prev => ({ 
      ...prev, 
      pageSize: size,
      page: 1
    }));
    fetchUnits(1);
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      vacant: 'success',
      occupied: 'warning',
      maintenance: 'danger',
      reserved: 'info',
      unavailable: 'secondary'
    };
    return <Badge bg={statusColors[status] || 'secondary'}>{status}</Badge>;
  };

  const getUnitTypeBadge = (type) => {
    const typeColors = {
      apartment: 'primary',
      office: 'success',
      retail: 'warning',
      warehouse: 'danger',
      studio: 'info'
    };
    return <Badge bg={typeColors[type] || 'secondary'}>{type}</Badge>;
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

  const getPropertyName = (propertyId) => {
    const property = properties[propertyId];
    if (!property) return 'Loading...';
    return `${property.name} (${property.property_id})`;
  };

  return (
    <Container fluid className="mt-4">
      <div className="page-header mb-4">
        <h1>
          <i className="fas fa-cube me-2"></i>
          Property Units
        </h1>
        <Button variant="primary" onClick={() => navigate('/property-units/new')}>
          <i className="fas fa-plus me-2"></i>
          Add Property Unit
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
                    placeholder="Search by unit number"
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
                value={filters.property}
                onChange={(e) => handleFilterChange('property', e.target.value)}
                disabled={loadingProperties}
              >
                <option value="">All Properties</option>
                {propertyList.map(prop => (
                  <option key={prop.id} value={prop.id}>
                    {prop.name} ({prop.property_id})
                  </option>
                ))}
              </Form.Select>
            </Col>
            
            <Col md={2}>
              <Form.Select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">All Status</option>
                <option value="vacant">Vacant</option>
                <option value="occupied">Occupied</option>
                <option value="maintenance">Maintenance</option>
                <option value="reserved">Reserved</option>
                <option value="unavailable">Unavailable</option>
              </Form.Select>
            </Col>
            
            <Col md={2}>
              <Form.Select
                value={filters.unit_type}
                onChange={(e) => handleFilterChange('unit_type', e.target.value)}
              >
                <option value="">All Types</option>
                <option value="apartment">Apartment</option>
                <option value="office">Office</option>
                <option value="retail">Retail</option>
                <option value="warehouse">Warehouse</option>
                <option value="studio">Studio</option>
              </Form.Select>
            </Col>
            
            <Col md={3} className="d-flex gap-2">
              <Button 
                variant="outline-secondary" 
                onClick={handleClearFilters}
                title="Clear all filters"
                disabled={!filters.property && !filters.status && !filters.search && !filters.unit_type}
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
          {(filters.property || filters.status || filters.search || filters.unit_type) && (
            <div className="mt-3">
              <small className="text-muted me-2">Active filters:</small>
              {filters.property && (
                <Badge bg="info" className="me-2" style={{ cursor: 'pointer' }}>
                  Property: {properties[filters.property]?.name || filters.property}
                  <i className="fas fa-times ms-1" onClick={() => handleFilterChange('property', '')}></i>
                </Badge>
              )}
              {filters.status && (
                <Badge bg="info" className="me-2" style={{ cursor: 'pointer' }}>
                  Status: {filters.status}
                  <i className="fas fa-times ms-1" onClick={() => handleFilterChange('status', '')}></i>
                </Badge>
              )}
              {filters.unit_type && (
                <Badge bg="info" className="me-2" style={{ cursor: 'pointer' }}>
                  Type: {filters.unit_type}
                  <i className="fas fa-times ms-1" onClick={() => handleFilterChange('unit_type', '')}></i>
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
            Showing {units.length} of {pagination.totalCount} units
          </span>
          {loadingProperties && (
            <span className="ms-3">
              <Spinner animation="border" size="sm" /> Loading properties...
            </span>
          )}
        </div>
        {loading && <Spinner animation="border" size="sm" />}
      </div>

      {loading && units.length === 0 ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
          <p className="mt-2">Loading units...</p>
        </div>
      ) : (
        <>
          <Card>
            <Card.Body>
              <Table responsive hover>
                <thead className="table-header">
                  <tr>
                    <th>Unit Number</th>
                    <th>Property</th>
                    <th>Property ID</th>
                    <th>Type</th>
                    <th>Area (sq.m)</th>
                    <th>Bedrooms</th>
                    <th>Bathrooms</th>
                    <th>Monthly Rent</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {units.length > 0 ? (
                    units.map(unit => (
                      <tr key={unit.id}>
                        <td><strong>{unit.unit_number}</strong></td>
                        <td>
                          {properties[unit.property] ? (
                            <>
                              {properties[unit.property].name}
                              <br />
                              <small className="text-muted">
                                {properties[unit.property].city}, {properties[unit.property].state}
                              </small>
                            </>
                          ) : (
                            <span className="text-muted">Loading...</span>
                          )}
                        </td>
                        <td>
                          <Badge bg="primary">
                            {properties[unit.property]?.property_id || 'N/A'}
                          </Badge>
                        </td>
                        <td>
                          {getUnitTypeBadge(unit.unit_type)}
                        </td>
                        <td>{unit.area || '-'}</td>
                        <td>{unit.bedrooms || '-'}</td>
                        <td>{unit.bathrooms || '-'}</td>
                        <td>
                          {unit.monthly_rent ? `$${parseFloat(unit.monthly_rent).toLocaleString()}` : '-'}
                        </td>
                        <td>{getStatusBadge(unit.status)}</td>
                        <td>
                          <Button 
                            variant="outline-info" 
                            size="sm"
                            className="me-2"
                            onClick={() => navigate(`/property-units/${unit.id}`)}
                            title="View unit details"
                          >
                            <i className="fas fa-eye"></i>
                          </Button>
                          <Button 
                            variant="outline-warning" 
                            size="sm"
                            onClick={() => navigate(`/property-units/edit/${unit.id}`)}
                            title="Edit unit"
                          >
                            <i className="fas fa-edit"></i>
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="10" className="text-center text-muted py-4">
                        No units found. Try changing your filters or create a new unit.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>

              {units.length > 0 && (
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
                {pagination.totalCount} total units
              </div>
            </div>
          )}
        </>
      )}
    </Container>
  );
}

export default PropertyUnitList;