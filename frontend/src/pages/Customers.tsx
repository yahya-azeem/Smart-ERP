import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, CircularProgress, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, IconButton, Chip, Alert,
  Snackbar, Tooltip, Grid, InputAdornment, Card, CardContent,
  Tab, Tabs, TablePagination
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Search as SearchIcon, Clear as ClearIcon, Person as PersonIcon,
  Email as EmailIcon, Phone as PhoneIcon, LocationOn as LocationIcon,
  ShoppingCart as OrderIcon, Visibility as ViewIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  created_at: string;
  updated_at: string;
  sales_orders_count?: number;
  total_revenue?: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`customer-tabpanel-${index}`}
      aria-labelledby={`customer-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Customers: React.FC = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortField, setSortField] = useState<keyof Customer>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/customers/');
      // Enrich customer data with order counts
      const enrichedData = await Promise.all(
        res.data.map(async (customer: Customer) => {
          try {
            const ordersRes = await api.get(`/sales-orders/?customer=${customer.id}`);
            const orders = ordersRes.data;
            const totalRevenue = orders.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0);
            return {
              ...customer,
              sales_orders_count: orders.length,
              total_revenue: totalRevenue
            };
          } catch {
            return { ...customer, sales_orders_count: 0, total_revenue: 0 };
          }
        })
      );
      setCustomers(enrichedData);
      setFilteredCustomers(enrichedData);
    } catch (err: any) {
      showSnackbar(err.response?.data?.detail || 'Failed to fetch customers', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    let filtered = customers;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = customers.filter(customer =>
        customer.name.toLowerCase().includes(query) ||
        customer.email?.toLowerCase().includes(query) ||
        customer.phone?.toLowerCase().includes(query) ||
        customer.address?.toLowerCase().includes(query)
      );
    }
    
    // Sort
    filtered = [...filtered].sort((a, b) => {
      const aVal = a[sortField] || '';
      const bVal = b[sortField] || '';
      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });
    
    setFilteredCustomers(filtered);
    setPage(0);
  }, [searchQuery, customers, sortField, sortDirection]);

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenDialog = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name,
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || ''
      });
    } else {
      setEditingCustomer(null);
      setFormData({ name: '', email: '', phone: '', address: '' });
    }
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCustomer(null);
    setFormErrors({});
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer.id}/`, formData);
        showSnackbar('Customer updated successfully', 'success');
      } else {
        await api.post('/customers/', formData);
        showSnackbar('Customer created successfully', 'success');
      }
      handleCloseDialog();
      fetchCustomers();
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 
                      err.response?.data?.name?.[0] || 
                      'Failed to save customer';
      showSnackbar(errorMsg, 'error');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete customer "${name}"? This action cannot be undone.`)) {
      try {
        await api.delete(`/customers/${id}/`);
        showSnackbar('Customer deleted successfully', 'success');
        fetchCustomers();
      } catch (err: any) {
        showSnackbar(err.response?.data?.detail || 'Failed to delete customer', 'error');
      }
    }
  };

  const handleViewCustomer = (customer: Customer) => {
    setViewingCustomer(customer);
    setTabValue(0);
  };

  const handleCloseView = () => {
    setViewingCustomer(null);
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSort = (field: keyof Customer) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const paginatedCustomers = filteredCustomers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

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
          Customers
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          size="large"
        >
          Add Customer
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Customers
              </Typography>
              <Typography variant="h4" component="div">
                {customers.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                With Orders
              </Typography>
              <Typography variant="h4" component="div">
                {customers.filter(c => (c.sales_orders_count || 0) > 0).length}
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
              <Typography variant="h4" component="div" color="success.main">
                ${customers.reduce((sum, c) => sum + (c.total_revenue || 0), 0).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Avg Revenue/Customer
              </Typography>
              <Typography variant="h4" component="div">
                ${customers.length > 0 
                  ? Math.round(customers.reduce((sum, c) => sum + (c.total_revenue || 0), 0) / customers.length).toLocaleString()
                  : 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              placeholder="Search customers by name, email, phone, or address..."
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
              Showing {filteredCustomers.length} of {customers.length} customers
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Customers Table */}
      <Paper>
        <TableContainer>
          <Table size="medium">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'action.hover' }}>
                <TableCell 
                  onClick={() => handleSort('name')}
                  sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Contact Info</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Address</TableCell>
                <TableCell 
                  onClick={() => handleSort('sales_orders_count')}
                  sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                  align="center"
                >
                  Orders {sortField === 'sales_orders_count' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableCell>
                <TableCell 
                  onClick={() => handleSort('total_revenue')}
                  sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                  align="right"
                >
                  Total Revenue {sortField === 'total_revenue' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography color="textSecondary">
                      {searchQuery ? 'No customers match your search' : 'No customers found. Create your first customer!'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCustomers.map((customer) => (
                  <TableRow 
                    key={customer.id}
                    hover
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon color="primary" />
                        <Typography fontWeight="medium">{customer.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {customer.email && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <EmailIcon fontSize="small" color="action" />
                            <Typography variant="body2">{customer.email}</Typography>
                          </Box>
                        )}
                        {customer.phone && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <PhoneIcon fontSize="small" color="action" />
                            <Typography variant="body2">{customer.phone}</Typography>
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {customer.address && (
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                          <LocationIcon fontSize="small" color="action" sx={{ mt: 0.3 }} />
                          <Typography variant="body2" sx={{ maxWidth: 200 }} noWrap>
                            {customer.address}
                          </Typography>
                        </Box>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        icon={<OrderIcon />}
                        label={customer.sales_orders_count || 0}
                        color={(customer.sales_orders_count || 0) > 0 ? "primary" : "default"}
                        size="small"
                        onClick={() => navigate(`/orders?customer=${customer.id}`)}
                        sx={{ cursor: 'pointer' }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight="medium" color="success.main">
                        ${(customer.total_revenue || 0).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Details">
                        <IconButton onClick={() => handleViewCustomer(customer)} size="small" color="info">
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton onClick={() => handleOpenDialog(customer)} size="small" color="primary">
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton 
                          onClick={() => handleDelete(customer.id, customer.name)} 
                          size="small" 
                          color="error"
                          disabled={(customer.sales_orders_count || 0) > 0}
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
          count={filteredCustomers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                autoFocus
                label="Customer Name *"
                fullWidth
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
                }}
                error={!!formErrors.name}
                helperText={formErrors.name}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Email Address"
                type="email"
                fullWidth
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (formErrors.email) setFormErrors({ ...formErrors, email: '' });
                }}
                error={!!formErrors.email}
                helperText={formErrors.email}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Phone Number"
                fullWidth
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon color="action" />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Address"
                fullWidth
                multiline
                rows={3}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationIcon color="action" />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingCustomer ? 'Update Customer' : 'Create Customer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Customer Details Dialog */}
      <Dialog 
        open={!!viewingCustomer} 
        onClose={handleCloseView} 
        maxWidth="md" 
        fullWidth
        fullScreen={false}
      >
        {viewingCustomer && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon color="primary" />
                {viewingCustomer.name}
              </Box>
            </DialogTitle>
            <DialogContent>
              <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 2 }}>
                <Tab label="Overview" />
                <Tab label="Contact Info" />
                <Tab label="Order History" />
              </Tabs>

              <TabPanel value={tabValue} index={0}>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography color="textSecondary" gutterBottom>
                          Total Orders
                        </Typography>
                        <Typography variant="h3">
                          {viewingCustomer.sales_orders_count || 0}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography color="textSecondary" gutterBottom>
                          Total Revenue
                        </Typography>
                        <Typography variant="h3" color="success.main">
                          ${(viewingCustomer.total_revenue || 0).toLocaleString()}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="body2" color="textSecondary">
                      Customer since: {new Date(viewingCustomer.created_at).toLocaleDateString()}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Last updated: {new Date(viewingCustomer.updated_at).toLocaleDateString()}
                    </Typography>
                  </Grid>
                </Grid>
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {viewingCustomer.email && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <EmailIcon color="primary" />
                      <Box>
                        <Typography variant="body2" color="textSecondary">Email</Typography>
                        <Typography>{viewingCustomer.email}</Typography>
                      </Box>
                    </Box>
                  )}
                  {viewingCustomer.phone && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <PhoneIcon color="primary" />
                      <Box>
                        <Typography variant="body2" color="textSecondary">Phone</Typography>
                        <Typography>{viewingCustomer.phone}</Typography>
                      </Box>
                    </Box>
                  )}
                  {viewingCustomer.address && (
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <LocationIcon color="primary" />
                      <Box>
                        <Typography variant="body2" color="textSecondary">Address</Typography>
                        <Typography sx={{ whiteSpace: 'pre-wrap' }}>{viewingCustomer.address}</Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
              </TabPanel>

              <TabPanel value={tabValue} index={2}>
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="textSecondary" gutterBottom>
                    Order history view coming soon...
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<OrderIcon />}
                    onClick={() => {
                      handleCloseView();
                      navigate(`/orders?customer=${viewingCustomer.id}`);
                    }}
                  >
                    View All Orders
                  </Button>
                </Box>
              </TabPanel>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={handleCloseView}>Close</Button>
              <Button 
                variant="contained" 
                onClick={() => {
                  handleCloseView();
                  handleOpenDialog(viewingCustomer);
                }}
              >
                Edit Customer
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Snackbar for notifications */}
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

export default Customers;
