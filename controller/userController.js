const express = require('express')
const router = express.Router()
const knex = require('../Database/conection')
const bcrypt = require('bcrypt')
const {v4: uuidV4} = require('uuid')
const axios = require('axios')
const moment = require('moment')

const fs = require('fs')

const auth = require('../middleware/auth')

router.get('/', auth, (req, res) => {
    res.render('page', {username: req.session.username, acesso: req.session.access, token_sicredi: req.session.token})
})

router.get('/gerar-boleto', auth, (req, res) => {
    res.render('contaInterna', {username: req.session.username, acesso: req.session.access, token_sicredi: req.session.token})
})

router.get('/login', (req, res) => {
    var erro = req.flash('Erro')
    var success = req.flash('success')
    var email = req.flash('email')

    erro = (erro == undefined || erro.length == 0) ? undefined : erro
    success = (success == undefined || success.length == 0) ? undefined : success
    email = (email == undefined || email.length == 0) ? undefined : email

    res.render('login', {erro: erro, success: success, email: email})
})

router.get('/cadastrar', (req, res) => {
    res.render('cadastrar')
})

router.get('/logout', (req, res) => {
    req.session.username = undefined
    res.redirect('/login')
})

router.post('/login', async (req, res) => {
    var { email, senha } = req.body

    var conf = await knex.raw(`SELECT * FROM tb_users tu LEFT JOIN tb_funcoes tf ON tu.idfuncao = tf.idfuncao WHERE tu.email = '${email}'`)

    if(conf.rows[0] != undefined){
        var correct = bcrypt.compareSync(senha, conf.rows[0].senha)
        console.log(correct)
        if(correct && conf.rows[0].accountverify){

            await axios.post('https://api-parceiro.sicredi.com.br/sb/auth/openapi/token',
            {
                username: '123456789',
                password: 'teste123',
                scope: 'cobranca',
                grant_type: 'password'
            },
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'context': 'COBRANCA',
                    'x-api-key': '9897a65d-45d7-4538-b4f5-4fdec6caa774'
                }
            }).then( resp => {
                req.session.username = conf.rows[0].username;
                req.session.access = conf.rows[0].funcao;
                req.session.token = resp['data']['access_token'];
                req.session.email = conf.rows[0].email;
                console.log(req.session.token)
                res.redirect('/')
            }).catch(e => {
                res.redirect('/login')
            })

        }else{
            var error = 'Credenciais Inválidas ou conta bloqueada, tente novamente.';
            req.flash('Erro', error)
            req.flash('email', email)
            res.redirect('/login')
        }
    }else{
        var error = 'Credenciais Inválidas ou conta bloqueada, tente novamente.'
        req.flash('Erro', error)
        res.redirect('/login')
    }

})

router.post('/boleto', auth, async(req,res) => {
    
    await axios.post('https://api-parceiro.sicredi.com.br/sb/cobranca/boleto/v1/boletos',
    {
        beneficiarioFinal:{
            cep:91250000,
            cidade:"PORTO ALEGRE",
            documento:"00028600401",
            logradouro:"RUA DOUTOR VARGAS NETO 980",
            nome:"FELIPE OLIVEIRA",
            numeroEndereco:119,
            tipoPessoa:"PESSOA_FISICA",
            uf:"RS"
        },
        codigoBeneficiario:"12345",
        dataVencimento:"2023-09-30",
        especieDocumento:"DUPLICATA_MERCANTIL_INDICACAO",
        pagador:{
            cep:"91250000",
            cidade:"PORTO ALEGRE",
            documento:"00028600401",
            nome:"RODRIGO OLIVEIRA",
            tipoPessoa:"PESSOA_FISICA",
            endereco:"RUA DOUTOR VARGAS NETO 150",
            uf:"RS"
        },
        tipoCobranca:"HIBRIDO",
        nossoNumero: 600046210,
        seuNumero:"TESTE",
        valor:50.00,
        tipoDesconto: "VALOR",
        valorDesconto1:10.00,
        dataDesconto1:"2023-09-15",
        valorDesconto2:7.00,
        dataDesconto2:"2023-09-20",
        valorDesconto3:3.00,
        dataDesconto3:"2023-09-30",
        tipoJuros: "VALOR",
        juros: 5.00,
        multa: 3.00,
        informativos: [
            "info 1"
        ],
        mensagens: [
            "mens 1"
        ]
    },
    {
        headers: {
            "Context-Type": "application/json",
            "x-api-key": "9897a65d-45d7-4538-b4f5-4fdec6caa774",
            "posto": '03',
            "cooperativa": '6789',
            "Authorization": `Bearer ${req.session.token}` 
        }
    }
    ).then( async resp => {
        console.log("Entrei aqui")
        console.log(resp)
        req.session.linhaDigitavel = resp['data'].linhaDigitavel
        await axios.get('https://api-parceiro.sicredi.com.br/sb/cobranca/boleto/v1/boletos/pdf?linhaDigitavel=' + req.session.linhaDigitavel,{
            headers: {
                "Context-Type": "application/json",
                "x-api-key": "9897a65d-45d7-4538-b4f5-4fdec6caa774",
                "posto": '03',
                "cooperativa": '6789',
                "Authorization": 'Bearer ' + req.session.token 
            },
            responseType: 'arraybuffer'
        }).then( async resp => {
            console.log(resp['data'])

            await fs.writeFileSync('./public/src/images/uploads/'+ req.session.username +'_boleto_file.pdf', resp['data'])

            res.download('./public/src/images/uploads/'+req.session.username+'_boleto_file.pdf')
        })
    })
    .catch(e => console.log(e))

})

