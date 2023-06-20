
const fs = require('fs')
const knex = require('../Database/conection')

async function upload (req, res, next) {
    
    let matches = req.body.base64image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/) || req.body.base64image.match(/^data:@([A-Za-z-+\/]+);base64,(.+)$/);
    console.log(matches.length)
    let response = {};
    if(matches.length!==3){
        return new Error('Invalid input string!')
    }
    response.type   = matches[1];
    response.data   = new Buffer.from(matches[2], 'base64');
    let decodedImg  = response;
    let imageBuffer = decodedImg.data;
    let type        = decodedImg.type;
    let fileName    = req.session.user + '_' + Date.now().toString() + '.' + type.split('/')[1];
    try{
        fs.writeFileSync('public/src/images/uploads/' + fileName, imageBuffer, 'utf8')
        var result = await knex.raw(`SELECT id FROM tb_users WHERE username = '${req.session.user}' AND email = '${req.session.email}'`)
        console.log(result.rows)
        if(result.rows[0] != undefined){
            await knex.raw(`INSERT INTO tb_files VALUES ('${result.rows[0].id}', '${matches[2]}')`)
            return res.json({"status": "sucess"})
        }else{
            return res.json({"status": "Error"})
        }
    }catch(e){
        console.log(e)
        return res.json({"status": "failed"})
    }
}

module.exports = upload