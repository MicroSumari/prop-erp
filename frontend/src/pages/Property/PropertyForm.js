import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Alert, Spinner, Card, Row, Col, Nav, Tab } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { propertyService, unitService } from '../../services/propertyService';
import './PropertyForm.css';

function PropertyForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('property');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Property form state
  const [propertyData, setPropertyData] = useState({
    property_id: '',
    name: '',
    description: '',
    property_type: 'residential',
    status: 'available',
    street_address: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'USA',
    total_area: '',
    built_area: '',
    number_of_units: '',
    year_built: '',
    acquisition_date: new Date().toISOString().split('T')[0],
  });

  // Unit form state
  const [units, setUnits] = useState([]);
  const [showUnitForm, setShowUnitForm] = useState(false);
  const [unitData, setUnitData] = useState({
    unit_number: '',
    unit_type: 'apartment',
    area: '',
    bedrooms: '',
    bathrooms: '',
    monthly_rent: '',
    status: 'vacant',
  });

  useEffect(() => {
    if (id) {
      // Load existing property data for editing
      const loadProperty = async () => {
        try {
          setLoading(true);
          const response = await propertyService.getById(id);
          setPropertyData(response.data);
          
          // Load existing units
          const unitsResponse = await unitService.getAll({ property: id });
          const existingUnits = Array.isArray(unitsResponse.data) 
            ? unitsResponse.data 
            : (unitsResponse.data.results || []);
          setUnits(existingUnits.map(u => ({ ...u, id: u.id })));
        } catch (err) {
          setError('Failed to load property data');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      loadProperty();
    }
  }, [id]);

  const handlePropertyChange = (e) => {
    const { name, value } = e.target;
    setPropertyData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUnitChange = (e) => {
    const { name, value } = e.target;
    setUnitData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addUnitToList = () => {
    if (!unitData.unit_number || !unitData.area) {
      setError('Please fill unit number and area');
      return;
    }
    setUnits([...units, { ...unitData, id: Date.now() }]);
    setUnitData({
      unit_number: '',
      unit_type: 'apartment',
      area: '',
      bedrooms: '0',
      bathrooms: '0',
      monthly_rent: '',
      status: 'vacant',
    });
    setShowUnitForm(false);
    setError('');
  };

  const removeUnit = (id) => {
    setUnits(units.filter(u => u.id !== id));
  };

  const handlePropertySubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Validate required fields
      if (!propertyData.property_id || !propertyData.name || !propertyData.street_address) {
        setError('Please fill in all required fields (ID, Name, Address)');
        setLoading(false);
        return;
      }

      const normalizedPropertyData = {
        ...propertyData,
        number_of_units: propertyData.number_of_units === '' ? null : parseInt(propertyData.number_of_units, 10),
        total_area: propertyData.total_area === '' ? null : parseFloat(propertyData.total_area),
        built_area: propertyData.built_area === '' ? null : parseFloat(propertyData.built_area),
        year_built: propertyData.year_built === '' ? null : parseInt(propertyData.year_built, 10),
        zip_code: propertyData.zip_code === '' ? null : propertyData.zip_code,
      };

      let propertyId;
      if (id) {
        // Update existing property
        await propertyService.update(id, normalizedPropertyData);
        propertyId = id;
        setSuccess('Property updated successfully!');
      } else {
        // Create new property
        const propertyRes = await propertyService.create(normalizedPropertyData);
        propertyId = propertyRes.data.id;
        setSuccess('Property created successfully!');
      }

      // Create new units (only non-existing ones)
      if (units.length > 0) {
        for (const unit of units) {
          const unitPayload = {
            property: propertyId,
            unit_number: unit.unit_number,
            unit_type: unit.unit_type,
            area: parseFloat(unit.area),
            bedrooms: parseInt(unit.bedrooms || 0),
            bathrooms: parseInt(unit.bathrooms || 0),
            monthly_rent: parseFloat(unit.monthly_rent || 0),
            status: unit.status,
          };
          
          // Only create if it's a new unit (no id from backend)
          if (!unit.created_at) {
            await unitService.create(unitPayload);
          }
        }
      }

      setTimeout(() => navigate('/properties'), 2000);
    } catch (err) {
      setError(err.response?.data?.detail || `Failed to ${id ? 'update' : 'create'} property`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="property-form-container mt-5">
      <Card className="property-form-card">
        <Card.Header className="bg-primary text-white">
          <h2 className="mb-0">
            <i className="fas fa-plus-circle me-2"></i>
            {id ? 'Edit' : 'Add New'} Property & Property Units
          </h2>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
            <Nav variant="pills" className="mb-4">
              <Nav.Item>
                <Nav.Link eventKey="property">
                  <i className="fas fa-home me-2"></i>
                  Property Details
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="units">
                  <i className="fas fa-cube me-2"></i>
                  Property Units ({units.length})
                </Nav.Link>
              </Nav.Item>
            </Nav>

            <Tab.Content>
              {/* Property Details Tab */}
              <Tab.Pane eventKey="property">
                <Form onSubmit={handlePropertySubmit}>
                  <h4 className="mb-4">Property Information</h4>
                  
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Property ID <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                          type="text"
                          name="property_id"
                          value={propertyData.property_id}
                          onChange={handlePropertyChange}
                          placeholder="e.g., PROP001"
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Property Name <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                          type="text"
                          name="name"
                          value={propertyData.name}
                          onChange={handlePropertyChange}
                          placeholder="e.g., Downtown Office Complex"
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      name="description"
                      value={propertyData.description}
                      onChange={handlePropertyChange}
                      placeholder="Property description"
                      rows={3}
                    />
                  </Form.Group>

                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Property Type</Form.Label>
                        <Form.Select
                          name="property_type"
                          value={propertyData.property_type}
                          onChange={handlePropertyChange}
                        >
                          <option value="residential">Residential</option>
                          <option value="commercial">Commercial</option>
                          <option value="industrial">Industrial</option>
                          <option value="land">Land</option>
                          <option value="mixed">Mixed Use</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Status</Form.Label>
                        <Form.Select
                          name="status"
                          value={propertyData.status}
                          onChange={handlePropertyChange}
                        >
                          <option value="available">Available</option>
                          <option value="occupied">Occupied</option>
                          <option value="maintenance">Under Maintenance</option>
                          <option value="leased">Leased</option>
                          <option value="sold">Sold</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Acquisition Date</Form.Label>
                        <Form.Control
                          type="date"
                          name="acquisition_date"
                          value={propertyData.acquisition_date}
                          onChange={handlePropertyChange}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <h4 className="mt-4 mb-4">Location Details</h4>

                  <Form.Group className="mb-3">
                    <Form.Label>Street Address <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      name="street_address"
                      value={propertyData.street_address}
                      onChange={handlePropertyChange}
                      placeholder="Full street address"
                      required
                    />
                  </Form.Group>

                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>City</Form.Label>
                        <Form.Control
                          type="text"
                          name="city"
                          value={propertyData.city}
                          onChange={handlePropertyChange}
                          placeholder="City"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>State</Form.Label>
                        <Form.Control
                          type="text"
                          name="state"
                          value={propertyData.state}
                          onChange={handlePropertyChange}
                          placeholder="State"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>ZIP Code</Form.Label>
                        <Form.Control
                          type="text"
                          name="zip_code"
                          value={propertyData.zip_code}
                          onChange={handlePropertyChange}
                          placeholder="ZIP Code"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Country</Form.Label>
                        <Form.Control
                          type="text"
                          name="country"
                          value={propertyData.country}
                          onChange={handlePropertyChange}
                          placeholder="Country"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <h4 className="mt-4 mb-4">Building Details</h4>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Year Built</Form.Label>
                        <Form.Control
                          type="number"
                          name="year_built"
                          value={propertyData.year_built}
                          onChange={handlePropertyChange}
                          placeholder="YYYY"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Total Area (sq m)</Form.Label>
                        <Form.Control
                          type="number"
                          name="total_area"
                          value={propertyData.total_area}
                          onChange={handlePropertyChange}
                          placeholder="0.00"
                          step="0.01"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Built Area (sq m)</Form.Label>
                        <Form.Control
                          type="number"
                          name="built_area"
                          value={propertyData.built_area}
                          onChange={handlePropertyChange}
                          placeholder="0.00"
                          step="0.01"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Number of Units</Form.Label>
                        <Form.Control
                          type="number"
                          name="number_of_units"
                          value={propertyData.number_of_units}
                          onChange={handlePropertyChange}
                          placeholder="0"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <div className="d-flex gap-2 mt-4">
                    <Button
                      variant="primary"
                      type="submit"
                      disabled={loading}
                      className="btn-lg"
                    >
                      {loading ? (
                        <>
                          <Spinner as="span" animation="border" size="sm" className="me-2" />
                          {id ? 'Updating...' : 'Creating...'}
                        </>
                      ) : (
                        <>
                          <i className="fas fa-save me-2"></i>
                          {id ? 'Update Property' : 'Create Property'}
                        </>
                      )}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => navigate('/properties')}
                      className="btn-lg"
                    >
                      <i className="fas fa-arrow-left me-2"></i>
                      Cancel
                    </Button>
                  </div>
                </Form>
              </Tab.Pane>

              {/* Units Tab */}
              <Tab.Pane eventKey="units">
                <div className="mb-4">
                  <h4 className="mb-3">Property Units</h4>
                  
                  {!id && (
                    <Alert variant="info" className="mb-3">
                      <i className="fas fa-info-circle me-2"></i>
                      Please save the property first before adding units. Units must be associated with a property.
                    </Alert>
                  )}
                  
                  {id && (
                    <>
                      <Button
                        variant="success"
                        onClick={() => setShowUnitForm(!showUnitForm)}
                        className="mb-3"
                      >
                        <i className="fas fa-plus me-2"></i>
                        {showUnitForm ? 'Cancel' : 'Add New Unit'}
                      </Button>

                      {showUnitForm && (
                        <Card className="mb-4 bg-light">
                          <Card.Body>
                            <h5>Add Unit</h5>
                            
                            <Alert variant="warning" className="mb-3">
                              <strong>Property:</strong> {propertyData.name} (ID: {propertyData.property_id})
                            </Alert>
                            
                            <Row>
                              <Col md={6}>
                                <Form.Group className="mb-3">
                                  <Form.Label>Unit Number <span className="text-danger">*</span></Form.Label>
                                  <Form.Control
                                    type="text"
                                    name="unit_number"
                                    value={unitData.unit_number}
                                    onChange={handleUnitChange}
                                    placeholder="e.g., 101, 102, Shop-A"
                                  />
                                </Form.Group>
                              </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Unit Type</Form.Label>
                              <Form.Select
                                name="unit_type"
                                value={unitData.unit_type}
                                onChange={handleUnitChange}
                              >
                                <option value="apartment">Apartment</option>
                                <option value="shop">Shop</option>
                                <option value="showroom">Showroom</option>
                                <option value="office">Office</option>
                                <option value="warehouse">Warehouse</option>
                                <option value="parking">Parking</option>
                                <option value="other">Other</option>
                              </Form.Select>
                            </Form.Group>
                          </Col>
                        </Row>

                        <Row>
                          <Col md={3}>
                            <Form.Group className="mb-3">
                              <Form.Label>Area (sq m) <span className="text-danger">*</span></Form.Label>
                              <Form.Control
                                type="number"
                                name="area"
                                value={unitData.area}
                                onChange={handleUnitChange}
                                placeholder="0.00"
                                step="0.01"
                              />
                            </Form.Group>
                          </Col>
                          <Col md={3}>
                            <Form.Group className="mb-3">
                              <Form.Label>Bedrooms</Form.Label>
                              <Form.Control
                                type="number"
                                name="bedrooms"
                                value={unitData.bedrooms}
                                onChange={handleUnitChange}
                                placeholder="0"
                              />
                            </Form.Group>
                          </Col>
                          <Col md={3}>
                            <Form.Group className="mb-3">
                              <Form.Label>Bathrooms</Form.Label>
                              <Form.Control
                                type="number"
                                name="bathrooms"
                                value={unitData.bathrooms}
                                onChange={handleUnitChange}
                                placeholder="0"
                              />
                            </Form.Group>
                          </Col>
                          <Col md={3}>
                            <Form.Group className="mb-3">
                              <Form.Label>Monthly Rent</Form.Label>
                              <Form.Control
                                type="number"
                                name="monthly_rent"
                                value={unitData.monthly_rent}
                                onChange={handleUnitChange}
                                placeholder="0.00"
                                step="0.01"
                              />
                            </Form.Group>
                          </Col>
                        </Row>

                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Status</Form.Label>
                              <Form.Select
                                name="status"
                                value={unitData.status}
                                onChange={handleUnitChange}
                              >
                                <option value="vacant">Vacant</option>
                                <option value="occupied">Occupied</option>
                                <option value="maintenance">Under Maintenance</option>
                              </Form.Select>
                            </Form.Group>
                          </Col>
                        </Row>

                        <Button variant="success" onClick={addUnitToList} className="me-2">
                          <i className="fas fa-check me-2"></i>
                          Add Unit
                        </Button>
                      </Card.Body>
                    </Card>
                  )}
                    </>
                  )}

                  {units.length > 0 ? (
                    <div className="units-list">
                      {units.map((unit) => (
                        <Card key={unit.id} className="mb-3">
                          <Card.Body>
                            <Row className="align-items-center">
                              <Col md={8}>
                                <h6 className="mb-1">
                                  <i className="fas fa-cube me-2"></i>
                                  Unit {unit.unit_number} - {unit.unit_type}
                                </h6>
                                <small className="text-muted">
                                  Area: {unit.area} sq m | Bedrooms: {unit.bedrooms} | Bathrooms: {unit.bathrooms} | Rent: ${unit.monthly_rent || 'N/A'}
                                </small>
                              </Col>
                              <Col md={4} className="text-end">
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => removeUnit(unit.id)}
                                >
                                  <i className="fas fa-trash me-1"></i>
                                  Remove
                                </Button>
                              </Col>
                            </Row>
                          </Card.Body>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Alert variant="info">
                      <i className="fas fa-info-circle me-2"></i>
                      No units added yet. Add units to define sub-properties.
                    </Alert>
                  )}
                </div>
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default PropertyForm;
