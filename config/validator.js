const joi = require('joi')

const validator = (req, res, next) => {
    const schema = joi.object({
        firstName: joi.string().max(20).min(3).trim().pattern(/(?=.*[A-Z])(?=.*[a-z])/).required().messages({
            'string.min': 'firstName / The name must contain more than 3 characters',
            'string.max': "firstName / The name must contain a maximum of 20 characters",
            'string.pattern.base': "Please write your name with capital letters and muniscules"
        }),

        lastName: joi.string().max(20).min(3).trim().pattern(/(?=.*[A-Z])(?=.*[a-z])/).required().messages({
            'string.min': 'lastName / Last name must contain more than 3 characters.',
            'string.max': "lastName / The last name must contain a maximum of 20 characters.",
            'string.pattern.base': "Please write your last name with upper case and lower case."
        }),

        email: joi.string().email({ minDomainSegments: 2 }).required().messages({
            'string.email': 'Wrong email format.'
        }),
        password: joi.string().max(30).min(6).pattern(/(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])/).required().messages({
            "string.pattern.base": "The password must contain at least one uppercase letter, one lowercase letter, and one number.",
            "string.min": "The password must contain a minimum of 6 alphanumeric characters.",
            "string.max": "The password must not exceed 30 alphanumeric characters."
        }),
        from: joi.string(),
    })

    const validation = schema.validate(req.body.userData, { abortEarly: false })

    if (validation.error) {

        return res.json({
            success: false,
            from: "validator",
            message: validation.error.details,
        })
    }
    next()
}

module.exports = validator