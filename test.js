const { Player, Item } = require('./df')

Player.on('Join',player => {
    player.SendMessage('Hello world!')
    player.SendMessage('This is my first template which I have used in DF, made with javascript!')
    player.SendMessage(Item.loc(1,2,3,4,5))
    player.SendMessage(Item.sound('Explode',100,0))
    player.SendMessage(Item.pot('Instant Damage',5,10))
}).json('GeorgeRNG')
