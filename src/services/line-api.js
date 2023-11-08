const axios = require('axios');
const qs = require('qs');
const dotenv = require('dotenv');
const db = require("../models");
const User = db.user;
const Farm = db.farm;

const notiService  = require("./notification.service")

dotenv.config();

const url_line_notification = "https://notify-api.line.me/api/notify";
const url_line_token = "https://notify-bot.line.me/oauth/token";

//Get Token
const token =  async (code,username) => {
    axios.post(
        url_line_token,
        qs.stringify({
            grant_type : 'authorization_code',
            code : code,
            redirect_uri : 'http://localhost:4000/line/redirect',
            client_id : 'oXiT9LVmeywPufRQwwlUfV',
            client_secret : '9xZ6CmqcX2gECK4bZH8cyzkAH8BjEzRIuyo6E5Vo3Vw'
        }),
        {
            headers : {
                'Content-Type': 'application/x-www-form-urlencoded',
            }
        }
    ).then( (response) => {
        // console.log('Get Token : ',response.data);
        
        if(response.data){
              User.findOne({username:username})
                .exec((err, user) => {
                    const filter = { _id : user.farm._id };
                    const update = { lineToken: response.data.access_token };
                    Farm.findOneAndUpdate(filter,{$set:update},{new : true })
                        .exec((err, farm) => {
                            if (err) {
                                console.error('Error : ',err);
                            }
                            // console.log('Updated Successfully : ',user);

                            lineNotify.notify('เชื่อมต่อสำเร็จ','S',user.farm,response.data.access_token)
                        })
                })
            
        }
        return response.data;
    })
    .catch(function (error) {
        console.error('Error : ',error.response.data.message);
        return error;
    });
}

//Notification to Line
const notify = async (text,type,farm,token,notiIds,time) => {
    await axios.post(
        url_line_notification,
        qs.stringify({message:text}),
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization' : 'Bearer ' + token
            }
        },
        ).then(async function (response) {
            // console.log('Notify Successfully : ',response.data);

            const respMsg = 'status='+response.data.status + ',message='+response.data.message;

            if(time !== 'Empty'){
                await notiService.saveLog(text,type,'S',respMsg,farm,notiIds);
            }

            if(time === 'Before'){
                await notiService.updateStatusBefore(notiIds,'S');
            }

            if(time === 'After'){
                await notiService.updateStatusAfter(notiIds,'S');
            }

            return response.data;
        })
        .catch(async function (error) {
            console.error('Notification Error : ',error);
            await notiService.saveLog(text,type,'F',JSON.stringify(error),farm,notiIds);
        });
}

const lineNotify = {
    notify,
    token
};

module.exports = lineNotify;
