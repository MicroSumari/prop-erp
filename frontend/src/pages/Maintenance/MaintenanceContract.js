import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Button, Alert, Table, Modal, Badge } from 'react-bootstrap';
import apiClient from '../../services/api';


const MaintenanceContract = () => {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [pendingActivationId, setPendingActivationId] = useState(null);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      const response = await apiClient.get('/maintenance/contracts/');
      setContracts(response.data.results || response.data);
    } catch (err) {
      setError('Failed to load contracts');
    }
  };


  const handleActivate = async (contractId) => {
    try {
      setLoading(true);
      await apiClient.post(`/maintenance/contracts/${contractId}/activate/`);
      setSuccess('Contract activated successfully');
      fetchContracts();
    } catch (err) {
      setError('Failed to activate contract');
    } finally {
      setLoading(false);
      setShowActivateModal(false);
      setPendingActivationId(null);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      draft: 'secondary',
      active: 'success',
      completed: 'primary',
    };
    return map[status] || 'secondary';
  };

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Maintenance Contracts</h1>
          <p className="text-muted">Manage prepaid maintenance contracts</p>
        </div>
        <Button variant="primary" onClick={() => navigate('/maintenance/contracts/new')}>
          <i className="fas fa-plus me-2"></i>
          New Contract
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Card>
        <Card.Body>
          <Table responsive hover>
            <thead>
              <tr>
                <th>ID</th>
                <th>Supplier</th>
                <th>Property</th>
                <th>Unit</th>
                <th>Total Amount</th>
                <th>Duration</th>
                <th>Amortized</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {contracts.length > 0 ? (
                contracts.map((contract) => (
                  <tr key={contract.id}>
                    <td>{contract.id}</td>
                    <td>{contract.supplier_name || contract.supplier}</td>
                    <td>{contract.property_name || contract.property}</td>
                    <td>{contract.unit_number || '—'}</td>
                    <td>SAR {parseFloat(contract.total_amount).toFixed(2)}</td>
                    <td>{contract.duration_months}</td>
                    <td>SAR {parseFloat(contract.amortized_amount).toFixed(2)}</td>
                    <td>
                      <Badge bg={getStatusBadge(contract.status)}>
                        {contract.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td>
                      <Button
                        size="sm"
                        variant="info"
                        onClick={() => navigate(`/maintenance/contracts/${contract.id}`)}
                        className="me-2"
                        title="View contract details"
                      >
                        <i className="fas fa-eye"></i>
                      </Button>
                      {contract.status === 'draft' && (
                        <>
                          <Button
                            size="sm"
                            variant="warning"
                            onClick={() => navigate(`/maintenance/contracts/edit/${contract.id}`)}
                            className="me-2"
                            title="Edit this contract"
                          >
                            <i className="fas fa-edit"></i>
                          </Button>
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => {
                              setPendingActivationId(contract.id);
                              setShowActivateModal(true);
                            }}
                            title="Activate contract"
                          >
                            <i className="fas fa-check-circle"></i>
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="text-center text-muted">No contracts found</td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal show={showActivateModal} onHide={() => setShowActivateModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Activate Contract</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Activating this contract will post accounting entries. Are you sure you want to proceed?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowActivateModal(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={() => handleActivate(pendingActivationId)}>
            Confirm Activation
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default MaintenanceContract;
