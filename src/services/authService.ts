const API_BASE_URL = "http://localhost:5000/api/auth"; // adjust if your port differs

// ✅ Register new user
export const signUpUser = async (email: string, password: string, userData?: any) => {
  console.log("Attempting to register user:", email);
  try {
    const res = await fetch(`${API_BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, ...userData }),
    });

    const data = await res.json();
    console.log("Register response:", data);

    if (!res.ok) throw new Error(data.message || "Registration failed");

    if (data.token) localStorage.setItem("token", data.token);
    if (data.user) localStorage.setItem("user", JSON.stringify(data.user));

    return { error: null, user: data.user };
  } catch (error: any) {
    console.error("Register error:", error.message);
    return { error };
  }
};

// ✅ Login existing user
export const signInUser = async (email: string, password: string) => {
  console.log("Attempting to sign in user:", email);
  try {
    const res = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    console.log("Sign in response:", data);

    if (!res.ok) throw new Error(data.message || "Invalid credentials");

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    console.log("Sign in successful");
    return { shouldRedirectToWelcome: true, user: data.user };
  } catch (error: any) {
    console.error("Sign in error:", error.message);
    throw error;
  }
};

// ✅ Get currently stored user (used by DashboardLayout)
export const getUser = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

// ✅ Fetch user details from backend using token
export const fetchCurrentUser = async () => {
  console.log("Fetching current user...");
  try {
    const token = localStorage.getItem("token");
    if (!token) return { user: null };

    const res = await fetch(`${API_BASE_URL}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Unable to fetch user");

    return { user: data.user };
  } catch (error: any) {
    console.error("Fetch user error:", error.message);
    return { user: null };
  }
};

// ✅ Logout user (used by DashboardLayout)
export const logoutUser = async () => {
  console.log("Logging out user...");
  try {
    const token = localStorage.getItem("token");

    await fetch(`${API_BASE_URL}/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error) {
    console.warn("Logout request failed (offline mode ignored)");
  } finally {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    console.log("Logout successful");
  }
};
