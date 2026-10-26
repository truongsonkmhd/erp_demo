import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { canAccess, firstAllowedPath } from "@/lib/permissions";

import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "../views/pages/DashboardPage";
import Projects from "../views/pages/ProjectsPage";
import ProjectsSalePage from "../views/pages/ProjectsSalePage";
import NotFound from "../views/pages/NotFound";
import AuthScreen from "@/views/login/AuthScreen";
import RolesPage from "@/views/pages/RolesPage";
import ProjectPhaseTemplatesPage from "@/views/pages/ProjectPhaseTemplatesPage";

import DocumentsPage from "@/views/pages/DocumentsPage";
import LearningPage from "@/views/pages/LearningPage";
import UserGuidePage from "@/views/pages/UserGuidePage";
import { useAuth } from "@/services/auth/AuthContext";
import { BoatLoading } from "@/components/ui/boat-loading";
import ModulePlaceholderPage from "@/views/pages/ModulePlaceholderPage";
import HrmPlaceholderPage from "@/views/pages/HrmPlaceholderPage";
import IncomingDocumentsPage from "@/views/pages/IncomingDocumentsPage";
import OutgoingDocumentsPage from "@/views/pages/OutgoingDocumentsPage";
import DossierManagementPage from "@/views/pages/DossierManagementPage";
import WorkflowManagementPage from "@/views/pages/WorkflowManagementPage";
import PendingTasksPage from "@/views/pages/PendingTasksPage";
import ApprovalLogsPage from "@/views/pages/ApprovalLogsPage";
import SlaMonitoringPage from "@/views/pages/SlaMonitoringPage";
import DocumentSearchPage from "@/views/pages/DocumentSearchPage";
import AssetProfilesPage from "@/views/pages/AssetProfilesPage";
import AssetMaintenancePage from "@/views/pages/AssetMaintenancePage";
import AssetDispatchPage from "@/views/pages/AssetDispatchPage";
import AssetAnalyticsPage from "@/views/pages/AssetAnalyticsPage";
import {
  erpModuleItems,
  hrmNavigationChildren,
  docNavigationChildren,
  assetNavigationChildren,
  engineeringNavigationChildren,
} from "@/components/layout/erp-navigation";
import EngineeringPlanItemsPage from "@/views/pages/EngineeringPlanItemsPage";
import EngineeringDailyLogPage from "@/views/pages/EngineeringDailyLogPage";
import EngineeringQualityInspectionPage from "@/views/pages/EngineeringQualityInspectionPage";
import EngineeringAcceptancePage from "@/views/pages/EngineeringAcceptancePage";
import EmployeeProfilesPage from "@/features/hrm/employee-profiles/pages/EmployeeProfilesPage";
import EmployeeProfileDetailPage from "@/features/hrm/employee-profiles/pages/EmployeeProfileDetailPage";
import HrmDevelopmentPage from "@/features/hrm/development/pages/HrmDevelopmentPage";
import { HrmPayrollPage } from "@/features/hrm/payroll";
import { HrmExpertisePage } from "@/features/hrm/expertise";
import { HrmAllocationPage } from "@/features/hrm/allocation";
import { ROOT, routeCodes } from "@/features/mission/ui";
import RecordsPage from "@/features/mission/RecordsPage";
import PlansPage from "@/features/mission/PlansPage";
import ProgressPage from "@/features/mission/ProgressPage";
import ResourcesPage from "@/features/mission/ResourcesPage";
import ComparisonPage from "@/features/mission/ComparisonPage";
import ProcurementPage from "@/features/procurement/pages/ProcurementPage";
import InventoryPage from "@/features/inventory/pages/InventoryPage";
import { MaterialSettlementPage } from "@/features/settlement/pages/MaterialSettlementPage";
import VldcPage from "@/features/vldc/pages/VldcPage";

const queryClient = new QueryClient();
function LegacyBoardRedirect() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  params.set("tab", "kanban");
  return <Navigate to={`${ROOT}/ho-so-nhiem-vu?${params.toString()}`} replace />;
}

