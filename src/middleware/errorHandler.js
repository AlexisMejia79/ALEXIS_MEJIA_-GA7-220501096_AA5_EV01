const databaseUnavailableCodes = new Set([
  'ECONNREFUSED',
  'EHOSTUNREACH',
  'ENOTFOUND',
  'ETIMEDOUT',
  'ER_ACCESS_DENIED_ERROR',
  'ER_BAD_DB_ERROR'
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

  if (databaseUnavailableCodes.has(error.code)) {
    console.error('No fue posible conectar con la base de datos:', error.message);
    return res.status(503).json({
      message: 'No se pudo conectar con la base de datos. Verifica que MySQL de XAMPP este iniciado y configurado.'
    });
  }

  console.error('Error al procesar la solicitud:', error);
  return res.status(500).json({
    message: 'Ocurrio un error interno. Intenta nuevamente.'
  });
}

module.exports = errorHandler;
