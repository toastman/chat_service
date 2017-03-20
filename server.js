const app = require('express')()
const routes = require('./routes.js')
const cors = require('cors')
const bodyParser = require('body-parser')
const morgan = require('morgan')
const http = require('http').Server(app)
const io = require('socket.io')(http)
const jwt = require('jsonwebtoken')
const config = require('./config.json')

const socketioJwt = require('socketio-jwt')
const server_port = process.env.OPENSHIFT_NODEJS_PORT || 3002
const server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1'

app.use(cors())
app.use(bodyParser.json())
app.use(morgan('tiny'))
app.use(routes)

io.sockets
  .on('connection', socketioJwt.authorize({
    secret: config.jwt_secret,
    callback: false
  }))
  .on('authenticated', socket => {
    console.log('hello! ', socket.decoded_token.username)

    socket
      .on('logout', () => {
        console.log('Bye! ', socket.decoded_token.username)
        socket.disconnect()
      })
      .on('unauthorized', (error) => {
        if (error.data.type == "UnauthorizedError" || error.data.code == "invalid_token") {
          // redirect user to login page perhaps?
          console.log("User's token has expired");
        }
      })
      .on('chat message', msg => {
        console.log('decoded_token: ', socket.decoded_token)

        console.log(`Server get message from ${socket.decoded_token.username}:`, msg)
        io.emit('chat message', `User ${socket.decoded_token.username} say: ${msg}`)
      })
  })
  .on('unauthorized', error => {
    console.log('Users token has expired', error.data)
    // if (error.data.type == "UnauthorizedError" || error.data.code == "invalid_token") {
    //   // redirect user to login page perhaps?
    //   console.log("User's token has expired")
    // }
  })

const server = http.listen(server_port, server_ip_address, () => {
  console.log(`Auth servise running on http://${server.address().address}${server.address().port}`)
})
