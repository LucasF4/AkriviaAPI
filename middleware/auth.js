function auth(req, res, next){
    if(req.session.username != undefined){
        next()
    }else{
        res.redirect('/login')
    }
}

module.exports = auth