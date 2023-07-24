const User = require('../models/user-model')
const bcryptjs = require('bcryptjs')
const crypto = require('crypto')        //NPM CRYPTO
const nodemailer = require('nodemailer') //NPM NODEMAILER
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;
const jwt = require('jsonwebtoken')

const sendEmail = async (email, uniqueString) => { //FUNCION ENCARGADA DE ENVIAR EL EMAIL

    const myOAuth2Client = new OAuth2(
        process.env.GOOGLE_CLIENTID,
        process.env.GOOGLE_CLIENTSECRET,
        "https://developers.google.com/oauthplayground"
    )
    myOAuth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESHTOKEN
    });

    const accessToken = myOAuth2Client.getAccessToken()

    const transporter = nodemailer.createTransport({ //DEFINIMOS EL TRASPORTE UTILIZANDO NODEMAILER
        service: "gmail",
        auth: {
            user: "useremailverify@gmail.com",    //DEFINIMOS LOS DATOS DE AUTORIZACION DE NUESTRO PROVEEDOR DE
            type: "OAuth2",
            clientId: process.env.GOOGLE_CLIENTID,
            clientSecret: process.env.GOOGLE_CLIENTSECRET,
            refreshToken: process.env.GOOGLE_REFRESHTOKEN,
            accessToken: accessToken //COREO ELECTRONICO, CONFIGURAR CUAENTAS PARA PERMIR EL USO DE APPS
        },
        tls: {
            rejectUnauthorized: false
        }  //CONFIGURACIONES DE GMAIL
    })

    // EN ESTA SECCION LOS PARAMETROS DEL MAIL 
    let sender = "useremailverif@gmail.com"
    let mailOptions = {
        from: sender,    //DE QUIEN
        to: email,       //A QUIEN
        subject: "User email verification ", //EL ASUNTO Y EN HTML EL TEMPLATE PARA EL CUERPO DE EMAIL Y EL LINK DE VERIFICACION
        html: `
        <div >
        <h1 style="color:red">We welcome you to MyTinerary, the perfect place to find your next adventure, to continue with the registration click on the following link to verify your email <a href=http://localhost:3000/${uniqueString}></a> </h1>
        </div>
        `

    };

    transporter.sendMail(mailOptions, function (error, response) { //SE REALIZA EL ENVIO
        if (error) { console.log(error) }
        else {
            console.log("Message sent")

        }
    })
};