const missionPages = [RecordsPage, LegacyBoardRedirect, PlansPage, ProgressPage, ResourcesPage, ComparisonPage];

function MissionEntry() {
  const { user } = useAuth();
  const first = routeCodes.find((code) => canAccess(user, `ke-hoach-nhiem-vu-du-an/${code}`));
  return first ? <Navigate to={`${ROOT}/${first}`} replace /> : <div className="p-8">Bạn không có quyền truy cập phân hệ này.</div>;
}

function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <BoatLoading />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  const page = location.pathname.slice(1);
  if (page && !canAccess(user, page)) return <div className="p-8">Bạn không có quyền truy cập trang này.</div>;
  return <Outlet />;
}

function PublicOnlyRoute() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <BoatLoading />
      </div>
    );
  }
  if (user) return <Navigate to={firstAllowedPath(user)} replace />;
  return <Outlet />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />

      <Routes>
        <Route path="/" element={<Navigate to="/auth" replace />} />

        <Route element={<PublicOnlyRoute />}>
          <Route path="/auth" element={<AuthScreen />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            {erpModuleItems.map((item) => (
              <Route
                key={item.url}
                path={item.url}
                element={<ModulePlaceholderPage title={item.title} description={item.description} />}
              />
            ))}
            <Route path={ROOT} element={<MissionEntry />} />
            {routeCodes.map((code, index) => {
              const Page = missionPages[index];
              return <Route key={code} path={`${ROOT}/${code}`} element={<Page />} />;
            })}
            <Route
              path="/tai-san-thiet-bi"
              element={<Navigate to={assetNavigationChildren[0].url} replace />}
            />
            <Route
              path="/tai-san-thiet-bi/ho-so-thiet-bi"
              element={<AssetProfilesPage />}
            />
            <Route
              path="/tai-san-thiet-bi/kiem-dinh-bao-duong"
              element={<AssetMaintenancePage />}
            />
            <Route
              path="/tai-san-thiet-bi/dieu-dong-su-dung"
              element={<AssetDispatchPage />}
            />
            <Route
              path="/tai-san-thiet-bi/phan-tich-canh-bao"
              element={<AssetAnalyticsPage />}
            />
            <Route
              path="/ky-thuat-nghiem-thu"
              element={<Navigate to={engineeringNavigationChildren[0]?.url || "/ky-thuat-nghiem-thu/ke-hoach-hang-muc"} replace />}
            />
            <Route
              path="/ky-thuat-nghiem-thu/ke-hoach-hang-muc"
              element={<EngineeringPlanItemsPage />}
            />
            <Route
              path="/ky-thuat-nghiem-thu/nhat-ky-khoi-luong"
              element={<EngineeringDailyLogPage />}
            />
            <Route
              path="/ky-thuat-nghiem-thu/kiem-tra-chat-luong"
              element={<EngineeringQualityInspectionPage />}
            />
            <Route
              path="/ky-thuat-nghiem-thu/nghiem-thu-bien-ban"
              element={<EngineeringAcceptancePage />}
            />
            <Route
              path="/nhan-su-tien-luong"
              element={<Navigate to={hrmNavigationChildren[0].url} replace />}
            />
            <Route
              path="/van-ban-ho-so-phe-duyet"
              element={<Navigate to={docNavigationChildren[0].url} replace />}
            />
            {docNavigationChildren.map((item) => (
              <Route
                key={item.url}
                path={item.url}
                element={
                  item.url === "/van-ban-ho-so-phe-duyet/van-ban-den" ? (
                    <IncomingDocumentsPage />
                  ) : item.url === "/van-ban-ho-so-phe-duyet/van-ban-di" ? (
                    <OutgoingDocumentsPage />
                  ) : item.url === "/van-ban-ho-so-phe-duyet/quan-ly-ho-so" ? (
                    <DossierManagementPage />
                  ) : item.url === "/van-ban-ho-so-phe-duyet/quy-trinh-phe-duyet" ? (
                    <WorkflowManagementPage />
                  ) : item.url === "/van-ban-ho-so-phe-duyet/viec-can-xu-ly" ? (
                    <PendingTasksPage />
                  ) : item.url === "/van-ban-ho-so-phe-duyet/nhat-ky-phe-duyet" ? (
                    <ApprovalLogsPage />
                  ) : item.url === "/van-ban-ho-so-phe-duyet/theo-doi-sla" ? (
                    <SlaMonitoringPage />
                  ) : item.url === "/van-ban-ho-so-phe-duyet/tra-cuu" ? (
                    <DocumentSearchPage />
                  ) : (
                    <ModulePlaceholderPage title={item.title} description={item.description} />
                  )
                }
              />
            ))}
            <Route
              path="/nhan-su-tien-luong/ho-so-nhan-su"
              element={<EmployeeProfilesPage />}
            />
            <Route
              path="/nhan-su-tien-luong/ho-so-nhan-su/:id"
              element={<EmployeeProfileDetailPage />}
            />
            <Route
              path="/nhan-su-tien-luong/dao-tao-khen-thuong"
              element={<Navigate to="/nhan-su-tien-luong/ho-so-nhan-su?tab=development" replace />}
            />
            <Route
              path="/nhan-su-tien-luong/tien-luong"
              element={<HrmPayrollPage />}
            />
            <Route
              path="/nhan-su-tien-luong/nang-luc-chuyen-gia"
              element={<HrmExpertisePage />}
            />
            <Route
              path="/nhan-su-tien-luong/phan-bo-nhan-luc"
              element={<HrmAllocationPage />}
            />
            {hrmNavigationChildren
              .filter(
                (item) =>
                  item.url !== "/nhan-su-tien-luong/ho-so-nhan-su" &&
                  item.url !== "/nhan-su-tien-luong/tien-luong" &&
                  item.url !== "/nhan-su-tien-luong/nang-luc-chuyen-gia" &&
                  item.url !== "/nhan-su-tien-luong/phan-bo-nhan-luc"
              )
              .map((item) => (
                <Route
                  key={item.url}
                  path={item.url}
                  element={<HrmPlaceholderPage title={item.title} />}
                />
              ))}

            {/* Phân hệ 07: Quản lý mua sắm – vật tư – kho */}
            <Route
              path="/mua-sam-vat-tu-kho"
              element={<Navigate to="/mua-sam-vat-tu-kho/mua-sam" replace />}
            />
            <Route
              path="/mua-sam-vat-tu-kho/mua-sam"
              element={<ProcurementPage />}
            />
            <Route
              path="/mua-sam-vat-tu-kho/kho-vat-tu"
              element={<InventoryPage />}
            />
            <Route
              path="/mua-sam-vat-tu-kho/quyet-toan"
              element={<MaterialSettlementPage />}
            />

            <Route path="/projects-marketing" element={<Projects />} />
            <Route path="/projects-sale" element={<ProjectsSalePage />} />
            <Route path="/projects-cskh" element={<ProjectsSalePage />} />
            <Route path="/timeline" element={<div>(Sắp Ra Mắt)</div>} />

            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/learning" element={<LearningPage />} />
            <Route path="/huong-dan" element={<UserGuidePage />} />
            <Route path="/roles" element={<RolesPage />} />
            <Route path="/access-management" element={<RolesPage area="access" />} />
            <Route path="/templates" element={<ProjectPhaseTemplatesPage />} />

            <Route path="/reports" element={<div>Trang Báo Cáo (Sắp Ra Mắt)</div>} />
            <Route path="/tools" element={<div>Trang Công Cụ (Sắp Ra Mắt)</div>} />
            <Route path="/settings" element={<div>Trang Cài Đặt (Sắp Ra Mắt)</div>} />
          </Route>

          {/* VLDC (chuyển từ vldc-erp-react): shell riêng, menu lấy từ /api/menus/me?module=vldc */}
          <Route path="/vldc" element={<Navigate to="/vldc/dashboard" replace />} />
          <Route path="/vldc/:pageId/*" element={<VldcPage />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
