def clampCount(n):
  try: n=float(n)
  except: return 0
  if n!=n or n<0: return 0
  if n>10: return 10
  return int(n)
def addWithinTen(a,b): return clampCount(clampCount(a)+clampCount(b))
def subWithinTen(a,b):
  a,b=clampCount(a),clampCount(b)
  return a-b if a>=b else a
def makeTenNeed(start): return 10-clampCount(start)

def test_all():
  assert clampCount(-1)==0 and clampCount(11)==10 and clampCount(0)==0
  assert addWithinTen(7,3)==10
  assert subWithinTen(9,4)==5
  assert makeTenNeed(0)==10 and makeTenNeed(5)==5
  assert subWithinTen(3,5)==3

if __name__=='__main__':
  test_all(); print('OK')
