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

// //Fetch instances
// app.get('/', function (req, res) {
//   // var userReference = firebase.database().ref("/Users/");
//   //
//   // //Attach an asynchronous callback to read the data
//   // userReference.on("value",
//   //     function(snapshot) {
//   //       console.log(snapshot.val());
//   //       res.json(snapshot.val());
//   //       userReference.off("value");
//   //     },
//   //     function (errorObject) {
//   //       console.log("The read failed: " + errorObject.code);
//   //       res.send("The read failed: " + errorObject.code);
//   //     });
// });

//Create new instance
// app.put('/', function (req, res) {
//
//   console.log("HTTP Put Request");
//
//   var userName = req.body.UserName;
//   var name = req.body.Name;
//   var age = req.body.Age;
//
//   var referencePath = '/Users/'+userName+'/';
//   var userReference = firebase.database().ref(referencePath);
//   userReference.set({Name: name, Age: age},
//       function(error) {
//         if (error) {
//           res.send("Data could not be saved." + error);
//         }
//         else {
//           res.send("Data saved successfully.");
//         }
//       });
// });
//
// //Update existing instance
// app.post('/', function (req, res) {
//
//   console.log("HTTP POST Request");
//
//   var userName = req.body.UserName;
//   var name = req.body.Name;
//   var age = req.body.Age;
//
//   var referencePath = '/Users/'+userName+'/';
//   var userReference = firebase.database().ref(referencePath);
//   userReference.update({Name: name, Age: age},
//       function(error) {
//         if (error) {
//           res.send("Data could not be updated." + error);
//         }
//         else {
//           res.send("Data updated successfully.");
//         }
//       });
// });
//
// //Delete an instance
// app.delete('/', function (req, res) {
//
//   console.log("HTTP DELETE Request");
//   //todo
// });

function showHashtags(){
  const query = firebase.database().ref('/hashtagsTop').orderByChild('count');
  let stream = [];
  let i = 0;
  query.once('value', function (snapshot) {
    snapshot.forEach(function (childSnapshot) {
      var childKey = childSnapshot.key;
      var childData = childSnapshot.val();
      stream.push(childData);
    })
  }).then(() => reverse(stream));

};

function reverse(stream) {
  let revStream = [];
  while(stream.length>0) revStream.push(stream.pop());
  return revStream;
    //console.log(stream.pop().count);
}

function funcV(word) {
  let count = 0;
  firebase.database().
  ref('/hashtagsTop/'+word.substr(1)).once('value').
  then(snp => {
    if( snp.val().count >= 0)
    {
      //console.log("original " + snp.val().count);
      count = snp.val().count+1;
      //console.log("changed to " + count);
    }
  }
  ).finally(() => firebase.database().ref('/hashtagsTop/'+word.substr(1)).update({
      word: ""+word,
      count: count,
      lastUpdate: Date().toString()
  }));
}

firebase.database().ref('/items').orderByChild('date').startAt(Date()).on(
  "child_added", function (snapshot) {
    snapshot.val().caption.split(" ").forEach(word => word.charAt(0) === '#' ?
        funcV(word) : word.trim()
      );
    }
);

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
  //res.send({data: this.data, ids: this.ids});
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
    // }).then(() => reverse(stream));
  }).then(() => res.send(reverse(stream)));
  //res.send('hello friendsssss');

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

app.post('/removeLikedBy/',function(req,res) {

});

var server = app.listen(8080, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log("Example app listening at http://%s:%s", host, port);

});