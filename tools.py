import numpy as np
import glob
import datetime
import dateu
import os

def get_files(year=None,pwd='./'):

  if year:
    try:
      len(year)
    except: year=[year,year]

    years='[%d-%d]'%(year[0]-1,year[1]+1)
    files=glob.glob(pwd+'figures/store/ready/%s/*[A,F].svg'%years)
  else:
    files=glob.glob(pwd+'figures/store/ready/*[A,F].svg')

  files.sort()
  times=np.zeros(len(files),datetime.datetime)
  for i,f in enumerate(files):
    d=dateu.parse_date(os.path.basename(f)[:8])
    h=int(os.path.basename(f)[9:11])
    times[i]=d+datetime.timedelta(hours=h)

  return files,times

def get_dates(date0,date1,pwd='./'):
  if date0+date1=='00': return get_files(pwd=pwd)[1]
  elif date0+date1=='01':
    tmp=get_files(pwd=pwd)[1]
    return np.asarray((tmp[0],tmp[-1]))

  date0=dateu.parse_date(date0)
  date1=dateu.parse_date(date1)

  #files,times=get_files([date0.year,date1.year])
  files,times=get_files(pwd=pwd)
  i0=np.where(times>=date0)[0][0]
  i1=np.where(times<=date1)[0][-1]
  return times[i0:i1+1]

def find_nearest(date=None,add=0,pwd='./'):
  if not date:
    date=datetime.datetime.utcnow()
  else:
    date=dateu.parse_date(date)

  #files,times=get_files(date.year)
  files,times=get_files(pwd=pwd)
  d=np.abs(times-date)
  i=np.where(d==d.min())[0][0]

  i=i+add
  if i<0: return {}

  try:
    f=files[i]
  except IndexError:
    return {}

  tmp=os.path.basename(f).split('_')
  start=tmp[2]
  Type=tmp[-1][0]
  return dict(fname=f,time=times[i],run=start,Type=Type)



