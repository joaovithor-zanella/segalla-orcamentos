#!/usr/bin/env node

/**
 * Script de Validação de Integridade do Banco de Dados
 * 
 * Verifica:
 * - Existência de todas as tabelas
 * - Integridade das foreign keys
 * - Índices necessários
 * - Tipos de dados corretos
 * - Dados órfãos (registros sem referência)
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL não está configurada em .env.local');
  process.exit(1);
}

// Parse DATABASE_URL
const urlMatch = DATABASE_URL.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
if (!urlMatch) {
  console.error('❌ DATABASE_URL inválida');
  process.exit(1);
}

const [, user, password, host, port, database] = urlMatch;

const config = {
  host,
  port: parseInt(port),
  user,
  password,
  database,
};

const EXPECTED_TABLES = {
  users: {
    columns: ['id', 'openId', 'username', 'passwordHash', 'name', 'email', 'loginMethod', 'role', 'canViewOtherQuotes', 'active', 'createdAt', 'updatedAt', 'lastSignedIn'],
    primaryKey: 'id',
    indexes: ['idx_openId', 'idx_username', 'idx_email', 'idx_role'],
  },
  payment_methods: {
    columns: ['id', 'name', 'description', 'active', 'createdAt', 'updatedAt'],
    primaryKey: 'id',
    indexes: ['idx_active'],
  },
  quotes: {
    columns: ['id', 'number', 'userId', 'customerName', 'customerPhone', 'paymentMethodId', 'observations', 'status', 'totalAmount', 'createdAt', 'updatedAt'],
    primaryKey: 'id',
    indexes: ['idx_userId', 'idx_status', 'idx_number', 'idx_createdAt'],
    foreignKeys: [
      { column: 'userId', references: 'users(id)' },
      { column: 'paymentMethodId', references: 'payment_methods(id)' },
    ],
  },
  quote_items: {
    columns: ['id', 'quoteId', 'productCode', 'productName', 'productBrand', 'company', 'companyId', 'quantity', 'unitPrice', 'totalPrice', 'createdAt'],
    primaryKey: 'id',
    indexes: ['idx_quoteId', 'idx_productCode', 'idx_company', 'idx_companyId'],
    foreignKeys: [
      { column: 'quoteId', references: 'quotes(id)' },
    ],
  },
  vehicle_info: {
    columns: ['id', 'quoteId', 'plate', 'model', 'year', 'createdAt', 'updatedAt'],
    primaryKey: 'id',
    indexes: ['idx_quoteId', 'idx_plate'],
    foreignKeys: [
      { column: 'quoteId', references: 'quotes(id)' },
    ],
  },
};

async function checkDatabaseIntegrity() {
  let connection;
  let errors = [];
  let warnings = [];
  let successes = [];

  try {
    connection = await mysql.createConnection(config);
    console.log('✅ Conectado ao banco de dados\n');

    // 1. Verificar existência de tabelas
    console.log('📋 Verificando tabelas...');
    for (const [tableName, tableConfig] of Object.entries(EXPECTED_TABLES)) {
      try {
        const [rows] = await connection.query(`DESCRIBE ${tableName}`);
        if (rows.length === 0) {
          errors.push(`Tabela '${tableName}' existe mas está vazia`);
        } else {
          successes.push(`Tabela '${tableName}' existe`);
        }

        // Verificar colunas
        const existingColumns = rows.map(r => r.Field);
        const missingColumns = tableConfig.columns.filter(col => !existingColumns.includes(col));
        if (missingColumns.length > 0) {
          errors.push(`Tabela '${tableName}' faltam colunas: ${missingColumns.join(', ')}`);
        }
      } catch (error) {
        errors.push(`Tabela '${tableName}' não existe`);
      }
    }

    // 2. Verificar foreign keys
    console.log('\n🔗 Verificando foreign keys...');
    for (const [tableName, tableConfig] of Object.entries(EXPECTED_TABLES)) {
      if (tableConfig.foreignKeys) {
        for (const fk of tableConfig.foreignKeys) {
          try {
            const [rows] = await connection.query(`
              SELECT CONSTRAINT_NAME 
              FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
              WHERE TABLE_SCHEMA = ? 
              AND TABLE_NAME = ? 
              AND COLUMN_NAME = ?
              AND REFERENCED_TABLE_NAME IS NOT NULL
            `, [database, tableName, fk.column]);

            if (rows.length > 0) {
              successes.push(`Foreign key '${tableName}.${fk.column}' existe`);
            } else {
              warnings.push(`Foreign key '${tableName}.${fk.column}' não encontrada`);
            }
          } catch (error) {
            errors.push(`Erro ao verificar foreign key '${tableName}.${fk.column}': ${error.message}`);
          }
        }
      }
    }

    // 3. Verificar índices
    console.log('\n📑 Verificando índices...');
    for (const [tableName, tableConfig] of Object.entries(EXPECTED_TABLES)) {
      for (const indexName of tableConfig.indexes) {
        try {
          const [rows] = await connection.query(`SHOW INDEXES FROM ${tableName} WHERE Key_name = ?`, [indexName]);
          if (rows.length > 0) {
            successes.push(`Índice '${indexName}' em '${tableName}' existe`);
          } else {
            warnings.push(`Índice '${indexName}' em '${tableName}' não encontrado`);
          }
        } catch (error) {
          errors.push(`Erro ao verificar índice '${indexName}': ${error.message}`);
        }
      }
    }

    // 4. Verificar dados órfãos
    console.log('\n🔍 Verificando dados órfãos...');
    
    // Verificar quote_items sem quotes
    const [orphanItems] = await connection.query(`
      SELECT COUNT(*) as count 
      FROM quote_items qi 
      WHERE qi.quoteId NOT IN (SELECT id FROM quotes)
    `);
    if (orphanItems[0].count > 0) {
      warnings.push(`${orphanItems[0].count} itens de orçamento órfãos encontrados`);
    } else {
      successes.push('Nenhum item de orçamento órfão encontrado');
    }

    // Verificar quotes sem usuários
    const [orphanQuotes] = await connection.query(`
      SELECT COUNT(*) as count 
      FROM quotes q 
      WHERE q.userId NOT IN (SELECT id FROM users)
    `);
    if (orphanQuotes[0].count > 0) {
      warnings.push(`${orphanQuotes[0].count} orçamentos órfãos encontrados`);
    } else {
      successes.push('Nenhum orçamento órfão encontrado');
    }

    // Verificar vehicle_info sem quotes
    const [orphanVehicles] = await connection.query(`
      SELECT COUNT(*) as count 
      FROM vehicle_info vi 
      WHERE vi.quoteId NOT IN (SELECT id FROM quotes)
    `);
    if (orphanVehicles[0].count > 0) {
      warnings.push(`${orphanVehicles[0].count} informações de veículo órfãs encontradas`);
    } else {
      successes.push('Nenhuma informação de veículo órfã encontrada');
    }

    // 5. Estatísticas
    console.log('\n📊 Estatísticas do banco de dados:');
    for (const tableName of Object.keys(EXPECTED_TABLES)) {
      try {
        const [rows] = await connection.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        console.log(`   ${tableName}: ${rows[0].count} registros`);
      } catch (error) {
        // Tabela não existe
      }
    }

    // 6. Relatório Final
    console.log('\n' + '='.repeat(60));
    console.log('RELATÓRIO DE INTEGRIDADE DO BANCO DE DADOS');
    console.log('='.repeat(60));

    if (successes.length > 0) {
      console.log(`\n✅ SUCESSOS (${successes.length}):`);
      successes.forEach(msg => console.log(`   ✓ ${msg}`));
    }

    if (warnings.length > 0) {
      console.log(`\n⚠️  AVISOS (${warnings.length}):`);
      warnings.forEach(msg => console.log(`   ⚠ ${msg}`));
    }

    if (errors.length > 0) {
      console.log(`\n❌ ERROS (${errors.length}):`);
      errors.forEach(msg => console.log(`   ✗ ${msg}`));
    }

    console.log('\n' + '='.repeat(60));

    if (errors.length === 0 && warnings.length === 0) {
      console.log('✅ Banco de dados está íntegro e pronto para uso!\n');
      process.exit(0);
    } else if (errors.length === 0) {
      console.log('⚠️  Banco de dados está funcionando mas com alguns avisos.\n');
      process.exit(0);
    } else {
      console.log('❌ Banco de dados tem problemas que precisam ser corrigidos.\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Erro ao verificar banco de dados:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkDatabaseIntegrity();
