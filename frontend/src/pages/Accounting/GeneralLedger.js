import React, { useEffect, useState } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Form, 
  Row, 
  Col, 
  Alert, 
  Container,
  InputGroup,
  FormControl,
  Pagination,
  Badge,
  Spinner,
  Modal
} from 'react-bootstrap';
import apiClient from '../../services/api';

const GeneralLedger = () => {
  const [accounts, setAccounts] = useState([]);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showView, setShowView] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ 
    account_id: '', 
    start_date: '', 
    end_date: '',
    entry_type: '',
    reference_type: '',
  });
  
  // Summary totals
  const [summary, setSummary] = useState({
    totalDebit: 0,
    totalCredit: 0,
    balance: 0,
    entryCount: 0,
    runningBalance: 0
  });
  
  // Entry types for filter
  const entryTypes = [
    { value: '', label: 'All Entry Types' },
    { value: 'manual', label: 'Manual Journal' },
    { value: 'receipt', label: 'Receipt' },
    { value: 'payment', label: 'Payment' },
    { value: 'invoice', label: 'Invoice' },
    { value: 'purchase', label: 'Purchase' },
  ];
  
  // Reference types for filter
  const referenceTypes = [
    { value: '', label: 'All Reference Types' },
    { value: 'receipt_voucher', label: 'Receipt Voucher' },
    { value: 'payment_voucher', label: 'Payment Voucher' },
    { value: 'supplier_invoice', label: 'Supplier Invoice' },
    { value: 'customer_invoice', label: 'Customer Invoice' },
    { value: 'manual_journal', label: 'Manual Journal' },
  ];

  // Fetch accounts on component mount
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await apiClient.get('/accounts/accounts/');
        const list = Array.isArray(res.data) ? res.data : (res.data?.results || []);
        setAccounts(list);
      } catch (err) {
        setError('Failed to load accounts');
      }
    };
    fetchAccounts();
  }, []);

  // Build query parameters for API
  const buildQueryParams = () => {
    const params = {
      page: currentPage,
      page_size: itemsPerPage,
    };
    
    if (filters.account_id) params.account_id = filters.account_id;
    if (filters.start_date) params.start_date = filters.start_date;
    if (filters.end_date) params.end_date = filters.end_date;
    if (searchQuery) params.search = searchQuery;
    if (filters.entry_type) params.entry_type = filters.entry_type;
    if (filters.reference_type) params.reference_type = filters.reference_type;
    
    return params;
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const queryParams = buildQueryParams();
      
      const res = await apiClient.get('/accounts/journal-lines/general_ledger/', { params: queryParams });
      
      // Handle response - check for paginated structure
      let data = [];
      let totalCount = 0;
      
      if (res.data.results) {
        // Paginated response
        data = res.data.results;
        totalCount = res.data.count || 0;
        setTotalPages(Math.ceil(totalCount / itemsPerPage));
      } else {
        // Non-paginated response (array)
        data = Array.isArray(res.data) ? res.data : [];
        totalCount = data.length;
        setTotalPages(1);
      }
      
      setRows(data);
      setTotalItems(totalCount);
      
      // Calculate summary totals
      calculateSummary(data);
      
      setError('');
    } catch (err) {
      console.error('API Error:', err.response?.data || err.message);
      setError(err.response?.data?.error || 'Failed to load general ledger');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate summary totals
  const calculateSummary = (data) => {
    let totalDebit = 0;
    let totalCredit = 0;
    let runningBalance = 0;
    
    data.forEach(row => {
      totalDebit += parseFloat(row.debit || 0);
      totalCredit += parseFloat(row.credit || 0);
      runningBalance += parseFloat(row.debit || 0) - parseFloat(row.credit || 0);
    });
    
    const balance = totalDebit - totalCredit;
    
    setSummary({
      totalDebit,
      totalCredit,
      balance,
      entryCount: data.length,
      runningBalance
    });
  };

  // Fetch data when filters or pagination change
  useEffect(() => {
    if (filters.account_id || (filters.start_date && filters.end_date)) {
      fetchData();
    }
  }, [currentPage, filters.entry_type, filters.reference_type]);

  // Debounced search
  useEffect(() => {
    if (searchQuery !== undefined && (filters.account_id || (filters.start_date && filters.end_date))) {
      setCurrentPage(1);
      const delayDebounceFn = setTimeout(() => {
        fetchData();
      }, 500);

      return () => clearTimeout(delayDebounceFn);
    }
  }, [searchQuery]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const clearFilters = () => {
    setFilters({
      account_id: '',
      start_date: '',
      end_date: '',
      entry_type: '',
      reference_type: '',
    });
    setSearchQuery('');
    setRows([]);
    setSummary({
      totalDebit: 0,
      totalCredit: 0,
      balance: 0,
      entryCount: 0,
      runningBalance: 0
    });
    setTotalItems(0);
    setTotalPages(1);
    setCurrentPage(1);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const getEntryTypeBadge = (type) => {
    const variants = {
      manual: 'secondary',
      receipt: 'success',
      payment: 'danger',
      invoice: 'info',
      purchase: 'warning',
    };
    return <Badge bg={variants[type] || 'primary'}>{type}</Badge>;
  };

  const getReferenceBadge = (type) => {
    const variants = {
      receipt_voucher: 'success',
      payment_voucher: 'danger',
      supplier_invoice: 'warning',
      customer_invoice: 'info',
      manual_journal: 'secondary',
    };
    return <Badge bg={variants[type] || 'primary'}>{type?.replace('_', ' ') || 'N/A'}</Badge>;
  };

  // Generate pagination items
  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // First page
    if (startPage > 1) {
      items.push(
        <Pagination.Item key={1} onClick={() => setCurrentPage(1)}>
          1
        </Pagination.Item>
      );
      if (startPage > 2) {
        items.push(<Pagination.Ellipsis key="ellipsis-start" />);
      }
    }
    
    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <Pagination.Item
          key={i}
          active={i === currentPage}
          onClick={() => setCurrentPage(i)}
        >
          {i}
        </Pagination.Item>
      );
    }
    
    // Last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(<Pagination.Ellipsis key="ellipsis-end" />);
      }
      items.push(
        <Pagination.Item
          key={totalPages}
          onClick={() => setCurrentPage(totalPages)}
        >
          {totalPages}
        </Pagination.Item>
      );
    }
    
    return items;
  };

  const handleExport = () => {
    // Simple CSV export
    const headers = ['Date', 'Entry Type', 'Reference', 'Account', 'Debit', 'Credit', 'Cost Center'];
    const csvData = rows.map(row => [
      row.entry_date,
      row.entry_type,
      `${row.reference_type || ''} #${row.reference_id || ''}`,
      `${row.account_number} - ${row.account_name}`,
      parseFloat(row.debit || 0).toFixed(2),
      parseFloat(row.credit || 0).toFixed(2),
      row.cost_center || ''
    ]);
    
    // Add summary row
    csvData.push([
      'TOTALS',
      '',
      '',
      '',
      summary.totalDebit.toFixed(2),
      summary.totalCredit.toFixed(2),
      `Balance: ${summary.balance.toFixed(2)}`
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `general-ledger-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    setSuccess('General ledger exported successfully');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleViewEntry = (entry) => {
    setSelectedEntry(entry);
    setShowView(true);
  };

  const getSelectedAccount = () => {
    if (!filters.account_id) return null;
    return accounts.find(acc => acc.id == filters.account_id);
  };

  const selectedAccount = getSelectedAccount();

  return (
    <Container fluid>
      <div className="page-header mb-4">
        <h1>
          <i className="fas fa-book-open me-2"></i>
          General Ledger
        </h1>
        <div className="text-muted small">
          Detailed transaction history for each account
        </div>
      </div>
      
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          <i className="fas fa-exclamation-circle me-2"></i>
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess('')}>
          <i className="fas fa-check-circle me-2"></i>
          {success}
        </Alert>
      )}

      {/* Filter Card */}
      <Card className="mb-4">
        <Card.Header>
          <i className="fas fa-filter me-2"></i>
          Filters
        </Card.Header>
        <Card.Body>
          <Row className="mb-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label>Account</Form.Label>
                <Form.Select 
                  value={filters.account_id} 
                  onChange={(e) => handleFilterChange('account_id', e.target.value)}
                >
                  <option value="">All Accounts</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.account_number} - {a.account_name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Start Date</Form.Label>
                <Form.Control 
                  type="date" 
                  value={filters.start_date} 
                  onChange={(e) => handleFilterChange('start_date', e.target.value)}
                  max={filters.end_date || undefined}
                />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>End Date</Form.Label>
                <Form.Control 
                  type="date" 
                  value={filters.end_date} 
                  onChange={(e) => handleFilterChange('end_date', e.target.value)}
                  min={filters.start_date || undefined}
                />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Entry Type</Form.Label>
                <Form.Select 
                  value={filters.entry_type} 
                  onChange={(e) => handleFilterChange('entry_type', e.target.value)}
                >
                  {entryTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2} className="d-flex align-items-end">
              <div className="d-flex gap-2 w-100">
                <Button 
                  variant="primary" 
                  onClick={fetchData}
                  disabled={!filters.account_id && (!filters.start_date || !filters.end_date)}
                  className="flex-grow-1"
                >
                  {isLoading ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Loading...
                    </>
                  ) : (
                    'Load Ledger'
                  )}
                </Button>
                <Button variant="outline-secondary" onClick={clearFilters} title="Clear all filters">
                  <i className="fas fa-times"></i>
                </Button>
              </div>
            </Col>
          </Row>
          
          <Row>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Reference Type</Form.Label>
                <Form.Select 
                  value={filters.reference_type} 
                  onChange={(e) => handleFilterChange('reference_type', e.target.value)}
                >
                  {referenceTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={9} className="d-flex align-items-end">
              {selectedAccount && (
                <div className="w-100">
                  <div className="border rounded p-3 bg-light">
                    <div className="d-flex justify-content-between">
                      <div>
                        <strong>Selected Account:</strong> {selectedAccount.account_number} - {selectedAccount.account_name}
                      </div>
                      <div>
                        <strong>Type:</strong> <Badge bg="info">{selectedAccount.account_type}</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Search and Summary Card */}
      {rows.length > 0 && (
        <Card className="mb-4">
          <Card.Header>
            <i className="fas fa-chart-line me-2"></i>
            Search & Summary
          </Card.Header>
          <Card.Body>
            <Row className="mb-3">
              <Col md={6}>
                <InputGroup>
                  <InputGroup.Text>
                    <i className="fas fa-search"></i>
                  </InputGroup.Text>
                  <FormControl
                    placeholder="Search by reference, account, or description..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                  />
                </InputGroup>
              </Col>
              <Col md={6} className="d-flex align-items-center justify-content-end">
                <Button variant="outline-success" onClick={handleExport}>
                  <i className="fas fa-file-export me-2"></i>
                  Export CSV
                </Button>
              </Col>
            </Row>
            
            <Row>
              <Col md={3}>
                <Card className="text-center">
                  <Card.Body>
                    <h6 className="text-muted mb-2">Total Entries</h6>
                    <h3 className="mb-0">{summary.entryCount}</h3>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="text-center border-success">
                  <Card.Body>
                    <h6 className="text-muted mb-2">Total Debit</h6>
                    <h3 className="text-success mb-0">{formatCurrency(summary.totalDebit)}</h3>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="text-center border-danger">
                  <Card.Body>
                    <h6 className="text-muted mb-2">Total Credit</h6>
                    <h3 className="text-danger mb-0">{formatCurrency(summary.totalCredit)}</h3>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className={`text-center ${summary.balance === 0 ? 'border-success' : 'border-warning'}`}>
                  <Card.Body>
                    <h6 className="text-muted mb-2">Net Balance</h6>
                    <h3 className={summary.balance === 0 ? 'text-success mb-0' : 'text-warning mb-0'}>
                      {formatCurrency(summary.balance)}
                    </h3>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
            
            {selectedAccount && (
              <Row className="mt-3">
                <Col md={12}>
                  <div className="text-center">
                    <div className="alert alert-info mb-0">
                      <i className="fas fa-info-circle me-2"></i>
                      <strong>Account Running Balance:</strong> 
                      <span className={`ms-2 ${summary.runningBalance >= 0 ? 'text-success' : 'text-danger'}`}>
                        {formatCurrency(summary.runningBalance)}
                        {summary.runningBalance >= 0 ? ' (Debit Balance)' : ' (Credit Balance)'}
                      </span>
                    </div>
                  </div>
                </Col>
              </Row>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Main Table Card */}
      {rows.length > 0 && (
        <Card>
          <Card.Header className="d-flex justify-content-between align-items-center">
            <div>
              <i className="fas fa-list-alt me-2"></i>
              Ledger Entries
              {isLoading && <span className="ms-2"><Spinner animation="border" size="sm" /></span>}
            </div>
            <div className="text-muted">
              Page {currentPage} of {totalPages} • {itemsPerPage} entries per page
            </div>
          </Card.Header>
          <Card.Body>
            <div className="table-responsive">
              <Table striped bordered hover className="mb-0">
                <thead className="table-dark">
                  <tr>
                    <th width="10%">Date</th>
                    <th width="12%">Entry Type</th>
                    <th width="15%">Reference</th>
                    <th width="25%">Account</th>
                    <th width="12%" className="text-end">Debit</th>
                    <th width="12%" className="text-end">Credit</th>
                    <th width="8%">Cost Center</th>
                    <th width="6%">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => {
                    const runningBalance = rows.slice(0, index + 1).reduce((sum, r) => {
                      return sum + parseFloat(r.debit || 0) - parseFloat(r.credit || 0);
                    }, 0);
                    
                    return (
                      <tr key={`${row.entry_id}-${index}`}>
                        <td>
                          <div className="small">{formatDate(row.entry_date)}</div>
                        </td>
                        <td>
                          {getEntryTypeBadge(row.entry_type)}
                        </td>
                        <td>
                          <div className="d-flex flex-column">
                            <span>{getReferenceBadge(row.reference_type)}</span>
                            <small className="text-muted">ID: {row.reference_id}</small>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex flex-column">
                            <span><strong>{row.account_number}</strong> - {row.account_name}</span>
                            <small className="text-muted">Entry ID: {row.entry_id}</small>
                          </div>
                        </td>
                        <td className="text-end">
                          {parseFloat(row.debit || 0) > 0 ? (
                            <span className="text-success fw-bold">
                              {formatCurrency(row.debit)}
                            </span>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td className="text-end">
                          {parseFloat(row.credit || 0) > 0 ? (
                            <span className="text-danger fw-bold">
                              {formatCurrency(row.credit)}
                            </span>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td>
                          {row.cost_center ? (
                            <Badge bg="secondary">{row.cost_center}</Badge>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td className="text-center">
                          <Button
                            variant="info"
                            size="sm"
                            onClick={() => handleViewEntry(row)}
                            title="View details"
                          >
                            <i className="fas fa-eye"></i>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="table-active">
                  <tr>
                    <td colSpan="4" className="text-end fw-bold">
                      GRAND TOTALS
                    </td>
                    <td className="text-end fw-bold text-success">
                      {formatCurrency(summary.totalDebit)}
                    </td>
                    <td className="text-end fw-bold text-danger">
                      {formatCurrency(summary.totalCredit)}
                    </td>
                    <td colSpan="2" className="text-center fw-bold">
                      <span className={summary.balance === 0 ? 'text-success' : 'text-warning'}>
                        Net: {formatCurrency(summary.balance)}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </Table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-center mt-4">
                <Pagination>
                  <Pagination.First 
                    onClick={() => setCurrentPage(1)} 
                    disabled={currentPage === 1}
                    title="First Page"
                  />
                  <Pagination.Prev 
                    onClick={() => setCurrentPage(currentPage - 1)} 
                    disabled={currentPage === 1}
                    title="Previous Page"
                  />
                  {renderPaginationItems()}
                  <Pagination.Next 
                    onClick={() => setCurrentPage(currentPage + 1)} 
                    disabled={currentPage === totalPages}
                    title="Next Page"
                  />
                  <Pagination.Last 
                    onClick={() => setCurrentPage(totalPages)} 
                    disabled={currentPage === totalPages}
                    title="Last Page"
                  />
                </Pagination>
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Empty State - No filters selected */}
      {!filters.account_id && !filters.start_date && !filters.end_date && rows.length === 0 && !isLoading && (
        <Card>
          <Card.Body className="text-center py-5">
            <div className="mb-4">
              <i className="fas fa-filter fa-4x text-muted"></i>
            </div>
            <h4 className="text-muted mb-3">Select Filters</h4>
            <p className="text-muted mb-4">
              Please select an account or date range to view the general ledger.
            </p>
            <div className="d-flex justify-content-center gap-3">
              <div className="text-start">
                <div className="mb-2">
                  <i className="fas fa-check-circle text-success me-2"></i>
                  <span>Select an account to see all transactions for that account</span>
                </div>
                <div className="mb-2">
                  <i className="fas fa-check-circle text-success me-2"></i>
                  <span>Select date range to see all transactions within that period</span>
                </div>
                <div>
                  <i className="fas fa-check-circle text-success me-2"></i>
                  <span>Combine filters for more specific results</span>
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* No Results State */}
      {(filters.account_id || (filters.start_date && filters.end_date)) && rows.length === 0 && !isLoading && (
        <Card>
          <Card.Body className="text-center py-5">
            <div className="mb-4">
              <i className="fas fa-search fa-4x text-muted"></i>
            </div>
            <h4 className="text-muted mb-3">No Ledger Entries Found</h4>
            <p className="text-muted mb-4">
              No journal entries were found for the selected filters. 
              {searchQuery && ` No entries match "${searchQuery}".`}
            </p>
            <Button variant="outline-primary" onClick={clearFilters}>
              <i className="fas fa-redo me-2"></i>
              Try Different Filters
            </Button>
          </Card.Body>
        </Card>
      )}

      {/* View Entry Modal */}
      <Modal show={showView} onHide={() => setShowView(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Ledger Entry Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedEntry && (
            <Row>
              <Col md={6}>
                <Card className="mb-3">
                  <Card.Header>Transaction Details</Card.Header>
                  <Card.Body>
                    <table className="table table-borderless">
                      <tbody>
                        <tr>
                          <td><strong>Entry ID:</strong></td>
                          <td><Badge bg="secondary">#{selectedEntry.entry_id}</Badge></td>
                        </tr>
                        <tr>
                          <td><strong>Entry Date:</strong></td>
                          <td>{formatDate(selectedEntry.entry_date)}</td>
                        </tr>
                        <tr>
                          <td><strong>Entry Type:</strong></td>
                          <td>{getEntryTypeBadge(selectedEntry.entry_type)}</td>
                        </tr>
                        <tr>
                          <td><strong>Reference Type:</strong></td>
                          <td>{getReferenceBadge(selectedEntry.reference_type)}</td>
                        </tr>
                        <tr>
                          <td><strong>Reference ID:</strong></td>
                          <td>{selectedEntry.reference_id}</td>
                        </tr>
                      </tbody>
                    </table>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6}>
                <Card className="mb-3">
                  <Card.Header>Accounting Details</Card.Header>
                  <Card.Body>
                    <table className="table table-borderless">
                      <tbody>
                        <tr>
                          <td><strong>Account:</strong></td>
                          <td>{selectedEntry.account_number} - {selectedEntry.account_name}</td>
                        </tr>
                        <tr>
                          <td><strong>Account ID:</strong></td>
                          <td>{selectedEntry.account_id}</td>
                        </tr>
                        <tr>
                          <td><strong>Debit Amount:</strong></td>
                          <td className="text-success fw-bold">
                            {parseFloat(selectedEntry.debit || 0) > 0 ? formatCurrency(selectedEntry.debit) : '-'}
                          </td>
                        </tr>
                        <tr>
                          <td><strong>Credit Amount:</strong></td>
                          <td className="text-danger fw-bold">
                            {parseFloat(selectedEntry.credit || 0) > 0 ? formatCurrency(selectedEntry.credit) : '-'}
                          </td>
                        </tr>
                        <tr>
                          <td><strong>Cost Center:</strong></td>
                          <td>{selectedEntry.cost_center || 'N/A'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowView(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default GeneralLedger;