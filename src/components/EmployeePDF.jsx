// IMPORTAÇÕES
import React from "react";
import { Page, Text, View, Document, StyleSheet } from "@react-pdf/renderer";

// Definindo estilos para o documento
const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontSize: 12,
        backgroundColor: "#f2f2f2"
    },
    title: {
        fontSize: 24,
        marginBottom: 10,
        fontWeight: "bold",
        textAlign: "center",
        color: "#1976d2",
    },
    section: {
        marginBottom: 20,
        padding: 10,
        borderRadius: 8,
        border: "1px solid #d9d9d9",
        backgroundColor: "#ffffff"
    },
    heading: {
        fontSize: 16,
        marginBottom: 5,
        fontWeight: "bold",
        color: "#333333"
    },
    text: {
        marginBottom: 3,
        color: "#555555"
    },
    historyEntry: {
        marginBottom: 8
    },
    listItem: {
        marginLeft: 15,
        marginBottom: 3
    },
    footer: {
        marginTop: 20,
        fontSize: 10,
        textAlign: "center",
        color: "#888888"
    },
});

const EmployeePDF = ({ employeeData, history }) => {
    // Verifica se employeeData é válido
    if (!employeeData) {
        return (
            <Document>
                <Page style={styles.page}>
                    <Text style={styles.title}>Relatório do Funcionário</Text>
                    <Text style={styles.text}>Nenhum dado do funcionário disponível.</Text>
                </Page>
            </Document>
        );
    }

    return (
        <Document>
            <Page style={styles.page}>
                <Text style={styles.title}>Relatório do Funcionário</Text>
                <View style={styles.section}>
                    <Text style={styles.heading}>Dados do Funcionário:</Text>
                    <Text style={styles.text}>Nome: {employeeData.name || 'N/A'}</Text>
                    <Text style={styles.text}>Telefone: {employeeData.phone || 'N/A'}</Text>
                    <Text style={styles.text}>Cargo: {employeeData.position || 'N/A'}</Text>
                    <Text style={styles.text}>Salário: R$ {employeeData.salary || 'N/A'}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.heading}>Histórico de Alterações:</Text>
                    {history && history.length > 0 ? (
                        history.map((entry, index) => (
                            <View key={index} style={styles.historyEntry}>
                                <Text style={styles.text}>Data: {entry.date || 'N/A'}</Text>
                                {entry.changes && entry.changes.length > 0 ? (
                                    entry.changes.map((change, idx) => (
                                        <Text key={idx} style={styles.listItem}>- {change || 'N/A'}</Text>
                                    ))
                                ) : (
                                    <Text style={styles.listItem}>- Nenhuma alteração registrada.</Text>
                                )}
                            </View>
                        ))
                    ) : (
                        <Text style={styles.text}>Nenhum histórico disponível.</Text>
                    )}
                </View>
                <Text style={styles.footer}>Relatório gerado em: {new Date().toLocaleString()}</Text>
            </Page>
        </Document>
    );
};

export default EmployeePDF;
