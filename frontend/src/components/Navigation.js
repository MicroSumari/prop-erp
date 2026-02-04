import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import './Navigation.css';

function Navigation({ onSidebarToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Navbar bg="white" expand="lg" className="navbar-custom shadow-sm" sticky="top">
      <Container fluid className="navbar-container">
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={onSidebarToggle}
          className="d-lg-none me-2 sidebar-toggle-btn"
          title="Toggle Sidebar"
        >
          <i className="fas fa-bars"></i>
        </Button>
        <Navbar.Brand as={Link} to="/" className="brand">
          <i className="fas fa-building me-2"></i>
          Property ERP
        </Navbar.Brand>
        <Navbar.Collapse className="ms-auto">
          <Nav className="ms-auto navbar-right-section">
            <Nav.Link className="nav-user-info">
              <i className="fas fa-user me-1"></i>
              {user?.username}
            </Nav.Link>
            <Button
              variant="outline-danger"
              size="sm"
              onClick={handleLogout}
              className="ms-2"
            >
              <i className="fas fa-sign-out-alt me-1"></i>
              Logout
            </Button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default Navigation;

