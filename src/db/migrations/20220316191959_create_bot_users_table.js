/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async (knex) =>
  knex.schema.createTable('bot_users', (table) => {
    table.uuid('id').defaultTo(knex.raw('uuid_generate_v4()')).primary();
    table.string('chat_id', 20).notNullable();
    table.enu('type', ['group', 'super_group', 'channel', 'private']);
    table.boolean('is_admin').notNullable();
    table.boolean('is_removed').notNullable();
    table.integer('members_count').notNullable();
    table.integer('removed_count').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = (knex) => knex.schema.dropTable('bot_users');
