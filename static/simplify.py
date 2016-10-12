f='salt_temp_speed_bathy.svg'

L=[]
for l in open(f):
  if l.startswith('M'):
    L+=['M %.2f %.2f\n'%(float(l.split()[1]),float(l.split()[2]))]
  elif l.startswith('L'):
    L+=['L %.2f %.2f\n'%(float(l.split()[1]),float(l.split()[2]))]
  else:
    L+=[l]

open('new.svg','w').writelines(L)
