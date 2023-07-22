const Router = require('express').Router()
const validator = require('../config/validator')
const usersControllers = require('../controllers/user-controllers');
const {signUpUsers, signInUser, signOutUser,verifyEmail, verificarToken}= usersControllers
const passport = require('../config/passport')

Router.route('/auth/signUp')
.post(validator,signUpUsers)

Router.route('/auth/signIn')
.post(signInUser)

Router.route('/auth/signOut')
.post(signOutUser)

Router.route('/verify/:uniqueString') //RECIBE EL LINK DE USUARIO
.get(verifyEmail) //LLAMA A FUNCION DE VERIFICACIION

// Router.route('/auth/signInToken')
// .get(passport.authenticate('jwt',{ session: false }),verificarToken
// )
module.exports = Router