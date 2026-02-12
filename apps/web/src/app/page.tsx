"use client";

import { useState } from "react";
import Link from "next/link";

// ✅ All three imported from the SAME shared package
import {
  validateCreateUser,
  ICreateUserRequest,
  ICreateUserResponse,
  USER_ROLES,
  API_ENDPOINTS,
  ERROR_MESSAGES,
} from "@myproject/shared";

export default function Home(): React.JSX.Element {
  const [formData, setFormData] = useState<ICreateUserRequest>({
    name: "",
    email: "",
    role: "user",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [response, setResponse] = useState<ICreateUserResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ Frontend validation using SHARED function
    const validation = validateCreateUser(formData);

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      // ✅ Using SHARED constant for the API endpoint
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}${API_ENDPOINTS.USERS}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      // ✅ Response typed with SHARED interface
      const data: ICreateUserResponse = await res.json();
      setResponse(data);
    } catch {
      setResponse({
        success: false,
        message: ERROR_MESSAGES.USER_CREATION_FAILED,
        data: null,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: 480, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h1>Create User</h1>
      <p style={{ color: "#666", fontSize: 14 }}>
        This form uses shared validation, types & constants from{" "}
        <code>@myproject/shared</code>
      </p>

      <form onSubmit={handleSubmit}>
        {/* Name */}
        <div style={{ marginBottom: 16 }}>
          <label>Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
          />
          {errors.name && <p style={{ color: "red", fontSize: 13 }}>{errors.name}</p>}
        </div>

        {/* Email */}
        <div style={{ marginBottom: 16 }}>
          <label>Email</label>
          <input
            type="text"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
          />
          {errors.email && <p style={{ color: "red", fontSize: 13 }}>{errors.email}</p>}
        </div>

        {/* Role - uses SHARED constant for options */}
        <div style={{ marginBottom: 16 }}>
          <label>Role</label>
          <select
            value={formData.role}
            onChange={(e) =>
              setFormData({ ...formData, role: e.target.value as ICreateUserRequest["role"] })
            }
            style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
          >
            {/* ✅ Using SHARED constant for role options */}
            {USER_ROLES.map((role) => (
              <option key={role} value={role}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </option>
            ))}
          </select>
          {errors.role && <p style={{ color: "red", fontSize: 13 }}>{errors.role}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{ padding: "10px 24px", cursor: "pointer" }}
        >
          {loading ? "Creating..." : "Create User"}
        </button>
      </form>

      {/* Navigation */}
      <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
        <Link
          href="/chess"
          style={{
            padding: "10px 24px",
            background: "#4a5568",
            color: "white",
            textDecoration: "none",
            borderRadius: 4,
          }}
        >
          Play Local Chess
        </Link>
        <Link
          href="/multiplayer"
          style={{
            padding: "10px 24px",
            background: "#2563eb",
            color: "white",
            textDecoration: "none",
            borderRadius: 4,
          }}
        >
          Play Multiplayer
        </Link>
      </div>

      {/* Response */}
      {response && (
        <div
          style={{
            marginTop: 24,
            padding: 16,
            background: response.success ? "#e6ffe6" : "#ffe6e6",
            borderRadius: 8,
          }}
        >
          <strong>{response.success ? "✅ Success" : "❌ Error"}</strong>
          <p>{response.message}</p>
          {response.data && <pre>{JSON.stringify(response.data, null, 2)}</pre>}
        </div>
      )}
    </main>
  );
}
