const pako = require('pako')
const WebSocket = require('ws').WebSocket


const BlockTypes = [
    "player_action",
    "if_player",
    "start_process",
    "call_func",
    "control",
    "set_var",
    "entity_event",
    "event",
    "func",
    "if_entity",
    "entity_action",
    "if_var",
    "select_obj",
    "game_action",
    "else",
    "process",
    "repeat",
    "if_game"
]

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
    if(typeof(value) === 'string'){
        return new Item('txt',{'name':value})
    }
    if(typeof(value) === 'number'){
        return new Item('num',{'name':String(value)})
    }
}

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
        data['args']['items'] = this.items.map(item => item.json())
        console.log(data)
        return data
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
                        'source':'DF.JS'
                    }
                ))
            })
            ws.on('message',message => {
                console.log(String.fromCharCode.apply(null, message))
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

Player = {
    on(name,call){
        internalCode = new Template(new Block('event',name))
        call(new Selection)
        return internalCode
    }
}

module.exports = {Template,Block,BlockTypes,Player,Selection,Item}