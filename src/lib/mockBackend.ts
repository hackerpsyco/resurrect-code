export const backendClient = {
  auth: {
    onAuthStateChange: (cb: any) => {
      // Return subscription interface
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
    getSession: async () => {
      return { data: { session: null }, error: null };
    },
    signInWithOtp: async () => ({ error: null }),
    signInWithOAuth: async () => ({ error: null }),
    verifyOtp: async () => ({ data: {}, error: null }),
    signOut: async () => {}
  },
  from: () => {
    // Chainable Mock builder
    const chain: any = {
      select: () => chain,
      eq: () => chain,
      single: async () => ({ data: null, error: null }),
      upsert: async () => ({ data: null, error: null }),
      delete: () => chain,
      insert: async () => ({ data: null, error: null })
    };
    return chain;
  }
};
