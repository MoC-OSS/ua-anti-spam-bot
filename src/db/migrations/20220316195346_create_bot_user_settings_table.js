/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async (knex) =>
  knex.schema.createTable('bot_user_settings', (table) => {
    table.uuid('id').defaultTo(knex.raw('uuid_generate_v4()')).primary();
    table.uuid('bot_users_id').references('bot_users.id').onUpdate('CASCADE').onDelete('CASCADE');
    table.string('name', 32).notNullable();
    table.string('value', 256).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = (knex) => knex.schema.dropTable('bot_user_settings');
