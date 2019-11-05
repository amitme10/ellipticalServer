var http = require('http');

var express = require('express');
var bodyParser = require('body-parser');

let app = express();

var firebase = require('firebase');
app.use(bodyParser.json()); //need to parse HTTP request body


let config = {
  apiKey: 'AIzaSyAgwUK7-jO5Lbln1COw39gG_Lxhka3NWLk',
  authDomain: 'helpital-1278a.firebaseapp.com',
  databaseURL: 'https://helpital-1278a.firebaseio.com',
  projectId: 'helpital-1278a',
  storageBucket: 'helpital-1278a.appspot.com',
  messagingSenderId: '260720885799',
};
firebase.initializeApp(config);


function reverse(stream) {
  let revStream = [];
  while(stream.length>0) revStream.push(stream.pop());
  return revStream;
}

function addHashtag(word) {
  firebase.database().ref('/hashtagsTop/').child(word).transaction(function (count) {
    return (count || 0) +1 } )
}

function crossItems() {
  firebase.database().ref('/items/').on("value", function(snapshot) {
    snapshot.forEach(v =>
        v.val().caption.split(" ").forEach(word =>
            word.charAt(0) === '#' ? addHashtag(word.slice(1)) : word.trim()
        ));
  }
  )
}

app.get('/orderPostsByDate', function (req, res) {
  console.log("OHYea");

  firebase.database().ref('/items/').orderByChild('timestamp').on('value', function(sn) {
    this.data = [];
    this.ids = [];
    sn.forEach(function (child) {
      this.data.push({data: child.val(), ids: child.key});
      this.ids.push(child.key);
    }.bind(this));
  });
   res.send(this.data);
});

app.get('/', function (req, res) {
  const query = firebase.database().ref('/hashtagsTop').orderByChild('count');
  let stream = [];
  let i = 0;
  query.once('value', function (snapshot) {
    snapshot.forEach(function (childSnapshot) {
      var childKey = childSnapshot.key;
      var childData = childSnapshot.val();
      stream.push(childData);
    })
  }).then(() => res.send(reverse(stream)));

  // after 3 days from the last lastUpdate we will  change the counter to 0
  firebase.database().ref('/hashtagsTop/').orderByChild('lastUpdate').on("value",  snapshot => {
    Object.values(snapshot.val()).map(counter => console.log(counter.lastUpdate))
  })

});

app.post('/addNewPost/',function (req,res) {
  console.log("i got here a new post request");
  console.log(req.body);
  firebase.database().ref('/items/').push(req.body);
});

app.post('/addLikedBy/',function(req,res) {
  console.log("just got ");
  console.log(req.body);
  let imageID = req.body['imageID'];
  let username = req.body['username'];
  let liked = req.body['value'];
  var ref = firebase.database().ref('/items/').child(imageID);
  if(liked)
    ref.child('counts').transaction(function (curr) {
      return (curr || 0) + 1;
    });
  else
    ref.child('counts').transaction(function (curr) {
      return (curr || 0) - 1;
    });

  ref.child('likedBy').child(username).set(liked);
});

var server = app.listen(8080, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log("Example app listening at http://%s:%s", host, port);

  crossItems();
});