const usersControllers = {

    verifyEmail: async (req, res) => {

        const { uniqueString } = req.params; //EXTRAE EL EL STRING UNICO DEL LINK

        const user = await User.findOne({ uniqueString: uniqueString })
        //console.log(user) //BUSCA AL USUARIO CORRESPONDIENTE AL LINK
        if (user) {
            user.emailVerificado = true //COLOCA EL CAMPO emailVerified en true
            await user.save()
            res.redirect("https://localhost:3000/") //REDIRECCIONA AL USUARIO A UNA RUTA DEFINIDA
            //return  res.json({success:true, response:"Su email se ha verificado correctamente"})
        }
        else { res.json({ success: false, response: "Your email has not been verified" }) }
    },


    signUpUsers: async (req, res) => {
        let { firstName, lastName, email, password, from } = req.body.userData
        const test = req.body.test

        try {

            const userExist = await User.findOne({ email }) //BUSCAR SI EL USUARIO YA EXISTE EN DB

            if (userExist) {
                if (userExist.from.indexOf(from) !== -1) {
                     //INDEXOF = 0 EL VALOR EXISTE EN EL INDICE EQ A TRUE -1 NO EXITE EQ A FALSE
                    res.json({
                        success: false,
                        from: "signup",
                        message: "You have already done your SignUp in this way, please do SignIn"
                    })
                } else {
                    const contraseñaHasheada = bcryptjs.hashSync(password, 10)

                    userExist.from.push(from)
                    userExist.password.push(contraseñaHasheada)
                    if (from === "form-Signup") {
                        //PORSTERIORMENTE AGREGAREMOS LA VERIFICACION DE EMAIL
                        userExist.uniqueString = crypto.randomBytes(15).toString('hex')
                        await userExist.save()

                        await sendEmail(email, userExist.uniqueString) //LLAMA A LA FUNCION ENCARGADA DEL ENVIO DEL CORREO ELECTRONICO
                        res.json({
                            success: true,
                            from: "signup",
                            message: "We send you an email to validate it, please check its box to complete the registration and add it to your login methods, if you can't find the verification message, please check the spam box."
                        })

                    } else {

                        userExist.save()

                        res.json({
                            success: true,
                            from: "signup",
                            message: "You have successfully added " + from + " to your SignIn methods"
                        })
                    }
                }
            } else {
                //SI EL USUARIO NO ESXITE
                //LO CREA Y ENCRIPTA LA CONTRASEÑA
                const contraseñaHasheada = bcryptjs.hashSync(password, 10)

                // CREA UN NUEVO OBJETO DE PERSONAS CON SU USUARIO Y CONTRASEÑA (YA ENCRIPTADA)
                const nuevoUsuario = await new User({
                    firstName,
                    lastName,
                    email,
                    password: [contraseñaHasheada],
                    uniqueString: crypto.randomBytes(15).toString('hex'),
                    emailVerificado: false,
                    from: [from]

                })

                //SE LO ASIGNA AL USUARIO NUEVO
                if (from !== "form-Signup") { //SI LA PETICION PROVIENE DE CUENTA EXTERNA
                    await nuevoUsuario.save()
                    res.json({
                        success: true,
                        from: "signup",
                        message: "Your user has been created successfully with " + from
                    }) // AGREGAMOS MENSAJE DE VERIFICACION

                } else {
                    //PASAR EMAIL VERIFICADO A FALSE
                    //ENVIARLE EL EMAIL PARA VERIFICAR
                    await nuevoUsuario.save()
                    await sendEmail(email, nuevoUsuario.uniqueString) //LLAMA A LA FUNCION ENCARGADA DEL ENVIO DEL CORREO ELECTRONICO

                    res.json({
                        success: true,
                        from: "signup",
                        message: "We send you an email to validate it, please check your box to complete the signUp. "
                    }) // AGREGAMOS MENSAJE DE VERIFICACION
                }
            }
        } catch (error) {

            res.json({ success: false, message: " Oh! Something has gone wrong, please try again in a few minutes. " }) //CAPTURA EL ERROR
        }
    },
    signInUser: async (req, res) => {

        const { email, password, from } = req.body.logedUser
        try {
            const userExist = await User.findOne({ email })
            //METODO PARA BUSCAR PASSWORD MEDIANTE FROM
            //console.log(userExist.from)
            //console.log(from)
            const indexpass = userExist.from.indexOf(from)
            //console.log(userExist.password[indexpass])

            if (!userExist) {// PRIMERO VERIFICA QUE EL USUARIO EXISTA
                res.json({ success: false, message: " Your user is not registered, please perform signUp. " })

            } else {
                if (from !== "form-Signup") {

                    let contraseñaCoincide = userExist.password.filter(pass => bcryptjs.compareSync(password, pass))

                    if (contraseñaCoincide.length > 0) {

                        const userData = {
                            id: userExist._id,
                            firstName: userExist.firstName,
                            lastName: lastName,
                            email: userExist.email,
                            from: from,

                        }
                        userExist.isConected = true
                        userExist.lastConection = new Date().toLocaleString()
                        await userExist.save()

                        const token = jwt.sign({ ...userData }, process.env.SECRET_KEY, { expiresIn: 60 * 60 * 24 })


                        res.json({
                            success: true,
                            from: from,
                            response: { token, userData },
                            message: "Hello! "+ userData.firstName + " welcome again.",
                        })

                    } else {
                        res.json({
                            success: false,
                            from: from,
                            message: "You have not registered with " + from + "if you want to enter with this method you must signUp with " + from
                        })
                    }
                } else {
                    if (userExist.emailVerificado) {

                        let contraseñaCoincide = userExist.password.filter(pass => bcryptjs.compareSync(password, pass))
                        //console.log(contraseñaCoincide)
                        //console.log("resultado de busqueda de contrasela: " +(contraseñaCoincide.length >0))
                        if (contraseñaCoincide.length > 0) {

                            const userData = {
                                id: userExist._id,
                                firstName: userExist.firstName,
                                lastName: userExist.lastName,
                                email: userExist.email,
                                from: from,

                            }
                            userExist.isConected = true
                            userExist.lastConection = new Date().toLocaleString()
                            await userExist.save()
                            const token = jwt.sign({ ...userData }, process.env.SECRET_KEY, { expiresIn: 60 * 60 * 24 })
                            res.json({
                                success: true,
                                from: from,
                                response: { token, userData },
                                message: "Welcome again " + userData.firstName,
                            })
                        } else {
                            res.json({
                                success: false,
                                from: from,
                                message: "The username or password does not match.",
                            })
                        }
                    } else {
                        res.json({
                            success: false,
                            from: from,
                            message: "You have not verified your email, please check your email box to complete your signUp, if you do not see the email remember to also check the spam box. "
                        })
                    }

                } //SI NO ESTA VERIFICADO
            }

        } catch (error) {

            res.json({ success: false, message: "Oh! Something went wrong, try again in a few minutes." })
        }
    },
    signOutUser: async (req, res) => {

        const email = req.body.closeuser
        const user = await User.findOne({ email })

        user.isConected = false
        await user.save()

        res.json({ success: true })
    },
    verificarToken: (req, res) => {


        if (req.user) {
            res.json({
                success: true,
                response: { id: req.user.id, firstName: req.user.firstName, lastName: req.userlastName, email: req.user.email, from: "token" },
                message: "Welcome again " + req.user.firstName
            })
        } else {
            res.json({
                success: false,
                message: "Please perform signIn again."
            })
        }
    }

}
module.exports = usersControllers
