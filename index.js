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
const uploads = require('./middleware/uploadCurriculo')
const fs = require('fs')
const path = require('path')

const flash = require('express-flash')

const cors = require('cors')

const userController = require('./controller/userController')

const routerDefault = '/api/v1'

app.use(session({
        secret: process.env.SECRET,
        resave: false,
        saveUninitialized: true,
        cookie: {maxAge: 3600000}
    })
)

app.use(flash())

app.use(express.static(__dirname + '/public'))
app.set('views', path.join(__dirname + '/views'))
app.set('view engine', 'ejs')

/* UTILIZANDO A FORMATACAO TIPO JSON PARA ENVIO E RECEBIMENTO DE DADOS */
app.use(bodyParser.urlencoded({extended: true, limit: 1024*1024*20}))
app.use(bodyParser.json({extended: true, limit: 1024*1024*20}))

app.use(cors())

app.use('/', userController)


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

app.get(routerDefault + '/verify', authenticator, (req, res) => {
    res.json({msg: 'Valid'})
})

app.post(routerDefault + '/login', async (req, res) => {
    var { email, senha } = req.body

    var conf = await knex.raw(`SELECT * FROM tb_users tu LEFT JOIN tb_funcoes tf ON tu.idfuncao = tf.idfuncao WHERE tu.email = '${email}'`)

    if(conf.rows[0] != undefined){
        var correct = bcrypt.compareSync(senha, conf.rows[0].senha)
        console.log(correct)
        if(correct){
            const token = jwt.sign(
                {
                    username: conf.rows[0].username,
                    email: conf.rows[0].email,
                    funcao: conf.rows[0].funcao
                },
                process.env.SECRET,
                {
                    expiresIn: "86400s"
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

app.post(routerDefault + '/curriculo', uploads.single('foto'), async(req, res) => {
    var { nome, phone, email, rg, cpf, sexo, escolaridade, cep, bairro, uf } = req.body
    var pdf = req.file

    if(
        pdf == undefined  || pdf.length == 0 ||
        nome == undefined || nome.length == 0 ||
        email == undefined || email.length == 0
    ){
        return res.json({msg: 'File not Found!'})
    }
    
    pdf = pdf.path.replace('public', '')
    
    console.log(pdf)

    await knex.raw(`
        INSERT INTO trabalhe_conosco
        VALUES
        ('${pdf}', '${nome}', '${phone}', ${rg}, '${cpf}', '${sexo}', '${escolaridade}', ${cep}, '${bairro}', '${uf}')
    `).then(() => {
        res.status(201).json({msg: "Currículo cadastrado com sucesso"})
    })
    .catch( e => {
        console.log(e)
        res.status(400).json({msg: "Ocorreu um erro no cadastro do currículo!"})
    })

})

app.listen(PORT, () => {
    console.log(__dirname)
    console.log('Servidor rodando na porta: ' + PORT)
})