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
import RepairItems from './pages/RepairItems';
import IssuedItemDetails from './pages/IssuedItemDetails';
import PendingRequests from './pages/PendingRequests';
import DamagedItems from './pages/DamagedItems';
import DamagedItemDetails from './pages/DamagedItemDetails';
import RepairInProgress from './pages/RepairInProgress';
import MyRepairRequests from './pages/MyRepairRequests';
import PendingRepairRequests from './PendingRepairRequests';
import AdminReportPage from './pages/AdminReportPage';
import SystemAdminReportPage from './pages/SystemAdminReportPage';
import LogisticOfficerReportPage from './pages/LogisticOfficerReportPage';
import UnitLeaderReportPage from './pages/UnitLeaderReportPage';
import RepairRequestDetails from './pages/RepairRequestDetails';
import DamagedItemGroupDetails from './pages/DamagedItemGroupDetails';

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
      <Route path="/repair-items" element={<RepairItems />} />
      <Route path="/issued-item-details" element={<IssuedItemDetails />} />
      <Route path="/pending-requests" element={<PendingRequests />} />
      <Route path="/damaged-items" element={<DamagedItems />} />
      <Route path="/damaged-items/:id" element={<DamagedItemDetails />} />
      <Route path="/repair-in-process" element={<RepairInProgress />} />
      <Route path="/my-repair-requests" element={<MyRepairRequests />} />
      <Route path="/PendingRepairRequests" element={<PendingRepairRequests />} />
      <Route path="/reports/admin" element={<AdminReportPage />} />
      <Route path="/reports/system-admin" element={<SystemAdminReportPage />} />
      <Route path="/reports/logistic-officer" element={<LogisticOfficerReportPage />} />
      <Route path="/reports/unit-leader" element={<UnitLeaderReportPage />} />
      <Route path="/repair-request-details/:itemName/:itemCategory" element={<RepairRequestDetails />} />
      <Route path="/damaged-items/group/:itemName/:itemCategory" element={<DamagedItemGroupDetails />} />
    </Routes>
  );
};