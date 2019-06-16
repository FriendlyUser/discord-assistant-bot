/**
 * Discord.ts, used to connect to discord and main functionality for the discord bot is in here.
 * TODO Consider refactoring using the approach indicated by https://github.com/AnIdiotsGuide/guidebot/
 * and by https://anidiots.guide/first-bot/a-basic-command-handler
 */

const Discord = require('discord.js')
const client = new Discord.Client()
const { request } = require('graphql-request')
const fetch = require('node-fetch')
import { logger } from './logger'

// consider adding moment to parse start dates and end dates
function formatDate(date: string | number | Date) {
  var d = new Date(date),
      month = '' + (d.getMonth() + 1),
      day = '' + d.getDate(),
      year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
}

/**
 * This comment _supports_ [Markdown](https://marked.js.org/)
 * 
 * ```typescript
 * // Or you can specify the language explicitly
 * const instance = new MyClass();
 * ```
 */

 /**
  * @interface TodoObj has the property from the graphql interface
  * @property name of the string
  */
interface TodoObj {
  start_date: string;
  end_date: string;
  name: string;
  category: string;
  priority: string;
  id: string;
}
class DiscordBot {
  /**
   * @param logging kind of logger to use
   */
  logging: any;
    constructor () {
        // read config if added
        this.login(process.env.DISCORD_TOKEN)
        this._handle_messages()
        this.logging = logger
    }
    chunk_string(str: string, length: number) {
      var _size = Math.ceil(str.length / length),
      _ret  = new Array(_size),
      _offset

      for (var _i=0; _i<_size; _i++) {
        _offset = _i * length;
        _ret[_i] = str.substring(_offset, _offset + length);
      }

      return _ret;
    }
    login(token: string) {
        // if (this.bot) return log.general.error('Cannot login when already logged in')
        client.login(token)
    }
    async get_fake_crypto_news() {
      // https://us-central1-openvpn-238104.cloudfunctions.net/function-2
      return fetch('https://us-central1-openvpn-238104.cloudfunctions.net/function-2')
      .then((res: { text: () => void; }) => res.text())
      .then((body: any) => { 
        return body
      });
    }
    _handle_messages () {
      // discord content for todo list
      client.on('ready', () => {
          this.logging.info(`Logged in as ${client.user.tag}!`);
      });
      client.on('message', 
        async (msg: { 
          author: any, content: any,
          reply: { (arg0: string): void; (arg0: string): void; (arg0: string): void; (arg0: string): void; },
          send: (arg0: string) => void; channel: { send: { (embed: Object): any; }, awaitMessages: any},
        }) => {
        let prefix = '!'
        // If there is no prefix or the author of this message is a bot, stop processing. This includes this bot, itself.
        if(!msg.content.startsWith(prefix) || msg.author.bot) return;
        if (msg.author == client.user) return
        // hardcoded prefix for now
        // list commands. commands that might have commas
        let listcommands = ['addtask']
        let args: string[] = []
        let command = ''

        // check for commas, if so parse arguments for commas
        if (msg.content.includes(',')) {
          listcommands.forEach( (item, index) => {
            if(msg.content.toLowerCase().includes(item)) {
              args = msg.content
                    .slice(prefix.length + listcommands[index].length)
                    .split(',');
              command = listcommands[index]
            }
          })
        } else {
          // split by spaces
          args = msg.content.slice(prefix.length).split(' ');
          command = args.shift().toLowerCase();
        }
        // console.log(command)
        this.logging.error(args)
        // const args = msg.content.slice(prefix.length).split(' ');
        // option 2 would be to ask for multiple content
        if(command === 'newtask')
        {
          msg.channel.send('Enter task seperated by: name, category and priority.')
          .then(() => {
            msg.channel.awaitMessages((response: { content: String; }) => response.content.length > 0, {
              max: 1,
              time: 30000,
              errors: ['time'],
            })
            .then((collected: { first: () => { content: any; }; }) => {
                // msg.channel.send(`The collected message was: ${collected.first().content}`);
                let content = collected.first().content.slice(prefix.length).split(',');
                if (content.length < 2) {
                  msg.channel.send('Not enough arguments specified, try used a comma seperated list.')
                  return
                }
                let start_date = new Date()
                let end_date = start_date
                end_date.setDate(end_date.getDate() + 7);
                let query = `
                  mutation {
                    addTask(name: "${content[0]}", start_date: "${formatDate(start_date)}", end_date: "${formatDate(end_date)}", category: "${content[1]}", priority: "${content[2]}") {
                        id
                        name
                        start_date
                        end_date
                        category
                        priority
                    }
                }`
                // this.logging.info(query)
                request('http://localhost:9000/graphql', query)
                .then((data: any) => {
                  // console.log(data)
                  // need helper function to convert json to parsable discord statements.
                  msg.reply(JSON.stringify(data))
                  return
                })
                .catch((err: any) => {
                  msg.reply(JSON.stringify(err))
                })
              })
              .catch(() => {
                msg.channel.send('There was no collected message that passed the filter within the time limit!');
              });
          });
        }
        if(command === 'addtask') 
        {
          let start_date = new Date()
          let end_date = start_date 
          end_date.setDate(end_date.getDate() + 7)
          if (args.length < 2) args[2] = 'normal'
          let query = `
            mutation {
              addTask(name: "${args[0]}", start_date: "${formatDate(start_date)}", end_date: "${formatDate(end_date)}", category: "${args[1]}", priority: "${args[2]}") {
                  id
                  name
                  start_date
                  end_date
                  category
                  priority
              }
          }`
          // this.logging.info(query)
          request('http://localhost:9000/graphql', query)
          .then((data: any) => {
            // console.log(data)
            // need helper function to convert json to parsable discord statements.
            msg.reply(JSON.stringify(data))
            return
          })
          .catch((err: any) => {
            msg.reply(JSON.stringify(err))
          })
          
        }
        if(command === 'help') {
          msg.send(`Bot usage is as follows:
            * ${prefix}addtask add new task to mongodb
            * ${prefix}removealltasks deletes all tasks
            * ${prefix}updatetask update an existing task
            * ${prefix}fakenews generate a title for Ethereum Blockchain
            * ${prefix}alltasks show all tasks as fancy discord embeds 
          `)
        }
        // text based version for tasks
        if(command === 'tasks') {
          let query = `{
            queryAllTasks {
              name,
              id,
              start_date,
              end_date,
              category,
              priority
            }
          }`
          request('http://localhost:9000/graphql', query)
          .then((data: { [x: string]: any; }) => {
            this.logging.info("Sending Query to Server")
            this.logging.debug(query)
            // get first key
            var keys = Object.keys(data);
            // access first object
            let todo_list = data[keys[0]]
            msg.channel.send("Getting Todo list data")
            let full_arr: any[] | string[] = []
            if (todo_list === []) {
              msg.channel.send("List is Empty")
            } 
            else {
              if(todo_list !== []) {
                todo_list.forEach(function (todo: { [x: string]: any; }, index: any) {
                  let item_keys = Object.keys(todo)
                  item_keys.forEach(function (data_item, index) {
                    // msg.channel.send(" --- " + data_item + todo[data_item])
                    if (todo[data_item]) full_arr.push(`:crossed_swords:    **${data_item}**: ${todo[data_item]}`)// msg.channel.send(`:crossed_swords:    **${data_item}**: ${todo[data_item]}`)
                    // convert timestamps to 
                  })
                  full_arr.push(`--------------------------------------`)
                })
                let big_string = full_arr.join('\n')
                let send_arr: any | string[] = this.chunk_string(big_string, 1990)
                // TODO come up with better approach aka for loop or equivalent.
                send_arr.forEach( (small_string: string) => {
                  msg.channel.send(small_string)
                })
              }
            }
          })
          .catch((err: any) => {
            this.logging.error(err)
          })
        }
        // embed version of tasks 
        if (command === 'alltasks')
        {
          let query = `{
            queryAllTasks {
              name,
              id,
              start_date,
              end_date,
              category,
              priority
            }
          }`
          // field create mapping
          request('http://localhost:9000/graphql', query)
          .then((query_all_tasks: { [x: string]: any; }) => {
            let todo_list = query_all_tasks.queryAllTasks
            todo_list.forEach( (todo: TodoObj) => {
              msg.channel.send({
                embed: {
                  color: 3447003,
                  author: {
                    name: client.user.username,
                    icon_url: client.user.avatarURL
                  },
                  title: todo.name,
                  url: "http://google.com",
                  description: `Start Date: ${todo.start_date} \t \t \t End Date: ${todo.end_date}`,
                  fields: [{
                      name: "Category",
                      value: `${todo.category}`
                    },
                    {
                      name: "Priority",
                      value: `${todo.priority}`
                    },
                    {
                      name: "Id",
                      value: `${todo.id}`
                    }
                  ],
                  timestamp: new Date(),
                  footer: {
                    icon_url: client.user.avatarURL,
                    text: "© Example"
                  }
                }
              })
            }) 
          })
        }
        // try getting data from server

        if(command === 'removealltasks') 
        {
          // TODO export list of queries to text file
          let query = `mutation {
              removeAllTasks {
                id
              }
            }`
          request('http://localhost:9000/graphql', query)
          .then((data: { [x: string]: any; }) => {
            msg.channel.send(JSON.stringify(data))
          })
        }
        if(command === 'fakenews') {
          let message = await this.get_fake_crypto_news()
          msg.channel.send(message)
        }
      })
    }
}
export default DiscordBot