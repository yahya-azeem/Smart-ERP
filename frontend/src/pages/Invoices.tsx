import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, CircularProgress, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, IconButton, Chip, Alert,
  Snackbar, Tooltip, Grid, InputAdornment, Card, CardContent,
  TablePagination, Divider, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import {
  Add as AddIcon, Delete as DeleteIcon, Receipt as ReceiptIcon,
  Search as SearchIcon, Clear as ClearIcon, Payment as PaymentIcon,
  CheckCircle as PaidIcon, Visibility as ViewIcon
} from '@mui/icons-material';
import api from '../api/axios';

interface Customer {
  id: string;
  name: string;
}

interface SalesOrder {
  id: string;
  order_number: string;
  customer: string;
  customer_name?: string;
  total_amount: number;
}

interface Payment {
  id: string;
  amount: number;
  date: string;
  payment_method: string;
  reference: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  customer: string;
  customer_name?: string;
  sales_order?: string;
  sales_order_number?: string;
  date: string;
  due_date: string;
  total_amount: number;
  amount_paid: number;
  amount_due: number;
  status: string;
  payments?: Payment[];
}

const INVOICE_STATUSES = {
  DRAFT: { label: 'Draft', color: 'default' as const },
  SENT: { label: 'Sent', color: 'info' as const },
  PAID: { label: 'Paid', color: 'success' as const },
  PARTIALLY_PAID: { label: 'Partial', color: 'warning' as const },
  OVERDUE: { label: 'Overdue', color: 'error' as const },
  CANCELLED: { label: 'Cancelled', color: 'error' as const }
};

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'BANK', label: 'Bank Transfer' },
  { value: 'CREDIT_CARD', label: 'Credit Card' },
  { value: 'OTHER', label: 'Other' }
];

