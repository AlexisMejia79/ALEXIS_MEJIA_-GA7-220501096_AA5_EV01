require('dotenv').config();

const createApp = require('./app');

const port = Number(process.env.PORT || 3000);
const app = createApp();

app.listen(port, () => {
  console.log(`API de autenticacion disponible en http://localhost:${port}`);
  console.log('Comprueba la conexion a MySQL en GET /api/health.');
});
