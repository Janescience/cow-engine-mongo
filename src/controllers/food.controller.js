const db = require("../models");
const Food = db.food;
const FoodDetail = db.foodDetail;
const Recipe = db.recipe;
const Cow = db.cow;

const projection = { amount: 1, name: 1, _id: 1 };


const getRecipesByIds = async (recipeIds) => {
  const recipes = await Recipe.find({ _id: { $in: recipeIds } }, projection);
  const recipeMap = new Map();
  recipes.forEach((recipe) => {
    recipeMap.set(recipe._id.toString(), recipe);
  });
  return recipeMap;
};

exports.getAll = async (req, res) => {
    const filter = req.query
    filter.farm = req.farmId
    const foods = await Food.find(filter).populate('foodDetails').sort({corral:1,year:1,month:1}).exec();

    const recipeIds = foods.map((food) => food.foodDetails.map((foodDetail) => foodDetail.recipe)).flat();

    const recipeMap = await getRecipesByIds(recipeIds);

    foods.forEach((food) => {
      food.foodDetails.forEach((foodDetail) => {
        const recipe = recipeMap.get(foodDetail.recipe.toString());
        if (recipe) {
          foodDetail.relate = { recipe: { amount: recipe.amount, name: recipe.name, _id: recipe._id } };
        }
      });
    });

    res.json({foods});
};

exports.get = async (req, res) => {
    const id = req.params.id
    const food = await Food.findById(id).exec();
    res.status(200).send({food});
};

exports.create = async (req, res) => {
    try {
      const data = req.body;
      const farmId = req.farmId;
  
      const food = {
        corral : data.corral,
        numCow : data.numCow,
        month : data.month,
        year : data.year,
        farm : farmId
      } 
      const newFood = new Food(food);
  
      const foodSaved = await newFood.save();
  
      const foodDetails = data.foodDetails.map(detail => ({ ...detail, food: foodSaved._id }));
      const foodDetailIds = await FoodDetail.insertMany(foodDetails);
      const detailIds = foodDetailIds.map(detail => detail._id);
  
      await Food.updateOne({ _id: foodSaved._id }, { foodDetails: detailIds }).exec();
  
      res.status(200).send({ foodSaved });
    } catch (error) {
      console.error(error);
      res.status(500).send(error);
    }
  };

exports.update = async (req, res) => {
    const id = req.params.id;
    const data = req.body;
    data.farm = req.farmId

    const numCow = await Cow.find({corral:data.corral,farm:data.farm}).countDocuments();
    data.numCow = numCow;
    data.amountAvg = data.amount/numCow;
    data.recipe = data.recipe._id

    const updatedFood = await Food.updateOne({_id:id},data).exec();
    // console.log("Food updated : ",updatedFood);

    res.status(200).send({updatedFood});
};

exports.delete = async (req, res) => {
    const id = req.params.id;
    const deletedFood = await Food.deleteOne({_id:id});
    // console.log("Food deleted : ",deletedFood);

    res.status(200).send({deletedFood});
};

exports.deletes = async (req, res) => {
    const datas = req.body;
    await Food.deleteMany({_id:{$in:datas}});
    res.status(200).send('Delete selected successfully.');
};
