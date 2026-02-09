import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Login.css';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/auth/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        login(data.token, data.username);
        navigate('/', { replace: true });
      } else {
        setError(data.error || 'Invalid username or password');
      }
    } catch (err) {
      setError('Login failed. Please check your connection and try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Container className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="login-content">
          <Card className="login-card shadow">
            <Card.Body className="p-5">
              {/* Logo Section */}
              <div className="text-center mb-4">
                <div className="logo-icon">
                  <i className="fas fa-building"></i>
                </div>
                <h1 className="mt-3 mb-2">Property ERP</h1>
                <p className="text-muted">Management System</p>
              </div>

              {error && <Alert variant="danger">{error}</Alert>}

              <Form onSubmit={handleLogin}>
                <Form.Group className="mb-3">
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                    className="form-control-lg"
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="form-control-lg"
                  />
                </Form.Group>

                <Button
                  variant="primary"
                  type="submit"
                  disabled={loading || !username || !password}
                  className="w-100 btn-lg"
                >
                  {loading ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Logging in...
                    </>
                  ) : (
                    'Login'
                  )}
                </Button>
              </Form>

              <div className="mt-4 p-3 bg-light rounded">
                <p className="mb-1 text-muted small"><strong>Demo Credentials:</strong></p>
                <p className="mb-0 text-muted small">Username: <code>admin</code></p>
                <p className="mb-0 text-muted small">Password: <code>admin</code></p>
              </div>
            </Card.Body>
          </Card>

          <div className="text-center mt-4">
            <p className="text-muted">
              Property Management System &copy; 2026
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
}

export default Login;
