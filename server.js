const express = require('express');
const expressFileupload = require('express-fileupload');
const multer = require('multer');
const cors = require("cors")
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');

const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerDocument = require('./swagger.json');

const path = require('path');
const fs = require('fs')

const { logger } = require('./src/middlewares/log-events');
const errorHandler  = require('./src/middlewares/error-handler');
const moment = require('moment');
require('moment/locale/th');

//Configure dotenv files above using any other library and files
dotenv.config(); 
require('./src/config/conn');
// require('./src/config/conn.memory');
// require('./src/schedule/notify-cron');
require('./cron-jobs.js');
 // Initialize Express App 
const app = express();

 // Use Middlewares 
app.use(logger);
app.use(expressFileupload())

// var storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, './uploads')
//   },
//   filename: function (req, file, cb) {
//     cb(null, file.originalname)
//   }
// })
// app.use(
//   multer({ storage: storage }).any()
// );

const whitelist = ['https://cow-app.vercel.app','https://www.dairyfarm.online','http://localhost:5173','http://localhost:4000'];
const corsOption = {
  origin: (origin, callback) => {
    if(whitelist.indexOf(origin) !== -1 || !origin){
      callback(null,true)
    }else{
      callback(new Error('Not allowed by CORS'))
    }
  },
  optionsSuccessStatus : 200
}
app.use(cors(corsOption))// CORS is a node.js package for providing a Connect/Express middleware that can be used to enable CORS with various options.
app.use(express.json({limit:'50mb'}))
app.use(express.urlencoded({limit: '50mb', extended:true }))
app.use(express.static(path.join(__dirname, '/public')))
app.use(cookieParser())
app.use(// for serving Swagger UI static files and displaying the API docs in JSON format 
    '/api-docs',
    swaggerUi.serve, 
    swaggerUi.setup(swaggerDocument)
);

 // Routes Setup  
require('./src/routes/auth.routes')(app);
require('./src/routes/line.routes')(app);
require('./src/routes/cow.routes')(app);
require('./src/routes/milk.routes')(app);
require('./src/routes/reproduction.routes')(app);
require('./src/routes/birth.routes')(app);
require('./src/routes/heal.routes')(app);
require('./src/routes/protection.routes')(app);
require('./src/routes/food.routes')(app);
require('./src/routes/recipe.routes')(app);
require('./src/routes/dashboard.routes')(app);
require('./src/routes/report.routes')(app);
require('./src/routes/notification.routes')(app);
require('./src/routes/param.routes')(app);
require('./src/routes/notificationParam.routes')(app);
require('./src/routes/notification.routes')(app);
require('./src/routes/vaccine.routes')(app);
require('./src/routes/worker.routes')(app);
require('./src/routes/equipment.routes')(app);
require('./src/routes/building.routes')(app);
require('./src/routes/maintenance.routes')(app);
require('./src/routes/bill.routes')(app);
require('./src/routes/salary.routes')(app);
require('./src/routes/job.routes')(app);

// basic route
app.get(["/","/index.html"],(req,res) => {
  res.sendFile(path.join(__dirname, 'views','index.html'));
})

app.all("*", (req,res) => {
  res.status(404);
  if(req.accepts('html')){
    res.sendFile(path.join(__dirname, 'views','404.html'));
  } else if (req.accepts('json')) {
    res.json({error : "404 Not Found"});
  }else {
    res.type('txt').send('404 Not Found')
  }
})

app.use(errorHandler)

app.listen(process.env.PORT, () => {
    console.log("Server is running on port : ",process.env.PORT);
})


