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

@app.route('/time/load/<string:date0>/<string:date1>/<string:dt>')
@app.route('/time/load/<string:date0>/<string:date1>',defaults={'dt':'0'})
def load_time(date0,date1,dt):

  import glob
  import dateu
  import numpy as np
  import datetime

  files=glob.glob(os.path.join(pwd,'figures/store2/????/????????/salt/salt*cl0_600dpi.png'))
  files.sort()
  t=[dateu.parse_date(i[-27:-17]) for i in files]
  t=np.asarray(t)

  if date0=='0': date0=datetime.datetime(1990,1,1)
  else: date0=dateu.parse_date(date0)
  if date1=='0': date1=datetime.datetime(2100,1,1)
  else: date1=dateu.parse_date(date1)

  cond=(t>=date0)&(t<=date1)
  t=t[cond]

  # deal with dt:
  dt=int(dt);
  if dt>0:
      import numpy as np
      hh=np.asarray([i.hour for i in t])
      cond=hh%dt==0
      t=t[cond]

  return jsonify([i.strftime('%Y%m%d%H') for i in t])


@app.route('/field_buoys/load/<string:date>')
def load_field_buoys(date):
    import numpy as np
    destDir='figures/store2'
    sdate2=date
    sdate=date[:-2]
    year=date[:4]

    dname='buoys'

    dest=os.path.join(destDir,'%s/%s/%s'%(year,sdate,dname))
    fname='%s_%s.npz'%(dname,sdate2)
    f=os.path.join(dest,fname)
    if os.path.isfile(f):
      a=np.load(f)
      res=dict(temp=a['temp'].tolist(),salt=a['salt'].tolist(),speed=a['speed'].tolist())
      res['with_data']=a['with_data'].tolist()

      for vname in ['temp','salt','speed']:
        for layer in range(3):
          k=vname+'_colors_%d'%layer
          try:
            res[k]=a[k].tolist()
          except: pass

      # also add other info (coords, discontinued, with_data):
      f2=os.path.join(destDir,'buoys_coords.npz')
      a2=np.load(f2)
      res['discontinued']=a2['discontinued'].tolist()
      res['x']=a2['x'].tolist()
      res['y']=a2['y'].tolist()
      res['lon']=a2['lon'].tolist()
      res['lat']=a2['lat'].tolist()
      res['name']=a2['name'].tolist()
      res['is_tabs']=(a2['type']=='TABS').tolist()

      return jsonify((res,0))
    else:
      return jsonify(('',1))


@app.route('/field/load/<string:date>/<string:vname>/<int:layer>/<int:dpi>')
def load_field(date,vname,layer,dpi):
    destDir='figures/store2'
    #sdate=date.strftime('%Y%m%d')
    #sdate2=date.strftime('%Y%m%d%H')
    sdate2=date
    sdate=date[:-2]
    year=date[:4]
    dest=os.path.join(destDir,'%s/%s/%s'%(year,sdate,vname))
    fname='%s_%s_%s_cl%d_%ddpi.png'%(vname,sdate2,'?',layer,dpi)
    f=os.path.join(dest,fname)
    import glob
    f=glob.glob(f)
    if len(f):
      f.sort()
      a=open(f[-1]) # # H then F
      return jsonify(('data:image/png;base64, '+a.read().encode("base64").replace("\n", ""),0))
    else: return jsonify(('',1)) # status 1: error

@app.route('/vfield/loadxy/<string:type>/<string:vname>')
def load_vfieldxy(type,vname):
    if   (type,vname)==('model','currents'): f='uv_coords.npz'
    elif (type,vname)==('model','wind'):     f='wind_coords.npz'
    elif (type,vname)==('radar','currents'): f='radar_coords.npz'
    elif (type,vname)==('buoys','currents'): f='buoys_coords.npz'
    elif (type,vname)==('buoys','wind'):     f='buoys_coords.npz'

    destDir='figures/store2'
    f=os.path.join(destDir,f)
    import numpy as np
    a=np.load(f)
    if (type)=='buoys':
      xi,eta=a['x'].size,1
      # also provide name and type:
      res=dict(xi=xi,eta=eta,x=a['x'].tolist(),y=a['y'].tolist(),
               name=a['name'].tolist(),type=a['type'].tolist())
    else:
      xi,eta=a['x'].shape
      res=dict(xi=xi,eta=eta,x=np.ravel(a['x']).tolist(),y=np.ravel(a['y']).tolist())

    return jsonify((res,0))


@app.route('/vfield/load/<string:type>/<string:vname>/<string:date>')
def load_vfield(type,vname,date):
    destDir='figures/store2'
    sdate2=date
    sdate=date[:-2]
    year=date[:4]

    if   (type,vname)==('model','currents'): dname='uv'
    elif (type,vname)==('model','wind'):     dname='wind'
    elif (type,vname)==('radar','currents'): dname='radar'
    elif (type,vname)==('buoys','currents'): dname='buoys'
    elif (type,vname)==('buoys','wind'): dname='buoys'

    dest=os.path.join(destDir,'%s/%s/%s'%(year,sdate,dname))

    if (type,vname)==('model','currents'):
      fname='%s_%s_%s.npz'%(dname,sdate2,'?')
    elif (type,vname)==('model','wind'):
      fname='%s_%s_%s.npz'%(dname,sdate2,'?')
    else:#if type=='radar':
      fname='%s_%s.npz'%(dname,sdate2)

    if type=='buoys':
      if vname=='wind': uname,vname='u_wind','v_wind'
      elif vname=='currents': uname,vname='u_curr','v_curr'
    else:
     uname,vname='u','v'

    f=os.path.join(dest,fname)
    import glob
    f=glob.glob(f)
    print dest, fname, f
    if len(f):
      f.sort()
      import numpy as np
      a=np.load(f[-1]) # # H then F
#      xi,eta=a['x'].shape
#      res=dict(xi=xi,eta=eta,x=np.ravel(a['x']).tolist(),y=np.ravel(a['y']).tolist(),u=np.ravel(a['u']).tolist(),v=np.ravel(a['v']).tolist())
      res=dict(u=np.ravel(a[uname]).tolist(),v=np.ravel(a[vname]).tolist())
      return jsonify((res,0))

    else: return jsonify(('',1)) # status 1: error


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
  res=explore.get_location(d=0)
  return jsonify(res)

if __name__ == "__main__":
    handler = RotatingFileHandler('/tmp/foo.log', maxBytes=10000, backupCount=1)
    handler.setLevel(logging.INFO)
    app.logger.addHandler(handler)
    app.run()#debug=True)

