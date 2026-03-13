type StoredAuth = {
  user: User;
  token: string;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const authStr = localStorage.getItem("courseflow_auth");
    if (authStr) {
      const auth: StoredAuth = JSON.parse(authStr);
      setUser(auth.user);
    }
    setLoading(false);
  }, []);

  const login = (data: any) => {
    const auth: StoredAuth = {
      user: {
        id: data.id,
        email: data.email,
        role: data.role,
      },
      token: data.token,
    };

    localStorage.setItem("courseflow_auth", JSON.stringify(auth));
    setUser(auth.user);
  };

  const logout = () => {
    localStorage.removeItem("courseflow_auth");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        logout,
        getRoleBasedRedirect,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
