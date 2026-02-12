import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, CircularProgress, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, IconButton, Chip, Alert,
  Snackbar, Tooltip, Grid, InputAdornment, Card, CardContent,
  TablePagination
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Search as SearchIcon, Clear as ClearIcon, Inventory as ProductIcon,
  AttachMoney as MoneyIcon, TrendingUp as TrendingIcon,
  Visibility as ViewIcon, QrCode as BarcodeIcon
} from '@mui/icons-material';
import api from '../api/axios';

interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  price: number;
  cost_price: number;
  stock_quantity: number;
  created_at: string;
  updated_at: string;
}

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortField, setSortField] = useState<keyof Product>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    price: '',
    cost_price: '',
    stock_quantity: ''
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/products/');
      setProducts(res.data);
      setFilteredProducts(res.data);
    } catch (err: any) {
      showSnackbar(err.response?.data?.detail || 'Failed to fetch products', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    let filtered = products;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = products.filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.sku?.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query)
      );
    }
    
    // Sort
    filtered = [...filtered].sort((a, b) => {
      const aVal = a[sortField] || '';
      const bVal = b[sortField] || '';
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      if (sortDirection === 'asc') {
        return String(aVal).localeCompare(String(bVal));
      }
      return String(bVal).localeCompare(String(aVal));
    });
    
    setFilteredProducts(filtered);
    setPage(0);
  }, [searchQuery, products, sortField, sortDirection]);

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!formData.name.trim()) {
      errors.name = 'Product name is required';
    }
    if (!formData.sku.trim()) {
      errors.sku = 'SKU is required';
    }
    if (!formData.price || parseFloat(formData.price) < 0) {
      errors.price = 'Please enter a valid price';
    }
    if (!formData.cost_price || parseFloat(formData.cost_price) < 0) {
      errors.cost_price = 'Please enter a valid cost price';
    }
    if (formData.stock_quantity === '' || parseInt(formData.stock_quantity) < 0) {
      errors.stock_quantity = 'Please enter a valid stock quantity';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        sku: product.sku || '',
        description: product.description || '',
        price: product.price?.toString() || '',
        cost_price: product.cost_price?.toString() || '',
        stock_quantity: product.stock_quantity?.toString() || '0'
      });
    } else {
      setEditingProduct(null);
      setFormData({ name: '', sku: '', description: '', price: '', cost_price: '', stock_quantity: '0' });
    }
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProduct(null);
    setFormErrors({});
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const payload = {
      name: formData.name,
      sku: formData.sku,
      description: formData.description,
      price: parseFloat(formData.price),
      cost_price: parseFloat(formData.cost_price),
      stock_quantity: parseInt(formData.stock_quantity)
    };

    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}/`, payload);
        showSnackbar('Product updated successfully', 'success');
      } else {
        await api.post('/products/', payload);
        showSnackbar('Product created successfully', 'success');
      }
      handleCloseDialog();
      fetchProducts();
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 
                      err.response?.data?.sku?.[0] || 
                      err.response?.data?.name?.[0] ||
                      'Failed to save product';
      showSnackbar(errorMsg, 'error');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete product "${name}"? This action cannot be undone.`)) {
      try {
        await api.delete(`/products/${id}/`);
        showSnackbar('Product deleted successfully', 'success');
        fetchProducts();
      } catch (err: any) {
        showSnackbar(err.response?.data?.detail || 'Failed to delete product', 'error');
      }
    }
  };

  const handleViewProduct = (product: Product) => {
    setViewingProduct(product);
  };

  const handleCloseView = () => {
    setViewingProduct(null);
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSort = (field: keyof Product) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const paginatedProducts = filteredProducts.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const lowStockCount = products.filter(p => p.stock_quantity < 5).length;
  const totalInventoryValue = products.reduce((sum, p) => sum + (p.cost_price * p.stock_quantity), 0);
  const totalRetailValue = products.reduce((sum, p) => sum + (p.price * p.stock_quantity), 0);

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
          Products
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          size="large"
        >
          Add Product
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Products
              </Typography>
              <Typography variant="h4" component="div">
                {products.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Low Stock Items
              </Typography>
              <Typography variant="h4" component="div" color={lowStockCount > 0 ? 'error.main' : 'success.main'}>
                {lowStockCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Inventory Value (Cost)
              </Typography>
              <Typography variant="h4" component="div">
                ${totalInventoryValue.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Inventory Value (Retail)
              </Typography>
              <Typography variant="h4" component="div" color="success.main">
                ${totalRetailValue.toLocaleString()}
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
              placeholder="Search products by name, SKU, or description..."
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
              Showing {filteredProducts.length} of {products.length} products
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Products Table */}
      <Paper>
        <TableContainer>
          <Table size="medium">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'action.hover' }}>
                <TableCell 
                  onClick={() => handleSort('name')}
                  sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Product {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableCell>
                <TableCell 
                  onClick={() => handleSort('sku')}
                  sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                >
                  SKU {sortField === 'sku' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableCell>
                <TableCell 
                  onClick={() => handleSort('stock_quantity')}
                  sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                  align="center"
                >
                  Stock {sortField === 'stock_quantity' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableCell>
                <TableCell 
                  onClick={() => handleSort('price')}
                  sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                  align="right"
                >
                  Price {sortField === 'price' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableCell>
                <TableCell 
                  onClick={() => handleSort('cost_price')}
                  sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                  align="right"
                >
                  Cost {sortField === 'cost_price' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography color="textSecondary">
                      {searchQuery ? 'No products match your search' : 'No products found. Create your first product!'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedProducts.map((product) => (
                  <TableRow 
                    key={product.id}
                    hover
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ProductIcon color="primary" />
                        <Box>
                          <Typography fontWeight="medium">{product.name}</Typography>
                          {product.description && (
                            <Typography variant="caption" color="textSecondary">
                              {product.description.length > 50 
                                ? product.description.substring(0, 50) + '...' 
                                : product.description}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={<BarcodeIcon />}
                        label={product.sku || 'N/A'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={product.stock_quantity}
                        size="small"
                        color={product.stock_quantity < 5 ? 'error' : product.stock_quantity < 10 ? 'warning' : 'success'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight="medium" color="success.main">
                        ${product.price?.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography color="textSecondary">
                        ${product.cost_price?.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Details">
                        <IconButton onClick={() => handleViewProduct(product)} size="small" color="info">
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton onClick={() => handleOpenDialog(product)} size="small" color="primary">
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton 
                          onClick={() => handleDelete(product.id, product.name)} 
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
          count={filteredProducts.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingProduct ? 'Edit Product' : 'Add New Product'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                autoFocus
                label="Product Name *"
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
                label="SKU *"
                fullWidth
                value={formData.sku}
                onChange={(e) => {
                  setFormData({ ...formData, sku: e.target.value });
                  if (formErrors.sku) setFormErrors({ ...formErrors, sku: '' });
                }}
                error={!!formErrors.sku}
                helperText={formErrors.sku}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BarcodeIcon color="action" />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Stock Quantity *"
                type="number"
                fullWidth
                value={formData.stock_quantity}
                onChange={(e) => {
                  setFormData({ ...formData, stock_quantity: e.target.value });
                  if (formErrors.stock_quantity) setFormErrors({ ...formErrors, stock_quantity: '' });
                }}
                error={!!formErrors.stock_quantity}
                helperText={formErrors.stock_quantity}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Selling Price *"
                type="number"
                fullWidth
                value={formData.price}
                onChange={(e) => {
                  setFormData({ ...formData, price: e.target.value });
                  if (formErrors.price) setFormErrors({ ...formErrors, price: '' });
                }}
                error={!!formErrors.price}
                helperText={formErrors.price}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MoneyIcon color="action" />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Cost Price *"
                type="number"
                fullWidth
                value={formData.cost_price}
                onChange={(e) => {
                  setFormData({ ...formData, cost_price: e.target.value });
                  if (formErrors.cost_price) setFormErrors({ ...formErrors, cost_price: '' });
                }}
                error={!!formErrors.cost_price}
                helperText={formErrors.cost_price}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <TrendingIcon color="action" />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingProduct ? 'Update Product' : 'Create Product'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Product Dialog */}
      <Dialog open={!!viewingProduct} onClose={handleCloseView} maxWidth="sm" fullWidth>
        {viewingProduct && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ProductIcon color="primary" />
                {viewingProduct.name}
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="body2" color="textSecondary">SKU</Typography>
                  <Typography variant="h6">{viewingProduct.sku}</Typography>
                </Grid>
                {viewingProduct.description && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="body2" color="textSecondary">Description</Typography>
                    <Typography>{viewingProduct.description}</Typography>
                  </Grid>
                )}
                <Grid size={{ xs: 6 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="body2" color="textSecondary">Stock Quantity</Typography>
                      <Typography variant="h5" color={viewingProduct.stock_quantity < 5 ? 'error' : 'inherit'}>
                        {viewingProduct.stock_quantity}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="body2" color="textSecondary">Profit Margin</Typography>
                      <Typography variant="h5" color="success.main">
                        {viewingProduct.cost_price > 0 
                          ? `${(((viewingProduct.price - viewingProduct.cost_price) / viewingProduct.price) * 100).toFixed(1)}%`
                          : 'N/A'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" color="textSecondary">Selling Price</Typography>
                  <Typography variant="h6" color="success.main">${viewingProduct.price?.toLocaleString()}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" color="textSecondary">Cost Price</Typography>
                  <Typography variant="h6">${viewingProduct.cost_price?.toLocaleString()}</Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="body2" color="textSecondary">
                    Created: {new Date(viewingProduct.created_at).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Last Updated: {new Date(viewingProduct.updated_at).toLocaleDateString()}
                  </Typography>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={handleCloseView}>Close</Button>
              <Button 
                variant="contained" 
                onClick={() => {
                  handleCloseView();
                  handleOpenDialog(viewingProduct);
                }}
              >
                Edit Product
              </Button>
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

export default Products;
