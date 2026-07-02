import { QueryClient } from '@tanstack/react-query';

// Sensible MVP defaults: a single retry (avoid hammering a down backend),
// and no refetch-on-focus (avoids surprising re-fetches while iterating/demoing).
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
