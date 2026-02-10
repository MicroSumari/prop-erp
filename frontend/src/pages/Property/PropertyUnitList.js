import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { unitService, propertyService } from '../../services/propertyService';

function PropertyUnitList() {
  const navigate = useNavigate();
  const [units, setUnits] = useState([]);
  const [properties, setProperties] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load all units
        const unitsResponse = await unitService.getAll();
        const unitsData = Array.isArray(unitsResponse.data) 
          ? unitsResponse.data 
          : (unitsResponse.data.results || unitsResponse.data.data || []);
        
        // Load all properties
        const propertiesResponse = await propertyService.getAll();
        const propertiesData = Array.isArray(propertiesResponse.data) 
          ? propertiesResponse.data 
          : (propertiesResponse.data.results || propertiesResponse.data.data || []);
        
        // Create a map of property id to property data
        const propertyMap = {};
        propertiesData.forEach(prop => {
          propertyMap[prop.id] = prop;
        });
        
        if (isMounted) {
          setUnits(unitsData);
          setProperties(propertyMap);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to load property units');
          console.error(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const getStatusBadge = (status) => {
    const statusColors = {
      vacant: 'success',
      occupied: 'warning',
      maintenance: 'danger'
    };
    return <Badge bg={statusColors[status] || 'secondary'}>{status}</Badge>;
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

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
          <p className="mt-2">Loading units...</p>
        </div>
      ) : (
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
                  units.map(unit => {
                    const property = properties[unit.property];
                    return (
                      <tr key={unit.id}>
                        <td><strong>{unit.unit_number}</strong></td>
                        <td>
                          {property ? (
                            <>
                              {property.name}
                              <br />
                              <small className="text-muted">{property.city}, {property.state}</small>
                            </>
                          ) : (
                            <span className="text-muted">Loading...</span>
                          )}
                        </td>
                        <td>
                          <Badge bg="primary">{property?.property_id || 'N/A'}</Badge>
                        </td>
                        <td>
                          <Badge bg="info">{unit.unit_type || 'N/A'}</Badge>
                        </td>
                        <td>{unit.area}</td>
                        <td>{unit.bedrooms}</td>
                        <td>{unit.bathrooms}</td>
                        <td>${parseFloat(unit.monthly_rent).toLocaleString()}</td>
                        <td>{getStatusBadge(unit.status)}</td>
                        <td>
                          <Button 
                            variant="info" 
                            size="sm"
                            className="me-2"
                            onClick={() => navigate(`/property-units/${unit.id}`)}
                            title="View unit details"
                          >
                            <i className="fas fa-eye"></i>
                          </Button>
                          <Button 
                            variant="warning" 
                            size="sm"
                            onClick={() => navigate(`/property-units/edit/${unit.id}`)}
                            title="Edit unit"
                          >
                            <i className="fas fa-edit"></i>
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="10" className="text-center text-muted py-4">
                      No units found. Add units to properties to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>

            {units.length > 0 && (
              <div className="mt-3 text-muted">
                <small>
                  <i className="fas fa-info-circle me-1"></i>
                  Total Units: {units.length}
                </small>
              </div>
            )}
          </Card.Body>
        </Card>
      )}
    </Container>
  );
}

export default PropertyUnitList;
