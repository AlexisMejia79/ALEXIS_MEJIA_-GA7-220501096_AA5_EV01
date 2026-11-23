# API de registro e inicio de sesion

Backend en JavaScript con Node.js, Express y MySQL/MariaDB de XAMPP. Permite registrar usuarios e iniciar sesion; las contrasenas se almacenan protegidas con bcrypt.

## Requisitos

- Node.js y npm.
- XAMPP con el servicio **MySQL** iniciado.

## Preparacion

1. En el panel de XAMPP, inicia **MySQL**.
2. En phpMyAdmin, importa `database/auth_app_db.sql`. Esto crea la base `auth_app_db` y la tabla `usuarios`.
3. En la carpeta del proyecto, crea el archivo local de configuracion:

   ```powershell
   Copy-Item .env.example .env
   ```

4. Si tu usuario, contrasena o puerto de MySQL son distintos, actualiza esos valores en `.env`.
5. Instala dependencias e inicia la API:

   ```powershell
   npm install
   npm run dev
   ```

La API queda disponible en `http://localhost:3000`. Para detenerla, usa `Ctrl+C`.

## Servicios

### Registrar usuario

`POST /api/auth/register`

```json
{
  "usuario": "alexis_1",
  "contrasena": "ClaveSegura123"
}
```

El usuario debe tener entre 3 y 30 caracteres: letras, numeros, punto, guion o guion bajo. La contrasena debe tener entre 8 y 72 bytes. Una respuesta correcta usa estado `201`; si el usuario ya existe, devuelve `409`.

### Iniciar sesion

`POST /api/auth/login`

Usa el mismo formato JSON. Si los datos son correctos, devuelve estado `200` y el mensaje **Inicio de sesion correcto**. Si no coinciden, devuelve `401` con un mensaje de autenticacion fallida.

### Revisar API y base de datos

`GET /api/health` confirma que la API puede consultar la base de datos.

Todas las respuestas de error contienen un campo `message` en JSON para que la aplicacion cliente pueda mostrarlo como alerta. La API solo devuelve campos publicos del usuario, nunca su contrasena.

## Pruebas

```powershell
npm test
```

Las pruebas validan registro, inicio correcto, contrasena incorrecta, usuario repetido, datos invalidos y estado de salud. No requieren que XAMPP este iniciado.

## Versionamiento

El proyecto usa Git. Los archivos de dependencias y configuracion local `.env` estan excluidos del repositorio; comparte `.env.example` sin contrasenas.
