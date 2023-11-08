// const Sequelize = require('sequelize');

// const sequelize = new Sequelize({
//     database: "postgres",
//     username: "postgres",
//     password: "postgres",
//     host: "dairyfarm-db.cj6bvhybetwa.ap-southeast-1.rds.amazonaws.com",
//     port: 5432,
//     dialect: "postgres",
//     dialectOptions: {
//         ssl: {
//             require: true,
//             rejectUnauthorized: false
//         }
//      },
//      pool: {
//         max: 20,
//         min: 0,
//         acquire: 30000,
//         idle: 10000
//       }
// });

// module.exports = sequelize

module.exports = {
  // HOST: "13.250.122.106",
  HOST: "dairyfarm-db.cj6bvhybetwa.ap-southeast-1.rds.amazonaws.com",
  USER: "postgres",
  PASSWORD: "postgres",
  // PASSWORD: "post123",
  DB: "postgres",
  dialect: "postgres",
  pool: {
    max: 20,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};
