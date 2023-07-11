const express = require('express')
const router = express.Router()
const knex = require('../Database/conection')
const bcrypt = require('bcrypt')

const auth = require('../middleware/auth')

router.get('/', auth, (req, res) => {
    res.render('home')
})

router.get('/login', (req, res) => {
    res.render('login')
})

router.post('/login', async (req, res) => {
    var { email, senha } = req.body

    var conf = await knex.raw(`SELECT * FROM tb_users tu LEFT JOIN tb_funcoes tf ON tu.idfuncao = tf.idfuncao WHERE tu.email = '${email}'`)

    if(conf.rows[0] != undefined){
        var correct = bcrypt.compareSync(senha, conf.rows[0].senha)
        console.log(correct)
        if(correct){
            req.session.username = conf.rows[0].username;
            res.redirect('/')
        }else{
            res.redirect('/login')
        }
    }

})

module.exports = router