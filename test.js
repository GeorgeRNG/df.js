const { Player, Item, Variable } = require('./df')

Player.on('Join',player => {
    st = new Variable('bob','local');
    st.set('hello!')
    Player.if('IsGrounded',[],() => {
        player.SendMessage(st)
    })
}).json('GeorgeRNG')