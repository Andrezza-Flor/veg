
exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('Plantacoes').del()
    
};
