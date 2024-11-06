// IMPORTAÇÕES
import React, { useEffect, useState } from "react";
import {
    Button,
    CircularProgress,
    Grid,
    TextField,
    Typography,
    Card,
    CardContent,
    CardActions,
} from "@mui/material";
import { db } from "../firebase";
import { collection, getDocs, addDoc, deleteDoc, doc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import EmployeeForm from "./EmployeeForm";
import styles from "../styles/Dashboard.module.css";

const Dashboard = () => {
    // Estado para armazenar funcionários, loading, pesquisa e funcionários filtrados
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filteredEmployees, setFilteredEmployees] = useState([]);
    const [open, setOpen] = useState(false); // Estado para controle do dialog
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");

    const navigate = useNavigate(); 

    // Hook useEffect para buscar funcionários quando o componente é montado
    useEffect(() => {
        fetchEmployees();
    }, []);

    // Função para buscar funcionários do Firestore
    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, "employees")); // Obtém documentos da coleção "employees"
            // Mapeia os documentos para um array de objetos de funcionários
            const employeesArray = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setEmployees(employeesArray);
            setFilteredEmployees(employeesArray);
        } catch (error) {
            console.error("Erro ao buscar funcionários:", error);
        } finally {
            setLoading(false);
        }
    };

    // Função para lidar com a mudança de pesquisa
    const handleSearchChange = (e) => {
        setSearch(e.target.value);
        // Filtra funcionários baseado no nome
        const filtered = employees.filter(emp =>
            emp.name.toLowerCase().includes(e.target.value.toLowerCase())
        );
        setFilteredEmployees(filtered);
    };

    // Função para abrir o dialog de cadastro de funcionário
    const handleOpen = () => {
        setOpen(true);
    };

    // Função para fechar o dialog
    const handleClose = () => {
        setOpen(false);
    };

    // Função para adicionar um novo funcionário
    const handleAddEmployee = async (newEmployee) => {
        try {
            // Adiciona o novo funcionário ao Firestore
            const docRef = await addDoc(collection(db, "employees"), newEmployee);
            handleClose();
            // Atualiza a lista de funcionários e a filtrada com o novo funcionário
            setEmployees(prev => [...prev, { id: docRef.id, ...newEmployee }]);
            setFilteredEmployees(prev => [...prev, { id: docRef.id, ...newEmployee }]);
        } catch (error) {
            console.error("Erro ao adicionar funcionário:", error);
        }
    };

    const handleDeleteEmployee = async (id) => {
        // Exibe uma janela de confirmação antes de excluir o funcionário
        const confirmDelete = window.confirm("Tem certeza de que deseja excluir este funcionário?");

        if (confirmDelete) {
            try {
                // Referência ao documento do funcionário no Firestore
                const employeeDoc = doc(db, "employees", id);

                await deleteDoc(employeeDoc);

                setEmployees(prevEmployees => prevEmployees.filter(emp => emp.id !== id));
                setFilteredEmployees(prevEmployees => prevEmployees.filter(emp => emp.id !== id));

                setMessage("Funcionário excluído com sucesso!");
                setMessageType("success");
            } catch (error) {
                console.error("Erro ao excluir funcionário:", error);
                setMessage("Erro ao excluir funcionário. Tente novamente.");
                setMessageType("error");
            }
        } else {
            // Se o usuário cancelar a exclusão
            setMessage("Exclusão cancelada.");
            setMessageType("info");
        }
    };


    // Função para editar um funcionário
    const handleEditEmployee = (id) => {
        navigate(`/update-employee/${id}`);
    };

    // Exibe um carregador enquanto os dados estão sendo buscados
    if (loading) {
        return <CircularProgress />;
    }

    return (
        <div className={styles.container}>
            <Typography variant="h4" gutterBottom>Painel de Funcionários</Typography>

            <Grid container spacing={2} className={styles.controls}>
                <Grid item xs={12} sm={8} md={10}>
                    <TextField
                        label="Buscar Funcionário"
                        variant="outlined"
                        fullWidth
                        value={search}
                        onChange={handleSearchChange}
                    />
                </Grid>
                <Grid item xs={12} sm={4} md={4}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleOpen}
                        fullWidth
                    >
                        Cadastrar Novo Funcionário
                    </Button>
                </Grid>
            </Grid>


            {filteredEmployees.length === 0 ? (
                <Typography variant="body1" className={styles.noResults}>
                    Nenhum funcionário encontrado.
                </Typography>
            ) : (
                <Grid container spacing={2}>
                    {filteredEmployees.map(employee => (
                        <Grid item xs={12} sm={6} md={4} key={employee.id}>
                            <Card className={styles.employeeCard}>
                                <CardContent>
                                    <Typography variant="h5" className={styles.employeeName}>{employee.name}</Typography>
                                    <Typography variant="body2" color="textSecondary">Departamento: {employee.department}</Typography>
                                    <Typography variant="body2" color="textSecondary">Cargo: {employee.position}</Typography>
                                </CardContent>
                                <CardActions>
                                    <Button
                                        size="small"
                                        onClick={() => handleEditEmployee(employee.id)}
                                        color="secondary"
                                        className={styles.editButton}
                                    >
                                        Editar
                                    </Button>
                                    <Button
                                        size="small"
                                        onClick={() => handleDeleteEmployee(employee.id)} 
                                        color="error"
                                        className={styles.deleteButton}
                                    >
                                        Excluir
                                    </Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}

                </Grid>
            )}

            {/* Componente do formulário de cadastro de funcionário */}
            <EmployeeForm open={open} onClose={handleClose} onAddEmployee={handleAddEmployee} />
        </div>
    );
};

export default Dashboard;
