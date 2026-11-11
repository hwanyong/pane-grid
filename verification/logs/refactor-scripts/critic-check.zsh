#!/bin/zsh
# 완결성 비평: 행마다 out/<묶음>/{base,tgt}/<id>.txt 가 있고 비지 않았는지 본다. 읽기만 한다.
cd /Users/uhd/.claude/jobs/2d2d4469/tmp/out || exit 1
chk() {
  local grp=$1; shift
  local i t f
  for i in "$@"; do
    for t in base tgt; do
      f=$grp/$t/$i.txt
      if [[ ! -f $f ]]; then echo "NOFILE $f"
      elif [[ ! -s $f ]]; then echo "EMPTY $f"; fi
    done
  done
}
chk AB T{1..34} T36 T37 T38 T39 T4{0..9} T5{0..6} T94 T95 T96 T98 T99 T112 T113
chk C1 T35 T100 T57{a..k} T58 T114 T116 T116i
chk C2 T59a T59b T59c T60 T61 T62 T63 T64{a..d} T65{a..e} T101 T102
chk D T66 T67 T68 T69 T70 T71{a..d} T7{2..9} T80 T103 T104 T105 T115 T117a T117b T117b-rel T117d T117e
chk E T8{1..9} T9{0..2} T106 T11{8,9} T12{0..7}
chk F T107 T108 T108p T109 T110 T111 F71 F71s F71f F71m
chk R R-F47 R-F51 R-F54 R-F63
chk X X{1..3} X4a X4b X4c X{5..19} X2{1..9} X30
echo DONE
