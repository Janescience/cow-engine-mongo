
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server')

module.exports.connect = async () => {
    const mongoDb = await MongoMemoryServer.create();
    const uri = mongoDb.getUri();
    const mongooseOpts = {
        useNewUrlParser : true,
        useUnifiedTopology : true ,
        maxPoolSize : 10
    };
    await mongoose.connect(uri,mongooseOpts);
}

module.exports.closeDatabase = async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
}

module.exports.clearDatabase = async () => {
    const collections = mongoose.connection.collections;
    for(const key in collections){
        const collection = collections[key];
        await collection.deleteMany();
    }   
}