$(function() {
  var socket = io('/chat')
  $('form').submit(function(e) {
    e.preventDefault() // prevents page reloading
    socket.emit('chat message', $('#m').val())
    $('#m').val('')
    return false
  })
  socket.on('chat message', function(msg) {
    $('#messages').append($('<li>').text(msg))
    $('#chat-end')[0].scrollIntoView()
  })
  socket.on('username', function(username) {
    $('#messages').append($('<li class="username">').text(username))
    $('#chat-end')[0].scrollIntoView()
  })
  socket.on('bot message', function(msg) {
    $('#messages').append($('<li class="botmessage">').text(msg))
    $('#chat-end')[0].scrollIntoView()
  })
  socket.on('close', close => {
    if (close) {
      setTimeout(function() {
        window.location.href = '/thanks'
      }, 3000)
    }
  })
  socket.on('link', function(msg) {
    $('#messages').append(
      $('<a href=' + msg + ' target="_blank"><li>').text(msg)
    )
    $('#chat-end')[0].scrollIntoView()
  })
})
