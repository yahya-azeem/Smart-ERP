import React, { useEffect, useState } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Chip, CircularProgress, Button, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, IconButton, FormControl, 
  InputLabel, Select, MenuItem, Grid
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, CheckCircle as ReceiveIcon } from '@mui/icons-material';
import api from '../api/axios';

interface LeatherSupplier {
  id: string;
  name: string;
}

interface LeatherType {
  id: string;
  name: string;
}

interface LeatherPurchaseOrder {
  id: string;
  order_number: string;
  date: string;
  status: string;
  supplier: LeatherSupplier;
  total_amount: number;
  lines: LeatherPurchaseOrderLine[];
}

interface LeatherPurchaseOrderLine {
  id: string;
  leather_type: LeatherType;
  quantity: number;
  unit_price: number;
  total_price: number;
}

const LeatherPurchaseOrders: React.FC = () => {
  const [orders, setOrders] = useState<LeatherPurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<LeatherSupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<LeatherPurchaseOrder | null>(null);
  const [formData, setFormData] = useState({
    order_number: '',
    date: new Date().toISOString().split('T')[0],
    supplier: '',
    status: 'DRAFT'
  });

  const fetchOrders = () => {
    setLoading(true);
    api.get('/leather-purchase-orders/')
      .then(res => setOrders(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const fetchSuppliers = () => {
    api.get('/leather-suppliers/')
      .then(res => setSuppliers(res.data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchOrders();
    fetchSuppliers();
  }, []);

  const handleOpen = (order?: LeatherPurchaseOrder) => {
    if (order) {
      setEditingOrder(order);
      setFormData({
        order_number: order.order_number,
        date: order.date,
        supplier: order.supplier.id,
        status: order.status
      });
    } else {
      setEditingOrder(null);
      setFormData({ 
        order_number: '', 
        date: new Date().toISOString().split('T')[0], 
        supplier: '', 
        status: 'DRAFT' 
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingOrder(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingOrder) {
        await api.put(`/leather-purchase-orders/${editingOrder.id}/`, formData);
      } else {
        await api.post('/leather-purchase-orders/', formData);
      }
      handleClose();
      fetchOrders();
    } catch (err) {
      console.error('Error saving order:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        await api.delete(`/leather-purchase-orders/${id}/`);
        fetchOrders();
      } catch (err) {
        console.error('Error deleting order:', err);
      }
    }
  };

  const handleReceive = async (id: string) => {
    if (window.confirm('Mark this order as received?')) {
      try {
        await api.post(`/leather-purchase-orders/${id}/receive/`);
        fetchOrders();
      } catch (err) {
        console.error('Error receiving order:', err);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RECEIVED': return 'success';
      case 'ORDERED': return 'info';
      case 'DRAFT': return 'warning';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  if (loading) return <CircularProgress />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom>Leather Purchase Orders</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          Add Order
        </Button>
      </Box>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order #</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Supplier</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.order_number}</TableCell>
                <TableCell>{row.date}</TableCell>
                <TableCell>{row.supplier?.name}</TableCell>
                <TableCell>
                  <Chip 
                    label={row.status} 
                    color={getStatusColor(row.status) as any} 
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">${row.total_amount?.toFixed(2) || '0.00'}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpen(row)} size="small">
                    <EditIcon />
                  </IconButton>
                  {row.status === 'ORDERED' && (
                    <IconButton 
                      onClick={() => handleReceive(row.id)} 
                      size="small" 
                      color="success"
                      title="Receive Order"
                    >
                      <ReceiveIcon />
                    </IconButton>
                  )}
                  <IconButton onClick={() => handleDelete(row.id)} size="small" color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingOrder ? 'Edit Leather Purchase Order' : 'Add Leather Purchase Order'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                autoFocus
                label="Order Number"
                fullWidth
                value={formData.order_number}
                onChange={(e) => setFormData({ ...formData, order_number: e.target.value })}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Date"
                type="date"
                fullWidth
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth required>
                <InputLabel>Supplier</InputLabel>
                <Select
                  value={formData.supplier}
                  label="Supplier"
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                >
                  {suppliers.map((supplier) => (
                    <MenuItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <MenuItem value="DRAFT">Draft</MenuItem>
                  <MenuItem value="ORDERED">Ordered</MenuItem>
                  <MenuItem value="RECEIVED">Received</MenuItem>
                  <MenuItem value="CANCELLED">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingOrder ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LeatherPurchaseOrders;
