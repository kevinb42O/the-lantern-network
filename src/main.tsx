import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from "react-error-boundary";
import { RouterProvider } from 'react-router-dom';

import { router } from './router';
import { ErrorFallback } from './ErrorFallback.tsx'
import { QueryProvider } from './providers/QueryProvider.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'

import "./main.css"
import "./index.css"

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <QueryProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryProvider>
   </ErrorBoundary>
)