const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [openDialog, setOpenDialog] = useState(false);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [formData, setFormData] = useState({
    invoice_number: '',
    customer: '',
    sales_order: '',
    date: new Date().toISOString().split('T')[0],
    due_date: '',
    total_amount: ''
  });
  const [paymentData, setPaymentData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    payment_method: 'BANK',
    reference: ''
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [invoicesRes, customersRes, ordersRes] = await Promise.all([
        api.get('/invoices/'),
        api.get('/customers/'),
        api.get('/sales-orders/')
      ]);
      
      // Enrich invoices with customer and order names
      const enrichedInvoices = invoicesRes.data.map((invoice: Invoice) => {
        const customer = customersRes.data.find((c: Customer) => c.id === invoice.customer);
        const order = ordersRes.data.find((o: SalesOrder) => o.id === invoice.sales_order);
        return {
          ...invoice,
          customer_name: customer?.name || 'Unknown',
          sales_order_number: order?.order_number
        };
      });

      // Enrich orders with customer names
      const enrichedOrders = ordersRes.data.map((order: SalesOrder) => {
        const customer = customersRes.data.find((c: Customer) => c.id === order.customer);
        return {
          ...order,
          customer_name: customer?.name || 'Unknown'
        };
      });
      
      setInvoices(enrichedInvoices);
      setFilteredInvoices(enrichedInvoices);
      setCustomers(customersRes.data);
      setOrders(enrichedOrders);
    } catch (err: any) {
      showSnackbar(err.response?.data?.detail || 'Failed to fetch data', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    let filtered = invoices;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = invoices.filter(invoice =>
        invoice.invoice_number?.toLowerCase().includes(query) ||
        invoice.customer_name?.toLowerCase().includes(query)
      );
    }
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(i => i.status === statusFilter);
    }
    setFilteredInvoices(filtered);
    setPage(0);
  }, [searchQuery, invoices, statusFilter]);

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!formData.invoice_number.trim()) {
      errors.invoice_number = 'Invoice number is required';
    }
    if (!formData.customer) {
      errors.customer = 'Please select a customer';
    }
    if (!formData.date) {
      errors.date = 'Please select an invoice date';
    }
    if (!formData.due_date) {
      errors.due_date = 'Please select a due date';
    }
    if (!formData.total_amount || parseFloat(formData.total_amount) <= 0) {
      errors.total_amount = 'Please enter a valid amount';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePayment = () => {
    const errors: { [key: string]: string } = {};
    if (!paymentData.amount || parseFloat(paymentData.amount) <= 0) {
      errors.amount = 'Please enter a valid amount';
    } else if (selectedInvoiceForPayment && parseFloat(paymentData.amount) > selectedInvoiceForPayment.amount_due) {
      errors.amount = `Amount cannot exceed $${selectedInvoiceForPayment.amount_due}`;
    }
    if (!paymentData.date) {
      errors.date = 'Please select a date';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenDialog = (invoice?: Invoice) => {
    if (invoice) {
      setEditingInvoice(invoice);
      setFormData({
        invoice_number: invoice.invoice_number,
        customer: invoice.customer,
        sales_order: invoice.sales_order || '',
        date: invoice.date,
        due_date: invoice.due_date,
        total_amount: invoice.total_amount?.toString() || ''
      });
    } else {
      setEditingInvoice(null);
      setFormData({
        invoice_number: '',
        customer: '',
        sales_order: '',
        date: new Date().toISOString().split('T')[0],
        due_date: '',
        total_amount: ''
      });
    }
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingInvoice(null);
    setFormErrors({});
  };

  const handleOpenPaymentDialog = (invoice: Invoice) => {
    setSelectedInvoiceForPayment(invoice);
    setPaymentData({
      amount: invoice.amount_due.toString(),
      date: new Date().toISOString().split('T')[0],
      payment_method: 'BANK',
      reference: ''
    });
    setFormErrors({});
    setOpenPaymentDialog(true);
  };

  const handleClosePaymentDialog = () => {
    setOpenPaymentDialog(false);
    setSelectedInvoiceForPayment(null);
    setFormErrors({});
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const payload = {
      ...formData,
      total_amount: parseFloat(formData.total_amount),
      sales_order: formData.sales_order || null
    };

    try {
      if (editingInvoice) {
        await api.put(`/invoices/${editingInvoice.id}/`, payload);
        showSnackbar('Invoice updated successfully', 'success');
      } else {
        await api.post('/invoices/', payload);
        showSnackbar('Invoice created successfully', 'success');
      }
      handleCloseDialog();
      fetchData();
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 
                      err.response?.data?.invoice_number?.[0] || 
                      'Failed to save invoice';
      showSnackbar(errorMsg, 'error');
    }
  };

  const handleRecordPayment = async () => {
    if (!validatePayment() || !selectedInvoiceForPayment) return;

    try {
      await api.post('/payments/', {
        invoice: selectedInvoiceForPayment.id,
        amount: parseFloat(paymentData.amount),
        date: paymentData.date,
        payment_method: paymentData.payment_method,
        reference: paymentData.reference
      });
      showSnackbar('Payment recorded successfully', 'success');
      handleClosePaymentDialog();
      fetchData();
    } catch (err: any) {
      showSnackbar(err.response?.data?.error || 'Failed to record payment', 'error');
    }
  };

  const handleDelete = async (id: string, invoiceNumber: string) => {
    if (window.confirm(`Are you sure you want to delete invoice "${invoiceNumber}"?`)) {
      try {
        await api.delete(`/invoices/${id}/`);
        showSnackbar('Invoice deleted successfully', 'success');
        fetchData();
      } catch (err: any) {
        showSnackbar(err.response?.data?.detail || 'Failed to delete invoice', 'error');
      }
    }
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedInvoices = filteredInvoices.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const totalOutstanding = invoices
    .filter(i => i.status !== 'PAID' && i.status !== 'CANCELLED')
    .reduce((sum, i) => sum + (i.amount_due || 0), 0);
  
  const overdueCount = invoices.filter(i => i.status === 'OVERDUE').length;
  const totalPaid = invoices
    .filter(i => i.status === 'PAID' || i.status === 'PARTIALLY_PAID')
    .reduce((sum, i) => sum + (i.amount_paid || 0), 0);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Invoices
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          size="large"
        >
          Create Invoice
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Invoices
              </Typography>
              <Typography variant="h4" component="div">
                {invoices.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Outstanding
              </Typography>
              <Typography variant="h4" component="div" color="warning.main">
                ${totalOutstanding.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Overdue
              </Typography>
              <Typography variant="h4" component="div" color="error.main">
                {overdueCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Collected
              </Typography>
              <Typography variant="h4" component="div" color="success.main">
                ${totalPaid.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              placeholder="Search invoices by number or customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setSearchQuery('')} size="small">
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Status</InputLabel>
              <Select
                value={statusFilter}
                label="Filter by Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="ALL">All Statuses</MenuItem>
                {Object.entries(INVOICE_STATUSES).map(([key, { label }]) => (
                  <MenuItem key={key} value={key}>{label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }} sx={{ textAlign: 'right' }}>
            <Typography variant="body2" color="textSecondary">
              Showing {filteredInvoices.length} of {invoices.length} invoices
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Invoices Table */}
      <Paper>
        <TableContainer>
          <Table size="medium">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Invoice #</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Due Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Total</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Paid</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Due</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <Typography color="textSecondary">
                      {searchQuery || statusFilter !== 'ALL' ? 'No invoices match your filters' : 'No invoices found'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedInvoices.map((invoice) => (
                  <TableRow key={invoice.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ReceiptIcon color="primary" />
                        <Typography fontWeight="medium">{invoice.invoice_number}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{invoice.customer_name}</TableCell>
                    <TableCell>{new Date(invoice.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Typography color={new Date(invoice.due_date) < new Date() && invoice.status !== 'PAID' ? 'error' : 'inherit'}>
                        {new Date(invoice.due_date).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={INVOICE_STATUSES[invoice.status as keyof typeof INVOICE_STATUSES]?.label || invoice.status}
                        color={INVOICE_STATUSES[invoice.status as keyof typeof INVOICE_STATUSES]?.color || 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">${invoice.total_amount?.toLocaleString()}</TableCell>
                    <TableCell align="right" sx={{ color: 'success.main' }}>
                      ${invoice.amount_paid?.toLocaleString()}
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight="bold" color={invoice.amount_due > 0 ? 'warning.main' : 'success.main'}>
                        ${invoice.amount_due?.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Details">
                        <IconButton onClick={() => setViewingInvoice(invoice)} size="small" color="info">
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      {(invoice.status === 'DRAFT' || invoice.status === 'SENT' || invoice.status === 'PARTIALLY_PAID') && (
                        <Tooltip title="Record Payment">
                          <IconButton onClick={() => handleOpenPaymentDialog(invoice)} size="small" color="success">
                            <PaymentIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Delete">
                        <IconButton
                          onClick={() => handleDelete(invoice.id, invoice.invoice_number)}
                          size="small"
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredInvoices.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Create/Edit Invoice Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingInvoice ? 'Edit Invoice' : 'Create New Invoice'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                autoFocus
                label="Invoice Number *"
                fullWidth
                value={formData.invoice_number}
                onChange={(e) => {
                  setFormData({ ...formData, invoice_number: e.target.value });
                  if (formErrors.invoice_number) setFormErrors({ ...formErrors, invoice_number: '' });
                }}
                error={!!formErrors.invoice_number}
                helperText={formErrors.invoice_number}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth error={!!formErrors.customer} required>
                <InputLabel>Customer *</InputLabel>
                <Select
                  value={formData.customer}
                  label="Customer *"
                  onChange={(e) => {
                    setFormData({ ...formData, customer: e.target.value });
                    if (formErrors.customer) setFormErrors({ ...formErrors, customer: '' });
                  }}
                >
                  {customers.map((customer) => (
                    <MenuItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel>Linked Sales Order (Optional)</InputLabel>
                <Select
                  value={formData.sales_order}
                  label="Linked Sales Order (Optional)"
                  onChange={(e) => {
                    const orderId = e.target.value;
                    setFormData({ ...formData, sales_order: orderId });
                    if (orderId) {
                      const order = orders.find(o => o.id === orderId);
                      if (order) {
                        setFormData(prev => ({
                          ...prev,
                          sales_order: orderId,
                          customer: order.customer,
                          total_amount: order.total_amount?.toString() || ''
                        }));
                      }
                    }
                  }}
                >
                  <MenuItem value="">
                    <em>None - Manual Invoice</em>
                  </MenuItem>
                  {orders.map((order) => (
                    <MenuItem key={order.id} value={order.id}>
                      {order.order_number} - {order.customer_name} (${order.total_amount?.toLocaleString()})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Invoice Date *"
                type="date"
                fullWidth
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                error={!!formErrors.date}
                helperText={formErrors.date}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Due Date *"
                type="date"
                fullWidth
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                error={!!formErrors.due_date}
                helperText={formErrors.due_date}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Total Amount *"
                type="number"
                fullWidth
                value={formData.total_amount}
                onChange={(e) => {
                  setFormData({ ...formData, total_amount: e.target.value });
                  if (formErrors.total_amount) setFormErrors({ ...formErrors, total_amount: '' });
                }}
                error={!!formErrors.total_amount}
                helperText={formErrors.total_amount}
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingInvoice ? 'Update Invoice' : 'Create Invoice'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={openPaymentDialog} onClose={handleClosePaymentDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PaymentIcon color="primary" />
            Record Payment
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedInvoiceForPayment && (
            <>
              <Alert severity="info" sx={{ mb: 3 }}>
                Recording payment for invoice <strong>{selectedInvoiceForPayment.invoice_number}</strong>
                <br />
                Amount Due: <strong>${selectedInvoiceForPayment.amount_due?.toLocaleString()}</strong>
              </Alert>

              <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Payment Amount *"
                    type="number"
                    fullWidth
                    value={paymentData.amount}
                    onChange={(e) => {
                      setPaymentData({ ...paymentData, amount: e.target.value });
                      if (formErrors.amount) setFormErrors({ ...formErrors, amount: '' });
                    }}
                    error={!!formErrors.amount}
                    helperText={formErrors.amount}
                    required
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Payment Date *"
                    type="date"
                    fullWidth
                    value={paymentData.date}
                    onChange={(e) => setPaymentData({ ...paymentData, date: e.target.value })}
                    error={!!formErrors.date}
                    helperText={formErrors.date}
                    required
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Payment Method</InputLabel>
                    <Select
                      value={paymentData.payment_method}
                      label="Payment Method"
                      onChange={(e) => setPaymentData({ ...paymentData, payment_method: e.target.value })}
                    >
                      {PAYMENT_METHODS.map((method) => (
                        <MenuItem key={method.value} value={method.value}>
                          {method.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Reference Number"
                    fullWidth
                    value={paymentData.reference}
                    onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })}
                    placeholder="Transaction ID, Check #, etc."
                  />
                </Grid>
              </Grid>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClosePaymentDialog}>Cancel</Button>
          <Button onClick={handleRecordPayment} variant="contained" startIcon={<PaidIcon />}>
            Record Payment
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Invoice Dialog */}
      <Dialog open={!!viewingInvoice} onClose={() => setViewingInvoice(null)} maxWidth="md" fullWidth>
        {viewingInvoice && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ReceiptIcon color="primary" />
                Invoice {viewingInvoice.invoice_number}
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="body2" color="textSecondary">Customer</Typography>
                  <Typography variant="h6">{viewingInvoice.customer_name}</Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="body2" color="textSecondary">Status</Typography>
                  <Chip
                    label={INVOICE_STATUSES[viewingInvoice.status as keyof typeof INVOICE_STATUSES]?.label || viewingInvoice.status}
                    color={INVOICE_STATUSES[viewingInvoice.status as keyof typeof INVOICE_STATUSES]?.color || 'default'}
                  />
                </Grid>
                {viewingInvoice.sales_order_number && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="body2" color="textSecondary">Linked Order</Typography>
                    <Typography>{viewingInvoice.sales_order_number}</Typography>
                  </Grid>
                )}
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" color="textSecondary">Invoice Date</Typography>
                  <Typography>{new Date(viewingInvoice.date).toLocaleDateString()}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" color="textSecondary">Due Date</Typography>
                  <Typography>{new Date(viewingInvoice.due_date).toLocaleDateString()}</Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Grid container spacing={3}>
                <Grid size={{ xs: 4 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="body2" color="textSecondary">Total Amount</Typography>
                      <Typography variant="h6">${viewingInvoice.total_amount?.toLocaleString()}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="body2" color="textSecondary">Amount Paid</Typography>
                      <Typography variant="h6" color="success.main">
                        ${viewingInvoice.amount_paid?.toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="body2" color="textSecondary">Amount Due</Typography>
                      <Typography variant="h6" color={viewingInvoice.amount_due > 0 ? 'warning.main' : 'success.main'}>
                        ${viewingInvoice.amount_due?.toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={() => setViewingInvoice(null)}>Close</Button>
              {viewingInvoice.amount_due > 0 && (
                <Button
                  variant="contained"
                  onClick={() => {
                    setViewingInvoice(null);
                    handleOpenPaymentDialog(viewingInvoice);
                  }}
                  startIcon={<PaymentIcon />}
                >
                  Record Payment
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Invoices;
