import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import './index.css'
import AuthGuard from './components/AuthGuard.tsx'
import PermissionGuard from './components/PermissionGuard.tsx'
import RootLayout from './layouts/RootLayout.tsx'
import DashboardPage from './pages/DashboardPage.tsx'
import ContractListPage from './pages/ContractListPage.tsx'
import ContractCreatePage from './pages/ContractCreatePage.tsx'
import ContractEditPage from './pages/ContractEditPage.tsx'
import LocationListPage from './pages/LocationListPage.tsx'
import LocationEditPage from './pages/LocationEditPage.tsx'
import CommodityListPage from './pages/CommodityListPage.tsx'
import CommodityEditPage from './pages/CommodityEditPage.tsx'
import UsersPage from './pages/UsersPage.tsx'
import CallbackPage from './pages/CallbackPage.tsx'

const router = createBrowserRouter([
  {
    path: '/callback',
    element: <CallbackPage />,
  },
  {
    path: '/',
    element: (
      <AuthGuard>
        <RootLayout />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'contracts', element: <PermissionGuard required={['hhh:contracts:read']}><ContractListPage /></PermissionGuard> },
      { path: 'contracts/new', element: <PermissionGuard required={['hhh:contracts:write']}><ContractCreatePage /></PermissionGuard> },
      { path: 'contracts/:id', element: <PermissionGuard required={['hhh:contracts:write']}><ContractEditPage /></PermissionGuard> },
      { path: 'locations', element: <PermissionGuard required={['hhh:locations:read']}><LocationListPage /></PermissionGuard> },
      { path: 'locations/new', element: <PermissionGuard required={['hhh:locations:write']}><LocationEditPage /></PermissionGuard> },
      { path: 'locations/:id', element: <PermissionGuard required={['hhh:locations:write']}><LocationEditPage /></PermissionGuard> },
      { path: 'commodities', element: <PermissionGuard required={['hhh:commodities:read']}><CommodityListPage /></PermissionGuard> },
      { path: 'commodities/new', element: <PermissionGuard required={['hhh:commodities:write']}><CommodityEditPage /></PermissionGuard> },
      { path: 'commodities/:id', element: <PermissionGuard required={['hhh:commodities:write']}><CommodityEditPage /></PermissionGuard> },
      { path: 'users', element: <PermissionGuard required={['auth:users:read']}><UsersPage /></PermissionGuard> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
