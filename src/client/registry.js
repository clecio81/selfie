const { Collection } = require('discord.js');
const Command = require('./../command/index');

class Registry {
    constructor( client ){

        Object.defineProperty( this, 'client', { value: client } );

        this.commands = new Collection();

    }

    registerCommand(command) {
        return this.registerCommands([command]);
    }

    registerCommands(commands) {

        if(!Array.isArray(commands)) throw new TypeError('Commands must be an Array.');

        for( let obj of commands ) {

            let command;

            if( typeof obj.command === 'function') command = new obj.command(this.client);

            // Verify that it's an actual command
            if( !( command instanceof Command ) ) {
                this.client.emit( 'warn', `Attempting to register an invalid command object: ${command}; skipping.` );
                continue;
            }

            //Set group
            if( obj.group ){
                command.group = obj.group;
            }else{
                this.client.emit( 'warn', `Attempting to register a command with out group: ${command.name}; skipping.` );
                continue;
            }

            // Make sure there aren't any conflicts
            if( this.commands.some( cmd => cmd.name === command.name || cmd.aliases.includes( command.name ) ) ) {
                this.client.emit( 'error', `A command with the name/alias "${command.name}" is already registered.` );
            }

            for( const alias of command.aliases ) {
                if( this.commands.some( cmd => cmd.name === alias || cmd.aliases.includes( alias ) ) ) {
                    this.client.emit( 'error', `A command with the name/alias "${alias}" is already registered.` );
                }
            }

            //Register
            this.commands.set( command.name, command );
            this.client.emit( 'commandRegister', command, this );
        }

        return this;
    }

    registerCommandsIn(options) {
        const obj = require('require-all')(options);
        const commands = [];

        Object.keys( obj ).map( i => {
            Object.keys( obj[i] ).map( j => {
                commands.push( { command: obj[i][j], group: i } );
            });
        });

        return this.registerCommands( commands );
    }

    find( name ) {
        for( const command of this.commands ) {
            if ( command[1].name === name || command[1].aliases.includes( name )) return command[1];
        }
    }

    get commandTable() {
        let table = {};
        this.commands.forEach( command => {
            if (!table[command.group]) table[command.group] = [];
            table[command.group].push( { name: command.name, aliases: command.aliases, description: command.description, arguments: command.arguments, examples: command.examples } )
        });
        return table;
    }
}

module.exports = Registry;