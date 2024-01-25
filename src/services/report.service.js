const db = require("../models");

const Reproduction = db.reproduction;
const Birth = db.birth;

const { repoStatus,repoResult } = require('../constants/reproduct');
const { calAge } = require('../utils/age-calculate');

const mapReproduct = async (req) => {
  const filter = req.query
  filter.farm = req.farmId
  const repos = await Reproduction.find(filter).populate('cow').sort({"loginDate":1,"estrusDate":1,'matingDate':1,'checkDate':1}).exec();
  let results = []
  for(let repo of repos){
    let reproduct = {...repo.toObject()}
    reproduct.result = repoResult().find(x => x.id === repo.result).label
    reproduct.status = repoStatus().find(x => x.id === repo.status).label
    reproduct.code = repo.cow.code
    reproduct.name = repo.cow.name

    if(repo.status == 3  || repo.status == 2){
      const birth = await Birth.findOne({reproduction:repo._id,cow:repo.cow._id}).populate('calf').exec();
      if(birth){
        reproduct.pregnantDate = birth.pregnantDate;
        reproduct.sex = birth.sex == 'M' ? 'เพศผู้' : ( birth.sex == 'F' ? 'เพศเมีย' : '');
        reproduct.birthDate = birth.birthDate;
        reproduct.overgrown = birth.overgrown == null || birth.overgrown == 'N' ? 'ไม่ค้าง' : 'ค้าง';
        reproduct.drugDate = birth.drugDate;
        reproduct.washDate = birth.washDate;
        reproduct.gestAge = birth.gestAge == null ? calAge(birth.pregnantDate).ageString : calAge(birth.pregnantDate,birth.birthDate).ageString ;
        reproduct.calfCode = birth?.calf?.code;
        reproduct.calfName = birth?.calf?.name;
      }
    }
    results.push(reproduct)
  }
  return results;
}

const report = {
  mapReproduct
};

module.exports = report;
