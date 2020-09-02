
exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('Plantacoes').del()
    .then(function () {
      const dt = new Date();
      // Inserts seed entries
      return knex('Plantacoes').insert([
        {
          cod_Plantacao: null,
          email_Gerente: 'gabriela@hotmail.com'
        }
      ]);
    });
};
