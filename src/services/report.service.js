const db = require("../models");

const Reproduction = db.reproduction;
const Birth = db.birth;
const MilkDetail = db.milkDetail;
const Cow = db.cow;
const Heal = db.heal;

const { repoStatus,repoResult } = require('../constants/reproduct');
const { status,quality } = require('../constants/cow');
const { calAge } = require('../utils/age-calculate');

const cowService  = require('../services/cow.service');

const mapReproduct = async (req) => {
  const filter = req.query
  filter.farm = req.farmId
  const repos = await Reproduction.find(filter).populate('cow').exec();
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

const mapCow = async (req) => {
  const filter = req.query
    filter.farm = req.farmId
    const cowDocs = await Cow.find(filter).exec();
    let results = []
    for(let cowDoc of cowDocs){
      let cow = {...cowDoc.toObject()}
      cow['age'] = calAge(cowDoc.birthDate).ageString;
      cow['quality'] = quality().find(x => x.id === cowDoc.quality).label
      cow['status'] = status().find(x => x.id === cowDoc.status).label
      cow['flag'] = (cowDoc.flag === 'Y' ? 'ใช้งาน' : 'ไม่ใช้งาน')

      filter.cow = cowDoc._id
      const milks = await MilkDetail.find(filter).exec();
      cow['milkSum'] = milks.reduce((sum,milk) => sum + milk.qty,0)
      cow['milkAvg'] = milks.length > 0 ? cow['milkSum']/milks.length : 0

      const level = await cowService.quality(cowDoc._id)
      cow['level'] = level.grade + ' (' + level.description + ')';

      results.push(cow)
    }
    return results;
} 

const mapHeal = async (req) => {
  const data = req.query;
  let dateCondition = {}
  
  let where = {farm:req.farmId}

  if(data.dateFrom){
    let start = new Date(data.dateFrom)
    const startOffset = start.getTimezoneOffset();
    let startDate = new Date(start.getTime() - (startOffset*60*1000))
    dateCondition.$gte = startDate.toISOString().split('T')[0]
  }
  
  if(data.dateTo){
    let end = new Date(data.dateTo);
    const endOffset = end.getTimezoneOffset();
    let endDate = new Date(end.getTime() - (endOffset*60*1000))
    dateCondition.$lte = endDate.toISOString().split('T')[0]
  }

  if(Object.keys(dateCondition).length > 0 ){
    where.date = dateCondition
  }

  const healDocs = await Heal.find(where).populate('cow').exec();

  let results = []
  for(let healDoc of healDocs){
    let heal = {...healDoc.toObject()}
    heal.code = heal.cow.code;
    heal.name = heal.cow.name;
    results.push(heal)
  }
  return results;
}

const report = {
  mapReproduct,
  mapCow,
  mapHeal
};

module.exports = report;
