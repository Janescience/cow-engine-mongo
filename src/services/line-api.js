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
const MAX_MESSAGE_LENGTH = 1000;

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
        return error;
    });
}

//Notification to Line
const notify = async (text,type,farm,token,notiIds,time) => {
    const messageChunks = chunkMessage(text, MAX_MESSAGE_LENGTH);
    for (const chunk of messageChunks) {
        const data = new URLSearchParams({ message: chunk });
        await axios.post(
            url_line_notification,
            data,
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

                if(time === 'Today'){
                    await notiService.updateStatusDueDate(notiIds,'S');
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
    
}

/**
 * Split a message into chunks of a specified maximum length.
 * @param {string} message - The message to split.
 * @param {number} maxLength - The maximum length of each chunk.
 * @returns {string[]} - An array of message chunks.
 */
function chunkMessage(message, maxLength) {
    const chunks = [];
    let startIndex = 0;

    while (startIndex < message.length) {
        const chunk = message.slice(startIndex, startIndex + maxLength);
        chunks.push(chunk);
        startIndex += maxLength;
    }

    return chunks;
}

const lineNotify = {
    notify,
    token
};

module.exports = lineNotify;
