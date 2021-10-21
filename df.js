const pako = require('pako')
const db = require('./db.json')
const WebSocket = require('ws').WebSocket

// Parsing actiondump :D

const BlockTypes = db.codeblocks.map(x=>x.identifier)
const Sounds = db.sounds.map(x=>x.icon.name)
const Potions = db.potions.map(x=>x.icon.name)
const IDActionList = Object.fromEntries(db.codeblocks.map(x=>[x.identifier,db.actions.filter(y=>y.codeblockName==x.name)]))
const IDACtionNameList = Object.entries(IDActionList).map(x=>x[1])
const PlayerIfs = db.actions.filter(x=>x.codeblockName=='IF PLAYER')

// ok done lmao

class Variable{
    constructor(name,scope='unsaved'){
        this.name = name;
        scope = {'local':'local','unsaved':'unsaved','game':'unsaved','saved':'saved','save':'saved'}[scope.toLowerCase()];
        if(['local','unsaved','saved'].includes(scope)){
            this.scope = scope
        }
        this.json = Item.get(this).json
    }
    set(value){
        var out = new Block('set_var','=','','',[Item.get(this),Item.get(value)])
        console.log(out.items[0].json)
        internalCode.Blocks.push(out)
    }
}
const Var = Variable

class Item{
    constructor(id,data){
        this.id = id
        this.data = data
    }
    json(slot=0){
        var out = {item:{},slot}
        out['item']['id'] = this.id
        out['item']['data'] = this.data
        return out
    }
}

Item.get = (value) => {
    if(value.constructor.name === 'String'){
        return new Item('txt',{'name':value})
    }
    else if(value.constructor.name === 'Number'){
        return new Item('num',{'name':String(value)})
    }
    else if(value.constructor.name === 'Variable'){
        return new Item('var',{'name':value.name,'scope':value.scope})
    }
    else{
        return value
    }
}
Item.location = (x,y,z,pitch= 0 ,yaw = 0) => {
    return new Item('loc',{'isBlock':false,'loc':{'x':x,'y':y,'z':z,'pitch':pitch,'yaw':yaw}})
}
Item.vector = (x,y,z) => {
    return new Item('vec',{'x':x,'y':y,'z':z})
}
Item.sound = (name,volume=2,pitch=1) => {
    if(Sounds.includes(name)){
        if(pitch >= 0 && pitch <= 2){
            return(new Item('snd',{'sound':name,'pitch':pitch,'vol':volume}))
        }else{
            console.error('You cannot use a pitch outside 0 and 2, it is at',pitch)
        }
    }else{console.error("Sound",name,"doesn't seem to exist.")}
}
Item.potion = (name,amp=1,dur=1000000) => {
    if(Potions.includes(name)){
        if(amp >= -255 && amp <= 255){
            return(new Item('pot',{'pot':name,'dur':dur,'amp':amp}))
        }else{
            console.error('You cannot use a pitch outside 0 and 2, it is at',pitch)
        }
    }else{console.error("Potion",name,"doesn't seem to exist")}
}

Item.loc = Item.location
Item.pos = Item.location
Item.vec = Item.vector
Item.snd = Item.sound
Item.pot = Item.potion

class Block{
    constructor(type,name = '',selection = '',not = '',items = []){
        if(!BlockTypes.includes(type)){console.error('No BlockType',type,'\nTypes are:',BlockTypes);}
        this.type = type
        this.name = name
        this.selection = selection
        this.not = not
        this.items = items
    }
    json(){
        var data = {'id':'block','block':this.type,'args':{}}
        if(!['start_process','call_func','func','process'].includes(this.type)){
            data['action'] = this.name
        }
        else{data['data'] = this.name}
        data['args']['items'] = this.items.map((item,i) => item.json(i))
        console.log(data)
        return data
    }
}
class Bracket{
    constructor(open,sticky){
        this.open = open
    }
    json(){
        return {'id':'bracket','direct':this.open?'open':'close','type':this.sticky?'norm':'repeat'}
    }
}

class Template{
    constructor(FirstBlock){
        this.Blocks = [FirstBlock]
    }
    json(author = '') {
        var out = {}
        out.blocks = this.Blocks.map(block => block.json())
        console.log(out['blocks'])
        out = JSON.stringify(out)
        out = (btoa(String.fromCharCode.apply(null, new Uint16Array(pako.gzip(out)))))
        console.log(out)
        if(author != ''){
            var ws = new WebSocket("ws://localhost:31371/codeutilities/item")
            ws.on('open', () => {
                ws.send(JSON.stringify(
                    {
                        'type':'template',
                        'data':
                        JSON.stringify(
                        {
                            'data':out,
                            'author':author,
                            'name':'DF.JS Template'
                        }
                        ),
                        'source':'df.js'
                    }
                ))
            })
            ws.on('message',message => {
                console.log(String.fromCharCode.apply(null, message))
                ws.close()
            })
        }
        return out
    }
}

class Selection{
    SendMessage(message){
        var block = new Block('player_action','SendMessage')
        block.items.push(Item.get(message))
        internalCode.Blocks.push(block)
    }
}

const Player = {
    on(name,call){
        if(PlayerIfs.includes(name)){
        internalCode = new Template(new Block('event',name))
        call(new Selection)
        return internalCode
            call(new Selection)
            return internalCode
        }else{
            console.error('There is no player event with the name',name)
        }
    },
    if(name,inv,call,tags={},not=false){
        console.log(IDActionList['if_player'].filter(x=>x.name===name)[0])
        internalCode.Blocks.push(new Block('if_player',name,'',not?'NOT':'',inv))
        internalCode.Blocks.push(new Bracket(true,false))
        call()
        internalCode.Blocks.push(new Bracket(false,false))

    }
}


function nodamnsherlock(aristotlevsmashyspikeplate){return(aristotlevsmashyspikeplate);}nodamnsherlock(nodamnsherlock)(console.log)(btoa('Éë'))


module.exports = {Template,Block,BlockTypes,Player,Selection,Item,Variable,Var,Bracket}