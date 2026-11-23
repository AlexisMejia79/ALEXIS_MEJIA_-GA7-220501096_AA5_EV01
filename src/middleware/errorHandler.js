const connectionErrorCodes = new Set([
  'ECONNREFUSED',
  'EHOSTUNREACH',
  'ENOTFOUND',
  'ETIMEDOUT'
]);

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      message: 'El cuerpo de la solicitud no contiene JSON valido.'
    });
  }

  if (error.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      message: 'Ese usuario ya esta registrado.'
    });
  }

  if (error.code === 'ER_BAD_DB_ERROR') {
    console.error('No existe la base de datos configurada:', error.message);
    return res.status(503).json({
      message: 'No existe la base de datos auth_app_db. Importa database/auth_app_db.sql desde phpMyAdmin.'
    });
  }

  if (error.code === 'ER_ACCESS_DENIED_ERROR') {
    console.error('MySQL rechazo las credenciales configuradas:', error.message);
    return res.status(503).json({
      message: 'MySQL rechazo el acceso. Revisa DB_USER y DB_PASSWORD en el archivo .env.'
    });
  }

  if (connectionErrorCodes.has(error.code)) {
    console.error('No fue posible conectar con la base de datos:', error.message);
    return res.status(503).json({
      message: 'No se pudo conectar con MySQL. Inicia el servicio en XAMPP y revisa DB_HOST y DB_PORT en .env.'
    });
  }

  if (error.code === 'ER_NO_SUCH_TABLE' || error.code === 'ER_BAD_FIELD_ERROR') {
    console.error('La estructura de la base de datos no coincide:', error.message);
    return res.status(500).json({
      message: 'La tabla de usuarios no existe o tiene una estructura distinta. Importa database/auth_app_db.sql desde phpMyAdmin.'
    });
  }

  console.error('Error al procesar la solicitud:', error);
  return res.status(500).json({
    message: 'Ocurrio un error interno. Revisa la terminal donde esta ejecutandose la API para conocer el detalle.'
  });
}

module.exports = errorHandler;
