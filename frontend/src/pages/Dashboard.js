import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Alert, Spinner } from 'react-bootstrap';
import { propertyService, tenantService, maintenanceService, rentService } from '../services/propertyService';
import './Dashboard.css';

function Dashboard() {
  const [stats, setStats] = useState({
    totalProperties: 0,
    occupiedUnits: 0,
    pendingMaintenance: 0,
    unpaidRent: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [propertiesRes, tenantsRes, maintenanceRes, rentRes] = await Promise.all([
          propertyService.getAll(),
          tenantService.getAll(),
          maintenanceService.getAll(),
          rentService.getAll(),
        ]);

        // Handle paginated responses from Django REST Framework
        const propertiesData = Array.isArray(propertiesRes.data) ? propertiesRes.data : (propertiesRes.data.results || propertiesRes.data.data || []);
        const tenantsData = Array.isArray(tenantsRes.data) ? tenantsRes.data : (tenantsRes.data.results || tenantsRes.data.data || []);
        const maintenanceData = Array.isArray(maintenanceRes.data) ? maintenanceRes.data : (maintenanceRes.data.results || maintenanceRes.data.data || []);
        const rentData = Array.isArray(rentRes.data) ? rentRes.data : (rentRes.data.results || rentRes.data.data || []);

        if (isMounted) {
          setStats({
            totalProperties: Array.isArray(propertiesData) ? propertiesData.length : 0,
            occupiedUnits: Array.isArray(tenantsData) ? tenantsData.filter(t => t.unit).length : 0,
            pendingMaintenance: Array.isArray(maintenanceData) ? maintenanceData.filter(m => m.status === 'pending').length : 0,
            unpaidRent: Array.isArray(rentData) ? rentData.filter(r => r.status !== 'paid').length : 0,
          });
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to load dashboard data. Please try again.');
          console.error('Dashboard error:', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container fluid className="dashboard">
      <div className="dashboard-header mb-4">
        <h1>Dashboard</h1>
        <p className="text-muted">Welcome to Property Management System</p>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col lg={3} md={6} className="mb-3">
          <Card className="stat-card">
            <Card.Body>
              <div className="stat-content">
                <i className="fas fa-building stat-icon"></i>
                <div>
                  <h3 className="stat-number">{stats.totalProperties}</h3>
                  <p className="stat-label">Total Properties</p>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6} className="mb-3">
          <Card className="stat-card">
            <Card.Body>
              <div className="stat-content">
                <i className="fas fa-user stat-icon"></i>
                <div>
                  <h3 className="stat-number">{stats.occupiedUnits}</h3>
                  <p className="stat-label">Occupied Units</p>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6} className="mb-3">
          <Card className="stat-card">
            <Card.Body>
              <div className="stat-content">
                <i className="fas fa-tools stat-icon"></i>
                <div>
                  <h3 className="stat-number">{stats.pendingMaintenance}</h3>
                  <p className="stat-label">Pending Maintenance</p>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6} className="mb-3">
          <Card className="stat-card">
            <Card.Body>
              <div className="stat-content">
                <i className="fas fa-dollar-sign stat-icon"></i>
                <div>
                  <h3 className="stat-number">{stats.unpaidRent}</h3>
                  <p className="stat-label">Unpaid Rent</p>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header className="bg-light">
              <h5 className="mb-0">Quick Actions</h5>
            </Card.Header>
            <Card.Body>
              <span className="text-muted">No quick actions configured.</span>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Dashboard;
