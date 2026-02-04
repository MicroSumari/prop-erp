import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Nav, Offcanvas } from 'react-bootstrap';
import './Sidebar.css';

function Sidebar({ show, handleClose }) {
  const [expandedSections, setExpandedSections] = useState({
    properties: true,
  });
  const location = useLocation();

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const isActive = (path) => location.pathname === path;

  const menuStructure = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'fas fa-chart-line',
      link: '/',
    },
    {
      id: 'properties',
      label: 'Properties',
      icon: 'fas fa-home',
      isCollapsible: true,
      subsections: [
        {
          label: 'Properties',
          icon: 'fas fa-list',
          link: '/properties',
        },
        {
          label: 'Property Units',
          icon: 'fas fa-cube',
          link: '/property-units',
        },
        {
          label: 'Related Parties',
          icon: 'fas fa-users',
          link: '/related-parties',
        },
      ],
    },
    {
      id: 'leasing',
      label: 'Leasing',
      icon: 'fas fa-file-contract',
      isCollapsible: true,
      subsections: [
        {
          label: 'Leases',
          icon: 'fas fa-file-contract',
          link: '/leases',
        },
        {
          label: 'Lease Renewal',
          icon: 'fas fa-sync-alt',
          link: '/lease-renewal',
        },
        {
          label: 'Lease Termination',
          icon: 'fas fa-times-circle',
          link: '/lease-termination',
        },
        {
          label: 'Rent Collection',
          icon: 'fas fa-dollar-sign',
          link: '/rent-collection',
        },
        {
          label: 'Receipt Vouchers',
          icon: 'fas fa-receipt',
          link: '/receipt-vouchers',
        },
      ],
    },
    {
      id: 'maintenance',
      label: 'Maintenance',
      icon: 'fas fa-tools',
      isCollapsible: true,
      subsections: [
        // {
        //   label: 'Maintenance Records',
        //   icon: 'fas fa-list',
        //   link: '/maintenance',
        // },
        {
          label: 'Maintenance Requests',
          icon: 'fas fa-wrench',
          link: '/maintenance/requests',
        },
        {
          label: 'Maintenance Contracts',
          icon: 'fas fa-file-contract',
          link: '/maintenance/contracts',
        },
      ],
    },
    {
      id: 'legal-cases',
      label: 'Legal Cases',
      icon: 'fas fa-gavel',
      link: '/legal-cases',
    },

    // {
    //   id: 'expenses',
    //   label: 'Expenses',
    //   icon: 'fas fa-receipt',
    //   link: '/expenses',
    // },
  ];

  const sidebarContent = (
    <Nav className="flex-column sidebar-nav">
      {menuStructure.map((item) => (
        <div key={item.id} className="nav-item-wrapper">
          {item.isCollapsible ? (
            <div>
              <button
                className={`sidebar-menu-btn ${
                  expandedSections[item.id] ? 'expanded' : ''
                }`}
                onClick={() => toggleSection(item.id)}
              >
                <span className="menu-icon">
                  <i className={item.icon}></i>
                </span>
                <span className="menu-label">{item.label}</span>
                <span className="expand-icon">
                  <i
                    className={`fas fa-chevron-${
                      expandedSections[item.id] ? 'down' : 'right'
                    }`}
                  ></i>
                </span>
              </button>
              {expandedSections[item.id] && (
                <div className="sidebar-subsections">
                  {item.subsections.map((subsection, idx) => (
                    <Link
                      key={idx}
                      to={subsection.link}
                      className={`sidebar-subsection-link ${
                        isActive(subsection.link) ? 'active' : ''
                      }`}
                      onClick={handleClose}
                    >
                      <span className="subsection-icon">
                        <i className={subsection.icon}></i>
                      </span>
                      <span>{subsection.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <Link
              to={item.link}
              className={`sidebar-menu-link ${isActive(item.link) ? 'active' : ''}`}
              onClick={handleClose}
            >
              <span className="menu-icon">
                <i className={item.icon}></i>
              </span>
              <span className="menu-label">{item.label}</span>
            </Link>
          )}
        </div>
      ))}
    </Nav>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="sidebar-desktop d-none d-lg-flex flex-column">
        <div className="sidebar-header">
          <h2 className="sidebar-title">Menu</h2>
        </div>
        <div className="sidebar-content">{sidebarContent}</div>
      </aside>

      {/* Mobile Offcanvas Sidebar */}
      <Offcanvas
        show={show}
        onHide={handleClose}
        placement="start"
        className="sidebar-offcanvas"
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Menu</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>{sidebarContent}</Offcanvas.Body>
      </Offcanvas>
    </>
  );
}

export default Sidebar;
