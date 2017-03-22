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
const server_port = process.env.OPENSHIFT_NODEJS_PORT || 3000
const server_ip_address = process.env.OPENSHIFT_NODEJS_IP || 'localhost'

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
    socket.emit('join', socket.decoded_token)

    socket
      .on('leave', socket.disconnect)
      .on('unauthorized', unauthorizedHandler)
      .on('message', chatMessageHandler)

    function unauthorizedHandler(error) {
      if (error.data.type == 'UnauthorizedError' || error.data.code == 'invalid_token') {
        // redirect user to login page perhaps?
        console.log("User's token has expired");
      }
    }

    function chatMessageHandler(msg) {
      io.emit('chat message', {
        msg,
        user: socket.decoded_token
      })
    }
  })

const server = http.listen(server_port, server_ip_address, () => {
  console.log(`Auth servise running on http://${server.address().address}:${server.address().port}`)
})
