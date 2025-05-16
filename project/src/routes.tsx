import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminStock from './pages/AdminStock';
import Requests from './pages/Requests';
import Reports from './pages/Reports';
import MyRequests from './pages/MyRequests';
import ItemsInUse from './pages/ItemsInUse';
import StockManagement from './pages/StockManagement';
import ApprovedRequests from './pages/ApprovedRequests';
import IssueItems from './pages/IssueItems';
import Users from './pages/Users';
import Settings from './pages/Settings';
import Dashboard from './pages/Dashboard';
import IssuedItemDetails from './pages/IssuedItemDetails';
import RepairItems from './pages/RepairItems';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/stock-availability" element={<AdminStock />} />
      <Route path="/requests" element={<Requests />} />
      <Route path="/report" element={<Reports />} />
      <Route path="/my-requests" element={<MyRequests />} />
      <Route path="/in-use-items" element={<ItemsInUse />} />
      <Route path="/stock-management" element={<StockManagement />} />
      <Route path="/approved-requests" element={<ApprovedRequests />} />
      <Route path="/issue-item" element={<IssueItems />} />
      <Route path="/users" element={<Users />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/issued-item-details" element={<IssuedItemDetails />} />
      <Route path="/repair-items" element={<RepairItems />} />
    </Routes>
  );
};