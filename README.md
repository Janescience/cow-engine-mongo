
# Dairy Farm Engine

Dairy-Farm system backend. Runtime on Node.js.

## Tech Stacks

- Node.js
- Express.js
- MongoDB
- JWT

## Prerequires

- [Node.js](https://nodejs.org/en/download) on local
- [MongoDB](https://www.prisma.io/dataguide/mongodb/setting-up-a-local-mongodb-database) on local or cloud

## How to run on local

1. Create file `.env`
2. Add variable `URI` and `PORT`
  
```
URI=<path-mongodb-connection> 
// ex. 'mongodb+srv://<user>:<password>@<url>/<collection-name>'
PORT=4000
```

3. Run command `npm install` when you run first time.
4. Start project with `npm start`
5. Can access path `http://localhost:4000`
