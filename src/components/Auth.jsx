// IMPORTAÇÕES
import React, { useState } from "react";
import { auth } from "../firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
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
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLogin, setIsLogin] = useState(true);
    const [message, setMessage] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            schema.parse({ email, password });
            setMessage(""); // Limpa a mensagem anterior

            if (isLogin) {
                // Login do usuário
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                localStorage.setItem("authenticated", "true");
            } else {
                // Registro do usuário
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);

                // Adiciona dados do usuário ao Firestore
                await setDoc(doc(db, "users", userCredential.user.uid), {
                    email: userCredential.user.email,
                    createdAt: new Date(),
                });
                localStorage.setItem("authenticated", "true");

                setMessage("Registro realizado com sucesso! Você será redirecionado para o login.");

                // Limpa o formulário após o sucesso do cadastro
                setEmail("");
                setPassword("");

                // Muda para a tela de login após 4 segundos
                setTimeout(() => {
                    setIsLogin(true);  // Muda para a tela de login
                    setMessage("");  // Limpa a mensagem após o redirecionamento
                }, 4000); 
            }
        } catch (error) {
            if (error instanceof z.ZodError) {
                const messages = error.errors.map(err => err.message).join(", ");
                setMessage("Erro ao autenticar: " + messages);
            } else {
                setMessage("Erro ao autenticar: " + error.message);
            }
        }
    };

    return (
        <div className={styles.container}>
            <Paper elevation={3} sx={{ padding: "20px", maxWidth: "400px", width: "100%" }}>
                <Typography variant="h5" align="center" gutterBottom>
                    {isLogin ? "Login" : "Registro"}
                </Typography>
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                    <TextField
                        label="Email"
                        variant="outlined"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        fullWidth
                    />
                    <TextField
                        label="Senha"
                        variant="outlined"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        fullWidth
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        sx={{ backgroundColor: "#1976d2", color: "#fff" }}
                    >
                        {isLogin ? "Entrar" : "Registrar"}
                    </Button>
                </form>
                {message && (
                    <Typography variant="body2" align="center" color={message.includes("sucesso") ? "green" : "red"}>
                        {message}
                    </Typography>
                )}
                <div className={styles.toggleButton} onClick={() => setIsLogin(!isLogin)}>
                    <Typography variant="body2">
                        {isLogin ? "Não tem uma conta? Registre-se" : "Já tem uma conta? Entre"}
                    </Typography>
                </div>
            </Paper>
        </div>
    );
};

export default Auth;
