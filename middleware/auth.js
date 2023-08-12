const knex = require('../Database/conection')

async function auth(req, res, next){
    if(req.session.username != undefined){
        var result = await knex.raw(`
            SELECT *, CAST(datacadastro as date) as cadastro FROM tb_users tu LEFT JOIN tb_funcoes tf ON tu.idfuncao = tf.idfuncao WHERE tu.email = '${req.session.email}' AND username = '${req.session.username}'
        `)
        console.log(result.rows[0])
        if(result.rows[0].accountverify == false){
            req.session.username = undefined;
            res.redirect('/login')
        }else{
            req.session.nomefantasia = result.rows[0].nomefantasia == '' || result.rows[0].nomefantasia == undefined ? '-' : result.rows[0].nomefantasia
            req.session.access = result.rows[0].funcao == '' || result.rows[0].funcao == undefined ? '-' : result.rows[0].funcao
            req.session.cnpj = result.rows[0].cnpj == '' || result.rows[0].cnpj == undefined ? '-' : result.rows[0].cnpj
            req.session.mcc = result.rows[0].mcc == '' || result.rows[0].mcc == undefined ? '-' : result.rows[0].mcc
            req.session.datacadastro = result.rows[0].cadastro == '' || result.rows[0].cadastro == undefined ? '-' : result.rows[0].cadastro
            req.session.cpf = result.rows[0].cpf == '' || result.rows[0].cpf == undefined ? '-' : result.rows[0].cpf
            req.session.rg = result.rows[0].rg == '' || result.rows[0].rg == undefined ? '-' : result.rows[0].rg
            req.session.datanascimento = result.rows[0].datanascimento == '' || result.rows[0].datanascimento == undefined ? '-' : result.rows[0].datanascimento
            req.session.celular = result.rows[0].celular == '' || result.rows[0].celular == undefined ? '-' : result.rows[0].celular
            req.session.tipopessoa = result.rows[0].tipopessoa == '' || result.rows[0].tipopessoa == undefined ? '-' : result.rows[0].tipopessoa
            req.session.razaosocial = result.rows[0].razaosocial == '' || result.rows[0].razaosocial == undefined ? '-' : result.rows[0].razaosocial
            next()
        }
    }else{
        res.redirect('/login')
    }
}

module.exports = auth