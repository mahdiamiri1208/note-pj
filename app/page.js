"use client";

import { useState } from "react";

export default function Home() {
  const [users, setUsers] = useState([]);

  async function createUser() {
    const random = Date.now();

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Aliiiiiiiiiiiiiii",
        email: `ali${random}@test.com`,
      }),
    });

    const data = await res.json();
    console.log("User created:", data);

    // آپدیت لیست بعد از ایجاد
    setUsers((prev) => [...prev, data]);
  }

  async function getUser() {
    const res = await fetch("/api/users", {
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();
    console.log("Users:", data);
    setUsers(data);
  }

  async function deleteUser(id) {
    const res = await fetch(`/api/users/${id}`, {
      method: "DELETE",
    });

    const data = await res.json();
    console.log(data);

    // آپدیت لیست بعد از حذف
    setUsers((prev) => prev.filter((user) => user._id !== id));
  }

  return (
    <div>
      <button onClick={createUser}>Create User</button>
      <br />
      <button onClick={getUser}>Get Users</button>

      <ul>
        {users.map((user) => (
          <li
            key={user._id}
            onClick={() => deleteUser(user._id)}
            style={{ cursor: "pointer" }}
          >
            {user.email} (Click to delete)
          </li>
        ))}
      </ul>
    </div>
  );
}
