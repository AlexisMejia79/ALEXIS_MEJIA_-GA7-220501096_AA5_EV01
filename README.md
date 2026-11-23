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
   npm.cmd install
   npm.cmd run dev
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

El usuario debe tener entre 3 y 30 caracteres: letras, numeros, punto, guion o guion bajo. La contrasena debe tener entre 8 y 72 bytes. Una respuesta correcta usa estado `201`; si el usuario ya existe, devuelve `409` con `{"message":"Ese usuario ya esta registrado."}`.

### Iniciar sesion

`POST /api/auth/login`

Usa el mismo formato JSON. Si los datos son correctos, devuelve estado `200` y el mensaje **Inicio de sesion correcto**. Si no coinciden, devuelve `401` con un mensaje de autenticacion fallida.

### Revisar API y base de datos

`GET /api/health` confirma que la API puede consultar la base de datos.

Todas las respuestas de error contienen un campo `message` en JSON para que la aplicacion cliente pueda mostrarlo como alerta. La API solo devuelve campos publicos del usuario, nunca su contrasena.

## Probar con Postman

La coleccion de trabajo y el ambiente local para el espacio de Postman se encuentran en `postman/`:

- `postman/collections/API de autenticacion - XAMPP/`
- `postman/environments/Autenticacion local XAMPP.environment.yaml`

Para importar archivos en Postman Desktop, utiliza la exportacion de coleccion `ci/postman/auth-app-api.postman_collection.json` y el ambiente `postman/environments/local-xampp.postman_environment.json`.

1. Inicia **MySQL** desde el panel de XAMPP y confirma que la base `auth_app_db` exista.
2. Desde PowerShell, en una terminal abierta en la carpeta del proyecto, ejecuta `npm.cmd run dev`. Deja esa terminal abierta mientras haces las pruebas. El sufijo `.cmd` evita el bloqueo de `npm.ps1` por la politica de ejecucion de PowerShell.
3. En Postman, pulsa **Import** y selecciona los dos archivos anteriores. Importa tanto la coleccion como el ambiente.
4. En el selector de ambiente de la esquina superior derecha, elige **Autenticacion local XAMPP**. Su variable `baseUrl` apunta a `http://localhost:3000`.
5. Abre **API de autenticacion - XAMPP**, pulsa **Run** y ejecuta la coleccion en orden. Los scripts de Postman comprobaran el codigo HTTP y el mensaje de cada respuesta:
   - La API y la conexion a MySQL responden (`200`).
   - Se registra un usuario de prueba unico (`201`).
   - El usuario puede iniciar sesion (`200`).
   - Una contrasena incorrecta se rechaza (`401`).
   - El mismo usuario no se puede registrar de nuevo (`409`).
   - Datos fuera de las reglas se rechazan con una explicacion (`400`).
6. Tambien puedes abrir cada solicitud y pulsar **Send**. Ejecuta primero **1. Verificar API y base de datos** y luego **2. Registrar un usuario nuevo**; las solicitudes siguientes usan las variables de prueba creadas por el registro.

El cuerpo de registro y de inicio de sesion es JSON con los campos `usuario` y `contrasena`. Postman muestra el motivo del error en **Body** como `message`. Si MySQL esta detenido, la base no existe, las credenciales de `.env` son incorrectas o falta la tabla, la respuesta explica como corregirlo. Para errores internos, revisa la terminal donde corre la API.

## Pruebas

```powershell
npm.cmd test
```

Las pruebas validan registro, inicio correcto, contrasena incorrecta, usuario repetido, datos invalidos, estado de salud y mensajes para problemas comunes de MySQL. No requieren que XAMPP este iniciado.

## Ejecutar Postman en cada push

El flujo `.github/workflows/postman-api.yml` ejecuta la coleccion de CI `ci/postman/auth-app-api.postman_collection.json` al hacer `push` o abrir un pull request; tambien se puede iniciar manualmente desde GitHub Actions. El flujo crea un MySQL temporal, aplica `database/auth_app_db.sql`, inicia la API y corre las seis solicitudes con Newman. No necesita secretos ni una instancia XAMPP en GitHub.

Despues de subir estos archivos a GitHub, abre la pestana **Actions** del repositorio y revisa **API Postman tests**. Un fallo en cualquier solicitud o asercion hace que el flujo falle. Si cambias solicitudes o pruebas en Postman, actualiza tambien la exportacion `ci/postman/auth-app-api.postman_collection.json` que usa el flujo.

## Versionamiento

El proyecto usa Git. Los archivos de dependencias y configuracion local `.env` estan excluidos del repositorio; comparte `.env.example` sin contrasenas.
