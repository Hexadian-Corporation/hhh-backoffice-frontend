import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import './index.css'
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

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'contracts', element: <ContractListPage /> },
      { path: 'contracts/new', element: <ContractCreatePage /> },
      { path: 'contracts/:id', element: <ContractEditPage /> },
      { path: 'locations', element: <LocationListPage /> },
      { path: 'locations/new', element: <LocationEditPage /> },
      { path: 'locations/:id', element: <LocationEditPage /> },
      { path: 'commodities', element: <CommodityListPage /> },
      { path: 'commodities/new', element: <CommodityEditPage /> },
      { path: 'commodities/:id', element: <CommodityEditPage /> },
      { path: 'users', element: <UsersPage /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
