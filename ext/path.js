// implements https://github.com/telehash/telehash.org/blob/v3/v3/channels/path.md
exports.name = 'path';

exports.mesh = function(mesh, cbExt)
{
  var ext = {open:{}};

  // path sync requests
  ext.open.path = function(args, open, cbOpen){
    var link = this;
    var did = [];
    function pong(pipe)
    {
      if(did.indexOf(pipe) >= 0) return;
      did.push(pipe);
      var json = {c:open.json.c};
      if(pipe.path) json.path = pipe.path;
      link.x.send({json:json},pipe);
    }
    // go through all the pipes we have already and send a response
    link.pipes.forEach(pong);
    // add any of the included paths, and send to them too
    if(Array.isArray(open.json.paths)) open.json.paths.forEach(function(path){
      link.addPath(path,pong);
    });
  }

  ext.link = function(link, cbLink)
  {
    /** force a path sync to confirm connectivity and record latency for paths
     * @memberOf TLink
     * @param {function} done - called when/if the first 'pong' is received, receives status and latency as arguments
     */
    link.ping = function(done)
    {
      if(typeof done != 'function') done = function(){};
      if(link.down) return done(link.down);
      var json = {type:'path'};
      json.paths = mesh.paths();
      var channel = link.x.channel({json:json});
      var start = Date.now();
      channel.receiving = function(err, packet, cbChan)
      {
        // process any responses
        if(packet)
        {
          mesh.log.debug('path response, TODO get public udp paths',packet.json);
        }
        // only callback once w/ status and latency
        if(done) done(err, Date.now() - start);
        done = false;
        cbChan();
      }
      mesh.log.debug('sending path ping to',link.hashname,json.paths);
      channel.send({json:json});
    }

    // auto-ping on first status
    link.on('status',link.ping);

    cbLink();
  }

  cbExt(undefined, ext);
}
