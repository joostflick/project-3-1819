var dashboardSocket = io('/dashboard')
console.log(dashboardSocket)
var usercount = 0
dashboardSocket.on('userConnection', connection => {
  if (connection) {
    usercount++
  } else {
    if (usercount > 0) {
      usercount--
    }
  }
  document.getElementById('totalChats').innerText = usercount
  document.getElementById('waitingChats').innerText = usercount
  console.log(usercount)
})
dashboardSocket.on('totalMessages', total => {
  document.getElementById('sentMessages').innerText = total
  document.getElementById('receivedMessages').innerText = total
})

var timeArray = []
var waitArray = []
dashboardSocket.on('connectionTime', time => {
  timeArray.push(time)
  console.log(timeArray)
  document.getElementById('longestConvo').innerText =
    Math.max(...timeArray) + ' seconds'
  document.getElementById('averageConvo').innerText =
    takeAverage(timeArray) + ' seconds'
  waitArray.push(longestwaitTime)
  document.getElementById('averageWait').innerText =
    takeAverage(waitArray) + ' seconds'
})

function takeAverage(array) {
  let sum = array.reduce((previous, current) => (current += previous))
  return Math.round(sum / array.length)
}

var longestwaitTime = 0
dashboardSocket.on('waitTime', time => {
  if (time > longestwaitTime) {
    longestwaitTime = time
    document.getElementById('longestWait').innerText =
      longestwaitTime + ' seconds'
  }
  console.log(time)
})

var positive = 0
var negative = 0
dashboardSocket.on('rating', rating => {
  if (rating) {
    positive++
    document.getElementById('satisfiedUsers').innerText = positive
    document.getElementById('satisfactionPerc').innerText = percentage(
      positive,
      positive + negative
    )
  } else if (!rating) {
    negative++

    document.getElementById('unsatisfiedUsers').innerText = negative
    document.getElementById('satisfactionPerc').innerText = percentage(
      positive,
      positive + negative
    )
  }
})

function percentage(partialValue, totalValue) {
  return (100 * partialValue) / totalValue
}
