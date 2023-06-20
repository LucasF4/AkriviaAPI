require('dotenv').config()

const express = require('express')
const app = express()
const PORT = process.env.PORT || 3332
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken')
const knex = require('./Database/conection')
const {v4: uuidV4} = require('uuid')
const session = require('express-session')
const bcrypt = require('bcrypt')
const authenticator = require('./middleware/authenticator')
const upload = require('./middleware/upload')
const fs = require('fs')
const path = require('path')

const cors = require('cors')

const userController = require('./controller/userController')

const routerDefault = '/api/v1'

app.use(session({
        secret: process.env.SECRET,
        resave: false,
        saveUninitialized: true,
        cookie: {maxAge: 360000}
    })
)

app.use(express.static(__dirname + '/public'))
app.set('views', path.join(__dirname + '/views'))
app.set('view engine', 'ejs')

/* UTILIZANDO A FORMATACAO TIPO JSON PARA ENVIO E RECEBIMENTO DE DADOS */
app.use(bodyParser.urlencoded({extended: true, limit: 1024*1024*20}))
app.use(bodyParser.json({extended: true, limit: 1024*1024*20}))

app.use('/', userController)

app.use(cors())

/* ROTA RESPONSÁVEL POR TRANSFORMAR OS ARQUIVOS SALVOS NO SERVIDOR EM BASE64 */
/* app.get('/file', authenticator, async(req, res) => {
    const file_buffer = fs.readFileSync('./public/src/images/uploads/Lucas Félix_1686596557740.pdf')
    const content_in_base64 = file_buffer.toString('base64')
    res.json({src: content_in_base64})
}) */

/* ROTA RESPONSÁVEL POR SALVAR ARQUIVOS PASSADOS POR PARÂMETRO EM BASE64 */
app.post(routerDefault + '/upload', authenticator, upload)

/* ROTA QUE CONSULTA O ARQUIVO BINÁRIO SALVO NO BANCO DE DADOS E RETORNA O MESMO NO JSON DA APLICAÇÃO */
app.get(routerDefault + '/download', authenticator, async (req, res) => {
    console.log('Rota Acessada')
    await knex.raw(`SELECT idusers, convert_from(base64files, 'UTF8') as file FROM tb_files tf LEFT JOIN tb_users tu ON tf.idusers = tu.id WHERE tu.username = '${req.session.user}'`).then(
        result => {
            res.json({file: result.rows[0].file})
        }
    )
})

app.post(routerDefault + '/login', async (req, res) => {
    var { email, senha } = req.body

    var conf = await knex('tb_users').select().where({email: email})

    if(conf[0] != undefined){
        var correct = bcrypt.compareSync(senha, conf[0].senha)
        console.log(correct)
        if(correct){
            const token = jwt.sign(
                {
                    username: conf[0].username,
                    email: conf[0].email
                },
                process.env.SECRET,
                {
                    expiresIn: "120s"
                }
            )
            res.status(201).json({msg: "Usuário logado com sucesso", token})
        }else{
            res.status(401).json({msg: "Credenciais Incorretas"})
        }
    }

})

app.post(routerDefault + '/cadastrar', async (req, res) => {
    var { email, senha, username } = req.body
    var uuid = uuidV4()

    console.log(email, senha, username)

    var exist = await knex.raw(`SELECT id FROM tb_users WHERE email = '${email}'`)
    console.log(exist)
    if(exist[0] == undefined){
        var salt = bcrypt.genSaltSync(10)
        var hash = bcrypt.hashSync(senha, salt)
        await knex.raw(`
            INSERT INTO tb_users VALUES ('${uuid}', '${email}', '${hash}', '${username}', false)
        `).then(() => {
            res.status(201).json({msg: 'Usuário cadastrado com sucesso!'})
        })
        .catch(e => {
            console.log(e)
            res.status(401).json({msg: 'Ocorreu um erro na criação do seu usuário', e})
        })
    }
})


app.listen(PORT, () => {
    console.log('Servidor rodando na porta: ' + PORT)
})