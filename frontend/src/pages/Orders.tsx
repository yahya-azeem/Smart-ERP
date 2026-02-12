import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, CircularProgress, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, IconButton, Chip, Alert,
  Snackbar, Tooltip, Grid, InputAdornment, Card, CardContent,
  TablePagination, Stepper, Step, StepLabel, FormControl, InputLabel, Select, MenuItem, Divider
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Search as SearchIcon, Clear as ClearIcon, ShoppingCart as OrderIcon,
  Person as PersonIcon, CheckCircle as ConfirmIcon,
  Visibility as ViewIcon, AddCircle as AddLineIcon,
  RemoveCircle as RemoveLineIcon
} from '@mui/icons-material';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';

interface Customer {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
}

interface OrderLine {
  id?: string;
  product: string;
  product_name?: string;
  quantity: number;
  unit_price: number;
  total_price?: number;
}

interface SalesOrder {
  id: string;
  order_number: string;
  date: string;
  status: string;
  customer: string;
  customer_name?: string;
  total_amount: number;
  lines: OrderLine[];
}

const ORDER_STATUSES = {
  DRAFT: { label: 'Draft', color: 'warning' as const },
  CONFIRMED: { label: 'Confirmed', color: 'success' as const },
  CANCELLED: { label: 'Cancelled', color: 'error' as const }
};

