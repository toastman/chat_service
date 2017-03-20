const express = require('express')
const router = express.Router()
const mongoConnected = require('./db.js')
const redisConnected = require('./redis.js')
const jwt = require('jsonwebtoken')
const config = require('./config.json')

router.post('/login', (req, res) => {
  mongoConnected.then(db => {
    db
      .collection('users')
      .findOne(
      {
        'username': req.body.username,
        'password': req.body.password
      },
      {
        '_id': 0,
        'password': 0,
        'iat': 0
      },
      (err, user) => {
        console.log('user: ', user)

        if (!user || err) {
          res.status(404).send()
        } else {
          const token = jwt.sign(user, config.jwt_secret)

          res.status(200).json({
            user,
            token,
            tokenType: 'Bearer'
          })
        }
      }
      )
  })
})

router.post('/signup', (req, res) => {
  mongoConnected.then(db => {
    db
      .collection('users')
      .insert(req.body, (err, user) => {
        if (err) res.status(404).send(err)
        res.status(201).send()
      })
  })
})

router.get('/checktoken', (req, res) => {
  if (!req.get('authorization')) return res.status(401).send('Unauthorised')
  const token = req.get('authorization').split(' ')[1]

  jwt.verify(token, config.jwt_secret, function (err, decoded) {
    if (err) return res.status(401).send('Unauthorised')
    res.status(200).send('Hello World!')
  })
})

module.exports = router