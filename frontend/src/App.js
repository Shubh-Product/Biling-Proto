import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Import components
import Dashboard from "./components/Dashboard";
import CustomerPayment from "./components/CustomerPayment";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/payment/:transactionId" element={<CustomerPayment />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;