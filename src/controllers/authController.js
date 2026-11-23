const bcrypt = require('bcryptjs');

const usernamePattern = /^[a-zA-Z0-9._-]{3,30}$/;

function getCredentials(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return null;
  }

  const username = typeof body.usuario === 'string'
    ? body.usuario.trim().toLowerCase()
    : '';
  const password = typeof body.contrasena === 'string'
    ? body.contrasena
    : '';

  if (
    !usernamePattern.test(username) ||
    Buffer.byteLength(password, 'utf8') < 8 ||
    Buffer.byteLength(password, 'utf8') > 72
  ) {
    return null;
  }

  return { username, password };
}

function createAuthController(database, passwordHasher = bcrypt) {
  async function register(req, res, next) {
    const credentials = getCredentials(req.body);

    if (!credentials) {
      return res.status(400).json({
        message: 'Revisa los datos: el usuario debe tener entre 3 y 30 caracteres (letras, numeros, punto, guion o guion bajo) y la contrasena entre 8 y 72 bytes.'
      });
    }

    try {
      // La contrasena se guarda protegida, nunca como texto legible.
      const passwordHash = await passwordHasher.hash(credentials.password, 12);
      const [result] = await database.execute(
        'INSERT INTO usuarios (usuario, password_hash) VALUES (?, ?)',
        [credentials.username, passwordHash]
      );

      return res.status(201).json({
        message: 'Usuario registrado correctamente.',
        usuario: {
          id: result.insertId,
          usuario: credentials.username
        }
      });
    } catch (error) {
      return next(error);
    }
  }

  async function login(req, res, next) {
    const credentials = getCredentials(req.body);

    if (!credentials) {
      return res.status(400).json({
        message: 'Ingresa un usuario valido y una contrasena de entre 8 y 72 bytes.'
      });
    }

    try {
      const [users] = await database.execute(
        'SELECT id, usuario, password_hash FROM usuarios WHERE usuario = ? LIMIT 1',
        [credentials.username]
      );
      const user = users[0];
      const passwordMatches = user
        ? await passwordHasher.compare(credentials.password, user.password_hash)
        : false;

      if (!passwordMatches) {
        return res.status(401).json({
          message: 'Error en la autenticacion: usuario o contrasena incorrectos.'
        });
      }

      return res.status(200).json({
        message: 'Inicio de sesion correcto.',
        usuario: {
          id: user.id,
          usuario: user.usuario
        }
      });
    } catch (error) {
      return next(error);
    }
  }

  return { register, login };
}

module.exports = createAuthController;
