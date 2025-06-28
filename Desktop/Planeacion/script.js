// 🟢 Reemplaza con tus valores:
const SPREADSHEET_ID = "1m84pPTVVyPfqvnG6EM8CCumzxwIujKCfhH9xOpf5H8k";
const API_KEY = "AIzaSyDlcDqMuFi5aQlf82aL0w0e59Czm2NWbFA";
const RANGE = "DATOS!A2:N";

// Lista vacía
let datos = [];

// Variable global para el término de búsqueda
let searchTerm = "";

// Función para traer datos de Google Sheets
function fetchData() {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${RANGE}?key=${API_KEY}`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      if (data.values) {
        datos = data.values.map(row => ({
          "FECHA": row[0] || "",
          "CUSTOMER": row[1] || "",
          "EMBARQUE": row[2] || "",
          "REFERENCIA": row[3] || "",
          "CLIENTE": row[4] || "",
          "CAJA": row[5] || "",
          "TRACTO": row[6] || "",
          "OPERADOR": row[7] || "",
          "CIUDAD": row[8] || "",
          "ESTADO": row[9] || "",
          "HORA": row[10] || "",
          "FECHA DE CITA": row[11] || "",
          "DRIVER MANAGER": row[12] || "",
          "COMENTARIOS": row[13] || ""
        }));
        // Aplica el mismo filtro múltiple de palabras al actualizar datos
        const palabras = searchTerm.split(" ").filter(Boolean);
        if (searchTerm) {
          const filtered = datos.filter(item =>
            palabras.every(palabra =>
              Object.values(item).some(val =>
                val.toLowerCase().includes(palabra)
              )
            )
          );
          renderTable(filtered);
        } else {
          renderTable(datos);
        }
      }
    })
    .catch(error => {
      console.error("Error al cargar datos:", error);
    });
}

// Renderizar tabla en la web
function renderTable(data) {
  const tbody = document.querySelector("#data-table tbody");
  tbody.innerHTML = "";
  data.forEach(row => {
    const tr = document.createElement("tr");
    for (let key in row) {
      const td = document.createElement("td");
      td.textContent = row[key];
      tr.appendChild(td);
    }
    tr.classList.add("updated"); // Agrega la clase de animación
    tbody.appendChild(tr);
    setTimeout(() => tr.classList.remove("updated"), 1000); // La quita después de 1s
  });
}

// Búsqueda en vivo
document.getElementById("search").addEventListener("input", (e) => {
  searchTerm = e.target.value.toLowerCase();
  const palabras = searchTerm.split(" ").filter(Boolean); // Palabras no vacías

  const filtered = datos.filter(item =>
    palabras.every(palabra =>
      Object.values(item).some(val =>
        val.toLowerCase().includes(palabra)
      )
    )
  );
  renderTable(filtered);
});

// Llamar a la API al cargar la página
fetchData();

// Actualizar datos cada 10 segundos para reflejar cambios casi en tiempo real
setInterval(fetchData, 10000);