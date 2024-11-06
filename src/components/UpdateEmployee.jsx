// IMPORTAÇÕES
import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Button, TextField, CircularProgress, Snackbar, Grid, Typography, Paper, Card, CardContent, CardMedia, Box } from "@mui/material";
import styles from "../styles/UpdateEmployee.module.css";
import { db, storage } from "../firebase";
import { useParams, useNavigate } from "react-router-dom";
import { PDFDownloadLink } from "@react-pdf/renderer";
import EmployeePDF from "./EmployeePDF";
import EmployeeHistory from "./EmployeeHistory";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { z } from "zod";

const UpdateEmployee = () => {
  const { employeeId } = useParams(); // Captura o ID do funcionário da URL
  const navigate = useNavigate();
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  // Estados para os campos do formulário
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [position, setPosition] = useState("");
  const [salary, setSalary] = useState("");
  const [address, setAddress] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [photo, setPhoto] = useState(null);
  const [imgPreview, setImgPreview] = useState(null);
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [snackOpen, setSnackOpen] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);

  // Definindo o esquema de validação usando Zod
  const employeeSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    phone: z.string().min(10, "Telefone deve ter pelo menos 10 caracteres").max(15, "Telefone deve ter no máximo 15 caracteres"),
    position: z.string().min(1, "Cargo é obrigatório"),
    salary: z.number().positive("Salário deve ser um número positivo"),
    address: z.string().optional(),
    birthDate: z.string().optional()
  });

  const handleCloseSnack = () => setSnackOpen(false);

  // useEffect para buscar dados do funcionário ao montar o componente
  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (!employeeId) {
        console.error("employeeId é inválido:", employeeId);
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, "employees", employeeId); // Referência ao documento do funcionário
        const docSnap = await getDoc(docRef); // Obtendo os dados do documento

        if (docSnap.exists()) {
          const data = docSnap.data();
          setEmployeeData(data);
          // Populando os estados com os dados do funcionário
          setName(data.name || "");
          setPhone(data.phone || "");
          setPosition(data.position || "");
          setSalary(data.salary || "");
          setAddress(data.address || "");
          setBirthDate(data.birthDate || "");
          setImgPreview(data.imgURL || null);
          setHistory(Array.isArray(data.history) ? data.history : []); // Verificando se o histórico é um array
        } else {
          console.log("Nenhum documento encontrado!");
        }
      } catch (error) {
        console.error("Erro ao buscar dados do funcionário:", error);
      } finally {
        setLoading(false); // Finalizando o carregamento
      }
    };

    fetchEmployeeData();
  }, [employeeId]);
  // Função para fazer upload da imagem
  const handleImageUpload = (e) => {
    const file = e.target.files[0];

    if (!file) {
      setMessage("Selecione um arquivo para fazer upload!");
      setMessageType("error");
      return;
    }

    // Verificação do tipo de arquivo (apenas imagens)
    if (!file.type.startsWith("image/")) {
      setMessage("Apenas arquivos de imagem são permitidos!");
      setMessageType("error");
      return;
    }

    const storageRef = ref(storage, `images/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    setLoadingImage(true);
    uploadTask.on(
      "state_changed",
      (snapshot) => {
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
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setImgPreview(downloadURL);
          setPhoto(downloadURL);
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

  // Função para atualizar as informações do funcionário
  const handleUpdateContact = async (event) => {
    event.preventDefault();

    // Validando os dados do formulário
    try {
      employeeSchema.parse({ name, phone, position, salary: parseFloat(salary), address, birthDate });
    } catch (error) {
      const errors = error.errors.map(err => err.message).join(", ");
      setMessage(errors);
      setSnackOpen(true);
      return;
    }

    const docRef = doc(db, "employees", employeeId); // Referência ao documento do funcionário

    const changes = []; // Array para armazenar as mudanças
    // Comparando dados atuais e novos para construir o histórico
    if (name !== employeeData.name) changes.push(`Nome atualizado de "${employeeData.name}" para "${name}"`);
    if (phone !== employeeData.phone) changes.push(`Telefone atualizado de "${employeeData.phone}" para "${phone}"`);
    if (position !== employeeData.position) changes.push(`Cargo atualizado de "${employeeData.position}" para "${position}"`);
    if (salary !== employeeData.salary) changes.push(`Salário atualizado de "${employeeData.salary}" para "${salary}"`);
    if (address !== employeeData.address) changes.push(`Endereço atualizado de "${employeeData.address}" para "${address}"`);
    if (birthDate !== employeeData.birthDate) changes.push(`Data de nascimento atualizada de "${employeeData.birthDate}" para "${birthDate}"`);
    if (photo) changes.push(`Foto de perfil atualizada`);

    const newHistory = [
      ...history,
      {
        date: new Date().toLocaleString(),
        changes,
      },
    ];

    // Atualizando as informações no Firestore
    try {
      await updateDoc(docRef, {
        phone,
        name,
        position,
        salary,
        address,
        birthDate,
        history: newHistory,
        ...(photo && { imgURL: photo }), // Atualizando a URL da imagem se houver uma nova
      });

      setMessage("Informações atualizadas com sucesso!");
      setHistory(newHistory);
      setSnackOpen(true);
    } catch (error) {
      console.error("Erro ao atualizar as informações:", error);
      setMessage("Erro ao atualizar as informações. " + error.message);
      setSnackOpen(true);
    }
  };

  const handlePromote = async () => {
    // Obtém a referência ao documento do funcionário no Firestore usando o employeeId
    const docRef = doc(db, "employees", employeeId);

    const newPosition = prompt("Insira o novo cargo:");

    if (newPosition) {
      // Cria um novo histórico adicionando a promoção atual com data e descrição da mudança
      const newHistory = [
        ...history,
        {
          date: new Date().toLocaleString(),
          changes: [`Promovido para ${newPosition}`]
        }
      ];

      try {
        // Atualiza o documento do funcionário no Firestore com o novo cargo e histórico atualizado
        await updateDoc(docRef, {
          position: newPosition,
          history: newHistory
        });

        setMessage(`Funcionário promovido para ${newPosition}.`);
        setPosition(newPosition);
        setHistory(newHistory);

        setSnackOpen(true);
      } catch (error) {
        console.error("Erro ao promover funcionário:", error);
        setMessage("Erro ao promover funcionário. " + error.message);
        setSnackOpen(true);
      }
    }
  };

  // Função para demitir funcionário
  const handleFireEmployee = async () => {
    if (!window.confirm(`Deseja realmente demitir o funcionário ${name}?`)) {
      return; // Se o usuário cancelar, não executa a função
    }

    setPosition("Demitido"); // Atualizando o cargo para demitido

    const docRef = doc(db, "employees", employeeId); // Referência ao documento do funcionário
    const newHistory = [
      ...history,
      {
        date: new Date().toLocaleString(),
        changes: ["Demitido"], // Registro da demissão no histórico
      },
    ];

    try {
      await updateDoc(docRef, {
        position: "Demitido",
        history: newHistory, // Atualizando o histórico no Firestore
      });
      setMessage("Funcionário demitido com sucesso!");
      setSnackOpen(true);
    } catch (error) {
      console.error("Erro ao demitir funcionário:", error);
      setMessage("Erro ao demitir funcionário. " + error.message);
      setSnackOpen(true);
    }
  };

  if (loading) return <CircularProgress />;

  return (
    <Box className={styles.container}>
      <Paper elevation={3} sx={{ padding: 3, marginBottom: 4 }}>
        <Typography variant="h4" gutterBottom>
          Atualizar Funcionário
        </Typography>
        <Card sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <CardMedia
            component="img"
            image={imgPreview || "/placeholder.png"}
            title="Foto do Funcionário"
            sx={{ width: 150, height: 150, borderRadius: "50%", marginBottom: 2, border: "2px solid #1976d2" }}
          />
          <CardContent sx={{ width: '100%' }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Nome"
                  variant="outlined"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Telefone"
                  variant="outlined"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Cargo"
                  variant="outlined"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Salário"
                  variant="outlined"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Endereço"
                  variant="outlined"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Data de Nascimento"
                  variant="outlined"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Button
                  variant="contained"
                  component="label"
                  fullWidth
                  sx={{
                    backgroundColor: "#1976d2",
                    color: "#fff",
                    '&:hover': {
                      backgroundColor: "#3f51b5",
                    },
                    borderRadius: 1,
                    textTransform: "none",
                    height: 55,
                  }}
                >
                  Upload Foto
                  <input type="file" hidden onChange={handleImageUpload} />
                </Button>
                {message && (
                  <div
                    className={`${styles.message} ${messageType === 'success' ? styles.success : styles.error}`}
                  >
                    {message}
                  </div>
                )}
              </Grid>

              <Grid item xs={12}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Button
                      variant="contained"
                      onClick={handleUpdateContact}
                      fullWidth
                      sx={{
                        backgroundColor: "#6E1869",
                        color: "#fff",
                        '&:hover': {
                          backgroundColor: "#5A1459",
                        },
                        borderRadius: 1,
                        textTransform: "none",
                      }}
                    >
                      Atualizar Funcionário
                    </Button>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Button
                      variant="contained"
                      color="error"
                      onClick={handleFireEmployee}
                      fullWidth
                      sx={{
                        borderRadius: 1,
                        textTransform: "none",
                        '&:hover': {
                          backgroundColor: "#b71c1c",
                        },
                      }}
                    >
                      Demitir Funcionário
                    </Button>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={handlePromote}
                      fullWidth
                      sx={{
                        backgroundColor: "#47b214",
                        color: "#fff",
                        '&:hover': {
                          backgroundColor: "#2e6f0f",
                        },
                        borderRadius: 1,
                        textTransform: "none",
                      }}
                    >
                      Promover Funcionário
                    </Button>
                  </Grid>
                </Grid>
              </Grid>


            </Grid>
          </CardContent>
          <Snackbar open={snackOpen} onClose={handleCloseSnack} autoHideDuration={6000} message={message} />
        </Card>
        <Box sx={{ marginTop: 3 }}>
          <EmployeeHistory history={history} />
          <Grid item xs={12} sx={{ textAlign: 'center', marginTop: 2 }}>
            <PDFDownloadLink
              document={<EmployeePDF employeeData={employeeData} history={history} />}
              fileName={`${name}.pdf`}
            >
              {({ loading }) =>
                loading ? "Gerando PDF..." : "Baixar PDF"
              }
            </PDFDownloadLink>

          </Grid>
        </Box>
      </Paper >
    </Box >
  );
};

export default UpdateEmployee;
