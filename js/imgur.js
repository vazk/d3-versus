

imgurcache = new Array();
var Imgur = {
  
  imgurls: [],

  fetch: function(num, onComplete) {
    var self=this;
    self.total=num;
    self.done=0;
    self.failures=0;
    self.start=+new Date;

    for (var x = 0; x < num; x++) {
      self.hunt(function(id) {
        self.done++;
        var imgurl = "http://i.imgur.com/" + id + "s.png";
        self.imgurls.push(imgurl);
        self.update();
        if(self.imgurls.length == num) {
          onComplete();
        }
      });
    }
  },

  update: function() {
    var interval=new Date-this.start;
    function speed(v) { return (~~(v/interval*1e5))/100; }
  },
  
  hunt: function(cb) {
    var self=this,
      id = self.random(5),
      img = new Image;
        self.update();
        img.src = "http://i.imgur.com/"+id+"s.png";
        img.onload = function() {
          if ((img.width==198 && img.height==160) || (img.width==161 && img.height==81)) {
            // assume this is an imgur error image, and retry.
            fail();
          } else {
            cb(id);
          }
        }
        img.onerror = fail; // no escape.
    function fail() {
      self.failures++;
      self.update();
      self.hunt(cb);
    }
  },
  random: function(len) {
    var text = new Array();
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i=0; i < len; i++) {
      imgurchar = possible.charAt(Math.floor(Math.random() * possible.length));
      if (text.indexOf(imgurchar) == -1) {
        text.push(imgurchar);
      } else {
        i--;
      }
    }
    text = text.join('');
    if (imgurcache.indexOf(text) == -1) {
      imgurcache.push(text);
      return text;
    } else {
      self.random(5);
      return false;
    }
  }
}
