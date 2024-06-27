// const swaggerAutogen = require('swagger-autogen')();

// const doc = {
//   info: {
//     title: 'Dairy Farm APIs',
//     description: ''
//   },
//   host: 'localhost:4000'
// };

// const outputFile = './swagger.json';
// const routes = [
//   './src/routes/*.js',
  // './src/routes/bill.routes.js',
  // './src/routes/birth.routes.js',
  // './src/routes/building.routes.js',
  // './src/routes/cow.routes.js',
  // './src/routes/dashboard.routes.js',
  // './src/routes/equipment.routes.js',
  // './src/routes/food.routes.js',
  // './src/routes/heal.routes.js',
  // './src/routes/job.routes.js',
  // './src/routes/line.routes.js',
  // './src/routes/maintenance.routes.js',
  // './src/routes/milk.routes.js',
  // './src/routes/notification.routes.js',
  // './src/routes/notificationParam.routes.js',
  // './src/routes/param.routes.js',
  // './src/routes/protection.routes.js',
  // './src/routes/recipe.routes.js',
  // './src/routes/report.routes.js',
  // './src/routes/reproduction.routes.js',
  // './src/routes/salary.routes.js',
  // './src/routes/vaccine.routes.js',
  // './src/routes/worker.routes.js',
// ];

/* NOTE: If you are using the express Router, you must pass in the 'routes' only the 
root file where the route starts, such as index.js, app.js, routes.js, etc ... */

// swaggerAutogen(outputFile, routes, doc);

const swaggerJsdoc = require('swagger-jsdoc')
const swaggerUi = require('swagger-ui-express')
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Dairy Farm API',
      description: "API endpoints for a dairy farm services documented on swagger",
      contact: {
        name: "Desmond Obisi",
        email: "info@miniblog.com",
        url: "https://github.com/Janescience/cow-engine-mongo"
      },
      version: '1.0.0',
    },
    servers: [
      {
        url: "http://localhost:4000",
        description: "Local server"
      },
      {
        url: "https://cow-engine-mongo.fly.dev",
        description: "Live server"
      },
    ]
  },
  // looks for configuration in specified directories
  apis: ['./src/routes/*.js'],
}
const swaggerSpec = swaggerJsdoc(options)
function swaggerDocs(app, port) {
  // Swagger Page
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
  // Documentation in JSON format
  app.get('/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json')
    res.send(swaggerSpec)
  })
  console.log('Created Swagger UI')

}
module.exports = swaggerDocs
