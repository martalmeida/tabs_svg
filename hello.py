#!/usr/bin/python3

import os
import logging
from logging.handlers import RotatingFileHandler

from flask import Flask
from flask import redirect, url_for, jsonify, make_response

#app = Flask(__name__)
app = Flask(__name__,static_url_path='')

#pwd=url_for('.index')[1:]
pwd=os.path.dirname(__file__)+'/'
pwd='./' # local

#@app.route("/")
#def hello():
#    return "Hello World...!"

@app.route('/')
def index():
  return app.send_static_file('index.html')
  #return redirect(url_for('static', filename='tabs.html'))


@app.route('/data/svg/datetimes/<string:date0>/<string:date1>/<string:dt>')
@app.route('/data/svg/datetimes/<string:date0>/<string:date1>',defaults={'dt':'0'})
def svg_dates(date0,date1,dt):
#  try:
  if 1:
    import tools
    t=tools.get_dates(date0,date1,pwd)

    # deal with dt:
    dt=int(dt);
    if dt>0:
      import numpy as np
      hh=np.asarray([i.hour for i in t])
      cond=hh%dt==0
      t=t[cond]

    return jsonify(t.tolist())
#  except Exception as e:
#    msg='cannot find available dates'
#    app.logger.error(msg)
#    app.logger.debug(str(e))
#    return make_response(msg, 404)


@app.route('/data/svg/datetime/<string:datet>/<string:move>/<int:add>')
def svg_frame(datet,move,add):
  try:
      import tools
      if move=='more': add=+add
      else: add=-add
      if datet=='nearest':
         o=tools.find_nearest(date=None,add=add,pwd=pwd)
         o['data']=open(o['fname']).read()
         return jsonify(o)
      else:
         o=tools.find_nearest(date=datet,add=add,pwd=pwd)
         o['data']=open(o['fname']).read()
         return jsonify(o)

  except Exception as e:
        msg = 'cannot access svg file for date %s'%datet
        app.logger.error(msg)
        app.logger.debug(str(e))
        return make_response(msg, 404)

@app.route('/data/svg/colorbar/<string:date>')
def svg_colorbars(date):
  try:
    fname=pwd+'/figures/store/colorbars.svg'
    o={}
    o['data']=open(fname).read()
    return jsonify(o)
  except Exception as e:
    msg = 'cannot access colorbar for date %s'%date
    app.logger.error(msg)
    app.logger.debug(str(e))
    return make_response(msg, 404)

@app.route('/data/river/<string:date0>/<string:date1>/<int:nd>')
def get_river(date0,date1,nd):
  import mississippi
  import dateu
  date0=dateu.parse_date(date0)
  date1=dateu.parse_date(date1)
  t,v=mississippi.load(date0,date1)
  if nd>1:
    t,v=mississippi.ndavg(t,v,nd)

  v=(v/100).astype('i')
  tnum=[i.toordinal()-t[0].toordinal() for i in t]
  t=[i.isoformat() for i in t]
  out=dict(time=t,tnum=tnum,v=v.tolist())
  return jsonify(out)

@app.route('/data/svg/river/<int:year>/<int:month>')
def svg_river(year,month):
  try:
    f=pwd+'figures/store/mississippi_%d_%02d.svg'%(year,month)
    o={}
    o['data']=open(f).read()
    return jsonify(o)
  except:
    msg = 'cannot access river for date %s'%date
    app.logger.error(msg)
    app.logger.debug(str(e))
    return make_response(msg, 404)

'''
#
#from flask.ext.cache import Cache
from flask_cache import Cache
cache = Cache(app)#,config={'CACHE_TYPE': 'simple'})

#def cache_key(*a,**b):
#    return 'mmm'
#    print '==================='+request.url
#    return request.url
#
#@cache.cached(timeout=500, key_prefix=cache_key)


def make_key ():
  """Make a key that includes GET parameters."""
  return request.full_path

@app.route('/plot',methods=['POST','GET'])
@cache.cached(key_prefix=make_key)
'''

@app.route('/plot',methods=['POST','GET'])
def plot():
  from flask import request
  print request.args
#  print '-----------'
#  #print  request.args['x']
#  #print '-----------'
#  print request.args.getlist('x[]')
#  return str(request.args.getlist('x'))
#  return request.args['x[]']
#  print '-----------'
  import explore
  return jsonify(explore.slice(request.args))


#  return  explore.slice(request.args)
#  return 'hello mm'
#   if request.method == 'POST':
#      result = request.form
#      return render_template("result.html",result = result)
#
#  print '================='
#  print request.form['city']
#  return str(request.__dict__)

@app.route('/cmaps')
def get_cmaps():
  import explore
  res=explore.cmap_names()
  return jsonify(res)


@app.route('/variables')
def vars_info():
  import explore
  res=explore.vars_info()
  return jsonify(res)

@app.route('/times')
def get_times():
  import explore
  res=explore.get_times()
  return jsonify(res.tolist())

@app.route('/location')
def get_location():
  import explore
  res=explore.get_location()
  return jsonify(res)

if __name__ == "__main__":
    handler = RotatingFileHandler('/tmp/foo.log', maxBytes=10000, backupCount=1)
    handler.setLevel(logging.INFO)
    app.logger.addHandler(handler)
    app.run()#debug=True)

