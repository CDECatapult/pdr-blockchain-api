const Joi = require('@hapi/joi')

const schema = Joi.object().keys({
  hash: Joi.string()
    .pattern(/^[a-f0-9]{96}$/)
    .required(),
  date: Joi.date().required(),
})

module.exports = schema
