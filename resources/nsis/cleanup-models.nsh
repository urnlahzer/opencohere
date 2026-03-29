!macro customUnInstall
  ${ifNot} ${isUpdated}
    StrCpy $0 "$PROFILE\.cache\opencohere\models"
    IfFileExists "$0\*.*" 0 +3
      RMDir /r "$0"
      DetailPrint "Removed OpenCohere cached models"
    StrCpy $1 "$PROFILE\.cache\opencohere"
    RMDir "$1"
  ${endIf}
!macroend
