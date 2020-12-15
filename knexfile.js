// Update with your config settings.

module.exports = {

  development: {
    client: 'mysql',
    connection: {
      host: '127.0.0.1',
      user: 'veg',
      password: 'password',
      database: 'dataveg'
    },
    
    seeds: {
      directory: `${__dirname}/src/database/seeds`
    }
    
  }
};
