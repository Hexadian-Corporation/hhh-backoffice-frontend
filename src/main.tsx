import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import './index.css'
import RootLayout from './layouts/RootLayout.tsx'
import DashboardPage from './pages/DashboardPage.tsx'
import ContractListPage from './pages/ContractListPage.tsx'
import ContractEditPage from './pages/ContractEditPage.tsx'
import LocationListPage from './pages/LocationListPage.tsx'
import LocationEditPage from './pages/LocationEditPage.tsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'contracts', element: <ContractListPage /> },
      { path: 'contracts/:id', element: <ContractEditPage /> },
      { path: 'locations', element: <LocationListPage /> },
      { path: 'locations/new', element: <LocationEditPage /> },
      { path: 'locations/:id', element: <LocationEditPage /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
