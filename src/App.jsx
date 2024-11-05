// IMPORTAÇÕES
import React from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import UpdateEmployee from "./components/UpdateEmployee";
import Auth from "./components/Auth";
import PrivateRoute from "./components/PrivateRoute";

const App = () => {
  // Verifica se o usuário está autenticado através do localStorage
  const isAuthenticated = localStorage.getItem("authenticated");

  return (
    <Router>
      <Routes> 
        <Route
          path="/" // Rota para o Dashboard
          element={
            <PrivateRoute> {/* Garante que apenas usuários autenticados acessem essa rota */}
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route path="/login" element={<Auth />} /> {/* Rota para o componente de autenticação */}
        <Route
          path="/update-employee/:employeeId" // Rota para atualizar funcionário, usando um parâmetro de ID
          element={
            <PrivateRoute>
              <UpdateEmployee />
            </PrivateRoute>
          }
        />
        <Route
          path="*" // Rota curinga que captura todas as rotas não definidas
          element={<Navigate to={isAuthenticated ? "/" : "/login"} />} // Redireciona para a página de login ou Dashboard com base na autenticação
        />
      </Routes>
    </Router>
  );
};

export default App;