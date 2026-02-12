import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Invoices from './pages/Invoices';
import Vendors from './pages/Vendors';
import PurchaseOrders from './pages/PurchaseOrders';
import Customers from './pages/Customers';
import LeatherSuppliers from './pages/LeatherSuppliers';
import LeatherTypes from './pages/LeatherTypes';
import Payments from './pages/Payments';
import LeatherPurchaseOrders from './pages/LeatherPurchaseOrders';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="customers" element={<Customers />} />
            <Route path="orders" element={<Orders />} />
            <Route path="vendors" element={<Vendors />} />
            <Route path="purchase-orders" element={<PurchaseOrders />} />
            <Route path="leather-suppliers" element={<LeatherSuppliers />} />
            <Route path="leather-types" element={<LeatherTypes />} />
            <Route path="leather-purchase-orders" element={<LeatherPurchaseOrders />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="payments" element={<Payments />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
