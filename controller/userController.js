const express = require('express')
const router = express.Router()
const nodemailer = require('nodemailer')

router.get('/login', (req, res) => {
    res.render('login')
})

router.get('/sendMail/document', async(req, res) => {
    var { email, url, url2 } = req.query
    console.log(email)
    if(!email){
        res.json({msg: "Erro"})
    }else{
        var users = ['lmateus8673@gmail.com', email]
        var urls = [url, url2]

        for(var i = 0; i < users.length; i++){
            var remetente = nodemailer.createTransport({
                service: 'Hotmail',
                port: 587,
                auth: {
                    user: process.env.EMAILCOUNT,
                    pass: process.env.EMAILPASS
                }
            })
    
            var sendEmail = {
                from: process.env.EMAILCOUNT,
                to: users[i],
                subject: 'ASSINAR DOCUMENTO',
                html: `
                    <div style="display: flex; flex-direction: column; justify-content: center; align-items: center;">
                        <div style="background-color: #F3F3F3; width: 20%; display: flex; justify-content: center;">
                            <img src="https://www.akrivia.com.br/img/AKRIVIA-QUADRADO-Fundo.png" height="100">
                        </div>
                        <div style="display: flex; flex-direction: column; justify-content: center; align-items: center;">
                            <h2>Solicitação de Assinatura de Documento</h2>
                            <p>Prezados,<br>Favor validar contrato e posteriormente assinar.<br><br>Qualquer dúvida, tratar com seu consultor.<br><br>Atenciosamente,<br>Grupo Akrivia!</p>
                            <br>
                            <a href="${urls[i]}" style="background-color: green; color: white; padding: 15px; border: none; font-weight: bold; cursor: pointer; text-decoration: none;">Confirmo os dados do documento</a>
                        </div>
                    </div>
                `
            }
    
            remetente.sendMail(sendEmail, (err) => {
                if(err){
                    console.log(err)
                    res.json({msg: "Erro ao enviar email"})
                }else{
                    console.log('Email enviado com sucesso')
                }
            })
        }
        
        res.render('envio')

    }
})

module.exports = router