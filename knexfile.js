// Update with your config settings.

module.exports = {

  development: {
    client: 'mysql',
    connection: {
      host: '127.0.0.1',
      user: 'root',
      password: '0000',
      database: 'dataveg'
    },
    
    seeds: {
      directory: `${__dirname}/src/database/seeds`
    }
    
  }
};