router.get('/profile', auth, async (req,res) => {
    var dataCadastroFormatado = moment(req.session.datacadastro).format('DD/MM/YYYY')
    res.render('profile', {
        username: req.session.username, email: req.session.email,
        acesso: req.session.access,
        nomeFantasia: req.session.nomefantasia,
        cnpj: req.session.cnpj,
        mcc: req.session.mcc,
        dataCadastro: dataCadastroFormatado,
        cpf: req.session.cpf,
        rg: req.session.rg,
        datanascimento: req.session.datanascimento,
        celular: req.session.celular,
        razaoSocial: req.session.razaosocial,
        tipoPessoa: req.session.tipopessoa
    })
})

router.post('/cadastro', async(req, res) => {
    
    var {email, senha, username} = req.body
    var uuid = uuidV4()
    var today = moment().format('YYYY-MM-DD')
    var date = new Date()
    var time = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}.000000`
    
    var exist = await knex.raw(`SELECT id FROM tb_users WHERE email = '${email}'`)
    console.log(exist.rows)
    if(exist.rows[0] == undefined){
        var salt = bcrypt.genSaltSync(10)
        var hash = bcrypt.hashSync(senha, salt)
        await knex.raw(`
            INSERT INTO tb_users VALUES ('${uuid}', '${email}', '${hash}', '${username}', false, 3, null, null, null, '${today} ${time}', null, null, null, null, null, 'Pessoa Física')
        `)
        .then(() => {
            var success = 'Usuário Criado com sucesso, aguarde a authorização da conta para realizar o login.'
            req.flash('success', success)
            res.redirect('/login')
        })
        .catch(e => {
            console.log(e)
            res.send("Erro ao tentar criar usuário, contate um desenvolvedor.")
        })

    }else{
        var error = 'Usuário já cadastrado com este email'
        req.flash('Erro', error)
        res.redirect('/login')
    }

})

router.get('/users', auth, async(req, res) => {
    console.log(req.session.username)
    console.log(req.session.access)
    if(req.session.access == 'CEO' || req.session.access == 'DEV' || req.session.access == 'ADMIN'){
        var funcoes = await knex.raw('SELECT * FROM tb_funcoes')
        var results = await knex.raw(`SELECT * FROM tb_users tu LEFT JOIN tb_funcoes tf ON tu.idfuncao = tf.idfuncao`)
        res.render('usuarios.ejs', {username: req.session.username, users: results.rows, acesso: req.session.access, funcoes: funcoes.rows})
    }else{
        res.redirect('/')
    }
})

router.post('/edit/:iduser', auth, async (req, res) => {
    var iduser = req.params
    var { tipoPessoa, cnpj, nomeFantasia , razaoSocial, mcc, rg, cpf, dataNascimento, celular, funcao } = req.body

    if(req.session.access == 'CEO' || req.session.access == 'DEV' || req.session.access == 'ADMIN'){
        console.log(iduser.iduser)
        
        console.log(tipoPessoa + ' ' + cnpj + ' ' + nomeFantasia + ' ' + razaoSocial + ' ' + mcc + ' ' + rg + ' ' +cpf + ' ' + dataNascimento + ' ' + celular)
        await knex.raw(`
            UPDATE tb_users SET 
            idfuncao = ${funcao},
            nomefantasia = '${nomeFantasia}',
            cnpj = '${cnpj}',
            mcc = '${mcc}',
            cpf = '${cpf}',
            rg = '${rg}',
            datanascimento = '${dataNascimento}',
            celular = '${celular}',
            razaosocial = '${razaoSocial}',
            tipopessoa = '${tipoPessoa}'
            WHERE id = '${iduser.iduser}'
        `).then(()=>{
            res.redirect('/users')
        })
        .catch(e => {
            console.log(e)
            res.redirect('/')
        })
    }else{
        console.log(req.session.access)
        res.redirect('/')
    }
})

router.get('/authorized/:bool', auth, async(req, res) => {
    var { uuid } = req.query
    let {bool} = req.params

    if(req.session.access == 'CEO' || req.session.access == 'DEV' || req.session.access == 'ADMIN'){
        console.log(bool)

        await knex.raw(`UPDATE tb_users SET accountverify = ${bool} WHERE id = '${uuid}'`).then(() => {
            res.redirect('/users')
        }).catch(e => {
            console.log(e)
            res.redirect('/')
        })
    }else{
        res.redirect('/')
    }
})

router.get('/curriculos', auth, async(req, res) => {
    if(req.session.access == 'CEO' || req.session.access == 'DEV' || req.session.access == 'ADMIN' || req.session.access == 'RH'){
        var curriculos = await knex.raw(`
            SELECT * FROM trabalhe_conosco
        `)
        res.render('curriculos', {
            username: req.session.username, 
            acesso: req.session.access,
            token_sicredi: req.session.token,
            curriculos: curriculos.rows
        })
    }else{
        res.redirect('/')
    }
})

module.exports = router