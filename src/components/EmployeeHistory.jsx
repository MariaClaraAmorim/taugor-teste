// IMPORTAÇÕES
import React from "react";
import { Paper, Typography } from "@mui/material";
import styles from '../styles/EmployeeHistory.module.css';

const EmployeeHistory = ({ history = [] }) => {
    return (
        <Paper className={styles.page}>
            <Typography variant="h5" className={styles.title}>
                Histórico do Funcionário
            </Typography>
            {history.length > 0 ? (
                history.map((entry, index) => (
                    <div key={index} className={styles.section}>
                        <Typography className={styles.heading}>
                            Data: {new Date(entry.date).toLocaleString()}
                        </Typography>
                        {entry.changes.length > 0 ? ( // Verifica se há mudanças registradas na entrada
                            entry.changes.map((change, changeIndex) => ( // Mapeia cada mudança
                                <Typography key={changeIndex} className={styles.listItem}>
                                    {change} {/* Exibe a mudança */}
                                </Typography>
                            ))
                        ) : (
                            <Typography className={styles.text}>
                                Nenhuma alteração registrada. {/* Mensagem padrão se não houver mudanças */}
                            </Typography>
                        )}
                    </div>
                ))
            ) : (
                <Typography className={styles.text}>Nenhuma alteração registrada.</Typography>
            )}
            <Typography className={styles.footer}>Histórico gerado automaticamente.</Typography>
        </Paper >
    );
};

export default EmployeeHistory;
