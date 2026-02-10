import React, { useState, useEffect } from 'react';
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
  Spinner
} from 'react-bootstrap';
import apiClient from '../../services/api';

const TrialBalance = () => {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ 
    start_date: '', 
    end_date: '',
    account_type: '',
  });
  
  // Summary totals
  const [summary, setSummary] = useState({
    totalDebit: 0,
    totalCredit: 0,
    balance: 0,
    accountCount: 0,
    dateRange: {
      start_date: '',
      end_date: ''
    }
  });
  
  // Account types for filter
  const accountTypes = [
    { value: '', label: 'All Account Types' },
    { value: 'asset', label: 'Assets' },
    { value: 'liability', label: 'Liabilities' },
    { value: 'equity', label: 'Equity' },
    { value: 'revenue', label: 'Revenue' },
    { value: 'expense', label: 'Expenses' },
  ];

  // Build query parameters for API
  const buildQueryParams = () => {
    const params = {
      page: currentPage,
      page_size: itemsPerPage,
    };
    
    if (filters.start_date) params.start_date = filters.start_date;
    if (filters.end_date) params.end_date = filters.end_date;
    if (searchQuery) params.search = searchQuery;
    if (filters.account_type) params.account_type = filters.account_type;
    
    return params;
  };

  const fetchData = async () => {
    if (!filters.start_date || !filters.end_date) {
      setError('Please select both start and end dates');
      return;
    }
    
    setIsLoading(true);
    try {
      const queryParams = buildQueryParams();
      
      const res = await apiClient.get('/accounts/journal-lines/trial_balance/', { params: queryParams });
      
      // Handle response - check for paginated structure
      let data = [];
      let totalCount = 0;
      let responseSummary = {};
      
      if (res.data.results) {
        // Paginated response
        data = res.data.results;
        totalCount = res.data.count || 0;
        responseSummary = res.data.summary || {};
        setTotalPages(Math.ceil(totalCount / itemsPerPage));
      } else if (res.data.summary) {
        // Non-paginated response with summary
        data = res.data.results || [];
        totalCount = data.length;
        responseSummary = res.data.summary || {};
        setTotalPages(1);
      } else {
        // Legacy response (array)
        data = Array.isArray(res.data) ? res.data : [];
        totalCount = data.length;
        setTotalPages(1);
        
        // Calculate summary from data
        const calculatedSummary = calculateSummaryFromData(data);
        responseSummary = {
          total_debit: calculatedSummary.totalDebit,
          total_credit: calculatedSummary.totalCredit,
          balance: calculatedSummary.balance,
          account_count: data.length,
          date_range: {
            start_date: filters.start_date,
            end_date: filters.end_date
          }
        };
      }
      
      setRows(data);
      setTotalItems(totalCount);
      
      // Update summary from API response
      if (responseSummary) {
        setSummary({
          totalDebit: responseSummary.total_debit || 0,
          totalCredit: responseSummary.total_credit || 0,
          balance: responseSummary.balance || 0,
          accountCount: responseSummary.account_count || data.length,
          dateRange: responseSummary.date_range || {
            start_date: filters.start_date,
            end_date: filters.end_date
          }
        });
      }
      
      setError('');
    } catch (err) {
      console.error('API Error:', err.response?.data || err.message);
      setError(err.response?.data?.error || 'Failed to load trial balance');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to calculate summary from data array
  const calculateSummaryFromData = (data) => {
    let totalDebit = 0;
    let totalCredit = 0;
    
    data.forEach(row => {
      totalDebit += parseFloat(row.total_debit || 0);
      totalCredit += parseFloat(row.total_credit || 0);
    });
    
    const balance = Math.abs(totalDebit - totalCredit);
    
    return {
      totalDebit,
      totalCredit,
      balance,
      accountCount: data.length
    };
  };

  // Fetch data when filters or pagination change
  useEffect(() => {
    if (filters.start_date && filters.end_date) {
      fetchData();
    }
  }, [currentPage, filters.account_type]);

  // Debounced search
  useEffect(() => {
    if (searchQuery !== undefined && filters.start_date && filters.end_date) {
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
      start_date: '',
      end_date: '',
      account_type: '',
    });
    setSearchQuery('');
    setRows([]);
    setSummary({
      totalDebit: 0,
      totalCredit: 0,
      balance: 0,
      accountCount: 0,
      dateRange: {
        start_date: '',
        end_date: ''
      }
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

  const getAccountTypeBadge = (type) => {
    const variants = {
      asset: 'primary',
      liability: 'warning',
      equity: 'success',
      revenue: 'info',
      expense: 'danger',
    };
    return <Badge bg={variants[type] || 'secondary'}>{type}</Badge>;
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
    const headers = ['Account #', 'Account Name', 'Account Type', 'Debit', 'Credit', 'Balance'];
    const csvData = rows.map(row => {
      const debit = parseFloat(row.total_debit || 0);
      const credit = parseFloat(row.total_credit || 0);
      const balance = debit - credit;
      
      return [
        row.account__account_number,
        row.account__account_name,
        row.account__account_type,
        debit.toFixed(2),
        credit.toFixed(2),
        balance.toFixed(2)
      ];
    });
    
    // Add summary row
    csvData.push([
      'TOTALS',
      '',
      '',
      summary.totalDebit.toFixed(2),
      summary.totalCredit.toFixed(2),
      summary.balance.toFixed(2)
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trial-balance-${filters.start_date}-to-${filters.end_date}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    setSuccess('Trial balance exported successfully');
    setTimeout(() => setSuccess(''), 3000);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Container fluid>
      <div className="page-header mb-4">
        <h1>
          <i className="fas fa-balance-scale me-2"></i>
          Trial Balance
        </h1>
        <div className="text-muted small">
          Shows all journal entries between selected dates grouped by account
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
          <i className="fas fa-calendar-alt me-2"></i>
          Date Range & Filters
        </Card.Header>
        <Card.Body>
          <Row className="mb-3">
            <Col md={3}>
              <Form.Group>
                <Form.Label>Start Date *</Form.Label>
                <Form.Control 
                  type="date" 
                  value={filters.start_date} 
                  onChange={(e) => handleFilterChange('start_date', e.target.value)}
                  max={filters.end_date || undefined}
                  required
                />
                <Form.Text className="text-muted">
                  Inclusive start date
                </Form.Text>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>End Date *</Form.Label>
                <Form.Control 
                  type="date" 
                  value={filters.end_date} 
                  onChange={(e) => handleFilterChange('end_date', e.target.value)}
                  min={filters.start_date || undefined}
                  required
                />
                <Form.Text className="text-muted">
                  Inclusive end date
                </Form.Text>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Account Type</Form.Label>
                <Form.Select 
                  value={filters.account_type} 
                  onChange={(e) => handleFilterChange('account_type', e.target.value)}
                >
                  {accountTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3} className="d-flex align-items-center">
              <div className="d-flex gap-2 w-100">
                <Button 
                  variant="primary" 
                  onClick={fetchData}
                  disabled={!filters.start_date || !filters.end_date}
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
                      Generating...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-calculator me-2"></i>
                      Generate Report
                    </>
                  )}
                </Button>
                <Button variant="outline-secondary" onClick={clearFilters} title="Clear all filters">
                  <i className="fas fa-times"></i>
                </Button>
              </div>
            </Col>
          </Row>
          
          {summary.dateRange.start_date && summary.dateRange.end_date && (
            <div className="text-center text-muted">
              <i className="fas fa-info-circle me-2"></i>
              Showing trial balance from <strong>{formatDate(summary.dateRange.start_date)}</strong> to <strong>{formatDate(summary.dateRange.end_date)}</strong>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Search and Summary Card */}
      {rows.length > 0 && (
        <Card className="mb-4">
          <Card.Header>
            <i className="fas fa-chart-bar me-2"></i>
            Report Summary & Search
          </Card.Header>
          <Card.Body>
            <Row className="mb-3">
              <Col md={6}>
                <InputGroup>
                  <InputGroup.Text>
                    <i className="fas fa-search"></i>
                  </InputGroup.Text>
                  <FormControl
                    placeholder="Search by account number or name..."
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
              <Col md={4}>
                <Card className="text-center border-primary">
                  <Card.Body>
                    <h6 className="text-muted mb-2">Total Accounts</h6>
                    <h3 className="mb-0">{summary.accountCount}</h3>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="text-center border-success">
                  <Card.Body>
                    <h6 className="text-muted mb-2">Total Debit</h6>
                    <h3 className="text-success mb-0">{formatCurrency(summary.totalDebit)}</h3>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="text-center border-danger">
                  <Card.Body>
                    <h6 className="text-muted mb-2">Total Credit</h6>
                    <h3 className="text-danger mb-0">{formatCurrency(summary.totalCredit)}</h3>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
            
            <Row className="mt-3">
              <Col md={12}>
                <div className="text-center">
                  <div className={summary.balance === 0 ? "alert alert-success mb-0" : "alert alert-warning mb-0"}>
                    <i className={summary.balance === 0 ? "fas fa-check-circle me-2" : "fas fa-exclamation-triangle me-2"}></i>
                    <strong>
                      {summary.balance === 0 ? 'Trial Balance is Balanced!' : 'Trial Balance is Unbalanced!'}
                    </strong>
                    <span className="ms-3">
                      Difference: {formatCurrency(summary.balance)}
                    </span>
                  </div>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Main Table Card */}
      {rows.length > 0 && (
        <Card>
          <Card.Header className="d-flex justify-content-between align-items-center">
            <div>
              <i className="fas fa-table me-2"></i>
              Trial Balance Details
              {isLoading && <span className="ms-2"><Spinner animation="border" size="sm" /></span>}
            </div>
            <div className="text-muted">
              Page {currentPage} of {totalPages} • {itemsPerPage} accounts per page
            </div>
          </Card.Header>
          <Card.Body>
            <div className="table-responsive">
              <Table striped bordered hover className="mb-0">
                <thead className="table-dark">
                  <tr>
                    <th width="15%">Account #</th>
                    <th width="30%">Account Name</th>
                    <th width="15%">Account Type</th>
                    <th width="15%" className="text-end">Debit Amount</th>
                    <th width="15%" className="text-end">Credit Amount</th>
                    <th width="10%" className="text-end">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => {
                    const debit = parseFloat(row.total_debit || 0);
                    const credit = parseFloat(row.total_credit || 0);
                    const balance = debit - credit;
                    
                    return (
                      <tr key={row.account__id || index}>
                        <td>
                          <code className="fs-6">{row.account__account_number}</code>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <span>{row.account__account_name}</span>
                          </div>
                        </td>
                        <td>
                          {getAccountTypeBadge(row.account__account_type)}
                        </td>
                        <td className="text-end">
                          <span className={debit > 0 ? 'text-success fw-bold' : 'text-muted'}>
                            {debit > 0 ? formatCurrency(debit) : '-'}
                          </span>
                        </td>
                        <td className="text-end">
                          <span className={credit > 0 ? 'text-danger fw-bold' : 'text-muted'}>
                            {credit > 0 ? formatCurrency(credit) : '-'}
                          </span>
                        </td>
                        <td className="text-end">
                          {balance > 0 ? (
                            <Badge bg="success">{formatCurrency(balance)} Dr</Badge>
                          ) : balance < 0 ? (
                            <Badge bg="danger">{formatCurrency(Math.abs(balance))} Cr</Badge>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="table-active">
                  <tr>
                    <td colSpan="3" className="text-end fw-bold">
                      GRAND TOTALS
                    </td>
                    <td className="text-end fw-bold text-success">
                      {formatCurrency(summary.totalDebit)}
                    </td>
                    <td className="text-end fw-bold text-danger">
                      {formatCurrency(summary.totalCredit)}
                    </td>
                    <td className="text-end fw-bold">
                      <span className={summary.balance === 0 ? 'text-success' : 'text-warning'}>
                        {formatCurrency(summary.balance)}
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

      {/* Empty State - No dates selected */}
      {(!filters.start_date || !filters.end_date) && rows.length === 0 && !isLoading && (
        <Card>
          <Card.Body className="text-center py-5">
            <div className="mb-4">
              <i className="fas fa-calendar-alt fa-4x text-muted"></i>
            </div>
            <h4 className="text-muted mb-3">Select Date Range</h4>
            <p className="text-muted mb-4">
              Please select both start and end dates to generate the trial balance report.
            </p>
            <div className="d-inline-flex gap-3">
              <Form.Control 
                type="date" 
                value={filters.start_date} 
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                className="w-auto"
              />
              <span className="align-self-center">to</span>
              <Form.Control 
                type="date" 
                value={filters.end_date} 
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                className="w-auto"
              />
              <Button 
                variant="primary" 
                onClick={fetchData}
                disabled={!filters.start_date || !filters.end_date}
              >
                <i className="fas fa-play me-2"></i>
                Generate
              </Button>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* No Results State */}
      {filters.start_date && filters.end_date && rows.length === 0 && !isLoading && (
        <Card>
          <Card.Body className="text-center py-5">
            <div className="mb-4">
              <i className="fas fa-search fa-4x text-muted"></i>
            </div>
            <h4 className="text-muted mb-3">No Journal Entries Found</h4>
            <p className="text-muted mb-4">
              No journal entries were found for the selected date range. 
              {searchQuery && ` No accounts match "${searchQuery}".`}
              {filters.account_type && ` No accounts of type "${filters.account_type}".`}
            </p>
            <Button variant="outline-primary" onClick={clearFilters}>
              <i className="fas fa-redo me-2"></i>
              Try Different Dates
            </Button>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default TrialBalance;