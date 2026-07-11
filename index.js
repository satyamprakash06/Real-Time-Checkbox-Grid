import http from 'node:http';
import path from 'node:path';


import express from 'express';
import { Server, Socket} from 'socket.io'
import { publisher, subscriber } from './radis-connection.js';


//in mermory state
const CHECKBOX_SIZE = 200;
const state = {
  checkboxs: new Array(CHECKBOX_SIZE).fill(false)
};


async function main() {
  const PORT = process.env.PORT ?? 8000;

  const app = express()
  // express is a handler function: which handle all my routes
  const server = http.createServer(app);

  const io = new Server();
   io.attach(server);

  await subscriber.subscribe('internal-server:checkbox:change');
   subscriber.on('message', (channel, message) => {
          if(channel === 'internal-server:checkbox:change'){
            const {index, isChecked} = JSON.parse(message);
            state.checkboxs[index] = isChecked;
            io.emit('server:checkbox:change', {index, isChecked});
          }
        })
  

//    socket IO handler
  io.on('connection', (socket)=>{
    console.log(`socket connected`, {id : socket.id});

    socket.on('client:checkbox:change', (data)=>{
        console.log(`[Socket :${socket.id}]:client:checkbox:change`, data)
        // io.emit('server:checkbox:change', data);
        // state.checkboxs[data.index] = data.isChecked;

        // publish to redis channel
        publisher.publish('internal-server:checkbox:change', JSON.stringify(data));
        
      
      });
  });

//    for express part
 app.use(express.static(path.resolve('./public')));
 app.get('/health', (req, res)=>{
    res.json({healthy: true});
 })

 app.get('/checkboxes', (req, res)=>{
    res.json({ checkboxes: state.checkboxs });
 });

  server.listen(PORT, ()=>{
    console.log(`server is running on http://localhost:${PORT}`)
  })
}



main().catch((err) => {
  console.error(err);
  process.exit(1);
});