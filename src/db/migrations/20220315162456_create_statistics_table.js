/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async (knex) => {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  return knex.schema.createTable('statistics', (table) => {
    table.uuid('id').defaultTo(knex.raw('uuid_generate_v4()')).primary();
    table.integer('total_chats').notNullable();
    table.integer('total_users').notNullable();
    table.integer('super_groups').notNullable();
    table.integer('groups').notNullable();
    table.integer('active_admin').notNullable();
    table.integer('inactive_admin').notNullable();
    table.integer('bot_removed').notNullable();
    table.integer('private_chats').notNullable();
    table.integer('channels').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = (knex) => knex.schema.dropTable('statistics');
