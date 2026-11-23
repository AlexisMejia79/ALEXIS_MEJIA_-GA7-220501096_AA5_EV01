const assert = require('node:assert/strict');
const { once } = require('node:events');
const test = require('node:test');
const bcrypt = require('bcryptjs');
const createApp = require('../src/app');

function createMemoryDatabase() {
  const users = [];
  let nextId = 1;

  return {
    users,
    async execute(sql, values) {
      if (sql.startsWith('INSERT INTO usuarios')) {
        const [username, passwordHash] = values;

        if (users.some((user) => user.usuario === username)) {
          const error = new Error('Duplicate username');
          error.code = 'ER_DUP_ENTRY';
          throw error;
        }

        users.push({
          id: nextId,
          usuario: username,
          password_hash: passwordHash
        });

        return [{ insertId: nextId++ }];
      }

      if (sql.startsWith('SELECT id, usuario, password_hash')) {
        return [users.filter((user) => user.usuario === values[0])];
      }

      throw new Error('Consulta no contemplada en la prueba.');
    },
    async query() {
      return [[{ ok: 1 }]];
    }
  };
}

async function startTestServer(database) {
  const app = createApp({ database });
  const server = app.listen(0);
  await once(server, 'listening');

  return {
    server,
    baseUrl: `http://127.0.0.1:${server.address().port}`
  };
}

test('registro, inicio de sesion y validaciones', async (t) => {
  const memoryDatabase = createMemoryDatabase();
  const { server, baseUrl } = await startTestServer(memoryDatabase);
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));

  const registration = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario: 'Alexis_1', contrasena: 'ClaveSegura123' })
  });
  const registrationBody = await registration.json();
  assert.equal(registration.status, 201);
  assert.equal(registrationBody.usuario.usuario, 'alexis_1');
  assert.equal(registrationBody.message, 'Usuario registrado correctamente.');
  assert.notEqual(memoryDatabase.users[0].password_hash, 'ClaveSegura123');
  assert.equal(
    await bcrypt.compare('ClaveSegura123', memoryDatabase.users[0].password_hash),
    true
  );

  const login = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario: 'ALEXIS_1', contrasena: 'ClaveSegura123' })
  });
  assert.equal(login.status, 200);
  assert.equal((await login.json()).message, 'Inicio de sesion correcto.');

  const wrongPassword = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario: 'alexis_1', contrasena: 'ContrasenaMala' })
  });
  assert.equal(wrongPassword.status, 401);
  assert.match((await wrongPassword.json()).message, /incorrectos/);

  const duplicate = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario: 'alexis_1', contrasena: 'OtraClave123' })
  });
  assert.equal(duplicate.status, 409);
  assert.equal((await duplicate.json()).message, 'Ese usuario ya esta registrado.');

  const invalid = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario: 'ab', contrasena: 'corta' })
  });
  assert.equal(invalid.status, 400);

  const health = await fetch(`${baseUrl}/api/health`);
  assert.equal(health.status, 200);
});

test('avisa cuando MySQL no esta disponible', async (t) => {
  const unavailableDatabase = {
    async query() {
      const error = new Error('Connection refused');
      error.code = 'ECONNREFUSED';
      throw error;
    }
  };
  const { server, baseUrl } = await startTestServer(unavailableDatabase);
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));

  const health = await fetch(`${baseUrl}/api/health`);
  assert.equal(health.status, 503);
  assert.match((await health.json()).message, /XAMPP/);
});

test('explica problemas comunes de configuracion de MySQL', async (t) => {
  const scenarios = [
    {
      code: 'ER_BAD_DB_ERROR',
      path: '/api/health',
      status: 503,
      expectedMessage: 'No existe la base de datos auth_app_db'
    },
    {
      code: 'ER_ACCESS_DENIED_ERROR',
      path: '/api/health',
      status: 503,
      expectedMessage: 'DB_USER y DB_PASSWORD'
    },
    {
      code: 'ER_NO_SUCH_TABLE',
      path: '/api/auth/register',
      status: 500,
      expectedMessage: 'La tabla de usuarios no existe'
    }
  ];
  const originalConsoleError = console.error;
  console.error = () => {};

  try {
    for (const scenario of scenarios) {
      const databaseError = new Error('Simulated database error');
      databaseError.code = scenario.code;
      const database = {
        async query() {
          throw databaseError;
        },
        async execute() {
          throw databaseError;
        }
      };
      const { server, baseUrl } = await startTestServer(database);

      try {
        const options = scenario.path.endsWith('/register')
          ? {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                usuario: 'prueba_1',
                contrasena: 'ClaveSegura123'
              })
            }
          : {};
        const response = await fetch(`${baseUrl}${scenario.path}`, options);
        const body = await response.json();

        assert.equal(response.status, scenario.status);
        assert.match(body.message, new RegExp(scenario.expectedMessage));
      } finally {
        await new Promise((resolve, reject) => {
          server.close((error) => error ? reject(error) : resolve());
        });
      }
    }
  } finally {
    console.error = originalConsoleError;
  }
});
