// IMPORTAÇÕES
import React, { useState } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Button,
  CircularProgress,
  IconButton,
} from "@mui/material";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";
import PersonIcon from "@mui/icons-material/Person";
import { z } from "zod";
import styles from '../styles/EmployeeForm.module.css';

// Definindo o schema de validação usando Zod para os passos do formulário
const employeeSchemaStep1 = z.object({
  name: z.string().nonempty("Nome é obrigatório"),
  gender: z.string().nonempty("Sexo é obrigatório"),
  address: z.string().nonempty("Endereço é obrigatório"),
  phone: z.string().nonempty("Telefone é obrigatório"),
  birthDate: z.string().nonempty("Data de Aniversário é obrigatória"),
});

const employeeSchemaStep2 = z.object({
  position: z.string().nonempty("Cargo é obrigatório"),
  admissionDate: z.string().nonempty("Data de Admissão é obrigatória"),
  department: z.string().nonempty("Setor é obrigatório"),
  salary: z.string().nonempty("Salário é obrigatório"),
});

const EmployeeForm = ({ open, onClose, onAddEmployee }) => {
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    gender: "",
    address: "",
    phone: "",
    birthDate: "",
    imgURL: "",
    position: "",
    admissionDate: "",
    department: "",
    salary: "",
  });
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  // Função para lidar com mudanças nos campos do formulário
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewEmployee((prevState) => ({
      ...prevState,
      [name]: value,
    }));
    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: "",
    }));
  };

  // Valida os campos do passo 1 do formulário
  const validateStep1 = () => {
    const result = employeeSchemaStep1.safeParse(newEmployee);
    if (!result.success) {
      // Se a validação falhar, cria um objeto de erros
      const newErrors = result.error.errors.reduce((acc, error) => {
        acc[error.path[0]] = error.message;
        return acc;
      }, {});
      setErrors(newErrors);
      return newErrors;
    }
    return {};
  };

  // Valida os campos do passo 2 do formulário
  const validateStep2 = () => {
    const result = employeeSchemaStep2.safeParse(newEmployee);
    if (!result.success) {
      // Se a validação falhar, cria um objeto de erros
      const newErrors = result.error.errors.reduce((acc, error) => {
        acc[error.path[0]] = error.message;
        return acc;
      }, {});
      setErrors(newErrors);
      return newErrors;
    }
    return {};
  };

  // Função para adicionar um novo funcionário
  const handleAddEmployee = async (event) => {
    event.preventDefault();
    const validationErrors = currentStep === 1 ? validateStep1() : validateStep2();
    if (Object.keys(validationErrors).length > 0) {
      return; // Se houver erros, não prossegue
    }
    setLoadingSubmit(true);
    try {
      await onAddEmployee(newEmployee); // Chama a função para adicionar o funcionário
      setMessage("Funcionário cadastrado com sucesso!");
      setMessageType("success");
    } catch (error) {
      setMessage("Erro ao cadastrar o funcionário. Tente novamente.");
      setMessageType("error");
    } finally {
      setLoadingSubmit(false);
    }
  };

  // Avança para o próximo passo do formulário
  const handleNextStep = () => {
    const validationErrors = validateStep1();
    if (Object.keys(validationErrors).length === 0) {
      setCurrentStep((prev) => prev + 1); // Incrementa o passo atual
    }
  };

  // Retorna ao passo anterior do formulário
  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1); // Decrementa o passo atual
    }
  };

  // Função para lidar com o upload da imagem
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    // Verifica se há um arquivo e se é uma imagem
    if (!file) {
      setMessage("Selecione um arquivo para fazer upload!");
      setMessageType("error");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setMessage("Apenas arquivos de imagem são permitidos!");
      setMessageType("error");
      return;
    }

    const storageRef = ref(storage, `images/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    setLoadingImage(true); // Indica que o upload da imagem está em andamento
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        // Atualiza o progresso do upload
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        setProgressPercent(progress);
      },
      (error) => {
        setMessage(`Erro no upload da imagem: ${error.message}`);
        setMessageType("error");
        setLoadingImage(false);
      },
      async () => {
        try {
          // Obtém a URL de download da imagem após o upload
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setNewEmployee((prevState) => ({
            ...prevState,
            imgURL: downloadURL,
          }));
          setMessage("Imagem carregada com sucesso!");
          setMessageType("success");
        } catch (error) {
          setMessage(`Erro ao obter a URL da imagem: ${error.message}`);
          setMessageType("error");
        } finally {
          setLoadingImage(false);
        }
      }
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle className={styles.dialogTitle}>
        Cadastrar Novo Funcionário - Etapa {currentStep} de 2
      </DialogTitle>
      <DialogContent className={styles.dialogContent}>
        {currentStep === 1 && (
          <>
            {/* Campos do formulário para o passo 1 */}
            <TextField
              autoFocus
              margin="normal"
              name="name"
              label="Nome"
              type="text"
              fullWidth
              variant="outlined"
              value={newEmployee.name}
              onChange={handleChange}
              error={!!errors.name}
              helperText={errors.name}
            />
            <TextField
              margin="normal"
              name="gender"
              label="Sexo"
              type="text"
              fullWidth
              variant="outlined"
              value={newEmployee.gender}
              onChange={handleChange}
              error={!!errors.gender}
              helperText={errors.gender}
            />
            <TextField
              margin="normal"
              name="address"
              label="Endereço"
              type="text"
              fullWidth
              variant="outlined"
              value={newEmployee.address}
              onChange={handleChange}
              error={!!errors.address}
              helperText={errors.address}
            />
            <TextField
              margin="normal"
              name="phone"
              label="Telefone"
              type="text"
              fullWidth
              variant="outlined"
              value={newEmployee.phone}
              onChange={handleChange}
              error={!!errors.phone}
              helperText={errors.phone}
            />
            <TextField
              margin="normal"
              name="birthDate"
              label="Data de Aniversário"
              type="date"
              fullWidth
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              value={newEmployee.birthDate}
              onChange={handleChange}
              error={!!errors.birthDate}
              helperText={errors.birthDate}
            />
            <div className={styles.photoBox}>
              {newEmployee.imgURL ? (
                <img
                  src={newEmployee.imgURL}
                  alt="Perfil"
                  className={styles.imagePreview}
                />
              ) : (
                <PersonIcon style={{ fontSize: 52, color: "#ccc" }} />
              )}
              <input
                accept="image/*"
                style={{ display: "none" }}
                id="upload-photo"
                type="file"
                onChange={handleImageUpload}
              />
              <label htmlFor="upload-photo" className={styles.uploadLabel}>
                <IconButton component="span" color="primary" style={{ fontSize: 16 }}>
                  {loadingImage ? <CircularProgress size={24} /> : "Carregar Imagem"}
                </IconButton>
              </label>
              {message && (
                <div className={styles[messageType]}>{message}</div>
              )}
            </div>
          </>
        )}
        {currentStep === 2 && (
          <>
            {/* Campos do formulário para o passo 2 */}
            <TextField
              autoFocus
              margin="normal"
              name="position"
              label="Cargo"
              type="text"
              fullWidth
              variant="outlined"
              value={newEmployee.position}
              onChange={handleChange}
              error={!!errors.position}
              helperText={errors.position}
            />
            <TextField
              margin="normal"
              name="admissionDate"
              label="Data de Admissão"
              type="date"
              fullWidth
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              value={newEmployee.admissionDate}
              onChange={handleChange}
              error={!!errors.admissionDate}
              helperText={errors.admissionDate}
            />
            <TextField
              margin="normal"
              name="department"
              label="Setor"
              type="text"
              fullWidth
              variant="outlined"
              value={newEmployee.department}
              onChange={handleChange}
              error={!!errors.department}
              helperText={errors.department}
            />
            <TextField
              margin="normal"
              name="salary"
              label="Salário"
              type="text"
              fullWidth
              variant="outlined"
              value={newEmployee.salary}
              onChange={handleChange}
              error={!!errors.salary}
              helperText={errors.salary}
            />
          </>
        )}
      </DialogContent>

      <DialogActions className={styles.dialogActions}>
        {currentStep === 2 && (
          <Button onClick={handlePrevStep}>Voltar</Button>
        )}
        <Button
          onClick={currentStep === 2 ? handleAddEmployee : handleNextStep}
          color="primary"
        >
          {currentStep === 2 ? (
            loadingSubmit ? (
              <CircularProgress size={24} />
            ) : (
              "Cadastrar Funcionário"
            )
          ) : (
            "Próximo"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmployeeForm;