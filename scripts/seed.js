require('dotenv').config({path:"./.env"}); // This line loads the environment variables from the .env file
const { Client } = require('pg');
const bcrypt = require('bcrypt');
const {
  invoices,
  customers,
  revenue,
  users,
} = require('../app/lib/placeholder-data.js');


// Initialize PostgreSQL client with environment variables
const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: String(process.env.DB_PASSWORD),
    port: process.env.DB_PORT,
});

console.log(process.env); // This will print all loaded environment variables


async function seedUsers(client) {
  try {
    await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    const createTable = await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
      );
    `);
    console.log(`Created "users" table`);

    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await client.query(`
        INSERT INTO users (id, name, email, password)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO NOTHING;
      `, [user.id, user.name, user.email, hashedPassword]);
    }
    console.log(`Seeded users`);
  } catch (error) {
    console.error('Error seeding users:', error);
    throw error;
  }
}

async function seedInvoices(client) {
  try {
    await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    const createTable = await client.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        customer_id UUID NOT NULL,
        amount INT NOT NULL,
        status VARCHAR(255) NOT NULL,
        date DATE NOT NULL
      );
    `);
    console.log(`Created "invoices" table`);

    for (const invoice of invoices) {
      await client.query(`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO NOTHING;
      `, [invoice.customer_id, invoice.amount, invoice.status, invoice.date]);
    }
    console.log(`Seeded invoices`);
  } catch (error) {
    console.error('Error seeding invoices:', error);
    throw error;
  }
}

async function seedCustomers(client) {
  try {
    await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    const createTable = await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        image_url VARCHAR(255) NOT NULL
      );
    `);
    console.log(`Created "customers" table`);

    for (const customer of customers) {
      await client.query(`
        INSERT INTO customers (id, name, email, image_url)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO NOTHING;
      `, [customer.id, customer.name, customer.email, customer.image_url]);
    }
    console.log(`Seeded customers`);
  } catch (error) {
    console.error('Error seeding customers:', error);
    throw error;
  }
}

async function seedRevenue(client) {
  try {
    const createTable = await client.query(`
      CREATE TABLE IF NOT EXISTS revenue (
        month VARCHAR(4) NOT NULL UNIQUE,
        revenue INT NOT NULL
      );
    `);
    console.log(`Created "revenue" table`);

    for (const rev of revenue) {
      await client.query(`
        INSERT INTO revenue (month, revenue)
        VALUES ($1, $2)
        ON CONFLICT (month) DO NOTHING;
      `, [rev.month, rev.revenue]);
    }
    console.log(`Seeded revenue`);
  } catch (error) {
    console.error('Error seeding revenue:', error);
    throw error;
  }
}

async function main() {
  try {
    await client.connect();
    await seedUsers(client);
    await seedCustomers(client);
    await seedInvoices(client);
    await seedRevenue(client);
    await client.end();
    console.log('Database seeding complete.');
  } catch (err) {
    console.error('An error occurred while attempting to seed the database:', err);
    await client.end();
  }
}

main().catch((err) => {
  console.error('An error occurred:', err);
});
