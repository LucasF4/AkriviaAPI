const jwt = require('jsonwebtoken')
async function authenticator(req, res, next){
    
    const authHeader = req.headers['authorization']
    const token      = authHeader && authHeader.split(' ')[1]

    if(!token){
        return res.status(401).json({msg: 'Acesso Negado'})
    }

    try{
        const secret      = process.env.SECRET
        jwt.verify(token, secret)
        var decodificado  = jwt.decode(token)
        req.session.user  = decodificado.username
        req.session.email = decodificado.email
        next()
    }
    catch(error){
        res.status(400).json({msg: 'Token Inválido!'})
    }

}

module.exports = authenticator