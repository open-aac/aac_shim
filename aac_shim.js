var aac_shim;
(function() {
  var aac = window.parent;
  if(!window.parent || window.parent == window) {
    console.log('Parent window not found, AAC Shim will not be running for this session.')
    aac = null;
  }
  var session_id = (new Date()).getTime() + "_" + Math.random();
  var post_message = function(obj, callback) {
    if(!aac) { if(callback) { callback({error: 'not initialized'}); } return false; }
    var callback_id = (new Date()).getTime() + "_" + Math.random();
    obj.callback_id = callback_id;
    obj.aac_shim = true;
    obj.session_id = session_id;
    if(callback) {
      post_message.callbacks = post_message.callbacks || {};
      post_message.callbacks[callback_id] = callback;
      callback.persistent = !!obj.persistent_callback;
      delete obj.persistent_callback;
      setTimeout(function() {
        if(post_message.callbacks[callback_id] && !post_message.callbacks[callback_id].responded && !post_message.callbacks[callback_id].persistent) {
          callback({error: 'no response within expected time window'});
        }
      }, 5 * 1000);
      callback.timeout_id = setTimeout(function() {
        if(post_message.callbacks[callback_id] && !post_message.callbacks[callback_id].persistent) {
          clear_callbacks([callback_id]);
        }
      }, 5 * 60 * 1000);
    }
    aac.postMessage(obj, '*');
    return callback_id;
  };
  var clear_callbacks = function(ids) {
    for(var idx = 0; idx < ids.length; idx++) {
      var id = ids[idx];
      if(id && post_message.callbacks[id]) {
        clearTimeout(post_message.callbacks[id].timeout_id)
        delete post_message.callbacks[id];
      }
    }
  };
  window.addEventListener('message', function(event) {
    if(event.data && event.data.aac_shim) {
      var callback = post_message.callbacks[event.data.callback_id];
      if(callback) {
        callback.responded = true;
        if(!callback.persistent) {
          clear_callbacks([event.data.callback_id]);
        }
        delete event.data['callback_id'];
        delete event.data['aac_shim'];
        callback(event.data);
      }
    }
  });
  aac_shim = {
    map_to_mouse_events: function(cursor) {
      aac_shim.cursor = cursor;
      aac_shim.listen(function(event) {
        var x = Math.round(event.x_percent * window.innerWidth);
        var y = Math.round(event.y_percent * window.innerHeight);
        var cursor_left = aac_shim.cursor && aac_shim.cursor.style.left;
        if(aac_shim.cursor) { aac_shim.cursor.style.left = '-1000px'; }
        var elem = document.elementFromPoint(x, y);
        if(aac_shim.cursor) { aac_shim.cursor.style.left = cursor_left; }
        if(event.type == 'gazedwell' || event.type == 'click' || event.type == 'touch' || event.type == 'scanselect') {
          elem.dispatchEvent(new CustomEvent(
            'click',
            {
              detail: {
                from_aac: true,
                select_type: event.type,
                x: x,
                y: y
              },
              bubbles: true,
              cancelable: true
            }
          ));
        } else if(event.type == 'gazelinger' || event.type == 'mousemove' || event.type == 'scanover') {
          elem.dispatchEvent(new CustomEvent(
            'mousemove',
            {
              detail: {
                from_aac: true,
                hover_type: event.type,
                x: x,
                y: y
              },
              bubbles: true,
              cancelable: true
            }
          ));
        }
      });
    },
    listen: function(callback) {
      var original_callback = callback;
      callback = function(res) {
        if(res.listen_id) {
          aac_shim.listen_ids = aac_shim.listen_ids || [];
          aac_shim.listen_ids.push(res.listen_id);
        }
        if(original_callback) { original_callback(res); }
      };
      return post_message({action: 'listen', persistent_callback: true}, callback);
    },
    stop_listening: function(listen_id, callback) {
      listen_id = listen_id || 'all';
      return post_message({action: 'stop_listening', listen_id: listen_id}, callback);
    },
    status: function(callback) {
      return post_message({action: 'status'}, callback);
    },
    add_text: function(text, image_url, callback) {
      return post_message({action: 'add_text', text: text.toString(), image_url: image_url.toString()}, callback);
    },
    update_manifest: function(manifest_data, callback) {
      // note that object URLs are never updated once stored (though html and script URLs are), 
      // and that files removed from the manifest currently aren't deleted from storage, so 
      // if you change object URLs often you could potentially fill up a user's device. We hope
      // to fix this in a future release, but feel free to remind us if it's an issue for you.
      var manifest = {};
      // { html_url: '', script_url: '', state: {key: 'values', only: 'folks'}, objects: [{url: '', type: 'image'}] }
      manifest.html_url = manifest_data.html_url.toString();
      manifest.script_url = manifest_data.script_url.toString();
      manifest.objects = [];
      for(var idx = 0; idx < manifest_data.objects.length; idx++) {
        var obj = manifest_data.objects[idx];
        if(obj) {
          manifest.objects.push({
            url: obj.url.toString(),
            type: obj.type.toString()
          });
        }
      }
      if(manifest_data.state) {
        manifest.state = {};
        for(var idx in manifest_data.state) {
          if(manifest_data.state[idx]) {
            manifest.state[idx.toString()] = manifest_data.state[idx].toString();
          }
        }
      }
      return post_message({action: 'update_manifest', manifest: manifest}, callback);
    },
    retrieve_object: function(url, callback) {
      return post_message({action: 'retrieve_object', url: id.toString()}, callback);
    },
    add_target: function(target_data, callback) {
      var target = {};
      var parse_value = function(str, horizontal) {
        var val = parseFloat(str);
        if(!str.toString().match(/\%/)) {
          if(horizontal) {
            val = val / window.innerWidth;
          } else {
            val = val / window.innerHeight;
          }
        } else {
          val = val / 100;
        }
        return val;
      };
      target.id = (target_data.id || ((new Date()).getTime() + "_" + Math.random())).toString();
      target.left_percent = parse_value(target_data.left, true);
      target.top_percent = parse_value(target_data.top);
      target.width_percent = parse_value(target_data.width, true);
      target.height_percent = parse_value(target_data.height);
      target.prompt = target_data.prompt.toString();
      aac_shim.targets = aac_shim.targets || {};
      var res = post_message({action: 'add_target', target: target, persistent_callback: true}, callback);
      if(res) {
        aac_shim.targets[target.id] = res;
      }
      return res ? target.id : res;
      // {left: 0, top: 0, width: 0, height: 0, prompt: "hello"}
    },
    clear_target: function(id, callback) {
      if(aac_shim.targets && aac_shim.targets[id]) {
        var callback_id = aac_shim.targets[id];
        var original_callback = callback;
        callback = function(res) {
          clear_callbacks[callback_id];
          if(original_callback) { original_callback(res); }
        };
      }
      return post_message({action: 'clear_target', id: id.toString()}, callback);
    },
    clear_targets: function(callback) {
      var original_callback = callback;
      callback = function(res) {
        var deletes = [];
        for(var idx in aac_shim.targets) {
          if(aac_shim.targets[idx]) {
            deletes.push(aac_shim.targets[idx]);
          }
        }
        clear_callbacks(deletes);
        if(original_callback) { original_callback(res); }
      };
      return post_message({action : 'clear_targets'}, callback);
    },
  };
})();