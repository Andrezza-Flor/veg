
exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('Usuarios').del()
    .then(function () {
      // Inserts seed entries
      return knex('Usuarios').insert([
        {email_Usuario: 'gabriela@hotmail.com', nome_Usuario: 'Gabriela Flor', telefone_Usuario: '117786-9989', cpf_Usuario: '112.443.554-09', dt_Nasc_Usuario: '2000-07-19'},
        {email_Usuario: 'amanda@hotmail.com', nome_Usuario: 'Amanda Flor', telefone_Usuario: '1194454-8876', cpf_Usuario: '786.765.998-90', dt_Nasc_Usuario: '1997-12-06'}
      ]);
    });
};
