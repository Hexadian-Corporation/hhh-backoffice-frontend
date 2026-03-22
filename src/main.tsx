import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import './index.css'
import { AuthProvider, AuthGuard, PermissionGuard } from '@hexadian-corporation/auth-react'
import type { AuthConfig } from '@hexadian-corporation/auth-react'
import RootLayout from './layouts/RootLayout.tsx'
import DashboardPage from './pages/DashboardPage.tsx'
import ContractListPage from './pages/ContractListPage.tsx'
import ContractCreatePage from './pages/ContractCreatePage.tsx'
import ContractEditPage from './pages/ContractEditPage.tsx'
import LocationListPage from './pages/LocationListPage.tsx'
import LocationEditPage from './pages/LocationEditPage.tsx'
import CommodityListPage from './pages/CommodityListPage.tsx'
import CommodityEditPage from './pages/CommodityEditPage.tsx'
import ShipListPage from './pages/ShipListPage.tsx'
import ShipEditPage from './pages/ShipEditPage.tsx'
import GraphListPage from './pages/GraphListPage.tsx'
import GraphDetailPage from './pages/GraphDetailPage.tsx'
import FlightPlanListPage from './pages/FlightPlanListPage.tsx'
import FlightPlanDetailPage from './pages/FlightPlanDetailPage.tsx'
import RouteDetailPage from './pages/RouteDetailPage.tsx'
import PenaltyConfigPage from './pages/PenaltyConfigPage.tsx'
import UsersPage from './pages/UsersPage.tsx'
import AlgorithmConfigPage from './pages/AlgorithmConfigPage.tsx'
import CallbackPage from './pages/CallbackPage.tsx'
import ForbiddenPage from './pages/ForbiddenPage.tsx'
import InsufficientPermissionsPage from './pages/InsufficientPermissionsPage.tsx'

const BACKOFFICE_PERMISSIONS = [
  "hhh:locations:write",
  "hhh:commodities:write",
  "hhh:ships:write",
  "hhh:graphs:write",
  "hhh:routes:write",
];

const authConfig: AuthConfig = {
  authServiceUrl: import.meta.env.VITE_AUTH_API_URL ?? 'http://localhost:8006',
  clientId: import.meta.env.VITE_AUTH_CLIENT_ID ?? 'hhh-backoffice',
  redirectUri: `${window.location.origin}/callback`,
}

const LoadingFallback = (
  <div className="flex h-screen items-center justify-center bg-[var(--color-bg)]">
    <p className="text-[var(--color-text-muted)]">Loading…</p>
  </div>
);

const router = createBrowserRouter([
  {
    path: '/callback',
    element: <CallbackPage />,
  },
  {
    path: '/',
    element: (
      <AuthGuard fallback={LoadingFallback}>
        <PermissionGuard required={BACKOFFICE_PERMISSIONS} fallback={<ForbiddenPage />}>
          <RootLayout />
        </PermissionGuard>
      </AuthGuard>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'contracts', element: <PermissionGuard required={['hhh:contracts:read']} fallback={<InsufficientPermissionsPage />}><ContractListPage /></PermissionGuard> },
      { path: 'contracts/new', element: <PermissionGuard required={['hhh:contracts:write']} fallback={<InsufficientPermissionsPage />}><ContractCreatePage /></PermissionGuard> },
      { path: 'contracts/:id', element: <PermissionGuard required={['hhh:contracts:write']} fallback={<InsufficientPermissionsPage />}><ContractEditPage /></PermissionGuard> },
      { path: 'locations', element: <PermissionGuard required={['hhh:locations:read']} fallback={<InsufficientPermissionsPage />}><LocationListPage /></PermissionGuard> },
      { path: 'locations/new', element: <PermissionGuard required={['hhh:locations:write']} fallback={<InsufficientPermissionsPage />}><LocationEditPage /></PermissionGuard> },
      { path: 'locations/:id', element: <PermissionGuard required={['hhh:locations:write']} fallback={<InsufficientPermissionsPage />}><LocationEditPage /></PermissionGuard> },
      { path: 'commodities', element: <PermissionGuard required={['hhh:commodities:read']} fallback={<InsufficientPermissionsPage />}><CommodityListPage /></PermissionGuard> },
      { path: 'commodities/new', element: <PermissionGuard required={['hhh:commodities:write']} fallback={<InsufficientPermissionsPage />}><CommodityEditPage /></PermissionGuard> },
      { path: 'commodities/:id', element: <PermissionGuard required={['hhh:commodities:write']} fallback={<InsufficientPermissionsPage />}><CommodityEditPage /></PermissionGuard> },
      { path: 'ships', element: <PermissionGuard required={['hhh:ships:read']} fallback={<InsufficientPermissionsPage />}><ShipListPage /></PermissionGuard> },
      { path: 'ships/new', element: <PermissionGuard required={['hhh:ships:write']} fallback={<InsufficientPermissionsPage />}><ShipEditPage /></PermissionGuard> },
      { path: 'ships/:id', element: <PermissionGuard required={['hhh:ships:write']} fallback={<InsufficientPermissionsPage />}><ShipEditPage /></PermissionGuard> },
      { path: 'graphs', element: <PermissionGuard required={['hhh:graphs:read']} fallback={<InsufficientPermissionsPage />}><GraphListPage /></PermissionGuard> },
      { path: 'graphs/:id', element: <PermissionGuard required={['hhh:graphs:read']} fallback={<InsufficientPermissionsPage />}><GraphDetailPage /></PermissionGuard> },
      { path: 'flight-plans', element: <PermissionGuard required={['hhh:routes:read']} fallback={<InsufficientPermissionsPage />}><FlightPlanListPage /></PermissionGuard> },
      { path: 'flight-plans/:id', element: <PermissionGuard required={['hhh:routes:read']} fallback={<InsufficientPermissionsPage />}><FlightPlanDetailPage /></PermissionGuard> },
      { path: 'routes/:id', element: <PermissionGuard required={['hhh:routes:read']} fallback={<InsufficientPermissionsPage />}><RouteDetailPage /></PermissionGuard> },
      { path: 'penalties', element: <PermissionGuard required={['hhh:routes:write']} fallback={<InsufficientPermissionsPage />}><PenaltyConfigPage /></PermissionGuard> },
      { path: 'users', element: <PermissionGuard required={['auth:users:read']} fallback={<InsufficientPermissionsPage />}><UsersPage /></PermissionGuard> },
      { path: 'algorithms', element: <PermissionGuard required={['auth:rbac:manage']} fallback={<InsufficientPermissionsPage />}><AlgorithmConfigPage /></PermissionGuard> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider config={authConfig}>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
)
