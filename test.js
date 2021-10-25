const { Player, Item, Variable } = require('./df')

Player.Join(() => {
    Player.SendMessage('hello!',{'Alignment Mode':'Centered'})
}).json('GeorgeRNG')