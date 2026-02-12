import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, CircularProgress, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, IconButton, Chip, Alert,
  Snackbar, Tooltip, Grid, InputAdornment, Card, CardContent,
  TablePagination, FormControl, InputLabel, Select, MenuItem,
  List, ListItem, ListItemText, ListItemIcon, Stepper, Step, StepLabel
} from '@mui/material';
import {
  Add as AddIcon, Delete as DeleteIcon, Payment as PaymentIcon,
  Search as SearchIcon, Clear as ClearIcon, Receipt as ReceiptIcon,
  AccountBalance as BankIcon, CreditCard as CardIcon,
  Money as CashIcon, CheckCircle as SuccessIcon,
  ArrowForward as ArrowIcon
} from '@mui/icons-material';
import api from '../api/axios';

interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer: string;
  date: string;
  due_date: string;
  total_amount: number;
  amount_paid: number;
  amount_due: number;
  status: string;
}

interface Payment {
  id: string;
  invoice: string;
  invoice_number: string;
  customer_name: string;
  amount: number;
  date: string;
  payment_method: string;
  reference: string;
  created_at: string;
}

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Cash', icon: <CashIcon /> },
  { value: 'BANK', label: 'Bank Transfer', icon: <BankIcon /> },
  { value: 'CREDIT_CARD', label: 'Credit Card', icon: <CardIcon /> },
  { value: 'OTHER', label: 'Other', icon: <PaymentIcon /> }
];

