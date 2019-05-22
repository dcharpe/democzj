import mongoose, { connect, connection } from 'mongoose';
connect('mongodb://localhost/carzam', { useNewUrlParser: true });

var db = connection;

db.on('error', console.error.bind(console, 'Connection Error : '));
db.once('open', function(){
  console.log('Connection ok!');
});

export default mongoose;