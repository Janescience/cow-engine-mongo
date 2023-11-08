const db = require("../models");
const RecipeDetail = db.recipeDetail;
const Recipe = db.recipe;


exports.getAll = async (req, res) => {
    const filter = req.query;
    filter.farm = req.farmId;
    try {
        const recipes = await Recipe.find(filter).populate('recipeDetails').exec();
        res.json({recipes});
    } catch (error) {
        res.status(500).json(error);
    }
};

exports.get = async (req, res) => {
    const id = req.params.id
    const recipe = await Recipe.findById(id).exec();
    res.status(200).send({recipe});
};

exports.create = async (req, res) => {
    const data = req.body;
    data.recipe.farm = req.farmId;
    const newRecipe = new Recipe(data.recipe);
    await newRecipe.save((err, recipe) => {
        if (err) {
            res.status(500).send({ message: err });
            return;
        }

        for(let detail of data.recipeDetail){
            detail.recipe = recipe._id
        }

        RecipeDetail.create(data.recipeDetail)
    })
    
    res.status(200).send(newRecipe);
};

exports.update = async (req, res) => {
    const id = req.params.id;
    const data = req.body;
    await RecipeDetail.deleteMany({recipe:id});

    for(let detail of data.recipeDetail){
        detail.recipe = id
    }
    RecipeDetail.create(data.recipeDetail)

    const updatedRecipe = await Recipe.updateOne({_id:id},data.recipe).exec();
    res.status(200).send({updatedRecipe});
};

exports.delete = async (req, res) => {
    const id = req.params.id;
    await RecipeDetail.deleteMany({recipe:id});
    const deletedRecipe = await Recipe.deleteOne({_id:id});
    res.status(200).send({deletedRecipe});
};