const Payments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [formData, setFormData] = useState({
    invoice: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    payment_method: 'BANK',
    reference: ''
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [paymentsRes, invoicesRes] = await Promise.all([
        api.get('/payments/'),
        api.get('/invoices/')
      ]);
      
      // Enrich payments with invoice details
      const enrichedPayments = paymentsRes.data.map((payment: any) => {
        const invoice = invoicesRes.data.find((inv: Invoice) => inv.id === payment.invoice);
        return {
          ...payment,
          invoice_number: invoice?.invoice_number || 'Unknown',
          customer_name: invoice?.customer_name || 'Unknown'
        };
      });
      
      setPayments(enrichedPayments.reverse()); // Most recent first
      setFilteredPayments(enrichedPayments);
      setInvoices(invoicesRes.data.filter((inv: Invoice) => inv.status !== 'PAID' && inv.status !== 'CANCELLED'));
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
    let filtered = payments;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = payments.filter(payment =>
        payment.invoice_number?.toLowerCase().includes(query) ||
        payment.customer_name?.toLowerCase().includes(query) ||
        payment.payment_method?.toLowerCase().includes(query) ||
        payment.reference?.toLowerCase().includes(query)
      );
    }
    setFilteredPayments(filtered);
    setPage(0);
  }, [searchQuery, payments]);

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!formData.invoice) {
      errors.invoice = 'Please select an invoice';
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      errors.amount = 'Please enter a valid amount';
    } else if (selectedInvoice && parseFloat(formData.amount) > selectedInvoice.amount_due) {
      errors.amount = `Amount cannot exceed due amount ($${selectedInvoice.amount_due})`;
    }
    if (!formData.date) {
      errors.date = 'Please select a date';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenDialog = () => {
    setActiveStep(0);
    setSelectedInvoice(null);
    setFormData({
      invoice: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      payment_method: 'BANK',
      reference: ''
    });
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setActiveStep(0);
    setSelectedInvoice(null);
  };

  const handleSelectInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setFormData({
      ...formData,
      invoice: invoice.id,
      amount: invoice.amount_due.toString()
    });
    setActiveStep(1);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      await api.post('/payments/', {
        ...formData,
        amount: parseFloat(formData.amount)
      });
      showSnackbar('Payment recorded successfully', 'success');
      handleCloseDialog();
      fetchData();
    } catch (err: any) {
      showSnackbar(err.response?.data?.detail || 'Failed to record payment', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this payment record?')) {
      try {
        await api.delete(`/payments/${id}/`);
        showSnackbar('Payment deleted successfully', 'success');
        fetchData();
      } catch (err: any) {
        showSnackbar(err.response?.data?.detail || 'Failed to delete payment', 'error');
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

  const getPaymentMethodIcon = (method: string) => {
    const pm = PAYMENT_METHODS.find(m => m.value === method);
    return pm?.icon || <PaymentIcon />;
  };

  const getPaymentMethodLabel = (method: string) => {
    return PAYMENT_METHODS.find(m => m.value === method)?.label || method;
  };

  const paginatedPayments = filteredPayments.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const totalCollected = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const todayPayments = payments.filter(p => {
    const paymentDate = new Date(p.date).toDateString();
    const today = new Date().toDateString();
    return paymentDate === today;
  });
  const todayTotal = todayPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  const steps = ['Select Invoice', 'Enter Payment Details'];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Payments
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
          size="large"
        >
          Record Payment
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Payments
              </Typography>
              <Typography variant="h4" component="div">
                {payments.length}
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
                ${totalCollected.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Today's Payments
              </Typography>
              <Typography variant="h4" component="div">
                {todayPayments.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Today's Total
              </Typography>
              <Typography variant="h4" component="div" color="primary.main">
                ${todayTotal.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              placeholder="Search payments by invoice, customer, or reference..."
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
          <Grid size={{ xs: 12, md: 6 }} sx={{ textAlign: 'right' }}>
            <Typography variant="body2" color="textSecondary">
              Showing {filteredPayments.length} of {payments.length} payments
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Payments Table */}
      <Paper>
        <TableContainer>
          <Table size="medium">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Invoice</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Method</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Reference</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Amount</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="textSecondary">
                      {searchQuery ? 'No payments match your search' : 'No payments recorded yet'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedPayments.map((payment) => (
                  <TableRow key={payment.id} hover>
                    <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip
                        icon={<ReceiptIcon />}
                        label={payment.invoice_number}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{payment.customer_name}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getPaymentMethodIcon(payment.payment_method)}
                        <Typography variant="body2">
                          {getPaymentMethodLabel(payment.payment_method)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{payment.reference || '-'}</TableCell>
                    <TableCell align="right">
                      <Typography fontWeight="bold" color="success.main">
                        ${payment.amount?.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Delete">
                        <IconButton
                          onClick={() => handleDelete(payment.id)}
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
          count={filteredPayments.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Record Payment Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PaymentIcon color="primary" />
            Record New Payment
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stepper activeStep={activeStep} sx={{ mb: 4, mt: 2 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {activeStep === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Select an Invoice to Pay
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Showing invoices with outstanding balances
              </Typography>
              
              {invoices.length === 0 ? (
                <Alert severity="info" sx={{ mt: 2 }}>
                  No unpaid invoices found. All invoices are either paid or cancelled.
                </Alert>
              ) : (
                <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {invoices
                    .sort((a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime())
                    .map((invoice) => (
                    <ListItem
                      key={invoice.id}
                      onClick={() => handleSelectInvoice(invoice)}
                      sx={{
                        cursor: 'pointer',
                        mb: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        '&:hover': {
                          backgroundColor: 'action.hover',
                          borderColor: 'primary.main'
                        }
                      }}
                    >
                      <ListItemIcon>
                        <ReceiptIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography fontWeight="bold">{invoice.invoice_number}</Typography>
                            <Chip
                              label={invoice.status}
                              size="small"
                              color={invoice.status === 'OVERDUE' ? 'error' : 'warning'}
                            />
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2">Customer: {invoice.customer_name}</Typography>
                            <Typography variant="body2">Due: {new Date(invoice.due_date).toLocaleDateString()}</Typography>
                            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                              <Typography variant="body2" color="textSecondary">
                                Total: ${invoice.total_amount?.toLocaleString()}
                              </Typography>
                              <Typography variant="body2" color="success.main" fontWeight="bold">
                                Due: ${invoice.amount_due?.toLocaleString()}
                              </Typography>
                            </Box>
                          </Box>
                        }
                      />
                      <ArrowIcon color="action" />
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          )}

          {activeStep === 1 && selectedInvoice && (
            <Box>
              <Alert severity="info" sx={{ mb: 3 }}>
                Recording payment for invoice <strong>{selectedInvoice.invoice_number}</strong> - {selectedInvoice.customer_name}
              </Alert>

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Amount *"
                    type="number"
                    fullWidth
                    value={formData.amount}
                    onChange={(e) => {
                      setFormData({ ...formData, amount: e.target.value });
                      if (formErrors.amount) setFormErrors({ ...formErrors, amount: '' });
                    }}
                    error={!!formErrors.amount}
                    helperText={formErrors.amount || `Due amount: $${selectedInvoice.amount_due}`}
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
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    error={!!formErrors.date}
                    helperText={formErrors.date}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth error={!!formErrors.payment_method}>
                    <InputLabel>Payment Method *</InputLabel>
                    <Select
                      value={formData.payment_method}
                      label="Payment Method *"
                      onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    >
                      {PAYMENT_METHODS.map((method) => (
                        <MenuItem key={method.value} value={method.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {method.icon}
                            {method.label}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Reference Number"
                    fullWidth
                    value={formData.reference}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                    placeholder="Transaction ID, Check #, etc."
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, p: 2, backgroundColor: 'action.hover', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Payment Summary
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" color="textSecondary">Invoice Total</Typography>
                    <Typography>${selectedInvoice.total_amount?.toLocaleString()}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" color="textSecondary">Already Paid</Typography>
                    <Typography color="success.main">${selectedInvoice.amount_paid?.toLocaleString()}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" color="textSecondary">Amount Due</Typography>
                    <Typography fontWeight="bold">${selectedInvoice.amount_due?.toLocaleString()}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" color="textSecondary">New Payment</Typography>
                    <Typography color="primary.main" fontWeight="bold">
                      ${formData.amount ? parseFloat(formData.amount).toLocaleString() : '0'}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          {activeStep === 1 && (
            <Button onClick={() => setActiveStep(0)}>
              Back
            </Button>
          )}
          {activeStep === 1 && (
            <Button onClick={handleSubmit} variant="contained" startIcon={<SuccessIcon />}>
              Record Payment
            </Button>
          )}
        </DialogActions>
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

export default Payments;