const Orders: React.FC = () => {
  const [searchParams] = useSearchParams();
  const customerFilter = searchParams.get('customer');
  
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<SalesOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [editingOrder, setEditingOrder] = useState<SalesOrder | null>(null);
  const [viewingOrder, setViewingOrder] = useState<SalesOrder | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [formData, setFormData] = useState({
    order_number: '',
    date: new Date().toISOString().split('T')[0],
    customer: ''
  });
  const [lines, setLines] = useState<OrderLine[]>([]);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersRes, customersRes, productsRes] = await Promise.all([
        api.get('/sales-orders/'),
        api.get('/customers/'),
        api.get('/products/')
      ]);
      
      // Enrich orders with customer names
      const enrichedOrders = ordersRes.data.map((order: SalesOrder) => {
        const customer = customersRes.data.find((c: Customer) => c.id === order.customer);
        return {
          ...order,
          customer_name: customer?.name || 'Unknown'
        };
      });

      // Filter by customer if specified
      let filtered = enrichedOrders;
      if (customerFilter) {
        filtered = enrichedOrders.filter((o: SalesOrder) => o.customer === customerFilter);
      }
      
      setOrders(enrichedOrders);
      setFilteredOrders(filtered);
      setCustomers(customersRes.data);
      setProducts(productsRes.data);
    } catch (err: any) {
      showSnackbar(err.response?.data?.detail || 'Failed to fetch data', 'error');
    } finally {
      setLoading(false);
    }
  }, [customerFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    let filtered = orders;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = orders.filter(order =>
        order.order_number?.toLowerCase().includes(query) ||
        order.customer_name?.toLowerCase().includes(query)
      );
    }
    if (customerFilter) {
      filtered = filtered.filter(o => o.customer === customerFilter);
    }
    setFilteredOrders(filtered);
    setPage(0);
  }, [searchQuery, orders, customerFilter]);

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!formData.order_number.trim()) {
      errors.order_number = 'Order number is required';
    }
    if (!formData.customer) {
      errors.customer = 'Please select a customer';
    }
    if (!formData.date) {
      errors.date = 'Please select a date';
    }
    if (lines.length === 0) {
      errors.lines = 'Please add at least one item';
    }
    lines.forEach((line, index) => {
      if (!line.product) {
        errors[`line_${index}_product`] = 'Select a product';
      }
      if (!line.quantity || line.quantity <= 0) {
        errors[`line_${index}_quantity`] = 'Invalid quantity';
      }
    });
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenDialog = (order?: SalesOrder) => {
    if (order) {
      setEditingOrder(order);
      setFormData({
        order_number: order.order_number,
        date: order.date,
        customer: order.customer
      });
      // Enrich lines with product names
      const enrichedLines = order.lines.map(line => ({
        ...line,
        product_name: products.find(p => p.id === line.product)?.name
      }));
      setLines(enrichedLines);
      setActiveStep(0);
    } else {
      setEditingOrder(null);
      setFormData({
        order_number: '',
        date: new Date().toISOString().split('T')[0],
        customer: ''
      });
      setLines([]);
      setActiveStep(0);
    }
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingOrder(null);
    setActiveStep(0);
  };

  const handleAddLine = () => {
    setLines([...lines, { product: '', quantity: 1, unit_price: 0 }]);
  };

  const handleRemoveLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleLineChange = (index: number, field: keyof OrderLine, value: any) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    
    if (field === 'product') {
      const product = products.find(p => p.id === value);
      if (product) {
        newLines[index].unit_price = product.price;
        newLines[index].product_name = product.name;
      }
    }
    
    setLines(newLines);
  };

  const calculateTotal = () => {
    return lines.reduce((sum, line) => sum + (line.quantity * line.unit_price), 0);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      let orderId: string;
      
      if (editingOrder) {
        await api.put(`/sales-orders/${editingOrder.id}/`, formData);
        orderId = editingOrder.id;
        showSnackbar('Order updated successfully', 'success');
      } else {
        const res = await api.post('/sales-orders/', formData);
        orderId = res.data.id;
        showSnackbar('Order created successfully', 'success');
      }

      // Save order lines
      for (const line of lines) {
        const lineData = {
          order: orderId,
          product: line.product,
          quantity: line.quantity,
          unit_price: line.unit_price
        };
        
        if (line.id) {
          await api.put(`/sales-order-lines/${line.id}/`, lineData);
        } else {
          await api.post('/sales-order-lines/', lineData);
        }
      }

      handleCloseDialog();
      fetchData();
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 
                      err.response?.data?.order_number?.[0] || 
                      'Failed to save order';
      showSnackbar(errorMsg, 'error');
    }
  };

  const handleConfirm = async (order: SalesOrder) => {
    if (window.confirm(`Confirm order ${order.order_number}? This will deduct stock and create an invoice.`)) {
      try {
        const res = await api.post(`/sales-orders/${order.id}/confirm/`);
        showSnackbar(res.data.status || 'Order confirmed successfully', 'success');
        fetchData();
      } catch (err: any) {
        showSnackbar(err.response?.data?.error || 'Failed to confirm order', 'error');
      }
    }
  };

  const handleDelete = async (id: string, orderNumber: string) => {
    if (window.confirm(`Are you sure you want to delete order "${orderNumber}"?`)) {
      try {
        await api.delete(`/sales-orders/${id}/`);
        showSnackbar('Order deleted successfully', 'success');
        fetchData();
      } catch (err: any) {
        showSnackbar(err.response?.data?.detail || 'Failed to delete order', 'error');
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

  const paginatedOrders = filteredOrders.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const totalRevenue = orders
    .filter(o => o.status === 'CONFIRMED')
    .reduce((sum, o) => sum + (o.total_amount || 0), 0);
  
  const draftCount = orders.filter(o => o.status === 'DRAFT').length;
  const confirmedCount = orders.filter(o => o.status === 'CONFIRMED').length;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  const steps = ['Order Details', 'Add Items'];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Sales Orders
          {customerFilter && (
            <Typography component="span" variant="h6" color="textSecondary" sx={{ ml: 2 }}>
              (Filtered by Customer)
            </Typography>
          )}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          size="large"
        >
          Create Order
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Orders
              </Typography>
              <Typography variant="h4" component="div">
                {orders.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Draft Orders
              </Typography>
              <Typography variant="h4" component="div" color="warning.main">
                {draftCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Confirmed Orders
              </Typography>
              <Typography variant="h4" component="div" color="success.main">
                {confirmedCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Revenue
              </Typography>
              <Typography variant="h4" component="div">
                ${totalRevenue.toLocaleString()}
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
              placeholder="Search orders by number or customer..."
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
              Showing {filteredOrders.length} of {orders.length} orders
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Orders Table */}
      <Paper>
        <TableContainer>
          <Table size="medium">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Order #</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Items</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Total</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="textSecondary">
                      {searchQuery ? 'No orders match your search' : 'No orders found'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedOrders.map((order) => (
                  <TableRow key={order.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <OrderIcon color="primary" />
                        <Typography fontWeight="medium">{order.order_number}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{new Date(order.date).toLocaleDateString()}</TableCell>
                    <TableCell>{order.customer_name}</TableCell>
                    <TableCell>
                      <Chip
                        label={ORDER_STATUSES[order.status as keyof typeof ORDER_STATUSES]?.label || order.status}
                        color={ORDER_STATUSES[order.status as keyof typeof ORDER_STATUSES]?.color || 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">{order.lines?.length || 0}</TableCell>
                    <TableCell align="right">
                      <Typography fontWeight="medium">
                        ${order.total_amount?.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Details">
                        <IconButton onClick={() => setViewingOrder(order)} size="small" color="info">
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      {order.status === 'DRAFT' && (
                        <>
                          <Tooltip title="Edit">
                            <IconButton onClick={() => handleOpenDialog(order)} size="small" color="primary">
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Confirm Order">
                            <IconButton onClick={() => handleConfirm(order)} size="small" color="success">
                              <ConfirmIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      <Tooltip title="Delete">
                        <IconButton
                          onClick={() => handleDelete(order.id, order.order_number)}
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
          count={filteredOrders.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingOrder ? 'Edit Sales Order' : 'Create New Sales Order'}
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
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  autoFocus
                  label="Order Number *"
                  fullWidth
                  value={formData.order_number}
                  onChange={(e) => {
                    setFormData({ ...formData, order_number: e.target.value });
                    if (formErrors.order_number) setFormErrors({ ...formErrors, order_number: '' });
                  }}
                  error={!!formErrors.order_number}
                  helperText={formErrors.order_number}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Order Date *"
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
              <Grid size={{ xs: 12 }}>
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
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PersonIcon fontSize="small" />
                          {customer.name}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          )}

          {activeStep === 1 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Order Items</Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddLineIcon />}
                  onClick={handleAddLine}
                  size="small"
                >
                  Add Item
                </Button>
              </Box>

              {lines.length === 0 ? (
                <Alert severity="info" sx={{ mb: 2 }}>
                  No items added. Click "Add Item" to add products to this order.
                </Alert>
              ) : (
                <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell align="right">Qty</TableCell>
                        <TableCell align="right">Unit Price</TableCell>
                        <TableCell align="right">Total</TableCell>
                        <TableCell align="right"></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {lines.map((line, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <FormControl fullWidth size="small">
                              <Select
                                value={line.product}
                                onChange={(e) => handleLineChange(index, 'product', e.target.value)}
                                displayEmpty
                              >
                                <MenuItem value="">
                                  <em>Select Product</em>
                                </MenuItem>
                                {products.map((product) => (
                                  <MenuItem key={product.id} value={product.id}>
                                    {product.name} (Stock: {product.stock_quantity})
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </TableCell>
                          <TableCell align="right">
                            <TextField
                              type="number"
                              size="small"
                              value={line.quantity}
                              onChange={(e) => handleLineChange(index, 'quantity', parseInt(e.target.value) || 0)}
                              inputProps={{ min: 1, style: { textAlign: 'right' } }}
                              sx={{ width: 80 }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <TextField
                              type="number"
                              size="small"
                              value={line.unit_price}
                              onChange={(e) => handleLineChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                              InputProps={{
                                startAdornment: <InputAdornment position="start">$</InputAdornment>
                              }}
                              sx={{ width: 120 }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography fontWeight="bold">
                              ${(line.quantity * line.unit_price).toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRemoveLine(index)}
                            >
                              <RemoveLineIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              <Box sx={{ textAlign: 'right', p: 2, backgroundColor: 'action.hover', borderRadius: 1 }}>
                <Typography variant="h6">
                  Order Total: <strong>${calculateTotal().toLocaleString()}</strong>
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          {activeStep === 1 && (
            <Button onClick={() => setActiveStep(0)}>Back</Button>
          )}
          {activeStep === 0 ? (
            <Button onClick={() => setActiveStep(1)} variant="contained">
              Next
            </Button>
          ) : (
            <Button onClick={handleSubmit} variant="contained" startIcon={<ConfirmIcon />}>
              {editingOrder ? 'Update Order' : 'Create Order'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* View Order Dialog */}
      <Dialog open={!!viewingOrder} onClose={() => setViewingOrder(null)} maxWidth="md" fullWidth>
        {viewingOrder && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <OrderIcon color="primary" />
                Order {viewingOrder.order_number}
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="body2" color="textSecondary">Customer</Typography>
                  <Typography variant="h6">{viewingOrder.customer_name}</Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="body2" color="textSecondary">Status</Typography>
                  <Chip
                    label={ORDER_STATUSES[viewingOrder.status as keyof typeof ORDER_STATUSES]?.label || viewingOrder.status}
                    color={ORDER_STATUSES[viewingOrder.status as keyof typeof ORDER_STATUSES]?.color || 'default'}
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="body2" color="textSecondary">Order Date</Typography>
                  <Typography>{new Date(viewingOrder.date).toLocaleDateString()}</Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="body2" color="textSecondary">Total Amount</Typography>
                  <Typography variant="h5" color="success.main">
                    ${viewingOrder.total_amount?.toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom>Order Items</Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Unit Price</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {viewingOrder.lines?.map((line, index) => (
                      <TableRow key={index}>
                        <TableCell>{line.product_name || 'Unknown Product'}</TableCell>
                        <TableCell align="right">{line.quantity}</TableCell>
                        <TableCell align="right">${line.unit_price?.toLocaleString()}</TableCell>
                        <TableCell align="right">${(line.quantity * line.unit_price)?.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={() => setViewingOrder(null)}>Close</Button>
              {viewingOrder.status === 'DRAFT' && (
                <Button
                  variant="contained"
                  onClick={() => {
                    setViewingOrder(null);
                    handleOpenDialog(viewingOrder);
                  }}
                >
                  Edit Order
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

export default Orders;
