const User = require('../models/user-model')
const socketControllers = {


    getUserConected : async (req, res) => { //Busca los usuariios conectados y trae los campos requeridos

        const user = await User.find({ isConected: true }, { firstName: 1, lastName: 1, email: 1, isConected: 1 , lastConection:1}) //nombre del campo:1 se requiere, nombre del campo:0 no se requiere 
        return ({ user })
      }

}
module.exports = socketControllers    