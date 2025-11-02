// backend/config/database.js

const mysql = require('mysql2/promise');

// Configuración del pool de conexiones (sin opciones que causan advertencias)
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'SpeakLexi',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

/**
 * Probar conexión a la base de datos
 */
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conectado a la base de datos MySQL');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error.message);
    return false;
  }
}

/**
 * Ejecutar consulta SQL
 */
async function query(sql, params = []) {
  let connection;
  try {
    connection = await pool.getConnection();
    const [results] = await connection.execute(sql, params);
    return results;
  } catch (error) {
    console.error('❌ Error en consulta SQL:', error.message);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

/**
 * Obtener conexión del pool
 */
async function getConnection() {
  try {
    const connection = await pool.getConnection();
    return connection;
  } catch (error) {
    console.error('❌ Error obteniendo conexión:', error.message);
    throw error;
  }
}

/**
 * Iniciar transacción
 */
async function beginTransaction(connection) {
  try {
    await connection.execute('START TRANSACTION');
  } catch (error) {
    console.error('❌ Error iniciando transacción:', error.message);
    throw error;
  }
}

/**
 * Confirmar transacción
 */
async function commitTransaction(connection) {
  try {
    await connection.execute('COMMIT');
  } catch (error) {
    console.error('❌ Error confirmando transacción:', error.message);
    throw error;
  }
}

/**
 * Revertir transacción
 */
async function rollbackTransaction(connection) {
  try {
    await connection.execute('ROLLBACK');
  } catch (error) {
    console.error('❌ Error revertiendo transacción:', error.message);
    throw error;
  }
}

/**
 * Inicializar base de datos
 */
async function initializeDatabase() {
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('No se pudo conectar a la base de datos');
    }
    console.log('✅ Base de datos inicializada correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error.message);
    return false;
  }
}

module.exports = {
  pool,
  query,
  getConnection,
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
  testConnection,
  initializeDatabase
};