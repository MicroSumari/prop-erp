import React from 'react';
import { Modal, Button, Spinner } from 'react-bootstrap';

/**
 * FormModal - A reusable modal component for form submissions
 * Shows loading spinner during operation and success message on completion
 * 
 * @param {boolean} show - Controls modal visibility
 * @param {boolean} loading - Shows spinner when true, success message when false
 * @param {string} message - Success message to display
 * @param {function} onHide - Callback when modal is closed
 */
function FormModal({ show, loading, message, onHide }) {
  return (
    <Modal show={show} onHide={loading ? null : onHide} centered backdrop={loading ? 'static' : true} keyboard={!loading}>
      <Modal.Body className="text-center py-4">
        {loading ? (
          <>
            <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
            <div className="mt-3">
              <h5>Processing...</h5>
              <p className="text-muted mb-0">Please wait while we save your data</p>
            </div>
          </>
        ) : (
          <>
            <div className="text-success mb-3">
              <i className="fas fa-check-circle" style={{ fontSize: '4rem' }}></i>
            </div>
            <h5>Success!</h5>
            <p className="text-muted mb-0">{message || 'Operation completed successfully'}</p>
          </>
        )}
      </Modal.Body>
      {!loading && (
        <Modal.Footer className="border-0 pt-0">
          <Button variant="primary" onClick={onHide} className="w-100">
            Close
          </Button>
        </Modal.Footer>
      )}
    </Modal>
  );
}

export default FormModal;
