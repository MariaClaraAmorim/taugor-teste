// IMPORTAÇÕES
import React, { useState } from "react";
import { auth } from "../firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import styles from "../styles/Auth.module.css";
import { z } from "zod";

// Define o esquema de validação usando Zod
const schema = z.object({
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

const Auth = () => {
    // Declaração de estados para email, senha, modo de autenticação e mensagens
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLogin, setIsLogin] = useState(true);
    const [message, setMessage] = useState("");
    const navigate = useNavigate();

    // Função para resetar os campos
    const resetFields = () => {
        setEmail("");
        setPassword("");
        setMessage("");
    };

    // Função para lidar com o envio do formulário
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            schema.parse({ email, password });
            setMessage("");

            // Se estiver no modo de login
            if (isLogin) {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                localStorage.setItem("authenticated", "true");
                navigate("/");
            } else {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password); // Tenta registrar o usuário
                await setDoc(doc(db, "users", userCredential.user.uid), { // Armazena informações do usuário no Firestore
                    email: userCredential.user.email,
                    createdAt: new Date(),
                });
                localStorage.setItem("authenticated", "true");
                setMessage("Registro realizado com sucesso! Você será redirecionado para o login.");

                // Reseta campos e muda para modo de login após 2 segundos
                setTimeout(() => {
                    setIsLogin(true);
                    resetFields();
                    setMessage("");
                }, 2000);
            }
        } catch (error) {
            // Tratamento de erros de validação
            if (error instanceof z.ZodError) {
                error.errors.forEach((err) => {
                    if (err.path[0] === "email") {
                        setMessage("Parece que o email digitado não está correto. Verifique e tente novamente!");
                    } else if (err.path[0] === "password") {
                        setMessage("A senha precisa ter pelo menos 6 caracteres. Por favor, tente uma senha mais longa.");
                    }
                });
                return;
            }

            // Tratamento de erros de autenticação
            if (error.code === "auth/email-already-in-use") {
                setMessage("Este email já está em uso. Tente outro.");
            } else if (error.code === "auth/invalid-email") {
                setMessage("Email inválido. Verifique o formato.");
            } else if (error.code === "auth/wrong-password") {
                setMessage("Senha incorreta. Tente novamente.");
            } else if (error.code === "auth/user-not-found") {
                setMessage("Usuário não encontrado. Verifique seu email.");
            } else {
                setMessage("Erro ao autenticar: " + error.message);
            }
        }
    };

    // Função para alternar entre modos de autenticação (login/registro)
    const toggleAuthMode = () => {
        setIsLogin((prev) => !prev);
        resetFields(); // Limpar campos ao mudar de operação
    };

    return (
        <div className={styles.container}>
            <Paper elevation={3} sx={{ padding: "20px", maxWidth: "400px", width: "100%" }}>
                <Typography variant="h5" align="center" gutterBottom>
                    {isLogin ? "Login" : "Registro"}
                </Typography>
                <form onSubmit={handleSubmit} className={styles.formAuth}>
                    <TextField
                        label="Email"
                        variant="outlined"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        fullWidth
                        inputProps={{ autoComplete: "email" }}
                    />
                    <TextField
                        label="Senha"
                        variant="outlined"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        fullWidth
                        inputProps={{ autoComplete: "current-password" }}
                    />
                    {message && <Typography color="error">{message}</Typography>}

                    <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        sx={{ backgroundColor: "#1976d2", color: "#fff" }}
                    >
                        {isLogin ? "Entrar" : "Registrar"}
                    </Button>
                </form>
                <div className={styles.toggleButton} onClick={toggleAuthMode}>
                    <Typography variant="body2">
                        {isLogin ? "Não tem uma conta? Registre-se" : "Já tem uma conta? Entre"}
                    </Typography>
                </div>
            </Paper>
        </div>
    );
};

export default Auth;