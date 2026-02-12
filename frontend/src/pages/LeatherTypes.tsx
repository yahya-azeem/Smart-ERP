import React, { useEffect, useState } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, CircularProgress, Button, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, IconButton 
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import api from '../api/axios';

interface LeatherType {
  id: string;
  name: string;
  description: string;
}

const LeatherTypes: React.FC = () => {
  const [types, setTypes] = useState<LeatherType[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingType, setEditingType] = useState<LeatherType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const fetchTypes = () => {
    setLoading(true);
    api.get('/leather-types/')
      .then(res => setTypes(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  const handleOpen = (type?: LeatherType) => {
    if (type) {
      setEditingType(type);
      setFormData({
        name: type.name,
        description: type.description || ''
      });
    } else {
      setEditingType(null);
      setFormData({ name: '', description: '' });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingType(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingType) {
        await api.put(`/leather-types/${editingType.id}/`, formData);
      } else {
        await api.post('/leather-types/', formData);
      }
      handleClose();
      fetchTypes();
    } catch (err) {
      console.error('Error saving leather type:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this leather type?')) {
      try {
        await api.delete(`/leather-types/${id}/`);
        fetchTypes();
      } catch (err) {
        console.error('Error deleting leather type:', err);
      }
    }
  };

  if (loading) return <CircularProgress />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom>Leather Types</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          Add Type
        </Button>
      </Box>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {types.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.description}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpen(row)} size="small">
                    <EditIcon />
                  </IconButton>
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
          {editingType ? 'Edit Leather Type' : 'Add Leather Type'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingType ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LeatherTypes;
