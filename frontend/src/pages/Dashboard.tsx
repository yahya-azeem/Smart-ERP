import React, { useEffect, useState } from 'react';
import { 
  Grid, Paper, Typography, Box, Card, CardContent, CircularProgress 
} from '@mui/material';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import api from '../api/axios';

const Dashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/dashboard/');
        setData(response.data);
      } catch (error) {
        console.error("Error fetching dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  }

  if (!data) return <Typography>Error loading data.</Typography>;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      {/* KPI Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Revenue (Invoiced)</Typography>
              <Typography variant="h5">${data.financials.total_revenue_invoiced?.toLocaleString() ?? 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Cash Collected</Typography>
              <Typography variant="h5" color="success.main">${data.financials.cash_collected?.toLocaleString() ?? 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Pending Income</Typography>
              <Typography variant="h5" color="error.main">${data.financials.pending_income?.toLocaleString() ?? 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Sales Chart */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 300 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Monthly Sales Trend
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.sales_overview.monthly_sales_trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { month: 'short' })} />
                <YAxis />
                <Tooltip labelFormatter={(str) => new Date(str).toLocaleDateString()} />
                <Line type="monotone" dataKey="total" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Inventory / Stats */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2, height: 300, overflow: 'auto' }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Low Stock Alerts
            </Typography>
            {data.inventory.low_stock_items.length === 0 ? (
              <Typography>All items well stocked.</Typography>
            ) : (
              data.inventory.low_stock_items.map((item: any, index: number) => (
                <Box key={index} sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', pb: 1 }}>
                  <Typography variant="body1">{item.name}</Typography>
                  <Typography variant="body1" color="error" fontWeight="bold">{item.stock_quantity}</Typography>
                </Box>
              ))
            )}
            
            <Box mt={4}>
                <Typography component="h2" variant="h6" color="primary" gutterBottom>
                Order Status
                </Typography>
                {data.sales_overview.orders_by_status.map((stat: any, index: number) => (
                    <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography>{stat.status}</Typography>
                        <Typography fontWeight="bold">{stat.count}</Typography>
                    </Box>
                ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
