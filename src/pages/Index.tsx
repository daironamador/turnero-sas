
import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Dashboard from '@/components/dashboard/Dashboard';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client with more frequent refetch settings for real-time updates
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      staleTime: 10000, // 10 seconds before data is considered stale
    },
  },
});

const Index: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <MainLayout>
        <Dashboard />
      </MainLayout>
    </QueryClientProvider>
  );
};

export default Index;
