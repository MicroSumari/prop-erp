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
        <Spinner animation="border" variant="primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3 text-muted">Loading dashboard...</p>
      </Container>
    );
  }

  return (
    <Container fluid className="dashboard p-4">
      <div className="dashboard-header mb-4">
        <h1 className="dashboard-title mb-2">Dashboard</h1>
        <p className="dashboard-subtitle text-muted">Welcome to Property Management System</p>
      </div>

      {error && <Alert variant="danger" className="alert-animate">{error}</Alert>}

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col lg={3} md={6} className="mb-3">
          <Card className="stat-card stat-card-1 shadow-sm hover-lift">
            <Card.Body className="p-4">
              <div className="stat-content d-flex align-items-center">
                <div className="stat-icon-wrapper me-3">
                  <i className="fas fa-building stat-icon"></i>
                </div>
                <div>
                  <h3 className="stat-number mb-1">{stats.totalProperties}</h3>
                  <p className="stat-label mb-0">Total Properties</p>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6} className="mb-3">
          <Card className="stat-card stat-card-2 shadow-sm hover-lift">
            <Card.Body className="p-4">
              <div className="stat-content d-flex align-items-center">
                <div className="stat-icon-wrapper me-3">
                  <i className="fas fa-user stat-icon"></i>
                </div>
                <div>
                  <h3 className="stat-number mb-1">{stats.occupiedUnits}</h3>
                  <p className="stat-label mb-0">Occupied Units</p>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6} className="mb-3">
          <Card className="stat-card stat-card-3 shadow-sm hover-lift">
            <Card.Body className="p-4">
              <div className="stat-content d-flex align-items-center">
                <div className="stat-icon-wrapper me-3">
                  <i className="fas fa-tools stat-icon"></i>
                </div>
                <div>
                  <h3 className="stat-number mb-1">{stats.pendingMaintenance}</h3>
                  <p className="stat-label mb-0">Pending Maintenance</p>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6} className="mb-3">
          <Card className="stat-card stat-card-4 shadow-sm hover-lift">
            <Card.Body className="p-4">
              <div className="stat-content d-flex align-items-center">
                <div className="stat-icon-wrapper me-3">
                  <i className="fas fa-dollar-sign stat-icon"></i>
                </div>
                <div>
                  <h3 className="stat-number mb-1">{stats.unpaidRent}</h3>
                  <p className="stat-label mb-0">Unpaid Rent</p>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-light py-3">
              <h5 className="mb-0">Quick Actions</h5>
            </Card.Header>
            <Card.Body className="p-4">
              <span className="text-muted">No quick actions configured.</span>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Dashboard;