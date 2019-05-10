const express = require('express')
const app = express()
const http = require('http').Server(app)

var bodyParser = require('body-parser')
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
const axios = require('axios')
require('isomorphic-fetch')

const path = require('path')

const io = require('socket.io')(http)

const port = process.env.PORT || 7070

app.use(express.static(path.join(__dirname, 'public')))

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'public/views'))

app.get('/', (req, res) => {
  res.render('index')
})

app.get('/dashboard', (req, res) => {
  res.render('dashboard')
})

app.get('/thanks', (req, res) => {
  res.render('thanks')
})

// replace all function
String.prototype.replaceAll = function(str1, str2, ignore) {
  return this.replace(
    new RegExp(
      str1.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g, '\\$&'),
      ignore ? 'gi' : 'g'
    ),
    typeof str2 == 'string' ? str2.replace(/\$/g, '$$$$') : str2
  )
}

const dashboardNsp = io.of('/dashboard')

dashboardNsp.on('connection', socket => {
  console.log('dashboard connected')
})

const chatNsp = io.of('/chat')

var totalMessages = 0

chatNsp.on('connection', socket => {
  var startTime = new Date()
  var waitTimer
  let userID = socket.id
  var username = 'New user'
  dashboardNsp.emit('userConnection', true)
  axios
    .post('http://api.codetunnel.net/random-nick', {
      dataType: 'json'
    })
    .then(function(response) {
      username = response.data.nickname + ' (' + userID + ')'
      socket.emit(
        'bot message',
        username +
          ' connected. Type !help to see which commands are currently available'
      )
    })

    .catch(function(error) {
      username = userID
      socket.emit(
        'bot message',
        username +
          ' connected. Type !help to see which commands are currently available'
      )
    })
  var msgSent = false
  socket.on('chat message', msg => {
    if (msg) {
      if (!msgSent) {
        var startWait = new Date()
        waitTimer = setInterval(function() {
          endWait = new Date()
          var timeDiff = endWait - startWait //in ms
          // strip the ms
          timeDiff /= 1000

          // get seconds
          var seconds = Math.round(timeDiff)
          dashboardNsp.emit('waitTime', seconds)
        }, 1000)
        msgSent = true
      }
      totalMessages++
      dashboardNsp.emit('totalMessages', totalMessages)
      socket.emit('username', username + ':')
      socket.emit('chat message', msg)
      if (msg.includes('!help')) {
        socket.emit(
          'bot message',
          'This chat utilizes the following commands::'
        )
        socket.emit('bot message', '- Translation (!translate)')
        socket.emit('bot message', '- Positive rating (!positive)')
        socket.emit('bot message', '- Negative rating (!negative)')
        socket.emit('bot message', 'To close the chat leave a rating!')
      }
      if (msg.includes('!positive')) {
        dashboardNsp.emit('rating', true)
        socket.emit('bot message', 'Thank you for rating this chat!')
        socket.emit('bot message', 'Chat will be closed shortly.')
        socket.emit('close', true)
      }
      if (msg.includes('!negative')) {
        dashboardNsp.emit('rating', false)
        socket.emit('bot message', 'Thank you for rating this chat!')
        socket.emit('bot message', 'The chat will be closed in 5 seconds.')
        socket.emit('close', true)
      }
      if (msg.includes('!translate ') && msg.replace('!translate ', '') != '') {
        var sourceText = msg.replace('!translate', '')
        var sourceLang = 'auto'
        var targetLang = 'en'
        var url =
          'https://translate.googleapis.com/translate_a/single?client=gtx&sl=' +
          sourceLang +
          '&tl=' +
          targetLang +
          '&dt=t&q=' +
          encodeURI(sourceText)
        fetch(url)
          .then(function(response) {
            return response.json()
          })
          .then(function(myJson) {
            var newMsg = JSON.stringify(myJson[0][0][0])
            var oldMsg = JSON.stringify(myJson[0][0][1])
            var lang = JSON.stringify(myJson[2])
            console.log(newMsg)
            console.log(JSON.stringify(myJson))
            socket.emit(
              'bot message',
              'Recognized language ' + lang + ' translated to "en": ' + newMsg
            )
          })
      }
    }
  })
  console.log('A user connected')
  socket.on('disconnect', () => {
    socket.emit('bot message', username + ' disconnected.')
    clearInterval(waitTimer)
    var endTime = new Date()
    var timeDiff = endTime - startTime //in ms
    // strip the ms
    timeDiff /= 1000

    // get seconds
    var seconds = Math.round(timeDiff)
    dashboardNsp.emit('connectionTime', seconds)
    console.log(seconds + ' seconds')
    dashboardNsp.emit('userConnection', false)
  })
})

http.listen(port, () => {
  console.log(`App running on port ${port}!`)
})
