import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import "../styles/DebtTracker.css";

export const DebtTracker = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [debts, setDebts] = useState([]);
  const [showSetup, setShowSetup] = useState(false);
  const [showCreateDebt, setShowCreateDebt] = useState(false);
  const [activeTab, setActiveTab] = useState("active");

  // Form states
  const [loginPassword, setLoginPassword] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [debtAmount, setDebtAmount] = useState("");
  const [debtDescription, setDebtDescription] = useState("");
  const [debtToUser, setDebtToUser] = useState("");
  const [debtDate, setDebtDate] = useState("");

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedUsers = JSON.parse(
      localStorage.getItem("debtTrackerUsers") || "[]"
    );
    const savedDebts = JSON.parse(
      localStorage.getItem("debtTrackerDebts") || "[]"
    );
    const savedCurrentUser = JSON.parse(
      localStorage.getItem("debtTrackerCurrentUser") || "null"
    );

    setUsers(savedUsers);
    setDebts(savedDebts);
    setCurrentUser(savedCurrentUser);
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("debtTrackerUsers", JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem("debtTrackerDebts", JSON.stringify(debts));
  }, [debts]);

  useEffect(() => {
    localStorage.setItem("debtTrackerCurrentUser", JSON.stringify(currentUser));
  }, [currentUser]);

  const handleLogin = () => {
    const user = users.find((u) => u.password === loginPassword);
    if (user) {
      setCurrentUser(user);
      setLoginPassword("");
    } else {
      alert("Invalid password. Please try again.");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const addNewUser = () => {
    if (newUserName.trim() && newUserPassword.trim()) {
      const newUser = {
        id: Date.now().toString(),
        name: newUserName.trim(),
        password: newUserPassword.trim(),
      };
      setUsers([...users, newUser]);
      setNewUserName("");
      setNewUserPassword("");
      setShowSetup(false);
      alert("User added successfully!");
    } else {
      alert("Please enter both name and password.");
    }
  };

  const createDebt = () => {
    if (debtAmount && debtDescription && debtToUser && debtDate) {
      const newDebt = {
        id: Date.now().toString(),
        amount: parseFloat(debtAmount),
        description: debtDescription,
        date: debtDate,
        fromUser: currentUser.id,
        toUser: debtToUser,
        status: "pending",
        confirmedBy: null,
        paidOff: false,
        createdAt: new Date().toISOString(),
      };
      setDebts([...debts, newDebt]);
      setDebtAmount("");
      setDebtDescription("");
      setDebtToUser("");
      setDebtDate("");
      setShowCreateDebt(false);
    } else {
      alert("Please fill in all fields.");
    }
  };

  const confirmDebt = (debtId) => {
    setDebts(
      debts.map((debt) =>
        debt.id === debtId
          ? { ...debt, status: "active", confirmedBy: currentUser.id }
          : debt
      )
    );
  };

  const markAsPaid = (debtId) => {
    setDebts(
      debts.map((debt) =>
        debt.id === debtId ? { ...debt, paidOff: true, status: "paid" } : debt
      )
    );
  };

  const getFilteredDebts = () => {
    if (!currentUser) return [];

    const userDebts = debts.filter(
      (debt) =>
        debt.fromUser === currentUser.id || debt.toUser === currentUser.id
    );

    switch (activeTab) {
      case "pending":
        return userDebts.filter((debt) => debt.status === "pending");
      case "active":
        return userDebts.filter(
          (debt) => debt.status === "active" && !debt.paidOff
        );
      case "paid":
        return userDebts.filter((debt) => debt.paidOff);
      default:
        return userDebts;
    }
  };

  const getDebtSummary = () => {
    if (!currentUser) return { youOwe: 0, othersOweYou: 0 };

    const activeDebts = debts.filter(
      (debt) =>
        debt.status === "active" &&
        !debt.paidOff &&
        (debt.fromUser === currentUser.id || debt.toUser === currentUser.id)
    );

    let youOwe = 0;
    let othersOweYou = 0;

    activeDebts.forEach((debt) => {
      if (debt.fromUser === currentUser.id) {
        youOwe += debt.amount;
      } else {
        othersOweYou += debt.amount;
      }
    });

    return { youOwe, othersOweYou };
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getUserName = (userId) => {
    const user = users.find((u) => u.id === userId);
    return user ? user.name : "Unknown User";
  };

  const summary = getDebtSummary();

  if (!currentUser) {
    return (
      <div className="debt-tracker">
        <Helmet>
          <title>Debt Tracker - Oliver Nguyen</title>
        </Helmet>

        <div className="login-container">
          <h1>Debt Tracker</h1>
          <p>Track small debts between friends and family</p>

          <div className="login-form">
            <h2>Login</h2>
            <input
              type="password"
              placeholder="Enter your password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleLogin()}
            />
            <button onClick={handleLogin}>Login</button>
          </div>

          <div className="setup-section">
            <button
              className="setup-button"
              onClick={() => setShowSetup(!showSetup)}
            >
              {showSetup ? "Cancel Setup" : "Add New User"}
            </button>

            {showSetup && (
              <div className="setup-form">
                <h3>Add New User</h3>
                <input
                  type="text"
                  placeholder="User name"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                />
                <button onClick={addNewUser}>Add User</button>
              </div>
            )}
          </div>

          {users.length > 0 && (
            <div className="users-list">
              <h3>Registered Users</h3>
              <ul>
                {users.map((user) => (
                  <li key={user.id}>{user.name}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="debt-tracker">
      <Helmet>
        <title>Debt Tracker - Oliver Nguyen</title>
      </Helmet>

      <div className="debt-tracker-header">
        <h1>Debt Tracker</h1>
        <div className="user-info">
          <span>Welcome, {currentUser.name}!</span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>

      <div className="debt-summary">
        <div className="summary-card">
          <h3>You Owe</h3>
          <p className="amount owed">${summary.youOwe.toFixed(2)}</p>
        </div>
        <div className="summary-card">
          <h3>Others Owe You</h3>
          <p className="amount owed-to-you">
            ${summary.othersOweYou.toFixed(2)}
          </p>
        </div>
        <div className="summary-card">
          <h3>Net Balance</h3>
          <p
            className={`amount ${
              summary.othersOweYou - summary.youOwe >= 0
                ? "positive"
                : "negative"
            }`}
          >
            ${(summary.othersOweYou - summary.youOwe).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="debt-actions">
        <button
          onClick={() => setShowCreateDebt(!showCreateDebt)}
          className="create-debt-btn"
        >
          {showCreateDebt ? "Cancel" : "Create New Debt"}
        </button>
      </div>

      {showCreateDebt && (
        <div className="create-debt-form">
          <h3>Create New Debt</h3>
          <div className="form-row">
            <input
              type="number"
              placeholder="Amount"
              value={debtAmount}
              onChange={(e) => setDebtAmount(e.target.value)}
              step="0.01"
              min="0"
            />
            <select
              value={debtToUser}
              onChange={(e) => setDebtToUser(e.target.value)}
            >
              <option value="">Select person you owe</option>
              {users
                .filter((user) => user.id !== currentUser.id)
                .map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
            </select>
          </div>
          <input
            type="text"
            placeholder="Description"
            value={debtDescription}
            onChange={(e) => setDebtDescription(e.target.value)}
          />
          <input
            type="date"
            value={debtDate}
            onChange={(e) => setDebtDate(e.target.value)}
          />
          <button onClick={createDebt}>Create Debt</button>
        </div>
      )}

      <div className="debt-tabs">
        <button
          className={`tab ${activeTab === "active" ? "active" : ""}`}
          onClick={() => setActiveTab("active")}
        >
          Active Debts
        </button>
        <button
          className={`tab ${activeTab === "pending" ? "active" : ""}`}
          onClick={() => setActiveTab("pending")}
        >
          Pending
        </button>
        <button
          className={`tab ${activeTab === "paid" ? "active" : ""}`}
          onClick={() => setActiveTab("paid")}
        >
          Paid History
        </button>
      </div>

      <div className="debts-list">
        {getFilteredDebts().length === 0 ? (
          <p className="no-debts">No {activeTab} debts found.</p>
        ) : (
          getFilteredDebts().map((debt) => (
            <div key={debt.id} className={`debt-card ${debt.status}`}>
              <div className="debt-header">
                <h4>{debt.description}</h4>
                <span
                  className={`debt-amount ${
                    debt.fromUser === currentUser.id ? "owed" : "owed-to-you"
                  }`}
                >
                  ${debt.amount.toFixed(2)}
                </span>
              </div>

              <div className="debt-details">
                <p>
                  <strong>Date:</strong> {formatDate(debt.date)}
                </p>
                <p>
                  <strong>Status:</strong> {debt.status}
                </p>
                {debt.fromUser === currentUser.id ? (
                  <p>You owe {getUserName(debt.toUser)}</p>
                ) : (
                  <p>{getUserName(debt.fromUser)} owes you</p>
                )}
              </div>

              <div className="debt-actions">
                {debt.status === "pending" &&
                  debt.toUser === currentUser.id && (
                    <button
                      onClick={() => confirmDebt(debt.id)}
                      className="confirm-btn"
                    >
                      Confirm Debt
                    </button>
                  )}
                {debt.status === "active" && !debt.paidOff && (
                  <button
                    onClick={() => markAsPaid(debt.id)}
                    className="mark-paid-btn"
                  >
                    Mark as Paid
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
